'use client'

import Link from 'next/link'
import { useEffect, useRef, useState } from 'react'
import { useLangStore } from '@/stores/use-lang-store'
import { BrainHero } from '@/components/landing/brain-hero'

/* ── i18n ── */
const T = {
  vi: {
    nav: { features: 'Tính năng', how: 'Cách hoạt động', pricing: 'Bảng giá', testimonials: 'Phản hồi', login: 'Đăng nhập', cta: 'Bắt đầu ngay' },
    hero: {
      badge: 'Ứng dụng trị liệu ù tai #1 Việt Nam',
      title1: 'Bạn không đơn độc',
      title2: 'trong cuộc chiến với',
      title3: 'tiếng ù tai',
      desc: 'Hiểu cơ chế. Phá vỡ vòng xoắn. Kiểm soát tiếng ù. TinniMate giúp bạn sống hòa hợp với ù tai bằng liệu pháp âm thanh dựa trên nghiên cứu lâm sàng.',
      cta1: '💬 Tư vấn miễn phí với Tinni', cta2: 'Tìm hiểu cách hoạt động',
      online: 'Tinni đang online 24/7',
      stat1: 'Người dùng', stat2: 'Phiên trị liệu', stat3: 'Đánh giá',
    },
    chat: { title: 'Chat với Tinni 💙', input: 'Nhắn tin cho Tinni...', playing: 'Đang bật White Noise — 30 phút' },
    chatMsgs: [
      { 'role': 'assistant', 'content': 'Xin chào! Tôi là Tinni 💙 Hôm nay bạn cảm thấy thế nào?' },
      { 'role': 'user', 'content': 'Tai tôi đang ù khá nhiều, khó ngủ lắm...' },
      { 'role': 'assistant', 'content': 'Tôi hiểu, thực sự rất khó chịu 😔 Để tôi bật White Noise giúp bạn thư giãn nhé?' },
    ],
    education: {
      badge: '🔬 Hiểu để kiểm soát',
      title1: 'Tiếng ù không phải từ',
      title2: 'tai bạn',
      desc: 'Ù tai (Tinnitus) là hiện tượng não bộ tự tạo ra âm thanh khi không có nguồn phát bên ngoài. Đây không phải bệnh — mà là tín hiệu cho thấy hệ thần kinh thính giác cần được chú ý.',
      stats: [
        { value: '15-20%', label: 'Dân số toàn cầu bị ù tai' },
        { value: '70%', label: 'Liên quan đến suy giảm thính lực' },
        { value: '50M', label: 'Người Mỹ bị ù tai' },
      ],
      pathway: ['Tai ngoài', 'Ốc tai', 'Dây thần kinh', 'Não bộ'],
      pathwayNote: '⚡ Tín hiệu lỗi tại não bộ',
    },
    cycle: {
      title1: 'Vòng xoắn',
      title2: 'bệnh lý',
      desc: 'Ù tai gây lo lắng, lo lắng gây mất ngủ, mất ngủ khiến não nhạy cảm hơn, và tiếng ù trở nên nặng hơn. Đây là vòng xoắn mà hàng triệu người đang mắc kẹt.',
      steps: [
        { emoji: '🔊', label: 'Tiếng ù tai', sub: 'Âm thanh do não tự tạo' },
        { emoji: '😰', label: 'Lo lắng & căng thẳng', sub: 'Phản ứng cảm xúc tiêu cực' },
        { emoji: '😵', label: 'Mất ngủ', sub: 'Khó ngủ, giấc ngủ kém' },
        { emoji: '🧠', label: 'Não tăng nhạy cảm', sub: 'Hệ thần kinh quá hoạt' },
      ],
      breakText: 'TinniMate giúp phá vỡ vòng xoắn này',
    },
    therapy: {
      badge: '✨ Phương pháp khoa học',
      title1: 'Âm thanh trị liệu',
      title2: 'phá vỡ vòng xoắn',
      desc: 'Dựa trên phương pháp TRT (Tinnitus Retraining Therapy) của Jastreboff, TinniMate sử dụng âm thanh để huấn luyện não bộ "quen dần" với tiếng ù, giúp giảm phản ứng cảm xúc tiêu cực.',
      methods: [
        { icon: '🎵', title: 'TRT — Tái huấn luyện', desc: 'Não bộ học cách bỏ qua tiếng ù qua tiếp xúc âm thanh có kiểm soát', tag: 'Jastreboff Method' },
        { icon: '🧠', title: 'CBT-i — Nhận thức hành vi', desc: 'Thay đổi cách suy nghĩ về tiếng ù, giảm lo lắng và cải thiện giấc ngủ', tag: 'WHO Standard' },
        { icon: '🎯', title: 'Notch Therapy', desc: 'Lọc chính xác tần số gây ù tai, ức chế hoạt động thần kinh liên quan', tag: 'Độc quyền TinniMate', exclusive: true },
      ],
      positive: [
        { emoji: '🎵', label: 'Liệu pháp âm thanh' },
        { emoji: '😴', label: 'Ngủ ngon hơn' },
        { emoji: '😌', label: 'Giảm lo lắng' },
        { emoji: '🔇', label: 'Ù tai nhẹ hơn' },
        { emoji: '🌟', label: 'Chất lượng sống tốt hơn' },
      ],
    },
    features: {
      badge: 'Nền tảng lâm sàng toàn diện',
      title: 'Công cụ', title2: 'chuyên biệt',
      desc: 'Nền tảng toàn diện được xây dựng trên nghiên cứu lâm sàng — giúp bạn hiểu, kiểm soát và cải thiện tình trạng ù tai mỗi ngày',
      items: [
        { icon: '✨', title: 'Zentones', subtitle: 'Phương pháp âm thanh độc quyền', desc: 'Công nghệ âm thanh thiền ngẫu nhiên (fractal) độc quyền — điều chỉnh theo tần số ù tai, kích thích neuroplasticity.', tags: ['Fractal Melody', 'Personalized', 'Neuroplasticity'], exclusive: true, accent: 'amber' },
        { icon: '📋', title: 'Chẩn đoán lâm sàng', subtitle: 'Bộ câu hỏi chuẩn quốc tế', desc: 'Đánh giá mức độ ù tai bằng 5 thang đo được WHO công nhận. AI phân tích và đề xuất liệu trình.', tags: ['THI', 'TFI', 'ISI', 'PHQ-9', 'GAD-7'], exclusive: false, accent: 'violet' },
        { icon: '🧠', title: 'Quản lý tiếng ù', subtitle: 'CBT · Âm thanh · Thư giãn', desc: 'Kết hợp CBT-i, 11 âm thanh trị liệu và bài tập thư giãn tinh thần.', tags: ['CBT-i', 'White Noise', '4-7-8', 'Sound Mixer'], exclusive: false, accent: 'emerald' },
        { icon: '🎯', title: 'Notch Therapy', subtitle: 'Lọc âm tần số chính xác', desc: 'Lọc chính xác tần số gây ù tai, ức chế hoạt động thần kinh liên quan.', tags: ['Frequency Filter', 'Neural Inhibition'], exclusive: true, accent: 'red' },
        { icon: '👂', title: 'Tiện ích thính giác', subtitle: 'Đo thính lực & theo dõi', desc: 'Kiểm tra sức nghe bằng Hughson-Westlake chuẩn lâm sàng tại 6 tần số.', tags: ['Audiometry', 'Hughson-Westlake', 'Progress Chart'], exclusive: false, accent: 'cyan' },
      ],
    },
    mobileApp: {
      badge: '📱 Khu vườn chữa lành trên tay bạn',
      headline: 'Tinnimate —',
      headline2: 'Botanical Healing Garden',
      desc: 'Trải nghiệm liệu pháp âm thanh, thiền định và theo dõi ù tai trong một không gian thiên nhiên tĩnh lặng — được thiết kế để phục hồi tâm trí và cảm xúc mỗi ngày.',
      features: [
        { icon: '🎵', title: 'Immersive Sound Library', desc: 'Thư viện âm thanh trị liệu thiên nhiên sống động — Mưa, Sóng, Rừng, Zentones' },
        { icon: '🤖', title: 'AI Guide Companion', desc: 'Tinni AI đồng hành 24/7, gợi ý bài tập và tư vấn ngay khi bạn cần' },
        { icon: '🌿', title: 'Mindfulness Tool Garden', desc: 'Bài tập thở 4-7-8, CBT-i và nhật ký cảm xúc trong khu vườn thiền định' },
      ],
      iphoneLabel: 'TinniMate trên iPhone',
      watchLabel: 'Companion App trên Apple Watch',
      appStore: 'Tải trên App Store',
      googlePlay: 'Tải trên Google Play',
      comingSoon: 'Sắp ra mắt',
      phoneFeatures: 'Phone app features',
    },
    lifestyle: {
      badge: '🌱 Hành trình cải thiện',
      title1: 'Không phải chữa khỏi,',
      title2: 'mà là sống tốt hơn',
      desc: 'Ù tai có thể không biến mất hoàn toàn, nhưng bạn có thể kiểm soát và giảm thiểu tác động của nó lên cuộc sống. TinniMate đồng hành cùng bạn mỗi ngày.',
      times: [
        { emoji: '🌅', title: 'Buổi sáng', desc: 'Check-in tâm trạng, nghe Zentones 15 phút trước khi bắt đầu ngày' },
        { emoji: '🌙', title: 'Buổi tối', desc: 'Sound Mixer với tiếng mưa, hít thở 4-7-8, giảm dần ù tai trước khi ngủ' },
        { emoji: '📊', title: 'Hàng tuần', desc: 'Theo dõi THI score, chat với Tinni về tiến triển, điều chỉnh liệu trình' },
      ],
    },
    testimonials: {
      badge: '10,000+ người dùng tin tưởng',
      title1: 'Người dùng', title2: 'nói gì',
      items: [
        { name: 'Minh Anh', role: 'Nhân viên văn phòng, 32 tuổi', text: 'TinniMate giúp tôi ngủ ngon hơn hẳn. Tiếng sóng biển + hít thở 4-7-8 thực sự hiệu quả. Sau 2 tháng, tôi hầu như không còn để ý đến tiếng ù nữa.', duration: '2 tháng', metric: 'Cải thiện giấc ngủ' },
        { name: 'Nguyễn Văn Hùng', role: 'Đã nghỉ hưu, 65 tuổi', text: 'Ù tai 5 năm, thử nhiều cách không hiệu quả. Dùng TinniMate 3 tháng, THI giảm từ 56 xuống 32.', duration: '3 tháng', metric: 'THI: 56 → 32' },
        { name: 'BS. Trần Thu Hà', role: 'Bác sĩ Tai Mũi Họng', text: 'Tôi giới thiệu cho bệnh nhân dùng hỗ trợ tại nhà. Bộ câu hỏi chuẩn quốc tế THI, TFI giúp tôi theo dõi tiến triển từ xa.', duration: 'Chuyên gia', metric: 'Recommended' },
      ],
      social: [
        { value: '4.8★', label: 'Đánh giá trung bình', color: 'text-yellow-400' },
        { value: '10K+', label: 'Người dùng tin tưởng', color: 'text-pink-400' },
        { value: '89%', label: 'Cải thiện sau 3 tháng', color: 'text-emerald-400' },
      ],
    },
    pricing: {
      title1: 'Bảng giá', title2: 'đơn giản',
      desc: 'Bắt đầu miễn phí, nâng cấp khi bạn cần',
      popular: 'Phổ biến nhất',
      plans: [
        { name: 'Free', price: '0đ', period: '/tháng', features: ['5 tin nhắn/ngày', '3 preset âm thanh', '1 kiểm tra tai/tháng', '1 bộ câu hỏi/tháng'], cta: 'Bắt đầu miễn phí' },
        { name: 'Premium', price: '99K', period: '/tháng', features: ['Chat không giới hạn', 'Toàn bộ âm thanh trị liệu', 'Tất cả bộ câu hỏi', 'Biểu đồ tiến triển', 'Bài tập thư giãn', 'Export báo cáo'], cta: 'Nâng cấp Premium', highlight: true },
        { name: 'Pro', price: '199K', period: '/tháng', features: ['Mọi tính năng Premium', 'Tư vấn chuyên gia thính học', 'Chia sẻ gia đình (3 người)', 'Ưu tiên phản hồi AI', 'API access'], cta: 'Nâng cấp Pro' },
      ],
    },
    cta: { title: 'Sẵn sàng kiểm soát tiếng ù?', desc: 'Hàng ngàn người đã cải thiện chất lượng cuộc sống với TinniMate. Bắt đầu hành trình của bạn ngay hôm nay.', btn: 'Bắt đầu miễn phí →' },
    footer: { tagline: 'TinniMate — Đồng hành cùng bạn kiểm soát ù tai', privacy: 'Chính sách bảo mật', terms: 'Điều khoản sử dụng', contact: 'Liên hệ' },
    botanicalApp: {
      badge: '🌿 Khu vườn chữa lành trên tay bạn',
      title1: 'Trên web, khoa học.',
      title2: 'Trên app, chữa lành.',
      desc: 'Trang web cung cấp nền tảng lâm sàng — đánh giá, theo dõi, tư vấn chuyên sâu. Khi bạn mở app di động, bạn bước vào một khu vườn thiền định thực sự, được thiết kế để phục hồi tâm trí và cảm xúc.',
      webLabel: 'Nền tảng web', appLabel: 'App di động',
      webTitle: 'Khoa học & Lâm sàng', appTitle: 'Khu vườn chữa lành',
      webDesc: 'Nơi bạn đo lường, theo dõi và hiểu rõ tình trạng ù tai của mình qua các công cụ được quốc tế công nhận.',
      appDesc: 'Nơi bạn thực sự hít thở, thư giãn và chữa lành — âm thanh thiên nhiên, hơi thở có hướng dẫn, khu vườn riêng mỗi ngày.',
      webFeatures: ['Đánh giá THI/TFI/ISI chuẩn WHO', 'Biểu đồ tiến triển theo thời gian', 'Chat chẩn đoán với Tinni AI', 'Notch therapy & kiểm tra thính lực'],
      appFeatures: ['Botanical Healing Garden — khu vườn đa giác quan', 'Âm thanh thiên nhiên ru ngủ (Mưa · Sóng · Rừng)', 'Thiền hơi thở 4·7·8 với hoa thở sống động', 'Nhật ký cảm xúc & theo dõi tiến trình hàng ngày'],
      journeyWeb: 'Hiểu & theo dõi', journeyBridge: 'tải app', journeyApp: 'Chữa lành & thư giãn',
    },
    watchRoadmap: {
      badge: 'On Your Wrist',
      title: 'Healing on Your Wrist:',
      titleAccent: 'Tinnimate for Apple Watch.',
      desc: 'Ba màn hình đồng hành — theo dõi hành trình, phát âm thanh thiền định, và hướng dẫn hít thở 4-7-8 ngay trên cổ tay bạn.',
      screens: [
        { label: 'Hành trình 12 ngày', desc: 'Theo dõi tiến trình chữa lành' },
        { label: 'Đang phát: Mưa rừng', desc: 'Âm thanh trị liệu & điều khiển' },
        { label: 'Nhịp thở 4-7-8', desc: 'Hướng dẫn hít thở trực quan' },
      ],
      features: [
        { icon: '🌸', title: 'Hành trình chữa lành', desc: 'Theo dõi 12-ngày với hoa cúc thiền định trực quan' },
        { icon: '🎵', title: 'Phát nhạc trị liệu', desc: 'Điều khiển âm thanh Mưa, Rừng, Sóng trực tiếp' },
        { icon: '🌬️', title: 'Nhịp thở 4-7-8', desc: 'Hướng dẫn hít thở bằng vòng tròn động trên cổ tay' },
      ],
      notifyText: 'Nhận thông báo khi ra mắt',
    },
  },
  en: {
    nav: { features: 'Features', how: 'How it Works', pricing: 'Pricing', testimonials: 'Reviews', login: 'Log in', cta: 'Get Started' },
    hero: {
      badge: '#1 Tinnitus Therapy App',
      title1: "You're not alone",
      title2: 'in the battle against',
      title3: 'tinnitus',
      desc: 'Understand the mechanism. Break the cycle. Control the ringing. TinniMate helps you live in harmony with tinnitus through evidence-based sound therapy.',
      cta1: '💬 Free Consultation with Tinni', cta2: 'Learn how it works',
      online: 'Tinni is online 24/7',
      stat1: 'Users', stat2: 'Therapy Sessions', stat3: 'Rating',
    },
    chat: { title: 'Chat with Tinni 💙', input: 'Message Tinni...', playing: 'Playing White Noise — 30 min' },
    chatMsgs: [
      { 'role': 'assistant', 'content': "Hello! I'm Tinni 💙 How are you feeling today?" },
      { 'role': 'user', 'content': "My tinnitus is really loud tonight, can't sleep..." },
      { 'role': 'assistant', 'content': "I understand, that sounds really tough 😔 Want me to play White Noise to help you relax?" },
    ],
    education: {
      badge: '🔬 Understand to control',
      title1: "The ringing isn't from",
      title2: 'your ears',
      desc: "Tinnitus is a phenomenon where the brain generates phantom sounds without any external source. It's not a disease — it's a signal that your auditory nervous system needs attention.",
      stats: [
        { value: '15-20%', label: 'Global population has tinnitus' },
        { value: '70%', label: 'Related to hearing loss' },
        { value: '50M', label: 'Americans have tinnitus' },
      ],
      pathway: ['Outer Ear', 'Cochlea', 'Auditory Nerve', 'Brain'],
      pathwayNote: '⚡ Signal misfire in the brain',
    },
    cycle: {
      title1: 'The vicious',
      title2: 'cycle',
      desc: "Tinnitus causes anxiety, anxiety causes insomnia, insomnia makes the brain more sensitive, and tinnitus gets worse. This is the cycle millions are trapped in.",
      steps: [
        { emoji: '🔊', label: 'Tinnitus', sub: 'Phantom sound from the brain' },
        { emoji: '😰', label: 'Anxiety & stress', sub: 'Negative emotional response' },
        { emoji: '😵', label: 'Insomnia', sub: 'Poor sleep quality' },
        { emoji: '🧠', label: 'Brain hyperactivity', sub: 'Overactive nervous system' },
      ],
      breakText: 'TinniMate helps break this cycle',
    },
    therapy: {
      badge: '✨ Science-based approach',
      title1: 'Sound therapy',
      title2: 'breaks the cycle',
      desc: "Based on Jastreboff's TRT (Tinnitus Retraining Therapy), TinniMate uses sound to train the brain to 'get used to' the ringing, reducing negative emotional responses.",
      methods: [
        { icon: '🎵', title: 'TRT — Retraining', desc: 'The brain learns to ignore tinnitus through controlled sound exposure', tag: 'Jastreboff Method' },
        { icon: '🧠', title: 'CBT-i — Cognitive Behavioral', desc: 'Change how you think about tinnitus, reduce anxiety and improve sleep', tag: 'WHO Standard' },
        { icon: '🎯', title: 'Notch Therapy', desc: 'Precisely filter tinnitus frequency, suppress related neural activity', tag: 'TinniMate Exclusive', exclusive: true },
      ],
      positive: [
        { emoji: '🎵', label: 'Sound therapy' },
        { emoji: '😴', label: 'Better sleep' },
        { emoji: '😌', label: 'Less anxiety' },
        { emoji: '🔇', label: 'Lower tinnitus' },
        { emoji: '🌟', label: 'Better quality of life' },
      ],
    },
    features: {
      badge: 'Comprehensive clinical platform',
      title: 'Specialized', title2: 'tools',
      desc: 'A comprehensive platform built on clinical research — helping you understand, manage and improve tinnitus every day',
      items: [
        { icon: '✨', title: 'Zentones', subtitle: 'Proprietary sound method', desc: "TinniMate's exclusive fractal audio technology — tuned to each person's tinnitus frequency, stimulating neuroplasticity.", tags: ['Fractal Melody', 'Personalized', 'Neuroplasticity'], exclusive: true, accent: 'amber' },
        { icon: '📋', title: 'Clinical Diagnostics', subtitle: 'International standard questionnaires', desc: 'Assess tinnitus severity with 5 WHO-recognized scales. AI analyzes and recommends therapy.', tags: ['THI', 'TFI', 'ISI', 'PHQ-9', 'GAD-7'], exclusive: false, accent: 'violet' },
        { icon: '🧠', title: 'Tinnitus Management', subtitle: 'CBT · Sound · Relaxation', desc: 'Combines CBT-i, 11 sound therapies and relaxation exercises.', tags: ['CBT-i', 'White Noise', '4-7-8', 'Sound Mixer'], exclusive: false, accent: 'emerald' },
        { icon: '🎯', title: 'Notch Therapy', subtitle: 'Precision frequency filtering', desc: 'Precisely filter tinnitus frequency, suppress related neural activity.', tags: ['Frequency Filter', 'Neural Inhibition'], exclusive: true, accent: 'red' },
        { icon: '👂', title: 'Hearing Utilities', subtitle: 'Audiometry & tracking', desc: 'Test hearing with clinical-grade Hughson-Westlake at 6 frequencies.', tags: ['Audiometry', 'Hughson-Westlake', 'Progress Chart'], exclusive: false, accent: 'cyan' },
      ],
    },
    mobileApp: {
      badge: '📱 A healing garden in your hands',
      headline: 'Tinnimate —',
      headline2: 'Botanical Healing Garden',
      desc: 'Experience sound therapy, meditation and tinnitus tracking in a serene natural space — designed to restore your mind and emotions every day.',
      features: [
        { icon: '🎵', title: 'Immersive Sound Library', desc: 'A living library of nature therapy sounds — Rain, Ocean, Forest, Zentones' },
        { icon: '🤖', title: 'AI Guide Companion', desc: 'Tinni AI with you 24/7, suggesting exercises and advice whenever you need' },
        { icon: '🌿', title: 'Mindfulness Tool Garden', desc: '4-7-8 breathing, CBT-i exercises and emotional journal in a meditation garden' },
      ],
      iphoneLabel: 'TinniMate on iPhone',
      watchLabel: 'Companion App on Apple Watch',
      appStore: 'Download on App Store',
      googlePlay: 'Get on Google Play',
      comingSoon: 'Coming Soon',
      phoneFeatures: 'Phone app features',
    },
    lifestyle: {
      badge: '🌱 Journey to improvement',
      title1: "Not about curing,",
      title2: "but living better",
      desc: "Tinnitus may never fully disappear, but you can control and minimize its impact on your life. TinniMate walks with you every day.",
      times: [
        { emoji: '🌅', title: 'Morning', desc: 'Mood check-in, listen to Zentones for 15 minutes before starting the day' },
        { emoji: '🌙', title: 'Evening', desc: 'Sound Mixer with rain, 4-7-8 breathing, gradually reduce tinnitus before sleep' },
        { emoji: '📊', title: 'Weekly', desc: 'Track THI score, chat with Tinni about progress, adjust therapy plan' },
      ],
    },
    testimonials: {
      badge: '10,000+ people trust TinniMate',
      title1: 'What users', title2: 'say',
      items: [
        { name: 'Minh Anh', role: 'Office worker, 32', text: 'TinniMate helped me sleep so much better. Ocean waves + 4-7-8 breathing actually works. After 2 months, I barely notice the ringing.', duration: '2 months', metric: 'Improved sleep' },
        { name: 'Nguyen Van Hung', role: 'Retired, age 65', text: '5 years of tinnitus, tried everything. After 3 months with TinniMate, my THI dropped from 56 to 32.', duration: '3 months', metric: 'THI: 56 → 32' },
        { name: 'Dr. Tran Thu Ha', role: 'ENT Specialist', text: 'I recommend it to my patients. THI/TFI questionnaires help me track treatment progress remotely.', duration: 'Expert', metric: 'Recommended' },
      ],
      social: [
        { value: '4.8★', label: 'Average rating', color: 'text-yellow-400' },
        { value: '10K+', label: 'Trusted users', color: 'text-pink-400' },
        { value: '89%', label: 'Improved in 3 months', color: 'text-emerald-400' },
      ],
    },
    pricing: {
      title1: 'Simple', title2: 'pricing',
      desc: 'Start free, upgrade when you need more',
      popular: 'Most Popular',
      plans: [
        { name: 'Free', price: '$0', period: '/month', features: ['5 messages/day', '3 basic sounds', '1 hearing test/month', '1 questionnaire/month'], cta: 'Start Free' },
        { name: 'Premium', price: '$4.99', period: '/month', features: ['Unlimited chat', 'All 11 sound therapies', 'All 5 questionnaires', 'Progress charts', 'Relaxation exercises', 'Export reports'], cta: 'Upgrade to Premium', highlight: true },
        { name: 'Pro', price: '$9.99', period: '/month', features: ['All Premium features', 'Audiologist consultation', 'Family sharing (3 people)', 'Priority AI responses', 'API access'], cta: 'Upgrade to Pro' },
      ],
    },
    cta: { title: 'Ready to take control?', desc: 'Thousands of people have improved their quality of life with TinniMate. Start your journey today.', btn: 'Start Free →' },
    footer: { tagline: 'TinniMate — Your tinnitus companion', privacy: 'Privacy Policy', terms: 'Terms of Service', contact: 'Contact' },
    botanicalApp: {
      badge: '🌿 A healing garden in your pocket',
      title1: 'On web, clinical.',
      title2: 'On app, healing.',
      desc: 'The website provides the clinical foundation — assessments, tracking, expert consultation. When you open the mobile app, you step into a real meditation garden, designed to restore your mind and emotions.',
      webLabel: 'Web platform', appLabel: 'Mobile app',
      webTitle: 'Science & Clinical', appTitle: 'Healing Garden',
      webDesc: 'Where you measure, track, and deeply understand your tinnitus through internationally validated tools.',
      appDesc: 'Where you actually breathe, relax and heal — nature sounds, guided breathing, your own private garden every day.',
      webFeatures: ['WHO-standard THI/TFI/ISI assessments', 'Progress charts over time', 'Diagnostic chat with Tinni AI', 'Notch therapy & audiometry'],
      appFeatures: ['Botanical Healing Garden — multi-sensory experience', 'Nature sounds for sleep (Rain · Ocean · Forest)', 'Guided 4·7·8 breathing with animated flower', 'Daily emotional journal & progress tracking'],
      journeyWeb: 'Understand & track', journeyBridge: 'download app', journeyApp: 'Heal & relax',
    },
    watchRoadmap: {
      badge: 'On Your Wrist',
      title: 'Healing on Your Wrist:',
      titleAccent: 'Tinnimate for Apple Watch.',
      desc: 'Three companion screens — track your journey, play meditation sounds, and follow 4-7-8 breathing guidance right on your wrist.',
      screens: [
        { label: '12-day Journey', desc: 'Track your healing progress' },
        { label: 'Playing: Forest Rain', desc: 'Sound therapy & controls' },
        { label: '4-7-8 Breathing', desc: 'Visual breathing guidance' },
      ],
      features: [
        { icon: '🌸', title: 'Healing Journey', desc: 'Track 12 days with a visual meditation daisy' },
        { icon: '🎵', title: 'Therapy Sound Player', desc: 'Control Rain, Forest, Ocean sounds directly' },
        { icon: '🌬️', title: '4-7-8 Breathing', desc: 'Animated breathing circle guide on your wrist' },
      ],
      notifyText: 'Notify me when launched',
    },
  },
}

