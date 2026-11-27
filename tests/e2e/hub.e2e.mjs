// End-to-end tests of the application shell (S5) in Chromium, with Playwright.
//
//   npm run e2e
//
// Development only: Playwright is not a runtime dependency and is never shipped. The tests
// serve the repository with a small built-in static server and open index.html?example, which
// adds the developer stub skill to the hub. Every test fails on any request to another host.
//
// Playwright is resolved from the global installation if the project has none (createRequire),
// so `npm install` is not needed in an environment that provides it.

import { test, before, after } from 'node:test';
import assert from 'node:assert/strict';
import { createServer } from 'node:http';
import { readFile } from 'node:fs/promises';
import { extname, join, normalize } from 'node:path';
import { fileURLToPath } from 'node:url';
import { createRequire } from 'node:module';
import { execSync } from 'node:child_process';
import { firstForm } from '../../src/skills/runner.js';

const ROOT = fileURLToPath(new URL('../../', import.meta.url));
const TYPES = { '.html': 'text/html; charset=utf-8', '.js': 'text/javascript; charset=utf-8', '.css': 'text/css; charset=utf-8', '.svg': 'image/svg+xml', '.png': 'image/png', '.json': 'application/json' };

function loadPlaywright() {
  const require = createRequire(import.meta.url);
  try {
    return require('playwright');
  } catch {
    const globalRoot = execSync('npm root -g', { encoding: 'utf8' }).trim();
    return createRequire(join(globalRoot, 'noop.js'))('playwright');
  }
}

let server;
let base;
let browser;

before(async () => {
  server = createServer(async (req, res) => {
    const path = normalize(decodeURIComponent(new URL(req.url, 'http://x').pathname)).replace(/^([/\\])+/, '');
    const file = join(ROOT, path === '' ? 'index.html' : path);
    if (!file.startsWith(ROOT)) { res.writeHead(403).end(); return; }
    try {
      const body = await readFile(file);
      res.writeHead(200, { 'content-type': TYPES[extname(file)] || 'application/octet-stream' }).end(body);
    } catch {
      res.writeHead(404).end('not found');
    }
  });
  await new Promise((r) => server.listen(0, '127.0.0.1', r));
  base = `http://127.0.0.1:${server.address().port}/`;
  const { chromium } = loadPlaywright();
  browser = await chromium.launch();
});

after(async () => {
  if (browser) await browser.close();
  if (server) server.close();
});

/** A fresh browser context (empty storage), with external-request and error tracking. */
async function openApp(t) {
  const context = await browser.newContext({ viewport: { width: 1100, height: 900 } });
  const page = await context.newPage();
  const problems = [];
  page.on('request', (r) => { if (!r.url().startsWith(base) && !r.url().startsWith('data:')) problems.push(`external request: ${r.url()}`); });
  page.on('pageerror', (e) => problems.push(`page error: ${e.message}`));
  page.on('console', (m) => { if (m.type() === 'error') problems.push(`console error: ${m.text()}`); });
  t.after(async () => {
    await context.close();
    assert.deepEqual(problems, []);
  });
  await page.goto(`${base}index.html?example`);
  return page;
}

/** All records in localStorage, by type. */
async function records(page) {
  return page.evaluate(() => {
    const out = {};
    for (let i = 0; i < localStorage.length; i++) {
      const k = localStorage.key(i);
      const m = /^skills5c:v\d+:([A-Za-z]+):/.exec(k);
      if (m) (out[m[1]] ||= []).push(JSON.parse(localStorage.getItem(k)));
    }
    return out;
  });
}

/** Press Tab until the focused element matches, then return. Fails after 60 presses. */
async function tabTo(page, selector, { name, back = false } = {}) {
  for (let i = 0; i < 60; i++) {
    const hit = await page.evaluate(([sel, nm]) => {
      const el = document.activeElement;
      if (!el || !el.matches(sel)) return false;
      return nm === undefined || (el.textContent || '').trim() === nm || el.getAttribute('aria-label') === nm;
    }, [selector, name]);
    if (hit) return;
    await page.keyboard.press(back ? 'Shift+Tab' : 'Tab');
  }
  throw new Error(`tabTo: never reached ${selector}${name ? ` "${name}"` : ''}`);
}

