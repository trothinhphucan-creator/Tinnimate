'use client'

import { useState, useEffect } from 'react'
import { useLangStore } from '@/stores/use-lang-store'
import { Brain, ChevronRight, CheckCircle2, Lock, X } from 'lucide-react'
import { AuthGate } from '@/components/auth-gate'

interface Exercise {
  label: string
  labelVi: string
  type: 'read' | 'practice' | 'quiz'
  content: string
  contentVi: string
}

interface Module {
  week: number
  title: string
  titleVi: string
  desc: string
  descVi: string
  emoji: string
  exercises: Exercise[]
}

const MODULES: Module[] = [
  {
    week: 1, emoji: '📖',
    title: 'Understanding Tinnitus & Sleep',
    titleVi: 'Hiểu Về Ù Tai & Giấc Ngủ',
    desc: 'Learn the tinnitus-insomnia cycle and set your baseline.',
    descVi: 'Tìm hiểu vòng xoáy ù tai-mất ngủ và thiết lập baseline.',
    exercises: [
      {
        label: 'The Tinnitus-Sleep Cycle', labelVi: 'Vòng Xoáy Ù Tai-Mất Ngủ', type: 'read',
        content: `**The Vicious Cycle:**\n\n1. 🔔 Tinnitus makes it hard to fall asleep\n2. 😰 Poor sleep increases stress & anxiety\n3. 📈 Stress amplifies tinnitus perception\n4. 🔄 The cycle repeats and intensifies\n\n**Breaking the cycle:**\n- Sound therapy at bedtime masks tinnitus\n- Relaxation techniques reduce arousal\n- CBT-i restructures sleep patterns\n- Consistent sleep schedule resets your clock\n\n**Key insight:** Your brain can learn to filter out tinnitus — just like you learn to ignore a ticking clock. CBT-i teaches your brain this skill.`,
        contentVi: `**Vòng xoáy tiêu cực:**\n\n1. 🔔 Ù tai khiến khó ngủ\n2. 😰 Ngủ kém tăng stress & lo âu\n3. 📈 Stress khuếch đại cảm nhận ù tai\n4. 🔄 Chu kỳ lặp lại và tăng cường\n\n**Phá vỡ vòng xoáy:**\n- Âm thanh trị liệu khi ngủ che tiếng ù\n- Kỹ thuật thư giãn giảm kích thích\n- CBT-i tái cấu trúc giấc ngủ\n- Giờ ngủ cố định reset đồng hồ sinh học\n\n**Điểm mấu chốt:** Não bạn CÓ THỂ học cách lọc ù tai — giống như bạn học cách bỏ qua tiếng đồng hồ tích tắc. CBT-i dạy não kỹ năng này.`,
      },
      {
        label: 'Sleep Diary Setup', labelVi: 'Thiết Lập Nhật Ký Ngủ', type: 'practice',
        content: `**Track these every morning for 1 week:**\n\n📝 **Sleep Diary Template:**\n- ⏰ What time did you go to bed?\n- 💤 What time did you fall asleep? (estimate)\n- 🌙 How many times did you wake up?\n- ☀️ What time did you wake up?\n- 🛏️ What time did you get out of bed?\n- 📊 Rate sleep quality (1-10)\n- 🔔 Rate tinnitus at bedtime (1-10)\n\n**Calculate your Sleep Efficiency:**\n\nSleep Efficiency = (Time Asleep / Time in Bed) × 100%\n\n- **>85%** = Good\n- **75-85%** = Moderate\n- **<75%** = Need CBT-i intervention\n\n✅ Use TinniMate's daily check-in to track this automatically!`,
        contentVi: `**Theo dõi mỗi sáng trong 1 tuần:**\n\n📝 **Mẫu Nhật Ký Ngủ:**\n- ⏰ Bạn lên giường lúc mấy giờ?\n- 💤 Bạn ngủ được lúc mấy giờ? (ước tính)\n- 🌙 Thức giữa đêm bao nhiêu lần?\n- ☀️ Thức dậy lúc mấy giờ?\n- 🛏️ Rời giường lúc mấy giờ?\n- 📊 Chất lượng giấc ngủ (1-10)\n- 🔔 Mức ù tai lúc ngủ (1-10)\n\n**Tính Hiệu Quả Giấc Ngủ:**\n\nHiệu Quả = (Thời gian ngủ / Thời gian trên giường) × 100%\n\n- **>85%** = Tốt\n- **75-85%** = Trung bình\n- **<75%** = Cần CBT-i\n\n✅ Dùng check-in hàng ngày của TinniMate để tự động theo dõi!`,
      },
      {
        label: 'Baseline Assessment', labelVi: 'Đánh Giá Baseline', type: 'quiz',
        content: `**Answer honestly to set your baseline:**\n\n1. How long does it take you to fall asleep?\n   - A) Less than 15 min ✅\n   - B) 15-30 min ⚠️\n   - C) More than 30 min 🔴\n\n2. Does tinnitus prevent you from sleeping?\n   - A) Rarely ✅\n   - B) Sometimes ⚠️\n   - C) Most nights 🔴\n\n3. How rested do you feel in the morning?\n   - A) Well-rested ✅\n   - B) Somewhat tired ⚠️\n   - C) Exhausted 🔴\n\n**Scoring:**\n- Mostly A's → Your sleep is manageable. Focus on optimization.\n- Mostly B's → Moderate issues. CBT-i will help significantly.\n- Mostly C's → Significant sleep disruption. CBT-i is essential.`,
        contentVi: `**Trả lời trung thực để tạo baseline:**\n\n1. Bạn mất bao lâu để ngủ?\n   - A) Dưới 15 phút ✅\n   - B) 15-30 phút ⚠️\n   - C) Trên 30 phút 🔴\n\n2. Ù tai có cản trở giấc ngủ?\n   - A) Hiếm khi ✅\n   - B) Thỉnh thoảng ⚠️\n   - C) Hầu hết đêm 🔴\n\n3. Sáng dậy bạn cảm thấy thế nào?\n   - A) Khỏe khoắn ✅\n   - B) Hơi mệt ⚠️\n   - C) Kiệt sức 🔴\n\n**Kết quả:**\n- Đa số A → Giấc ngủ ổn. Tập trung tối ưu hóa.\n- Đa số B → Vấn đề trung bình. CBT-i sẽ giúp đáng kể.\n- Đa số C → Rối loạn giấc ngủ. CBT-i rất cần thiết.`,
      },
    ],
  },
  {
    week: 2, emoji: '🛏️',
    title: 'Sleep Restriction & Stimulus Control',
    titleVi: 'Hạn Chế Giấc Ngủ & Kiểm Soát Kích Thích',
    desc: 'Build sleep pressure and reset your bed-sleep association.',
    descVi: 'Tạo áp lực ngủ và thiết lập lại liên kết giường-ngủ.',
    exercises: [
      {
        label: 'Calculate Your Sleep Window', labelVi: 'Tính Cửa Sổ Giấc Ngủ', type: 'practice',
        content: `**Sleep Restriction Therapy:**\n\nStep 1: From your sleep diary, find your average Total Sleep Time (TST)\n\nStep 2: Set your Sleep Window = TST (minimum 5 hours)\n\nStep 3: Choose a fixed wake time (e.g., 7:00 AM)\n\nStep 4: Calculate bedtime = Wake time - Sleep Window\n\n**Example:**\n- Average sleep: 5.5 hours\n- Wake time: 7:00 AM\n- Bedtime: 1:30 AM\n\n**Rules:**\n- Do NOT go to bed before your scheduled bedtime\n- Wake up at the SAME time every day (weekends too!)\n- When sleep efficiency reaches 85%+, extend window by 15 min\n\n⚠️ This will feel hard at first. That's normal. The sleep pressure buildup will make your sleep deeper and more efficient.`,
        contentVi: `**Liệu Pháp Hạn Chế Giấc Ngủ:**\n\nBước 1: Từ nhật ký, tìm Thời Gian Ngủ Thực Tế trung bình (TST)\n\nBước 2: Cửa Sổ Ngủ = TST (tối thiểu 5 giờ)\n\nBước 3: Chọn giờ dậy cố định (VD: 7:00 sáng)\n\nBước 4: Giờ ngủ = Giờ dậy - Cửa Sổ Ngủ\n\n**Ví dụ:**\n- Ngủ trung bình: 5.5 giờ\n- Giờ dậy: 7:00 sáng\n- Giờ ngủ: 1:30 sáng\n\n**Quy tắc:**\n- KHÔNG lên giường trước giờ\n- Dậy CÙNG GIỜ mỗi ngày (cả cuối tuần!)\n- Khi hiệu quả giấc ngủ đạt 85%+, kéo dài 15 phút\n\n⚠️ Lúc đầu sẽ khó. Đó là bình thường. Áp lực ngủ tích lũy sẽ giúp ngủ sâu hơn.`,
      },
      {
        label: 'Stimulus Control Rules', labelVi: 'Quy Tắc Kiểm Soát Kích Thích', type: 'read',
        content: `**6 Rules of Stimulus Control:**\n\n1. 🛏️ Use bed ONLY for sleep (and intimacy)\n   - No phone, no TV, no reading in bed\n\n2. 😴 Go to bed only when sleepy\n   - Sleepy ≠ tired. Sleepy = can't keep eyes open\n\n3. ⏰ If awake 20+ minutes, get up\n   - Go to another room, do something calming\n   - Return only when sleepy again\n\n4. ☀️ Same wake time every day\n   - Yes, even weekends and holidays\n\n5. 🚫 No napping\n   - Build that sleep pressure!\n\n6. 🎵 Use sound therapy in bed\n   - White/brown noise helps mask tinnitus\n   - Set a sleep timer to auto-stop\n\n**Why it works:** You're retraining your brain to associate bed = sleep, not bed = lying awake worrying about tinnitus.`,
        contentVi: `**6 Quy Tắc Kiểm Soát Kích Thích:**\n\n1. 🛏️ Giường CHỈ để ngủ\n   - Không điện thoại, TV, đọc sách trên giường\n\n2. 😴 Chỉ lên giường khi buồn ngủ\n   - Buồn ngủ ≠ mệt. Buồn ngủ = không mở mắt nổi\n\n3. ⏰ Thức 20+ phút → dậy\n   - Sang phòng khác, làm gì nhẹ nhàng\n   - Quay lại khi buồn ngủ\n\n4. ☀️ Cùng giờ dậy mỗi ngày\n   - Đúng, cả cuối tuần và ngày lễ\n\n5. 🚫 Không ngủ trưa\n   - Tích lũy áp lực ngủ!\n\n6. 🎵 Dùng âm thanh trị liệu\n   - Ồn trắng/nâu che tiếng ù\n   - Đặt hẹn giờ tự tắt\n\n**Tại sao hiệu quả:** Bạn đang huấn luyện não liên kết giường = ngủ, không phải giường = nằm lo lắng.`,
      },
      {
        label: 'Wind-Down Routine', labelVi: 'Thói Quen Thư Giãn Trước Ngủ', type: 'practice',
        content: `**Build Your 30-Minute Wind-Down Routine:**\n\n🕘 **30 min before bed:**\n- Turn off all screens\n- Dim lights in your home\n- Set thermostat to 65-68°F (18-20°C)\n\n🕘 **20 min before bed:**\n- Do a breathing exercise (4-7-8 technique)\n- Or progressive muscle relaxation\n- Use TinniMate's relaxation tools!\n\n🕘 **10 min before bed:**\n- Start your sound therapy (brown noise or rain)\n- Set sleep timer to 30-60 minutes\n- Gentle stretching or journaling\n\n🛏️ **Bedtime:**\n- Lights off, sound playing\n- If thoughts race, use the "worry time" technique:\n  Write worries on paper → "I'll deal with this tomorrow"\n\n✅ Practice this routine every night for 1 week before moving to Week 3.`,
        contentVi: `**Xây Dựng Thói Quen Thư Giãn 30 Phút:**\n\n🕘 **30 phút trước ngủ:**\n- Tắt tất cả màn hình\n- Giảm đèn trong nhà\n- Nhiệt độ phòng 18-20°C\n\n🕘 **20 phút trước ngủ:**\n- Bài tập thở (kỹ thuật 4-7-8)\n- Hoặc thư giãn cơ tiến triển\n- Dùng công cụ thư giãn của TinniMate!\n\n🕘 **10 phút trước ngủ:**\n- Bật âm thanh trị liệu (ồn nâu hoặc mưa)\n- Hẹn giờ 30-60 phút\n- Giãn cơ nhẹ hoặc viết nhật ký\n\n🛏️ **Giờ ngủ:**\n- Tắt đèn, âm thanh đang phát\n- Nếu suy nghĩ chạy đua, dùng kỹ thuật "giờ lo lắng":\n  Viết lo lắng ra giấy → "Để mai tính"\n\n✅ Thực hành mỗi tối trong 1 tuần trước khi sang Tuần 3.`,
      },
    ],
  },
  {
    week: 3, emoji: '🧠',
    title: 'Cognitive Restructuring',
    titleVi: 'Tái Cấu Trúc Nhận Thức',
    desc: 'Challenge unhelpful thoughts about tinnitus and sleep.',
    descVi: 'Thách thức những suy nghĩ tiêu cực về ù tai và giấc ngủ.',
    exercises: [
      {
        label: 'Identify Thought Patterns', labelVi: 'Nhận Diện Khuôn Mẫu Suy Nghĩ', type: 'read',
        content: `**Common Unhelpful Thinking Patterns:**\n\n❌ **Catastrophizing:**\n"I'll never sleep again" → "This is a bad night, but not ALL nights"\n\n❌ **All-or-nothing:**\n"If I don't sleep 8 hours, I'm doomed" → "Even 6 hours of quality sleep is restorative"\n\n❌ **Mind reading:**\n"Everyone can hear my tinnitus" → "Tinnitus is internal, others can't hear it"\n\n❌ **Fortune telling:**\n"Tomorrow will be awful because I'm not sleeping" → "I've had bad nights before and functioned okay"\n\n❌ **Emotional reasoning:**\n"I feel anxious, so something must be wrong" → "Anxiety about sleep is common and manageable"\n\n**Practice:** When you notice a negative thought, write it down. Then ask: "Is this really true? What evidence contradicts this?"`,
        contentVi: `**Các Khuôn Mẫu Suy Nghĩ Tiêu Cực:**\n\n❌ **Thảm họa hóa:**\n"Tôi sẽ không bao giờ ngủ được" → "Đêm nay kém, nhưng không phải tất cả đêm"\n\n❌ **Trắng-đen:**\n"Không ngủ đủ 8 tiếng là tiêu" → "6 tiếng ngủ chất lượng cũng phục hồi tốt"\n\n❌ **Đọc suy nghĩ:**\n"Mọi người đều nghe thấy tiếng ù" → "Ù tai bên trong, người khác không nghe"\n\n❌ **Tiên tri:**\n"Mai sẽ kinh khủng vì không ngủ" → "Tôi từng thức khuya mà vẫn ổn"\n\n❌ **Lý luận cảm xúc:**\n"Tôi lo lắng nên chắc có vấn đề" → "Lo về giấc ngủ rất phổ biến và kiểm soát được"\n\n**Thực hành:** Khi thấy suy nghĩ tiêu cực, viết ra. Rồi hỏi: "Điều này có thực sự đúng? Bằng chứng nào phản bác?"`,
      },
      {
        label: 'Thought Challenging', labelVi: 'Thách Thức Suy Nghĩ', type: 'practice',
        content: `**Thought Challenging Worksheet:**\n\n📝 Step 1: **Situation**\nDescribe the moment (e.g., "Lying in bed at midnight, hearing tinnitus")\n\n📝 Step 2: **Automatic Thought**\nWhat went through your mind? (e.g., "This noise will never stop")\n\n📝 Step 3: **Emotion & Intensity**\nWhat did you feel? How strong? (e.g., "Anxiety 8/10")\n\n📝 Step 4: **Evidence FOR the thought**\n(e.g., "I've had tinnitus for months")\n\n📝 Step 5: **Evidence AGAINST the thought**\n(e.g., "Some nights are better, it varies in loudness")\n\n📝 Step 6: **Balanced Thought**\n(e.g., "Tinnitus fluctuates. Some nights are harder, but I have tools to manage it")\n\n📝 Step 7: **New Emotion & Intensity**\n(e.g., "Acceptance 5/10, mild frustration 3/10")\n\n✅ Do this exercise for 3 different tinnitus-related thoughts this week.`,
        contentVi: `**Bài Tập Thách Thức Suy Nghĩ:**\n\n📝 Bước 1: **Tình huống**\nMô tả thời điểm (VD: "Nằm trên giường lúc nửa đêm, nghe tiếng ù")\n\n📝 Bước 2: **Suy nghĩ tự động**\nBạn nghĩ gì? (VD: "Tiếng ồn này không bao giờ dứt")\n\n📝 Bước 3: **Cảm xúc & Cường độ**\nBạn cảm thấy gì? Mạnh bao nhiêu? (VD: "Lo âu 8/10")\n\n📝 Bước 4: **Bằng chứng ỦNG HỘ suy nghĩ**\n(VD: "Đã ù tai nhiều tháng")\n\n📝 Bước 5: **Bằng chứng PHẢN BÁC**\n(VD: "Một số đêm dễ chịu hơn, cường độ thay đổi")\n\n📝 Bước 6: **Suy nghĩ cân bằng**\n(VD: "Ù tai dao động. Có đêm khó, nhưng tôi có công cụ kiểm soát")\n\n📝 Bước 7: **Cảm xúc mới & Cường độ**\n(VD: "Chấp nhận 5/10, bực bội nhẹ 3/10")\n\n✅ Thực hiện với 3 suy nghĩ liên quan ù tai khác nhau tuần này.`,
      },
      {
        label: 'Reframing Exercise', labelVi: 'Bài Tập Đổi Góc Nhìn', type: 'practice',
        content: `**Transform These Thoughts:**\n\n🔄 **"I can't sleep because of tinnitus"**\n→ "Tinnitus is present, but I can create conditions for sleep"\n→ Action: Turn on sound therapy, do breathing exercise\n\n🔄 **"I'll be useless tomorrow without sleep"**\n→ "I may be tired, but I'll still function. One night won't ruin me"\n→ Action: Plan a simpler schedule, allow for rest breaks\n\n🔄 **"My tinnitus is getting worse"**\n→ "Tinnitus perception varies with stress. I'm noticing it more right now"\n→ Action: Check-in with TinniMate, track patterns\n\n🔄 **"Nothing helps, I've tried everything"**\n→ "Some things help in some situations. Let me keep experimenting"\n→ Action: Try a new sound in the mixer, talk to Tinni\n\n**Key principle:** You can't control tinnitus directly, but you CAN control your response to it.`,
        contentVi: `**Chuyển Đổi Những Suy Nghĩ Này:**\n\n🔄 **"Không thể ngủ vì ù tai"**\n→ "Ù tai có mặt, nhưng tôi có thể tạo điều kiện ngủ"\n→ Hành động: Bật âm thanh trị liệu, tập thở\n\n🔄 **"Mai sẽ vô dụng vì không ngủ"**\n→ "Có thể mệt, nhưng vẫn hoạt động được. Một đêm không phá hủy tôi"\n→ Hành động: Lịch đơn giản hơn, cho phép nghỉ\n\n🔄 **"Ù tai ngày càng nặng"**\n→ "Cảm nhận ù tai thay đổi theo stress. Giờ tôi đang chú ý nhiều hơn"\n→ Hành động: Check-in, theo dõi xu hướng\n\n🔄 **"Không gì giúp được, thử hết rồi"**\n→ "Có thứ giúp trong một số tình huống. Hãy tiếp tục thử"\n→ Hành động: Thử âm thanh mới trong mixer, nói chuyện với Tinni\n\n**Nguyên tắc:** Bạn không kiểm soát được ù tai, nhưng CÓ THỂ kiểm soát cách phản ứng.`,
      },
    ],
  },
  {
    week: 4, emoji: '🎯',
    title: 'Relaxation & Maintenance',
    titleVi: 'Thư Giãn & Duy Trì',
    desc: 'Master relaxation and build long-term habits.',
    descVi: 'Thành thạo thư giãn và xây dựng thói quen lâu dài.',
    exercises: [
      {
        label: 'Progressive Muscle Relaxation', labelVi: 'Thư Giãn Cơ Tiến Triển', type: 'practice',
        content: `**15-Minute PMR Session:**\n\nLie down comfortably. For each muscle group, tense for 5 seconds, then relax for 15 seconds.\n\n1. 👣 **Feet** — Curl toes tightly… release\n2. 🦵 **Calves** — Point toes up, tighten… release\n3. 🦿 **Thighs** — Squeeze tight… release\n4. 🍑 **Glutes** — Clench… release\n5. 💪 **Abdomen** — Tighten stomach… release\n6. ✊ **Hands** — Make fists… release\n7. 💪 **Arms** — Flex biceps… release\n8. 🙆 **Shoulders** — Shrug up to ears… release\n9. 😬 **Face** — Scrunch everything… release\n10. 🧠 **Whole body** — Tense everything at once… release completely\n\n**After:** Scan your body for any remaining tension. Breathe slowly. Notice how different tension vs. relaxation feels.\n\n✅ Do this every night before bed. Use TinniMate's relaxation tool for guided sessions!`,
        contentVi: `**Phiên PMR 15 Phút:**\n\nNằm thoải mái. Mỗi nhóm cơ: căng 5 giây, thả 15 giây.\n\n1. 👣 **Chân** — Cuộn ngón chân… thả\n2. 🦵 **Bắp chuối** — Hướng ngón lên, siết… thả\n3. 🦿 **Đùi** — Siết chặt… thả\n4. 🍑 **Mông** — Siết… thả\n5. 💪 **Bụng** — Siết bụng… thả\n6. ✊ **Tay** — Nắm chặt… thả\n7. 💪 **Cánh tay** — Gập cơ tay… thả\n8. 🙆 **Vai** — Nhún lên tai… thả\n9. 😬 **Mặt** — Nhăn hết… thả\n10. 🧠 **Toàn thân** — Căng tất cả cùng lúc… thả hoàn toàn\n\n**Sau đó:** Quét toàn thân tìm căng thẳng còn sót. Thở chậm. Cảm nhận sự khác biệt căng vs thả.\n\n✅ Làm mỗi tối trước ngủ. Dùng công cụ thư giãn TinniMate!`,
      },
      {
        label: '4-7-8 Breathing', labelVi: 'Hít Thở 4-7-8', type: 'practice',
        content: `**The 4-7-8 Breathing Technique:**\n\nDeveloped by Dr. Andrew Weil. Called "a natural tranquilizer for the nervous system."\n\n**Steps:**\n1. Exhale completely through your mouth\n2. **Inhale** through your nose for **4 seconds**\n3. **Hold** your breath for **7 seconds**\n4. **Exhale** slowly through your mouth for **8 seconds**\n5. Repeat 4 cycles\n\n**Timing guide:**\n🟢 Inhale —— 4 sec\n🟡 Hold ———— 7 sec\n🔴 Exhale ————— 8 sec\n\n**Tips:**\n- The ratio matters more than exact seconds\n- Place your tongue on the ridge behind upper front teeth\n- Start with 4 cycles, build up to 8\n- Practice twice daily (morning + before bed)\n\n**Research:** This activates the parasympathetic nervous system, reducing heart rate and promoting sleep.`,
        contentVi: `**Kỹ Thuật Thở 4-7-8:**\n\nThiết kế bởi Dr. Andrew Weil. Được gọi là "thuốc an thần tự nhiên cho hệ thần kinh."\n\n**Các bước:**\n1. Thở ra hoàn toàn qua miệng\n2. **Hít vào** qua mũi **4 giây**\n3. **Nín thở** **7 giây**\n4. **Thở ra** chậm qua miệng **8 giây**\n5. Lặp lại 4 chu kỳ\n\n**Hướng dẫn:**\n🟢 Hít vào —— 4 giây\n🟡 Nín ———— 7 giây\n🔴 Thở ra ————— 8 giây\n\n**Mẹo:**\n- Tỷ lệ quan trọng hơn giây chính xác\n- Đặt lưỡi lên gờ sau răng cửa trên\n- Bắt đầu 4 chu kỳ, tăng dần lên 8\n- Tập 2 lần/ngày (sáng + trước ngủ)\n\n**Nghiên cứu:** Kích hoạt hệ thần kinh phó giao cảm, giảm nhịp tim và hỗ trợ ngủ.`,
      },
      {
        label: 'My Maintenance Plan', labelVi: 'Kế Hoạch Duy Trì', type: 'quiz',
        content: `**🎓 Congratulations! Create your maintenance plan:**\n\n**Daily habits to keep:**\n- ✅ Fixed wake time: ___\n- ✅ Wind-down routine: 30 min before bed\n- ✅ Sound therapy at bedtime\n- ✅ TinniMate daily check-in\n\n**Weekly reviews:**\n- ✅ Check your sleep efficiency (target: 85%+)\n- ✅ Review mood & tinnitus trends in journal\n- ✅ Practice thought challenging if needed\n\n**If tinnitus flares up:**\n1. Don't panic — it's temporary\n2. Do a check-in to log severity\n3. Use sound mixer for masking\n4. Do PMR or 4-7-8 breathing\n5. Chat with Tinni for support\n\n**If sleep worsens:**\n1. Go back to sleep restriction for 1 week\n2. Tighten stimulus control rules\n3. Review thought challenging worksheet\n\n🏆 You've completed the CBT-i program! Keep using TinniMate daily.`,
        contentVi: `**🎓 Chúc mừng! Tạo kế hoạch duy trì:**\n\n**Thói quen hàng ngày:**\n- ✅ Giờ dậy cố định: ___\n- ✅ Thói quen thư giãn: 30 phút trước ngủ\n- ✅ Âm thanh trị liệu khi ngủ\n- ✅ Check-in hàng ngày TinniMate\n\n**Đánh giá hàng tuần:**\n- ✅ Kiểm tra hiệu quả giấc ngủ (mục tiêu: 85%+)\n- ✅ Xem xu hướng tâm trạng & ù tai trong nhật ký\n- ✅ Thách thức suy nghĩ nếu cần\n\n**Khi ù tai tăng:**\n1. Đừng hoảng — nó tạm thời\n2. Check-in để ghi nhận mức độ\n3. Dùng Sound Mixer che tiếng\n4. Tập PMR hoặc thở 4-7-8\n5. Chat với Tinni\n\n**Khi giấc ngủ kém đi:**\n1. Quay lại hạn chế giấc ngủ 1 tuần\n2. Siết chặt quy tắc kiểm soát kích thích\n3. Xem lại bài tập thách thức suy nghĩ\n\n🏆 Bạn đã hoàn thành chương trình CBT-i! Tiếp tục dùng TinniMate mỗi ngày.`,
      },
    ],
  },
]

