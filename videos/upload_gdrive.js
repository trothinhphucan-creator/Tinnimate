#!/usr/bin/env node
/**
 * 🗂️ TinniMate Google Drive Uploader
 * Upload 10 MP4 videos lên Google Drive
 * 
 * Cách dùng: node upload_gdrive.js
 * Cần: client_secret.json (cùng file OAuth với YouTube)
 * 
 * Setup thêm: Bật Google Drive API trong Google Cloud Console
 *   → APIs & Services → Library → "Google Drive API" → Enable
 */

const { google } = require('googleapis')
const fs = require('fs')
const path = require('path')
const readline = require('readline')

const VIDEOS_DIR = path.join(__dirname, 'output')
const CREDENTIALS_FILE = path.join(__dirname, 'client_secret.json')
const TOKEN_FILE = path.join(__dirname, 'gdrive_token.json')
const FOLDER_NAME = 'TinniMate TikTok Videos'

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
    console.log('✅ Đã đăng nhập Google Drive (token saved)')
    return oauth2Client
  }

  const authUrl = oauth2Client.generateAuthUrl({
    access_type: 'offline',
    scope: ['https://www.googleapis.com/auth/drive.file'],
    prompt: 'consent',
  })

  console.log('\n🌐 MỞ LINK NÀY TRONG TRÌNH DUYỆT:')
  console.log(`\n   ${authUrl}\n`)
  console.log('📋 Sau khi đăng nhập, copy phần "code=XXXX" từ URL trên thanh địa chỉ.\n')

  const code = await ask('🔑 Paste code vào đây: ')

  const { tokens } = await oauth2Client.getToken(code)
  oauth2Client.setCredentials(tokens)
  fs.writeFileSync(TOKEN_FILE, JSON.stringify(tokens, null, 2))
  console.log('✅ Token đã lưu!\n')
  return oauth2Client
}

async function getOrCreateFolder(drive) {
  // Check if folder exists
  const res = await drive.files.list({
    q: `name='${FOLDER_NAME}' and mimeType='application/vnd.google-apps.folder' and trashed=false`,
    fields: 'files(id, name)',
  })

  if (res.data.files.length > 0) {
    console.log(`📁 Folder found: ${FOLDER_NAME}`)
    return res.data.files[0].id
  }

  // Create folder
  const folder = await drive.files.create({
    requestBody: {
      name: FOLDER_NAME,
      mimeType: 'application/vnd.google-apps.folder',
    },
    fields: 'id',
  })
  console.log(`📁 Created folder: ${FOLDER_NAME}`)
  return folder.data.id
}

async function uploadFile(drive, filePath, folderId) {
  const fileName = path.basename(filePath)
  const fileSize = fs.statSync(filePath).size
  console.log(`  📤 Uploading: ${fileName} (${(fileSize / 1024 / 1024).toFixed(1)} MB)`)

  const res = await drive.files.create({
    requestBody: {
      name: fileName,
      parents: [folderId],
    },
    media: {
      mimeType: 'video/mp4',
      body: fs.createReadStream(filePath),
    },
    fields: 'id, webViewLink',
  }, {
    onUploadProgress: evt => {
      const pct = Math.round((evt.bytesRead / fileSize) * 100)
      process.stdout.write(`\r  📤 ${pct}%`)
    },
  })

  console.log(`\r  ✅ Uploaded! ${res.data.webViewLink || res.data.id}`)
  return res.data
}

async function main() {
  console.log('━'.repeat(50))
  console.log('🗂️  TinniMate Google Drive Uploader')
  console.log('━'.repeat(50))

  if (!fs.existsSync(VIDEOS_DIR)) {
    console.error('❌ Chạy convert.js trước!'); process.exit(1)
  }

  const auth = await getAuthClient()
  const drive = google.drive({ version: 'v3', auth })

  // Create folder
  const folderId = await getOrCreateFolder(drive)

  // Get video files
  const files = fs.readdirSync(VIDEOS_DIR)
    .filter(f => f.endsWith('.mp4'))
    .sort()

  console.log(`\n📹 ${files.length} videos to upload\n`)

  const results = []
  for (let i = 0; i < files.length; i++) {
    const filePath = path.join(VIDEOS_DIR, files[i])
    console.log(`[${i + 1}/${files.length}] ${files[i]}`)
    try {
      const data = await uploadFile(drive, filePath, folderId)
      results.push({ name: files[i], ok: true, link: data.webViewLink })
    } catch (err) {
      console.error(`  ❌ ${err.message}`)
      results.push({ name: files[i], ok: false, link: null })
    }
  }

  // Make folder shareable
  try {
    await drive.permissions.create({
      fileId: folderId,
      requestBody: { role: 'reader', type: 'anyone' },
    })
    const folderInfo = await drive.files.get({ fileId: folderId, fields: 'webViewLink' })
    console.log(`\n🔗 Folder link (public): ${folderInfo.data.webViewLink}`)
  } catch (e) {
    console.log(`\n📁 Folder ID: ${folderId}`)
  }

  // Summary
  console.log('\n' + '━'.repeat(50))
  console.log('📊 KẾT QUẢ')
  console.log('━'.repeat(50))
  results.forEach(r => console.log(`  ${r.ok ? '✅' : '❌'} ${r.name}`))
  console.log(`\n  ${results.filter(r => r.ok).length}/${files.length} uploaded ✅\n`)
}

main().catch(e => { console.error('Fatal:', e.message); process.exit(1) })
