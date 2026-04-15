#!/usr/bin/env node
/**
 * 🎬 TinniMate Video Batch 3 Generator
 * 20 videos with AI images + meditation BGM + CSS animations
 */
const fs = require('fs')
const path = require('path')

const IMAGES_DIR = path.join(__dirname, 'images')
const BGM_DIR = path.join(__dirname, 'bgm_meditation')

// Image assignments (10 images, reused across 20 videos)
const IMAGES = [
  'brain_meditation.png', 'human_meditation.png', 'mind_healing.png',
  'nervous_system.png', 'sleep_brain.png', 'ear_anatomy.png',
  'yoga_healing.png', 'stress_relief.png', 'heart_brain.png', 'nature_mindfulness.png',
]

// BGM assignments (10 tracks, reused)
const BGMS = [
  'track01_tibetan_bowl.mp3', 'track02_crystal_bowl.mp3', 'track03_space_ambient.mp3',
  'track04_zen_garden.mp3', 'track05_om_drone.mp3', 'track06_healing_rain.mp3',
  'track07_deep_space.mp3', 'track08_morning_birds.mp3', 'track09_waterfall.mp3',
  'track10_chakra_balance.mp3',
]

// CSS animation presets
const ANIMATIONS = {
  particles: `
    .particle{position:absolute;border-radius:50%;pointer-events:none}
    .particle:nth-child(1){width:4px;height:4px;background:rgba(255,255,255,.3);top:20%;left:15%;animation:floatUp 8s 0s infinite}
    .particle:nth-child(2){width:6px;height:6px;background:rgba(100,200,255,.2);top:60%;left:75%;animation:floatUp 10s 2s infinite}
    .particle:nth-child(3){width:3px;height:3px;background:rgba(200,100,255,.25);top:80%;left:40%;animation:floatUp 7s 1s infinite}
    .particle:nth-child(4){width:5px;height:5px;background:rgba(100,255,200,.2);top:40%;left:85%;animation:floatUp 9s 3s infinite}
    .particle:nth-child(5){width:4px;height:4px;background:rgba(255,200,100,.2);top:70%;left:25%;animation:floatUp 11s 0.5s infinite}
    .particle:nth-child(6){width:7px;height:7px;background:rgba(100,150,255,.15);top:90%;left:55%;animation:floatUp 12s 4s infinite}
    @keyframes floatUp{0%{transform:translateY(0) scale(1);opacity:0}10%{opacity:1}90%{opacity:1}100%{transform:translateY(-400px) scale(0.3);opacity:0}}`,
  waves: `
    .wave-container{position:absolute;bottom:0;left:0;right:0;height:120px;overflow:hidden;opacity:.15}
    .wave{position:absolute;bottom:0;width:200%;height:80px;background:linear-gradient(transparent,ACCENT_COLOR);border-radius:50% 50% 0 0;animation:waveMove 4s ease-in-out infinite}
    .wave:nth-child(2){height:60px;opacity:.5;animation-delay:-1s;animation-duration:5s}
    .wave:nth-child(3){height:40px;opacity:.3;animation-delay:-2s;animation-duration:6s}
    @keyframes waveMove{0%,100%{transform:translateX(-25%)}50%{transform:translateX(0)}}`,
  pulse: `
    .pulse-ring{position:absolute;border-radius:50%;border:1px solid ACCENT_COLOR;opacity:0;pointer-events:none}
    .pulse-ring:nth-child(1){width:120px;height:120px;top:35%;left:calc(50% - 60px);animation:pulseExpand 3s 0s infinite}
    .pulse-ring:nth-child(2){width:120px;height:120px;top:35%;left:calc(50% - 60px);animation:pulseExpand 3s 1s infinite}
    .pulse-ring:nth-child(3){width:120px;height:120px;top:35%;left:calc(50% - 60px);animation:pulseExpand 3s 2s infinite}
    @keyframes pulseExpand{0%{transform:scale(0.5);opacity:.6}100%{transform:scale(3);opacity:0}}`,
  dna: `
    .dna-strand{position:absolute;left:calc(50% - 1px);width:2px;height:100%;overflow:hidden;opacity:.1}
    .dna-dot{position:absolute;width:8px;height:8px;border-radius:50%;background:ACCENT_COLOR;left:-3px;animation:dnaFloat 6s linear infinite}
    .dna-dot:nth-child(1){top:0%;animation-delay:0s}
    .dna-dot:nth-child(2){top:12%;animation-delay:.6s}
    .dna-dot:nth-child(3){top:24%;animation-delay:1.2s}
    .dna-dot:nth-child(4){top:36%;animation-delay:1.8s}
    .dna-dot:nth-child(5){top:48%;animation-delay:2.4s}
    .dna-dot:nth-child(6){top:60%;animation-delay:3s}
    .dna-dot:nth-child(7){top:72%;animation-delay:3.6s}
    .dna-dot:nth-child(8){top:84%;animation-delay:4.2s}
    @keyframes dnaFloat{0%{transform:translateX(-20px);opacity:0}25%{transform:translateX(20px);opacity:1}50%{transform:translateX(-20px);opacity:0}75%{transform:translateX(20px);opacity:1}100%{transform:translateX(-20px);opacity:0}}`,
  breathe: `
    .breathe-circle{position:absolute;top:50%;left:50%;transform:translate(-50%,-50%);width:80px;height:80px;border-radius:50%;border:2px solid ACCENT_COLOR;opacity:.2;animation:breatheAnim 6s ease-in-out infinite}
    .breathe-circle:nth-child(2){animation-delay:1.5s;width:120px;height:120px}
    .breathe-circle:nth-child(3){animation-delay:3s;width:160px;height:160px}
    @keyframes breatheAnim{0%,100%{transform:translate(-50%,-50%) scale(0.8);opacity:.1}50%{transform:translate(-50%,-50%) scale(1.3);opacity:.3}}`,
  equalizer: `
    .eq-container{position:absolute;bottom:60px;left:50%;transform:translateX(-50%);display:flex;gap:3px;align-items:flex-end;height:40px;opacity:.2}
    .eq-bar{width:3px;background:ACCENT_COLOR;border-radius:2px;animation:eqBounce 1.2s ease-in-out infinite}
    .eq-bar:nth-child(1){animation-delay:0s;height:15px}
    .eq-bar:nth-child(2){animation-delay:.1s;height:25px}
    .eq-bar:nth-child(3){animation-delay:.2s;height:35px}
    .eq-bar:nth-child(4){animation-delay:.3s;height:20px}
    .eq-bar:nth-child(5){animation-delay:.15s;height:30px}
    .eq-bar:nth-child(6){animation-delay:.25s;height:18px}
    .eq-bar:nth-child(7){animation-delay:.05s;height:28px}
    .eq-bar:nth-child(8){animation-delay:.35s;height:22px}
    .eq-bar:nth-child(9){animation-delay:.12s;height:32px}
    .eq-bar:nth-child(10){animation-delay:.22s;height:16px}
    @keyframes eqBounce{0%,100%{transform:scaleY(0.3)}50%{transform:scaleY(1)}}`,
}

