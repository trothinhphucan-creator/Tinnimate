# Admin Dashboard Redesign — Design Proposal

**Status:** 📐 DESIGN (not yet implemented — awaiting approval)
**Date:** 2026-04-17
**Scope:** Redesign `/admin/*` to consolidate CRM, payments, promotions, tier/password management, activity reporting.
**Principle:** Reuse existing Supabase tables. No new tables unless required. YAGNI + KISS.

---

## 1. Current State (what already exists)

**Pages** (`web/app/(admin)/admin/`):
`config` · `pricing` · `users` · `models` · `prompts` · `knowledge` · `examples` · `training` · `video-creator`

**APIs** (`web/app/api/admin/`):
`config` · `pricing` (in config) · `users` (GET/PUT tier+admin) · `models` · `prompts` · `knowledge` · `examples` · `training` · `usage` · `mobile-config` · `mobile-analytics` · `notifications` · `video-bg-prompt`

**Dashboard `page.tsx`** already shows: cost, quicklinks, prompt versions, mobile analytics, mobile remote config, push notifications.

**Gaps (what's missing vs request):**
- No **promotions / coupons / offers** (ưu đãi)
- No **admin password reset** for users
- No **detailed activity reports** (retention, cohorts, churn)
- No **unified CRM view** per user (profile + assessments + sessions + subscription + convos in one place)
- Payment gateway keys stored in DB (`pricing_config`) — **security concern** (see §7)
- No **audit log** of admin actions
- `users` table stats include `ultra` tier, but schema CHECK only allows `free|premium|pro` → **mismatch**

---

## 2. Information Architecture (proposed)

Three top-level groups in the sidebar:

```
📊 OPERATIONS
  ├─ Overview              /admin                   (existing, tightened)
  ├─ Activity Reports      /admin/reports           (NEW)
  └─ Audit Log             /admin/audit             (NEW)

👥 CRM
  ├─ Users (list)          /admin/users             (existing, expanded)
  ├─ User Detail           /admin/users/[id]        (NEW — deep dive)
  ├─ Conversations         /admin/conversations     (NEW — moderation)
  └─ Segments & Churn      /admin/segments          (NEW)

💰 MONETIZATION
  ├─ Plans & Pricing       /admin/pricing           (existing, cleaned)
  ├─ Promotions / Coupons  /admin/promotions        (NEW)
  ├─ Subscriptions         /admin/subscriptions     (NEW — list + refund actions)
  └─ Payment Orders        /admin/orders            (NEW — reconciliation)

⚙️ SYSTEM (collapsed, less frequent)
  └─ AI Config · Models · Prompts · Knowledge · Examples · Training · Mobile · Video
     (keep as-is, grouped under one collapsible "System" section)
```

**Rationale:** daily-use admin tasks (users, payments, reports) get priority; LLM/content-engineering tools move to a secondary group.

---

## 3. DB Reuse Map

Every new page maps to **existing** tables where possible.

| Page | Tables (read) | Tables (write) | New? |
|------|---------------|----------------|------|
| Overview | profiles, subscriptions, messages, daily_checkins, usage_logs | — | no |
| Activity Reports | profiles, daily_checkins, messages, therapy_sessions, assessments, mobile_sessions, screen_views | — | no |
| User Detail | profiles, tinnitus_profiles, subscriptions, assessments, audiograms, therapy_sessions, daily_checkins, conversations, journal_entries, payment_orders | profiles (tier, is_admin, admin_notes), auth.users (password reset via Supabase admin API) | no |
| Conversations | conversations, messages, profiles | conversations (soft-delete flag) | **minor** (add `deleted_at`) |
| Segments & Churn | profiles, daily_checkins, subscriptions, messages | — (read-only) | no |
| Promotions / Coupons | — | **promotions** (NEW) | ✅ 1 new |
| Subscriptions list | subscriptions, profiles | subscriptions (status override), Stripe API calls | no |
| Payment Orders | payment_orders, profiles | payment_orders (status override) | no |
| Audit Log | — | **admin_audit_log** (NEW) | ✅ 1 new |

**Only 2 new tables** + 1 optional column. Everything else reuses existing schema.

---

## 4. Schema Additions (proposed)

### 4.1 `promotions` table
```sql
CREATE TABLE promotions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  code text UNIQUE NOT NULL,                    -- redeem code e.g. "SUMMER30"
  kind text CHECK (kind IN ('percent','fixed','trial_extend','tier_grant')),
  value numeric,                                -- 30 = 30%, or VND amount, or extra days
  tier_grant text,                              -- for kind=tier_grant: 'premium'|'pro'|'ultra'
  applies_to_tiers text[],                      -- null = all plans
  max_uses int,                                 -- null = unlimited
  used_count int DEFAULT 0,
  starts_at timestamptz,
  ends_at timestamptz,
  is_active boolean DEFAULT true,
  notes text,
  created_by uuid REFERENCES auth.users,
  created_at timestamptz DEFAULT now()
);

CREATE TABLE promotion_redemptions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  promotion_id uuid REFERENCES promotions ON DELETE CASCADE,
  user_id uuid REFERENCES profiles ON DELETE CASCADE,
  order_id uuid REFERENCES payment_orders,
  redeemed_at timestamptz DEFAULT now(),
  UNIQUE (promotion_id, user_id)                -- 1 redemption per user per code
);
```

### 4.2 `admin_audit_log` table
```sql
CREATE TABLE admin_audit_log (
  id bigserial PRIMARY KEY,
  admin_id uuid REFERENCES auth.users,
  action text NOT NULL,              -- 'tier.change' | 'password.reset' | 'promo.create' | ...
  target_type text,                  -- 'user' | 'promotion' | 'subscription' | 'config'
  target_id text,
  diff jsonb,                        -- { before, after }
  ip text,
  user_agent text,
  created_at timestamptz DEFAULT now()
);
CREATE INDEX idx_audit_created ON admin_audit_log(created_at DESC);
CREATE INDEX idx_audit_admin ON admin_audit_log(admin_id, created_at DESC);
```

### 4.3 Minor fixes to existing schema
- `profiles.subscription_tier` CHECK: add `'ultra'` → `CHECK (tier IN ('free','premium','pro','ultra'))`
- `conversations`: add `deleted_at timestamptz` for soft-delete on moderation
- `admin_config.pricing_config`: **move secret keys out of DB** → keep only **public** config (plan names, prices, feature lists, Stripe price IDs). Secret keys → env vars only.

---

## 5. New / Updated API Routes

| Method · Route | Purpose |
|---|---|
| GET `/api/admin/reports/activity` | DAU/WAU/MAU, messages/day, check-ins/day, retention curves |
| GET `/api/admin/reports/revenue` | MRR, ARR, churn, LTV, cohort tables |
| GET `/api/admin/users/[id]` | Full user 360 (joins profile + subs + assessments + sessions + convos) |
| POST `/api/admin/users/[id]/reset-password` | Generate recovery link via Supabase admin API |
| POST `/api/admin/users/[id]/impersonate` | Generate magic-link for support (audit-logged) |
| GET/POST/PUT/DELETE `/api/admin/promotions` | CRUD coupons |
| GET `/api/admin/promotions/[id]/redemptions` | Who used this code |
| GET/PUT `/api/admin/subscriptions` | List subs; override status; issue refund (→ Stripe) |
| GET/PUT `/api/admin/orders` | Payment order reconciliation |
| GET `/api/admin/conversations` | Paginated convos + full-text search |
| DELETE `/api/admin/conversations/[id]` | Soft-delete (sets `deleted_at`) |
| GET `/api/admin/audit` | Filterable audit log |

**Auth:** All routes pass through `requireAdmin()` (exists). All writes emit an `admin_audit_log` row.

---

## 6. Key Screens — Wireframe Sketches

### 6.1 Overview (`/admin`) — refreshed
- KPI row: **MRR · Paying users · DAU · Messages today · Active subs · New signups (7d)**
- Revenue trend chart (30d)
- Activity sparkline (messages, check-ins, sessions) — 30d
- Recent signups table (last 10)
- Flagged items: failed payments, cancellation requests, new assessments with severe scores

### 6.2 User Detail (`/admin/users/[id]`) — **new, central to CRM**
Tabs within page:
1. **Profile** — edit name, email, tier, is_admin, admin_notes, **Reset Password**, **Impersonate** buttons
2. **Subscription** — current sub, history, Stripe customer link, **Cancel / Refund / Extend trial**
3. **Clinical** — tinnitus_profiles, audiograms, assessments timeline (THI/TFI/PHQ9/GAD7/ISI scores)
4. **Activity** — daily_checkins chart (mood/sleep/loudness/distress over time), therapy_sessions, streak
5. **Conversations** — last 20 convos, link to full-text read-only viewer
6. **Journal** — journal_entries (read-only)
7. **Timeline** — merged event log (sign-up, sub change, assessment, streak milestones)

### 6.3 Promotions (`/admin/promotions`)
- Table: code · kind · value · uses · status · expires
- Create modal: select kind (percent / fixed VND / extra trial days / grant tier), value, applies-to-plans, max uses, date range
- Row actions: deactivate, view redemptions
- Display **one-tap copy** for share URL `https://app/redeem/CODE`

### 6.4 Activity Reports (`/admin/reports`)
Three tabs:
1. **Engagement** — DAU/WAU/MAU line, retention heatmap (D1/D7/D30), activity by hour
2. **Clinical outcomes** — avg tinnitus_loudness over time, mood trend, assessment score distributions
3. **Funnel** — signup → profile complete → first message → first assessment → first payment

### 6.5 Subscriptions + Orders
- Subscriptions list: user · tier · status · MRR · renewal · actions (cancel, refund, extend)
- Orders list: order_id · user · amount · gateway · status · created_at
- Filter by status: pending/paid/failed/refunded
- Click row → Stripe/MoMo/VNPay raw payload (read-only)

---

## 7. Security & Ops Concerns (must address)

1. **🔒 Move gateway secrets out of DB.** `pricing_config.gateways.*.secret_key` leaks to any admin with read access. Keep in env/KMS; keep only **enabled** flag + **public** IDs in DB.
2. **🔒 Audit every sensitive admin write** (tier change, password reset, refund, impersonate) → `admin_audit_log`.
3. **🔒 Impersonation safety:** issue short-lived (≤15 min) magic link, tag session with `impersonated_by`, block write actions, banner in-app.
4. **🔒 Rate-limit admin APIs** (per-admin, separate from user RL).
5. **🔒 PII handling:** conversation/journal views should default to redacted; admin clicks "Show" to unmask (audit-logged).
6. **Data consistency:** fix `ultra` tier CHECK first, or moving users to `ultra` silently fails.
7. **Stripe webhook idempotency** already handled by `stripe_events` table (Sprint 4) — good.

---

## 8. Implementation Phases (proposed, if approved)

| Phase | Scope | Est. effort |
|---|---|---|
| **P0 — Fix first** | `ultra` tier CHECK; move gateway secrets to env; add `admin_audit_log` table + helper | S |
| **P1 — User Detail 360** | `/admin/users/[id]` with 7 tabs; password reset; impersonate; all read-only except tier/admin/notes | M |
| **P2 — Monetization** | Promotions CRUD, redemption flow hook into checkout, Subscriptions + Orders list | M |
| **P3 — Reports** | Activity + Revenue reports with Recharts; materialized views for perf | M |
| **P4 — Moderation** | Conversations list + soft-delete, audit log viewer | S |
| **P5 — IA refresh** | Reorganize sidebar into Operations / CRM / Monetization / System groups | S |

**Total:** ~2–3 sprints. Phases can ship independently; P0 is a blocker for everything else.

---

## 9. Open Questions for User

1. **Payment gateways:** Keep DB-backed config for **non-secret** fields only? Confirm secrets → env migration.
2. **Password reset:** Supabase admin `generateLink('recovery')` + email it to user, or show a one-time link in admin UI?
3. **Impersonation:** do you want it at all? It's powerful but risky — skip if unsure.
4. **Promotion redemption model:** apply at Stripe Checkout (needs Stripe Coupon objects) or post-checkout adjustment? Former is cleaner; latter is simpler.
5. **Reports backend:** materialized views refreshed nightly, or live queries? Depends on user count (fine to stay live until >5k users).
6. **Refund action:** full Stripe `/refunds` API integration, or just mark-as-refunded in DB and do refund manually in Stripe dashboard for now?

---

## 10. Out of Scope (explicitly)

- Multi-admin roles (super-admin vs support). Current is binary `is_admin`. Add only if needed.
- External CRM sync (HubSpot, Intercom) — this is an **internal** CRM.
- Email campaigns from admin. Use external tool (Resend/Mailchimp).
- Billing portal rewrite. Stripe Customer Portal is fine.

---

**Next step:** user reviews, picks scope (all phases vs subset), answers §9 questions. Then I create phase files and start with P0.
