/*
 * The link preview pictures (Open Graph), 1200 × 630, one per section and
 * language:   node scripts/og-images.ts [es|en …] [--out <dir>]
 *
 * Spanish goes to public/og/*.jpg, English to public/og/en/*.jpg (see
 * OgImage in src/app/core/seo/seo-tags.ts). Each is the same scene (the
 * day's sky, the island, the sea) with the section's words, written in
 * Bricolage Grotesque, the site's typeface, and photographed by a headless
 * Chrome (scripts/chrome.ts). The words are in the picture, so each language
 * needs its own; no weather of the day is ever drawn.
 */
import { mkdirSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { evaluate, openPage } from './chrome.ts';

type Lang = 'es' | 'en';
type Image = 'home' | 'zones' | 'sea' | 'plans' | 'wind' | 'about';

/** Each picture's title and line, in each language. */
const WORDS: Record<Lang, Record<Image, readonly [string, string]>> = {
  es: {
    home: ['El tiempo en Lanzarote hoy', 'Viento, mar y mareas, zona a zona'],
    zones: ['Lanzarote, zona a zona', 'El tiempo de las 9 zonas de la isla en un mapa'],
    sea: ['Mareas y estado del mar en Lanzarote', 'Pleamar, bajamar, olas y temperatura del agua'],
    plans: ['¿Dónde ir hoy en Lanzarote?', 'Playas sin viento y mar tranquilo, según la previsión'],
    wind: ['El viento en Lanzarote hoy', 'Dónde sopla menos, zona a zona'],
    about: ['Sobre LanzaMet', 'Quién la hace y cómo calcula cada dato'],
  },
  en: {
    home: ['Lanzarote weather today', 'Wind, sea and tides, place by place'],
    zones: ['Lanzarote, place by place', 'Weather in the island’s 9 places on one map'],
    sea: ['Lanzarote tides and sea today', 'High and low tide, waves and water temperature'],
    plans: ['Where to go today in Lanzarote?', 'Sheltered beaches and calm sea, as forecast'],
    wind: ['Lanzarote wind today', 'Where it blows least, place by place'],
    about: ['About LanzaMet', 'Who makes it and how each figure is worked out'],
  },
};

const root = fileURLToPath(new URL('..', import.meta.url));
const args = process.argv.slice(2);
const outAt = args.indexOf('--out');
const outRoot = outAt === -1 ? join(root, 'public', 'og') : args[outAt + 1];
const langs = args.filter(
  (a, i) => (a === 'es' || a === 'en') && (outAt === -1 || i !== outAt + 1),
) as Lang[];

const font = (name: string) =>
  pathToFileURL(
    join(root, 'node_modules', '@fontsource-variable', 'bricolage-grotesque', 'files', name),
  ).href;
const logo = `data:image/png;base64,${readFileSync(join(root, 'public', 'icons', 'logo.png')).toString('base64')}`;

/** The island's outline against the sky, left to right (the same in every picture). */
const ISLAND = '0,452 100,444 200,451 335,432 500,439 660,453 750,448 880,456 1040,445 1200,455';

const escape = (text: string) =>
  text.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');

function page(lang: Lang, [title, line]: readonly [string, string]): string {
  return `<!doctype html>
<html lang="${lang}">
<meta charset="utf-8">
<style>
  @font-face {
    font-family: 'Bricolage';
    src: url('${font('bricolage-grotesque-latin-wght-normal.woff2')}') format('woff2');
    font-weight: 200 800;
    unicode-range: U+0000-00FF, U+0131, U+0152-0153, U+02BB-02BC, U+02C6, U+02DA, U+02DC, U+2000-206F, U+20AC, U+2122, U+2191, U+2193, U+2212, U+2215, U+FEFF, U+FFFD;
  }
  @font-face {
    font-family: 'Bricolage';
    src: url('${font('bricolage-grotesque-latin-ext-wght-normal.woff2')}') format('woff2');
    font-weight: 200 800;
  }
  html, body { margin: 0; }
  body {
    position: relative;
    width: 1200px;
    height: 630px;
    overflow: hidden;
    font-family: 'Bricolage', sans-serif;
    background: linear-gradient(#b2d8ed 0, #c1e0f2 150px, #cce8f4 250px, #dbeef5 350px, #f2f3ee 420px, #f7f4ec 440px, #f7f4ec 480px);
  }
  .sun {
    position: absolute;
    left: 919px;
    top: 111px;
    width: 112px;
    height: 112px;
    border-radius: 50%;
    background: #fff8ca;
    box-shadow: 0 0 28px 10px rgba(255, 246, 190, 0.55);
  }
  .sea {
    position: absolute;
    left: 0;
    right: 0;
    top: 480px;
    bottom: 0;
    background: linear-gradient(#0589b8 0, #0081b3 20px, #0076ab 40px, #00629b 80px, #00467a 150px);
  }
  .sea::after {
    content: '';
    position: absolute;
    left: 0;
    right: 0;
    top: 22px;
    height: 2px;
    background: #45abd3;
  }
  .island { position: absolute; left: 0; top: 0; }
  .brand {
    position: absolute;
    left: 80px;
    top: 63px;
    display: flex;
    align-items: center;
    gap: 20px;
    font-size: 36px;
    font-weight: 700;
    letter-spacing: -0.01em;
    color: #1d1a18;
  }
  .brand img { width: 86px; height: auto; }
  .words { position: absolute; left: 80px; top: 179px; width: 720px; }
  h1 {
    margin: 0;
    font-size: 70px;
    line-height: 76px;
    font-weight: 760;
    letter-spacing: -0.05em;
    color: #1d1a18;
    text-wrap: balance;
  }
  /* One line, wider than the title (which wraps beside the sun). */
  p {
    width: 1040px;
    white-space: nowrap;
    margin: 23px 0 0;
    font-size: 31px;
    line-height: 36px;
    font-weight: 400;
    color: #4f4a46;
  }
  .domain {
    position: absolute;
    left: 80px;
    top: 545px;
    font-size: 28.5px;
    font-weight: 700;
    color: #fff;
  }
</style>
<body>
  <div class="sun"></div>
  <svg class="island" width="1200" height="481" viewBox="0 0 1200 481">
    <polygon fill="#5c4841" points="0,481 ${ISLAND} 1200,481" />
  </svg>
  <div class="sea"></div>
  <div class="brand"><img src="${logo}" alt="">LanzaMet</div>
  <div class="words"><h1>${escape(title)}</h1><p>${escape(line)}</p></div>
  <div class="domain">lanzamet.com</div>
</body>
</html>`;
}

const browser = await openPage();
try {
  await browser.send('Page.enable');
  await browser.send('Emulation.setDeviceMetricsOverride', {
    width: 1200,
    height: 630,
    deviceScaleFactor: 1,
    mobile: false,
  });
  for (const lang of langs.length > 0 ? langs : (['es', 'en'] as const)) {
    const dir = lang === 'es' ? outRoot : join(outRoot, 'en');
    mkdirSync(dir, { recursive: true });
    for (const [image, words] of Object.entries(WORDS[lang])) {
      const html = join(dir, `.${image}.html`);
      writeFileSync(html, page(lang, words));
      await browser.send('Page.navigate', { url: pathToFileURL(html).href });
      await evaluate(
        browser,
        'new Promise((r) => setTimeout(r, 300)).then(() => document.fonts.ready).then(() => true)',
      );
      const { data } = await browser.send<{ data: string }>('Page.captureScreenshot', {
        format: 'jpeg',
        quality: 88,
        clip: { x: 0, y: 0, width: 1200, height: 630, scale: 1 },
      });
      writeFileSync(join(dir, `${image}.jpg`), Buffer.from(data, 'base64'));
      rmSync(html);
      console.log(`✓ ${join(dir, `${image}.jpg`)}`);
    }
  }
} finally {
  await browser.close();
}