const ANIM_HTML = {
  particles: '<div class="particle"></div>'.repeat(6),
  waves: '<div class="wave-container"><div class="wave"></div><div class="wave"></div><div class="wave"></div></div>',
  pulse: '<div class="pulse-ring"></div><div class="pulse-ring"></div><div class="pulse-ring"></div>',
  dna: '<div class="dna-strand">' + '<div class="dna-dot"></div>'.repeat(8) + '</div>',
  breathe: '<div class="breathe-circle"></div><div class="breathe-circle"></div><div class="breathe-circle"></div>',
  equalizer: '<div class="eq-container">' + '<div class="eq-bar"></div>'.repeat(10) + '</div>',
}

// 20 video definitions
const VIDEOS = [
  { id: 'video31_neuroplasticity', img: 0, bgm: 0, anim: ['particles','pulse'], accent: '#8b5cf6',
    title: 'Neuroplasticity — Não bộ có thể thay đổi',
    scenes: [
      { emoji: '🧠', heading: 'Neuroplasticity', sub: 'Não bộ tự sửa chữa ở mọi tuổi', detail: 'Hàng tỷ kết nối thần kinh\ncó thể tái cấu trúc' },
      { heading: '🔬 Khoa học', sub: 'Điều gì xảy ra với ù tai?', items: ['Não "học" cách phớt lờ tiếng ù', 'Tập luyện 30 ngày tạo kết nối mới', 'Liệu pháp âm thanh kích hoạt'] },
      { heading: '🌐 TinniMate', sub: 'Bắt đầu thay đổi hôm nay', cta: '🧠 Khám phá →', url: 'tinnimate.vuinghe.com' },
    ]},
  { id: 'video32_meditation_tinnitus', img: 1, bgm: 4, anim: ['breathe','particles'], accent: '#06b6d4',
    title: 'Thiền — Giảm ù tai 50%',
    scenes: [
      { emoji: '🧘', heading: 'Thiền & Ù tai', sub: 'Mindfulness Based Stress Reduction', detail: 'Nghiên cứu JAMA:\nThiền giảm ù tai 50%' },
      { heading: '📊 Kết quả', sub: '8 tuần thiền chánh niệm', items: ['Giảm stress 47%', 'Giảm nhận thức ù tai 50%', 'Cải thiện chất lượng sống'] },
      { heading: '🌐 TinniMate', sub: 'Hướng dẫn thiền miễn phí', cta: '🧘 Thiền cùng Tinni →', url: 'tinnimate.vuinghe.com/coach' },
    ]},
  { id: 'video33_stress_brain', img: 7, bgm: 2, anim: ['waves','pulse'], accent: '#ef4444',
    title: 'Stress & Não — Vòng xoáy ù tai',
    scenes: [
      { emoji: '😰', heading: 'Vòng xoáy Stress', sub: 'Stress → Ù tai → Stress → ...', detail: 'Cortisol tăng cao\nKích hoạt hệ limbic\nPhóng đại tiếng ù' },
      { heading: '🔄 Cách phá vỡ', sub: '3 chiến lược khoa học', items: ['Thở 4-7-8 — giảm cortisol 23%', 'Thiền 10 phút/ngày', 'Âm thanh trị liệu ban đêm'] },
      { heading: '🌐 TinniMate', sub: 'Phá vỡ vòng xoáy', cta: '🧘 Bắt đầu →', url: 'tinnimate.vuinghe.com/chat' },
    ]},
  { id: 'video34_cbt_tinnitus', img: 2, bgm: 3, anim: ['particles','waves'], accent: '#10b981',
    title: 'CBT — Thay đổi cách não xử lý ù tai',
    scenes: [
      { emoji: '🧩', heading: 'CBT cho Ù tai', sub: 'Cognitive Behavioral Therapy', detail: 'Không "chữa" tiếng ù\nMà thay đổi phản ứng của não' },
      { heading: '✅ 4 bước CBT', sub: 'Liệu pháp nhận thức hành vi', items: ['1. Nhận diện suy nghĩ tiêu cực', '2. Thách thức niềm tin sai lầm', '3. Thay thế bằng tư duy tích cực', '4. Thực hành hàng ngày'] },
      { heading: '🌐 TinniMate', sub: 'AI Coach hướng dẫn CBT', cta: '🧩 Chat với Coach →', url: 'tinnimate.vuinghe.com/coach' },
    ]},
  { id: 'video35_mindfulness', img: 9, bgm: 7, anim: ['breathe','particles'], accent: '#f59e0b',
    title: 'Mindfulness — Sống trọn vẹn với ù tai',
    scenes: [
      { emoji: '🌿', heading: 'Chánh Niệm', sub: 'Quan sát mà không phán xét', detail: 'Không chống lại tiếng ù\nMà chấp nhận & buông bỏ' },
      { heading: '🌸 Thực hành', sub: '5 phút mỗi ngày', items: ['Ngồi yên, nhắm mắt', 'Lắng nghe tiếng ù — không sợ', 'Nhẹ nhàng chuyển chú ý sang hơi thở', 'Mở mắt — tiếng ù nhỏ hơn'] },
      { heading: '🌐 TinniMate', sub: 'Guided mindfulness', cta: '🌿 Bắt đầu →', url: 'tinnimate.vuinghe.com/coach' },
    ]},
  { id: 'video36_hearing_anatomy', img: 5, bgm: 1, anim: ['pulse','dna'], accent: '#06b6d4',
    title: 'Tai bên trong — Hành trình âm thanh',
    scenes: [
      { emoji: '👂', heading: 'Giải phẫu Tai', sub: 'Từ sóng âm → Tín hiệu não', detail: 'Sóng âm → Màng nhĩ → Ốc tai\n→ Dây thần kinh → Vỏ não' },
      { heading: '⚡ Khi ù tai xảy ra', sub: 'Điều gì sai trong quá trình?', items: ['Tế bào lông ốc tai bị tổn thương', 'Não tạo tín hiệu "ma"', 'Vỏ não thính giác phóng đại'] },
      { heading: '🌐 TinniMate', sub: 'Hiểu để chữa lành', cta: '👂 Tìm hiểu →', url: 'tinnimate.vuinghe.com/chat' },
    ]},
  { id: 'video37_sleep_recovery', img: 4, bgm: 6, anim: ['waves','breathe'], accent: '#6366f1',
    title: 'Giấc ngủ — Khi não bộ tự chữa lành',
    scenes: [
      { emoji: '💤', heading: 'Ngủ & Chữa lành', sub: 'Não phục hồi trong giấc ngủ sâu', detail: 'REM: Xử lý cảm xúc\nDeep sleep: Sửa chữa thần kinh' },
      { heading: '🌙 Giấc ngủ & Ù tai', sub: 'Mối liên hệ hai chiều', items: ['Ù tai → khó ngủ', 'Thiếu ngủ → ù tai nặng hơn', 'Âm thanh trị liệu phá vỡ chu kỳ'] },
      { heading: '🌐 TinniMate', sub: 'Sleep mode thông minh', cta: '💤 Ngủ ngon →', url: 'tinnimate.vuinghe.com/sleep' },
    ]},
  { id: 'video38_anxiety_loop', img: 7, bgm: 5, anim: ['pulse','particles'], accent: '#f43f5e',
    title: 'Lo lắng & Ù tai — Vòng lặp não bộ',
    scenes: [
      { emoji: '🔴', heading: 'Anxiety Loop', sub: 'Amygdala — bộ phận báo động', detail: 'Lo lắng kích hoạt amygdala\nPhóng đại tín hiệu ù tai' },
      { heading: '🧠 Cách não hoạt động', sub: 'Fear-Attention Cycle', items: ['Nghe tiếng ù → Sợ hãi', 'Sợ hãi → Chú ý nhiều hơn', 'Chú ý → Tiếng ù to hơn', '→ Lặp lại...'] },
      { heading: '🌐 TinniMate', sub: 'Phá vỡ vòng lặp', cta: '🧠 Chat với AI →', url: 'tinnimate.vuinghe.com/chat' },
    ]},
  { id: 'video39_pmr', img: 3, bgm: 8, anim: ['breathe','waves'], accent: '#14b8a6',
    title: 'PMR — Thư giãn cơ bắp từng bước',
    scenes: [
      { emoji: '💆', heading: 'PMR', sub: 'Progressive Muscle Relaxation', detail: 'Căng → Thả từng nhóm cơ\nGiảm stress toàn thân' },
      { heading: '🦶 Quy trình', sub: '15 phút mỗi tối', items: ['Bàn chân → Bắp chân', 'Đùi → Bụng → Ngực', 'Tay → Vai → Cổ', 'Mặt → Toàn thân thư giãn'] },
      { heading: '🌐 TinniMate', sub: 'Hướng dẫn PMR audio', cta: '💆 Bắt đầu →', url: 'tinnimate.vuinghe.com/coach' },
    ]},
  { id: 'video40_habituation', img: 0, bgm: 9, anim: ['dna','particles'], accent: '#a78bfa',
    title: 'Habituation — Não tự quen với ù tai',
    scenes: [
      { emoji: '🔕', heading: 'Habituation', sub: 'Não học cách phớt lờ', detail: 'Như mũi không ngửi nước hoa\nsau 15 phút đeo' },
      { heading: '⏰ Thời gian', sub: 'Quá trình tự nhiên', items: ['3-6 tháng: Bắt đầu quen', '6-12 tháng: Giảm đáng kể', '1-2 năm: Gần như không để ý', 'Âm thanh trị liệu tăng tốc!'] },
      { heading: '🌐 TinniMate', sub: 'Đẩy nhanh habituation', cta: '🔕 Bắt đầu →', url: 'tinnimate.vuinghe.com/therapy' },
    ]},
  { id: 'video41_vagus_nerve', img: 3, bgm: 4, anim: ['dna','pulse'], accent: '#22d3ee',
    title: 'Dây thần kinh Vagus — Nút reset stress',
    scenes: [
      { emoji: '⚡', heading: 'Vagus Nerve', sub: 'Dây thần kinh dài nhất cơ thể', detail: 'Từ não → Tim → Ruột\nĐiều hòa toàn bộ hệ thần kinh' },
      { heading: '🎯 Kích hoạt Vagus', sub: '4 cách đơn giản', items: ['Thở chậm, sâu (4-7-8)', 'Ngâm mặt nước lạnh 30s', 'Hát, ê a, hoặc gáy', 'Massage vùng cổ nhẹ nhàng'] },
      { heading: '🌐 TinniMate', sub: 'Bài tập Vagus Nerve', cta: '⚡ Thử ngay →', url: 'tinnimate.vuinghe.com/coach' },
    ]},
  { id: 'video42_cortisol', img: 7, bgm: 2, anim: ['waves','particles'], accent: '#fb923c',
    title: 'Cortisol — Hormone stress & ù tai',
    scenes: [
      { emoji: '🧪', heading: 'Cortisol', sub: 'Hormone stress → Ù tai nặng hơn', detail: 'Cortisol cao = hệ thần kinh\nluôn trong trạng thái cảnh giác' },
      { heading: '📉 Giảm Cortisol', sub: 'Nghiên cứu chứng minh', items: ['528Hz giảm cortisol 12%', 'Thiền 20 phút: giảm 23%', 'Ngủ đủ 7-8 giờ', 'Tập thể dục nhẹ 30 phút'] },
      { heading: '🌐 TinniMate', sub: 'Giảm stress mỗi ngày', cta: '🧪 Bắt đầu →', url: 'tinnimate.vuinghe.com/therapy' },
    ]},
  { id: 'video43_limbic_system', img: 8, bgm: 6, anim: ['pulse','breathe'], accent: '#ec4899',
    title: 'Hệ Limbic — Trung tâm cảm xúc & ù tai',
    scenes: [
      { emoji: '❤️', heading: 'Hệ Limbic', sub: 'Nơi cảm xúc gặp ù tai', detail: 'Amygdala: Sợ hãi\nHippocampus: Ký ức\n→ Kết hợp tạo phản ứng ù tai' },
      { heading: '🔑 Giải mã', sub: 'Tại sao ù tai gây stress?', items: ['Amygdala gắn tiếng ù = nguy hiểm', 'Não tự động cảnh giác', 'Retrain amygdala = giảm ù tai'] },
      { heading: '🌐 TinniMate', sub: 'Retrain hệ limbic', cta: '❤️ Thử ngay →', url: 'tinnimate.vuinghe.com/coach' },
    ]},
  { id: 'video44_deep_breathing', img: 1, bgm: 0, anim: ['breathe','equalizer'], accent: '#34d399',
    title: 'Thở sâu — Khoa học thần kinh',
    scenes: [
      { emoji: '🌬️', heading: 'Thở Sâu', sub: 'Parasympathetic Activation', detail: 'Thở chậm = kích hoạt\nhệ thần kinh phó giao cảm' },
      { heading: '🫁 3 kỹ thuật', sub: 'Từ dễ → nâng cao', items: ['Box breathing: 4-4-4-4', '4-7-8: Hít 4, giữ 7, thở 8', 'Bhramari: Thở ong (vo ve)'] },
      { heading: '🌐 TinniMate', sub: 'Hướng dẫn thở miễn phí', cta: '🌬️ Bắt đầu →', url: 'tinnimate.vuinghe.com/coach' },
    ]},
  { id: 'video45_gratitude', img: 9, bgm: 7, anim: ['particles','waves'], accent: '#fbbf24',
    title: 'Nhật ký Biết ơn — Thay đổi não bộ',
    scenes: [
      { emoji: '📝', heading: 'Gratitude Journal', sub: 'Viết 3 điều biết ơn mỗi ngày', detail: 'Nghiên cứu UCLA:\nGratitude thay đổi cấu trúc não' },
      { heading: '🧠 Hiệu quả', sub: 'Sau 21 ngày liên tục', items: ['Tăng dopamine 25%', 'Giảm lo lắng 31%', 'Cải thiện giấc ngủ', 'Giảm nhận thức ù tai'] },
      { heading: '🌐 TinniMate', sub: 'Nhật ký trong app', cta: '📝 Viết ngay →', url: 'tinnimate.vuinghe.com/journal' },
    ]},
  { id: 'video46_music_therapy', img: 8, bgm: 1, anim: ['equalizer','particles'], accent: '#8b5cf6',
    title: 'Âm nhạc trị liệu — Khoa học não bộ',
    scenes: [
      { emoji: '🎶', heading: 'Music Therapy', sub: 'Âm nhạc thay đổi sóng não', detail: 'Nhạc classical giảm cortisol\nTăng alpha waves\nKích thích neuroplasticity' },
      { heading: '🎵 Gợi ý', sub: 'Loại nhạc phù hợp', items: ['Classical: Mozart, Debussy', 'Ambient: Brian Eno', 'Nature: Mưa, sóng biển', 'Solfeggio: 528Hz, 432Hz'] },
      { heading: '🌐 TinniMate', sub: '11+ loại âm thanh', cta: '🎶 Nghe ngay →', url: 'tinnimate.vuinghe.com/therapy' },
    ]},
  { id: 'video47_yoga_nervous', img: 6, bgm: 3, anim: ['breathe','dna'], accent: '#f97316',
    title: 'Yoga — Cân bằng hệ thần kinh',
    scenes: [
      { emoji: '🧘‍♀️', heading: 'Yoga & Ù tai', sub: 'Cân bằng giao cảm & phó giao cảm', detail: 'Yoga giảm cortisol\nTăng GABA (chất ức chế)\nGiảm tín hiệu ù tai' },
      { heading: '🤸 5 tư thế', sub: 'Dành riêng cho ù tai', items: ['Child\'s pose (Balasana)', 'Legs up the wall', 'Cat-Cow stretch', 'Shavasana (xác chết)', 'Seated forward bend'] },
      { heading: '🌐 TinniMate', sub: 'Video hướng dẫn', cta: '🧘 Bắt đầu →', url: 'tinnimate.vuinghe.com/coach' },
    ]},
  { id: 'video48_digital_detox', img: 2, bgm: 8, anim: ['particles','pulse'], accent: '#14b8a6',
    title: 'Digital Detox — Cho não nghỉ ngơi',
    scenes: [
      { emoji: '📵', heading: 'Digital Detox', sub: 'Giảm kích thích → Giảm ù tai', detail: 'Ánh sáng xanh + tiếng ồn\nStress liên tục cho não bộ' },
      { heading: '📱 Thực hành', sub: '7 bước detox', items: ['1 giờ trước ngủ: không màn hình', 'Tắt thông báo ban đêm', 'Nghe âm thanh tự nhiên thay nhạc', 'Thiền 10 phút thay scrolling'] },
      { heading: '🌐 TinniMate', sub: 'Thay thế screen time', cta: '📵 Thử ngay →', url: 'tinnimate.vuinghe.com/therapy' },
    ]},
  { id: 'video49_social_support', img: 8, bgm: 9, anim: ['waves','breathe'], accent: '#3b82f6',
    title: 'Cộng đồng — Không ai đơn độc',
    scenes: [
      { emoji: '🤝', heading: 'Cộng Đồng', sub: '600+ triệu người bị ù tai', detail: 'Bạn không cô đơn\n15% dân số thế giới\ncó triệu chứng ù tai' },
      { heading: '💪 Sức mạnh cộng đồng', sub: 'Support group online', items: ['Chia sẻ kinh nghiệm', 'Động viên lẫn nhau', 'Học hỏi tips mới', 'Giảm cô đơn 40%'] },
      { heading: '🌐 TinniMate', sub: 'Tinni luôn bên bạn 24/7', cta: '🤝 Chat ngay →', url: 'tinnimate.vuinghe.com/chat' },
    ]},
  { id: 'video50_hope_recovery', img: 1, bgm: 5, anim: ['particles','breathe','equalizer'], accent: '#fbbf24',
    title: 'Hy vọng — Hành trình chữa lành',
    scenes: [
      { emoji: '🌅', heading: 'Hy Vọng', sub: 'Mỗi ngày tốt hơn một chút', detail: 'Ù tai KHÔNG phải bản án\nNão bộ CÓ THỂ thay đổi\nBạn KHÔNG cô đơn' },
      { heading: '🌟 Con số hy vọng', sub: 'Nghiên cứu lâm sàng', items: ['80% cải thiện với trị liệu', '50% habituation trong 1 năm', '70% ngủ tốt hơn sau 2 tuần', '100% được hỗ trợ bởi Tinni'] },
      { heading: '🌐 TinniMate', sub: 'Bắt đầu hành trình hôm nay', cta: '🌅 Bước đầu tiên →', url: 'tinnimate.vuinghe.com' },
    ]},
]

