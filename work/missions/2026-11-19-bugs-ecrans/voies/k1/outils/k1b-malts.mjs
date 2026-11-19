// Outil de la voie k1 (corrections B, points 11, 12, 13) : réécrit les sources Malts/sucres (fins de ligne CRLF conservées).
import fs from 'node:fs';
const lire = (f) => { const s = fs.readFileSync(f, 'utf8'); return { crlf: s.includes('\r\n'), s: s.split('\r\n').join('\n') }; };
const ecrire = (f, o) => fs.writeFileSync(f, o.crlf ? o.s.split('\n').join('\r\n') : o.s);
function edit(f, paires) {
  const o = lire(f);
  for (const [a, b] of paires) {
    if (!o.s.includes(a)) throw new Error(`${f} : absent : ${a.slice(0, 70)}`);
    o.s = o.s.split(a).join(b);
  }
  ecrire(f, o);
}
const D = 'src/domain/fermentables/moments.ts';
edit(D, [
  ["type Ligne = Pick<Fermentable, 'kind' | 'use'> | { kind?: FermentableKind; use?: FermentableUse };",
   "type Ligne = { kind?: FermentableKind; use?: FermentableUse; name?: string };"],
  ["/** Le grain qui passe vraiment par la maische : celui de la facture, de la couleur et de l'eau. */\nexport const grainEmpate = (f: Ligne): boolean => familleDe(f) === 'grain' && momentDe(f) === 'empatage';",
   String.raw`// MV-8, k1 point 12 : une épice (coriandre, zeste…) n'est pas un fermentescible. Aucune famille ne l'accueille : la ligne reste au brasseur (rien n'est refusé),
// mais elle n'est comptée ni dans le grain, ni dans la couleur, ni dans l'eau.
const MOTS_EPICE = /\b(coriandre|coriander|zestes?|peel|cannelle|cinnamon|vanille|vanilla|gingembre|ginger|poivre|pepper|cardamome|cardamom|clous?|clove|anis|badiane|muscade|nutmeg|camomille|hibiscus|lavande|sel|salt)\b/;
export const estEpice = (nom: string | undefined): boolean => MOTS_EPICE.test((nom ?? '').toLowerCase().normalize('NFD').replace(/\p{M}/gu, ''));

/** Le grain qui passe vraiment par la maische : celui de la facture, de la couleur et de l'eau (une épice n'en est pas). */
export const grainEmpate = (f: Ligne): boolean => familleDe(f) === 'grain' && momentDe(f) === 'empatage' && !estEpice(f.name);`],
]);
edit('src/ui/fermentescibles/modele.ts', [
  ['  grainEmpate, grainHorsEmpatage,', '  estEpice, grainEmpate, grainHorsEmpatage,'],
  ['export { grainEmpate, grainHorsEmpatage,', 'export { estEpice, grainEmpate, grainHorsEmpatage,'],
  [/* const */ "const MOTS_EPICE = /\\b(coriandre|coriander|zestes?|peel|cannelle|cinnamon|vanille|vanilla|gingembre|ginger|poivre|pepper|cardamome|cardamom|clous?|clove|anis|badiane|muscade|nutmeg|camomille|hibiscus|lavande|sel|salt)\\b/;\nexport const estEpice = (nom: string) => MOTS_EPICE.test(nu(nom));\n", '// (estEpice vit dans le domaine : `domain/fermentables/moments.ts`.)\n'],
  ["export const texteSurTeinte = (e: number) => (e >= 18 ? '#fff' : '#111');",
   "export const texteSurTeinte = (e: number) => (e >= 18 ? '#fff' : '#111');\n/** k1 point 13 : une teinte de malt si sombre (≥ 60 EBC) que sa pastille se perd sur le fond de la cave : elle porte un liseré clair. */\nexport const estSombre = (e: number) => e >= 60;"],
]);
edit('src/domain/beerColor.ts', [
  ["import { grainHorsEmpatage } from './fermentables/moments';", "import { estEpice, grainHorsEmpatage } from './fermentables/moments';"],
  ['filter((m) => !grainHorsEmpatage(m));', 'filter((m) => !grainHorsEmpatage(m) && !estEpice(m.name));'],
  ['return malts.filter((m) => m.colorEbc == null && m.weightKg !== 0).map((m) => m.name);', 'return malts.filter((m) => m.colorEbc == null && m.weightKg !== 0 && !estEpice(m.name)).map((m) => m.name);'],
]);
edit('src/ui/fermentescibles/EtapeFermentescibles.tsx', [
  ["fermentables.filter((f) => f.kind === 'grain' && f.colorEbc == null && f.weightKg !== 0).length;", "fermentables.filter((f) => f.kind === 'grain' && f.colorEbc == null && f.weightKg !== 0 && !estEpice(f.name)).length;"],
  ["{f.name} : une épice n’est pas un fermentescible, elle serait comptée comme {f.kind === 'grain' ? 'du grain' : 'du sucre'}. Elle se note en additif, en grammes.",
   "{f.name} : une épice n’est pas un fermentescible{f.kind === 'grain' ? ' ; elle n’est comptée ni dans le grain ni dans la teinte' : ' ; elle est comptée comme du sucre'}. Elle se note en additif, en grammes."],
]);
edit('src/ui/fermentescibles/Ligne.tsx', [
  ['  pas, partN, teinte, voile,', '  estEpice, estSombre, pas, partN, teinte, voile,'],
  ['    ? <span className="fer-pc fer-pc-hors" data-pc={i}>compté 0</span>\n    : grain\n',
   '    ? <span className="fer-pc fer-pc-hors" data-pc={i}>compté 0</span>\n    : grain && estEpice(f.name)\n    ? <span className="fer-pc" data-pc={i}>hors du grain</span>\n    : grain\n'],
  ['    <button type="button" className="fer-pas" data-role="couleur-ligne" data-cl={i} data-booster="couleur-sur-ligne"\n      style={{ background: teinte(f.colorEbc as number) }}',
   '    <button type="button" className={`fer-pas${estSombre(f.colorEbc as number) ? \' fer-sombre\' : \'\'}`} data-role="couleur-ligne" data-cl={i} data-booster="couleur-sur-ligne"\n      style={{ background: teinte(f.colorEbc as number) }}'],
]);
edit('src/ui/fermentescibles/Plateau.tsx', [
  ['<button type="button" className="fer-bpas" data-role="bteinte"', '<button type="button" className={`fer-bpas${estSombre(f.colorEbc) ? \' fer-sombre\' : \'\'}`} data-role="bteinte"'],
]);
edit('src/ui/fermentescibles/Ajout.tsx', [
  ["<span className={`fer-ap${nomCible ? ' fer-vu' : ''}`} data-role=\"apercu\" aria-live=\"polite\">\n          {nomCible && (",
   "{/* k1 point 11 : quand la ligne « Créer » est là, elle porte seule le geste (nom, masse, famille) : l'aperçu ne le répète pas. */}\n        <span className={`fer-ap${nomCible && !creer ? ' fer-vu' : ''}`} data-role=\"apercu\" aria-live=\"polite\">\n          {nomCible && !creer && ("],
  ['Créer « {t} » (stock à zéro)</span>', 'Créer « {t} »{s.kg != null && <> · <b>{kgTxt(s.kg)}</b> kg</>} (stock à zéro)</span>'],
]);
// CSS : liseré des pastilles sombres, marge du + flottant devant les alertes
const css = 'src/ui/fermentescibles/correctifs.css';
const c = fs.readFileSync(css, 'utf8');
fs.writeFileSync(css, c + `
/* k1 point 13 : une pastille de malt très sombre (≥ 60 EBC) était noire sur le fond noir de la cave : liseré clair, même taille (la bordure remplace la bordure sombre). */
.fer button.fer-pas.fer-sombre, .fer .fer-bpas.fer-sombre { border: 1.5px solid var(--f-t1); }
/* k1 point 12 : le + flottant (64 px à 12 px du bord) mordait le bord des alertes ; elles gardent sa gouttière (76 px) tant qu'il flotte. Au rail (1024 px et plus), aucune. */
@media (max-width: 1023px) {
  :root body[data-has-fab-floating] .fer [data-role="alertes"] { padding-right: 4.75rem; }
}
`);
