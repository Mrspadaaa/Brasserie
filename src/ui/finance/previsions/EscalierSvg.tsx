import React, { useEffect, useId, useMemo, useState } from 'react';
import type { ForecastItem } from '../../../domain/finance/forecast';
import { graduations, groupesRecurrents, joursEntre, motEtiquette, nomProjet, type Escalier as EscalierDonnees, type GroupeRecurrent } from './escalier';
import { mesurerTexte, obstaclesDeCourbe, oublierMesures, placerEtiquettes, pointDAccroche, type Demande, type Mesure, type Rect } from './placement';
import { jourCourt, montant, montantCourt, montantEntier, montantSigne, moisCourt } from './format';

/** Style d'une étiquette, par source (D8) : seule la facture est neutre pleine ; plan, récurrent, tendance, projet non testé = pointillé bleu « Prévu ». */
export type StyleEtiquette = 'facture' | 'prevu' | 'brassin' | 'projet' | 'entree';
export const styleDe = (item: ForecastItem, testeId?: string | null): StyleEtiquette =>
  item.direction === 'in' ? 'entree' : item.source === 'invoice' ? 'facture' : item.source === 'brew' ? 'brassin' : item.source === 'equipment' && testeId && item.planId === testeId ? 'projet' : 'prevu';

const G = 48, D = 8, H = 16, B = 30;
/** Hauteur du dessin selon le nombre de marches : une seule marche ne mérite pas 500 px de vide (revue du 10.11, « un graphe vide sur 80 % de sa hauteur ») ; 4 marches et plus : 500, comme p5b. */
export const hauteurEscalier = (marches: number) => Math.min(500, 280 + 55 * marches);
/** Le nom entier d'une sortie (fiche, liste, aria-label) ; l'étiquette dessinée, elle, n'en garde que le mot-clé. */
export const nomLong = (item: ForecastItem) => {
  if (item.source === 'trend') return 'dépenses courantes';
  if (item.source === 'brew') { const p = item.label.split(' · '); return `${p[0]} · ${p[1] ?? ''}`.trim(); }
  return item.label.split(' · ')[0];
};
/** Texte complet, lu par les lecteurs d'écran : « Frigo −3 000,00, 15.11 ». */
export const libelleLong = (item: ForecastItem) => `${nomLong(item)} ${item.direction === 'out' ? montant(-item.amountCents) : montantSigne(item.amountCents)}, ${jourCourt(item.date)}`;
/**
 * Texte dessiné (test d'écran P5B, constat 1) : mot-clé + montant entier + jour, une ligne, comme p5b (« loyer −400, 25.11 »).
 * « ~ » devant le jour : date estimée ; « ≥ » devant le montant : montant partiel, AU MOINS ce montant (le « ≥ » de Prix et d'Argent ; revue du 10.11 : le « + » final n'était pas compris ; le détail est dans la fiche).
 * Une récurrence regroupée : « loyer −400 (9 fois), le 25 ».
 */
export const montantEtiquette = (item: ForecastItem) => item.partial?.length
  ? `≥ ${montantCourt(item.amountCents)}` : item.direction === 'out' ? montantCourt(-item.amountCents) : `+${montantCourt(item.amountCents)}`;
export const texteEtiquette = (item: ForecastItem, groupe?: GroupeRecurrent) => {
  const mot = motEtiquette(item);
  const m = montantEtiquette(item);
  if (groupe) return `${mot} ${m} (${groupe.n} fois)${groupe.jour ? `, le ${groupe.jour}` : ''}`;
  return `${mot} ${m}, ${item.label.includes('date estimée') ? '~' : ''}${jourCourt(item.date)}`;
};
/**
 * Plusieurs sorties le MÊME jour sont une seule marche : une seule étiquette (p5b ; revue du 10.11, « deux sorties du même jour = une marche, une étiquette »).
 * Même mot : « achats (2 fois) au moins 67, 10.11 » ; mots différents : « 3 sorties −5 765, 10.11 ». Le total est la somme ; il est un « au moins » dès qu'une sortie est partielle.
 * En mots, sans « ×2 » ni « ≥ » (critique k2, 20.11, point 28) : le lot est une bulle à part, elle se lit à voix haute ; le « ≥ » d'une sortie seule reste (acquis de la revue du 10.11).
 */
