// Voie c3c (#180) : lecteur Hops Direct sur du HTML synthétique (noms de houblon en liens, donc sur plusieurs lignes).
import { describe, expect, it } from 'vitest';
import { lireProduitHopsDirect } from '../../../scripts/collecte-hop/hopsdirect.mjs';

const page = `<html><body><h1>EXEMPLUM - 2026 Leaf</h1><div>Regular price</div><div>2026 Crop</div><div>Alpha Acid: 11.7%</div>
<div>Aroma de pin et de pamplemousse.</div><div>Typical Brewing Style</div><div>US Pale Ale, IPA, and Lager.</div>
<div>Possible Substitution</div><div><a>Nugget</a>, <a>Columbus</a>, or <a>Simcoe</a></div><div>Domestic Hop Leaf</div><div>Texte long.</div></body></html>`;

describe('lecteur Hops Direct', () => {
  it('lit le lot : α, année de récolte, forme, styles et substituts', () => {
    const p = lireProduitHopsDirect(page)!;
    expect(p).toMatchObject({ nom: 'Exemplum', forme: 'Leaf', recolte: 2026 });
    expect(p.alpha).toMatchObject({ valeur: 11.7, unite: '%' });
    expect(p.styles).toEqual(['US Pale Ale', 'IPA', 'Lager']);
    expect(p.substituts).toEqual(['Nugget', 'Columbus', 'Simcoe']);
  });
  it('sans α publié, la page est ignorée', () => {
    expect(lireProduitHopsDirect('<html><h1>EXEMPLUM - 2026 Leaf</h1></html>')).toBeNull();
  });
});