/** First run with the mouse: consent (a) only, skip the language question. */
async function onboard(page, { evaluation = false } = {}) {
  await page.getByRole('link', { name: 'Start', exact: true }).click();
  await page.locator('#consent-tool').check();
  if (evaluation) await page.locator('#consent-evaluation').check();
  await page.getByRole('button', { name: 'Continue' }).click();
  await page.getByRole('button', { name: 'Skip this question' }).click();
  await page.locator('#code-saved').check();
  await page.getByRole('link', { name: 'Go to your skills' }).click();
  await page.locator('.skill-grid').waitFor();
}

test('keyboard only: first run, an assessment with reloads mid-step, resumes exactly and records the form', async (t) => {
  const page = await openApp(t);
  await page.locator('h1', { hasText: 'Explore your five core skills' }).waitFor();

  // Welcome -> consent
  await tabTo(page, 'a.btn', { name: 'Start' });
  await page.keyboard.press('Enter');
  await page.locator('h1', { hasText: 'How your answers are used' }).waitFor();
  // Continue without consent (a): refused with a message
  await tabTo(page, 'button[type="submit"]', { name: 'Continue' });
  await page.keyboard.press('Enter');
  await page.locator('#consent-error', { hasText: 'tick the first box' }).waitFor();
  // The error moves focus to box (a)
  assert.equal(await page.evaluate(() => document.activeElement.id), 'consent-tool');
  await page.keyboard.press('Space');
  await tabTo(page, '#consent-evaluation');
  await page.keyboard.press('Space');
  await tabTo(page, 'button[type="submit"]', { name: 'Continue' });
  await page.keyboard.press('Enter');

  // Language: choose "No" with the arrow keys
  await page.locator('h1', { hasText: 'One optional question' }).waitFor();
  await tabTo(page, 'input[name="language"]');
  await page.keyboard.press('ArrowDown');
  assert.equal(await page.evaluate(() => document.activeElement.value), 'no');
  await tabTo(page, 'button[type="submit"]', { name: 'Save and continue' });
  await page.keyboard.press('Enter');

  // Code: the link is disabled until the box is ticked
  await page.locator('#participant-code').waitFor();
  const code = (await page.locator('#participant-code').textContent()).trim();
  assert.match(code, /^P-[0-9A-HJKMNP-TV-Z]{4}-[0-9A-HJKMNP-TV-Z]{5}$/);
  await tabTo(page, '#code-saved');
  await page.keyboard.press('Space');
  await tabTo(page, 'a.btn', { name: 'Go to your skills' });
  await page.keyboard.press('Enter');
  await page.locator('.skill-grid').waitFor();

  let r = await records(page);
  assert.equal(r.participant.length, 1);
  const participant = r.participant[0];
  assert.equal(participant.id, code);
  assert.equal(participant.consent.noticeVersion, 'consent-2026-11-27');
  assert.equal(participant.consent.toolUse, true);
  assert.equal(participant.consent.programmeEvaluation, true);
  assert.equal(participant.consent.languageBackground, true);
  assert.deepEqual(participant.languageBackground, { englishFirstLanguage: 'no' });

  // Hub: five skill tiles plus the example; open the example skill
  assert.equal(await page.locator('.skill-tile').count(), 6);
  assert.equal(await page.locator('.skill-tile.locked').count(), 5);
  await tabTo(page, 'a.skill-tile');
  await page.keyboard.press('Enter');
  await page.locator('.mode-grid').waitFor();

  // Start the assessment; the dialog opens with Cancel focused
  await tabTo(page, 'button', { name: 'Start assessment' });
  await page.keyboard.press('Enter');
  await page.locator('dialog[open]').waitFor();
  await tabTo(page, 'dialog button', { name: 'Start assessment', back: true });
  await page.keyboard.press('Enter');

  // Self-report, statement 1: Agree (4) with the arrow keys, then Next
  await page.locator('.progress-count', { hasText: 'Statement 1 of 2' }).waitFor();
  assert.equal(await page.evaluate(() => document.activeElement.type), 'radio');
  for (let i = 0; i < 3; i++) await page.keyboard.press('ArrowRight');
  await page.keyboard.press('Space');
  await tabTo(page, 'button[type="submit"]', { name: 'Next' });
  await page.keyboard.press('Enter');
  await page.locator('.progress-count', { hasText: 'Statement 2 of 2' }).waitFor();

  r = await records(page);
  assert.equal(r.sitting.length, 1);
  const sitting = r.sitting[0];
  assert.equal(sitting.mode, 'assessment');
  assert.equal(sitting.windowId, 'self');
  assert.equal(sitting.formId, firstForm(code), 'form A or B by the parity of a hash of the participant ID');
  assert.equal(r.selfReport.length, 1);
  assert.equal(r.selfReport[0].status, 'in-progress');
  assert.deepEqual(r.selfReport[0].responses.map((x) => x.response), [4], 'autosaved after the first response');
  const statement2 = await page.locator('.likert-prompt').textContent();

  // Reload: the same statement, flagged as resumed
  await page.reload();
  await page.locator('.progress-count', { hasText: 'Statement 2 of 2' }).waitFor();
  assert.equal(await page.locator('.likert-prompt').textContent(), statement2);
  await page.locator('.save-status', { hasText: 'Continuing where you left off' }).waitFor();
  for (let i = 0; i < 1; i++) await page.keyboard.press('ArrowRight');
  await page.keyboard.press('Space');
  await tabTo(page, 'button[type="submit"]', { name: 'Finish' });
  await page.keyboard.press('Enter');

  // Step complete: no feedback on answers; go to the task
  await page.locator('.step-complete h2', { hasText: 'done' }).waitFor();
  await tabTo(page, 'a.btn', { name: 'Next: Pick the answer' });
  await page.keyboard.press('Enter');
  await page.locator('.progress-count', { hasText: 'Question 1 of 2' }).waitFor();
  await page.keyboard.press('Enter'); // the first option has focus
  await page.locator('.progress-count', { hasText: 'Question 2 of 2' }).waitFor();
  assert.equal(await page.locator('.feedback').count(), 0, 'no feedback in assessment mode');
  const orderBefore = await page.locator('.choice-text').allTextContents();

  // Reload mid-task: question 2, same option order
  await page.reload();
  await page.locator('.progress-count', { hasText: 'Question 2 of 2' }).waitFor();
  assert.deepEqual(await page.locator('.choice-text').allTextContents(), orderBefore);
  await page.keyboard.press('Enter');

  await page.locator('.step-complete h2', { hasText: 'assessment complete' }).waitFor();
  r = await records(page);
  assert.ok(r.sitting[0].completedAt, 'the sitting is marked complete');
  assert.equal(r.taskAttempt.length, 1);
  assert.equal(r.taskAttempt[0].status, 'complete');
  assert.equal(r.taskAttempt[0].itemResponses.length, 2);
  assert.equal(typeof r.taskAttempt[0].rawScore, 'number');
  assert.equal(r.selfReport[0].status, 'complete');

  // Results only now; the assessment cannot be started again
  await tabTo(page, 'a.btn', { name: 'See your results' });
  await page.keyboard.press('Enter');
  await page.locator('.results-sitting').waitFor();
  await page.goto(`${base}index.html?example#/skill/_example`);
  await page.locator('.mode-grid').waitFor();
  assert.equal(await page.getByRole('button', { name: 'Start assessment' }).count(), 0);
  await page.getByRole('link', { name: 'See your results' }).waitFor();
});

