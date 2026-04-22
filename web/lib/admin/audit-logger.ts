import type { SupabaseClient } from '@supabase/supabase-js'

interface AuditActionOpts {
  supabase: SupabaseClient
  adminId: string | undefined
  action: string
  targetType?: string
  targetId?: string
  diff?: { before?: unknown; after?: unknown }
  req?: Request
}

/**
 * Inserts a row into admin_audit_log.
 * Never throws — failures are silently logged as warnings.
 */
export async function logAdminAction(opts: AuditActionOpts): Promise<void> {
  try {
    const ip = opts.req
      ? (opts.req.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ??
         opts.req.headers.get('x-real-ip') ??
         undefined)
      : undefined

    await opts.supabase.from('admin_audit_log').insert({
      admin_id:    opts.adminId ?? null,
      action:      opts.action,
      target_type: opts.targetType ?? null,
      target_id:   opts.targetId  ?? null,
      diff:        opts.diff      ?? null,
      ip:          ip             ?? null,
    })
  } catch (err) {
    console.warn('[audit-logger] Failed to write audit log:', err)
  }
}
