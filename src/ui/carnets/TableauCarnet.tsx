/** Le tableau du carnet ouvert (h05-3) et la ligne d'un lien à relire, sortis de CarnetOuvert.tsx. */
import React, { useLayoutEffect, useRef } from 'react';
import { ExternalLink, Eye, Link2 } from 'lucide-react';
import { domaineEtChemin, libelleCaracteristique, libelleEcarte } from '../../domain/carnets/comparer';
import { dispoDe } from '../../domain/carnets/modele';
import { convertiChf, estEtranger } from '../../domain/carnets/prixRendu';
import { colonnesVue, estMesure, meilleursDe, sansApercu, texteCellule, type ColonneVue, type TableauV } from './Comparer';
import { montant, type ArticleV, type ContenuCarnetV, type FaconV } from './EtatIA';
import { prixOrigine } from './PrixPastille';
import { VignetteObjet } from './pictos';
import { etendue, pastilleFacon, sansEcarte, texteMoinsBien, type Ligne, type Separation } from './ouvertCalculs';

const DEVISES = new Set(['CHF', 'EUR', '€', 'Fr.', 'USD', '$']);

/**
 * Les colonnes du tableau du carnet : la 1re valeur qui classe (plus ou moins), puis le prix ; le reste vit dans Comparer.
 * L-19 (23.11 ; M1-14, M4-7) : une colonne de valeur est une MESURE lue sur un article au moins. Une colonne en monnaie à côté du prix
 * redisait « CHF » (deux en-têtes, la 1re vide), un mot (« avec groupe frigorifique ») ne classe pas et se rognait en mono : ni l'un ni
 * l'autre ici.
 */
export function colonnesCarnet(t: TableauV): ColonneVue[] {
  const toutes = colonnesVue(t);
  const prix = toutes.find(c => c.cle === '__prix');
  const mesures = toutes.filter(c => c.cle !== '__prix' && c.sens !== 'oui-non' && !(prix && c.unite && DEVISES.has(c.unite))
    && t.lignes.some(l => { const v = texteCellule(l, c); return !!v && estMesure(v); }));
  const valeur = mesures.find(c => c.sens === 'plus' || c.sens === 'moins') ?? mesures[0];
  /* L-19 (prix en francs et en euros, « Prix en euros ») : l'en-tête disait « EUR » au-dessus de 3 350 CHF. Monnaies mêlées : l'en-tête
     dit CHF, chaque prix d'une autre monnaie dit la sienne (TableauCarnet). */
  const devises = new Set(t.lignes.filter(l => l.prixCentimes !== undefined).map(l => l.devise ?? 'CHF'));
  /* D447 : un prix hors franc se lit converti (≈, au cours de la lecture ou de la facture) sous l'en-tête CHF, l'original dit sous le nom */
  const prixVu = prix && (devises.size > 1 || [...devises].some(d => d.toUpperCase() !== 'CHF')) ? { ...prix, unite: 'CHF' } : prix;
  return [valeur, prixVu].filter((x): x is ColonneVue => !!x);
}

/** L-19 : la largeur d'une colonne, celle de sa plus longue valeur dans la police de sa cellule, entre 44 et 104 px (au-delà, elle passe à la ligne). */
function poserLargeurs(tab: HTMLElement, n: number) {
  const ctx = document.createElement('canvas').getContext('2d');
  if (!ctx) return;
  for (let i = 0; i < n; i++) {
    let w = 0;
    tab.querySelectorAll<HTMLElement>(`[data-col="${i}"] > span`).forEach(s => {
      /* le raccourci `font` est vide quand font-variant-numeric est posé (.cn-mono) : la police se recompose */
      const cs = getComputedStyle(s);
      ctx.font = `${cs.fontStyle} ${cs.fontWeight} ${cs.fontSize} ${cs.fontFamily}`;
      w = Math.max(w, ctx.measureText(s.textContent ?? '').width);
    });
    tab.style.setProperty(`--cn-col${i}`, `${Math.round(Math.min(104, Math.max(44, w + 4)))}px`);
  }
}

/**
 * En-tête court : l'unité si elle suffit (« m³/h », « CHF »), sinon le premier mot du nom. Critique 7, n° 4 (L14) : une température ne
 * se lit jamais à l'unité seule (« °C 43 » sur un frigo) ; elle dit ce qu'elle mesure, en abrégé, au-dessus de l'unité (« amb. max / °C »).
 */
export function enteteCourt(c: Pick<ColonneVue, 'nom' | 'unite'>): string {
  if (c.unite === '°C') {
    const quoi = libelleCaracteristique(c.nom).replace(/^temp[ée]rature\s*/i, '').trim().split(/\s+/).filter(Boolean)
      .map(m => (m.length > 5 ? `${m.slice(0, 3)}.` : m)).join(' ');
    return quoi ? `${quoi} °C` : '°C';
  }
  if (c.unite) return c.unite;
  const mot = c.nom.split(/\s+/)[0] ?? c.nom;
  return mot.length > 9 ? `${mot.slice(0, 8)}.` : mot;
}

