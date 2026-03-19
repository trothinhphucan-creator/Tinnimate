#!/usr/bin/env node
/**
 * 🎬 TinniMate TikTok Video Generator
 * 
 * Chuyển 10 file HTML animation → MP4 video (1080x1920, TikTok vertical)
 * 
 * Cách dùng:
 *   1. Cài FFmpeg:  sudo apt install -y ffmpeg
 *   2. Chạy script: node convert.js
 *   3. Output:      ./output/video01_utai_la_gi.mp4, ...
 * 
 * Script sẽ:
 *   - Mở từng HTML file bằng Chromium (headless)
 *   - Chụp 30 FPS screenshots trong 16 giây  
 *   - Ghép thành MP4 bằng FFmpeg
 */

const puppeteer = require('puppeteer-core')
const { execSync, exec } = require('child_process')
const fs = require('fs')
const path = require('path')

// Config
const VIDEOS_DIR = __dirname
const OUTPUT_DIR = path.join(VIDEOS_DIR, 'output')
const FRAMES_DIR = path.join(VIDEOS_DIR, 'frames')
const WIDTH = 1080      // TikTok width
const HEIGHT = 1920     // TikTok height  
const FPS = 15          // Frames per second (15 is enough for CSS animations)
const DURATION = 30     // Seconds per video
const BGM_FILE = path.join(VIDEOS_DIR, 'bgm.mp3')
const DEVICE_SCALE = 2  // 2x for crisp text (420*2=840 → scale up to 1080)

const HTML_FILES = [
  'video01_utai_la_gi.html',
  'video02_white_noise.html',
  'video03_hit_tho_478.html',
  'video04_70_phan_tram.html',
  'video05_thu_gian.html',
  'video06_notch_therapy.html',
  'video07_cbti.html',
  'video08_ai_chat.html',
  'video09_testimonial.html',
  'video10_brand.html',
]

// Find Chromium/Chrome
function findBrowser() {
  const paths = [
    '/usr/bin/chromium-browser',
    '/usr/bin/chromium',
    '/snap/bin/chromium',
    '/usr/bin/google-chrome',
    '/usr/bin/google-chrome-stable',
  ]
  for (const p of paths) {
    if (fs.existsSync(p)) return p
  }
  throw new Error('Chromium/Chrome not found! Install: sudo apt install chromium-browser')
}

// Check FFmpeg — try npm package first, then system
let FFMPEG_PATH = 'ffmpeg'
function hasFFmpeg() {
  try {
    FFMPEG_PATH = require('@ffmpeg-installer/ffmpeg').path
    console.log(`✅ FFmpeg (npm): ${FFMPEG_PATH}`)
    return true
  } catch {}
  try {
    execSync('ffmpeg -version', { stdio: 'ignore' })
    console.log('✅ FFmpeg (system)')
    return true
  } catch {
    return false
  }
}

async function captureFrames(browser, htmlFile, framesSubDir) {
  const name = path.basename(htmlFile, '.html')
  console.log(`\n📸 Capturing frames: ${name}`)
  
  fs.mkdirSync(framesSubDir, { recursive: true })
  
  const page = await browser.newPage()
  await page.setViewport({ width: 420, height: 746, deviceScaleFactor: DEVICE_SCALE })
  
  const fileUrl = `file://${path.resolve(VIDEOS_DIR, htmlFile)}`
  await page.goto(fileUrl, { waitUntil: 'load' })
  
  const totalFrames = FPS * DURATION
  const intervalMs = 1000 / FPS
  
  for (let i = 0; i < totalFrames; i++) {
    const frameNum = String(i).padStart(5, '0')
    const framePath = path.join(framesSubDir, `frame_${frameNum}.png`)
    
    await page.screenshot({ path: framePath, type: 'png' })
    
    if (i % (FPS * 2) === 0) {
      const sec = Math.round(i / FPS)
      process.stdout.write(`  ${sec}s/${DURATION}s `)
    }
    
    // Wait for next frame timing
    await new Promise(r => setTimeout(r, intervalMs))
  }
  
  await page.close()
  console.log(`  ✅ ${totalFrames} frames captured`)
  return totalFrames
}

