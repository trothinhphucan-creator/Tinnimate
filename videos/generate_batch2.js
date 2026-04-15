#!/usr/bin/env node
/**
 * 🎬 TinniMate Video Batch Generator v2
 * Tạo 20 video marketing mới + BGM trị liệu riêng cho mỗi video
 * 
 * Cách dùng: node generate_batch2.js
 */

const { execSync } = require('child_process')
const fs = require('fs')
const path = require('path')

const FFMPEG = path.join(__dirname, 'node_modules/@ffmpeg-installer/linux-x64/ffmpeg')
const BGM_DIR = path.join(__dirname, 'bgm')
const DURATION = 35 // BGM duration (video is 30s, bgm fades out)

fs.mkdirSync(BGM_DIR, { recursive: true })

// ── 20 Video Definitions ──
const VIDEOS = [
  // --- Noise Therapy (3) ---
  { id: 'video11_white_noise_deep', bgmType: 'white',
    title: 'White Noise Trị Liệu',
    scenes: [
      { heading: '🎧 White Noise', sub: 'Che phủ hoàn toàn tiếng ù tai', detail: 'Tần số đều từ 20Hz-20kHz\nNão bộ ngừng tập trung vào tiếng ù' },
      { heading: '💤 Hiệu quả', sub: 'Nghiên cứu lâm sàng', items: ['85% giảm chú ý đến ù tai', 'Cải thiện giấc ngủ sau 2 tuần', 'An toàn sử dụng dài hạn'] },
      { heading: '🌐 TinniMate', sub: 'Nghe ngay — Miễn phí', cta: '🎧 Bật White Noise →', url: 'tinnimate.vuinghe.com/therapy' },
    ]},
  { id: 'video12_pink_noise', bgmType: 'pink',
    title: 'Pink Noise — Dịu nhẹ hơn White',
    scenes: [
      { heading: '🌸 Pink Noise', sub: 'Âm thanh tự nhiên nhất cho tai', detail: 'Bass mạnh hơn, treble nhẹ hơn\nGiống tiếng mưa, thác nước' },
      { heading: '🧠 Tại sao Pink?', sub: 'Phù hợp với thính giác con người', items: ['Giảm stress hiệu quả hơn white noise', 'Phù hợp nghe khi ngủ', 'Tần số thấp giúp thư giãn sâu'] },
      { heading: '🌐 TinniMate', sub: 'Thử ngay đêm nay', cta: '🌸 Bật Pink Noise →', url: 'tinnimate.vuinghe.com/therapy' },
    ]},
  { id: 'video13_brown_noise', bgmType: 'brown',
    title: 'Brown Noise — Trầm sâu thư giãn',
    scenes: [
      { heading: '🌊 Brown Noise', sub: 'Sóng âm trầm như đại dương', detail: 'Tần số rất thấp, bass mạnh\nNhư gió thổi, sóng vỗ xa' },
      { heading: '😌 Ai nên dùng?', sub: 'Đặc biệt phù hợp', items: ['Ù tai tần số cao (>4kHz)', 'Mất ngủ do lo lắng', 'Nhạy cảm với tiếng ồn'] },
      { heading: '🌐 TinniMate', sub: 'Thư giãn ngay', cta: '🌊 Bật Brown Noise →', url: 'tinnimate.vuinghe.com/therapy' },
    ]},

  // --- Binaural Beats (3) ---
  { id: 'video14_alpha_waves', bgmType: 'alpha',
    title: 'Sóng Alpha — Thư giãn tỉnh táo',
    scenes: [
      { heading: '🧘 Sóng Alpha', sub: '8-12 Hz — Trạng thái thiền định', detail: 'Khi bạn nhắm mắt thư giãn\nNão tự tạo sóng Alpha' },
      { heading: '✨ Lợi ích', sub: 'Binaural Beats Alpha', items: ['Giảm lo lắng 40%', 'Tăng sáng tạo & tập trung', 'Giảm nhận thức ù tai'] },
      { heading: '🌐 TinniMate', sub: 'Nghe với tai nghe', cta: '🧘 Bật Alpha Waves →', url: 'tinnimate.vuinghe.com/therapy' },
    ]},
  { id: 'video15_theta_waves', bgmType: 'theta',
    title: 'Sóng Theta — Ngủ sâu hơn',
    scenes: [
      { heading: '🌙 Sóng Theta', sub: '4-8 Hz — Giai đoạn ngủ nông', detail: 'Theta xuất hiện khi bạn\nbắt đầu chìm vào giấc ngủ' },
      { heading: '💤 Hiệu quả', sub: 'Nghiên cứu khoa học', items: ['Rút ngắn thời gian vào giấc', 'Giảm thức giữa đêm', 'Tối ưu chu kỳ giấc ngủ'] },
      { heading: '🌐 TinniMate', sub: 'Nghe trước khi ngủ', cta: '🌙 Bật Theta Waves →', url: 'tinnimate.vuinghe.com/therapy' },
    ]},
  { id: 'video16_delta_waves', bgmType: 'delta',
    title: 'Sóng Delta — Phục hồi sâu',
    scenes: [
      { heading: '💎 Sóng Delta', sub: '0.5-4 Hz — Giấc ngủ sâu nhất', detail: 'Delta = giai đoạn phục hồi\nCơ thể tự sửa chữa tế bào' },
      { heading: '🔬 Khoa học', sub: 'Tại sao Delta quan trọng?', items: ['Phục hồi hệ thần kinh', 'Tăng hormone tăng trưởng', 'Giảm viêm & đau mãn tính'] },
      { heading: '🌐 TinniMate', sub: 'Phục hồi mỗi đêm', cta: '💎 Bật Delta Waves →', url: 'tinnimate.vuinghe.com/therapy' },
    ]},

  // --- Solfeggio Frequencies (6) ---
  { id: 'video17_174hz', bgmType: 174,
    title: '174 Hz — Giảm đau tự nhiên',
    scenes: [
      { heading: '🎵 174 Hz', sub: 'Tần số nền tảng chữa lành', detail: 'Solfeggio cổ đại\nGiảm đau & căng thẳng thể chất' },
      { heading: '💆 Ứng dụng', sub: 'Khi nào nên nghe 174Hz?', items: ['Đau đầu do ù tai', 'Căng cơ vùng cổ/vai', 'Mệt mỏi kéo dài'] },
      { heading: '🌐 TinniMate', sub: 'Nghe miễn phí', cta: '🎵 Bật 174Hz →', url: 'tinnimate.vuinghe.com/therapy' },
    ]},
  { id: 'video18_417hz', bgmType: 417,
    title: '417 Hz — Xoá bỏ năng lượng tiêu cực',
    scenes: [
      { heading: '🔄 417 Hz', sub: 'Tần số thay đổi & chuyển hóa', detail: 'Giải phóng cảm xúc tiêu cực\nTạo không gian cho sự thay đổi' },
      { heading: '🌟 Lợi ích', sub: 'Nghiên cứu cho thấy', items: ['Giảm cortisol (hormone stress)', 'Cải thiện tâm trạng', 'Hỗ trợ quá trình chữa lành'] },
      { heading: '🌐 TinniMate', sub: 'Thay đổi bắt đầu từ đây', cta: '🔄 Bật 417Hz →', url: 'tinnimate.vuinghe.com/therapy' },
    ]},
  { id: 'video19_432hz', bgmType: 432,
    title: '432 Hz — Tần số vũ trụ',
    scenes: [
      { heading: '🌍 432 Hz', sub: 'Tần số cộng hưởng tự nhiên', detail: 'Hài hòa với nhịp đập trái đất\nĐược gọi là "tần số vũ trụ"' },
      { heading: '🎶 Đặc biệt', sub: 'So với 440Hz tiêu chuẩn', items: ['Ấm áp & êm dịu hơn', 'Giảm lo âu hiệu quả', 'Cân bằng hệ thần kinh'] },
      { heading: '🌐 TinniMate', sub: 'Hòa mình vào vũ trụ', cta: '🌍 Bật 432Hz →', url: 'tinnimate.vuinghe.com/therapy' },
    ]},
  { id: 'video20_528hz', bgmType: 528,
    title: '528 Hz — Tần số tình yêu & DNA',
    scenes: [
      { heading: '💚 528 Hz', sub: 'Tần số phép lạ — Sửa chữa DNA', detail: 'Được gọi là "Love Frequency"\nTần số cộng hưởng của nước' },
      { heading: '🔬 Khoa học', sub: 'Nghiên cứu đã chứng minh', items: ['Giảm cortisol 12%', 'Tăng sản xuất oxytocin', 'Cải thiện miễn dịch'] },
      { heading: '🌐 TinniMate', sub: 'Chữa lành từ bên trong', cta: '💚 Bật 528Hz →', url: 'tinnimate.vuinghe.com/therapy' },
    ]},
  { id: 'video21_741hz', bgmType: 741,
    title: '741 Hz — Thức tỉnh trực giác',
    scenes: [
      { heading: '🔮 741 Hz', sub: 'Tần số giải độc & làm sạch', detail: 'Kích hoạt khả năng tự chữa lành\nLàm sạch nhiễm điện từ' },
      { heading: '🧠 Ứng dụng', sub: 'Lý tưởng cho', items: ['Detox âm thanh hàng ngày', 'Tăng nhận thức & tập trung', 'Cải thiện giao tiếp'] },
      { heading: '🌐 TinniMate', sub: 'Thanh lọc mỗi ngày', cta: '🔮 Bật 741Hz →', url: 'tinnimate.vuinghe.com/therapy' },
    ]},
  { id: 'video22_963hz', bgmType: 963,
    title: '963 Hz — Kết nối tâm linh',
    scenes: [
      { heading: '✨ 963 Hz', sub: 'Tần số giác ngộ — Luân xa vương miện', detail: 'Tần số cao nhất Solfeggio\nKết nối với bản ngã cao hơn' },
      { heading: '🕊️ Trải nghiệm', sub: 'Thiền định sâu', items: ['Tĩnh lặng nội tâm', 'Giảm ù tai bằng mindfulness', 'Cân bằng năng lượng'] },
      { heading: '🌐 TinniMate', sub: 'Thiền cùng Tinni', cta: '✨ Bật 963Hz →', url: 'tinnimate.vuinghe.com/therapy' },
    ]},

  // --- Nature & Features (5) ---
  { id: 'video23_rain_sounds', bgmType: 'rain',
    title: 'Tiếng mưa — Liệu pháp tự nhiên',
    scenes: [
      { heading: '🌧️ Tiếng Mưa', sub: 'Âm thanh chữa lành cổ xưa nhất', detail: 'Pink noise tự nhiên\nPhổ tần số rộng, che phủ ù tai' },
      { heading: '🌿 Nghiên cứu', sub: 'Tại sao mưa hiệu quả?', items: ['Giống pink noise tự nhiên', 'Kích hoạt phản xạ thư giãn', 'Không gây nhàm chán'] },
      { heading: '🌐 TinniMate', sub: '11 âm thanh tự nhiên', cta: '🌧️ Nghe tiếng mưa →', url: 'tinnimate.vuinghe.com/therapy' },
    ]},
  { id: 'video24_ocean_waves', bgmType: 'ocean',
    title: 'Sóng biển — Nhịp thở của đại dương',
    scenes: [
      { heading: '🌊 Sóng Biển', sub: 'Nhịp thở tự nhiên 6-8 lần/phút', detail: 'Sóng vỗ bờ đồng bộ\nvới nhịp thở lý tưởng' },
      { heading: '🏖️ Lợi ích', sub: 'Hơn cả âm thanh đẹp', items: ['Điều hòa nhịp tim', 'Giảm huyết áp tự nhiên', 'Cải thiện giấc ngủ 30%'] },
      { heading: '🌐 TinniMate', sub: 'Đại dương trong tai nghe', cta: '🌊 Nghe sóng biển →', url: 'tinnimate.vuinghe.com/therapy' },
    ]},
  { id: 'video25_forest_night', bgmType: 'forest',
    title: 'Rừng đêm — ASMR chữa lành',
    scenes: [
      { heading: '🌲 Rừng Đêm', sub: 'Dế kêu, gió thổi, lá xào xạc', detail: 'ASMR tự nhiên\nĐa tầng tần số che phủ ù tai' },
      { heading: '🦉 Đặc biệt', sub: 'Tại sao rừng đêm hiệu quả?', items: ['Âm thanh đa lớp liên tục', 'Không có nhịp lặp gây nhàm', 'Kích hoạt trạng thái nghỉ ngơi'] },
      { heading: '🌐 TinniMate', sub: 'Rừng trong tai nghe của bạn', cta: '🌲 Nghe rừng đêm →', url: 'tinnimate.vuinghe.com/therapy' },
    ]},
  { id: 'video26_sound_mixer', bgmType: 'mixer',
    title: 'Sound Mixer — Tự tạo âm thanh',
    scenes: [
      { heading: '🎛️ Sound Mixer', sub: 'Trộn âm thanh theo ý bạn', detail: 'Kết hợp nhiều loại âm thanh\nTùy chỉnh volume từng kênh' },
      { heading: '⚡ Tính năng', sub: 'Unique trên TinniMate', items: ['Mixer 4 kênh độc lập', 'Lưu preset yêu thích', 'Timer tự động tắt'] },
      { heading: '🌐 TinniMate', sub: 'Tạo âm thanh riêng bạn', cta: '🎛️ Mở Mixer →', url: 'tinnimate.vuinghe.com/mixer' },
    ]},
  { id: 'video27_sleep_mode', bgmType: 'sleep',
    title: 'Chế độ ngủ — Tắt dần tự động',
    scenes: [
      { heading: '🌙 Sleep Mode', sub: 'Âm thanh nhỏ dần khi bạn ngủ', detail: 'Timer thông minh\nFade out mượt mà không giật mình' },
      { heading: '⏰ Cách hoạt động', sub: '3 bước đơn giản', items: ['1. Chọn âm thanh trị liệu', '2. Đặt timer (15-90 phút)', '3. Ngủ ngon — tự tắt!'] },
      { heading: '🌐 TinniMate', sub: 'Ngủ ngon mỗi đêm', cta: '🌙 Bật Sleep Mode →', url: 'tinnimate.vuinghe.com/sleep' },
    ]},

  // --- Advanced Topics (3) ---
  { id: 'video28_hearing_test', bgmType: 'test',
    title: 'Kiểm tra thính lực — 2 phút miễn phí',
    scenes: [
      { heading: '👂 Hearing Test', sub: 'Kiểm tra thính lực online', detail: '2 phút • 8 tần số\nKết quả audiogram tức thì' },
      { heading: '📊 Bạn sẽ biết', sub: 'Sau bài test', items: ['Tần số nào bạn nghe kém', 'Mức độ suy giảm (nhẹ/vừa/nặng)', 'Gợi ý trị liệu phù hợp'] },
      { heading: '🌐 TinniMate', sub: 'Test ngay — Không cần đăng ký', cta: '👂 Kiểm tra ngay →', url: 'tinnimate.vuinghe.com/hearing-test' },
    ]},
  { id: 'video29_thi_quiz', bgmType: 'quiz',
    title: 'THI Quiz — Đo mức độ ù tai',
    scenes: [
      { heading: '📋 THI Quiz', sub: 'Tinnitus Handicap Inventory', detail: 'Trắc nghiệm lâm sàng quốc tế\n25 câu hỏi — 5 phút' },
      { heading: '📈 Đánh giá', sub: '5 mức độ ù tai', items: ['0-16: Nhẹ (Grade 1)', '18-36: Vừa (Grade 2)', '38-56: Trung bình (Grade 3)', '58-76: Nặng (Grade 4)', '78-100: Rất nặng (Grade 5)'] },
      { heading: '🌐 TinniMate', sub: 'Theo dõi tiến triển hàng tháng', cta: '📋 Làm THI Quiz →', url: 'tinnimate.vuinghe.com/chat' },
    ]},
  { id: 'video30_progress_tracking', bgmType: 'progress',
    title: 'Theo dõi tiến triển — AI Dashboard',
    scenes: [
      { heading: '📊 Dashboard', sub: 'Theo dõi hành trình chữa lành', detail: 'Biểu đồ tiến triển\nAI phân tích xu hướng' },
      { heading: '🎯 Tính năng', sub: 'Dashboard thông minh', items: ['Biểu đồ THI theo tháng', 'Streak check-in hàng ngày', 'AI gợi ý cá nhân hóa'] },
      { heading: '🌐 TinniMate', sub: 'Bắt đầu theo dõi ngay', cta: '📊 Xem Dashboard →', url: 'tinnimate.vuinghe.com/dashboard' },
    ]},
]

