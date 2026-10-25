// Levure, étape 2 de Dryhopper : « Et avec quelle levure ? » (carte fils22, levure-etape ; a2b, « voir ce que la
// levure change » ; x3b réduit, « ma bière → 1 dry hop → levure »).
// Un seul facteur libre, la levure (D98) ; houblon, dose et moment (le brouillon de Dryhopper) sont fixés.
// Calcul en direct : effetLevure (lireBiere → simulerCas) pour chaque levure ; la biotransformation (géraniol →
// citronellol) se lit dans le moteur (biotransfoLevure). « Ajouter à ma bière » inscrit le brouillon ; « ‹ » revient
// à Dryhopper. Classes propres préfixées pq-lev- (L26). Place future : src/ui/hops/HopTiming.tsx (étape levure).
import { useState } from 'react';
import {
  BarreStyle, CadreOutil, COULEURS, COURT, Inconnu, JetonHoublon, Legende, LigneContexte, PiedAnnuler, Pont, Picto, nombre, signe, type Echelle,
} from '../../commun';
import { useNavigation } from '../../coquille/navigation';
import { CONDITIONS, LEVURES, nomLevure } from '../../donnees/cas';
import { useBrouillon, useGestes } from '../../etat/EtatParcours';
import { quandDe, trouver } from '../../etat/operations';
import { ecart, effetLevure, houblon, lireBiere, style, type EffetLevure } from '../../moteur';
import { biotransfoLevure, type FamilyId } from '../../../../../../src/domain/hopIndex/v4';
import { libMoment } from '../dryhopper/frise';
import { useFicheSurOutil } from '../dryhopper/fiche-sur-outil';
import './levure.css';

const ACC = '#c2410c';
const pct = (x: number) => `${nombre(x * 100)} %`;

function Val({ v, couleur }: { v: number; couleur?: string }) {
  return <span data-nature="simule" data-valeur={Math.round(v)} className="font-mono tabular-nums" style={couleur ? { color: couleur } : undefined}>{`~${signe(v)}`}</span>;
}

/** La famille qui bouge le plus (|écart| ≥ 0,5), ou null. */
function principale(e: EffetLevure, ordre: FamilyId[]): FamilyId | null {
  let top: FamilyId | null = null;
  for (const f of ordre) {
    const c = e.ecart[f]?.centre ?? 0;
    if (Math.abs(c) >= 0.5 && (!top || Math.abs(c) > Math.abs(e.ecart[top]!.centre))) top = f;
  }
  return top;
}

