// Paliers 5/7, la carte « Courbe d'empâtage » de la maquette r2 (choisie le 14.11, « Ça j'aime beaucoup ») : programme, total, courbe température × minutes
// à poignées ↕ ↔, « + » aux frontières, bandeau du palier touché, mash-out en fin de courbe à interrupteur. Les valeurs viennent des paliers de l'assistant
// (aucune copie) ; la bande sec ↔ rond est un repère indicatif, la FG ne dépend pas de l'empâtage (RC-8).
import React, { useEffect, useRef, useState } from 'react';
import { ChevronDown } from 'lucide-react';
import type { MashProgram } from '../../domain/brewPrograms';
import { NumberInput } from '../NumberInput';
import { declarerAjoutPalier } from './ajoutPalier';
import {
  BANDE_CORPS, G, POIGNEE_DUREE, basculerMashout, disposer, dureeDepuisX, dureeTotale, poigneeDuree, echelleTemp, insererAvant, rangFinDeCourbe, rangMashout, renommerColonne,
  reglerColonne, tempDepuisY, traceCourbe, yDeTemp, type Colonne, type EtatEmpatage,
} from './modele';

const fini = (n: unknown): n is number => typeof n === 'number' && Number.isFinite(n);
const nb = (n: number) => Number(n.toFixed(1)).toLocaleString('fr-FR');
const n2 = (v: number) => Number(v.toFixed(2));

interface Apercu { rang: number; champ: 'temp' | 'duree'; valeur: number; echelle: { min: number; max: number }; depart: number;
  /** Poignée ↔ : abscisse de départ et pixels par minute au départ (la courbe tient dans une largeur fixe : suivre la position absolue sautait au plafond près du bord). */
  x0?: number; pxParMin?: number }

export interface CourbeEmpatageProps {
  colonnes: Colonne[];
  etat: EtatEmpatage;
  onChange: (suivant: EtatEmpatage) => void;
  programmes: readonly MashProgram[];
  /** Programme dont les paliers et le rinçage sont ceux de l'assistant ; `null` : sur mesure. */
  programmeActif: string | null;
  onProgramme: (programme: MashProgram) => void;
  /** Retrait d'un palier réel (rang dans `mashSteps`), avec son annulation. */
  onRetirer: (rangReel: number) => void;
  /** Message d'un champ (`wz-mash-temp-0`…), ou rien. */
  erreur: (champ: string) => string | undefined;
  /** Désactivé pendant le verrou anti double toucher d'un retrait. */
  verrou?: boolean;
  /** « Retiré · Annuler » sous la carte. */
  avis?: React.ReactNode;
  /** « Comparer sans mash-out » (repli du plan thermique d'aujourd'hui) : possible quand le plan le juge raisonnable ; `sans` : le brasseur l'a coupé. */
  comparaison?: { possible: boolean; gainMin?: number; sans: boolean };
  /** Repère de chauffe (°C/min) du plan thermique : pendant le glissé d'une température, les montées et le total se recalculent avec lui (même formule que le plan). */
  cadence?: number;
}

