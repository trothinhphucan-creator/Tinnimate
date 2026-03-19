#!/usr/bin/env node
/**
 * 🚀 PARALLEL v3 — 2 workers, real-time capture, NO CDP overhead
 * 
 * Fix: 2 workers (not 4) = enough CPU per worker for smooth real-time animation
 * Each worker runs on a SEPARATE browser instance for true isolation
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
const WORKERS = 2

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

async function processVideo(browser, htmlFile) {
  const name = path.basename(htmlFile, '.html')
  const framesSubDir = path.join(FRAMES_DIR, name)
  const outputPath = path.join(OUTPUT_DIR, `${name}.mp4`)
  const bgmPath = path.join(BGM_DIR, `${name}.mp3`)

  if (fs.existsSync(outputPath)) {
    console.log(`  ⏭️  ${name}`)
    return { name, status: '⏭️' }
  }

  try {
    fs.mkdirSync(framesSubDir, { recursive: true })
    const page = await browser.newPage()
    await page.setViewport({ width: 420, height: 746, deviceScaleFactor: DEVICE_SCALE })
    await page.goto(`file://${path.resolve(VIDEOS_DIR, htmlFile)}`, { waitUntil: 'load' })

    const totalFrames = FPS * DURATION
    for (let i = 0; i < totalFrames; i++) {
      await page.screenshot({ 
        path: path.join(framesSubDir, `frame_${String(i).padStart(5,'0')}.png`), 
        type: 'png' 
      })
      // Real-time wait — with 2 workers CPU can handle it
      await new Promise(r => setTimeout(r, 1000 / FPS))
    }
    await page.close()

    // Assemble
    const hasBgm = fs.existsSync(bgmPath)
    const cmd = [
      `"${FFMPEG}" -y -framerate ${FPS}`,
      `-i "${framesSubDir}/frame_%05d.png"`,
      hasBgm ? `-i "${bgmPath}"` : '',
      `-vf "scale=${WIDTH}:${HEIGHT}:force_original_aspect_ratio=decrease,pad=${WIDTH}:${HEIGHT}:(ow-iw)/2:(oh-ih)/2:color=020617"`,
      '-c:v libx264 -preset fast -crf 23 -pix_fmt yuv420p',
      hasBgm ? '-c:a aac -b:a 128k -shortest' : '',
      '-movflags +faststart',
      `"${outputPath}"`,
    ].filter(Boolean).join(' ')
    execSync(cmd, { stdio: 'ignore' })
    fs.rmSync(framesSubDir, { recursive: true, force: true })

    const size = (fs.statSync(outputPath).size / 1024 / 1024).toFixed(1)
    console.log(`  ✅ ${name} (${size} MB)`)
    return { name, status: '✅' }
  } catch (err) {
    console.error(`  ❌ ${name}: ${err.message}`)
    fs.rmSync(framesSubDir, { recursive: true, force: true })
    return { name, status: '❌' }
  }
}

async function worker(queue, results, workerId) {
  // Each worker gets its own browser for isolation
  const browser = await puppeteer.launch({
    executablePath: findBrowser(), headless: 'new',
    args: ['--no-sandbox','--disable-setuid-sandbox','--disable-gpu',
           '--disable-dev-shm-usage','--disable-software-rasterizer'],
  })

  while (queue.length > 0) {
    const htmlFile = queue.shift()
    if (!htmlFile) break
    const done = HTML_FILES.length - queue.length
    console.log(`\n🔧 W${workerId} | [${done}/${HTML_FILES.length}] ${path.basename(htmlFile, '.html')}`)
    const result = await processVideo(browser, htmlFile)
    results.push(result)
  }

  await browser.close()
}

async function main() {
  const startTime = Date.now()
  console.log('━'.repeat(50))
  console.log(`🚀 PARALLEL v3 — ${WORKERS} isolated browsers`)
  console.log(`   ${HTML_FILES.length} videos • ${WIDTH}x${HEIGHT} • ${FPS}fps • ${DURATION}s`)
  console.log('━'.repeat(50))

  if (!HTML_FILES.length) { console.error('❌ No files!'); process.exit(1) }
  fs.mkdirSync(OUTPUT_DIR, { recursive: true })
  fs.mkdirSync(FRAMES_DIR, { recursive: true })

  const queue = [...HTML_FILES]
  const results = []
  const workerPromises = []
  for (let i = 0; i < WORKERS; i++) {
    workerPromises.push(worker(queue, results, i + 1))
  }
  await Promise.all(workerPromises)

  const elapsed = ((Date.now() - startTime) / 60000).toFixed(1)
  console.log('\n' + '━'.repeat(50))
  console.log('📊 RESULTS'); console.log('━'.repeat(50))
  results.sort((a,b) => a.name.localeCompare(b.name))
  results.forEach(r => console.log(`  ${r.status} ${r.name}`))
  const ok = results.filter(r => r.status === '✅').length
  console.log(`\n  ${ok}/${HTML_FILES.length} videos in ${elapsed} min`)
  console.log('🎉 Done!\n')
}

main().catch(e => { console.error('Fatal:', e); process.exit(1) })