test('practice gives immediate feedback, can be repeated, and is stored apart from assessment', async (t) => {
  const page = await openApp(t);
  await onboard(page);
  await page.locator('a.skill-tile[data-skill-id="_example"]').click();
  await page.getByRole('button', { name: 'Start practice' }).click();
  await page.locator('.progress-count', { hasText: 'Question 1 of 2' }).waitFor();
  await page.locator('.choice-card').first().click();
  await page.locator('.feedback').waitFor();
  await page.getByRole('button', { name: 'Next question' }).click();
  await page.locator('.choice-card').first().click();
  await page.getByRole('button', { name: 'Finish' }).click();
  await page.locator('.step-complete h2', { hasText: 'Practice complete' }).waitFor();
  await page.getByRole('link', { name: /Back to Example skill/ }).click();
  await page.getByRole('button', { name: 'Practise again' }).click();
  await page.locator('.progress-count', { hasText: 'Question 1 of 2' }).waitFor();

  const r = await records(page);
  assert.equal(r.sitting.length, 2);
  assert.ok(r.sitting.every((s) => s.mode === 'practice' && s.formId === 'practice' && s.windowId === null));
  const itemIds = r.taskAttempt.flatMap((a) => a.itemResponses.map((x) => x.itemId));
  assert.ok(itemIds.every((id) => id.startsWith('EX-PICK-P')), 'practice uses only the practice pool');
  await page.goto(`${base}index.html?example#/hub`);
  await page.locator('a.skill-tile[data-skill-id="_example"] [data-state="not-started"]', { hasText: 'Assessment' }).waitFor();
});