export function CourbeEmpatage({ colonnes, etat, onChange, programmes, programmeActif, onProgramme, onRetirer, erreur, verrou, avis, comparaison, cadence }: CourbeEmpatageProps) {
  const [choisi, setChoisi] = useState<number | null>(null);
  // L'avis « retiré · Annuler » ne vaut que pour le geste qui le suit : tout autre geste sur la carte l'efface (annuler après un ajout rendrait un palier de trop).
  const [avisMasque, setAvisMasque] = useState(false);
  const [apercu, setApercu] = useState<Apercu | null>(null);
  const [menu, setMenu] = useState(false);
  const svgRef = useRef<SVGSVGElement>(null);
  const menuRef = useRef<HTMLDivElement>(null);
  const carteRef = useRef<HTMLElement>(null);

  // Un palier invalide est touché d'office : ses champs existent alors dans le bandeau (« Suivant » les désigne par leur identifiant).
  const invalide = colonnes.find(c => c.reel >= 0 && (erreur(`wz-mash-temp-${c.reel}`) || erreur(`wz-mash-duration-${c.reel}`)));
  useEffect(() => { if (invalide) setChoisi(invalide.rang); }, [invalide?.rang]); // eslint-disable-line react-hooks/exhaustive-deps
  useEffect(() => { if (choisi !== null && choisi >= colonnes.length) setChoisi(null); }, [colonnes.length, choisi]);
  // Fermer le palier touché : toucher hors de la carte (le même palier se referme aussi d'un second toucher), ou Échap.
  useEffect(() => {
    if (choisi === null || invalide) return;
    const dehors = (e: PointerEvent) => { if (carteRef.current && !carteRef.current.contains(e.target as Node)) setChoisi(null); };
    document.addEventListener('pointerdown', dehors);
    return () => document.removeEventListener('pointerdown', dehors);
  }, [choisi, invalide]);
  // PALIERS-EDITION-MAL (25.11) : le SVG laisse défiler la page à la verticale (`pan-y`) et `touch-action` ne vaut pas sur un `<g>` : un glissé vertical
  // de la poignée ↕ faisait défiler la page et le navigateur annulait le geste (pointercancel). Un toucher qui commence sur une poignée ne défile pas.
  useEffect(() => {
    const svg = svgRef.current;
    if (!svg) return;
    const bloquer = (e: TouchEvent) => { if ((e.target as Element | null)?.closest?.('.pal-poignee')) e.preventDefault(); };
    svg.addEventListener('touchstart', bloquer, { passive: false });
    return () => svg.removeEventListener('touchstart', bloquer);
  }, []);
  // « Sur mesure » se retrouve après un essai de programme : ses derniers paliers à lui, gardés le temps de l'écran.
  const surMesure = useRef<EtatEmpatage | null>(null);
  useEffect(() => { if (programmeActif === null && etat.steps.length) surMesure.current = etat; });
  useEffect(() => {
    if (!menu) return;
    const dehors = (e: PointerEvent) => { if (menuRef.current && !menuRef.current.contains(e.target as Node)) setMenu(false); };
    document.addEventListener('pointerdown', dehors);
    return () => document.removeEventListener('pointerdown', dehors);
  }, [menu]);

  // Pendant le glissé : colonnes, montées, total et bandeau suivent le doigt (la montée vaut l'écart de température sur la cadence du plan).
  const vues = (() => {
    if (!apercu) return colonnes;
    const v = colonnes.map(c => (c.rang === apercu.rang ? (apercu.champ === 'temp' ? { ...c, tempC: apercu.valeur } : { ...c, durationMin: apercu.valeur }) : c));
    if (apercu.champ !== 'temp' || !cadence) return v;
    return v.map((c, i) => (i > 0 && (i === apercu.rang || i === apercu.rang + 1)
      ? { ...c, rampMin: fini(c.tempC) && fini(v[i - 1].tempC) && c.tempC >= v[i - 1].tempC ? (c.tempC - v[i - 1].tempC) / cadence : undefined } : c));
  })();
  const dispo = disposer(vues);
  const echelle = apercu?.echelle ?? echelleTemp(colonnes.map(c => c.tempC));
  const trace = traceCourbe(vues, dispo, echelle);
  const total = dureeTotale(vues);
  const mo = rangMashout(colonnes);
  const finCourbe = rangFinDeCourbe(colonnes);
  const y = (t: number) => n2(yDeTemp(t, echelle));
  const grille: number[] = [];
  for (let t = echelle.min; t <= echelle.max; t += 10) grille.push(t);

  const resume = colonnes.length
    ? `Courbe : ${colonnes.map((c, i) => `${i > 0 ? (fini(c.rampMin) ? `montée d'environ ${Math.ceil(c.rampMin)} minutes, ` : 'montée à mesurer, ') : ''}${fini(c.tempC) ? `${nb(c.tempC)} °C` : 'température à renseigner'} ${fini(c.durationMin) ? `pendant ${nb(c.durationMin)} minutes` : 'durée à renseigner'}`).join(', ')}`
    : 'Courbe vide : aucun palier d’empâtage';

  const ecrire = (suivant: EtatEmpatage) => { setAvisMasque(true); onChange(suivant); };
  const ajouter = (avant: number) => { const r = insererAvant(etat, avant); ecrire(r.etat); setChoisi(r.rang); };
  // Le menu du « + » flottant ajoute un palier par ce même geste : la fonction de fin de courbe, toujours la dernière (fermeture sur l'état).
  const ajoutFin = useRef(() => {});
  ajoutFin.current = () => ajouter(finCourbe);
  useEffect(() => declarerAjoutPalier(() => ajoutFin.current()), []);
  const toucher = (rang: number) => { setAvisMasque(true); setChoisi(c => (c === rang ? null : rang)); };
  const retirer = (rangReel: number) => { setAvisMasque(false); onRetirer(rangReel); setChoisi(null); };

  /** Ordonnée / abscisse du pointeur en unités du dessin (le SVG est mis à l'échelle de sa largeur). */
  const enDessin = (e: React.PointerEvent) => {
    const r = svgRef.current!.getBoundingClientRect();
    const s = G.largeur / (r.width || G.largeur);
    return { x: (e.clientX - r.left) * s, y: (e.clientY - r.top) * s, s };
  };
  const demarrer = (rang: number, champ: Apercu['champ']) => (e: React.PointerEvent<SVGGElement>) => {
    const c = colonnes[rang];
    const depart = champ === 'temp' ? c.tempC : c.durationMin;
    if (!fini(depart)) return;
    e.currentTarget.setPointerCapture?.(e.pointerId);
    const largeur = dispo.colonnes[rang]?.w;
    setApercu({ rang, champ, valeur: depart, depart, echelle, ...(champ === 'duree' && largeur && depart > 0 ? { x0: enDessin(e).x, pxParMin: largeur / depart } : {}) });
  };
  const deplacer = (e: React.PointerEvent<SVGGElement>) => {
    if (!apercu) return;
    const p = enDessin(e);
    const valeur = apercu.champ === 'temp' ? tempDepuisY(p.y, apercu.echelle)
      : apercu.x0 !== undefined && apercu.pxParMin ? Math.min(240, Math.max(5, Math.round((apercu.depart + (p.x - apercu.x0) / apercu.pxParMin) / 5) * 5))
      : dureeDepuisX(colonnes, apercu.rang, p.x);
    if (valeur !== apercu.valeur) setApercu({ ...apercu, valeur });
  };
  const finir = (annule: boolean) => (e: React.PointerEvent<SVGGElement>) => {
    e.currentTarget.releasePointerCapture?.(e.pointerId);
    const a = apercu;
    setApercu(null);
    if (!a || annule || a.valeur === a.depart) return;
    ecrire(reglerColonne(etat, colonnes[a.rang], a.champ === 'temp' ? { tempC: a.valeur } : { durationMin: a.valeur }));
  };
  const clavier = (c: Colonne, champ: Apercu['champ']) => (e: React.KeyboardEvent) => {
    const sens = champ === 'temp' ? (e.key === 'ArrowUp' ? 1 : e.key === 'ArrowDown' ? -1 : 0) : (e.key === 'ArrowRight' ? 1 : e.key === 'ArrowLeft' ? -1 : 0);
    if (!sens) return;
    e.preventDefault();
    if (champ === 'temp') ecrire(reglerColonne(etat, c, { tempC: Math.min(100, Math.max(0, c.tempC! + sens * (e.shiftKey ? 2 : 0.5))) }));
    else ecrire(reglerColonne(etat, c, { durationMin: Math.max(0, c.durationMin! + sens * (e.shiftKey ? 10 : 5)) }));
  };

  const sel = choisi !== null ? colonnes[choisi] : undefined;
  /** La même colonne, avec la valeur du doigt pendant un glissé : le bandeau suit la bulle. */
  const selV = choisi !== null ? vues[choisi] : undefined;
  const idTemp = sel ? (sel.reel >= 0 ? `wz-mash-temp-${sel.reel}` : 'wz-mashout-temp') : undefined;
  const idDuree = sel ? (sel.reel >= 0 ? `wz-mash-duration-${sel.reel}` : 'wz-mashout-duration') : undefined;
  const errTemp = sel && sel.reel >= 0 ? erreur(`wz-mash-temp-${sel.reel}`) : undefined;
  const errDuree = sel && sel.reel >= 0 ? erreur(`wz-mash-duration-${sel.reel}`) : undefined;

  const valeurTemp = (c: Colonne, x: number, w: number) => {
    if (!fini(c.tempC)) return <text className="pal-gv" x={n2(x + w / 2)} y={n2(yDeTemp((echelle.min + echelle.max) / 2, echelle) - 8)} textAnchor="middle">— °C</text>;
    const etroit = w < 60;
    return <text className="pal-gv" x={n2(x + w / 2)} y={n2(yDeTemp(c.tempC, echelle) - (etroit ? 8 : 15))} textAnchor="middle">{nb(c.tempC)}{etroit ? '' : ' °C'}</text>;
  };

  return <section className="pal-carte" ref={carteRef} aria-label="Courbe d'empâtage" data-paliers="courbe"
    onKeyDown={e => { if (e.key === 'Escape' && choisi !== null && !menu && !invalide) { e.stopPropagation(); setChoisi(null); } }}>
    {/* Échap ferme le menu seulement : sans stopPropagation, le raccourci global de l'app quittait l'assistant (constaté en capture). */}
    <div className="pal-ch" ref={menuRef} onKeyDown={e => { if (e.key === 'Escape' && menu) { e.stopPropagation(); setMenu(false); menuRef.current?.querySelector<HTMLButtonElement>('[data-booster="programme"]')?.focus(); } }}>
      <button type="button" className="pal-prog" data-booster="programme" aria-haspopup="listbox" aria-expanded={menu} aria-label="Programme d’empâtage"
        onClick={() => setMenu(m => !m)}>
        {programmes.find(p => p.id === programmeActif)?.name ?? 'Sur mesure'}<ChevronDown size={16} aria-hidden="true" />
      </button>
      {/* Une montée à mesurer (refroidissement, cadence inconnue) n'est pas comptée : le total est un plancher, dit « ≥ ». */}
      <span className="pal-tot" data-booster="duree-totale" title={total.minutes !== undefined && !total.montees ? 'Une montée reste à mesurer : au moins ce temps' : undefined}>
        {total.minutes === undefined ? '— min' : <>{total.montees ? '≈ ' : '≥ '}<b>{total.minutes}</b> min</>}</span>
      {menu && <div className="pal-menu" role="listbox" aria-label="Programme d’empâtage">
        {(programmeActif === null || surMesure.current) && <button type="button" role="option" aria-selected={programmeActif === null} className="pal-opt" data-option="sur-mesure"
          onClick={() => { setMenu(false); setChoisi(null); if (programmeActif !== null && surMesure.current) ecrire(surMesure.current); }}>
          <b>Sur mesure</b><span>{programmeActif === null ? 'tes paliers' : `reprendre tes ${surMesure.current!.steps.length} paliers`}</span></button>}
        {programmes.map(p => <button key={p.id} type="button" role="option" aria-selected={p.id === programmeActif} className="pal-opt"
          onClick={() => { setAvisMasque(true); onProgramme(p); setMenu(false); setChoisi(null); }}>
          <b>{p.name}</b><span>{p.purpose}</span></button>)}
      </div>}
    </div>

    <svg ref={svgRef} className="pal-g" viewBox={`0 0 ${G.largeur} ${G.hauteur}`} role="group" aria-label={resume} data-booster="courbe-empatage">
      <defs><linearGradient id="pal-corps" x1="0" y1="1" x2="0" y2="0"><stop offset="0" stopColor="#F2C14E" stopOpacity=".45" /><stop offset="1" stopColor="#C87A2C" stopOpacity=".45" /></linearGradient></defs>
      {colonnes.map((c, i) => {
        const { x, w } = dispo.colonnes[i], actif = choisi === i;
        return <rect key={i} className={`pal-pal${actif ? ' pal-actif' : ''}`} x={n2(x)} y={G.y0} width={n2(w)} height={G.h} rx="10" data-hit="" data-booster="palier"
          role="button" tabIndex={0} aria-pressed={actif}
          aria-label={`Palier ${i + 1}${c.mashout ? ' (mash-out)' : ''} · ${c.nom}, ${fini(c.tempC) ? `${nb(c.tempC)} °C` : 'température à renseigner'}, ${fini(c.durationMin) ? `${nb(c.durationMin)} min` : 'durée à renseigner'}`}
          onClick={() => toucher(i)} onKeyDown={e => {
            if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); toucher(i); }
            // La maquette n'a pas de « × » : le retrait d'un palier réel (avec son « Annuler ») passe par Suppr. / Retour arrière sur sa colonne.
            else if ((e.key === 'Delete' || e.key === 'Backspace') && c.reel >= 0 && !c.mashout && !verrou) { e.preventDefault(); retirer(c.reel); }
          }} />;
      })}
      <rect x={G.x0} y={n2(yDeTemp(BANDE_CORPS.max, echelle))} width={G.w} height={n2(yDeTemp(BANDE_CORPS.min, echelle) - yDeTemp(BANDE_CORPS.max, echelle))} fill="url(#pal-corps)" />
      <g stroke="var(--pal-bord)" strokeWidth="1"><path d={grille.map(t => `M${G.x0} ${y(t)}H${G.x0 + G.w}`).join('')} /></g>
      {/* La teinte de la colonne touchée passe sous la courbe : le trait reste noir comme dans la maquette. */}
      {sel && <rect x={n2(dispo.colonnes[sel.rang].x)} y={G.y0} width={n2(dispo.colonnes[sel.rang].w)} height={G.h} rx="10" fill="var(--pal-teinte)" stroke="var(--pal-ambre)" strokeWidth="2" strokeDasharray="5 4" opacity=".55" pointerEvents="none" />}
      {dispo.pxParMin && <g stroke="var(--pal-trait)" strokeWidth="1"><path d={Array.from({ length: Math.floor(G.w / (10 * dispo.pxParMin)) + 1 }, (_, k) => `M${n2(G.x0 + k * 10 * dispo.pxParMin!)} ${G.y0 + G.h}v${k % 2 === 0 ? 6 : 4}`).join('')} /></g>}
      {/* NUIT-6 : le « + » de tête se pose au pied de l'axe ; la graduation du bas (« 50 ») lui laisse la place. */}
      {grille.filter(t => colonnes.length === 0 || y(t) < G.y0 + G.h - 14).map(t => <text key={t} x="2" y={y(t) + 4}>{t}</text>)}
      <text className="pal-gc" x="368" y={n2(yDeTemp(BANDE_CORPS.max, echelle) + 6)} textAnchor="end">rond</text>
      <text className="pal-gc" x="368" y={n2(yDeTemp(BANDE_CORPS.min, echelle) - 2)} textAnchor="end">sec</text>
      {trace.plein && <path d={trace.plein} fill="none" stroke="var(--pal-t0)" strokeWidth="3" strokeLinejoin="round" />}
      {trace.inconnus.map(u => <g key={u.rang}><path d={`M${n2(u.x1)} ${n2(yDeTemp((echelle.min + echelle.max) / 2, echelle))}H${n2(u.x2)}`} stroke="var(--pal-trait)" strokeWidth="2" strokeDasharray="3 4" /></g>)}
      {dispo.montees.map(m => {
        const a = vues[m.rang - 1], b = vues[m.rang];
        if (!fini(a.tempC) || !fini(b.tempC)) return null;
        return <g key={m.rang}>
          <path d={`M${n2(m.x)} ${y(a.tempC)}L${n2(m.x + m.w)} ${y(b.tempC)}`} fill="none" stroke="var(--pal-page)" strokeWidth="1.5" strokeDasharray="3 4" />
          <circle cx={n2(m.x)} cy={y(a.tempC)} r="4" fill="var(--pal-t0)" /><circle cx={n2(m.x + m.w)} cy={y(b.tempC)} r="4" fill="var(--pal-t0)" />
        </g>;
      })}
      {vues.map((c, i) => (choisi === i && fini(c.tempC) ? null : <React.Fragment key={i}>{valeurTemp(c, dispo.colonnes[i].x, dispo.colonnes[i].w)}</React.Fragment>))}
      {/* Maquette : la colonne touchée n'a plus son « 60′ » (le bandeau le dit). Seule sur l'axe, elle le garde : sinon le premier palier posé n'a aucune durée sous lui. */}
      {vues.map((c, i) => (choisi === i && colonnes.length > 1 && fini(c.durationMin) ? null : <text key={`d${i}`} x={n2(dispo.colonnes[i].x + dispo.colonnes[i].w / 2)} y="272" textAnchor="middle">{fini(c.durationMin) ? `${nb(c.durationMin)}′` : '—′'}</text>))}
      {/* NUIT-6 : une montée étroite écrivait « ≈10′ » collé au « 10′ » de sa voisine ; elle se tait quand les deux textes se toucheraient (≈ 7 px par signe, 8 px d’air). */}
      {dispo.montees.map(m => {
        const texte = fini(vues[m.rang].rampMin) ? `≈${Math.ceil(vues[m.rang].rampMin!)}′` : '?′', mx = m.x + m.w / 2;
        const voisines = [m.rang - 1, m.rang].filter(i => i >= 0 && i < vues.length && !(choisi === i && colonnes.length > 1 && fini(vues[i].durationMin)));
        const serre = voisines.some(i => { const c = dispo.colonnes[i], t = fini(vues[i].durationMin) ? `${nb(vues[i].durationMin)}′` : '—′'; return Math.abs(c.x + c.w / 2 - mx) < (texte.length + t.length) * 3.6 + 8; });
        return serre ? null : <text key={`m${m.rang}`} x={n2(mx)} y="272" textAnchor="middle">{texte}</text>;
      })}

      {colonnes.length === 0 && <text className="pal-gv" x={G.x0 + G.w / 2} y={n2(yDeTemp((echelle.min + echelle.max) / 2, echelle) - 8)} textAnchor="middle">— °C</text>}
      {colonnes.length === 0 && <path d={`M${G.x0} ${n2(yDeTemp((echelle.min + echelle.max) / 2, echelle))}H${G.x0 + G.w}`} stroke="var(--pal-trait)" strokeWidth="2" strokeDasharray="3 4" />}

      {/* La frontière qui précède le mash-out poserait le même palier que le « + » de fin de courbe : la maquette n'en montre qu'un. */}
      {dispo.montees.filter(m => !colonnes[m.rang].mashout).map(m => <g key={`p${m.rang}`} className="pal-plus" data-hit="" role="button" tabIndex={0} data-frontiere={m.rang}
        aria-label={`Ajouter un palier entre ${colonnes[m.rang - 1].nom} et ${colonnes[m.rang].nom}`}
        onClick={() => ajouter(m.rang)} onKeyDown={e => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); ajouter(m.rang); } }}>
        <circle cx={n2(m.x + m.w / 2)} cy={G.y0 + G.h} r="16" className="pal-plus-zone" /><circle cx={n2(m.x + m.w / 2)} cy={G.y0 + G.h} r="12" /><path d={`M${n2(m.x + m.w / 2)} ${G.y0 + G.h - 6}v12M${n2(m.x + m.w / 2 - 6)} ${G.y0 + G.h}h12`} />
      </g>)}
      {/* PALIERS-EDITION-MAL : la tête de courbe est une frontière aussi (un repos protéique se pose AVANT la saccharification). */}
      {colonnes.length > 0 && <g className="pal-plus" data-hit="" role="button" tabIndex={0} data-frontiere="0" aria-label={`Ajouter un palier avant ${colonnes[0].nom}`}
        onClick={() => ajouter(0)} onKeyDown={e => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); ajouter(0); } }}>
        <circle cx={G.x0} cy={G.y0 + G.h} r="16" className="pal-plus-zone" /><circle cx={G.x0} cy={G.y0 + G.h} r="12" /><path d={`M${G.x0} ${G.y0 + G.h - 6}v12M${G.x0 - 6} ${G.y0 + G.h}h12`} />
      </g>}
      <g className="pal-plus" data-hit="" role="button" tabIndex={0} data-booster="ajout-frontiere" data-frontiere="fin" aria-label="Ajouter un palier"
        onClick={() => ajouter(finCourbe)} onKeyDown={e => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); ajouter(finCourbe); } }}>
        <circle cx="352" cy={G.y0 + G.h} r="16" className="pal-plus-zone" /><circle cx="352" cy={G.y0 + G.h} r="12" /><path d={`M352 ${G.y0 + G.h - 6}v12M346 ${G.y0 + G.h}h12`} />
      </g>

      {sel && (() => {
        // La poignée ↔ est posée sur le bord droit de la colonne, dans la courbe (PALIERS-EDITION-MAL) : loin des étiquettes de l'axe et des « + ».
        const v = vues[sel.rang], { x, w } = dispo.colonnes[sel.rang], cx = x + w / 2;
        const { cx: fin, y: yD } = poigneeDuree(x, w), yM = yD + POIGNEE_DUREE.h / 2;
        return <>
          {fini(v.tempC) && <>
            <path d={`M${G.x0} ${y(v.tempC)}H${n2(cx)}`} stroke="var(--pal-ambre)" strokeWidth="1.5" strokeDasharray="4 3" />
            <g data-hit="" className="pal-poignee" data-booster="poignee-temperature" role="slider" tabIndex={0} aria-orientation="vertical"
              aria-label={`Température du palier ${sel.rang + 1} — ${sel.nom}`} aria-valuemin={echelle.min} aria-valuemax={echelle.max} aria-valuenow={v.tempC} aria-valuetext={`${nb(v.tempC)} °C`}
              onPointerDown={demarrer(sel.rang, 'temp')} onPointerMove={deplacer} onPointerUp={finir(false)} onPointerCancel={finir(true)} onKeyDown={clavier(sel, 'temp')}>
              <rect x={n2(cx - 18)} y={n2(y(v.tempC) - 18.5)} width="36" height="37" rx="18" fill="var(--pal-t0)" stroke="var(--pal-blanc)" strokeWidth="3" />
              <path d={`M${n2(cx)} ${n2(y(v.tempC) - 12)}v23M${n2(cx - 5)} ${n2(y(v.tempC) - 7)}l5-5 5 5M${n2(cx - 5)} ${n2(y(v.tempC) + 6)}l5 5 5-5`} fill="none" stroke="var(--pal-sur0)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
              {apercu?.champ === 'temp' && <text className="pal-gv pal-bulle" x={n2(cx)} y={n2(y(v.tempC) - 24)} textAnchor="middle">{nb(v.tempC)} °C</text>}
            </g></>}
          {fini(v.durationMin) &&
            <g data-hit="" className="pal-poignee" data-booster="poignee-duree" role="slider" tabIndex={0} aria-orientation="horizontal"
              aria-label={`Durée du palier ${sel.rang + 1} — ${sel.nom}`} aria-valuemin={0} aria-valuemax={240} aria-valuenow={v.durationMin} aria-valuetext={`${nb(v.durationMin)} min`}
              onPointerDown={demarrer(sel.rang, 'duree')} onPointerMove={deplacer} onPointerUp={finir(false)} onPointerCancel={finir(true)} onKeyDown={clavier(sel, 'duree')}>
              <rect x={n2(fin - POIGNEE_DUREE.w / 2)} y={yD} width={POIGNEE_DUREE.w} height={POIGNEE_DUREE.h} rx="12" fill="var(--pal-ambre)" stroke="var(--pal-blanc)" strokeWidth="2" />
              <path d={`M${n2(fin - 12)} ${yM}h24M${n2(fin - 7)} ${yM - 5}l-5 5 5 5M${n2(fin + 7)} ${yM - 5}l5 5-5 5`} fill="none" stroke="#fff" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
              {apercu?.champ === 'duree' && <text className="pal-gv pal-bulle" x={n2(fin)} y={yD - 6} textAnchor="middle">{nb(v.durationMin)}′</text>}
            </g>}
        </>;
      })()}
    </svg>

    {sel && selV && <div className="pal-reg" data-element="r2-reglage" role="group" aria-label={`Palier ${sel.rang + 1}`}>
      {sel.reel >= 0
        ? <input className="pal-nom" aria-label={`Nom du palier ${sel.reel + 1}`} name={`mash_step_name_${sel.reel}`} value={sel.nom} onChange={e => ecrire(renommerColonne(etat, sel, e.target.value))} />
        : <b className="pal-nom">{sel.nom}</b>}
      <NumberInput id={idTemp} className="pal-in" aria-label={sel.reel >= 0 ? `Température du palier ${sel.reel + 1}${sel.nom ? ` — ${sel.nom}` : ''}, en degrés` : `Température du ${sel.nom}, en degrés`}
        value={selV.tempC} min={0} max={100} emptyValue={Number.NaN} required aria-invalid={!!errTemp} aria-describedby={errTemp ? 'wz-validation' : undefined} pad
        onValue={(v: number) => ecrire(reglerColonne(etat, sel, { tempC: v }))} />
      <span className="pal-u">°C</span>
      <NumberInput id={idDuree} className="pal-in" aria-label={sel.reel >= 0 ? `Durée du palier ${sel.reel + 1}${sel.nom ? ` — ${sel.nom}` : ''}, en minutes` : `Durée du ${sel.nom}, en minutes`}
        value={selV.durationMin} min={0} emptyValue={Number.NaN} integer required aria-invalid={!!errDuree} aria-describedby={errDuree ? 'wz-validation' : undefined} pad
        onValue={(v: number) => ecrire(reglerColonne(etat, sel, { durationMin: v }))} />
      <span className="pal-u">min</span>
      {/* 14.11 « régression d'action » : retirer un palier reste au toucher (la maquette r2 ne le dessine pas, l'action d'aujourd'hui demeure). */}
      {sel.reel >= 0 && !sel.mashout && !verrou && <button type="button" className="pal-retirer" aria-label={`Retirer le palier ${sel.reel + 1}${sel.nom ? ` — ${sel.nom}` : ''}`}
        onClick={() => retirer(sel.reel)}>×</button>}
    </div>}
    {(errTemp || errDuree) && <p className="pal-err" role="alert">{errTemp ?? errDuree}</p>}

    <div className="pal-mo"><b>Mash-out</b><span>fin de courbe</span>
      <button type="button" className="pal-tg" role="switch" aria-checked={mo >= 0} aria-label="Mash-out" data-booster="mash-out"
        onClick={() => { ecrire(basculerMashout(etat, colonnes, mo < 0)); if (mo >= 0) setChoisi(c => (c === mo ? null : c)); }} />
    </div>
    {comparaison?.possible && mo >= 0 && <details className="pal-cmp"><summary>Comparer sans mash-out</summary>
      <p>{comparaison.gainMin != null ? `Filtration possible ≈ ${Math.ceil(comparaison.gainMin)} min plus tôt selon ce repère. ` : ''}La chauffe vers l’ébullition reste nécessaire : ce n’est pas un gain garanti sur toute la journée.</p>
      <p>À envisager avec conversion terminée et filtration fluide. Le traitement thermique change ; son effet sur la bière n’est pas chiffré.</p>
      <a href="https://howtobrew.com/section-3/chapter-17/" target="_blank" rel="noreferrer">Repères de Palmer</a>
      <button type="button" onClick={() => ecrire(basculerMashout(etat, colonnes, false))}>Choisir le programme sans mash-out</button>
    </details>}
    {comparaison?.sans && mo < 0 && <p className="pal-cmp-sans">Programme sans mash-out choisi.
      <button type="button" onClick={() => ecrire(basculerMashout(etat, colonnes, true))}>Rétablir le mash-out</button></p>}
    {!avisMasque && avis}
  </section>;
}
