import assert from 'node:assert/strict';
export const verifyGraph = async (page, recipe, cumulative, context) => {
  const proof = await page.evaluate((recipe, cumulative, context) => {
    const qa = window.__hopQa, raw = qa.raw(recipe, cumulative, 0, context), p = cumulative ? raw.overall : raw.additions[0], axes = qa.axes();
    const issues = [], checked = [];
    for (const axis of axes) {
      const e = p.profile[axis.id], range = e?.range, full = range && range.min <= axis.scale.min && range.max >= axis.scale.max;
      const group = document.querySelector(`[aria-label="Simulation de mes ajouts"] [data-axis="${axis.id}"]`);
      if (group && (Number(group.dataset.scaleMin) !== axis.scale.min || Number(group.dataset.scaleMax) !== axis.scale.max)) issues.push(`${axis.id}: incorrect axis scale`);
      const unresolved = !range || full || range.min <= axis.lowMax && range.max > axis.mediumMax;
      const expectedPoint = range && !unresolved && Number.isFinite(e.central) && e.central >= range.min && e.central <= range.max;
      const point = group?.querySelector('[data-aroma-point]');
      if (!expectedPoint && point) issues.push(axis.id+': unresolved range drawn as an intensity');
      if (expectedPoint && group) {
        if(!point) issues.push(axis.id+': missing central point');
        else {
          const radius=Math.hypot(Number(point.getAttribute('cx'))-220,Number(point.getAttribute('cy'))-190);
          const expected=92*(e.central-axis.scale.min)/(axis.scale.max-axis.scale.min);
          if(Math.abs(radius-expected)>1e-5)issues.push(axis.id+': wrong central radius');
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
        const interval=row.querySelector('[data-aroma-range]'), marker=row.querySelector('[data-testid="aroma-central-marker"]');
        if(!range&&(interval||marker))issues.push(axis.id+': missing value drawn in bars');
        if(range) {
          if(!interval)issues.push(axis.id+': missing numerical bounds');
          else {
            const start=100*(range.min-axis.scale.min)/(axis.scale.max-axis.scale.min),width=100*(range.max-range.min)/(axis.scale.max-axis.scale.min);
            // CSSOM serializes percentages to six significant digits (<0.001 px here).
            if(Math.abs(parseFloat(interval.style.left)-start)>1e-4||Math.abs(parseFloat(interval.style.width)-width)>1e-4)issues.push(axis.id+': wrong interval position '+JSON.stringify({actual:[interval.style.left,interval.style.width],expected:[start,width]}));
          }
          if(unresolved&&marker)issues.push(axis.id+': broad range gets an intensity point');
          if(expectedPoint&&(!marker||Math.abs(parseFloat(marker.style.left)-100*(e.central-axis.scale.min)/(axis.scale.max-axis.scale.min))>1e-4))issues.push(axis.id+': wrong central position in bars');
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
