#!/usr/bin/env node
/**
 * Fix overlapping frames in all video HTML files.
 * Problem: scenes use fadeIn+forwards, never fade out → stack on top of each other
 * Fix: scenes 1-3 use showHide (fade in → stay → fade out), scene 4 uses fadeIn only
 */
const fs = require('fs')
const path = require('path')

const dir = __dirname
const files = fs.readdirSync(dir).filter(f => f.startsWith('video') && f.endsWith('.html'))

console.log(`🔧 Fixing ${files.length} video files...\n`)

for (const file of files) {
  const filePath = path.join(dir, file)
  let html = fs.readFileSync(filePath, 'utf-8')

  // Determine how many scenes (s1, s2, s3, s4?)
  const hasS4 = html.includes('class="scene s4"')
  const sceneCount = hasS4 ? 4 : 3

  // Remove old fadeIn keyframe and scene animation rules
  // Replace with new showHide + fadeIn keyframes

  // Extract timing: find animation delays for each scene
  // Pattern: .scene.sN{animation:fadeIn .8s Xs forwards}
  const sceneTimings = []
  for (let i = 1; i <= sceneCount; i++) {
    const regex = new RegExp(`\\.scene\\.s${i}\\{animation:\\s*fadeIn\\s+[\\d.]+s\\s+([\\d.]+)s\\s+forwards\\}`)
    const match = html.match(regex)
    if (match) {
      sceneTimings.push(parseFloat(match[1]))
    } else {
      // Default timings
      if (sceneCount === 4) sceneTimings.push([0.5, 4, 8, 12][i-1])
      else sceneTimings.push([0.5, 5, 10][i-1])
    }
  }

  console.log(`  ${file}: ${sceneCount} scenes, timings: [${sceneTimings.join(', ')}]s`)

  // Calculate durations for showHide
  // Each scene visible from its start time to next scene's start time
  const durations = []
  for (let i = 0; i < sceneCount - 1; i++) {
    durations.push(sceneTimings[i + 1] - sceneTimings[i])
  }
  durations.push(4) // last scene stays 4s

  // Build new CSS rules
  // showHide: fade in 15%, stay visible 80%, fade out 100%
  const newAnimations = []
  for (let i = 0; i < sceneCount; i++) {
    const sNum = i + 1
    const delay = sceneTimings[i]
    const dur = durations[i]

    if (i < sceneCount - 1) {
      // Show then hide
      newAnimations.push(`.scene.s${sNum}{animation:showHide ${dur}s ${delay}s both}`)
    } else {
      // Last scene: just fade in and stay
      newAnimations.push(`.scene.s${sNum}{animation:fadeIn .8s ${delay}s forwards}`)
    }
  }

  // Replace old scene animation rules
  for (let i = 1; i <= sceneCount; i++) {
    const oldPattern = new RegExp(`\\.scene\\.s${i}\\{animation:[^}]+\\}`, 'g')
    html = html.replace(oldPattern, newAnimations[i-1])
  }

  // Add showHide keyframe if not present
  if (!html.includes('@keyframes showHide')) {
    // Insert after the fadeIn keyframehtml = html.replace(
      /@keyframes fadeIn\{[^}]+\{[^}]+\}\}/,
      (match) => match + '\n@keyframes showHide{0%{opacity:0;transform:translateY(30px)}10%{opacity:1;transform:translateY(0)}85%{opacity:1;transform:translateY(0)}100%{opacity:0;transform:translateY(-15px)}}'
    )
  }

  // Also fix any child elements inside scenes that have animation-delay
  // that exceeds the parent scene's visible window
  // (These are fine - they just need to fire within the parent's window)

  fs.writeFileSync(filePath, html)
  console.log(`  ✅ ${file} fixed`)
}

console.log(`\n🎉 Done! All ${files.length} files fixed.`)
console.log('Run: node convert.js to regenerate MP4s')