export const texteLot = (items: ForecastItem[]) => {
  const total = items.reduce((s, i) => s + i.amountCents, 0), partiel = items.some(i => i.partial?.length);
  const mots = [...new Set(items.map(motEtiquette))];
  const m = partiel ? `au moins ${montantCourt(total)}` : montantCourt(-total);
  return mots.length === 1 ? `${mots[0]} (${items.length} fois) ${m}, ${jourCourt(items[0].date)}` : `${items.length} sorties ${m}, ${jourCourt(items[0].date)}`;
};
/** Les sorties d'une marche qui partagent son étiquette : au moins deux, hors projet testé (qui garde sa fiche) et hors récurrence déjà regroupée. */
export const sortiesDuLot = (items: ForecastItem[], testeId: string | null | undefined, groupes: Map<string, GroupeRecurrent>): ForecastItem[] => {
  const l = items.filter(i => i.direction === 'out' && !groupes.has(i.id) && styleDe(i, testeId) !== 'projet');
  return l.length >= 2 ? l : [];
};

interface Props { e: EscalierDonnees; fantome?: EscalierDonnees | null; nomFantome?: string; largeur: number; testeId?: string | null; sousLignes?: Record<string, string>; asOf: string;
  onEtiquette: (item: ForecastItem) => void; onRestes: (ids: string[]) => void;
  /** Toucher l'étiquette d'un lot de sorties du même jour : la liste des sorties (chaque sortie y a sa ligne). Sans lui : la première sortie du lot. */
  onLot?: (items: ForecastItem[]) => void;
  /** Mesure de texte du placement (largeur en px) ; par défaut, celle du navigateur. Les tests en passent une plus large pour jouer une autre police. */
  mesure?: Mesure }