const TYPE_COLORS = { read: 'text-blue-400', practice: 'text-emerald-400', quiz: 'text-amber-400' }
const TYPE_LABELS = { read: { vi: '📖 Đọc', en: '📖 Read' }, practice: { vi: '🏋️ Thực hành', en: '🏋️ Practice' }, quiz: { vi: '📋 Đánh giá', en: '📋 Assess' } }

// Persist completed exercises to localStorage
function loadCompleted(): Set<string> {
  if (typeof window === 'undefined') return new Set()
  try {
    const saved = localStorage.getItem('tinnimate-cbti')
    if (saved) return new Set(JSON.parse(saved))
  } catch {}
  return new Set()
}

export default function CBTiPage() {
  const { lang } = useLangStore()
  const isEn = lang === 'en'
  const [currentWeek, setCurrentWeek] = useState(0)
  const [completedEx, setCompletedEx] = useState<Set<string>>(() => loadCompleted())
  const [openEx, setOpenEx] = useState<string | null>(null)

  // Save progress to localStorage  
  useEffect(() => {
    try { localStorage.setItem('tinnimate-cbti', JSON.stringify([...completedEx])) } catch {}
  }, [completedEx])

  const toggleEx = (key: string) => {
    const next = new Set(completedEx)
    if (next.has(key)) next.delete(key); else next.add(key)
    setCompletedEx(next)
  }

  const mod = MODULES[currentWeek]
  const progress = MODULES.map((m, wi) =>
    m.exercises.filter((_, ei) => completedEx.has(`${wi}-${ei}`)).length / m.exercises.length
  )

  // Currently viewing exercise content
  const openExData = openEx ? (() => {
    const [wi, ei] = openEx.split('-').map(Number)
    return MODULES[wi]?.exercises[ei]
  })() : null

  return (
    <AuthGate feature="CBT-i Program" featureVi="Chương Trình CBT-i" emoji="🧠"
      previewItems={[
        { emoji: '📖', label: 'CBT modules' },
        { emoji: '🎯', label: 'Exercises' },
        { emoji: '📊', label: 'Tracking' },
      ]}>
    <div className="h-full overflow-y-auto p-4 sm:p-6 md:p-8 max-w-4xl mx-auto">
      <div className="fixed inset-0 -z-10 overflow-hidden pointer-events-none">
        <div className="absolute top-[10%] right-[20%] w-[250px] h-[250px] rounded-full bg-violet-600/6 blur-[100px]" />
      </div>

      {/* Exercise Content Modal */}
      {openEx && openExData && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm" onClick={() => setOpenEx(null)}>
          <div className="bg-slate-900 border border-white/10 rounded-2xl max-w-lg w-full max-h-[80vh] overflow-y-auto shadow-2xl" onClick={e => e.stopPropagation()}>
            <div className="sticky top-0 bg-slate-900/95 backdrop-blur border-b border-white/5 px-5 py-3 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className={`text-xs ${TYPE_COLORS[openExData.type]}`}>
                  {isEn ? TYPE_LABELS[openExData.type].en : TYPE_LABELS[openExData.type].vi}
                </span>
                <h3 className="text-sm font-semibold text-white">{isEn ? openExData.label : openExData.labelVi}</h3>
              </div>
              <button onClick={() => setOpenEx(null)} className="text-slate-500 hover:text-white p-1">
                <X size={18} />
              </button>
            </div>
            <div className="p-5">
              <div className="text-sm text-slate-300 leading-relaxed whitespace-pre-line space-y-2">
                {(isEn ? openExData.content : openExData.contentVi).split('\n').map((line, i) => {
                  if (line.startsWith('**') && line.endsWith('**')) {
                    return <div key={i} className="font-bold text-white mt-4 mb-1">{line.replace(/\*\*/g, '')}</div>
                  }
                  if (line.startsWith('- ')) {
                    return <div key={i} className="pl-4 text-xs">{line}</div>
                  }
                  if (line.match(/^\d+\./)) {
                    return <div key={i} className="pl-2 text-xs">{line}</div>
                  }
                  if (line.startsWith('→')) {
                    return <div key={i} className="pl-6 text-xs text-emerald-400">{line}</div>
                  }
                  if (line.startsWith('❌') || line.startsWith('✅') || line.startsWith('⚠️') || line.startsWith('🔴')) {
                    return <div key={i} className="text-xs">{line}</div>
                  }
                  return <div key={i} className="text-xs">{line}</div>
                })}
              </div>
              <div className="mt-6 flex gap-2">
                <button onClick={() => { toggleEx(openEx); setOpenEx(null) }}
                  className={`flex-1 py-2.5 rounded-xl text-xs font-semibold transition-all ${
                    completedEx.has(openEx)
                      ? 'bg-slate-700 text-slate-300'
                      : 'bg-gradient-to-r from-violet-600 to-purple-600 text-white'
                  }`}>
                  {completedEx.has(openEx)
                    ? (isEn ? '↩️ Mark as incomplete' : '↩️ Đánh dấu chưa xong')
                    : (isEn ? '✅ Mark as completed' : '✅ Đánh dấu hoàn thành')}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Header */}
      <div className="flex items-center gap-3 mb-6">
        <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-violet-500 to-purple-600 flex items-center justify-center shadow-lg shadow-violet-500/20">
          <Brain size={20} className="text-white" />
        </div>
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-white">CBT-i</h1>
          <p className="text-xs text-slate-400">
            {isEn ? 'Cognitive Behavioral Therapy for Insomnia' : 'Liệu Pháp Nhận Thức Hành Vi Cho Mất Ngủ'}
          </p>
        </div>
      </div>

      {/* Overall progress */}
      <div className="bg-white/[0.02] border border-white/5 rounded-xl p-3 mb-4 flex items-center gap-3">
        <div className="text-sm">📊</div>
        <div className="flex-1">
          <div className="flex justify-between text-[10px] text-slate-500 mb-1">
            <span>{isEn ? 'Overall progress' : 'Tiến độ tổng'}</span>
            <span>{Math.round(progress.reduce((a,b) => a+b, 0) / MODULES.length * 100)}%</span>
          </div>
          <div className="h-1.5 bg-white/5 rounded-full overflow-hidden">
            <div className="h-full bg-gradient-to-r from-violet-500 to-purple-500 rounded-full transition-all duration-500"
              style={{ width: `${progress.reduce((a,b) => a+b, 0) / MODULES.length * 100}%` }} />
          </div>
        </div>
      </div>

      {/* Week selector */}
      <div className="grid grid-cols-4 gap-2 mb-6">
        {MODULES.map((m, i) => {
          const locked = i > 0 && progress[i - 1] < 0.5
          return (
            <button key={i} onClick={() => !locked && setCurrentWeek(i)} disabled={locked}
              className={`relative py-3 rounded-xl border text-xs transition-all ${
                locked ? 'opacity-40 cursor-not-allowed bg-white/[0.01] border-white/5' :
                currentWeek === i
                  ? 'bg-violet-600/20 border-violet-500/30 text-violet-300 font-semibold'
                  : 'bg-white/[0.02] border-white/5 text-slate-500 hover:text-white'
              }`}>
              {locked && <Lock size={10} className="absolute top-1 right-1 text-slate-600" />}
              <div className="text-xl mb-1">{m.emoji}</div>
              <div>{isEn ? `Week ${m.week}` : `Tuần ${m.week}`}</div>
              {/* Progress ring */}
              <div className="absolute top-1 left-1 w-4 h-4">
                <svg viewBox="0 0 16 16" className="w-full h-full -rotate-90">
                  <circle cx="8" cy="8" r="6" fill="none" stroke="rgba(255,255,255,0.1)" strokeWidth="2" />
                  <circle cx="8" cy="8" r="6" fill="none" stroke={progress[i] >= 1 ? '#22c55e' : '#8b5cf6'} strokeWidth="2"
                    strokeDasharray={`${progress[i] * 37.7} 37.7`} />
                </svg>
              </div>
            </button>
          )
        })}
      </div>

      {/* Current module */}
      <div className="bg-white/[0.02] backdrop-blur border border-white/5 rounded-2xl p-5">
        <div className="flex items-center gap-2 mb-1">
          <span className="text-2xl">{mod.emoji}</span>
          <h2 className="font-semibold text-white text-sm">
            {isEn ? mod.title : mod.titleVi}
          </h2>
        </div>
        <p className="text-xs text-slate-400 mb-5">{isEn ? mod.desc : mod.descVi}</p>

        <div className="space-y-3">
          {mod.exercises.map((ex, ei) => {
            const key = `${currentWeek}-${ei}`
            const done = completedEx.has(key)
            const locked = currentWeek > 0 && progress[currentWeek - 1] < 0.5
            return (
              <button key={ei} disabled={locked}
                onClick={() => { if (!locked) setOpenEx(key) }}
                className={`w-full flex items-center gap-3 p-3 rounded-xl border text-left transition-all ${
                  done
                    ? 'bg-violet-600/10 border-violet-500/20'
                    : locked
                      ? 'bg-white/[0.01] border-white/5 opacity-40 cursor-not-allowed'
                      : 'bg-white/[0.02] border-white/5 hover:bg-white/[0.05] cursor-pointer'
                }`}>
                <div className="flex-shrink-0">
                  {locked ? <Lock size={16} className="text-slate-600" /> :
                   done ? <CheckCircle2 size={16} className="text-violet-400" /> :
                   <div className="w-4 h-4 rounded-full border border-slate-600" />}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="text-xs font-medium text-white truncate">{isEn ? ex.label : ex.labelVi}</div>
                  <div className={`text-[10px] ${TYPE_COLORS[ex.type]}`}>
                    {isEn ? TYPE_LABELS[ex.type].en : TYPE_LABELS[ex.type].vi}
                  </div>
                </div>
                <ChevronRight size={14} className="text-slate-600 flex-shrink-0" />
              </button>
            )
          })}
        </div>
      </div>

      {/* Info */}
      <div className="mt-4 bg-white/[0.02] border border-white/5 rounded-xl p-3 text-center">
        <p className="text-[10px] text-slate-500">
          💡 {isEn
            ? 'Complete 50% of the previous week to unlock the next. Click exercises to view content.'
            : 'Hoàn thành 50% tuần trước để mở tuần tiếp. Click bài tập để xem nội dung.'}
        </p>
      </div>
    </div>
    </AuthGate>
  )
}
