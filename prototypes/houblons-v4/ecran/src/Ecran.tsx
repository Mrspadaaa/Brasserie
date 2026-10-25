// Page d'essai de l'ossature (étape 7) : en-tête de recette, houblons de la recette avec leur
// IBU calculé en direct, ajouts en un toucher, lentille Barres / Radar, panneau d'analyse.
// Conventions des contrôles : data-role (BRIEF-AUTEUR, controle-recette.mjs) et data-booster
// (jouer-boosters.mjs) sur l'élément qu'on touche.
import { useLayoutEffect, useRef, useState } from 'react';
import { AnimatePresence, motion } from 'motion/react';
import { Minus, Plus } from 'lucide-react';
import { SegmentedControl } from '@app/ui/SegmentedControl';
import { RecipeDisclosure } from '@app/ui/RecipeDisclosure';
import type { Addition, FamilyId } from '../../../../src/domain/hopIndex/v4';
import {
  AJOUTS_RAPIDES, DIRECTION_B, RECETTE, STYLE, ibuAjout, ibuRecette, nombre, nomHoublon,
  quandCourt, quandLong, quandSuivant, typeAjout, typeSuivant,
} from './donnees';
import { Barres, Radar, type Cibles, type LentilleId } from './Lentilles';

/** a : étape Houblons ; b : panneau ouvert après « + floral, − résineux » ; radar : idem, lentille Radar. */
export type Etat = 'a' | 'b' | 'radar';
const PAS_G = 5;

