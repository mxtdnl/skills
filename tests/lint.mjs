// Static checks across every .html, .css and .js file in the repository.
// Adapted from mxtdnl/slides tests/lint.mjs.
// Usage: npm run lint  (or: node tests/lint.mjs)
// Exits non-zero on any failure. Allowlisted legacy files and PLACEHOLDER: counts are
// printed as warnings, never failures.

import { readFileSync, readdirSync, statSync } from 'node:fs';
import { join, relative, sep } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = join(fileURLToPath(import.meta.url), '..', '..');

// Directories never walked. audit/ holds evidence about the prototype; legacy/ holds the
// prototype itself, which predates these rules and is not edited until it is retired.
const SKIP_DIRS = new Set(['node_modules', '.git', 'audit', 'legacy']);

// Files exempt from every check. Each one prints a warning so the exemption stays visible.
// Remove an entry once its file is retired or brought into line.
const ALLOWLIST = new Map([
  ['legacy/skills-assessment-hult.html', 'legacy prototype; known violations are recorded in audit/AUDIT-REPORT.md (J-1, F-3)'],
]);

function walk(dir, out = []) {
  for (const name of readdirSync(dir)) {
    if (SKIP_DIRS.has(name)) continue;
    const p = join(dir, name);
    const st = statSync(p);
    if (st.isDirectory()) walk(p, out);
    else if (name.endsWith('.html') || name.endsWith('.css') || name.endsWith('.js')) out.push(p);
  }
  return out;
}

const files = walk(ROOT).map((p) => relative(ROOT, p).split(sep).join('/')).sort();
const failures = [];
const warnings = [];
const fail = (file, msg) => failures.push(`${file}: ${msg}`);
const lineOf = (src, index) => src.slice(0, index).split('\n').length;

for (const [file, reason] of ALLOWLIST) warnings.push(`${file}: exempt from lint (${reason})`);

