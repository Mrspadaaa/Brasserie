// La vue des huiles de rpz2 (r6a++, « L'étalon Saaz ») : ses mots, « Ça c'est vraiment bien aussi avec la vue facile pour
// les huiles, le radar » ; et plus tôt « un moyen de différencier un houblon hyper aromatique type Galaxy d'un houblons
// plus "fade" type saaz ». L'huile totale mesurée (mL/100 g, plage des sources), une barre par houblon sur la même
// échelle, Saaz en étalon, ta référence en gris ; inconnue : « ? », jamais 0.
import { HUILE_MAX, SAAZ, huileDe, type ColonneLue } from './calcul';
import { hopRef } from '../parcours/v4';
import { IconeFiole, IconeGoutte } from './icones';
import { compose, titreRef } from './valeurs';

const ECH = HUILE_MAX + 0.5;
export function HuilesVue({ cols, reference }: { cols: ColonneLue[]; reference: string | null }) {
  const lignes = [
    { cle: SAAZ, nom: hopRef(SAAZ)?.name ?? 'Saaz', couleur: '#8a8580', etalon: true },
    ...cols.map((c) => ({ cle: c.cle, nom: c.houblon.nom, couleur: c.couleur, etalon: false })),
    ...(reference ? [{ cle: reference, nom: hopRef(reference)?.name ?? reference, couleur: '#c4c0bb', etalon: false }] : []),
  ].map((l) => ({ ...l, v: huileDe(l.cle) }));
  const max = [...lignes].filter((l) => l.v && !l.etalon && l.cle !== reference).sort((a, b) => (b.v!.hi - a.v!.hi))[0];
  const pc = (x: number) => `${((Math.min(x, ECH) / ECH) * 100).toFixed(1)}%`;
  return (
    <section className="p4-hu" data-greffe="rpz2-huiles-vue" data-role="huiles" aria-label="Huile totale mesurée, mL/100 g, de Saaz au plus aromatique">
      <p className="p4-hu-t"><IconeGoutte taille={16} /><b>{`De Saaz à ${max?.nom ?? '…'}`}</b><span>{'huile totale, mL/100 g'}</span><span className="p4-hu-m"><IconeFiole taille={13} />{'mesuré'}</span></p>
      {lignes.map((l) => (
        <div key={l.cle} className="p4-hu-l" data-houblon={l.cle}>
          <span className="p4-hu-n"><i style={{ background: l.couleur }} />{l.nom}</span>
          <span className="p4-hu-p">{l.v && <i className={l.etalon ? 'p4-hu-b p4-hu-etalon' : 'p4-hu-b'} style={{ left: pc(l.v.lo), width: `calc(${pc(l.v.hi)} - ${pc(l.v.lo)})`, background: l.etalon ? undefined : l.couleur }} title={`${l.v.texte} mL/100 g (${l.v.source})`} />}</span>
          <span className={l.etalon || l.cle === reference ? 'p4-hu-v p4-hu-gris' : 'p4-hu-v'}>{l.v ? l.v.texte : '?'}</span>
        </div>
      ))}
      <p className="p4-hu-pied"><span>{'← fade · Saaz'}</span><span>{`${max?.nom ?? ''} · hyper aromatique →`}</span></p>
    </section>
  );
}