function generateHTML(v, i) {
  const img = IMAGES[v.img]
  const imgPath = path.resolve(IMAGES_DIR, img)
  const accent = v.accent
  const s = v.scenes
  
  // Combine selected animations
  const animCSS = v.anim.map(a => ANIMATIONS[a].replace(/ACCENT_COLOR/g, accent)).join('\n')
  const animHTML = v.anim.map(a => ANIM_HTML[a]).join('\n')
  
  const renderItems = (items, baseDelay) => items.map((item, j) =>
    `<div class="item" style="animation:slideUp .5s ${baseDelay + j*0.4}s both">${item}</div>`
  ).join('\n      ')

  return `<!DOCTYPE html>
<html><head><meta charset="utf-8">
<style>
*{margin:0;padding:0;box-sizing:border-box}
body{width:420px;height:746px;overflow:hidden;background:#020617;font-family:'Segoe UI',sans-serif;color:#fff}
.bg-img{position:absolute;inset:0;background:url('${imgPath}') center/cover;opacity:.25;filter:blur(2px)}
.bg-overlay{position:absolute;inset:0;background:linear-gradient(180deg,rgba(2,6,23,.7) 0%,rgba(2,6,23,.4) 50%,rgba(2,6,23,.8) 100%)}
.scene{position:absolute;inset:0;display:flex;flex-direction:column;align-items:center;justify-content:center;text-align:center;padding:40px 24px;opacity:0;transform:translateY(30px);z-index:10}
.scene.s1{opacity:0}.scene.s2{opacity:0}.scene.s3{opacity:0}

@keyframes slideUp{0%{opacity:0;transform:translateY(40px)}100%{opacity:1;transform:translateY(0)}}
@keyframes float{0%,100%{transform:translateY(0)}50%{transform:translateY(-10px)}}

${animCSS}

.heading{font-size:26px;font-weight:800;background:linear-gradient(135deg,${accent},#fff);-webkit-background-clip:text;-webkit-text-fill-color:transparent;margin-bottom:8px;animation:slideUp .6s .8s both}
.sub{font-size:13px;color:#94a3b8;margin-bottom:14px;animation:slideUp .6s 1.5s both}
.detail{font-size:12px;color:#cbd5e1;white-space:pre-line;line-height:1.8;animation:slideUp .6s 2.2s both}
.emoji-big{font-size:56px;margin-bottom:12px;animation:slideUp .5s .5s both,float 3s 1.5s infinite}

.s2 .heading{animation:slideUp .6s 12.5s both}
.s2 .sub{animation:slideUp .6s 13s both}
.items{display:flex;flex-direction:column;gap:6px;max-width:300px;width:100%}
.item{background:rgba(255,255,255,.04);border:1px solid rgba(255,255,255,.06);padding:10px 14px;border-radius:10px;font-size:12px;color:#e2e8f0;text-align:left;backdrop-filter:blur(4px)}

.s3 .heading{animation:slideUp .5s 24.5s both;font-size:18px}
.s3 .sub{animation:slideUp .5s 24.8s both}
.cta-btn{margin-top:16px;background:linear-gradient(135deg,${accent},${accent}88);border:none;color:#fff;padding:12px 28px;border-radius:50px;font-size:13px;font-weight:700;animation:slideUp .5s 25.2s both;box-shadow:0 0 30px ${accent}44}

.watermark{position:absolute;bottom:14px;left:50%;transform:translateX(-50%);font-size:9px;color:rgba(255,255,255,.12);z-index:20}
</style></head>
<body>
<div class="bg-img"></div>
<div class="bg-overlay"></div>

${animHTML}

<!-- Scene 1 -->
<div class="scene s1">
  <div class="emoji-big">${s[0].emoji}</div>
  <div class="heading">${s[0].heading}</div>
  <div class="sub">${s[0].sub}</div>
  <div class="detail">${s[0].detail}</div>
</div>

<!-- Scene 2 -->
<div class="scene s2">
  <div class="heading">${s[1].heading}</div>
  <div class="sub">${s[1].sub}</div>
  <div class="items">
    ${renderItems(s[1].items, 13.5)}
  </div>
</div>

<!-- Scene 3 -->
<div class="scene s3">
  <div class="heading">${s[2].heading}</div>
  <div class="sub">${s[2].sub}</div>
  <div class="cta-btn">${s[2].cta}</div>
</div>

<div class="watermark">@tinnimate • ${s[2].url}</div>

<script>
(function(){
  const scenes=document.querySelectorAll('.scene');
  const timings=[1000,12000,24000];
  scenes.forEach(s=>{s.style.opacity='0';s.style.transition='none'});
  scenes.forEach((scene,i)=>{
    setTimeout(()=>{scene.style.transition='opacity 0.6s ease,transform 0.6s ease';scene.style.opacity='1';scene.style.transform='translateY(0)'},timings[i]);
    if(i<scenes.length-1) setTimeout(()=>{scene.style.transition='opacity 0.4s ease';scene.style.opacity='0'},timings[i+1]-400);
  });
})();
</script>
</body></html>`
}

