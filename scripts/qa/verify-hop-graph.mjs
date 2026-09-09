import assert from 'node:assert/strict';
export const verifyGraph = async (page, recipe, cumulative, context) => {
  const proof = await page.evaluate((recipe, cumulative, context) => {
    const qa = window.__hopQa, raw = qa.raw(recipe, cumulative, 0, context), p = cumulative ? raw.overall : raw.additions[0], axes = qa.axes();
    const issues = [], checked = [];
    for (const axis of axes) {
      const e = p.profile[axis.id], range = e?.range, full = range && range.min <= axis.scale.min && range.max >= axis.scale.max;
      const group = document.querySelector(`[aria-label="Simulation de mes ajouts"] [data-axis="${axis.id}"]`);
      if (group && (Number(group.dataset.scaleMin) !== axis.scale.min || Number(group.dataset.scaleMax) !== axis.scale.max)) issues.push(`${axis.id}: incorrect axis scale`);
      const band = group?.querySelector('line.text-hop'), point = group?.querySelector('circle');
      if ((!range || full) && (band || point)) issues.push(`${axis.id}: unknown drawn as an intensity`);
      if (range && !full && group) {
        if (!band) issues.push(`${axis.id}: missing known band`);
        else for (const edge of ['1', '2']) {
          const radius = Math.hypot(Number(band.getAttribute('x' + edge)) - 220, Number(band.getAttribute('y' + edge)) - 190);
          const expected = 110 * ((edge === '1' ? range.min : range.max) - axis.scale.min) / (axis.scale.max - axis.scale.min);
          if (Math.abs(radius - expected) > 1e-5) issues.push(`${axis.id}: incorrect radial bound`);
        }
      }
      const row = [...document.querySelectorAll('[aria-label="Simulation de mes ajouts"] [role="group"]')].find(el => el.getAttribute('aria-label') === `Estimation · ${axis.name}`);
      if (row && row.getClientRects().length) {
        const confidence = { low: 'faible', medium: 'moyenne', high: 'élevée' }[e?.confidence || 'low'];
        if (!row.textContent.includes('Confiance ' + confidence)) issues.push(`${axis.id}: incorrect confidence`);
        if (full && /[Tt]endance moyenne/.test(row.textContent)) issues.push(`${axis.id}: invented middle tendency`);
        const match = row.textContent.match(/Plage ([\d\s .,]+)–([\d\s .,]+)/);
        if (range && match) {
          const num = s => Number(s.replace(/[\s ]/g, '').replace(',', '.'));
          if (num(match[1]) > range.min + 1e-9 || num(match[2]) < range.max - 1e-9) issues.push(`${axis.id}: inward rounding`);
        }
        checked.push({ axis: axis.id, confidence, range });
      }
    }
    const chemicalRows = [...document.querySelectorAll('[aria-label="Chimie des ajouts simulés"] [aria-label^="Quantité introduite ·"]')];
    if (chemicalRows.length) Object.values(raw.chemistry.introduced).forEach((amount, index) => {
      const row = chemicalRows[index], bar = row?.querySelector('summary .relative > span');
      const value = amount.range?.max ?? amount.reported;
      const maximum = Math.max(0, ...Object.values(raw.chemistry.introduced).filter(a => a.unit === amount.unit).map(a => a.range?.max ?? a.reported ?? 0));
      if (!row) { issues.push(`${amount.analyte}: missing chemical row`); return; }
      if (value === undefined && bar) issues.push(`${amount.analyte}: unknown chemistry drawn as zero`);
      if (value !== undefined && maximum > 0) {
        if (!bar) issues.push(`${amount.analyte}: missing chemical bar`);
        else {
          const left = 100 * (amount.range?.min ?? amount.reported) / maximum;
          const width = amount.range ? 100 * (amount.range.max - amount.range.min) / maximum : null;
          if (Math.abs(parseFloat(bar.style.left) - left) > 1e-4 || (width !== null && Math.abs(parseFloat(bar.style.width) - width) > 1e-4)) issues.push(`${amount.analyte}: wrong chemical geometry`);
        }
        const unit = amount.unit === 'ug' ? 'µg' : amount.unit;
        if (!row.querySelector('summary').textContent.includes(unit)) issues.push(`${amount.analyte}: wrong displayed unit`);
      }
      const confidence = { low: 'faible', medium: 'moyenne', high: 'élevée' }[amount.confidence];
      if (!row.textContent.includes('Confiance ' + confidence)) issues.push(`${amount.analyte}: wrong chemical confidence`);
    });
    return { issues, checked, raw };
  }, recipe, cumulative, context);
  assert.deepEqual(proof.issues, []); return proof;
};
