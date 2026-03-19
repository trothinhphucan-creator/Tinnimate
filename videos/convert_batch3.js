#!/usr/bin/env node
/**
 * 🎬 Convert Batch 3 — 20 videos (31-50) with images + CSS animations + meditation BGM
 */
const puppeteer = require('puppeteer-core')
const { execSync } = require('child_process')
const fs = require('fs')
const path = require('path')

const VIDEOS_DIR = __dirname
const OUTPUT_DIR = path.join(VIDEOS_DIR, 'output')
const FRAMES_DIR = path.join(VIDEOS_DIR, 'frames')
const BGM_DIR = path.join(VIDEOS_DIR, 'bgm')
const WIDTH = 1080, HEIGHT = 1920, FPS = 15, DURATION = 30, DEVICE_SCALE = 2

const HTML_FILES = fs.readdirSync(VIDEOS_DIR)
  .filter(f => /^video(3[1-9]|4[0-9]|50).*\.html$/.test(f))
  .sort()

function findBrowser() {
  for (const p of ['/usr/bin/chromium-browser','/usr/bin/chromium','/snap/bin/chromium','/usr/bin/google-chrome'])
    if (fs.existsSync(p)) return p
  throw new Error('No browser found')
}

let FFMPEG = 'ffmpeg'
try { FFMPEG = require('@ffmpeg-installer/ffmpeg').path } catch {}

async function captureFrames(browser, htmlFile, framesSubDir) {
  const name = path.basename(htmlFile, '.html')
  console.log(`\n📸 Capturing: ${name}`)
  fs.mkdirSync(framesSubDir, { recursive: true })
  const page = await browser.newPage()
  await page.setViewport({ width: 420, height: 746, deviceScaleFactor: DEVICE_SCALE })
  await page.goto(`file://${path.resolve(VIDEOS_DIR, htmlFile)}`, { waitUntil: 'load' })
  const totalFrames = FPS * DURATION
  for (let i = 0; i < totalFrames; i++) {
    await page.screenshot({ path: path.join(framesSubDir, `frame_${String(i).padStart(5,'0')}.png`), type: 'png' })
    if (i % (FPS*2) === 0) process.stdout.write(`  ${Math.round(i/FPS)}s/${DURATION}s `)
    await new Promise(r => setTimeout(r, 1000/FPS))
  }
  await page.close()
  console.log(`  ✅ ${totalFrames} frames`)
}

function assembleVideo(framesSubDir, outputPath, bgmPath) {
  const name = path.basename(outputPath)
  console.log(`🎬 Assembling: ${name}`)
  const hasBgm = bgmPath && fs.existsSync(bgmPath)
  const cmd = [
    `"${FFMPEG}" -y`,
    `-framerate ${FPS}`,
    `-i "${framesSubDir}/frame_%05d.png"`,
    hasBgm ? `-i "${bgmPath}"` : '',
    `-vf "scale=${WIDTH}:${HEIGHT}:force_original_aspect_ratio=decrease,pad=${WIDTH}:${HEIGHT}:(ow-iw)/2:(oh-ih)/2:color=020617"`,
    '-c:v libx264 -preset fast -crf 23 -pix_fmt yuv420p',
    hasBgm ? '-c:a aac -b:a 128k -shortest' : '',
    '-movflags +faststart',
    `"${outputPath}"`,
  ].filter(Boolean).join(' ')
  execSync(cmd, { stdio: 'inherit' })
  fs.rmSync(framesSubDir, { recursive: true, force: true })
  const size = (fs.statSync(outputPath).size / 1024 / 1024).toFixed(1)
  console.log(`  ✅ ${name} (${size} MB)\n`)
}

async function main() {
  console.log('━'.repeat(50))
  console.log(`🎬 TinniMate Batch 3 — ${HTML_FILES.length} videos`)
  console.log(`   ${WIDTH}x${HEIGHT} • ${FPS}fps • ${DURATION}s • Images + Animations`)
  console.log('━'.repeat(50))
  if (!HTML_FILES.length) { console.error('❌ No video31-50 HTML files!'); process.exit(1) }
  fs.mkdirSync(OUTPUT_DIR, { recursive: true })
  fs.mkdirSync(FRAMES_DIR, { recursive: true })
  const browser = await puppeteer.launch({
    executablePath: findBrowser(), headless: 'new',
    args: ['--no-sandbox','--disable-setuid-sandbox','--disable-gpu','--disable-dev-shm-usage'],
  })
  const results = []
  for (const htmlFile of HTML_FILES) {
    const name = path.basename(htmlFile, '.html')
    const framesSubDir = path.join(FRAMES_DIR, name)
    const outputPath = path.join(OUTPUT_DIR, `${name}.mp4`)
    const bgmPath = path.join(BGM_DIR, `${name}.mp3`)
    try {
      await captureFrames(browser, htmlFile, framesSubDir)
      assembleVideo(framesSubDir, outputPath, bgmPath)
      results.push({ name, status: '✅' })
    } catch (err) {
      console.error(`  ❌ ${err.message}`)
      results.push({ name, status: '❌' })
    }
  }
  await browser.close()
  console.log('\n' + '━'.repeat(50))
  console.log('📊 KẾT QUẢ'); console.log('━'.repeat(50))
  results.forEach(r => console.log(`  ${r.status} ${r.name}`))
  console.log(`\n  ${results.filter(r=>r.status==='✅').length}/${HTML_FILES.length} videos`)
  console.log('\n🎉 Done!\n')
}
main().catch(e => { console.error('Fatal:', e); process.exit(1) })
