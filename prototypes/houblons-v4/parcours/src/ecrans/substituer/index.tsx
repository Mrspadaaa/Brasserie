// Substituer, la porte : « Lequel à la place de Nugget ? ». Facteur libre : le remplaçant (L10) ; le moment,
// le style et la règle de dose (à IBU égal à chaud, à masse égale à froid) sont fixés. L'original est épinglé
// en colonne 1 ; les remplaçants du moteur (substitutes, « en stock d'abord ») suivent, classés, en colonnes
// qui défilent sous l'original. Chaque colonne dit, dans l'ordre du brasseur : α (lot d'abord), usage, dose à
// IBU égal (et sa plage par l'α), les arômes, ce qu'on perd et ce qu'on gagne en familles, puis ma bière après
// le remplacement, au style, sur les familles qui comptent pour ce style, et la proximité calculée.
// Toucher une colonne la choisit ; « Remplacer » l'inscrit et revient à Ma bière ; « ‹ » abandonne.
// Classes propres préfixées pq-substituer- (L26).
import { useMemo, useState } from 'react';
import { Pin } from 'lucide-react';
import { CadreOutil, COULEURS, COURT, FAMILIES, Inconnu, Legende, LigneContexte, Picto, Pont, Simule, nombre, plage, type Echelle } from '../../commun';
import { useNavigation } from '../../coquille/navigation';
import { useBrouillon, useGestes, useRecette } from '../../etat/EtatParcours';
import { quandDe, remplacer, trouver } from '../../etat/operations';
import type { AjoutParcours, RecetteParcours } from '../../etat/types';
import { houblon, ibuAjout, lireBiere, nomMoment, remplacants, style, type BiereLue, type FamilleLue, type HoublonLu } from '../../moteur';
import type { FamilyId } from '../../../../src/engine';
import { AlphaLu, Autres, StockIcone, Usage } from '../fiche/briques';
import { useFiche } from '../fiche/FicheHoublon';
import { Lentille } from '../ma-biere/Lentille';
import { noterAvant } from '../ma-biere/repere';
import './substituer.css';

/** Dose du remplaçant à IBU égal, au demi-gramme (le moteur arrondit au gramme : jusqu'à 0,65 IBU d'écart). */
export function doseExacte(recette: RecetteParcours, ajoutId: string, cle: string): { grams: number; recette: RecetteParcours } {
  const r1 = remplacer(recette, ajoutId, cle);
  const a0 = trouver(recette, ajoutId)!, a1 = trouver(r1, ajoutId)!;
  const i0 = ibuAjout(a0, recette).ibu, i1 = ibuAjout(a1, r1).ibu;
  if (!i0 || !i1 || i1.valeur <= 0 || quandDe(a0, recette).type === 'dryhop') return { grams: a1.grams, recette: r1 };
  const g = Math.round(((a1.grams * i0.valeur) / i1.valeur) * 2) / 2;
  return { grams: g, recette: { ...r1, additions: r1.additions.map((x) => (x.id === ajoutId ? { ...x, grams: g } : x)) } };
}

/** Mini barre l5b, au style (zone = moitié gauche) ou en absolu ; rond = ma bière avec l'original. */
function MiniBarre({ x, avant, echelle }: { x: FamilleLue; avant?: FamilleLue; echelle: Echelle }) {
  const haut = x.bande?.[1] ?? null;
  const pos = (v: number) => `${Math.max(0, Math.min(100, echelle === 'style' && haut ? (v / haut) * 50 : (v / 110) * 100)).toFixed(1)}%`;
  const zone = echelle === 'style' && haut ? { left: '0%', width: '50%' }
    : x.bande ? { left: pos(x.bande[0]), width: `calc(${pos(x.bande[1])} - ${pos(x.bande[0])})` } : null;
  const f = x.famille;
  if (!x.valeur) return <span data-inconnu="" title={x.raison ?? 'inconnu'} className="pq-hachure block h-2 rounded-full" />;
  return (
    <span data-barre={f} className="relative block h-2 rounded-full bg-cave-800/60">
      {zone && <i data-role="zone" className="absolute inset-y-0 rounded-full bg-cave-700/70" style={zone} />}
      <i className="absolute inset-y-0 left-0 rounded-full" style={{ width: pos(x.valeur.centre), background: x.horsStyle === 'au-dessus' ? '#c2410c' : COULEURS[f].base }} />
      {avant?.valeur && <i className="absolute top-1/2 -translate-y-1/2 -translate-x-1/2 w-2.5 h-2.5 rounded-full border-2 border-cave-50 bg-cave-900" style={{ left: pos(avant.valeur.centre) }} />}
    </span>
  );
}

