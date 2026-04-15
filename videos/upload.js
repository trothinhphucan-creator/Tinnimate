#!/usr/bin/env node
/**
 * 🎬 TinniMate YouTube Uploader
 * Upload 10 TikTok videos lên YouTube tự động
 * 
 * Cách dùng: node upload.js
 * Lần đầu: copy link → đăng nhập → paste code vào terminal
 */

const { google } = require('googleapis')
const fs = require('fs')
const path = require('path')
const readline = require('readline')

const VIDEOS_DIR = path.join(__dirname, 'output')
const CREDENTIALS_FILE = path.join(__dirname, 'client_secret.json')
const TOKEN_FILE = path.join(__dirname, 'youtube_token.json')

const VIDEOS = [
  { file: 'video01_utai_la_gi.mp4', title: '👂 Ù tai là gì? Tinnitus giải thích đơn giản | TinniMate', tags: ['tinnitus','ù tai','thính giác','TinniMate'], category: '26',
    description: `Ù tai (Tinnitus) là gì? 15% dân số thế giới bị ù tai. 70% kèm nghe kém. 80% cải thiện khi can thiệp sớm.\n\n💙 TinniMate — Trợ thủ giúp đẩy lùi ù tai\n🌐 https://tinnimate.vuinghe.com\n\n#tinnitus #utai #tinniMate #suckhoe #thinhgiac` },
  { file: 'video02_white_noise.mp4', title: '🎧 White Noise giúp bạn ngủ ngon dù bị ù tai | TinniMate', tags: ['white noise','sound therapy','tinnitus','ngủ ngon','TinniMate'], category: '26',
    description: `11 âm thanh trị liệu: White/Pink/Brown Noise, sóng biển, mưa, rừng đêm.\n\n🌙 Nghe ngay đêm nay — miễn phí!\n🌐 https://tinnimate.vuinghe.com\n\n#whitenoise #soundtherapy #tinnitus` },
  { file: 'video03_hit_tho_478.mp4', title: '🫁 Hít thở 4-7-8 giảm ù tai tức thì | TinniMate', tags: ['hít thở 4-7-8','breathing','tinnitus','TinniMate'], category: '26',
    description: `Kỹ thuật hít thở 4-7-8: Hít 4s → Giữ 7s → Thở 8s. Lặp 4 lần mỗi tối.\n\n💙 https://tinnimate.vuinghe.com\n\n#breathing #hittho478 #tinnitus` },
  { file: 'video04_70_phan_tram.mp4', title: '📊 70% người ù tai bị nghe kém | TinniMate', tags: ['hearing loss','nghe kém','tinnitus','TinniMate'], category: '26',
    description: `70% người bị tinnitus có suy giảm thính lực. Can thiệp sớm cải thiện 80% trường hợp.\n\n👂 Kiểm tra miễn phí: https://tinnimate.vuinghe.com\n\n#hearingloss #tinnitus` },
  { file: 'video05_thu_gian.mp4', title: '😌 1 phút thư giãn cùng Tinni — Giảm ù tai | TinniMate', tags: ['thư giãn','relaxation','tinnitus','TinniMate'], category: '26',
    description: `PMR giảm 40% cường độ ù tai sau 4 tuần. 12+ bài tập trên TinniMate.\n\n💙 https://tinnimate.vuinghe.com\n\n#relaxation #thugian #tinnitus` },
  { file: 'video06_notch_therapy.mp4', title: '🎯 Notch Therapy — Công nghệ mới trị ù tai | TinniMate', tags: ['notch therapy','tinnitus treatment','TinniMate'], category: '28',
    description: `Liệu pháp notch nhắm đúng tần số ù tai. Giảm 25-50% cường độ ù sau 3-6 tháng.\n\n🎯 https://tinnimate.vuinghe.com\n\n#notchtherapy #tinnitus` },
  { file: 'video07_cbti.mp4', title: '🧠 CBT-i: Ngủ ngon không cần thuốc — WHO khuyến nghị | TinniMate', tags: ['CBT-i','insomnia','mất ngủ','TinniMate'], category: '26',
    description: `CBT-i 4 tuần: Nhật ký giấc ngủ → Hạn chế → Kiểm soát kích thích → Tái cấu trúc nhận thức.\n\n💙 https://tinnimate.vuinghe.com\n\n#CBTi #insomnia #tinnitus` },
  { file: 'video08_ai_chat.mp4', title: '💬 Chat với AI chuyên biệt về ù tai — 24/7 | TinniMate', tags: ['AI chat','chatbot','tinnitus','TinniMate'], category: '28',
    description: `Tinni AI: bật âm thanh, hướng dẫn hít thở, kiểm tra thính lực, tư vấn y tế. 2 tin nhắn miễn phí!\n\n💬 https://tinnimate.vuinghe.com/chat\n\n#AIchat #tinnitus` },
  { file: 'video09_testimonial.mp4', title: '💚 Ù tai 5 năm, THI giảm 56→32 sau 3 tháng | TinniMate', tags: ['tinnitus testimonial','THI','TinniMate'], category: '26',
    description: `Bác Hùng, 65 tuổi: "Dùng TinniMate 3 tháng, THI giảm từ 56 xuống 32."\n\n💙 https://tinnimate.vuinghe.com\n\n#tinnitus #testimonial #utai` },
  { file: 'video10_brand.mp4', title: '💙 TinniMate — Trợ thủ giúp đẩy lùi ù tai | 9 công cụ', tags: ['TinniMate','tinnitus app','ù tai','AI health'], category: '28',
    description: `TinniMate: AI Chat, Sound Therapy, Hearing Test, Quiz, Relaxation, Notch, CBT-i, Sleep, Progress.\n\n✨ Miễn phí: https://tinnimate.vuinghe.com\n\n#TinniMate #tinnitus` },
]