// ── Color themes for each video ──
const THEMES = [
  { bg: '#020617', accent: '#10b981', secondary: '#3b82f6', name: 'emerald' },
  { bg: '#0c0a1a', accent: '#ec4899', secondary: '#8b5cf6', name: 'pink' },
  { bg: '#0a0e1a', accent: '#f59e0b', secondary: '#ef4444', name: 'amber' },
  { bg: '#020617', accent: '#06b6d4', secondary: '#3b82f6', name: 'cyan' },
  { bg: '#0c0a1a', accent: '#a78bfa', secondary: '#6366f1', name: 'violet' },
  { bg: '#0a0e1a', accent: '#14b8a6', secondary: '#059669', name: 'teal' },
  { bg: '#020617', accent: '#f43f5e', secondary: '#e11d48', name: 'rose' },
  { bg: '#0c0a1a', accent: '#22d3ee', secondary: '#0ea5e9', name: 'sky' },
  { bg: '#0a0e1a', accent: '#84cc16', secondary: '#22c55e', name: 'lime' },
  { bg: '#020617', accent: '#fb923c', secondary: '#f97316', name: 'orange' },
]

// ── BGM Generator ──
function generateBGM(type, outputPath) {
  console.log(`  🎵 Generating BGM: ${type}`)
  let cmd = ''

  if (type === 'white') {
    cmd = `"${FFMPEG}" -y -f lavfi -i "anoisesrc=color=white:duration=${DURATION}:amplitude=0.08" -filter_complex "afade=in:d=2,afade=out:st=${DURATION-3}:d=3,lowpass=f=8000,volume=2.5" -ar 44100 -ac 2 -b:a 192k "${outputPath}"`
  } else if (type === 'pink') {
    cmd = `"${FFMPEG}" -y -f lavfi -i "anoisesrc=color=pink:duration=${DURATION}:amplitude=0.1" -filter_complex "afade=in:d=2,afade=out:st=${DURATION-3}:d=3,lowpass=f=6000,volume=2.5" -ar 44100 -ac 2 -b:a 192k "${outputPath}"`
  } else if (type === 'brown') {
    cmd = `"${FFMPEG}" -y -f lavfi -i "anoisesrc=color=brown:duration=${DURATION}:amplitude=0.12" -filter_complex "afade=in:d=2,afade=out:st=${DURATION-3}:d=3,lowpass=f=3000,volume=3.0" -ar 44100 -ac 2 -b:a 192k "${outputPath}"`
  } else if (type === 'alpha') {
    cmd = `"${FFMPEG}" -y -f lavfi -i "sine=frequency=200:duration=${DURATION}" -f lavfi -i "sine=frequency=210:duration=${DURATION}" -f lavfi -i "anoisesrc=color=pink:duration=${DURATION}:amplitude=0.015" -filter_complex "[0]volume=0.3[a];[1]volume=0.3[b];[2]volume=0.2[c];[a][b][c]amix=3,afade=in:d=2,afade=out:st=${DURATION-3}:d=3,volume=3.0" -ar 44100 -ac 2 -b:a 192k "${outputPath}"`
  } else if (type === 'theta') {
    cmd = `"${FFMPEG}" -y -f lavfi -i "sine=frequency=200:duration=${DURATION}" -f lavfi -i "sine=frequency=206:duration=${DURATION}" -f lavfi -i "anoisesrc=color=pink:duration=${DURATION}:amplitude=0.02" -filter_complex "[0]volume=0.3[a];[1]volume=0.3[b];[2]volume=0.15[c];[a][b][c]amix=3,afade=in:d=2,afade=out:st=${DURATION-3}:d=3,volume=3.0" -ar 44100 -ac 2 -b:a 192k "${outputPath}"`
  } else if (type === 'delta') {
    cmd = `"${FFMPEG}" -y -f lavfi -i "sine=frequency=200:duration=${DURATION}" -f lavfi -i "sine=frequency=202:duration=${DURATION}" -f lavfi -i "anoisesrc=color=brown:duration=${DURATION}:amplitude=0.02" -filter_complex "[0]volume=0.3[a];[1]volume=0.3[b];[2]volume=0.2[c];[a][b][c]amix=3,afade=in:d=2,afade=out:st=${DURATION-3}:d=3,volume=3.0" -ar 44100 -ac 2 -b:a 192k "${outputPath}"`
  } else if (type === 'rain') {
    cmd = `"${FFMPEG}" -y -f lavfi -i "anoisesrc=color=pink:duration=${DURATION}:amplitude=0.08" -filter_complex "lowpass=f=4000,highpass=f=100,tremolo=f=0.3:d=0.4,afade=in:d=2,afade=out:st=${DURATION-3}:d=3,volume=3.0" -ar 44100 -ac 2 -b:a 192k "${outputPath}"`
  } else if (type === 'ocean') {
    cmd = `"${FFMPEG}" -y -f lavfi -i "anoisesrc=color=brown:duration=${DURATION}:amplitude=0.1" -filter_complex "lowpass=f=2000,tremolo=f=0.12:d=0.6,afade=in:d=2,afade=out:st=${DURATION-3}:d=3,volume=3.5" -ar 44100 -ac 2 -b:a 192k "${outputPath}"`
  } else if (type === 'forest') {
    cmd = `"${FFMPEG}" -y -f lavfi -i "anoisesrc=color=pink:duration=${DURATION}:amplitude=0.04" -f lavfi -i "sine=frequency=2200:duration=${DURATION}" -filter_complex "[1]volume=0.03,tremolo=f=4:d=0.8[cricket];[0]lowpass=f=5000[wind];[wind][cricket]amix=2,afade=in:d=2,afade=out:st=${DURATION-3}:d=3,volume=3.0" -ar 44100 -ac 2 -b:a 192k "${outputPath}"`
  } else if (typeof type === 'number') {
    const f = type
    const f2 = Math.round(f * 1.5)
    cmd = `"${FFMPEG}" -y -f lavfi -i "sine=frequency=${f}:duration=${DURATION}" -f lavfi -i "sine=frequency=${f2}:duration=${DURATION}" -f lavfi -i "anoisesrc=color=pink:duration=${DURATION}:amplitude=0.015" -filter_complex "[0]volume=0.3[a];[1]volume=0.15[b];[2]volume=0.15[c];[a][b][c]amix=3,tremolo=f=0.5:d=0.3,afade=in:d=2,afade=out:st=${DURATION-3}:d=3,volume=3.0" -ar 44100 -ac 2 -b:a 192k "${outputPath}"`
  } else {
    cmd = `"${FFMPEG}" -y -f lavfi -i "sine=frequency=396:duration=${DURATION}" -f lavfi -i "sine=frequency=528:duration=${DURATION}" -f lavfi -i "anoisesrc=color=pink:duration=${DURATION}:amplitude=0.02" -filter_complex "[0]volume=0.2[a];[1]volume=0.2[b];[2]volume=0.2[c];[a][b][c]amix=3,tremolo=f=0.5:d=0.3,afade=in:d=2,afade=out:st=${DURATION-3}:d=3,volume=3.0" -ar 44100 -ac 2 -b:a 192k "${outputPath}"`
  }

  execSync(cmd, { stdio: 'ignore' })
}

