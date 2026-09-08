async (page) => {
  const url = 'http://127.0.0.1:5174/scripts/header-seam-audit/fixture.html';
  const app = 'http://127.0.0.1:5174/entrypoints/preview/index.html?url=' + encodeURIComponent(url);
  const devices = await page.evaluate(async () => {
    const { devices } = await import('/src/domain/device/device-catalog.ts');
    return devices.map(({ id, name }) => ({ id, name }));
  });
  await page.setViewportSize({ width: 1512, height: 830 });
  const results = [];
  for (const previewStyle of ['device', 'free']) {
    for (let batch = 0; batch < devices.length; batch += 3) {
      const selected = devices.slice(batch, batch + 3);
      await page.evaluate(({ selected, url, previewStyle }) => {
        localStorage.setItem('mdvSimulatorSession', JSON.stringify({
          slots: selected.map((d, i) => ({ id: 'contain-' + i, deviceId: d.id, url, orientation: 'portrait', zoom: 1.5, zoomMode: 'actual', reloadToken: 0, showFrame: true })),
          activeSlotId: 'contain-0', display: { scrollSync: false, navigationSync: false, darkMode: false, previewStyle },
        }));
      }, { selected, url, previewStyle });
      await page.goto(app);
      await page.waitForFunction(n => {
        const cards = [...document.querySelectorAll('[data-preview-slot-id]')];
        return cards.length === n && cards.every(card => card.querySelector('iframe')?.contentDocument?.querySelector('header'));
      }, selected.length);
      const skip = page.getByRole('button', { name: 'Skip feature tour' });
      if (await skip.isVisible()) await skip.click();
      const checks = await page.locator('[data-preview-slot-id]').evaluateAll(cards => cards.map(card => {
        const canvas = card.querySelector('[data-design-overlay-surface]');
        const r = canvas.getBoundingClientRect(), column = card.getBoundingClientRect();
        const hits = [.1, .5, .9].flatMap(y => [12, r.width / 2, r.width - 12].map(x => document.elementFromPoint(r.left + x, r.top + r.height * y)?.closest('[data-preview-slot-id]') === card));
        return { contained: r.left >= column.left && r.right <= column.right && r.bottom <= column.bottom && r.bottom <= innerHeight, ownHits: hits.every(Boolean), overflow: getComputedStyle(canvas).overflow };
      }));
      checks.forEach((check, i) => {
        const result = { ...selected[i], previewStyle, ...check };
        results.push(result);
        if (!check.contained || !check.ownHits || check.overflow !== 'hidden') throw Error(JSON.stringify(result));
      });
    }
  }
  return { devices: devices.length, cases: results.length, results };
}
