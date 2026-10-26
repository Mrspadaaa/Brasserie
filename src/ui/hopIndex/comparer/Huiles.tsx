// La vue des huiles de rpz2 (r6a++, « L'étalon Saaz ») : ses mots, « Ça c'est vraiment bien aussi avec la vue facile pour
// les huiles, le radar » ; et plus tôt « un moyen de différencier un houblon hyper aromatique type Galaxy d'un houblons
// plus "fade" type saaz ». L'huile totale mesurée (mL/100 g, plage des sources), une barre par houblon sur la même
// échelle, Saaz en étalon, ta référence en gris ; inconnue : « ? », jamais 0.
import { HUILE_MAX, SAAZ, huileDe, type ColonneLue } from './calcul';
import { hopRef } from '../parcours/v4';
import { IconeFiole, IconeGoutte } from './icones';

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
// franche du bas au haut, un trait fin au milieu, la plage écrite à gauche. Données : `oils` du catalogue du moteur
// (Beer Maverick), en % de l'huile totale ; « Autres » = la valeur publiée « All Others » (repli : 100 − les composés, bornée à 0). Inconnu :
// barre hachurée et « ? », jamais 0.
type Plage = [number, number] | null;
const COMPOSES: { id: 'myrcene' | 'humulene' | 'caryophyllene' | 'autres'; nom: string; aromes: string }[] = [
  { id: 'myrcene', nom: 'Myrcène', aromes: 'résineux, agrumes, fruité' },
  { id: 'humulene', nom: 'Humulène', aromes: 'boisé, noble, épicé' },
  { id: 'caryophyllene', nom: 'Caryophyllène', aromes: 'poivre, boisé, herbacé' },
  { id: 'autres', nom: 'Autres', aromes: 'β-pinène, linalol, géraniol' },
];
function plageDe(cle: string, id: (typeof COMPOSES)[number]['id']): Plage {
  const o = hopRef(cle)?.catalogue.oils;
  if (!o) return null;
  if (id !== 'autres') return o[id] ?? null;
  // « Autres » = la valeur publiée « All Others » de Beer Maverick (β-pinène, linalol, géraniol, sélinène) ; le calcul
  // (100 − les trois composés, moins le farnésène s'il est publié) ne sert qu'en repli, quand elle manque.
  if (o.others) return o.others;
  const t = [o.myrcene, o.humulene, o.caryophyllene, ...(o.farnesene ? [o.farnesene] : [])];
  if (t.slice(0, 3).some((p) => !p)) return null;
  const lo = Math.max(0, 100 - t.reduce((s, p) => s + p![1], 0)), hi = Math.max(0, 100 - t.reduce((s, p) => s + p![0], 0));
  return [lo, hi];
}
const ent = (x: number) => String(Math.round(x));
export function CompositionVue({ cols }: { cols: ColonneLue[] }) {
  return (
    <section className="cmc-co" data-role="composition-huiles" aria-label="Composition des huiles, en % de l'huile totale, Beer Maverick">
      <p className="p4-hu-t"><b>Composition des huiles</b><span>% de l'huile totale</span><span className="p4-hu-m"><IconeFiole taille={13} />mesuré · Beer Maverick</span></p>
      {COMPOSES.map((k) => (
        <div key={k.id} className="cmc-co-g" data-compose={k.id}>
          <p className="cmc-co-n"><b>{k.nom}</b><span>{k.aromes}</span></p>
          {cols.map((c) => {
            const p = plageDe(c.cle, k.id);
            const lab = `${c.houblon.nom}, ${k.nom.toLowerCase()} : ${p ? `${ent(p[0])}–${ent(p[1])} %` : 'inconnu'}`;
            return (
              <div key={c.cle} className="cmc-co-l" data-houblon={c.cle} aria-label={lab} title={lab}>
                <span className="cmc-co-v" style={{ color: c.couleur }}>{p ? `${ent(p[0])}–${ent(p[1])} %` : '?'}</span>
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
