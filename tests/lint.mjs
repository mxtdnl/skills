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

const linted = files.filter((f) => !ALLOWLIST.has(f));
console.log(`Linted ${linted.length} file(s): ${linted.join(', ') || '(none)'}`);
warnings.forEach((w) => console.log('WARN  ' + w));
failures.forEach((f) => console.log('FAIL  ' + f));
if (failures.length) {
  console.log(`\n${failures.length} failure(s).`);
  process.exit(1);
}
console.log('\nAll lint checks passed.');