/** Les lignes classées sans les liens à relire, rangs recomptés (1, 2, 3… parmi les articles en lice). */
export function lignesClassees(t: TableauV, aRelire: ArticleV[], sauf?: string): Ligne[] {
  const relire = new Set(aRelire.map(a => a.id));
  let n = 0;
  return t.lignes.filter(l => !relire.has(l.articleId)).map(l => (l.rang !== null && !l.ecarte ? { ...l, rang: ++n } : l)).filter(l => l.articleId !== sauf);
}

export function TableauCarnet({ carnet: k, titre, tableau, aRelire, sep, sauf, onOuvrir, conclusion, taux }: { taux?: number; carnet: ContenuCarnetV; titre: string; tableau: TableauV; aRelire: ArticleV[]; sep: Separation | null; sauf?: string; onOuvrir: (id: string) => void; conclusion?: React.ReactNode }) {
  const cols = colonnesCarnet(tableau);
  const meilleurs = new Map(cols.map(c => [c.cle, meilleursDe(tableau, c)]));
  const lignes = lignesClassees(tableau, aRelire, sauf);
  const art = (id: string) => k.articles.find(a => a.id === id);
  /* CRN-18 (critique carnet 21.11) : carnet réalisé ou archivé, la machine est achetée ; la ligne ne dit plus « veille » (la bascule reste dans sa fiche) */
  const fini = k.sortie?.etat === 'realise' || !!k.archive;
  const veille = (a?: ArticleV) => !fini && !!a?.veille?.active;
  /* l'ordre : les façons en lice, les articles sans façon, puis — après la conclusion (n° 20) — les façons écartées */
  const sansFacon = { facon: null as FaconV | null, lignes: lignes.filter(l => { const f = art(l.articleId)?.faconId; return !f || !k.facons.some(x => x.id === f); }) };
  const blocsDe = (fs: FaconV[]) => fs.map(f => ({ facon: f as FaconV | null, lignes: lignes.filter(l => art(l.articleId)?.faconId === f.id) }));
  const enLice = [...blocsDe(k.facons.filter(f => f.etat !== 'ecartee')), sansFacon].filter(b => b.lignes.length || (b.facon && b.facon.etat !== 'ecartee'));
  const ecartees = blocsDe(k.facons.filter(f => f.etat === 'ecartee')).filter(b => b.lignes.length);
  const blocs = [...enLice, ...ecartees];
  const gabarit = { gridTemplateColumns: `var(--cn-rangl, 32px) var(--cn-vignl, 34px) minmax(0, 1fr) ${cols.map((_, i) => `var(--cn-col${i}, var(--cn-col, 54px))`).join(' ')}` } as React.CSSProperties;
  /* L-19 : les lignes sont des grilles séparées ; la largeur de chaque colonne, mesurée, est la même pour toutes (à chaque rendu, puis
     quand les polices sont prêtes) */
  const refTab = useRef<HTMLDivElement>(null);
  useLayoutEffect(() => {
    const el = refTab.current;
    if (!el || typeof document === 'undefined' || !document.fonts) return;
    poserLargeurs(el, cols.length);
    let vivant = true;
    void document.fonts.ready.then(() => { if (vivant) poserLargeurs(el, cols.length); });
    return () => { vivant = false; };
  });

  return (
    <div ref={refTab} className="cn-tab" role="table" aria-label="Articles, rangés dans leur façon">
      {blocs.map((b, i) => {
        const prix = etendue(b.lignes.map(l => l.prixCentimes).filter((x): x is number => typeof x === 'number'));
        const pastille = b.facon ? pastilleFacon(k, b.facon, sep) : null;
        return (
          <React.Fragment key={b.facon?.id ?? 'sans'}>
          {i === enLice.length && conclusion}
          <div className={`cn-tab-bloc${b.facon?.etat === 'ecartee' ? ' cn-tab-ecartee' : ''}${sep?.retenue.id === b.facon?.id ? ' cn-tab-retenue' : ''}`} role="rowgroup">
            {b.facon && (
              <div className="cn-tab-facon" role="row">
                <span className="cn-sp" role="rowheader">
                  <b>{b.facon.nom}</b>
                  {prix ? <span className="cn-mono cn-mut cn-tab-etendue">{prix}</span> : <span className="cn-mut">aucun article encore</span>}
                </span>
                {pastille && <span className={`cn-pastille ${pastille.passe ? 'cn-pastille-plein' : 'cn-pastille-neutre'}`}>{pastille.texte}</span>}
              </div>
            )}
            {i === 0 && (
              <div className="cn-tab-ligne cn-tab-cols" style={gabarit} role="row">
                <span className="cn-mut cn-tab-rangart" role="columnheader">rang · article</span>
                {cols.map(c => <span key={c.cle} className="cn-mut cn-tab-num" role="columnheader" title={c.nom} aria-label={c.unite ? `${c.nom}, ${c.unite}` : c.nom}>{enteteCourt(c)}</span>)}
              </div>
            )}
            {b.lignes.map(l => {
              const a = art(l.articleId);
              /* tour 3, f7 n° 7 : la façon écartée porte déjà la raison en pastille ; son article, écarté pour la même raison, dit « écarté » seul */
              const memeRaison = !!l.ecarte && b.facon?.etat === 'ecartee' && !!b.facon.raison && sansEcarte(l.ecarte.raison) === sansEcarte(b.facon.raison);
              const sous = l.ecarte ? (memeRaison ? 'écarté' : libelleEcarte(l.ecarte.raison)) : [a?.pays, (a ? dispoDe(a) : undefined)?.replace(/\bsemaines?\b/, 'sem.'), a && convertiChf(l, taux) !== undefined ? prixOrigine(a) : l.taxe === 'ht' ? 'HT' : null].filter(Boolean).join(' · ');
              const moinsBien = l.ecarte ? null : texteMoinsBien(tableau, l);
              return (
                <button key={l.articleId} type="button" className={`cn-tab-ligne${l.ecarte ? ' cn-ecarte' : ''}`} style={gabarit} role="row" onClick={() => onOuvrir(l.articleId)}>
                  {l.rang && !l.ecarte ? <span className={`cn-rang${l.rang === 1 ? ' cn-rang-1' : ''}`}>{l.rang}</span> : <span className="cn-rang cn-rang-vide" aria-label="écarté">–</span>}
                  <VignetteObjet photo={a?.photo} mots={[a?.nom ?? l.nom, b.facon?.nom, titre]} classe="cn-vignette-petite" taille={30} />
                  <span className="cn-tab-nom" role="cell">
                    {/* tour 3, f5c n° 9 : le nom entier ; deux articles de même nom se distinguent par leur vendeur (« · Brassage Romandie ») */}
                    <span className="cn-nom-entier">{l.nom}</span>
                    <span className="cn-mut">
                      {sous}
                      {/* h05-3 : « DE · délai 2 sem. · ⊙ veille » (n° 8 : la ligne tient sur 2 lignes au plus à 390) */}
                      {veille(a) && <span className="cn-nowrap" title="veille demandée">{sous ? ' ·' : ''}<Eye size={15} aria-hidden className="cn-inline" /> veille</span>}
                      {!l.ecarte && moinsBien && <span className="cn-att">{sous || veille(a) ? ' · ' : ''}{moinsBien}</span>}
                    </span>
                  </span>
                  {cols.map((c, ci) => {
                    const brut = texteCellule(l, c);
                    const conv = c.cle === '__prix' && estEtranger(l) ? convertiChf(l, taux) : undefined;
                    const autre = c.cle === '__prix' && conv === undefined && brut && (l.devise ?? 'CHF') !== (c.unite ?? 'CHF') ? (l.devise === 'EUR' ? '€' : l.devise) : null;
                    const v = conv !== undefined ? `≈${montant(Math.round(conv / 100) * 100)}` : autre ? `${brut} ${autre}` : brut;
                    return <span key={c.cle} role="cell" data-col={ci} className={`cn-tab-num${meilleurs.get(c.cle)?.has(l.articleId) && !l.ecarte ? ' cn-meilleur' : ''}`}>{v ? <span className="cn-mono">{v}</span> : <span className="cn-inconnu" aria-label="inconnu">–</span>}</span>;
                  })}
                </button>
              );
            })}
            {/* critique 6, n° 8 (h05-3) : « ? · Lien sans aperçu · à relire · Ouvrir ↗ » dans le tableau, au pied des façons en lice,
                avant la conclusion ; jamais classé (P6) */}
            {i === enLice.length - 1 && aRelire.map(a => <LigneARelire key={a.id} article={a} />)}
          </div>
          </React.Fragment>
        );
      })}
      {enLice.length === blocs.length && conclusion}
      {enLice.length === 0 && aRelire.length > 0 && (
        <div className="cn-tab-bloc cn-tab-relire" role="rowgroup" aria-label="À relire, hors classement">
          {aRelire.map(a => <LigneARelire key={a.id} article={a} />)}
        </div>
      )}
    </div>
  );
}

