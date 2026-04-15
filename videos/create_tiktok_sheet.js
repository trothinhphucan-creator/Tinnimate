#!/usr/bin/env node
/**
 * Upload metadata CSV to Google Sheets for Make.com TikTok automation
 */

const { google } = require('googleapis')
const fs = require('fs')
const path = require('path')

const CLIENT_SECRET = path.join(__dirname, 'client_secret.json')
const TOKEN_FILE = path.join(__dirname, 'gdrive_token.json')

async function main() {
  // Auth
  const creds = JSON.parse(fs.readFileSync(CLIENT_SECRET, 'utf-8'))
  const { client_id, client_secret } = creds.installed || creds.web
  const oauth2 = new google.auth.OAuth2(client_id, client_secret, 'http://localhost')
  const token = JSON.parse(fs.readFileSync(TOKEN_FILE, 'utf-8'))
  oauth2.setCredentials(token)

  // Refresh token if needed
  try {
    const { credentials } = await oauth2.refreshAccessToken()
    oauth2.setCredentials(credentials)
    fs.writeFileSync(TOKEN_FILE, JSON.stringify(credentials, null, 2))
  } catch {}

  const sheets = google.sheets({ version: 'v4', auth: oauth2 })

  // Create spreadsheet
  console.log('📊 Creating Google Sheet...')
  const { data: spreadsheet } = await sheets.spreadsheets.create({
    resource: {
      properties: { title: 'TinniMate TikTok Metadata' },
      sheets: [{
        properties: { title: 'Videos', gridProperties: { frozenRowCount: 1 } }
      }]
    }
  })

  const spreadsheetId = spreadsheet.spreadsheetId
  console.log(`✅ Sheet created: https://docs.google.com/spreadsheets/d/${spreadsheetId}`)

  // Video metadata
  const videos = [
    ['video01_utai_la_gi.mp4', '👂 Ù tai là gì? Tinnitus giải thích đơn giản', 'Bạn có nghe tiếng ù trong tai không? Đó là Tinnitus! TinniMate giúp bạn 💙 tinnimate.vuinghe.com #tinnitus #utai #suckhoe #fyp #tinnimate', 'pending', ''],
    ['video02_white_noise.mp4', '🎧 White Noise giúp ngủ ngon dù bị ù tai', 'White noise che phủ tiếng ù tai, giúp não thư giãn. 85% cải thiện sau 2 tuần! 🌙 #whitenoise #tinnitus #ngungon #fyp #tinnimate', 'pending', ''],
    ['video03_hit_tho_478.mp4', '🌬️ Hít thở 4-7-8: Trị ù tai + mất ngủ 60 giây', 'Kỹ thuật thở 4-7-8: hít 4s, giữ 7s, thở 8s. Giảm stress và ù tai ngay! 🧘 #hittho #478breathing #tinnitus #fyp #tinnimate', 'pending', ''],
    ['video04_70_phan_tram.mp4', '📊 70% người ù tai cải thiện nhờ âm thanh', 'Liệu pháp âm thanh giúp 70% bệnh nhân giảm triệu chứng! TinniMate có 11+ loại âm thanh miễn phí 🎵 #soundtherapy #tinnitus #fyp #tinnimate', 'pending', ''],
    ['video05_thu_gian.mp4', '😌 5 cách thư giãn khi ù tai hành hạ', '5 kỹ thuật: thở sâu, thiền, yoga, âm thanh trị liệu, PMR. TinniMate hướng dẫn từng bước! 🧘 #thugian #tinnitus #relaxation #fyp #tinnimate', 'pending', ''],
    ['video06_notch_therapy.mp4', '🎯 Notch Therapy: Tắt tiếng ù tai bằng khoa học', 'Loại bỏ tần số gây ù tai khỏi âm nhạc. Não dần quên tiếng ù! Hiệu quả sau 3-6 tháng 🎯 #notchtherapy #tinnitus #khoahoc #fyp #tinnimate', 'pending', ''],
    ['video07_cbti.mp4', '💤 CBT-i: Liệu pháp #1 cho mất ngủ do ù tai', 'WHO khuyên dùng CBT-i cho mất ngủ. Không thuốc, không phụ thuộc! 💤 #cbti #matngu #tinnitus #fyp #tinnimate', 'pending', ''],
    ['video08_ai_chat.mp4', '🤖 AI Chat — Bạn đồng hành 24/7 khi ù tai', 'Tinni là chatbot AI hiểu về ù tai, sẵn sàng lắng nghe 24/7! 💬 tinnimate.vuinghe.com/chat #aichatbot #tinnitus #AI #fyp #tinnimate', 'pending', ''],
    ['video09_testimonial.mp4', '💬 TinniMate thay đổi cuộc sống tôi — Review thật', 'Từ mất ngủ vì ù tai đến ngủ ngon mỗi đêm nhờ liệu pháp âm thanh! 🌟 #testimonial #tinnitus #review #fyp #tinnimate', 'pending', ''],
    ['video10_brand.mp4', '💙 TinniMate — Trợ thủ AI đẩy lùi ù tai', 'AI + Liệu pháp âm thanh + Kiểm tra thính lực + Theo dõi tiến triển. Tất cả MIỄN PHÍ! 💙 #tinnimate #tinnitus #app #AI #fyp #healthtech', 'pending', ''],
    ['video11_white_noise_deep.mp4', '🎧 White Noise chuyên sâu — Che phủ hoàn toàn ù tai', 'White noise 20Hz-20kHz che phủ ù tai. 85% giảm chú ý đến tiếng ù! 🎧 #whitenoise #tinnitus #soundtherapy #fyp #tinnimate', 'pending', ''],
    ['video12_pink_noise.mp4', '🌸 Pink Noise — Dịu nhẹ, tốt cho giấc ngủ', 'Pink noise giống tiếng mưa: bass mạnh, treble nhẹ. Phù hợp nghe khi ngủ! 🌸 #pinknoise #tinnitus #sleepsound #fyp #tinnimate', 'pending', ''],
    ['video13_brown_noise.mp4', '🌊 Brown Noise — Sóng âm trầm cho ù tai cao', 'Bass sâu như đại dương. Đặc biệt hiệu quả cho ù tai tần số cao! 🌊 #brownnoise #tinnitus #deepsound #fyp #tinnimate', 'pending', ''],
    ['video14_alpha_waves.mp4', '🧘 Sóng Alpha 8-12Hz — Giảm lo lắng 40%', 'Binaural beats Alpha: thư giãn tỉnh táo, tăng sáng tạo, giảm ù tai! 🧘 #alphawaves #binauralbeats #meditation #fyp #tinnimate', 'pending', ''],
    ['video15_theta_waves.mp4', '🌙 Sóng Theta 4-8Hz — Vào giấc nhanh hơn', 'Theta waves rút ngắn thời gian vào giấc và giảm thức giữa đêm! 🌙 #thetawaves #binauralbeats #deepsleep #fyp #tinnimate', 'pending', ''],
    ['video16_delta_waves.mp4', '💎 Sóng Delta 0.5-4Hz — Phục hồi trong giấc ngủ', 'Delta = ngủ sâu nhất. Phục hồi hệ thần kinh, tăng hormone tăng trưởng! 💎 #deltawaves #deepsleep #recovery #fyp #tinnimate', 'pending', ''],
    ['video17_174hz.mp4', '🎵 174 Hz Solfeggio — Giảm đau tự nhiên', '174Hz giảm đau đầu do ù tai, căng cơ cổ vai, mệt mỏi kéo dài 🎵 #174hz #solfeggio #healingfrequency #fyp #tinnimate', 'pending', ''],
    ['video18_417hz.mp4', '🔄 417 Hz — Xoá năng lượng tiêu cực, giảm cortisol', 'Tần số chuyển hóa: giảm cortisol, cải thiện tâm trạng! 🔄 #417hz #solfeggio #stressrelief #fyp #tinnimate', 'pending', ''],
    ['video19_432hz.mp4', '🌍 432 Hz — Tần số vũ trụ cộng hưởng trái đất', 'Hài hòa với nhịp đập trái đất. Ấm áp & êm dịu hơn 440Hz! 🌍 #432hz #universalfrequency #solfeggio #fyp #tinnimate', 'pending', ''],
    ['video20_528hz.mp4', '💚 528 Hz — Tần số tình yêu, sửa chữa DNA', '"Love Frequency": giảm cortisol 12%, tăng oxytocin, cải thiện miễn dịch! 💚 #528hz #lovefrequency #solfeggio #fyp #tinnimate', 'pending', ''],
    ['video21_741hz.mp4', '🔮 741 Hz — Giải độc & thức tỉnh trực giác', 'Kích hoạt tự chữa lành, làm sạch nhiễm điện từ. Detox âm thanh! 🔮 #741hz #solfeggio #detox #fyp #tinnimate', 'pending', ''],
    ['video22_963hz.mp4', '✨ 963 Hz — Tần số giác ngộ, tĩnh lặng nội tâm', 'Tần số cao nhất Solfeggio. Thiền định sâu, giảm ù tai bằng mindfulness! ✨ #963hz #crownchakra #meditation #fyp #tinnimate', 'pending', ''],
    ['video23_rain_sounds.mp4', '🌧️ Tiếng mưa — Liệu pháp tự nhiên cho ù tai', 'Pink noise tự nhiên, phổ tần rộng, kích hoạt phản xạ thư giãn! 🌧️ #tiengmua #rainsounds #naturesounds #fyp #tinnimate', 'pending', ''],
    ['video24_ocean_waves.mp4', '🌊 Sóng biển — Nhịp thở tự nhiên chữa lành', 'Sóng vỗ bờ đồng bộ nhịp thở 6-8 lần/phút. Giảm huyết áp tự nhiên! 🌊 #oceanwaves #naturesounds #relaxation #fyp #tinnimate', 'pending', ''],
    ['video25_forest_night.mp4', '🌲 Rừng đêm ASMR — Dế kêu, gió, chữa lành', 'Âm thanh đa tầng liên tục, kích hoạt trạng thái nghỉ ngơi! 🌲 #forestsounds #asmr #naturesounds #fyp #tinnimate', 'pending', ''],
    ['video26_sound_mixer.mp4', '🎛️ Sound Mixer — Trộn âm thanh trị liệu riêng bạn', 'Mixer 4 kênh, lưu preset, timer tắt. Chỉ có trên TinniMate! 🎛️ #soundmixer #tinnitus #customsound #fyp #tinnimate', 'pending', ''],
    ['video27_sleep_mode.mp4', '🌙 Sleep Mode — Âm thanh nhỏ dần khi bạn ngủ', 'Chọn âm thanh → đặt timer → ngủ ngon! Fade out mượt mà 🌙 #sleepmode #ngungon #tinnitus #fyp #tinnimate', 'pending', ''],
    ['video28_hearing_test.mp4', '👂 Kiểm tra thính lực online — 2 phút miễn phí', 'Test 8 tần số, kết quả audiogram tức thì, gợi ý trị liệu! 👂 #hearingtest #thinhluc #free #fyp #tinnimate', 'pending', ''],
    ['video29_thi_quiz.mp4', '📋 THI Quiz — Đo mức độ ù tai chuẩn quốc tế', '25 câu hỏi, 5 phút, đánh giá Grade 1-5. Theo dõi hàng tháng! 📋 #THI #tinnitustest #quiz #fyp #tinnimate', 'pending', ''],
    ['video30_progress_tracking.mp4', '📊 Dashboard AI — Theo dõi hành trình chữa lành', 'Biểu đồ THI, streak check-in, AI gợi ý cá nhân hóa! 📊 #dashboard #AI #progresstracking #fyp #tinnimate', 'pending', ''],
  ]

  // Write header + data
  await sheets.spreadsheets.values.update({
    spreadsheetId,
    range: 'Videos!A1:E31',
    valueInputOption: 'RAW',
    resource: {
      values: [
        ['file_name', 'title', 'description', 'status', 'posted_at'],
        ...videos
      ]
    }
  })

  // Make public
  const drive = google.drive({ version: 'v3', auth: oauth2 })
  await drive.permissions.create({
    fileId: spreadsheetId,
    resource: { type: 'anyone', role: 'writer' }
  })

  console.log(`\n✅ Google Sheet created with 30 video metadata!`)
  console.log(`📊 Link: https://docs.google.com/spreadsheets/d/${spreadsheetId}`)
  console.log(`\n👉 Dùng link này trong Make.com Google Sheets module`)
}

main().catch(e => console.error('Error:', e.message))