// cmc2c — « Composition des huiles », reprise telle quelle de Beer Maverick (ses mots, 25.10 : « Aussi, pour comparé les
// chimies. Les mettre lune au dessus de l'autre pour bien voir les différences »). Un groupe par composé, une barre par
// houblon comparé l'une au-dessus de l'autre, à sa couleur, sur la même échelle 0–100 % : pâle de 0 au bas de la plage,
// franche du bas au haut, un trait fin au milieu, la plage écrite à gauche. Inconnu : barre hachurée et « ? », jamais 0.
// o1 (D154, 26.10 : « Oui ne regroupe jamais plusieurs huiles. Sauf si c'est utile et que elles sont déjà séparé à un
// endroit ») : une ligne par huile nommée, dans l'ordre de Beer Maverick (myrcène, humulène, caryophyllène, farnésène), puis
// linalol et géraniol ; le reste « autres » en dernière ligne, sans aucune huile qui a sa propre ligne.
// Données, en % de l'huile totale :
//  - myrcène, humulène, caryophyllène : `oils` du catalogue (Beer Maverick), comme avant ;
//  - farnésène, linalol, géraniol : `compose()` de valeurs.ts, la source du tableau de chimie (fiches de composés + catalogue :
//    `oils.farnesene` BM, `hsLinalool` HS), enveloppe de toutes les sources ;
//  - autres : « All Others » de Beer Maverick (β-pinène, linalol, géraniol, sélinène ; le farnésène est publié à part), moins
//    les plages du linalol et du géraniol quand elles sont connues (intervalles, bornée à 0). Repli sans valeur publiée :
//    100 − myrcène − humulène − caryophyllène − farnésène, avec la même soustraction.
type Plage = [number, number] | null;
type Id = 'myrcene' | 'humulene' | 'caryophyllene' | 'farnesene' | 'linalol' | 'geraniol' | 'autres';
// Mots d'arôme : farnésène « frais, vert, floral », linalol « floral, lavande, agrumes », géraniol « rose, floral » sont
// les descripteurs de la consigne de la voie o1 (linalol et géraniol : famille floral de `FAMILLE_COMPOSE`, dryhopper/mesures.ts) ;
// aucune fiche de données ne les porte mot pour mot.
export const COMPOSES: { id: Id; nom: string; aromes: string }[] = [
  { id: 'myrcene', nom: 'Myrcène', aromes: 'résineux, agrumes, fruité' },
  { id: 'humulene', nom: 'Humulène', aromes: 'boisé, noble, épicé' },
  { id: 'caryophyllene', nom: 'Caryophyllène', aromes: 'poivre, boisé, herbacé' },
  { id: 'farnesene', nom: 'Farnésène', aromes: 'frais, vert, floral' },
  { id: 'linalol', nom: 'Linalol', aromes: 'floral, lavande, agrumes' },
  { id: 'geraniol', nom: 'Géraniol', aromes: 'rose, floral' },
  // Le seul groupe : β-pinène et sélinène ne sont séparés nulle part tant que la collecte (voies c3) n'a rien rapporté.
  { id: 'autres', nom: 'Autres', aromes: 'β-pinène, sélinène…' },
];
interface Mesure { p: Plage; refs: string[] }
const SANS: Mesure = { p: null, refs: [] };
// Une plage ouverte en haut (« > x ») n'a pas de borne : elle reste inconnue ici, comme la « borne seule » du tableau.
const deCompose = (cle: string, c: 'farnesene' | 'linalol' | 'geraniol'): Mesure => {
  const v = compose(cle, c);
  return v && v.hi != null ? { p: [v.lo, v.hi], refs: v.refs } : SANS;
};
export function mesureDe(cle: string, id: Id): Mesure {
  if (id === 'farnesene' || id === 'linalol' || id === 'geraniol') return deCompose(cle, id);
  const o = hopRef(cle)?.catalogue.oils;
  if (!o) return SANS;
  if (id !== 'autres') return o[id] ? { p: o[id], refs: ['BM'] } : SANS;
  const lin = deCompose(cle, 'linalol').p, ger = deCompose(cle, 'geraniol').p;
  let base: Plage = null;
  if (o.others) base = o.others;
  else {
    // Repli : le farnésène retiré est celui de la ligne Farnésène (même source), sinon celui de Beer Maverick.
    const far = deCompose(cle, 'farnesene').p ?? o.farnesene ?? null;
    const t = [o.myrcene, o.humulene, o.caryophyllene];
    if (t.some((x) => !x)) return SANS;
    const plage = [...t, ...(far ? [far] : [])] as [number, number][];
    base = [Math.max(0, 100 - plage.reduce((s, x) => s + x[1], 0)), Math.max(0, 100 - plage.reduce((s, x) => s + x[0], 0))];
  }
  // Pas de double compte : chaque huile qui a sa propre ligne ET une valeur pour ce houblon sort du reste (arithmétique
  // d'intervalles : le bas moins les hauts, le haut moins les bas, bornés à 0). Une huile sans valeur reste dans le reste publié.
  let lo = base[0], hi = base[1];
  for (const x of [lin, ger]) if (x) { lo -= x[1]; hi -= x[0]; }
  return { p: [Math.max(0, lo), Math.max(0, hi)], refs: ['BM'] };
}
const ent = (x: number) => String(Math.round(x));
const dec = (x: number) => String(Math.round(x * 10) / 10).replace('.', ',');
// Une ligne sans valeur chez aucun houblon comparé ne s'affiche pas ; un reste dont aucun houblon n'atteint 1 % n'apprend rien.
const utile = (id: Id, ms: Mesure[]) => (id === 'autres' ? ms.some((m) => m.p && m.p[1] >= 1) : ms.some((m) => m.p));
export function CompositionVue({ cols }: { cols: ColonneLue[] }) {
  return (
    <section className="cmc-co" data-role="composition-huiles" aria-label="Composition des huiles, en % de l'huile totale, Beer Maverick">
      <p className="p4-hu-t"><b>Composition des huiles</b><span>% de l'huile totale</span><span className="p4-hu-m"><IconeFiole taille={13} />mesuré · Beer Maverick</span></p>
      {COMPOSES.map((k) => ({ k, ms: cols.map((c) => mesureDe(c.cle, k.id)) })).filter(({ k, ms }) => utile(k.id, ms)).map(({ k, ms }) => (
        <div key={k.id} className="cmc-co-g" data-compose={k.id}>
          <p className="cmc-co-n"><b>{k.nom}</b><span>{k.aromes}</span></p>
          {cols.map((c, i) => {
            const { p, refs } = ms[i];
            // Les huiles rares (< 10 %) gardent la décimale : « 0,5–2 % » ne devient pas « 1–2 % ».
            const plage = p ? (p[1] >= 10 ? `${ent(p[0])}–${ent(p[1])} %` : `${dec(p[0])}–${dec(p[1])} %`) : null;
            const lab = `${c.houblon.nom}, ${k.nom.toLowerCase()} : ${plage ?? 'inconnu'}${refs.length ? ` (${[...new Set(refs.map(titreRef))].join(', ')})` : ''}`;
            return (
              <div key={c.cle} className="cmc-co-l" data-houblon={c.cle} aria-label={lab} title={lab}>
                <span className="cmc-co-v" style={{ color: c.couleur }}>{plage ?? '?'}</span>
                <span className={p ? 'cmc-co-p' : 'cmc-co-p cmc-co-inc'}>
                  {p && <>
                    <i className="cmc-co-pale" style={{ width: `${p[0]}%`, background: c.couleur }} />
                    <i className="cmc-co-fr" style={{ left: `${p[0]}%`, width: `${Math.max(0.8, p[1] - p[0])}%`, background: c.couleur }} />
                    <i className="cmc-co-mi" style={{ left: `${(p[0] + p[1]) / 2}%` }} />
                  </>}
                </span>
              </div>
            );
          })}
        </div>
      ))}
    </section>
  );
}