/* ── Scroll animation hook ── */
function useScrollReveal() {
  const ref = useRef<HTMLDivElement>(null)
  const [visible, setVisible] = useState(false)
  useEffect(() => {
    const el = ref.current
    if (!el) return
    const fallback = setTimeout(() => setVisible(true), 300)
    const obs = new IntersectionObserver(
      ([e]) => { if (e.isIntersecting) { setVisible(true); clearTimeout(fallback); obs.disconnect() } },
      { threshold: 0 }
    )
    obs.observe(el)
    return () => { obs.disconnect(); clearTimeout(fallback) }
  }, [])
  return { ref, visible }
}

function RevealSection({ children, className = '', delay = 0 }: { children: React.ReactNode; className?: string; delay?: number }) {
  const { ref, visible } = useScrollReveal()
  return (
    <div
      ref={ref}
      className={`transition-all duration-700 ${visible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-6 pointer-events-none'} ${className}`}
      style={{ transitionDelay: `${delay}ms` }}>
      {children}
    </div>
  )
}

function LotusDecor({ size = 64, color = '#A8C5A0' }: { size?: number; color?: string }) {
  const cx = size / 2, cy = size / 2
  const petalLen = size * 0.30, petalW = size * 0.10, offset = size * 0.16
  return (
    <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} fill="none">
      {[0, 45, 90, 135, 180, 225, 270, 315].map((deg, i) => {
        const rad = (deg * Math.PI) / 180
        const ox = cx + Math.sin(rad) * offset
        const oy = cy - Math.cos(rad) * offset
        return (
          <ellipse key={i} cx={ox} cy={oy} rx={petalW * 0.55} ry={petalLen * 0.55}
            fill={color} opacity={i % 2 === 0 ? 0.6 : 0.35}
            transform={`rotate(${deg} ${ox} ${oy})`} />
        )
      })}
      <circle cx={cx} cy={cy} r={size * 0.10} fill={color} opacity={0.9} />
    </svg>
  )
}