/** « ? · Lien sans aperçu · ventil-express.ch · à relire · Ouvrir ↗ » : jamais classé (P6). */
export function LigneARelire({ article: a }: { article: ArticleV }) {
  const ap = sansApercu(a);
  const ou = domaineEtChemin(a as never) ?? a.domaine;
  return (
    <div className="cn-tab-ligne cn-tab-relire-ligne" role="row" data-lecture={a.lecture}>
      <span className="cn-rang cn-rang-vide" aria-label="sans rang">?</span>
      <span className="cn-vignette cn-vignette-petite cn-vignette-lien" aria-hidden><Link2 size={20} /></span>
      <span className="cn-tab-nom" role="cell">
        <span>{ap?.enCours ? ap.titre : a.lecture === 'introuvable' ? 'Lien introuvable' : 'Lien sans aperçu'}</span>
        <span className="cn-mut">{ou ? `${ou} · ` : ''}{ap?.enCours ? 'lecture…' : a.lecture === 'introuvable' ? 'ne mène plus à la fiche' : 'à relire'}</span>
      </span>
      {a.url && <a className="cn-lien cn-tab-ouvrir" href={a.url} target="_blank" rel="noreferrer noopener">Ouvrir <ExternalLink size={16} aria-hidden /></a>}
    </div>
  );
}