export function Ecran({ etat }: { etat: Etat }) {
  const [ajouts, setAjouts] = useState<Addition[]>(RECETTE.additions);
  const [lentille, setLentille] = useState<LentilleId>(etat === 'radar' ? 'radar' : 'barres');
  const [direction, setDirection] = useState<Set<FamilyId>>(() => new Set(etat === 'a' ? [] : DIRECTION_B.map((d) => d.family)));
  const recette = { ...RECETTE, additions: ajouts };
  const total = ibuRecette(recette);
  const bandeIbu = STYLE.ibu;
  const horsStyle = bandeIbu && total.valeur != null
    ? total.valeur < bandeIbu[0] ? 'sous le style' : total.valeur > bandeIbu[1] ? 'au-dessus du style' : null
    : null;
  const cibles: Cibles = Object.fromEntries(
    DIRECTION_B.filter((d) => direction.has(d.family) && d.targetAbsolute != null).map((d) => [d.family, d.targetAbsolute!]),
  );
  const proposes = AJOUTS_RAPIDES.filter((q) => !ajouts.some((a) => a.hopKey === q.key));

  const maj = (id: string, change: Partial<Addition>) => setAjouts((l) => l.map((a) => (a.id === id ? { ...a, ...change } : a)));
  const ajouter = (q: (typeof AJOUTS_RAPIDES)[number]) =>
    setAjouts((l) => [...l, { id: `q-${q.key}`, hopKey: q.key, moment: q.moment, grams: q.dose.grams }]);

  // Le booster « lentille radar » est l'option non cochée (celle qu'un toucher active) ;
  // SegmentedControl vient de l'app et ne reçoit pas d'attribut par option.
  const lentilleRef = useRef<HTMLDivElement>(null);
  useLayoutEffect(() => {
    lentilleRef.current?.querySelectorAll('[role="radio"]').forEach((b) => {
      if (b.getAttribute('aria-checked') === 'false') b.setAttribute('data-booster', 'lentille radar');
      else b.removeAttribute('data-booster');
    });
  }, [lentille]);
  // États B et radar : le panneau (RecipeDisclosure de l'app, <details>) est ouvert au chargement.
  const panneauRef = useRef<HTMLDivElement>(null);
  useLayoutEffect(() => {
    const d = panneauRef.current?.querySelector('details');
    if (d && etat !== 'a') d.open = true;
  }, [etat]);

  return (
    <main className="mx-auto max-w-[30rem] px-2 pt-2 pb-6 space-y-3">
      <header data-role="en-tete" className="flex items-start justify-between gap-2">
        <div className="min-w-0">
          <h1 className="text-[1.125rem] leading-tight font-semibold text-cave-50 truncate">{RECETTE.name}</h1>
          <p className="text-2xs text-cave-400 truncate">
            {STYLE.code} {STYLE.name} · <span className="font-mono">{nombre(RECETTE.volumeL)}</span> L ·
            OG <span className="font-mono">{nombre(RECETTE.og, 3)}</span>
          </p>
        </div>
        <p className="shrink-0 text-right leading-tight">
          <output aria-live="polite" className="reading text-[1.125rem]">{total.texte}</output>{' '}
          <span className="reading-unit">IBU</span>
          <span className="block text-2xs text-cave-400">
            {horsStyle ? <span className="text-attention font-semibold">{horsStyle}</span> : bandeIbu ? <>style <span className="font-mono">{bandeIbu[0]}–{bandeIbu[1]}</span></> : null}
          </span>
        </p>
      </header>

      <section aria-labelledby="titre-houblons" className="space-y-1.5">
        <h2 id="titre-houblons" className="text-sm font-semibold text-cave-50">Houblons</h2>
        <ul data-role="houblons-recette" className="panel divide-y divide-cave-800">
          {ajouts.map((a) => {
            const ibu = ibuAjout(a, recette);
            const nom = nomHoublon(a.hopKey);
            return (
              <li key={a.id} data-role="ligne-houblon" className="px-2 py-1.5 space-y-1">
                <div className="flex items-baseline justify-between gap-2">
                  <span className="text-sm font-semibold text-cave-50 truncate">{nom}</span>
                  <span className="shrink-0 text-sm text-cave-200" title={ibu.long}>
                    <output aria-live="polite" className="font-mono text-cave-50">{ibu.texte}</output> IBU
                  </span>
                </div>
                <div className="flex items-center gap-1.5">
                  <button type="button" data-role="type-ajout" data-booster="type d'ajout"
                    aria-label={`Type d’ajout : ${typeAjout(a.moment)}, toucher pour passer au suivant`}
                    onClick={() => maj(a.id, { moment: typeSuivant(a.moment) })}
                    className="min-h-touch px-2 rounded-control border border-cave-700 bg-cave-850 text-2xs text-cave-200">
                    {typeAjout(a.moment)}
                  </button>
                  <button type="button" data-role="quand" data-booster="moment"
                    aria-label={`Moment : ${quandLong(a.moment)}, toucher pour passer au suivant`}
                    onClick={() => maj(a.id, { moment: quandSuivant(a.moment) })}
                    className="min-h-touch min-w-touch px-2 rounded-control border border-cave-700 bg-cave-850 text-2xs font-mono text-cave-200">
                    {quandCourt(a.moment, recette)}
                  </button>
                  <span className="ml-auto flex items-center gap-0.5">
                    <button type="button" aria-label={`Retirer ${PAS_G} g de ${nom}`} disabled={a.grams <= PAS_G}
                      onClick={() => maj(a.id, { grams: a.grams - PAS_G })}
                      className="touch-target rounded-control text-cave-200 disabled:opacity-40">
                      <Minus className="w-4 h-4" aria-hidden="true" />
                    </button>
                    <span className="min-w-[3.25rem] text-center text-sm">
                      <output aria-live="polite" className="font-mono text-cave-50">{nombre(a.grams)}</output> <span className="text-cave-400">g</span>
                    </span>
                    <button type="button" data-booster="dose" aria-label={`Ajouter ${PAS_G} g de ${nom}`}
                      onClick={() => maj(a.id, { grams: a.grams + PAS_G })}
                      className="touch-target rounded-control text-cave-200">
                      <Plus className="w-4 h-4" aria-hidden="true" />
                    </button>
                  </span>
                </div>
              </li>
            );
          })}
        </ul>
        {proposes.length > 0 && (
          <div role="group" aria-label="Ajouter en un toucher" className="flex gap-1.5 overflow-x-auto scrollbar-none">
            {proposes.map((q, i) => {
              const ibu = ibuAjout({ id: 'essai', hopKey: q.key, moment: q.moment, grams: q.dose.grams }, recette);
              return (
                <button key={q.key} type="button" data-role="ajout-rapide" {...(i === 0 ? { 'data-booster': 'ajout rapide' } : {})}
                  onClick={() => ajouter(q)}
                  aria-label={`Ajouter ${q.name}, ${quandLong(q.moment)}, ${q.dose.grams} g, plus ${ibu.long}`}
                  className="shrink-0 min-h-touch px-2 rounded-control border border-cave-700 bg-cave-900 text-2xs text-cave-200 whitespace-nowrap">
                  <span className="font-semibold text-cave-50">+ {q.name}</span>{' '}
                  <span className="font-mono">{quandCourt(q.moment, recette)}</span> · <span className="font-mono">{q.dose.grams}</span> g ·
                  +<span className="font-mono">{ibu.texte}</span> IBU
                </button>
              );
            })}
          </div>
        )}
      </section>

      <section data-role="lecture-style" aria-labelledby="titre-style" className="panel p-2 space-y-2">
        <div className="flex items-center justify-between gap-2">
          <h2 id="titre-style" className="text-sm font-semibold text-cave-50 truncate">Au style {STYLE.code}</h2>
          <div ref={lentilleRef} className="w-44 shrink-0">
            <SegmentedControl label="Lentille" value={lentille} onChange={setLentille}
              options={[{ value: 'barres', label: 'Barres' }, { value: 'radar', label: 'Radar' }]} />
          </div>
        </div>
        <AnimatePresence mode="wait" initial={false}>
          <motion.div key={lentille} initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.15 }}>
            {lentille === 'barres' ? <Barres style={STYLE} cibles={cibles} /> : <Radar style={STYLE} cibles={cibles} />}
          </motion.div>
        </AnimatePresence>
      </section>

      <div ref={panneauRef} data-role="panneau">
        <RecipeDisclosure title="Direction et voies" deferContent>
          <div role="group" aria-label="Direction" className="flex flex-wrap gap-1.5">
            {DIRECTION_B.map((d, i) => {
              const actif = direction.has(d.family);
              return (
                <button key={d.family} type="button" aria-pressed={actif} {...(i === 0 ? { 'data-booster': 'direction' } : {})}
                  onClick={() => setDirection((s) => { const n = new Set(s); if (actif) n.delete(d.family); else n.add(d.family); return n; })}
                  className={`min-h-touch px-2 rounded-control border text-2xs ${actif ? 'border-repere text-cave-50 font-semibold bg-cave-850' : 'border-cave-700 text-cave-200'}`}>
                  {d.crans > 0 ? '+' : '−'} {d.name}
                  {actif && d.targetAbsolute != null && <span className="font-mono text-repere"> → {nombre(d.targetAbsolute)}</span>}
                </button>
              );
            })}
          </div>
        </RecipeDisclosure>
      </div>
    </main>
  );
}