// Main
console.log('━'.repeat(50))
console.log('🎬 TinniMate Batch 3 Generator')
console.log(`   ${VIDEOS.length} videos • Images + Meditation BGM + CSS Animations`)
console.log('━'.repeat(50))

for (let i = 0; i < VIDEOS.length; i++) {
  const v = VIDEOS[i]
  const htmlPath = path.join(__dirname, `${v.id}.html`)
  const html = generateHTML(v, i)
  fs.writeFileSync(htmlPath, html)
  
  // Symlink BGM to bgm/ directory for converter
  const bgmSrc = path.join(BGM_DIR, BGMS[v.bgm])
  const bgmDst = path.join(__dirname, 'bgm', `${v.id}.mp3`)
  if (fs.existsSync(bgmDst)) fs.unlinkSync(bgmDst)
  fs.copyFileSync(bgmSrc, bgmDst)
  
  console.log(`  ✅ [${i+1}/${VIDEOS.length}] ${v.id} — img:${IMAGES[v.img].split('.')[0]} bgm:${BGMS[v.bgm].split('.')[0]} anim:${v.anim.join('+')}`)
}

console.log('\n' + '━'.repeat(50))
console.log(`🎉 Done! ${VIDEOS.length} HTML + BGM files generated`)
console.log('━'.repeat(50))
