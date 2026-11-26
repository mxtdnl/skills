const { chromium } = require('playwright');
(async () => {
  const b = await chromium.launch();
  const p = await b.newPage({ viewport: { width: 1280, height: 900 } });
  await p.route(/fonts\.(googleapis|gstatic)/, r => r.abort());
  await p.goto('file://' + require('path').resolve(__dirname, '../../legacy/skills-assessment-hult.html'));
  const log = (...a) => console.log(...a);
  const active = () => p.evaluate(() => document.querySelector('.screen.active').id);

  await p.keyboard.press('Tab');
  log('first tab focus:', await p.evaluate(() => document.activeElement.id || document.activeElement.tagName));
  log('focus outline style:', await p.evaluate(() => getComputedStyle(document.activeElement).outlineStyle));
  log('likert buttons have aria-label/role radio:', 'checked below');
  await p.click('#begin-btn');
  log('likert btn aria-label:', await p.getAttribute('.likert-btn >> nth=0', 'aria-label'), '| role:', await p.getAttribute('.likert-btn >> nth=0', 'role'));

  async function answerPage(fakeVal) {
    const groups = await p.$$('#sa-questions .likert-group');
    for (let g = 0; g < groups.length; g++) {
      const btns = await groups[g].$$('.likert-btn');
      await btns[g === groups.length - 1 ? fakeVal - 1 : 0].click();
    }
    const pairs = await p.$$('#sa-questions .fc-pair');
    for (const pr of pairs) { await (await pr.$$('.fc-btn'))[0].click(); }
  }
  await answerPage(5);
  await p.click('#sa-next-btn');
  log('faking flag visible after Next:', await p.isVisible('#faking-flag'), '| page now:', await p.textContent('#sa-skill-label'));
  await p.click('#sa-back-btn');
  await p.click('#sa-next-btn');
  for (let i = 0; i < 4; i++) { await answerPage(1); await p.click('#sa-next-btn'); }
  log('screen after SA:', await active());

  await p.click('#ti-start-btn');
  await p.click('#ig-finish-btn');
  await p.click('#ti-start-btn');
  await p.click('.wason-card-btn >> nth=0');
  const before = await p.textContent('#wason-progress-label');
  await p.click('#wason-btn');
  const after = await p.textContent('#wason-progress-label');
  log('Wason one click on Confirm: before =', before, '| after =', after, '| feedback =', JSON.stringify(await p.textContent('#wason-feedback')), '| button =', await p.textContent('#wason-btn'));
  for (let k = 0; k < 14; k++) {
    if ((await active()) !== 'screen-wason') break;
    const btn = await p.$('.wason-card-btn:not([disabled])');
    if (btn) await btn.click();
    await p.click('#wason-btn');
  }
  log('after wason:', await active());

  await p.click('#ti-start-btn');
  log('AUT screen has any button (pause/extend):', (await p.$$('#screen-aut button')).length);
  await p.reload();
  log('after reload:', await active(), '| localStorage keys:', await p.evaluate(() => Object.keys(localStorage).length));
  log('external requests in page:', await p.evaluate(() => [...document.querySelectorAll('link[href^=http],script[src^=http]')].map(e => e.href || e.src)));
  await b.close();
})();