function assembleVideo(framesSubDir, outputPath) {
  const name = path.basename(outputPath)
  console.log(`🎬 Assembling: ${name}`)
  
  const hasBgm = fs.existsSync(BGM_FILE)
  const cmd = [
    `"${FFMPEG_PATH}" -y`,
    `-framerate ${FPS}`,
    `-i "${framesSubDir}/frame_%05d.png"`,
    hasBgm ? `-i "${BGM_FILE}"` : '',
    `-vf "scale=${WIDTH}:${HEIGHT}:force_original_aspect_ratio=decrease,pad=${WIDTH}:${HEIGHT}:(ow-iw)/2:(oh-ih)/2:color=020617"`,
    '-c:v libx264',
    '-preset fast',
    '-crf 23',
    '-pix_fmt yuv420p',
    hasBgm ? '-c:a aac -b:a 128k -shortest' : '',
    '-movflags +faststart',
    `"${outputPath}"`,
  ].filter(Boolean).join(' ')
  
  execSync(cmd, { stdio: 'inherit' })
  
  // Clean up frames
  fs.rmSync(framesSubDir, { recursive: true, force: true })
  
  const size = (fs.statSync(outputPath).size / 1024 / 1024).toFixed(1)
  console.log(`  ✅ ${name} (${size} MB)\n`)
}

async function main() {
  console.log('━'.repeat(50))
  console.log('🎬 TinniMate TikTok Video Generator')
  console.log(`   ${HTML_FILES.length} videos • ${WIDTH}x${HEIGHT} • ${FPS}fps • ${DURATION}s each`)
  console.log('━'.repeat(50))
  
  // Check FFmpeg
  if (!hasFFmpeg()) {
    console.error('\n❌ FFmpeg chưa được cài đặt!')
    console.error('   Chạy lệnh: sudo apt install -y ffmpeg')
    console.error('   Sau đó chạy lại: node convert.js\n')
    
    // Offer frames-only mode
    console.log('💡 Hoặc chạy ở chế độ chụp frames (không cần FFmpeg):')
    console.log('   node convert.js --frames-only\n')
    
    if (!process.argv.includes('--frames-only')) {
      process.exit(1)
    }
  }
  
  const framesOnly = process.argv.includes('--frames-only') || !hasFFmpeg()
  
  // Setup dirs
  fs.mkdirSync(OUTPUT_DIR, { recursive: true })
  fs.mkdirSync(FRAMES_DIR, { recursive: true })
  
  // Launch browser
  console.log('\n🌐 Launching Chromium...')
  const browser = await puppeteer.launch({
    executablePath: findBrowser(),
    headless: 'new',
    args: [
      '--no-sandbox',
      '--disable-setuid-sandbox',
      '--disable-gpu',
      '--disable-dev-shm-usage',
    ],
  })
  
  console.log('✅ Browser ready\n')
  
  const results = []
  
  for (const htmlFile of HTML_FILES) {
    const name = path.basename(htmlFile, '.html')
    const framesSubDir = path.join(FRAMES_DIR, name)
    const outputPath = path.join(OUTPUT_DIR, `${name}.mp4`)
    
    try {
      await captureFrames(browser, htmlFile, framesSubDir)
      
      if (!framesOnly) {
        assembleVideo(framesSubDir, outputPath)
        results.push({ name, status: '✅', path: outputPath })
      } else {
        results.push({ name, status: '📸', path: framesSubDir })
      }
    } catch (err) {
      console.error(`  ❌ Error: ${err.message}`)
      results.push({ name, status: '❌', path: err.message })
    }
  }
  
  await browser.close()
  
  // Summary
  console.log('\n' + '━'.repeat(50))
  console.log('📊 KẾT QUẢ')
  console.log('━'.repeat(50))
  for (const r of results) {
    console.log(`  ${r.status} ${r.name}`)
  }
  
  if (framesOnly) {
    console.log(`\n📁 Frames saved at: ${FRAMES_DIR}/`)
    console.log('\n🔧 Để ghép thành MP4, cài FFmpeg rồi chạy:')
    console.log('   sudo apt install -y ffmpeg && node convert.js')
  } else {
    console.log(`\n📁 Videos saved at: ${OUTPUT_DIR}/`)
    console.log(`   Total: ${results.filter(r => r.status === '✅').length}/${HTML_FILES.length} videos`)
  }
  
  console.log('\n🎉 Done!\n')
}

main().catch(err => {
  console.error('Fatal error:', err)
  process.exit(1)
})