export default function LandingPage() {
  const { lang, toggle: toggleLang } = useLangStore()
  const lt = T[lang]

  return (
    <div className="min-h-screen bg-[#151120] text-[#E7DFF5] overflow-hidden">

      {/* ── Ambient Background ── */}
      <div className="fixed inset-0 -z-10 overflow-hidden pointer-events-none">
        <div className="absolute top-[-20%] left-[-10%] w-[700px] h-[700px] rounded-full bg-violet-600/15 blur-[140px] animate-pulse" />
        <div className="absolute top-[25%] right-[-15%] w-[600px] h-[600px] rounded-full bg-[#C7BFFF]/10 blur-[130px] animate-pulse [animation-delay:2s]" />
        <div className="absolute bottom-[-10%] left-[25%] w-[500px] h-[500px] rounded-full bg-[#FBBC00]/5 blur-[120px] animate-pulse [animation-delay:4s]" />
        <div className="absolute top-[55%] left-[5%] w-[350px] h-[350px] rounded-full bg-indigo-600/10 blur-[100px] animate-pulse [animation-delay:3s]" />
      </div>

      {/* ── Navbar ── */}
      <nav className="fixed top-0 inset-x-0 z-50 border-b border-white/5 bg-[#151120]/60 backdrop-blur-xl">
        <div className="mx-auto max-w-6xl flex items-center justify-between px-6 h-16">
          <Link href="/" className="flex items-center gap-2.5">
            <div className="relative w-8 h-8 flex-shrink-0">
              <div className="aurora-orb-glow absolute inset-0 rounded-full bg-indigo-500/50 blur-md" />
              <div className="relative w-8 h-8 rounded-full overflow-hidden border border-white/20 shadow-lg shadow-indigo-500/30">
                <div className="aurora-orb-blob absolute inset-[-30%] rounded-full"
                  style={{ background: 'conic-gradient(from 0deg, #4f46e5, #7c3aed, #FBBC00, #ec4899, #4f46e5)' }} />
                <div className="absolute inset-0 bg-gradient-to-br from-white/10 to-transparent rounded-full" />
              </div>
            </div>
            <span className="font-bold text-lg text-white tracking-wide">Tinnimate</span>
          </Link>
          <div className="hidden md:flex items-center gap-8 text-sm text-[#938F9C]">
            <a href="#education" className="hover:text-white transition-colors">{lang === 'vi' ? 'Ù tai là gì' : 'What is Tinnitus'}</a>
            <a href="#features" className="hover:text-white transition-colors">{lt.nav.features}</a>
            <a href="#testimonials" className="hover:text-white transition-colors">{lt.nav.testimonials}</a>
            <a href="#pricing" className="hover:text-white transition-colors">{lt.nav.pricing}</a>
          </div>
          <div className="flex items-center gap-3">
            <button onClick={toggleLang}
              className="px-3 py-1.5 text-xs font-medium border border-white/10 rounded-full text-[#938F9C] hover:text-white hover:border-white/25 transition-all">
              {lang === 'vi' ? '🇬🇧 EN' : '🇻🇳 VI'}
            </button>
            <Link href="/login" className="px-4 py-2 text-sm text-[#CAC5CC] hover:text-white transition-colors hidden sm:block">
              {lt.nav.login}
            </Link>
            <Link href="/signup" className="px-5 py-2 text-sm font-bold bg-gradient-to-r from-[#FBBC00] to-[#FFA726] hover:from-[#FFA726] hover:to-[#FFB74D] text-[#402D00] shadow-lg shadow-[#FBBC00]/20 rounded-full transition-all">
              {lt.nav.cta}
            </Link>
          </div>
        </div>
      </nav>

      {/* ═══════════════════════════════════════════ */}
      {/* ── SECTION 1: HERO — 3D Brain ── */}
      {/* ═══════════════════════════════════════════ */}
      <BrainHero lang={lang} />

      {/* ═══════════════════════════════════════════ */}
      {/* ── SECTION 2: TINNITUS EDUCATION ── */}
      {/* ═══════════════════════════════════════════ */}
      <section id="education" className="py-24 px-6">
        <div className="mx-auto max-w-6xl">
          <RevealSection>
            <div className="text-center mb-16">
              <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-[#C7BFFF]/10 border border-[#C7BFFF]/20 text-[#C7BFFF] text-xs font-medium mb-5">
                <span className="w-1.5 h-1.5 rounded-full bg-[#C7BFFF] animate-pulse" />
                {lt.education.badge}
              </div>
              <h2 className="text-3xl md:text-5xl font-bold mb-4">
                {lt.education.title1}{' '}
                <span className="text-gradient-lavender">{lt.education.title2}</span>
              </h2>
              <p className="text-[#938F9C] max-w-2xl mx-auto text-sm leading-relaxed">{lt.education.desc}</p>
            </div>
          </RevealSection>

          <div className="grid lg:grid-cols-2 gap-12 items-center">
            {/* Left: Auditory pathway infographic */}
            <RevealSection delay={100}>
              <div className="relative bg-white/[0.02] backdrop-blur border border-white/5 rounded-3xl p-4 sm:p-8 overflow-hidden">
                <div className="absolute top-0 right-0 w-48 h-48 bg-[#C7BFFF]/5 blur-[80px] rounded-full" />
                <h3 className="text-sm font-semibold text-[#C7BFFF] mb-4 sm:mb-6 uppercase tracking-wider">
                  {lang === 'vi' ? 'Đường dẫn thính giác' : 'Auditory Pathway'}
                </h3>
                <div className="flex items-center justify-between gap-1">
                  {lt.education.pathway.map((step: string, i: number) => (
                    <div key={i} className="flex items-center gap-1 flex-1">
                      <div className={`flex flex-col items-center gap-1 sm:gap-2 flex-1 ${i === 3 ? 'relative' : ''}`}>
                        <div className={`w-10 h-10 sm:w-14 sm:h-14 rounded-xl sm:rounded-2xl flex items-center justify-center text-lg sm:text-2xl ${
                          i === 3
                            ? 'bg-gradient-to-br from-red-500/30 to-orange-500/20 border border-red-400/30 pulse-ring'
                            : 'bg-white/[0.06] border border-white/10'
                        }`}>
                          {['👂', '🐚', '⚡', '🧠'][i]}
                        </div>
                        <span className="text-[10px] text-[#938F9C] text-center leading-tight">{step}</span>
                        {i === 3 && (
                          <span className="text-[9px] text-red-400 font-medium">{lt.education.pathwayNote}</span>
                        )}
                      </div>
                      {i < 3 && (
                        <div className="text-[#484551] text-lg mb-6">→</div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            </RevealSection>

            {/* Right: Stats cards */}
            <div className="grid gap-4">
              {lt.education.stats.map((stat: any, i: number) => (
                <RevealSection key={i} delay={150 + i * 100}>
                  <div className="flex items-center gap-5 bg-white/[0.03] border border-white/5 rounded-2xl p-5 hover:bg-white/[0.05] hover:border-[#C7BFFF]/20 transition-all group">
                    <span className={`text-4xl font-black ${
                      ['text-gradient-amber', 'text-[#C7BFFF]', 'text-[#FFB77F]'][i]
                    }`} style={i === 0 ? {background:'linear-gradient(90deg,#FBBC00,#FFA726)',WebkitBackgroundClip:'text',WebkitTextFillColor:'transparent'} : undefined}>
                      {stat.value}
                    </span>
                    <span className="text-sm text-[#CAC5CC] group-hover:text-white transition-colors">{stat.label}</span>
                  </div>
                </RevealSection>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ═══════════════════════════════════════════ */}
      {/* ── SECTION 3: VICIOUS CYCLE ── */}
      {/* ═══════════════════════════════════════════ */}
      <section className="py-24 px-6 relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-b from-transparent via-red-950/5 to-transparent pointer-events-none" />
        <div className="mx-auto max-w-4xl relative">
          <RevealSection>
            <div className="text-center mb-16">
              <h2 className="text-3xl md:text-5xl font-bold mb-4">
                {lt.cycle.title1}{' '}
                <span className="text-gradient-amber">{lt.cycle.title2}</span>
              </h2>
              <p className="text-[#938F9C] max-w-xl mx-auto text-sm leading-relaxed">{lt.cycle.desc}</p>
            </div>
          </RevealSection>

          {/* Cycle diagram */}
          <RevealSection delay={200}>
            <div className="relative">
              {/* Circular layout */}
              <div className="grid grid-cols-2 gap-6 max-w-lg mx-auto">
                {lt.cycle.steps.map((step: any, i: number) => (
                  <div key={i} className="relative group">
                    <div className="bg-white/[0.03] border border-white/8 rounded-2xl p-5 text-center hover:bg-white/[0.06] hover:border-red-400/20 transition-all">
                      <div className="text-3xl mb-2">{step.emoji}</div>
                      <div className="text-sm font-semibold text-white mb-1">{step.label}</div>
                      <div className="text-[10px] text-[#938F9C]">{step.sub}</div>
                    </div>
                    {/* Arrow to next */}
                    {i < 3 && (
                      <div className={`absolute text-red-400/60 cycle-arrow font-bold text-xl ${
                        i === 0 ? 'right-[-24px] top-1/2 -translate-y-1/2' :
                        i === 1 ? 'bottom-[-24px] left-1/2 -translate-x-1/2 rotate-90' :
                        'left-[-24px] top-1/2 -translate-y-1/2 rotate-180'
                      }`} style={{animationDelay: `${i * 0.5}s`}}>
                        →
                      </div>
                    )}
                  </div>
                ))}
              </div>

              {/* Loop arrow (from step 4 back to step 1) */}
              <div className="absolute top-[-16px] left-1/2 -translate-x-1/2 text-red-400/40 cycle-arrow text-xl rotate-[-90deg]" style={{animationDelay: '1.5s'}}>
                ↻
              </div>

              {/* Break the cycle */}
              <RevealSection delay={600}>
                <div className="mt-10 flex flex-col items-center">
                  <div className="w-px h-8 bg-gradient-to-b from-red-500/40 to-[#FBBC00]/60" />
                  <div className="relative">
                    <div className="absolute inset-0 bg-[#FBBC00]/20 blur-xl rounded-full" />
                    <div className="relative px-8 py-4 bg-gradient-to-r from-[#FBBC00]/15 to-[#FFA726]/10 border border-[#FBBC00]/30 rounded-2xl text-center">
                      <div className="text-2xl mb-1">✨</div>
                      <div className="text-sm font-bold text-[#FBBC00]">{lt.cycle.breakText}</div>
                    </div>
                  </div>
                </div>
              </RevealSection>
            </div>
          </RevealSection>
        </div>
      </section>

      {/* ═══════════════════════════════════════════ */}
      {/* ── SECTION 4: SOUND THERAPY SOLUTION ── */}
      {/* ═══════════════════════════════════════════ */}
      <section className="py-24 px-6">
        <div className="mx-auto max-w-6xl">
          <RevealSection>
            <div className="text-center mb-16">
              <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-[#FBBC00]/10 border border-[#FBBC00]/20 text-[#FBBC00] text-xs font-medium mb-5">
                <span className="w-1.5 h-1.5 rounded-full bg-[#FBBC00] animate-pulse" />
                {lt.therapy.badge}
              </div>
              <h2 className="text-3xl md:text-5xl font-bold mb-4">
                {lt.therapy.title1}{' '}
                <span className="text-shimmer">{lt.therapy.title2}</span>
              </h2>
              <p className="text-[#938F9C] max-w-2xl mx-auto text-sm leading-relaxed">{lt.therapy.desc}</p>
            </div>
          </RevealSection>

          {/* 3 Methods */}
          <div className="grid md:grid-cols-3 gap-6 mb-16">
            {lt.therapy.methods.map((m: any, i: number) => (
              <RevealSection key={i} delay={i * 150}>
                <div className={`relative bg-white/[0.03] border rounded-2xl p-6 h-full hover:bg-white/[0.06] transition-all group ${
                  m.exclusive ? 'border-[#FBBC00]/25 hover:border-[#FBBC00]/40' : 'border-white/5 hover:border-[#C7BFFF]/20'
                }`}>
                  {m.exclusive && (
                    <div className="absolute top-3 right-3 px-2.5 py-1 rounded-full bg-[#FBBC00]/15 border border-[#FBBC00]/30 text-[#FBBC00] text-[9px] font-semibold">
                      ⚡ {lang === 'vi' ? 'Độc quyền' : 'Exclusive'}
                    </div>
                  )}
                  <div className="text-3xl mb-3">{m.icon}</div>
                  <h3 className="text-lg font-bold text-white mb-2">{m.title}</h3>
                  <p className="text-sm text-[#938F9C] leading-relaxed mb-4">{m.desc}</p>
                  <span className={`inline-block px-3 py-1 rounded-full text-[10px] font-medium ${
                    m.exclusive
                      ? 'bg-[#FBBC00]/10 border border-[#FBBC00]/20 text-[#FBBC00]'
                      : 'bg-[#C7BFFF]/10 border border-[#C7BFFF]/20 text-[#C7BFFF]'
                  }`}>
                    {m.tag}
                  </span>
                </div>
              </RevealSection>
            ))}
          </div>

          {/* Positive cycle */}
          <RevealSection delay={400}>
            <div className="relative bg-gradient-to-r from-emerald-500/5 via-[#C7BFFF]/5 to-[#FBBC00]/5 border border-emerald-500/15 rounded-3xl p-8 overflow-hidden">
              <div className="absolute top-0 left-0 w-48 h-48 bg-emerald-500/10 blur-[80px] rounded-full" />
              <h3 className="text-center text-sm font-semibold text-emerald-400 mb-6 uppercase tracking-wider">
                {lang === 'vi' ? 'Vòng tròn tích cực' : 'The Positive Cycle'}
              </h3>
              <div className="flex items-center justify-center gap-3 flex-wrap relative">
                {lt.therapy.positive.map((p: any, i: number) => (
                  <div key={i} className="flex items-center gap-3">
                    <div className="bg-white/[0.06] border border-emerald-400/15 rounded-xl px-4 py-3 text-center">
                      <div className="text-xl mb-1">{p.emoji}</div>
                      <div className="text-[10px] text-[#CAC5CC] font-medium">{p.label}</div>
                    </div>
                    {i < lt.therapy.positive.length - 1 && (
                      <span className="text-emerald-400/50 text-lg">→</span>
                    )}
                  </div>
                ))}
              </div>
            </div>
          </RevealSection>
        </div>
      </section>

      {/* ═══════════════════════════════════════════ */}
      {/* ── SECTION 5: FEATURES BENTO GRID ── */}
      {/* ═══════════════════════════════════════════ */}
      <section id="features" className="py-24 px-6">
        <div className="mx-auto max-w-6xl">
          <RevealSection>
            <div className="text-center mb-14">
              <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 text-xs font-medium mb-5">
                <span className="w-1.5 h-1.5 rounded-full bg-indigo-400 animate-pulse" />
                {lt.features.badge}
              </div>
              <h2 className="text-3xl md:text-5xl font-bold mb-4">
                <span className="text-shimmer">{lt.features.title}</span>{' '}
                <span className="text-white">{lt.features.title2}</span>
              </h2>
              <p className="text-[#938F9C] max-w-xl mx-auto text-sm leading-relaxed">{lt.features.desc}</p>
            </div>
          </RevealSection>

          {/* Bento grid: 2-col hero + 2-row stack */}
          <div className="grid lg:grid-cols-5 gap-4 mb-4">
            {/* Zentone hero card */}
            <RevealSection delay={0} className="lg:col-span-2">
              <div className="group relative rounded-3xl overflow-hidden h-full min-h-[420px] bg-gradient-to-br from-[#FBBC00]/10 via-amber-900/10 to-[#151120] border border-[#FBBC00]/15 hover:border-[#FBBC00]/30 transition-all">
                <div className="absolute top-0 right-0 w-48 h-48 bg-[#FBBC00]/10 blur-[80px] rounded-full" />
                <div className="absolute top-4 left-4 inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-[#FBBC00]/20 border border-[#FBBC00]/40 text-[#FBBC00] text-[11px] font-semibold z-10">
                  ⚡ {lang === 'vi' ? 'Độc quyền' : 'Exclusive'}
                </div>
                <div className="absolute bottom-0 left-0 right-0 p-6">
                  <div className="text-3xl mb-2">{lt.features.items[0].icon}</div>
                  <h3 className="text-2xl font-black text-white mb-1">{lt.features.items[0].title}</h3>
                  <p className="text-[#FBBC00]/80 text-xs font-medium mb-3">{lt.features.items[0].subtitle}</p>
                  <p className="text-sm text-white/70 leading-relaxed mb-4">{lt.features.items[0].desc}</p>
                  <div className="flex flex-wrap gap-1.5">
                    {lt.features.items[0].tags.map((tag: string) => (
                      <span key={tag} className="px-2.5 py-1 rounded-lg bg-white/10 border border-white/15 text-[10px] text-white/80">{tag}</span>
                    ))}
                  </div>
                </div>
              </div>
            </RevealSection>

            {/* Right 2-row stack */}
            <div className="lg:col-span-3 grid grid-rows-2 gap-4">
              {lt.features.items.slice(1, 3).map((item: any, i: number) => (
                <RevealSection key={i} delay={100 + i * 100}>
                  <div className={`group relative rounded-3xl overflow-hidden min-h-[200px] bg-white/[0.02] border border-white/5 hover:border-${item.accent}-400/30 transition-all p-6 flex flex-col justify-between`}>
                    <div className={`absolute top-0 right-0 w-32 h-32 bg-${item.accent}-500/8 blur-3xl rounded-full`} />
                    <div className="flex items-start justify-between">
                      <div>
                        <span className="text-2xl">{item.icon}</span>
                        <h3 className="text-xl font-bold text-white mt-1">{item.title}</h3>
                        <p className="text-[#C7BFFF] text-xs mt-0.5">{item.subtitle}</p>
                      </div>
                      <div className="flex flex-wrap gap-1 justify-end max-w-[200px]">
                        {item.tags.map((tag: string) => (
                          <span key={tag} className="px-2 py-0.5 rounded-md bg-white/[0.06] border border-white/10 text-white/60 text-[9px]">{tag}</span>
                        ))}
                      </div>
                    </div>
                    <p className="text-sm text-white/65 leading-relaxed mt-3 max-w-[70%]">{item.desc}</p>
                  </div>
                </RevealSection>
              ))}
            </div>
          </div>

          {/* Row 2: Notch + Hearing */}
          <div className="grid md:grid-cols-2 gap-4">
            {lt.features.items.slice(3).map((item: any, i: number) => (
              <RevealSection key={i} delay={200 + i * 100}>
                <div className={`group relative rounded-3xl overflow-hidden min-h-[260px] bg-white/[0.02] border hover:border-${item.accent}-400/30 transition-all p-6 flex flex-col justify-end ${
                  item.exclusive ? 'border-' + item.accent + '-500/15' : 'border-white/5'
                }`}>
                  <div className={`absolute bottom-0 left-0 w-32 h-32 bg-${item.accent}-500/8 blur-3xl rounded-full`} />
                  {item.exclusive && (
                    <div className="absolute top-4 right-4 inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-red-500/15 border border-red-400/30 text-red-300 text-[11px] font-semibold">
                      🔒 {lang === 'vi' ? 'Độc quyền' : 'Exclusive'}
                    </div>
                  )}
                  <div className="text-2xl mb-1">{item.icon}</div>
                  <h3 className="text-xl font-bold text-white">{item.title}</h3>
                  <p className="text-[#C7BFFF] text-xs mb-2">{item.subtitle}</p>
                  <p className="text-sm text-white/65 leading-relaxed mb-3">{item.desc}</p>
                  <div className="flex flex-wrap gap-1.5">
                    {item.tags.map((tag: string) => (
                      <span key={tag} className="px-2.5 py-1 rounded-lg bg-white/10 border border-white/15 text-[10px] text-white/80">{tag}</span>
                    ))}
                  </div>
                </div>
              </RevealSection>
            ))}
          </div>
        </div>
      </section>

      {/* ═══════════════════════════════════════════ */}
      {/* ── SECTION 5b: MOBILE APP — BOTANICAL STYLE ── */}
      {/* ═══════════════════════════════════════════ */}
      <section className="py-6 px-0 relative overflow-hidden">
        <div className="relative rounded-3xl mx-4 md:mx-8 overflow-hidden"
             style={{ background: 'linear-gradient(135deg, #F5F0E8 0%, #EDE8DC 40%, #E8EDE4 100%)' }}>
          {/* Botanical leaf decor */}
          <div className="absolute top-0 right-0 w-72 h-72 opacity-[0.07] pointer-events-none select-none"
               style={{ backgroundImage: "url(\"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 200 200'%3E%3Cellipse cx='100' cy='60' rx='40' ry='90' fill='%234A7C59' transform='rotate(-20 100 100)'/%3E%3Cellipse cx='100' cy='60' rx='40' ry='90' fill='%234A7C59' transform='rotate(20 100 100)'/%3E%3C/svg%3E\")", backgroundSize: 'cover' }} />
          <div className="absolute bottom-0 left-0 w-56 h-56 opacity-[0.05] pointer-events-none select-none"
               style={{ backgroundImage: "url(\"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 200 200'%3E%3Cellipse cx='100' cy='60' rx='40' ry='90' fill='%234A7C59' transform='rotate(-35 100 100)'/%3E%3C/svg%3E\")", backgroundSize: 'cover' }} />

          <div className="mx-auto max-w-6xl px-8 md:px-14 py-20">
            <div className="grid lg:grid-cols-2 gap-10 items-center">

              {/* Left: Headline + features */}
              <RevealSection>
                <div>
                  {/* Badge */}
                  <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-[#4A7C59]/10 border border-[#4A7C59]/20 text-[#4A7C59] text-xs font-medium mb-6">
                    <LotusDecor size={14} color="#4A7C59" />
                    {lt.mobileApp.badge}
                  </div>

                  {/* Big headline */}
                  <h2 className="font-black text-[#1A1A1A] leading-tight mb-3"
                      style={{ fontSize: 'clamp(2rem, 4vw, 3.2rem)' }}>
                    {lt.mobileApp.headline}
                    <br />
                    <span className="italic" style={{ color: '#3B6348' }}>{lt.mobileApp.headline2}</span>
                  </h2>

                  <p className="text-[#6B7B6E] text-sm leading-relaxed max-w-md mb-10">
                    {lt.mobileApp.desc}
                  </p>

                  {/* Feature cards */}
                  <div className="grid gap-3 mb-8">
                    {lt.mobileApp.features.map((f: any, i: number) => (
                      <RevealSection key={i} delay={100 + i * 80}>
                        <div className="flex items-start gap-4 p-4 rounded-2xl bg-white/50 border border-white/70 hover:bg-white/70 transition-all group backdrop-blur-sm">
                          <div className="w-11 h-11 flex-shrink-0 rounded-xl flex items-center justify-center text-xl"
                               style={{ background: 'linear-gradient(135deg, #D4E8DA, #C8DFC0)' }}>
                            {f.icon}
                          </div>
                          <div>
                            <h3 className="text-sm font-bold text-[#1A1A1A] mb-0.5">{f.title}</h3>
                            <p className="text-xs text-[#6B7B6E] leading-relaxed">{f.desc}</p>
                          </div>
                        </div>
                      </RevealSection>
                    ))}
                  </div>

                  {/* Phone features label */}
                  <div className="text-xs font-semibold text-[#9BA89D] uppercase tracking-widest">
                    {lt.mobileApp.phoneFeatures}
                  </div>
                </div>
              </RevealSection>

              {/* Right: Real app screenshots in CSS iPhone frames */}
              <RevealSection delay={200}>
                <div className="relative flex items-end justify-center gap-3" style={{ minHeight: '520px' }}>
                  {/* Glow backdrop */}
                  <div className="absolute inset-0 pointer-events-none"
                       style={{ background: 'radial-gradient(ellipse at 50% 70%, rgba(74,124,89,0.14) 0%, transparent 65%)' }} />

                  {/* iPhone 1 — Home screen (back, slightly rotated) */}
                  <div className="relative z-10 self-end mb-6 hover:-translate-y-2 transition-transform duration-700"
                       style={{ transform: 'rotate(-4deg) translateY(0px)' }}>
                    {/* Phone frame */}
                    <div className="relative rounded-[44px] overflow-hidden"
                         style={{
                           width: '200px',
                           height: '430px',
                           background: '#0A0F0C',
                           boxShadow: '0 32px 80px rgba(0,0,0,0.35), 0 0 0 1.5px rgba(255,255,255,0.10), inset 0 0 0 1px rgba(255,255,255,0.04)',
                         }}>
                      {/* Dynamic Island */}
                      <div className="absolute top-3 left-1/2 -translate-x-1/2 z-20 w-24 h-7 rounded-full bg-black" />
                      {/* Screen */}
                      <div className="absolute inset-0 rounded-[44px] overflow-hidden">
                        <img
                          src="/app-screen-explore.jpg"
                          alt="TinniMate - Khu vườn chữa lành"
                          className="w-full h-full object-cover object-top"
                        />
                      </div>
                      {/* Glass sheen */}
                      <div className="absolute top-0 left-0 right-0 h-1/2 rounded-t-[44px] pointer-events-none"
                           style={{ background: 'linear-gradient(180deg, rgba(255,255,255,0.04) 0%, transparent 100%)' }} />
                    </div>
                  </div>

                  {/* iPhone 2 — Home flower screen (front, center, taller) */}
                  <div className="relative z-20 self-end hover:-translate-y-4 transition-transform duration-700 delay-75"
                       style={{ transform: 'rotate(2deg) translateY(0px)' }}>
                    {/* Phone frame */}
                    <div className="relative rounded-[46px] overflow-hidden"
                         style={{
                           width: '220px',
                           height: '470px',
                           background: '#0A0F0C',
                           boxShadow: '0 40px 100px rgba(0,0,0,0.40), 0 0 0 1.5px rgba(255,255,255,0.13), inset 0 0 0 1px rgba(255,255,255,0.05)',
                         }}>
                      {/* Dynamic Island */}
                      <div className="absolute top-3.5 left-1/2 -translate-x-1/2 z-20 w-24 h-7 rounded-full bg-black" />
                      {/* Screen */}
                      <div className="absolute inset-0 rounded-[46px] overflow-hidden">
                        <img
                          src="/app-screen-home.jpg"
                          alt="TinniMate - Trang chủ"
                          className="w-full h-full object-cover object-top"
                        />
                      </div>
                      {/* Glass sheen */}
                      <div className="absolute top-0 left-0 right-0 h-1/2 rounded-t-[46px] pointer-events-none"
                           style={{ background: 'linear-gradient(180deg, rgba(255,255,255,0.05) 0%, transparent 100%)' }} />
                    </div>
                    {/* Coming soon badges below */}
                    <div className="flex gap-2 mt-5 justify-center">
                      <div className="group relative cursor-pointer">
                        <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-[#1A1F1C] border border-[#3B6348]/30 hover:bg-[#1F2A22] transition-all">
                          <svg className="w-4 h-4 text-white" viewBox="0 0 24 24" fill="currentColor">
                            <path d="M18.71 19.5c-.83 1.24-1.71 2.45-3.05 2.47-1.34.03-1.77-.79-3.29-.79-1.53 0-2 .77-3.27.82-1.31.05-2.3-1.32-3.14-2.53C4.25 17 2.94 12.45 4.7 9.39c.87-1.52 2.43-2.48 4.12-2.51 1.28-.02 2.5.87 3.29.87.78 0 2.26-1.07 3.8-.91.65.03 2.47.26 3.64 1.98-.09.06-2.17 1.28-2.15 3.81.03 3.02 2.65 4.03 2.68 4.04-.03.07-.42 1.44-1.38 2.83M13 3.5c.73-.83 1.94-1.46 2.94-1.5.13 1.17-.34 2.35-1.04 3.19-.69.85-1.83 1.51-2.95 1.42-.15-1.15.41-2.35 1.05-3.11z"/>
                          </svg>
                          <div>
                            <div className="text-[7px] text-white/50 uppercase tracking-wider leading-none">Coming soon</div>
                            <div className="text-[10px] font-semibold text-white leading-tight">App Store</div>
                          </div>
                        </div>
                        <div className="absolute inset-0 flex items-center justify-center rounded-xl bg-[#1A1F1C]/95 backdrop-blur-sm opacity-0 group-hover:opacity-100 transition-opacity">
                          <span className="text-[9px] font-bold text-[#A8C5A0]">{lt.mobileApp.comingSoon} ✨</span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </RevealSection>

            </div>
          </div>
        </div>
      </section>

      {/* ═══════════════════════════════════════════ */}
      {/* ── SECTION 5c: HEALING GARDEN REVEAL ── */}
      {/* ═══════════════════════════════════════════ */}
      <section className="py-24 px-6 relative overflow-hidden">
        <div className="absolute inset-0 pointer-events-none">
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[700px] h-[400px] rounded-full bg-[#A8C5A0]/4 blur-[140px]" />
          <div className="absolute top-0 right-0 w-[300px] h-[300px] rounded-full bg-[#D4A574]/3 blur-[100px]" />
        </div>
        <div className="mx-auto max-w-6xl relative">
          <RevealSection>
            <div className="text-center mb-14">
              <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-[#A8C5A0]/10 border border-[#A8C5A0]/25 text-[#A8C5A0] text-xs font-medium mb-5">
                <span className="w-1.5 h-1.5 rounded-full bg-[#A8C5A0] animate-pulse" />
                {lt.botanicalApp.badge}
              </div>
              <h2 className="text-3xl md:text-5xl font-bold mb-4">
                {lt.botanicalApp.title1}{' '}
                <span className="bg-gradient-to-r from-[#A8C5A0] via-[#E8B4B8] to-[#E8C97A] bg-clip-text text-transparent italic">
                  {lt.botanicalApp.title2}
                </span>
              </h2>
              <p className="text-[#938F9C] max-w-2xl mx-auto text-sm leading-relaxed">{lt.botanicalApp.desc}</p>
            </div>
          </RevealSection>

          <div className="grid lg:grid-cols-2 gap-6">
            {/* Clinical web side */}
            <RevealSection delay={100}>
              <div className="relative rounded-3xl p-8 bg-white/[0.03] border border-violet-500/15 overflow-hidden h-full">
                <div className="absolute top-0 right-0 w-40 h-40 bg-violet-500/8 blur-[80px] rounded-full" />
                <div className="mb-5 inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-violet-500/10 border border-violet-400/20 text-violet-300 text-[11px] font-semibold">
                  💻 {lt.botanicalApp.webLabel}
                </div>
                <h3 className="text-2xl font-bold text-white mb-2">{lt.botanicalApp.webTitle}</h3>
                <p className="text-sm text-[#938F9C] leading-relaxed mb-6">{lt.botanicalApp.webDesc}</p>
                <ul className="space-y-3">
                  {lt.botanicalApp.webFeatures.map((f: string, i: number) => (
                    <li key={i} className="flex items-center gap-2.5 text-sm text-[#CAC5CC]">
                      <span className="w-5 h-5 flex-shrink-0 rounded-full bg-violet-500/15 border border-violet-400/20 flex items-center justify-center text-[10px] text-violet-300">⚕</span>
                      {f}
                    </li>
                  ))}
                </ul>
              </div>
            </RevealSection>

            {/* Botanical app side */}
            <RevealSection delay={200}>
              <div className="relative rounded-3xl p-8 border border-[#A8C5A0]/20 overflow-hidden h-full"
                   style={{ background: 'linear-gradient(135deg, #1A1F1C 0%, #1B1E1A 100%)' }}>
                <div className="absolute top-0 right-0 w-40 h-40 bg-[#A8C5A0]/6 blur-[80px] rounded-full" />
                <div className="absolute bottom-0 left-0 w-32 h-32 bg-[#D4A574]/6 blur-[60px] rounded-full" />
                <div className="absolute top-4 right-4 opacity-[0.06]">
                  <LotusDecor size={120} />
                </div>
                <div className="mb-5 inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-[#A8C5A0]/12 border border-[#A8C5A0]/25 text-[#A8C5A0] text-[11px] font-semibold">
                  🌿 {lt.botanicalApp.appLabel}
                </div>
                <h3 className="text-2xl font-bold text-[#F5EDE0] mb-2 italic">{lt.botanicalApp.appTitle}</h3>
                <p className="text-sm text-[#938F9C] leading-relaxed mb-6">{lt.botanicalApp.appDesc}</p>
                <ul className="space-y-3">
                  {lt.botanicalApp.appFeatures.map((f: string, i: number) => (
                    <li key={i} className="flex items-center gap-2.5 text-sm text-[#D4C5B5]">
                      <span className="w-5 h-5 flex-shrink-0 rounded-full bg-[#A8C5A0]/12 border border-[#A8C5A0]/25 flex items-center justify-center text-[10px] text-[#A8C5A0]">✦</span>
                      {f}
                    </li>
                  ))}
                </ul>
              </div>
            </RevealSection>
          </div>

          {/* Journey bridge */}
          <RevealSection delay={350}>
            <div className="mt-10 flex items-center justify-center gap-3 flex-wrap">
              <div className="px-5 py-3 rounded-2xl bg-white/[0.04] border border-white/8 text-sm text-[#CAC5CC] text-center min-w-[140px]">
                <div className="text-base mb-1">💻</div>
                <div className="font-medium">{lt.botanicalApp.journeyWeb}</div>
              </div>
              <div className="flex flex-col items-center gap-0.5">
                <span className="text-[#A8C5A0] text-xl">→</span>
                <span className="text-[10px] text-[#484551]">{lt.botanicalApp.journeyBridge}</span>
              </div>
              <div className="px-5 py-3 rounded-2xl bg-[#A8C5A0]/8 border border-[#A8C5A0]/18 text-sm text-[#A8C5A0] text-center min-w-[140px]">
                <div className="text-base mb-1">🌿</div>
                <div className="font-medium">{lt.botanicalApp.journeyApp}</div>
              </div>
            </div>
          </RevealSection>
        </div>
      </section>

      {/* ═══════════════════════════════════════════ */}
      {/* ── SECTION 5d: APPLE WATCH — TERRACOTTA ── */}
      {/* ═══════════════════════════════════════════ */}
      <section className="py-8 px-4 md:px-8">
        <RevealSection>
          <div className="relative rounded-3xl overflow-hidden"
               style={{ background: 'linear-gradient(135deg, #C4624A 0%, #B85540 40%, #A84D3A 100%)' }}>
            {/* Noise texture overlay */}
            <div className="absolute inset-0 opacity-[0.03] pointer-events-none"
                 style={{ backgroundImage: 'url("data:image/svg+xml,%3Csvg viewBox=\'0 0 256 256\' xmlns=\'http://www.w3.org/2000/svg\'%3E%3Cfilter id=\'n\'%3E%3CfeTurbulence type=\'fractalNoise\' baseFrequency=\'0.9\' numOctaves=\'4\'/%3E%3C/filter%3E%3Crect width=\'100%25\' height=\'100%25\' filter=\'url(%23n)\'/%3E%3C/svg%3E")', backgroundSize: '128px' }} />

            {/* Subtle top gradient vignette */}
            <div className="absolute top-0 left-0 right-0 h-32 bg-gradient-to-b from-black/10 to-transparent pointer-events-none" />

            <div className="relative mx-auto max-w-6xl px-8 md:px-14 py-16">
              <div className="grid lg:grid-cols-2 gap-12 items-center">

                {/* Left: 3 Apple Watch mockups */}
                <RevealSection delay={100}>
                  <div className="flex items-end justify-center gap-4 md:gap-6" style={{ minHeight: '340px' }}>
                    {/* Watch 1 — main (center, taller) */}
                    <div className="relative flex-shrink-0 hover:-translate-y-2 transition-transform duration-500 delay-75" style={{ marginBottom: '0' }}>
                      <div className="relative w-24 md:w-28 rounded-[30%] overflow-hidden border border-white/15"
                           style={{ height: '120px', background: '#1C1C1E', boxShadow: '0 20px 50px rgba(0,0,0,0.4), inset 0 1px 0 rgba(255,255,255,0.08)' }}>
                        {/* Crown */}
                        <div className="absolute right-0 top-[30%] w-1.5 h-5 bg-[#2A2A2C] rounded-r-sm translate-x-full border border-white/10" />
                        {/* Screen - flower */}
                        <div className="absolute inset-1.5 rounded-[24%] overflow-hidden bg-[#0D1A10] flex flex-col items-center justify-center">
                          <div className="opacity-80"><LotusDecor size={48} color="#C8A0D0" /></div>
                          <div className="absolute bottom-2 text-[7px] text-white/60 text-center leading-tight px-1">
                            {lang === 'vi' ? lt.watchRoadmap.screens[0].label : lt.watchRoadmap.screens[0].label}
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Watch 2 — center (tallest) */}
                    <div className="relative flex-shrink-0 hover:-translate-y-3 transition-transform duration-500 z-10" style={{ marginBottom: '20px' }}>
                      <div className="relative w-28 md:w-32 rounded-[28%] overflow-hidden border border-white/20"
                           style={{ height: '136px', background: '#1C1C1E', boxShadow: '0 24px 60px rgba(0,0,0,0.5), inset 0 1px 0 rgba(255,255,255,0.10)' }}>
                        {/* Crown */}
                        <div className="absolute right-0 top-[30%] w-1.5 h-5 bg-[#2A2A2C] rounded-r-sm translate-x-full border border-white/10" />
                        {/* Screen - music player */}
                        <div className="absolute inset-1.5 rounded-[22%] overflow-hidden bg-[#0A0A0A] flex flex-col items-center justify-center gap-1.5 px-2">
                          <div className="text-[8px] text-white/40 uppercase tracking-widest">{lang === 'vi' ? 'Đang phát' : 'Playing'}</div>
                          <div className="text-[9px] text-white font-semibold">{lang === 'vi' ? 'Mưa rừng' : 'Forest Rain'}</div>
                          {/* Mini playback bar */}
                          <div className="w-full bg-white/10 rounded-full h-0.5 mt-1">
                            <div className="bg-[#A8C5A0] h-0.5 rounded-full w-2/3" />
                          </div>
                          {/* Controls */}
                          <div className="flex items-center gap-3 mt-1">
                            <span className="text-white/60 text-[10px]">⏮</span>
                            <div className="w-6 h-6 rounded-full bg-white/15 flex items-center justify-center">
                              <span className="text-white text-[10px] ml-0.5">▶</span>
                            </div>
                            <span className="text-white/60 text-[10px]">⏭</span>
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Watch 3 — right */}
                    <div className="relative flex-shrink-0 hover:-translate-y-2 transition-transform duration-500 delay-150">
                      <div className="relative w-24 md:w-28 rounded-[30%] overflow-hidden border border-white/15"
                           style={{ height: '120px', background: '#1C1C1E', boxShadow: '0 20px 50px rgba(0,0,0,0.4), inset 0 1px 0 rgba(255,255,255,0.08)' }}>
                        {/* Crown */}
                        <div className="absolute right-0 top-[30%] w-1.5 h-5 bg-[#2A2A2C] rounded-r-sm translate-x-full border border-white/10" />
                        {/* Screen - breathing circle */}
                        <div className="absolute inset-1.5 rounded-[24%] overflow-hidden bg-[#060D0A] flex flex-col items-center justify-center gap-1">
                          {/* Animated breathing ring */}
                          <div className="relative">
                            <div className="w-10 h-10 rounded-full border-2 border-[#4A7C59]/40 flex items-center justify-center">
                              <div className="w-6 h-6 rounded-full bg-[#3B6348]/60 border border-[#4A7C59]/50" />
                            </div>
                          </div>
                          <div className="text-[7px] text-[#A8C5A0] text-center">{lang === 'vi' ? 'Nhịp thở 4-7-8' : '4-7-8 Breath'}</div>
                        </div>
                      </div>
                    </div>
                  </div>
                </RevealSection>

                {/* Right: Text content */}
                <RevealSection delay={200}>
                  <div>
                    {/* Badge */}
                    <div className="text-xs font-semibold text-white/60 uppercase tracking-[0.2em] mb-4">
                      {lt.watchRoadmap.badge}
                    </div>

                    {/* Title */}
                    <h2 className="font-black text-white leading-tight mb-5"
                        style={{ fontSize: 'clamp(1.8rem, 3.5vw, 2.8rem)' }}>
                      {lt.watchRoadmap.title}
                      <br />
                      <span className="italic text-white/90">{lt.watchRoadmap.titleAccent}</span>
                    </h2>

                    <p className="text-white/60 text-sm leading-relaxed mb-8 max-w-sm">
                      {lt.watchRoadmap.desc}
                    </p>

                    {/* Features */}
                    <div className="grid gap-3">
                      {lt.watchRoadmap.features.map((f: any, i: number) => (
                        <div key={i} className="flex items-start gap-3 p-3.5 rounded-2xl bg-black/15 border border-white/10 hover:bg-black/20 transition-all">
                          <div className="w-9 h-9 flex-shrink-0 rounded-xl bg-white/10 flex items-center justify-center text-lg">
                            {f.icon}
                          </div>
                          <div>
                            <div className="text-sm font-semibold text-white mb-0.5">{f.title}</div>
                            <div className="text-xs text-white/55 leading-relaxed">{f.desc}</div>
                          </div>
                        </div>
                      ))}
                    </div>

                    {/* CTA */}
                    <button className="mt-6 inline-flex items-center gap-2 px-5 py-2.5 rounded-full bg-white/15 border border-white/25 text-sm text-white hover:bg-white/25 hover:border-white/40 transition-all cursor-pointer">
                      🔔 {lt.watchRoadmap.notifyText}
                    </button>
                  </div>
                </RevealSection>

              </div>
            </div>
          </div>
        </RevealSection>
      </section>

      {/* ═══════════════════════════════════════════ */}
      {/* ── SECTION 6: LIFESTYLE MANAGEMENT ── */}
      {/* ═══════════════════════════════════════════ */}
      <section className="py-24 px-6">
        <div className="mx-auto max-w-5xl">
          <RevealSection>
            <div className="text-center mb-14">
              <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs font-medium mb-5">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                {lt.lifestyle.badge}
              </div>
              <h2 className="text-3xl md:text-5xl font-bold mb-4">
                {lt.lifestyle.title1}
                <br />
                <span className="text-gradient-lavender">{lt.lifestyle.title2}</span>
              </h2>
              <p className="text-[#938F9C] max-w-xl mx-auto text-sm leading-relaxed">{lt.lifestyle.desc}</p>
            </div>
          </RevealSection>

          <div className="grid md:grid-cols-3 gap-6">
            {lt.lifestyle.times.map((t: any, i: number) => (
              <RevealSection key={i} delay={i * 150}>
                <div className="relative bg-white/[0.03] border border-white/5 rounded-2xl p-6 h-full hover:bg-white/[0.06] hover:border-[#C7BFFF]/15 transition-all group">
                  <div className="text-4xl mb-4">{t.emoji}</div>
                  <h3 className="text-lg font-bold text-white mb-2">{t.title}</h3>
                  <p className="text-sm text-[#938F9C] leading-relaxed">{t.desc}</p>
                </div>
              </RevealSection>
            ))}
          </div>
        </div>
      </section>

      {/* ═══════════════════════════════════════════ */}
      {/* ── SECTION 7: TESTIMONIALS ── */}
      {/* ═══════════════════════════════════════════ */}
      <section id="testimonials" className="py-24 px-6">
        <div className="mx-auto max-w-6xl">
          <RevealSection>
            <div className="text-center mb-14">
              <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-violet-500/10 border border-violet-500/20 text-pink-400 text-xs font-medium mb-5">
                <span className="w-1.5 h-1.5 rounded-full bg-pink-400 animate-pulse" />
                {lt.testimonials.badge}
              </div>
              <h2 className="text-3xl md:text-5xl font-bold mb-4">
                {lt.testimonials.title1}{' '}
                <span className="bg-gradient-to-r from-[#C7BFFF] via-violet-400 to-[#FBBC00] bg-clip-text text-transparent">
                  {lt.testimonials.title2}
                </span>
              </h2>
            </div>
          </RevealSection>

          <div className="grid md:grid-cols-3 gap-6">
            {lt.testimonials.items.map((r: any, i: number) => (
              <RevealSection key={i} delay={i * 150}>
                <div className={`relative bg-white/[0.03] border rounded-2xl p-6 h-full hover:-translate-y-1 transition-all ${
                  i === 0 ? 'border-pink-500/20 hover:border-pink-500/30' :
                  i === 1 ? 'border-violet-500/20 hover:border-violet-500/30' :
                  'border-[#C7BFFF]/20 hover:border-[#C7BFFF]/30'
                }`}>
                  <div className={`absolute top-0 ${i === 0 ? 'right' : i === 1 ? 'left' : 'right'}-0 w-24 h-24 bg-${
                    i === 0 ? 'pink' : i === 1 ? 'violet' : '[#C7BFFF]'
                  }-500/8 blur-3xl rounded-full`} />
                  {i === 2 && (
                    <div className="mb-3 inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-[#C7BFFF]/10 border border-[#C7BFFF]/20 text-[#C7BFFF] text-xs">
                      🏥 {lang === 'vi' ? 'Chuyên gia' : 'Expert'}
                    </div>
                  )}
                  <div className="flex items-center gap-3 mb-4">
                    <div className={`w-12 h-12 rounded-full bg-gradient-to-br ${
                      i === 0 ? 'from-pink-500/30 to-rose-500/20' :
                      i === 1 ? 'from-violet-500/30 to-purple-500/20' :
                      'from-[#C7BFFF]/30 to-indigo-500/20'
                    } flex items-center justify-center text-lg font-bold text-white`}>
                      {r.name.charAt(0)}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-semibold text-white truncate">{r.name}</p>
                      <p className="text-[10px] text-slate-500 truncate">{r.role}</p>
                    </div>
                    <div className="text-yellow-400 text-[10px]">★★★★★</div>
                  </div>
                  <p className="text-xs text-[#CAC5CC] leading-relaxed italic mb-4">&ldquo;{r.text}&rdquo;</p>
                  <div className="flex items-center justify-between">
                    <span className={`px-2.5 py-1 rounded-full text-[10px] font-medium ${
                      i === 0 ? 'bg-pink-500/10 border border-pink-500/20 text-pink-300' :
                      i === 1 ? 'bg-violet-500/10 border border-violet-500/20 text-violet-300' :
                      'bg-[#C7BFFF]/10 border border-[#C7BFFF]/20 text-[#C7BFFF]'
                    }`}>
                      ✓ {r.duration}
                    </span>
                    <span className="text-[10px] text-emerald-400 font-medium">{r.metric}</span>
                  </div>
                </div>
              </RevealSection>
            ))}
          </div>

          {/* Social proof */}
          <RevealSection delay={400}>
            <div className="mt-10 flex flex-col sm:flex-row items-center justify-center gap-6 sm:gap-12 py-6 border-t border-white/5">
              {lt.testimonials.social.map((s: any) => (
                <div key={s.label} className="flex items-center gap-3">
                  <span className={`text-2xl font-black ${s.color}`}>{s.value}</span>
                  <span className="text-xs text-slate-500">{s.label}</span>
                </div>
              ))}
            </div>
          </RevealSection>
        </div>
      </section>

      {/* ═══════════════════════════════════════════ */}
      {/* ── SECTION 8: PRICING ── */}
      {/* ═══════════════════════════════════════════ */}
      <section id="pricing" className="py-24 px-6">
        <div className="mx-auto max-w-5xl">
          <RevealSection>
            <div className="text-center mb-16">
              <h2 className="text-3xl md:text-4xl font-bold mb-4">
                <span className="text-gradient-amber">{lt.pricing.title1}</span>{' '}{lt.pricing.title2}
              </h2>
              <p className="text-[#938F9C]">{lt.pricing.desc}</p>
            </div>
          </RevealSection>
          <div className="grid md:grid-cols-3 gap-6">
            {lt.pricing.plans.map((p: any, i: number) => (
              <RevealSection key={p.name} delay={i * 100}>
                <div className={`relative rounded-2xl p-6 transition-all duration-300 ${
                  p.highlight
                    ? 'bg-gradient-to-b from-[#FBBC00]/10 to-violet-900/20 border-2 border-[#FBBC00]/40 shadow-xl shadow-[#FBBC00]/10'
                    : 'bg-white/[0.02] border border-white/5 hover:border-white/10'
                }`}>
                  {p.highlight && (
                    <div className="absolute -top-3 left-1/2 -translate-x-1/2 px-4 py-1 bg-gradient-to-r from-[#FBBC00] to-[#FFA726] rounded-full text-xs font-bold text-[#402D00]">
                      {lt.pricing.popular}
                    </div>
                  )}
                  <div className="mb-6 pt-2">
                    <h3 className="text-lg font-semibold text-white">{p.name}</h3>
                    <div className="flex items-baseline gap-1 mt-2">
                      <span className="text-4xl font-bold text-white">{p.price}</span>
                      <span className="text-slate-500 text-sm">{p.period}</span>
                    </div>
                  </div>
                  <ul className="space-y-3 mb-8">
                    {p.features.map((f: string) => (
                      <li key={f} className="flex items-start gap-2 text-sm text-[#CAC5CC]">
                        <span className="text-[#C7BFFF] mt-0.5">✓</span>
                        {f}
                      </li>
                    ))}
                  </ul>
                  <Link href="/signup"
                    className={`w-full flex items-center justify-center py-3 rounded-xl font-medium text-sm transition-all ${
                      p.highlight
                        ? 'bg-gradient-to-r from-[#FBBC00] to-[#FFA726] hover:from-[#FFA726] hover:to-[#FFB74D] text-[#402D00] font-bold shadow-lg shadow-[#FBBC00]/20'
                        : 'bg-white/5 hover:bg-white/10 text-[#CAC5CC] hover:text-white border border-white/10'
                    }`}>
                    {p.cta}
                  </Link>
                </div>
              </RevealSection>
            ))}
          </div>
        </div>
      </section>

      {/* ═══════════════════════════════════════════ */}
      {/* ── SECTION 9: FINAL CTA ── */}
      {/* ═══════════════════════════════════════════ */}
      <section className="py-24 px-6">
        <RevealSection>
          <div className="mx-auto max-w-3xl text-center">
            <div className="relative">
              <div className="absolute inset-0 bg-gradient-to-r from-[#C7BFFF]/20 via-violet-600/20 to-[#FBBC00]/20 blur-3xl rounded-full" />
              <div className="relative bg-white/[0.02] backdrop-blur border border-white/5 rounded-3xl p-12">
                <h2 className="text-3xl font-bold mb-4">{lt.cta.title}</h2>
                <p className="text-[#938F9C] mb-8 max-w-md mx-auto">{lt.cta.desc}</p>
                <Link href="/signup" className="inline-flex items-center gap-2 px-10 py-4 bg-gradient-to-r from-[#FBBC00] to-[#FFA726] hover:from-[#FFA726] hover:to-[#FFB74D] text-[#402D00] font-bold shadow-lg shadow-[#FBBC00]/20 rounded-full text-lg transition-all hover:shadow-xl hover:-translate-y-0.5">
                  {lt.cta.btn}
                </Link>
              </div>
            </div>
          </div>
        </RevealSection>
      </section>

      {/* ── Footer ── */}
      <footer className="border-t border-white/5 py-8 px-6">
        <div className="mx-auto max-w-6xl flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2 text-slate-500 text-sm">
            <div className="relative w-6 h-6 rounded-full overflow-hidden border border-white/15 flex-shrink-0">
              <div className="aurora-orb-blob absolute inset-[-30%] rounded-full"
                style={{ background: 'conic-gradient(from 0deg, #4f46e5, #FBBC00, #7c3aed, #4f46e5)' }} />
            </div>
            {lt.footer.tagline}
          </div>
          <div className="flex items-center gap-6 text-xs text-slate-600">
            <Link href="/privacy" className="hover:text-[#938F9C] transition-colors">{lt.footer.privacy}</Link>
            <Link href="/terms" className="hover:text-[#938F9C] transition-colors">{lt.footer.terms}</Link>
            <a href="mailto:contact@tinnimate.com" className="hover:text-[#938F9C] transition-colors">{lt.footer.contact}</a>
          </div>
        </div>
      </footer>
    </div>
  )
}
