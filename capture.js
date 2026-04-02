import { chromium } from 'playwright';
import { rm, mkdir } from 'fs/promises';
import path from 'path';

const FPS          = 24;
const DURATION_S   = 11;
const FRAMES_DIR   = '/app/public/frames';
const FRAME_COUNT  = Math.round(FPS * DURATION_S);  // 264
const HEALTH_URL = 'http://localhost:3000/health';
const PAGE_URL   = 'http://localhost:3000/';
const TIMEOUT_MS = 30_000;
const RETRY_MS   = 500;

async function waitForServer() {
    const deadline = Date.now() + TIMEOUT_MS;
    while (Date.now() < deadline) {
        try {
            const res = await fetch(HEALTH_URL);
            if (res.ok) return;
        } catch { /* not up yet */ }
        await new Promise(r => setTimeout(r, RETRY_MS));
    }
    throw new Error(`Server did not become healthy within ${TIMEOUT_MS} ms`);
}

const browser = await chromium.launch({
    args: ['--no-sandbox', '--disable-setuid-sandbox'],
});
const page = await browser.newPage();

await waitForServer();

await page.goto(PAGE_URL, { waitUntil: 'networkidle' });

// Wipe and recreate frames directory
await rm(FRAMES_DIR, { recursive: true, force: true });
await mkdir(FRAMES_DIR, { recursive: true });

// Pause the timeline before any seeking
await page.evaluate(() => { window.animTimeline.pause(); });

const svgElement = page.locator('svg');

for (let i = 0; i < FRAME_COUNT; i++) {
    const t = i / FPS;
    const framePath = path.join(FRAMES_DIR, `frame_${String(i).padStart(4, '0')}.png`);
    await page.evaluate((t) => { window.animTimeline.seek(t); }, t);
    await svgElement.screenshot({ path: framePath });
    if (i % FPS === 0) {                                                                                                   
      console.log(`frame ${i} / ${FRAME_COUNT}`);                                                                        
    }     
}



await browser.close();
console.log(`Captured ${FRAME_COUNT} frames to ${FRAMES_DIR}`);
//console.log('Smoke screenshot written to /app/public/smoke.png');