export default function Levure({ ajoutId }: { ajoutId: string }) {
  const b = useBrouillon()!;
  const gestes = useGestes();
  const { revenirMaBiere, retour } = useNavigation();
  const [echelle, setEchelle] = useState<Echelle>('style');
  const recette = b.recette;
  const ajout = trouver(recette, ajoutId);
  const fiche = useFicheSurOutil(ajout?.hopKey ?? '');
  if (!ajout) return null;

  const h = houblon(ajout.hopKey);
  const sc = style(recette.styleCode);
  const q = quandDe(ajout, recette);
  const actif = q.type === 'dryhop' && q.phase === 'actif';
  const choisie = recette.yeastId ?? CONDITIONS.levure;
  const ref = CONDITIONS.levure;
  // Référence : la recette avec US-05, sans l'ajout ; effetLevure pose l'ajout et change la levure.
  const base = { ...recette, yeastId: ref, additions: recette.additions.filter((a) => a.id !== ajoutId) };
  const effets = effetLevure(base, ajout, LEVURES.map((l) => l.id));
  const effet = effets.find((e) => e.levure === choisie) ?? effets[0];
  const refLu = effets.find((e) => e.levure === ref)!.lu;
  const bougent = sc.order.filter((f) => Math.abs(effet.ecart[f]?.centre ?? 0) >= 0.5)
    .sort((a, z) => Math.abs(effet.ecart[z]!.centre) - Math.abs(effet.ecart[a]!.centre));
  const top = principale(effet, sc.order);
  const bio = biotransfoLevure(choisie, actif ? 'dryActive' : 'dryPost');
  const documentee = bio.conv.centre > 0;
  const confiance = effet.lu.confiance;
  // x3b réduit : ma bière (Nugget seul), puis + Idaho 7 avec US-05, puis la levure choisie.
  const maBiere = lireBiere(base);
  const etapes = choisie === ref ? [maBiere, refLu] : [maBiere, refLu, effet.lu];
  const FX: FamilyId[] = ['floral', 'citrus', 'resin'];
  const nugget = base.additions[0] ? houblon(base.additions[0].hopKey) : null;
  // a2b : ce que le houblon apporte (Idaho 7 avec US-05, face à ta stout) et ce que la levure ajoute ; le total.
  const parHoublon = Object.fromEntries(Object.entries(ecart(maBiere.profil, refLu.profil)).map(([f, e]) => [f, e ? e.centre : null])) as Record<FamilyId, number | null>;
  const total = Object.fromEntries(Object.entries(ecart(maBiere.profil, effet.lu.profil)).map(([f, e]) => [f, e ? e.centre : null])) as Record<FamilyId, number | null>;
  const cinq = sc.order.filter((f) => total[f] != null).sort((a, z) => Math.abs(total[z]!) - Math.abs(total[a]!)).slice(0, 5);

  const tuile = (id: string, nom: string) => {
    const e = effets.find((x) => x.levure === id)!;
    const f = principale(e, sc.order);
    const doc = biotransfoLevure(id, 'dryActive').conv.centre > 0;
    const effetTxt = id === ref ? <span className="text-cave-400" aria-label="référence">=</span>
      : !actif ? <span className="text-cave-400">rien ici</span>
        : f ? <span style={{ color: COULEURS[f].texte }}><Val v={e.ecart[f]!.centre} /> {COURT[f].toLowerCase()}</span>
          : <Inconnu raison={`${nom} : biotransformation non documentée pour Idaho 7 (centre 0, convention)`}>{doc ? '~0' : '?'}</Inconnu>;
    return (
      <button key={id} type="button" role="radio" aria-checked={choisie === id} data-reglage="levure" data-levure={id}
        onClick={() => gestes.levure('brouillon', id)} className="pq-lev-tuile">
        <b>{nom}</b>
        <span className="text-xs">{effetTxt}</span>
      </button>
    );
  };

  return (
    <CadreOutil ecran="levure" question="Et avec quelle levure ?"
      contexte={<>
        <nav aria-label="Étapes de Dryhopper" className="flex items-center gap-1 text-xs">
          <button type="button" onClick={retour} className="pq-lev-etape">Quand</button>
          <span aria-current="step" className="pq-lev-etape pq-lev-etape-ici">Levure</span>
        </nav>
        <LigneContexte items={[
          { cle: 'houblon', contenu: <span {...fiche.declencheur} className="inline-flex items-center"><JetonHoublon h={h} /></span> },
          { cle: 'dose', contenu: `${nombre(ajout.grams / recette.volumeL)} g/L` },
          { cle: 'moment', contenu: libMoment(q) },
          { cle: 'base', contenu: `Stout ${sc.code}` },
        ]} />
      </>}
      dock={<PiedAnnuler><Pont nom="ajouter" onClick={() => { gestes.inscrire(); revenirMaBiere(); }}>Ajouter à ma bière</Pont></PiedAnnuler>}>
      <div role="radiogroup" aria-label="Levure" data-libre="levure" data-role="levures" className="grid grid-cols-4 gap-1">
        {LEVURES.map((l) => tuile(l.id, l.nom))}
      </div>
      <div className="flex items-center justify-between gap-2">
        <Legende>
          <p>La levure n’agit sur Idaho 7 qu’en dry hop pendant la fermentation active : elle convertit une part du géraniol (floral) en citronellol (agrumes).</p>
          <p>Barre : ta stout avec Idaho 7 et la levure choisie ; rond : ta stout avant Idaho 7. Dessous, en plein : ce qu’apporte Idaho 7 ; rayé : ce qu’ajoute la levure.</p>
          <p>~ simulé · ? non documenté, jamais 0.</p>
          <p>Taux de conversion : convention du moteur (H41, H50, H51) ; aucun taux publié en bière.</p>
        </Legende>
        <div role="radiogroup" aria-label="Lecture" data-lecture="" className="inline-flex gap-0.5 p-0.5 rounded-full bg-cave-850 border border-cave-800">
          {(['style', 'absolu'] as Echelle[]).map((e) => (
            <button key={e} type="button" role="radio" data-e={e} aria-checked={echelle === e} onClick={() => setEchelle(e)}
              className={`min-h-touch px-2.5 rounded-full text-xs ${echelle === e ? 'font-semibold' : 'text-cave-200'}`}
              style={echelle === e ? { background: 'rgb(var(--cave-50))', color: 'rgb(var(--cave-950))' } : undefined}>{e === 'style' ? 'Au style' : 'Absolu'}</button>
          ))}
        </div>
      </div>

      <section data-role="simulation" aria-label={`Ta stout avec Idaho 7 et ${nomLevure(choisie)}`} className="space-y-2 rounded-lg bg-cave-900 border border-cave-800 px-2 py-1.5">
        <p className="flex flex-wrap items-baseline gap-x-2 text-cave-50" aria-live="polite">
          <b className="font-semibold">{nomLevure(choisie)}</b>
          {choisie === ref ? null
            : !actif ? <span className="text-sm text-cave-400">rien ne change {q.type === 'dryhop' ? 'après fermentation' : 'à chaud'}</span>
              : top ? <span className="text-sm">{bougent.slice(0, 2).map((f, n) => <span key={f}>{n ? ' · ' : ''}{COURT[f].toLowerCase()} <Val v={effet.ecart[f]!.centre} couleur={COULEURS[f].texte} /></span>)}</span>
                : <span className="text-sm text-cave-400">effet non documenté pour Idaho 7</span>}
          <span className={`ml-auto text-xs px-2 rounded-full border ${confiance.niveau === 'faible' ? 'border-attention text-cave-200' : 'border-cave-700 text-cave-400'}`} title={confiance.pourquoi.join(' ; ')}>
            confiance {confiance.niveau}
          </span>
        </p>

        <div data-role="biotransformation" className="pq-lev-bio">
          <span className="inline-flex items-center gap-1 text-sm"><Picto famille="floral" taille={16} />géraniol</span>
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" className="text-cave-400"><path d="M4 12h15m-6-6 6 6-6 6" /></svg>
          <span className="inline-flex items-center gap-1 text-sm"><Picto famille="citrus" taille={16} />citronellol</span>
          <span className="pq-lev-jauge" title={bio.texteConv}>
            {actif ? <>
              <i className="pq-lev-plage" style={{ left: `${bio.conv.bas * 100}%`, width: `${(bio.conv.haut - bio.conv.bas) * 100}%` }} />
              {documentee && <i className="pq-lev-centre" style={{ left: `${bio.conv.centre * 100}%`, background: COULEURS.citrus.base }} />}
            </> : <i className="pq-lev-plage pq-hachure" style={{ left: 0, width: '100%' }} />}
          </span>
          <span className="text-xs font-mono text-right">
            {!actif ? <Inconnu raison="hors fermentation active : pas de biotransformation simulée">—</Inconnu>
              : documentee ? <span data-nature="simule">{`~${pct(bio.conv.centre)}`}</span>
                : <Inconnu raison={bio.texteConv}>?</Inconnu>}
          </span>
        </div>

        {/* Les 5 familles qui bougent (carte), au style ; sous chacune, d'où ça vient (a2b) : plein, ce que le houblon
            apporte (avec US-05) ; rayé, ce que la levure choisie ajoute ou retire. Rond : ta stout avant Idaho 7. */}
        <div className="pq-lev-familles" data-role="apports">
          {cinq.map((f) => {
            const tot = total[f], ph = parHoublon[f], pl = effet.ecart[f]?.centre ?? 0;
            const av = maBiere.profil[f].valeur!.centre;
            const pos = (v: number) => {
              const bd = maBiere.profil[f].bande;
              return Math.max(0, Math.min(100, echelle === 'style' && bd ? (v / bd[1]) * 50 : (v / 110) * 100));
            };
            const a = pos(av), b = pos(av + (ph ?? 0)), c = pos(av + (ph ?? 0) + pl);
            return (
              <div key={f} className="pq-lev-famille">
                <BarreStyle apres={effet.lu.profil[f]} avant={maBiere.profil[f]} echelle={echelle}
                  valeur={tot == null ? <Inconnu raison="ta stout avant n’est pas décrite pour cette famille" /> : <Val v={tot} couleur={effet.lu.profil[f].horsStyle ? ACC : COULEURS[f].texte} />} />
                <div className="pq-lev-sous" aria-hidden="true">
                  <span className="pq-lev-split" title={`${h.nom} : ${ph == null ? '?' : signe(ph)} ; ${nomLevure(choisie)} : ${signe(pl)}`}>
                    <i style={{ left: `${Math.min(a, b)}%`, width: `${Math.abs(b - a)}%`, background: COULEURS[f].base }} />
                    {Math.abs(c - b) > 0.2 && <i className="pq-lev-raye" style={{ left: `${Math.min(b, c)}%`, width: `${Math.abs(c - b)}%`, color: COULEURS[f].base }} />}
                  </span>
                </div>
              </div>
            );
          })}
          {!actif && <p className="text-xs text-cave-200">Après fermentation, rien ne change.</p>}
        </div>

        {/* x3b réduit : la troisième colonne (la levure) n'apparaît que si elle diffère de US-05 (sinon, la même). */}
        <div data-role="ajout" className="pq-lev-pas" style={{ gridTemplateColumns: `6rem repeat(${etapes.length}, 1fr)` }}>
          <span />
          <span className="pq-lev-col">
            {nugget && <span data-houblon={nugget.cle} className="font-semibold">{nugget.nom}</span>}
          </span>
          <span className="pq-lev-col">
            <span data-houblon={h.cle} className="font-semibold">{`+${h.nom}`}</span>
          </span>
          {etapes.length > 2 && (
            <span className="pq-lev-col">
              <span className="font-semibold">{`+${nomLevure(choisie)}`}</span>
            </span>
          )}
          {FX.map((f) => (
            <div key={f} className="contents">
              <span className="inline-flex items-center gap-1 text-sm"><Picto famille={f} taille={14} />{COURT[f]}</span>
              {etapes.map((lu, n) => {
                const v = lu.profil[f].valeur;
                const bd = lu.profil[f].bande;
                const mesure = n === 0 && lu.profil[f].source === 'dégustation';
                return (
                  <span key={n} className="pq-lev-cel">
                    <span className="pq-lev-mini">{v && <i style={{ width: `${Math.min(100, bd ? (v.centre / bd[1]) * 50 : v.centre)}%`, background: COULEURS[f].base }} />}{bd && <em />}</span>
                    {!v ? <Inconnu raison="non décrit" />
                      : mesure ? <span data-nature="mesure" data-source="dégustation du 18.10" className="font-mono">{nombre(v.centre)}<small className="text-cave-400"> goûté</small></span>
                        : <span data-nature="simule" className="font-mono">{`~${nombre(v.centre)}`}</span>}
                  </span>
                );
              })}
            </div>
          ))}
        </div>
      </section>
      {fiche.feuille}
    </CadreOutil>
  );
}