// ── HTML Generator ──
function generateHTML(video, theme, outputPath) {
  const { scenes } = video
  const s = scenes

  const renderScene2Content = () => {
    if (s[1].items) {
      return s[1].items.map((item, i) =>
        `<div class="item" style="animation:slideUp .5s ${10.7 + i*0.3}s both">${item}</div>`
      ).join('\n      ')
    }
    return `<div class="detail" style="animation:slideUp .5s 10.7s both">${s[1].detail || ''}</div>`
  }

  const html = `<!DOCTYPE html>
<html><head><meta charset="utf-8">
<style>
*{margin:0;padding:0;box-sizing:border-box}
body{width:420px;height:746px;overflow:hidden;background:${theme.bg};font-family:'Segoe UI',sans-serif;color:#fff}
.scene{position:absolute;inset:0;display:flex;flex-direction:column;align-items:center;justify-content:center;text-align:center;padding:40px 24px;opacity:0;transform:translateY(30px)}
.scene.s1{opacity:0;transform:translateY(30px)}
.scene.s2{opacity:0;transform:translateY(30px)}
.scene.s3{opacity:0;transform:translateY(30px)}

@keyframes slideUp{0%{opacity:0;transform:translateY(40px)}100%{opacity:1;transform:translateY(0)}}
@keyframes pulse{0%,100%{opacity:.3}50%{opacity:.7}}
@keyframes glow{0%,100%{box-shadow:0 0 20px ${theme.accent}33}50%{box-shadow:0 0 50px ${theme.accent}66}}
@keyframes float{0%,100%{transform:translateY(0)}50%{transform:translateY(-10px)}}

.orb{position:absolute;border-radius:50%;filter:blur(80px);animation:pulse 4s infinite}
.orb1{top:-15%;left:-10%;width:300px;height:300px;background:${theme.accent}15}
.orb2{bottom:10%;right:-20%;width:250px;height:250px;background:${theme.secondary}12;animation-delay:2s}

.heading{font-size:28px;font-weight:800;background:linear-gradient(135deg,${theme.accent},${theme.secondary});-webkit-background-clip:text;-webkit-text-fill-color:transparent;margin-bottom:8px;animation:slideUp .6s .8s both}
.sub{font-size:14px;color:#94a3b8;margin-bottom:16px;animation:slideUp .6s 1.2s both}
.detail{font-size:13px;color:#cbd5e1;white-space:pre-line;line-height:1.8;animation:slideUp .6s 1.6s both}
.emoji-big{font-size:64px;margin-bottom:16px;animation:slideUp .5s .5s both,float 3s 1.5s infinite}

.s2 .heading{animation:slideUp .6s 10.5s both}
.s2 .sub{animation:slideUp .6s 10.6s both}
.items{display:flex;flex-direction:column;gap:8px;max-width:320px;width:100%}
.item{background:rgba(255,255,255,.03);border:1px solid rgba(255,255,255,.05);padding:12px 16px;border-radius:12px;font-size:13px;color:#e2e8f0;text-align:left}

.s3 .heading{animation:slideUp .5s 20.5s both;font-size:20px}
.s3 .sub{animation:slideUp .5s 20.8s both}
.cta-btn{margin-top:20px;background:linear-gradient(135deg,${theme.accent},${theme.secondary});border:none;color:#fff;padding:14px 32px;border-radius:50px;font-size:14px;font-weight:700;animation:slideUp .5s 21.2s both,glow 2s 22s infinite}

.watermark{position:absolute;bottom:16px;left:50%;transform:translateX(-50%);font-size:10px;color:rgba(255,255,255,.15)}
</style></head>
<body>
<div class="orb orb1"></div><div class="orb orb2"></div>

<!-- Scene 1 -->
<div class="scene s1">
  <div class="emoji-big">${s[0].heading.match(/\p{Emoji}/u)?.[0] || '🎵'}</div>
  <div class="heading">${s[0].heading.replace(/\p{Emoji}/gu, '').trim()}</div>
  <div class="sub">${s[0].sub}</div>
  <div class="detail">${s[0].detail}</div>
</div>

<!-- Scene 2 -->
<div class="scene s2">
  <div class="heading">${s[1].heading}</div>
  <div class="sub">${s[1].sub}</div>
  <div class="items">
    ${renderScene2Content()}
  </div>
</div>

<!-- Scene 3 - CTA -->
<div class="scene s3">
  <div class="heading">${s[2].heading}</div>
  <div class="sub">${s[2].sub}</div>
  <div class="cta-btn">${s[2].cta}</div>
</div>

<div class="watermark">@tinnimate • ${s[2].url}</div>

<script>
(function() {
  const scenes = document.querySelectorAll('.scene');
  const timings = [1000, 10500, 20500];
  scenes.forEach(s => { s.style.opacity = '0'; s.style.transition = 'none'; });
  scenes.forEach((scene, i) => {
    setTimeout(() => {
      scene.style.transition = 'opacity 0.6s ease, transform 0.6s ease';
      scene.style.opacity = '1';
      scene.style.transform = 'translateY(0)';
    }, timings[i]);
    if (i < scenes.length - 1) {
      setTimeout(() => {
        scene.style.transition = 'opacity 0.4s ease';
        scene.style.opacity = '0';
      }, timings[i + 1] - 400);
    }
  });
})();
</script>
</body></html>`

  fs.writeFileSync(outputPath, html)
}

// ── Main ──
async function main() {
  console.log('━'.repeat(50))
  console.log('🎬 TinniMate Video Batch Generator v2')
  console.log(`   ${VIDEOS.length} videos • Custom BGM per video`)
  console.log('━'.repeat(50))

  for (let i = 0; i < VIDEOS.length; i++) {
    const v = VIDEOS[i]
    const theme = THEMES[i % THEMES.length]
    const htmlPath = path.join(__dirname, `${v.id}.html`)
    const bgmPath = path.join(BGM_DIR, `${v.id}.mp3`)

    console.log(`\n[${i+1}/${VIDEOS.length}] ${v.title}`)

    // Generate HTML
    generateHTML(v, theme, htmlPath)
    console.log(`  ✅ HTML created`)

    // Generate BGM
    generateBGM(v.bgmType, bgmPath)
    console.log(`  ✅ BGM created (${v.bgmType})`)
  }

  console.log('\n' + '━'.repeat(50))
  console.log(`🎉 Done! ${VIDEOS.length} HTML + BGM files generated`)
  console.log('   Run: node convert_batch2.js to create MP4s')
  console.log('━'.repeat(50))
}

main().catch(e => { console.error('Fatal:', e.message); process.exit(1) })
