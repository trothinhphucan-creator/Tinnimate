#!/usr/bin/env node
/**
 * 🔄 Auto-uploader: Watch output/ for new video31-50 files and upload immediately
 */
const { google } = require('googleapis')
const fs = require('fs')
const path = require('path')

const OUTPUT_DIR = path.join(__dirname, 'output')
const CLIENT_SECRET = path.join(__dirname, 'client_secret.json')
const TOKEN_FILE = path.join(__dirname, 'gdrive_token.json')
const FOLDER_NAME = 'TinniMate TikTok Videos'
const CHECK_INTERVAL = 15000 // Check every 15 seconds

const uploaded = new Set()
const TARGET_PATTERN = /^video(3[1-9]|4[0-9]|50).*\.mp4$/

async function main() {
  // Auth
  const creds = JSON.parse(fs.readFileSync(CLIENT_SECRET, 'utf-8'))
  const { client_id, client_secret } = creds.installed || creds.web
  const oauth2 = new google.auth.OAuth2(client_id, client_secret, 'http://localhost')
  const token = JSON.parse(fs.readFileSync(TOKEN_FILE, 'utf-8'))
  oauth2.setCredentials(token)
  try {
    const { credentials } = await oauth2.refreshAccessToken()
    oauth2.setCredentials(credentials)
    fs.writeFileSync(TOKEN_FILE, JSON.stringify(credentials, null, 2))
  } catch {}

  const drive = google.drive({ version: 'v3', auth: oauth2 })

  // Find folder
  const { data: folders } = await drive.files.list({
    q: `name='${FOLDER_NAME}' and mimeType='application/vnd.google-apps.folder'`,
    fields: 'files(id)'
  })
  const folderId = folders.files[0]?.id
  if (!folderId) { console.error('❌ Folder not found'); process.exit(1) }

  console.log('━'.repeat(50))
  console.log('🔄 Auto-Uploader — Watching for new batch 3 videos')
  console.log(`   Checking every ${CHECK_INTERVAL/1000}s`)
  console.log('━'.repeat(50))

  let totalUploaded = 0

  const check = async () => {
    const files = fs.readdirSync(OUTPUT_DIR)
      .filter(f => TARGET_PATTERN.test(f) && !uploaded.has(f))
      .sort()

    for (const file of files) {
      const filePath = path.join(OUTPUT_DIR, file)
      // Make sure file isn't still being written (wait for stable size)
      const size1 = fs.statSync(filePath).size
      await new Promise(r => setTimeout(r, 2000))
      const size2 = fs.statSync(filePath).size
      if (size1 !== size2 || size2 < 100000) continue // Still writing

      console.log(`\n📤 Uploading: ${file} (${(size2/1024/1024).toFixed(1)} MB)`)
      try {
        const res = await drive.files.create({
          resource: { name: file, parents: [folderId] },
          media: { mimeType: 'video/mp4', body: fs.createReadStream(filePath) },
          fields: 'id,webViewLink'
        })
        uploaded.add(file)
        totalUploaded++
        console.log(`  ✅ ${file} → ${res.data.webViewLink}`)
        console.log(`  📊 ${totalUploaded}/20 uploaded`)
      } catch (err) {
        console.log(`  ❌ ${file}: ${err.message}`)
      }
    }

    if (totalUploaded >= 20) {
      console.log('\n🎉 All 20 videos uploaded! Exiting.')
      process.exit(0)
    }
  }

  // Run immediately then on interval
  await check()
  setInterval(check, CHECK_INTERVAL)
}

main().catch(e => console.error('Fatal:', e.message))