test('exiting mid-task asks for confirmation, saves, and resumes from the skill page', async (t) => {
  const page = await openApp(t);
  await onboard(page);
  await page.locator('a.skill-tile[data-skill-id="_example"]').click();
  await page.getByRole('button', { name: 'Start assessment' }).click();
  await page.locator('dialog').getByRole('button', { name: 'Start assessment' }).click();
  await page.locator('.likert-option').nth(1).click();
  await page.getByRole('button', { name: 'Next' }).click();
  await page.locator('.progress-count', { hasText: 'Statement 2 of 2' }).waitFor();

  await page.getByRole('button', { name: 'Save and exit' }).click();
  await page.locator('dialog').getByRole('button', { name: 'Stay' }).click();
  assert.match(page.url(), /#\/run\//, 'Stay keeps the student on the step');
  // A header link also asks first
  await page.getByRole('link', { name: 'Settings' }).click();
  await page.locator('dialog').getByRole('button', { name: 'Stay' }).click();
  assert.match(page.url(), /#\/run\//);

  await page.getByRole('button', { name: 'Save and exit' }).click();
  await page.locator('dialog').getByRole('button', { name: 'Save and leave' }).click();
  await page.locator('.mode-grid').waitFor();
  await page.locator('[data-mode="assessment"] [data-step="self-report"][data-state="in-progress"]').waitFor();
  await page.getByRole('link', { name: 'Continue assessment' }).click();
  await page.locator('.progress-count', { hasText: 'Statement 2 of 2' }).waitFor();
});

test('a programme sitting code switches the hub to the full battery in a fixed, recorded order', async (t) => {
  const page = await openApp(t);
  await onboard(page);
  await page.locator('#programme-code').fill('nope');
  await page.getByRole('button', { name: 'Start', exact: true }).click();
  await page.locator('#programme-error', { hasText: 'not a sitting code' }).waitFor();
  await page.locator('#programme-code').fill('sep26-2');
  await page.getByRole('button', { name: 'Start', exact: true }).click();
  await page.locator('dialog').getByRole('button', { name: 'Start the sitting' }).click();
  await page.locator('h1', { hasText: 'Full battery' }).waitFor();
  assert.equal(await page.locator('.skill-grid').count(), 0, 'tiles are replaced by the battery');

  let r = await records(page);
  assert.equal(r.sitting.length, 1);
  const s = r.sitting[0];
  assert.deepEqual(s.programme, { code: 'SEP26-2', window: 2, skillOrder: ['_example'], position: 0 });
  assert.equal(s.windowId, 'programme:SEP26-2');
  assert.notEqual(s.formId, firstForm(r.participant[0].id), 'window 2 takes the second form');

  // The skill page points back to the battery; no self-directed assessment meanwhile
  await page.goto(`${base}index.html?example#/skill/_example`);
  await page.locator('.notice', { hasText: 'Programme sitting in progress' }).waitFor();

  await page.goto(`${base}index.html?example#/hub`);
  await page.getByRole('link', { name: 'Continue' }).click();
  for (const option of [0, 1]) {
    await page.locator('.likert-option').nth(3).click();
    await page.getByRole('button', { name: option ? 'Finish' : 'Next' }).click();
  }
  await page.getByRole('link', { name: 'Next: Pick the answer' }).click();
  await page.locator('.choice-card').first().click();
  await page.locator('.choice-card').first().click();
  await page.locator('.step-complete', { hasText: 'finished every skill' }).waitFor();
  await page.getByRole('link', { name: 'Back to your skills' }).click();
  await page.locator('.skill-grid').waitFor();
  await page.locator('.programme-entry', { hasText: 'Completed: SEP26-2' }).waitFor();
  r = await records(page);
  assert.ok(r.sitting[0].completedAt);
});

test('settings: extended time and reduced motion are saved; reset needs the typed word', async (t) => {
  const page = await openApp(t);
  await onboard(page);
  await page.getByRole('link', { name: 'Settings' }).click();
  await page.locator('#time-2').check();
  await page.locator('.save-status', { hasText: 'twice as long' }).waitFor();
  await page.locator('#reduced-motion').check();
  await page.locator('.save-status', { hasText: 'motion reduced' }).waitFor();
  assert.equal(await page.evaluate(() => document.documentElement.dataset.motion), 'reduce');
  await page.locator('#settings-evaluation').check();
  await page.locator('.save-status', { hasText: 'you agree' }).waitFor();
  let r = await records(page);
  assert.deepEqual(r.participant[0].settings, { timeMultiplier: 2, reducedMotion: true });
  assert.equal(r.participant[0].consent.programmeEvaluation, true);

  await page.reload();
  await page.locator('h1', { hasText: 'Settings' }).waitFor();
  assert.equal(await page.evaluate(() => document.documentElement.dataset.motion), 'reduce', 'restored on reload');
  assert.equal(await page.locator('#time-2').isChecked(), true);

  await page.getByRole('button', { name: 'Export my data' }).click();
  await page.locator('[role="status"]', { hasText: 'later release' }).first().waitFor();

  const reset = page.getByRole('button', { name: 'Delete all data' });
  assert.equal(await reset.isDisabled(), true);
  await page.locator('#reset-confirm').fill('delete');
  assert.equal(await reset.isDisabled(), true, 'the word must match exactly');
  await page.locator('#reset-confirm').fill('DELETE');
  await reset.click();
  await page.locator('h1', { hasText: 'Explore your five core skills' }).waitFor();
  r = await records(page);
  assert.deepEqual(r, {});
});

test('returning students can enter their code, which is checked', async (t) => {
  const page = await openApp(t);
  await page.getByRole('link', { name: 'I already have a code' }).click();
  await page.locator('#returning-code').fill('P-0000-00001');
  await page.getByRole('button', { name: 'Continue' }).click();
  await page.locator('#code-error', { hasText: 'not valid' }).waitFor();
  await page.locator('#returning-code').fill('p 0000 00000');
  await page.getByRole('button', { name: 'Continue' }).click();
  await page.locator('#consent-tool').check();
  await page.getByRole('button', { name: 'Continue' }).click();
  await page.getByRole('button', { name: 'Skip this question' }).click();
  assert.equal((await page.locator('#participant-code').textContent()).trim(), 'P-0000-00000');
  const r = await records(page);
  assert.equal(r.participant[0].consent.languageBackground, false);
  assert.equal(r.participant[0].languageBackground, undefined);
});