function ask(question) {
  const rl = readline.createInterface({ input: process.stdin, output: process.stdout })
  return new Promise(resolve => rl.question(question, ans => { rl.close(); resolve(ans.trim()) }))
}

async function getAuthClient() {
  if (!fs.existsSync(CREDENTIALS_FILE)) {
    console.error(`❌ Chưa có file ${CREDENTIALS_FILE}`); process.exit(1)
  }
  const creds = JSON.parse(fs.readFileSync(CREDENTIALS_FILE, 'utf-8'))
  const { client_id, client_secret } = creds.installed || creds.web
  const oauth2Client = new google.auth.OAuth2(client_id, client_secret, 'http://localhost')

  if (fs.existsSync(TOKEN_FILE)) {
    const token = JSON.parse(fs.readFileSync(TOKEN_FILE, 'utf-8'))
    oauth2Client.setCredentials(token)
    if (token.expiry_date && token.expiry_date < Date.now()) {
      console.log('🔄 Refreshing token...')
      const { credentials } = await oauth2Client.refreshAccessToken()
      oauth2Client.setCredentials(credentials)
      fs.writeFileSync(TOKEN_FILE, JSON.stringify(credentials, null, 2))
    }
    console.log('✅ Đã đăng nhập (token saved)')
    return oauth2Client
  }

  const authUrl = oauth2Client.generateAuthUrl({
    access_type: 'offline',
    scope: ['https://www.googleapis.com/auth/youtube.upload'],
    prompt: 'consent',
  })

  console.log('\n🌐 MỞ LINK NÀY TRONG TRÌNH DUYỆT:')
  console.log(`\n   ${authUrl}\n`)
  console.log('📋 Sau khi đăng nhập & cho phép, bạn sẽ được chuyển đến trang localhost.')
  console.log('   Copy phần "code=XXXX" từ URL trên thanh địa chỉ.')
  console.log('   (Hoặc nếu Google hiện code trực tiếp, copy code đó)\n')

  const code = await ask('🔑 Paste code vào đây: ')

  const { tokens } = await oauth2Client.getToken(code)
  oauth2Client.setCredentials(tokens)
  fs.writeFileSync(TOKEN_FILE, JSON.stringify(tokens, null, 2))
  console.log('✅ Token đã lưu!\n')
  return oauth2Client
}

async function uploadVideo(youtube, v) {
  const filePath = path.join(VIDEOS_DIR, v.file)
  if (!fs.existsSync(filePath)) { console.log(`  ⏭️ Skip: ${v.file}`); return null }
  const fileSize = fs.statSync(filePath).size
  console.log(`  📤 Uploading: ${v.file} (${(fileSize/1024/1024).toFixed(1)} MB)`)

  const res = await youtube.videos.insert({
    part: ['snippet','status'],
    requestBody: {
      snippet: { title: v.title, description: v.description, tags: v.tags, categoryId: v.category, defaultLanguage: 'vi', defaultAudioLanguage: 'vi' },
      status: { privacyStatus: 'public', selfDeclaredMadeForKids: false },
    },
    media: { body: fs.createReadStream(filePath) },
  }, {
    onUploadProgress: evt => process.stdout.write(`\r  📤 ${Math.round((evt.bytesRead/fileSize)*100)}%`),
  })
  console.log(`\r  ✅ Uploaded! https://youtu.be/${res.data.id}`)
  return res.data.id
}

async function main() {
  console.log('━'.repeat(50))
  console.log('🎬 TinniMate YouTube Uploader — 10 videos')
  console.log('━'.repeat(50))

  if (!fs.existsSync(VIDEOS_DIR)) { console.error('❌ Chạy convert.js trước!'); process.exit(1) }

  const auth = await getAuthClient()
  const youtube = google.youtube({ version: 'v3', auth })

  const results = []
  for (let i = 0; i < VIDEOS.length; i++) {
    console.log(`\n[${i+1}/10] ${VIDEOS[i].title.slice(0,50)}...`)
    try {
      const id = await uploadVideo(youtube, VIDEOS[i])
      results.push({ name: VIDEOS[i].file, ok: !!id, id })
    } catch (err) {
      console.error(`  ❌ ${err.message}`)
      results.push({ name: VIDEOS[i].file, ok: false, id: null })
    }
    if (i < VIDEOS.length-1) { console.log('  ⏳ 5s...'); await new Promise(r=>setTimeout(r,5000)) }
  }

  console.log('\n' + '━'.repeat(50))
  console.log('📊 KẾT QUẢ')
  console.log('━'.repeat(50))
  results.forEach(r => console.log(`  ${r.ok?'✅':'❌'} ${r.name} ${r.id?'https://youtu.be/'+r.id:''}`))
  console.log(`\n  ${results.filter(r=>r.ok).length}/10 uploaded ✅\n`)
}

main().catch(e => { console.error('Fatal:', e.message); process.exit(1) })
