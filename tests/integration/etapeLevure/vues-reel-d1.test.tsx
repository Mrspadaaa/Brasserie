// Les trois livraisons de d1 lues par les vues, sur l'API réelle : le levier °C structuré (`levierDetail`), le stock au relevé
// (`Disponibilite.stock`) et la floculation de la 1056 (« moyen »). Aucune règle dans la vue : elle écrit ce que l'API rend.
import { useState } from 'react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { cleanup, render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { yeastReferences, type YeastReference } from '../../../src/domain/yeastReferences';
import { levure as api } from '../../../src/domain/levure';
import { Chercher } from '../../../src/ui/etapeLevure/Chercher';
import { Comparer } from '../../../src/ui/etapeLevure/Comparer';
import { Suggerer } from '../../../src/ui/etapeLevure/Suggerer';
import type { PropsVue } from '../../../src/ui/etapeLevure/props';

vi.setConfig({ testTimeout: 60_000 });
afterEach(cleanup);
const trouver = (re: RegExp): YeastReference => yeastReferences([], { includeCatalogue: true }).find((y) => re.test(y.name))!;
const reperes = { temperatureC: 19, abvVise: 7, ogVisee: 1.066 };

function Hote({ vue, init = [] as string[] }: { vue: 'chercher' | 'comparer' | 'suggerer'; init?: string[] }) {
  const [comparees, setComparees] = useState<string[]>(init);
  const p: PropsVue = { base: trouver(/US-05/), reperes, comparees, onChoisir: vi.fn(), onComparees: setComparees, onVue: vi.fn() };
  return vue === 'chercher' ? <Chercher {...p} /> : vue === 'comparer' ? <Comparer {...p} /> : <Suggerer {...p} />;
}

describe('les livraisons de d1', () => {
  it('levier °C : la plage de `levierDetail` trace l’axe, avec ta conduite (19) et la source', async () => {
    const detail = api.suggerer(trouver(/US-05/), [{ axe: 'thiols', sens: 1 }], 1)[0]?.levierDetail;
    expect(detail?.plage).toBeTruthy();
    const u = userEvent.setup();
    render(<Hote vue="suggerer" />);
    await u.click(screen.getByRole('button', { name: /^Plus de thiols/ }));
    const axe = document.querySelector('.lvv-axe-c') as HTMLElement;
    expect(axe).not.toBeNull();
    expect(axe.getAttribute('aria-label')).toContain(`${detail!.plage!.min} à ${detail!.plage!.max} °C`);
    expect(axe.querySelector('.lvv-axe-cond')?.textContent).toBe('19');
  });

  it('stock : « épuisée au relevé du 27.09 », jamais une rupture datée', async () => {
    const u = userEvent.setup();
    render(<Hote vue="chercher" />);
    await u.type(screen.getByLabelText('Nom, fabricant ou code'), '1056');
    const mots = [...document.querySelectorAll('.lvv-ep')].map((e) => e.textContent);
    expect(mots.length).toBeGreaterThan(0);
    for (const m of mots) expect(m).toMatch(/^épuisée au relevé du \d{2}\.\d{2}$/);
  });

  it('floculation de la 1056 : une valeur, plus « ⌕ chercher »', () => {
    render(<Hote vue="comparer" init={[trouver(/1056/).id]} />);
    const ligne = document.querySelector('[data-ligne="floculation"]') as HTMLElement;
    const colonne1056 = ligne.querySelectorAll('.lvv-cell')[1] as HTMLElement;
    expect(colonne1056.className).not.toContain('lvv-inc');
    expect(colonne1056.textContent).toMatch(/moy|faible/i);
  });
});
