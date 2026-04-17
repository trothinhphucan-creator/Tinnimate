#!/usr/bin/env node
/**
 * cli.js
 * Command-line tool for all proxy operations:
 *   node cli.js login         → open browser to log in to Gemini Ultra
 *   node cli.js check         → check login status
 *   node cli.js image "desc"  → generate image and save
 *   node cli.js text  "msg"   → generate text
 *   node cli.js start         → start the proxy server (background)
 */
const { generateImage, generateText, checkAuth } = require('./src/gemini-scraper');
const { getPageHeaded, close } = require('./src/browser-session');
const path = require('path');

const [,, command, ...args] = process.argv;

async function main() {
  switch (command) {
    case 'login': {
      console.log('🌐 Opening browser for Gemini login...');
      console.log('   → Sign in with your Gemini Ultra Google account');
      console.log('   → Session will be saved automatically');
      console.log('   → Press Ctrl+C when done\n');

      const page = await getPageHeaded();
      await page.goto('https://gemini.google.com', { waitUntil: 'domcontentloaded' });

      // Keep alive until user presses Ctrl+C
      await new Promise(resolve => {
        process.on('SIGINT', resolve);
        setTimeout(resolve, 300000); // max 5 min
      });

      console.log('\n✅ Session saved. You can now use the proxy in headless mode.');
      await close();
      break;
    }

    case 'check': {
      console.log('🔍 Checking Gemini session...');
      const result = await checkAuth();
      if (result.authenticated) {
        console.log('✅ Logged in to Gemini Ultra!');
      } else {
        console.log(`❌ Not logged in: ${result.reason}`);
        console.log('   Run: node cli.js login');
      }
      await close();
      break;
    }

    case 'image': {
      const prompt = args.join(' ');
      if (!prompt) { console.error('Usage: node cli.js image "your prompt"'); process.exit(1); }

      const outputPath = path.join(__dirname, 'output', `${Date.now()}.png`);
      require('fs').mkdirSync(path.dirname(outputPath), { recursive: true });

      console.log(`🎨 Generating image: "${prompt}"`);
      const result = await generateImage(prompt, { outputPath });

      if (result.success) {
        console.log(`✅ Image saved to: ${result.imagePath}`);
      } else {
        console.error(`❌ Failed: ${result.error}`);
      }
      await close();
      break;
    }

    case 'text': {
      const prompt = args.join(' ');
      if (!prompt) { console.error('Usage: node cli.js text "your prompt"'); process.exit(1); }

      console.log(`💬 Generating text: "${prompt}"`);
      const result = await generateText(prompt);

      if (result.success) {
        console.log('\n--- Response ---\n');
        console.log(result.text);
      } else {
        console.error(`❌ Failed: ${result.error}`);
      }
      await close();
      break;
    }

    case 'start': {
      // Start the full server
      require('./src/server');
      break;
    }

    default:
      console.log(`
Gemini Web Proxy CLI

Usage:
  node cli.js login          Open browser to login to Gemini Ultra
  node cli.js check          Check if logged in
  node cli.js image "desc"   Generate an image
  node cli.js text  "msg"    Generate text
  node cli.js start          Start the local API proxy server
      `);
  }
}

main().catch(err => {
  console.error('Fatal:', err.message);
  process.exit(1);
});