export function EscalierSvg({ e, fantome, nomFantome, largeur, testeId, sousLignes = {}, asOf, onEtiquette, onRestes, onLot, mesure }: Props) {
  const uid = useId().replace(/:/g, '');
  // Largeur des textes : mesurée par le navigateur avec la police de l'app (T3B-10) ; une police web qui arrive après coup relance le placement.
  const [policeVue, setPoliceVue] = useState(0);
  useEffect(() => {
    const f = typeof document !== 'undefined' ? document.fonts : undefined;
    if (!f || f.status === 'loaded') return;
    let vivant = true;
    f.ready.then(() => { if (vivant) { oublierMesures(); setPoliceVue(v => v + 1); } }).catch(() => {});
    return () => { vivant = false; };
  }, []);
  const pileSans = (typeof document !== 'undefined' && getComputedStyle(document.body).fontFamily) || 'sans-serif';
  const lt: Mesure = useMemo(() => mesure ?? ((t, c, m, g) => mesurerTexte(t, c, m, g, pileSans)), [mesure, pileSans, policeVue]); // eslint-disable-line react-hooks/exhaustive-deps
  const HT = hauteurEscalier(Math.max(e.marches.length, fantome?.marches.length ?? 0));
  const vue = useMemo(() => {
    const W = Math.max(280, Math.round(largeur)), connu = e.departCents !== null;
    const val = (m: { soldeApresCents: number | null; ecartCents: number }) => (connu ? m.soldeApresCents! : m.ecartCents);
    const depart = connu ? e.departCents! : 0;
    const g = graduations(Math.min(e.min, fantome?.min ?? e.min), Math.max(e.max, fantome?.max ?? e.max));
    const bas = H + 0, haut = HT - B;
    const y = (v: number) => H + (g.haut - v) / (g.haut - g.bas) * (haut - H);
    const totalJ = joursEntre(e.debut, e.fin) + 1, xFin = W - D;
    const x = (d: string) => G + joursEntre(e.debut, d) / totalJ * (xFin - G);
    const chemin = (s: EscalierDonnees) => {
      const dep = s.departCents === null ? 0 : s.departCents;
      let p = `M${G} ${y(dep).toFixed(1)}`;
      for (const m of s.marches) p += ` H${x(m.date).toFixed(1)} V${y(s.departCents === null ? m.ecartCents : m.soldeApresCents!).toFixed(1)}`;
      return `${p} H${xFin}`;
    };
    // mois : séparateurs aux 1er, noms au milieu de chaque mois
    const mois: Array<{ x: number; nom: string; sep: number | null }> = [];
    let courant = e.debut, prochain = '';
    while (courant <= e.fin) {
      const d = new Date(`${courant.slice(0, 7)}-01T12:00:00Z`); d.setUTCMonth(d.getUTCMonth() + 1); prochain = d.toISOString().slice(0, 10);
      const finMois = prochain <= e.fin ? prochain : null, x0 = x(courant), x1 = finMois ? x(finMois) : xFin;
      if (x1 - x0 > 8) mois.push({ x: (x0 + x1) / 2, nom: moisCourt(courant), sep: finMois ? x1 : null }); else if (finMois) mois.push({ x: -1, nom: '', sep: x1 });
      courant = prochain;
    }
    // un nom de mois n'est dessiné que s'il tient dans la place laissée par le précédent (largeur mesurée, 6 px d'air) : « déc. janv. » ne se touchent plus (critique k2, point 27)
    let bord = -Infinity;
    for (const m of mois) {
      if (!m.nom) continue;
      const w = lt(m.nom, 12, false, 600);
      if (m.x - w / 2 < bord + 6 || m.x - w / 2 < G - 4 || m.x + w / 2 > W) m.nom = ''; else bord = m.x + w / 2;
    }
    // la courbe elle-même : obstacle des étiquettes (elles ne la recouvrent plus)
    const points: Array<{ x: number; y: number }> = [{ x: G, y: y(depart) }];
    let yPrec = y(depart);
    for (const m of e.marches) { const xm = x(m.date), ym = y(val(m)); points.push({ x: xm, y: yPrec }, { x: xm, y: ym }); yPrec = ym; }
    points.push({ x: xFin, y: yPrec });
    // le pointillé de l'autre scénario : obstacle du nom qui le porte (CT4-A-8, « un pointillé traverse sans Fermenteur »)
    const pointsFantome: Array<{ x: number; y: number }> = [];
    if (fantome) {
      let yp = y(fantome.departCents === null ? 0 : fantome.departCents); pointsFantome.push({ x: G, y: yp });
      for (const m of fantome.marches) { const xm = x(m.date), ym = y(fantome.departCents === null ? m.ecartCents : m.soldeApresCents!); pointsFantome.push({ x: xm, y: yp }, { x: xm, y: ym }); yp = ym; }
      pointsFantome.push({ x: xFin, y: yp });
    }
    // soldes sur les marches assez longues (p5b : 664,18) ; le dernier est le solde final, écrit au bout
    const soldes: Array<{ x: number; y: number; texte: string; neg: boolean; rect: Rect }> = [];
    if (connu) e.marches.forEach((m, k) => {
      if (k === e.marches.length - 1) return;
      const x0 = x(m.date), longueur = x(e.marches[k + 1].date) - x0, texte = montant(m.soldeApresCents!), w = lt(texte, 12, true, 600);
      if (longueur < Math.max(70, w + 14)) return;
      const yy = y(m.soldeApresCents!) - 5;
      soldes.push({ x: x0 + 6, y: yy, texte, neg: m.soldeApresCents! < 0, rect: { x: x0 + 6, y: yy - 11, w, h: 14 } });
    });
    // étiquettes
    const groupes = groupesRecurrents(e.marches);
    const demandes: Demande[] = [], infos = new Map<string, { item: ForecastItem; style: StyleEtiquette; l1: string; l2?: string; aria: string; lot?: ForecastItem[]; partiel?: boolean }>();
    let ordre = 0, avant = depart;
    for (const m of e.marches) {
      const apres = val(m);
      const lot = sortiesDuLot(m.items, testeId, groupes), dansLot = new Set(lot.map(i => i.id));
      if (lot.length) {
        const styles = [...new Set(lot.map(i => styleDe(i, testeId)))], style: StyleEtiquette = styles.length === 1 ? styles[0] : lot.some(i => styleDe(i, testeId) === 'brassin') ? 'brassin' : 'prevu';
        const l1 = texteLot(lot), id = `lot:${m.date}`, total = lot.reduce((s, i) => s + i.amountCents, 0);
        demandes.push({ id, priorite: style === 'brassin' ? 80 : 10, poids: Math.min(99, Math.round(total / 1000)), ordre: ordre++, w: lt(l1, 13, false, 600) + 16, h: 20, ancre: { x: x(m.date), y: (y(avant) + y(apres)) / 2 } });
        infos.set(id, { item: lot[0], style, l1, lot, partiel: lot.some(i => i.partial?.length), aria: `${lot.length} sorties le ${jourCourt(m.date)} : ${lot.map(i => `${nomLong(i)} ${i.partial?.length ? 'au moins ' : ''}${montant(-i.amountCents)}`).join(', ')}` });
      }
      for (const item of m.items) {
        if (dansLot.has(item.id)) continue;
        const groupe = groupes.get(item.id);
        if (groupe && groupe.premierId !== item.id) continue; // une seule étiquette pour une récurrence regroupée
        const style = styleDe(item, testeId);
        // CT4-A-8 : le nom d'un projet de matériel se lit en entier (« Fermenteur su… » n'était pas lisible) : au-delà de 14 signes il tient la première ligne seul,
        // le montant, le jour et l'usure passent sur la seconde.
        const nomEntier = item.source === 'equipment' && !groupe ? nomProjet(item.label, 40) : null, nomLong14 = nomEntier !== null && [...nomEntier].length > 14;
        const l1 = nomLong14 ? nomEntier! : texteEtiquette(item, groupe);
        const l2 = nomLong14 ? [`${montantEtiquette(item)}, ${item.label.includes('date estimée') ? '~' : ''}${jourCourt(item.date)}`, style === 'projet' ? sousLignes[item.id] : ''].filter(Boolean).join(' · ') : style === 'projet' ? sousLignes[item.id] : undefined;
        const w = Math.max(lt(l1, style === 'projet' ? 15 : 13, false, style === 'projet' ? 700 : 600), l2 ? lt(l2, 12) : 0) + 16, h = l2 ? 38 : 20;
        const poids = Math.min(99, Math.round(item.amountCents / 1000));
        demandes.push({ id: item.id, priorite: style === 'projet' ? 100 : style === 'brassin' ? 80 : style === 'entree' ? 60 : 10, poids, ordre: ordre++, w, h, ancre: { x: x(m.date), y: (y(avant) + y(apres)) / 2 } });
        infos.set(item.id, { item, style, l1, l2, partiel: !!item.partial?.length, aria: `${libelleLong(item)}${groupe ? ` ; ${groupe.n} fois` : ''}${item.partial?.length ? ` ; partiel : ${item.partial.join(', ')}` : ''}${l2 ? ` ; ${l2}` : ''}` });
      }
      avant = apres;
    }
    const xFinal = e.marches.length ? val(e.marches[e.marches.length - 1]) : depart;
    const libFin = connu ? montant(e.soldeFinCents!) : `${montantSigne(e.ecartFinCents)} depuis aujourd’hui`;
    const wAuj = lt('aujourd’hui', 13) + (connu ? lt(` ${montant(depart)}`, 13, true, 600) : 0) + 10, wFin = lt(libFin, 16, true, 700) + 8;
    // le solde final se pose sous le point quand il y a la place avant les noms de mois, sinon au-dessus (jamais sur « févr. »)
    const dessous = xFinal < 0 && y(xFinal) + 28 < haut;
    const rectFin: Rect = { x: xFin - wFin, y: y(xFinal) + (dessous ? 4 : -26), w: wFin, h: 24 };
    const fixes: Rect[] = [{ x: 0, y: 0, w: G - 2, h: HT }, { x: 0, y: haut, w: W, h: B }, { x: G, y: 0, w: wAuj, h: H + 2 }, rectFin];
    // le nom du pointillé, posé au bout de la ligne (p5b : « sans frigo 2 107,34 »), du côté où il n'écrase pas le solde final
    let nomGhost: { x: number; y: number; nom: string; valeur: string; rect: Rect; deux: boolean } | null = null;
    if (fantome && connu && nomFantome && fantome.soldeFinCents != null) {
      // CT4-A-8 : le nom entier (« sans Fermenteur supplémentaire ») ne se coupe plus par « … » et ne se pose ni sur le pointillé ni sur la courbe : on cherche, au plus près du bout
      // du pointillé, une place libre (une ligne d'abord, puis nom et valeur sur deux lignes), calée à droite puis décalée vers la gauche.
      const yg = y(fantome.soldeFinCents), valeur = montant(fantome.soldeFinCents), wVal = lt(valeur, 13, true);
      const gObstacles: Rect[] = [...fixes, ...obstaclesDeCourbe(points), ...obstaclesDeCourbe(pointsFantome)];
      // le nom entier d'abord ; faute de place près du pointillé, « sans ce projet » (le nom entier est sur les cartes Avec / Sans au-dessus) ; faute de mieux, le nom entier plus loin.
      const courts = `${nomFantome.split(' ')[0]} ce projet`;
      const variante = (nom: string, deux: boolean, maxDy: number) => { const wNom = lt(`${nom} `, 13, false, 600); return { nom, deux, maxDy, w: (deux ? Math.max(wNom, wVal) : wNom + wVal) + 4, h: deux ? 32 : 16 }; };
      const tiers = [[variante(nomFantome, false, 45), variante(nomFantome, true, 45)], [variante(courts, false, 45), variante(courts, true, 45)], [variante(nomFantome, false, 110), variante(nomFantome, true, 110)], [variante(courts, false, 110), variante(courts, true, 110)]];
      type Choix = { cout: number; v: ReturnType<typeof variante>; rect: Rect };
      let trouve: Choix | null = null;
      for (const groupe of tiers) {
        let meilleur: Choix | null = null;
        groupe.forEach((v, vi) => { for (let dy = -v.maxDy; dy <= v.maxDy; dy += 6) for (const dx of [0, 20, 40, 60, 80, 100]) {
          const rect: Rect = { x: xFin - v.w - dx, y: yg + dy - v.h / 2, w: v.w, h: v.h };
          if (rect.y < 0 || rect.y + rect.h > haut || rect.x < G + 2) continue;
          if (gObstacles.some(o => seCoupent(rect, { x: o.x - 2, y: o.y - 2, w: o.w + 4, h: o.h + 4 }))) continue;
          const cout = Math.abs(dy) + dx * 0.6 + vi * 30;
          if (!meilleur || cout < meilleur.cout) meilleur = { cout, v, rect };
        } });
        if (meilleur) { trouve = meilleur; break; }
      }
      const repli = tiers[2][1], rect: Rect = trouve?.rect ?? { x: xFin - repli.w, y: Math.min(Math.max(yg + 6, 0), haut - repli.h), w: repli.w, h: repli.h }, v = trouve?.v ?? repli;
      nomGhost = { x: rect.x + rect.w, y: rect.y + 12, nom: v.nom, valeur, rect, deux: v.deux };
    }
    if (nomGhost) fixes.push(nomGhost.rect);
    const soldesGardes = soldes.filter(s => !fixes.some(f => seCoupent(s.rect, f)));
    const obstacles: Rect[] = [...fixes, ...obstaclesDeCourbe(points), ...obstaclesDeCourbe(pointsFantome), ...soldesGardes.map(s => s.rect)];
    const { placees, reste } = placerEtiquettes(demandes, { w: W, h: HT }, obstacles, { distanceMax: 230, xMin: G, xMax: W - D });
    return { W, g, y, x, xFin, haut, chemin, mois, placees, reste, infos, y0: y(0), connu, depart, libFin, wAuj, xFinal, bas, dessous, soldes: soldesGardes, nomGhost };
  }, [e, fantome, nomFantome, largeur, testeId, sousLignes, HT, lt]);
  const { W, g, y, xFin, haut, chemin, mois, placees, reste, infos, y0, connu, depart, libFin, xFinal, dessous, soldes, nomGhost } = vue;
  const restesCle = reste.join('|');
  useEffect(() => { onRestes(restesCle ? restesCle.split('|') : []); }, [restesCle]); // eslint-disable-line react-hooks/exhaustive-deps
  const sousZero = connu && e.soldeFinCents! < 0;
  const clipPos = `${uid}p`, clipNeg = `${uid}n`;
  const aire = `${chemin(e)} V${y0.toFixed(1)} H${G} Z`;
  return <svg className="prv-svg" viewBox={`0 0 ${W} ${HT}`} width={W} height={HT} role="img" aria-label={`Escalier de trésorerie du ${e.debut.slice(8)}.${e.debut.slice(5, 7)} au ${e.fin.slice(8)}.${e.fin.slice(5, 7)}`}>
    <defs><clipPath id={clipPos}><rect x={G} y={0} width={W} height={Math.max(0, y0)} /></clipPath><clipPath id={clipNeg}><rect x={G} y={y0} width={W} height={HT} /></clipPath></defs>
    {g.ticks.map(t => <g key={t}><line className={t === 0 ? 'prv-zero' : 'prv-grid'} x1={G} x2={xFin} y1={y(t)} y2={y(t)} /><text className={`prv-ax${t === 0 ? ' prv-z' : ''}`} x={G - 4} y={y(t) + 3.5} textAnchor="end">{t === 0 ? '0' : montantEntier(t)}</text></g>)}
    {mois.map((m, i) => <g key={i}>{m.sep !== null && <line className="prv-sep" x1={m.sep} x2={m.sep} y1={H} y2={haut} />}{m.nom && <text className="prv-mois" x={m.x} y={HT - 10} textAnchor="middle">{m.nom}</text>}</g>)}
    {fantome && <path className="prv-ghost" d={chemin(fantome)} />}
    <path className="prv-aire" d={aire} clipPath={`url(#${clipPos})`} />
    {connu && <path className="prv-aire-neg" d={aire} clipPath={`url(#${clipNeg})`} />}
    <path className="prv-step" d={chemin(e)} clipPath={`url(#${clipPos})`} />
    <path className={connu ? 'prv-step-neg' : 'prv-step'} d={chemin(e)} clipPath={`url(#${clipNeg})`} />
    <line className="prv-ici" x1={G} x2={G} y1={H} y2={y(depart)} />
    <text className="prv-et" x={G + 4} y={H - 3}>aujourd’hui{connu && <> <tspan className="prv-mt">{montant(depart)}</tspan></>}</text>
    {soldes.map(s => <text key={`${s.x}`} className={`prv-solde${s.neg ? ' prv-rt' : ''}`} x={s.x} y={s.y}>{s.texte}</text>)}
    {nomGhost && !nomGhost.deux && <text className="prv-nom-ghost" x={nomGhost.x} y={nomGhost.y} textAnchor="end">{nomGhost.nom} <tspan className="prv-mt">{nomGhost.valeur}</tspan></text>}
    {nomGhost && nomGhost.deux && <><text className="prv-nom-ghost" x={nomGhost.x} y={nomGhost.y} textAnchor="end">{nomGhost.nom}</text><text className="prv-nom-ghost prv-mt" x={nomGhost.x} y={nomGhost.y + 16} textAnchor="end">{nomGhost.valeur}</text></>}
    {placees.map(p => {
      const info = infos.get(p.id)!, a = pointDAccroche(p.rect, p.ancre), hit = Math.max(0, (32 - p.rect.h) / 2);
      const ouvrir = () => (info.lot && onLot ? onLot(info.lot) : onEtiquette(info.item));
      return <g key={p.id} className={`prv-etq prv-${info.style}${info.partiel ? ' prv-partiel' : ''}`} role="button" tabIndex={0} aria-label={info.aria} onClick={ouvrir}
        onKeyDown={ev => { if (ev.key === 'Enter' || ev.key === ' ') { ev.preventDefault(); ouvrir(); } }}>
        <line className="prv-fil" x1={p.ancre.x} y1={p.ancre.y} x2={a.x} y2={a.y} />
        <circle className="prv-pt" cx={p.ancre.x} cy={p.ancre.y} r={2.5} />
        <rect className="prv-chip" x={p.rect.x} y={p.rect.y} width={p.rect.w} height={p.rect.h} rx={p.rect.h > 24 ? 12 : 10} />
        <text className="prv-tx" x={p.rect.x + 8} y={p.rect.y + (info.l2 ? 15 : 14)}>{info.l1}</text>
        {info.l2 && <text className="prv-sub" x={p.rect.x + 8} y={p.rect.y + 31}>{info.l2}</text>}
        <rect x={p.rect.x} y={p.rect.y - hit} width={p.rect.w} height={p.rect.h + 2 * hit} fill="transparent" />
      </g>;
    })}
    <circle className={sousZero ? 'prv-pt-neg' : 'prv-pt'} cx={xFin} cy={y(xFinal)} r={4} />
    <text className={`prv-fin${sousZero ? ' prv-rt' : ''}`} x={xFin} y={y(xFinal) + (dessous ? 22 : -10)} textAnchor="end">{libFin}</text>
  </svg>;
}

const seCoupent = (a: Rect, b: Rect) => a.x < b.x + b.w && b.x < a.x + a.w && a.y < b.y + b.h && b.y < a.y + a.h;