for (const file of files) {
  if (ALLOWLIST.has(file)) continue;
  const src = readFileSync(join(ROOT, file), 'utf8');
  const isHtml = file.endsWith('.html');
  const isJs = file.endsWith('.js');

  // JavaScript modules (S3): no remote imports or requests, no curly quotes, no innerHTML.
  if (isJs) {
    const jsPatterns = [
      [/\bimport\s*(?:[^'"`]*?\bfrom\s*)?\(?\s*["'`]\s*https?:/g, 'http(s) URL in import'],
      [/\bfetch\s*\(\s*["'`]?\s*https?:/g, 'http(s) URL in fetch()'],
      [/XMLHttpRequest|navigator\.sendBeacon|new\s+WebSocket|new\s+EventSource/g, 'network API'],
      [/\.(?:innerHTML|outerHTML)\s*\+?=|insertAdjacentHTML\s*\(/g, 'HTML string injection (audit K-5)'],
      [/[\u2018\u2019\u201C\u201D]/g, 'curly quote'],
    ];
    for (const [re, msg] of jsPatterns) {
      for (const m of src.matchAll(re)) fail(file, `${msg} at line ${lineOf(src, m.index)}`);
    }
    const ph = (src.match(/PLACEHOLDER:/g) || []).length;
    if (ph) warnings.push(`${file}: ${ph} PLACEHOLDER: string(s)`);
    continue;
  }

  // 1. <meta charset="utf-8"> present and first in <head> (HTML only)
  if (isHtml) {
    const head = /<head[^>]*>([\s\S]*?)<\/head>/i.exec(src);
    if (!head) fail(file, 'no <head> element');
    else {
      const firstTag = /<([a-z]+)[^>]*>/i.exec(head[1].replace(/<!--[\s\S]*?-->/g, ''));
      if (!firstTag || !/^<meta\s+charset=["']?utf-8["']?\s*\/?>$/i.test(firstTag[0])) {
        fail(file, '<meta charset="utf-8"> is not the first element in <head>');
      }
    }
  }

  // 2. No network URLs in src, href, url(), @import or fetch; no XMLHttpRequest.
  //    Unlike the slides repository, plain outbound <a href> links are not permitted:
  //    this tool makes no network calls and links nowhere outside the repository.
  const netPatterns = [
    [/\ssrc\s*=\s*["']?\s*https?:/gi, 'http(s) URL in src'],
    [/\shref\s*=\s*["']?\s*https?:/gi, 'http(s) URL in href'],
    [/url\(\s*["']?\s*https?:/gi, 'http(s) URL in url()'],
    [/@import\s+(url\()?\s*["']?\s*https?:/gi, 'http(s) URL in @import'],
    [/\bfetch\s*\(\s*["'`]?\s*https?:/gi, 'http(s) URL in fetch()'],
    [/XMLHttpRequest/g, 'XMLHttpRequest'],
  ];
  for (const [re, msg] of netPatterns) {
    for (const m of src.matchAll(re)) fail(file, `${msg} at line ${lineOf(src, m.index)}`);
  }

  // 3. No curly quotes inside <script> blocks (HTML only)
  if (isHtml) {
    for (const m of src.matchAll(/<script\b[^>]*>[\s\S]*?<\/script>/gi)) {
      const curly = m[0].match(/[‘’“”]/g);
      if (curly) fail(file, `${curly.length} curly quote(s) inside <script> starting at line ${lineOf(src, m.index)}`);
    }
  }

  // 4. No border-radius other than 0 and 50%
  for (const m of src.matchAll(/border-radius\s*:\s*[^;"}]+/gi)) {
    const v = m[0].split(':')[1].trim().replace(/\s*!important/, '');
    if (!/^(0|0px|0rem|50%)$/.test(v)) fail(file, `border-radius value "${v}" at line ${lineOf(src, m.index)}`);
  }

  // PLACEHOLDER: count, as a warning
  const ph = (src.match(/PLACEHOLDER:/g) || []).length;
  if (ph) warnings.push(`${file}: ${ph} PLACEHOLDER: string(s)`);
}

// 5. Design tokens (S4): reference palette unchanged, and every listed contrast pair
//    meets WCAG 2.2 AA. Parses styles/tokens.css; resolves hex, var(), rgb()/rgba() and
//    color-mix(in srgb, A P%, B).
const TOKENS_FILE = 'styles/tokens.css';

// Values copied from mxtdnl/slides CLAUDE.md (Visual style, light theme). A change here
// must follow a change in the reference.
const REFERENCE_TOKENS = {
  '--bg': '#F2DFBE', '--bg-card': '#FFFAF2', '--bg-deep': '#E8D2A8',
  '--text': '#2A1F18', '--text-muted': '#6A5A48', '--border': '#D8C8A8',
  '--accent-1': '#5C3A96', '--accent-2': '#B52838', '--accent-3': '#C85218', '--accent-4': '#D4A020',
  '--accent-5': '#7A5828', '--accent-6': '#B83068', '--accent-7': '#CC6830', '--accent-8': '#7E58A8',
  '--accent-4-ink': '#7A5410', '--accent-7-ink': '#9E4718',
  '--correct': '#2A7A42', '--correct-ink': '#1F6A36', '--correct-tint': '#E6F4EA',
  '--incorrect': '#B82828', '--incorrect-ink': '#B82828', '--incorrect-tint': '#FDEEEE',
  '--ambiguous': '#B98A10', '--ambiguous-ink': '#7A5410', '--ambiguous-tint': '#FFF3D6',
};

// [foreground, background, level, where]. Levels: 'text' 4.5:1; 'large' 3:1 (text at
// least 24px, or 18.66px bold); 'ui' 3:1 (component boundaries, focus indicators,
// state marks). Add a row whenever a component puts a new colour on a new surface.
const CONTRAST_PAIRS = [
  // Body text on surfaces
  ['--text', '--bg', 'text', 'body text on the page'],
  ['--text', '--bg-card', 'text', 'body text on cards'],
  ['--text', '--bg-deep', 'text', 'text on inset surfaces'],
  ['--text-muted', '--bg', 'text', 'secondary text on the page'],
  ['--text-muted', '--bg-card', 'text', 'secondary text on cards'],
  ['--accent-1', '--bg', 'text', 'links on the page'],
  ['--accent-1', '--bg-card', 'text', 'links and ghost hover on cards'],
  ['--accent-4-ink', '--bg-card', 'text', 'gold ink on cards'],
  ['--accent-7-ink', '--bg-card', 'text', 'orange ink on cards'],
  ['--accent-5', '--bg-card', 'text', 'brown ink on cards'],
  ['--accent-8', '--bg-card', 'text', 'lighter purple ink on cards'],

  // Skills: ink on card and tint, text on tint, on-colour on fill
  ['--skill-collaboration-ink', '--bg-card', 'text', 'Collaboration eyebrow and labels'],
  ['--skill-collaboration-ink', '--skill-collaboration-tint', 'text', 'Collaboration label on tint'],
  ['--text', '--skill-collaboration-tint', 'text', 'body text on Collaboration tint'],
  ['--text-muted', '--skill-collaboration-tint', 'text', 'tile description on Collaboration tint'],
  ['--skill-collaboration-on', '--skill-collaboration', 'text', 'Collaboration fill: buttons, keys, banners'],
  ['--skill-curiosity-ink', '--bg-card', 'text', 'Curiosity eyebrow and labels'],
  ['--skill-curiosity-ink', '--skill-curiosity-tint', 'text', 'Curiosity label on tint'],
  ['--text', '--skill-curiosity-tint', 'text', 'body text on Curiosity tint'],
  ['--text-muted', '--skill-curiosity-tint', 'text', 'tile description on Curiosity tint'],
  ['--skill-curiosity-on', '--skill-curiosity', 'text', 'Curiosity fill: buttons, keys, banners'],
  ['--skill-critical-ink', '--bg-card', 'text', 'Critical thinking eyebrow and labels'],
  ['--skill-critical-ink', '--skill-critical-tint', 'text', 'Critical thinking label on tint'],
  ['--text', '--skill-critical-tint', 'text', 'body text on Critical thinking tint'],
  ['--text-muted', '--skill-critical-tint', 'text', 'tile description on Critical thinking tint'],
  ['--skill-critical-on', '--skill-critical', 'text', 'Critical thinking fill: buttons, keys, banners'],
  ['--skill-creativity-ink', '--bg-card', 'text', 'Creativity eyebrow and labels'],
  ['--skill-creativity-ink', '--skill-creativity-tint', 'text', 'Creativity label on tint'],
  ['--skill-creativity-ink', '--bg', 'large', 'Creativity ink on the page: large text only'],
  ['--text', '--skill-creativity-tint', 'text', 'body text on Creativity tint'],
  ['--text-muted', '--skill-creativity-tint', 'text', 'tile description on Creativity tint'],
  ['--skill-creativity-on', '--skill-creativity', 'text', 'Creativity fill: buttons, keys, banners'],
  ['--skill-communication-ink', '--bg', 'text', 'Communication ink on the page'],
  ['--skill-communication-ink', '--bg-card', 'text', 'Communication eyebrow and labels'],
  ['--skill-communication-ink', '--skill-communication-tint', 'text', 'Communication label on tint'],
  ['--text', '--skill-communication-tint', 'text', 'body text on Communication tint'],
  ['--text-muted', '--skill-communication-tint', 'text', 'tile description on Communication tint'],
  ['--skill-communication-on', '--skill-communication', 'large', 'Communication fill: banners and keys, large text only'],

  // Buttons
  ['--on-accent', '--accent-1', 'text', 'primary button'],
  ['--on-accent', '--accent-2', 'text', 'primary button hover'],
  ['--on-accent', '--accent-5', 'text', 'accent button, brown'],
  ['--on-accent', '--accent-6', 'text', 'accent button, magenta'],
  ['--on-accent', '--accent-8', 'text', 'accent button, lighter purple'],
  ['--text', '--accent-4', 'text', 'accent button, gold'],
  ['--accent-3', '--bg-card', 'ui', 'outlined accent button border, burnt orange'],
  ['--accent-7', '--bg-card', 'ui', 'outlined accent button border, orange'],
  ['--text', '--bg', 'ui', 'ghost button border'],

  // Feedback, tags, notices
  ['--correct-ink', '--correct-tint', 'text', 'correct feedback text'],
  ['--incorrect-ink', '--incorrect-tint', 'text', 'incorrect feedback text'],
  ['--ambiguous-ink', '--ambiguous-tint', 'text', 'ambiguous feedback text'],
  ['--text', '--correct-tint', 'text', 'choice text on correct'],
  ['--text', '--incorrect-tint', 'text', 'choice text on incorrect'],
  ['--text', '--ambiguous-tint', 'text', 'choice and notice text on ambiguous'],
  ['--on-accent', '--correct', 'text', 'key on correct choice'],
  ['--on-accent', '--incorrect', 'text', 'key on incorrect choice'],
  ['--correct', '--bg-card', 'ui', 'correct rail and border'],
  ['--incorrect', '--bg-card', 'ui', 'incorrect rail and border'],
  ['--ambiguous', '--bg-card', 'ui', 'ambiguous rail and border'],

  // Focus indicators
  ['--focus', '--bg', 'ui', 'focus outline on the page'],
  ['--focus', '--bg-card', 'ui', 'focus outline on cards'],
  ['--focus', '--skill-collaboration-tint', 'ui', 'focus outline on Collaboration tint'],
  ['--focus', '--skill-curiosity-tint', 'ui', 'focus outline on Curiosity tint'],
  ['--focus', '--skill-critical-tint', 'ui', 'focus outline on Critical thinking tint'],
  ['--focus', '--skill-creativity-tint', 'ui', 'focus outline on Creativity tint'],
  ['--focus', '--skill-communication-tint', 'ui', 'focus outline on Communication tint'],

  // Controls and data marks
  ['--text', '--bg-card', 'ui', 'radio and choice-key borders, checked mark'],
  ['--text-muted', '--bg-card', 'ui', 'upcoming progress dot'],
  ['--text', '--bg-deep', 'ui', 'timer arc, results marker and band caps'],
  ['--text-muted', '--bg-deep', 'ui', 'paused timer arc'],
  ['--incorrect', '--bg-deep', 'ui', 'low-time timer arc'],
];

const MIN_RATIO = { text: 4.5, large: 3, ui: 3 };

function parseTokens(css) {
  const body = css.replace(/\/\*[\s\S]*?\*\//g, '');
  const map = new Map();
  for (const m of body.matchAll(/(--[a-z0-9-]+)\s*:\s*([^;]+);/gi)) map.set(m[1], m[2].trim());
  return map;
}

function resolveColour(value, tokens, seen = new Set()) {
  const v = value.trim();
  let m;
  if ((m = /^var\(\s*(--[a-z0-9-]+)\s*\)$/i.exec(v))) {
    if (seen.has(m[1])) throw new Error(`circular reference at ${m[1]}`);
    if (!tokens.has(m[1])) throw new Error(`undefined token ${m[1]}`);
    return resolveColour(tokens.get(m[1]), tokens, new Set([...seen, m[1]]));
  }
  if ((m = /^#([0-9a-f]{3}|[0-9a-f]{6})$/i.exec(v))) {
    const h = m[1].length === 3 ? [...m[1]].map((c) => c + c).join('') : m[1];
    return [0, 2, 4].map((i) => parseInt(h.slice(i, i + 2), 16));
  }
  if ((m = /^rgba?\(\s*([\d.]+)\s*,\s*([\d.]+)\s*,\s*([\d.]+)\s*(?:,\s*([\d.]+)\s*)?\)$/i.exec(v))) {
    if (m[4] !== undefined && Number(m[4]) !== 1) throw new Error(`translucent colour ${v} has no fixed background`);
    return [m[1], m[2], m[3]].map(Number);
  }
  if ((m = /^color-mix\(\s*in\s+srgb\s*,\s*(.+?)\s+([\d.]+)%\s*,\s*(.+)\)$/i.exec(v))) {
    const a = resolveColour(m[1], tokens, seen);
    const b = resolveColour(m[3], tokens, seen);
    const p = Number(m[2]) / 100;
    return a.map((x, i) => x * p + b[i] * (1 - p));
  }
  throw new Error(`cannot resolve colour "${v}"`);
}

function luminance([r, g, b]) {
  const lin = (c) => { c /= 255; return c <= 0.03928 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4; };
  return 0.2126 * lin(r) + 0.7152 * lin(g) + 0.0722 * lin(b);
}

function contrast(a, b) {
  const [hi, lo] = [luminance(a), luminance(b)].sort((x, y) => y - x);
  return (hi + 0.05) / (lo + 0.05);
}

let contrastSummary = 'contrast: not run';
if (files.includes(TOKENS_FILE)) {
  const tokens = parseTokens(readFileSync(join(ROOT, TOKENS_FILE), 'utf8'));
  for (const [name, hex] of Object.entries(REFERENCE_TOKENS)) {
    const got = tokens.get(name);
    if (!got) fail(TOKENS_FILE, `reference token ${name} is missing`);
    else if (got.toUpperCase() !== hex) fail(TOKENS_FILE, `${name} is ${got}; the reference value is ${hex}`);
  }
  let passed = 0;
  for (const [fg, bg, level, where] of CONTRAST_PAIRS) {
    try {
      const ratio = contrast(resolveColour(`var(${fg})`, tokens), resolveColour(`var(${bg})`, tokens));
      if (ratio + 1e-9 < MIN_RATIO[level]) {
        fail(TOKENS_FILE, `contrast ${fg} on ${bg} is ${ratio.toFixed(2)}:1, below ${MIN_RATIO[level]}:1 for ${level} (${where})`);
      } else passed++;
    } catch (e) {
      fail(TOKENS_FILE, `contrast pair ${fg} on ${bg}: ${e.message}`);
    }
  }
  contrastSummary = `contrast: ${passed} of ${CONTRAST_PAIRS.length} pair(s) pass`;
} else {
  fail(TOKENS_FILE, 'missing; the contrast check needs it');
}

const linted = files.filter((f) => !ALLOWLIST.has(f));
console.log(`Linted ${linted.length} file(s): ${linted.join(', ') || '(none)'}`);
console.log(contrastSummary);
warnings.forEach((w) => console.log('WARN  ' + w));
failures.forEach((f) => console.log('FAIL  ' + f));
if (failures.length) {
  console.log(`\n${failures.length} failure(s).`);
  process.exit(1);
}
console.log('\nAll lint checks passed.');