const Pictos = ({ familles, attenue = false, max = 5 }: { familles: FamilyId[]; attenue?: boolean; max?: number }) => (
  <span className={`flex flex-wrap items-center gap-0.5 ${attenue ? 'opacity-60' : ''}`}>
    {familles.slice(0, max).map((f) => <span key={f} data-famille={f} className="inline-flex"><Picto famille={f} taille={15} /></span>)}
    {familles.length > max && <span className="text-xs text-cave-400">+{familles.length - max}</span>}
    {!familles.length && <span className="text-xs text-cave-400">—</span>}
  </span>
);

interface Col { cle: string; h: HoublonLu; dose: { grams: number; min: number; max: number; regle: string } | null; aromes: FamilyId[]; perd: FamilyId[]; gagne: FamilyId[]; biere: BiereLue; score: number | null; palier: string | null; composantes: { arome: number | null; huiles: number | null; amertume: number | null } | null; stock: string | null; epingle: boolean }

export default function Substituer({ houblon: cle }: { houblon: string }) {
  const b = useBrouillon()!;
  const inscrite = useRecette();
  const gestes = useGestes();
  const { revenirMaBiere } = useNavigation();
  const fiche = useFiche();
  const [echelle, setEchelle] = useState<Echelle>('style');
  const ajout: AjoutParcours | null = b.remplace ? trouver(b.recette, b.remplace.ajoutId) : null;
  const liste = useMemo(() => (ajout ? remplacants(b.recette, ajout.id, 6) : []), [b.recette, ajout]);
  const [choix, setChoix] = useState<string | null>(() => liste.find((r) => r.stock.etat === 'en stock' && r.stock.suffisant !== false)?.cle ?? liste[0]?.cle ?? null);
  const cols = useMemo<Col[]>(() => {
    if (!ajout) return [];
    const h0 = houblon(cle);
    const cites = (h: HoublonLu) => FAMILIES.filter((f) => h.familles[f].niveau !== 'non décrit').sort((p, q) => (h.familles[q].niveau === 'marqué' ? 1 : 0) - (h.familles[p].niveau === 'marqué' ? 1 : 0));
    const original: Col = { cle, h: h0, dose: { grams: ajout.grams, min: ajout.grams, max: ajout.grams, regle: 'recette' }, aromes: cites(h0), perd: [], gagne: [], biere: lireBiere(b.recette), score: null, palier: null, composantes: null, stock: null, epingle: true };
    return [original, ...liste.map((r): Col => {
      const d = doseExacte(b.recette, ajout.id, r.cle);
      return { cle: r.cle, h: r.houblon, dose: { grams: d.grams, min: r.dose.min, max: r.dose.max, regle: r.dose.regle }, aromes: cites(r.houblon), perd: r.familles.perd, gagne: r.familles.gagne,
        biere: lireBiere(d.recette), score: r.score, palier: r.palier, composantes: r.composantes, stock: r.stock.etat, epingle: false };
    })];
  }, [ajout, liste, b.recette, cle]);
  if (!ajout) return null;
  const h = houblon(cle);
  const sc = style(b.recette.styleCode);
  const q = quandDe(ajout, b.recette);
  const ibu0 = ibuAjout(ajout, b.recette).ibu;
  // Les familles qui comptent ici : celles que le style attend, puis celles hors du style dans ma bière.
  const cles = [...sc.order.filter((f) => sc.families[f].status === 'attendue'), ...FAMILIES.filter((f) => cols[0]?.biere.profil[f].horsStyle)]
    .filter((f, k, t) => t.indexOf(f) === k).slice(0, 4);
  const choisi = cols.find((c) => c.cle === choix) ?? null;
  const remplacerPar = () => {
    if (!choix) return;
    const d = doseExacte(b.recette, ajout.id, choix);
    gestes.remplacer('brouillon', ajout.id, choix);
    gestes.dose('brouillon', ajout.id, d.grams);
    noterAvant(inscrite);
    gestes.inscrire();
    revenirMaBiere();
  };
  const nbCols = cols.length;
  const grille = { gridTemplateColumns: `4.5rem 5.75rem repeat(${nbCols - 1}, 7rem)` };
  const cellule = (c: Col, contenu: React.ReactNode, k: string) => (
    <div key={c.cle + k} data-col={c.cle} onClick={c.epingle ? undefined : () => setChoix(c.cle)}
      className={`pq-substituer-cellule px-1.5 py-1 min-w-0 ${c.epingle ? 'pq-substituer-epingle' : 'cursor-pointer'} ${c.cle === choix ? 'pq-substituer-choisi' : ''}`}>
      {contenu}
    </div>
  );
  const ligne = (nom: React.ReactNode, k: string, rendu: (c: Col) => React.ReactNode, attr: Record<string, string> = {}) => (
    <div key={k} className="contents" {...attr}>
      <div className="pq-substituer-etiquette px-1 py-1 text-xs text-cave-400 flex items-center">{nom}</div>
      {cols.map((c) => cellule(c, rendu(c), k))}
    </div>
  );

  return (
    <CadreOutil ecran="substituer" question={`Lequel à la place de ${h.nom} ?`}
      contexte={<LigneContexte items={[
        { cle: 'base', contenu: `Stout ${sc.code}` },
        { cle: 'moment', contenu: `à ${nomMoment(q)}` },
        { cle: 'dose', contenu: ibu0 ? `${nombre(ibu0.valeur)} IBU égal` : 'masse égale' },
      ]} />}
      dock={<>
        {choisi && <span data-role="choix-dock" className="mr-auto text-sm text-cave-200 truncate">{choisi.dose ? `${nombre(choisi.dose.grams, 1)} g de ${choisi.h.nom}` : ''}</span>}
        <Pont nom="remplacer" disabled={!choix} onClick={remplacerPar}>Remplacer</Pont>
      </>}>
      <div className="flex items-center gap-2">
        <Legende>
          <p><b>Colonne 1</b> : {h.nom}, épinglé ; les remplaçants suivent, classés par le moteur.</p>
          <p><b>Dose</b> : à IBU égal au même moment ; dessous, la plage par l’α des fiches.</p>
          <p><b>Perd, gagne</b> : familles de {h.nom} absentes du remplaçant, et l’inverse.</p>
          <p><b>Ma bière</b> : après le remplacement, simulée (~), face à la zone du style ; le rond, avec {h.nom}.</p>
        </Legende>
        <span className="text-xs text-cave-400">toucher une colonne pour choisir</span>
        <span className="ml-auto" />
        <Lentille label="Échelle" marques="e" value={echelle} onChange={setEchelle} options={[{ value: 'style', label: 'Au style' }, { value: 'absolu', label: 'Absolu' }]} />
      </div>

      <div data-role="porte" className="pq-substituer-defile overflow-x-auto overscroll-x-contain rounded-lg border border-cave-800 bg-cave-900">
        <div data-role="remplacants" data-libre="houblon" className="grid w-max" style={grille} role="radiogroup" aria-label={`Remplaçants de ${h.nom}`}>
          {/* En-têtes : nom (appui long → fiche), choix. */}
          <div className="pq-substituer-etiquette" />
          {cols.map((c) => (
            <div key={c.cle} data-col={c.cle} {...(c.epingle ? { 'data-role': 'epingle' } : { 'data-remplacant': c.cle, role: 'radio', 'aria-checked': c.cle === choix, tabIndex: 0 })}
              {...fiche.appui(c.cle, c.epingle ? undefined : () => setChoix(c.cle))}
              onKeyDown={c.epingle ? undefined : (e) => { if (e.key === ' ' || e.key === 'Enter') { e.preventDefault(); setChoix(c.cle); } }}
              className={`pq-substituer-tete px-1.5 pt-1.5 pb-1 ${c.epingle ? 'pq-substituer-epingle' : 'cursor-pointer'} ${c.cle === choix ? 'pq-substituer-choisi' : ''}`}>
              <span className="flex items-start gap-1.5 min-w-0">
                {!c.epingle && <i aria-hidden="true" className={`mt-1 shrink-0 w-3.5 h-3.5 rounded-full border-2 ${c.cle === choix ? 'pq-substituer-radio-on bg-ebc-straw' : 'border-cave-600'}`} />}
                <span data-houblon={c.h.nom} {...fiche.nom(c.cle)} className="font-semibold text-sm leading-tight text-cave-50 break-words underline decoration-dotted decoration-cave-600 underline-offset-4">{c.h.nom}</span>
                <span className="mt-0.5"><StockIcone h={c.h} /></span>
              </span>
              {c.epingle && <span className="flex items-center gap-1 mt-0.5 text-2xs text-cave-400"><Pin className="w-3.5 h-3.5" aria-hidden="true" />épinglé</span>}
            </div>
          ))}
          {ligne('α', 'alpha', (c) => <AlphaLu h={c.h} mode="colonne" balise={c.h.nom} />)}
          {ligne('usage', 'usage', (c) => <Usage h={c.h} />)}
          {ligne('dose', 'dose', (c) => c.dose && (
            <span className="block font-mono text-sm leading-tight">
              <span data-role="dose-remplacant" data-grammes={String(c.dose.grams)} className="text-cave-50">{nombre(c.dose.grams, 1)}<span className="font-sans text-cave-400"> g</span></span>
              {!c.epingle && c.dose.min !== c.dose.max && <span className="block text-2xs text-cave-400">{plage(c.dose.min, c.dose.max, 0)}</span>}
            </span>
          ))}
          {ligne('arômes', 'aromes', (c) => (<span className="block space-y-1"><Pictos familles={c.aromes} />{c.h.partSansFamille != null && c.h.partSansFamille >= 0.25 && <Autres h={c.h} largeur={36} petit />}</span>))}
          {ligne('perd', 'perd', (c) => (c.epingle ? null : <Pictos familles={c.perd} attenue max={12} />))}
          {ligne('gagne', 'gagne', (c) => (c.epingle ? null : <Pictos familles={c.gagne} max={12} />))}
          <div className="contents">
            <div className="pq-substituer-etiquette pq-substituer-section px-1 pt-2 pb-0.5 text-xs font-semibold text-cave-200">ma bière</div>
            {cols.map((c) => <div key={c.cle + 'sec'} className={`pq-substituer-section ${c.epingle ? 'pq-substituer-epingle' : ''} ${c.cle === choix ? 'pq-substituer-choisi' : ''}`} />)}
          </div>
          {cles.map((f) => ligne(
            <span className="inline-flex items-center gap-1"><Picto famille={f} taille={14} /><span className="truncate">{COURT[f]}</span></span>,
            'f-' + f,
            (c) => {
              const x = c.biere.profil[f], a = cols[0].biere.profil[f];
              const d = x.valeur && a.valeur ? x.valeur.centre - a.valeur.centre : null;
              return (
                <span className="block space-y-0.5">
                  <MiniBarre x={x} avant={c.epingle ? undefined : a} echelle={echelle} />
                  <span className="block text-right text-2xs leading-none h-3">
                    {c.epingle ? (x.horsStyle === 'au-dessus' ? <span className="text-alert">hors style</span> : null)
                      : d == null ? <Inconnu raison={x.raison ?? 'inconnu'} /> : Math.abs(d) >= 0.5 ? <Simule valeur={d} ecart couleur={COULEURS[f].texte} /> : <span className="text-cave-400">=</span>}
                  </span>
                </span>
              );
            },
            { 'data-famille-ligne': f },
          ))}
          {ligne('proche', 'score', (c) => (c.score == null ? null : (
            <span className="flex items-center gap-1" title={c.palier ?? undefined}>
              <span className="relative block flex-1 h-1.5 rounded-full bg-cave-800"><i className="absolute inset-y-0 left-0 rounded-full bg-cave-200" style={{ width: `${Math.max(0, Math.min(100, c.score))}%` }} /></span>
              <span className="font-mono text-xs text-cave-50">{nombre(c.score)}</span>
            </span>
          )))}
          {ligne('· arôme', 'arome', (c) => (c.composantes == null ? null : c.composantes.arome == null ? <Inconnu raison="composante inconnue" /> : (<span className="flex items-center gap-1"><span className="relative block flex-1 h-1 rounded-full bg-cave-800"><i className="absolute inset-y-0 left-0 rounded-full bg-cave-400" style={{ width: `${Math.max(0, Math.min(100, c.composantes.arome))}%` }} /></span><span className="font-mono text-2xs text-cave-200">{nombre(c.composantes.arome)}</span></span>)))}
          {ligne('· huiles', 'huiles', (c) => (c.composantes == null ? null : c.composantes.huiles == null ? <Inconnu raison="composante inconnue" /> : (<span className="flex items-center gap-1"><span className="relative block flex-1 h-1 rounded-full bg-cave-800"><i className="absolute inset-y-0 left-0 rounded-full bg-cave-400" style={{ width: `${Math.max(0, Math.min(100, c.composantes.huiles))}%` }} /></span><span className="font-mono text-2xs text-cave-200">{nombre(c.composantes.huiles)}</span></span>)))}
          {ligne('· amer', 'amertume', (c) => (c.composantes == null ? null : c.composantes.amertume == null ? <Inconnu raison="composante inconnue" /> : (<span className="flex items-center gap-1"><span className="relative block flex-1 h-1 rounded-full bg-cave-800"><i className="absolute inset-y-0 left-0 rounded-full bg-cave-400" style={{ width: `${Math.max(0, Math.min(100, c.composantes.amertume))}%` }} /></span><span className="font-mono text-2xs text-cave-200">{nombre(c.composantes.amertume)}</span></span>)))}
        </div>
      </div>
      {fiche.rendu}
    </CadreOutil>
  );
}
