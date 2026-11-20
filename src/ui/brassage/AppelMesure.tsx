import React, { useState } from 'react';
import { aEcrire, ecartTexte, horsCible, texteCible, valeurAppel, type AppelPalier, type CarteAppel, type KindAppel } from '../../domain/appelMesure';
import { ecartHorsCible } from '../../domain/brewDay';
import type { Zone } from '../../domain/brewDayCalculs';
import { heureFr } from '../../domain/brewMeasures';
import { bornesCurseur, formatCurseur, pasCurseur, poserSurPas } from '../../domain/measureSlider';

/**
 * Le palier appelle la mesure (maquette pm1, choisie le 16.11 ; mission port-simplicité). Deux cartes — la température du palier
 * (warn, « à relever ») et le pH d'empâtage (« à 15′ ») —, chacune avec un curseur posé sur sa cible et son repère vert, puis
 * « Relever » et « Plus tard ». Rien n'est noté sans toucher : « Plus tard » n'écrit rien et laisse « à relever ».
 * Les chiffres arrivent calculés par `domain/appelMesure.ts` ; la carte n'en calcule aucun. Une valeur inconnue s'écrit « — ».
 * Jetons de la conduite (`--bz-*`), clair et cave ; le curseur est un <input type="range"> natif transparent (clavier, lecteur d'écran).
 */
export interface AppelMesureProps {
  appel: AppelPalier;
  /** Ce que « Relever » écrit : les valeurs des curseurs (la température proposée, confirmée ; le pH, seulement posé). */
  onReleve: (valeurs: { kind: KindAppel; value: number }[]) => void;
  /**
   * Les bandes « sous · dans · sur » et leur « Et donc » (`zonesDeCible`, calculées par la page : l'eau à ajouter par °C quand le palier est
   * hors cible). Elles vivaient dans la carte « Maintenant » (p2c K2 n° 5) ; la carte d'appel les garde en une ligne, seulement quand la
   * valeur lue est hors cible et que la bande a une consigne. Rien d'autre n'est ajouté à la maquette pm1.
   */
  zones?: Partial<Record<KindAppel, Zone[]>>;
}

/** Le « Et donc » de la bande où tombe la valeur ; `null` dans la cible (la carte dit déjà « dans la cible »), sans cible ou sans consigne. */
export function etDoncDe(carte: CarteAppel, valeur: number, zones?: Zone[]): string | null {
  if (!carte.cible || !zones) return null;
  const e = ecartHorsCible(carte.cible, valeur);
  if (e == null) return null;
  return zones.find((z) => z.borne === (e > 0 ? 'sur' : 'sous'))?.etDonc ?? null;
}

const NBSP = ' ';
const unite = (kind: KindAppel) => (kind === 'temperature' ? `${NBSP}°C` : '');
const GRAS = { fontWeight: 700, color: 'var(--bz-t0)' } as const;
const MUET = { color: 'var(--bz-t2)' } as const;
const CARTE = {
  display: 'flex', flexDirection: 'column', gap: 0, padding: '7px 9px', borderRadius: 9,
  background: 'var(--bz-panel)', border: '1px solid var(--bz-border2)', color: 'var(--bz-t1)', fontSize: 14, lineHeight: 1.3
} as const;
const CARTE_WARN = { ...CARTE, background: 'color-mix(in srgb, var(--bz-warn) 12%, var(--bz-page))', border: '1px solid var(--bz-warn)' } as const;
const CARTE_OK = { ...CARTE, border: '1px solid var(--bz-hop)', background: 'color-mix(in srgb, var(--bz-hop) 8%, var(--bz-page))' } as const;
const BOUTON = {
  minHeight: 44, borderRadius: 10, padding: '9px 10px', fontSize: 15, fontWeight: 700, textAlign: 'center', cursor: 'pointer'
} as const;

/** Le curseur de la maquette : rail, remplissage jusqu'au pouce, repère vert à la cible, pouce rond. Zone tactile de 40 px (le rail n'en fait que 6). */
function Curseur({ carte, valeur, onPose }: { carte: CarteAppel; valeur: number | null; onPose: (v: number) => void }) {
  const { kind } = carte;
  const { pas } = pasCurseur(kind);
  const bornes = bornesCurseur(kind, carte.echelle.min, carte.echelle.max);
  const etendue = bornes.max - bornes.min;
  const pose = valeur != null;
  const pos = valeur ?? carte.propose ?? (bornes.min + bornes.max) / 2;
  const vide = !pose && carte.propose == null;
  const part = (n: number) => Math.max(0, Math.min(1, (n - bornes.min) / etendue));
  // Le pouce fait 18 px : son centre court de 9 px à (largeur − 9 px), comme celui du <input> natif.
  const at = (n: number) => `calc(9px + (100% - 18px) * ${part(n)})`;
  const poser = (v: number) => onPose(poserSurPas(kind, v, bornes.min, bornes.max));
  const nom = `${carte.nom}, curseur`;
  return (
    <div style={{ position: 'relative', height: 40, margin: '0 4px', touchAction: 'pan-y' }} data-curseur={kind}>
      <input
        type="range"
        className="peer"
        min={bornes.min}
        max={bornes.max}
        step={pas}
        value={pos}
        aria-label={nom}
        aria-valuetext={pose ? `${formatCurseur(kind, valeur)}${unite(kind)}` : carte.propose != null ? `${formatCurseur(kind, carte.propose)}${unite(kind)} proposé, à confirmer` : 'aucune valeur'}
        onChange={(e) => poser(Number(e.target.value))}
        onPointerUp={(e) => { if (!pose) poser(Number(e.currentTarget.value)); }}
        onClick={(e) => { if (!pose) poser(Number(e.currentTarget.value)); }}
        onKeyDown={(e) => { if (!pose && (e.key === 'Enter' || e.key === ' ')) { e.preventDefault(); poser(pos); } }}
        style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', margin: 0, opacity: 0, cursor: 'pointer' }}
      />
      <div aria-hidden="true" style={{ position: 'absolute', left: 0, right: 0, top: 17, height: 6, borderRadius: 3, background: 'var(--bz-border2)', pointerEvents: 'none' }}>
        <i style={{ position: 'absolute', left: 0, top: 0, bottom: 0, width: at(pos), borderRadius: 3, background: 'var(--bz-ph2)' }} />
        {carte.propose != null && <span data-repere="" style={{ position: 'absolute', top: -10, bottom: -10, width: 3, marginLeft: -1.5, borderRadius: 2, left: at(carte.propose), background: 'var(--bz-hop)' }} />}
      </div>
      <span
        aria-hidden="true"
        data-pouce=""
        data-vide={vide ? '' : undefined}
        className="peer-focus-visible:outline peer-focus-visible:outline-2 peer-focus-visible:outline-offset-2"
        style={{
          position: 'absolute', top: 11, left: at(pos), width: 18, height: 18, marginLeft: -9, borderRadius: '50%', pointerEvents: 'none',
          boxSizing: 'border-box', background: vide ? 'transparent' : 'var(--bz-t0)', border: `3px ${vide ? 'dashed' : 'solid'} var(--bz-ph2)`,
          outlineColor: 'var(--bz-warn)'
        }}
      />
    </div>
  );
}

function Carte({ carte, valeur, onPose, zones }: { carte: CarteAppel; valeur: number | null; onPose: (v: number) => void; zones?: Zone[] }) {
  const fait = carte.releve != null;
  const pose = valeur != null;
  const quand = fait ? `relevé ${heureFr(carte.releve!.at)}` : carte.due ? 'à relever' : carte.kind === 'ph' ? 'à 15′' : '';
  const gauche = fait ? valeurAppel(carte.kind, carte.releve!.value) + unite(carte.kind)
    : pose ? valeurAppel(carte.kind, valeur) + unite(carte.kind)
    : carte.propose != null ? valeurAppel(carte.kind, carte.propose) + unite(carte.kind) : '—';
  const ecart = fait ? ecartTexte(carte, carte.releve!.value) : pose ? ecartTexte(carte, valeur) : '';
  const droite = ecart
    || (!pose && !fait
      ? carte.kind === 'temperature'
        ? carte.propose != null ? 'proposé, à confirmer' : 'cible inconnue'
        : texteCible(carte)
      : '');
  const mesure = fait ? carte.releve!.value : pose ? valeur : null;
  const hors = mesure != null && horsCible(carte, mesure);
  const etDonc = fait ? etDoncDe(carte, carte.releve!.value, zones) : pose ? etDoncDe(carte, valeur, zones) : null;
  return (
    <div data-carte={carte.kind} data-due={carte.due && !fait ? '' : undefined} data-fait={fait ? '' : undefined}
      style={fait ? CARTE_OK : carte.due ? CARTE_WARN : CARTE}>
      <span><b style={GRAS}>{carte.nom}</b>{quand ? ` · ${quand}` : ''}</span>
      {!fait && <Curseur carte={carte} valeur={valeur} onPose={onPose} />}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', gap: 8, marginTop: fait ? 2 : 0 }}>
        <span className="bz-m" style={{ fontSize: 14, fontVariantNumeric: 'tabular-nums', ...GRAS }}>{gauche}</span>
        <span data-ecart={ecart !== '' ? (hors ? 'hors' : 'dans') : undefined} style={{ textAlign: 'right', ...(hors ? { color: 'var(--bz-warn)', fontWeight: 600 } : ecart !== '' ? { color: 'var(--bz-ph4)', fontWeight: 600 } : MUET) }}>{droite}</span>
      </div>
      {etDonc && <span data-etdonc="" style={{ ...MUET, fontSize: 13, marginTop: 2 }}>Et donc : {etDonc}</span>}
    </div>
  );
}

export function AppelMesure({ appel, onReleve, zones }: AppelMesureProps) {
  const [posees, setPosees] = useState<Partial<Record<KindAppel, number | null>>>({});
  const [replie, setReplie] = useState(false);
  const cartes = [appel.temperature, appel.ph].filter((c): c is CarteAppel => c != null);
  const enAttente = cartes.filter((c) => !c.releve);
  const ecrire = aEcrire(appel, posees);

  // Tout est relevé : une ligne verte, plus de boutons. Le détail reste dans « Relevés du jour » et le journal.
  if (enAttente.length === 0) {
    return (
      <section aria-label="Relevés du palier" data-appel="fait" style={{ margin: '8px 8px 0', ...CARTE_OK, flexDirection: 'row', flexWrap: 'wrap', alignItems: 'baseline', gap: '2px 10px' }}>
        <b style={{ color: 'var(--bz-ph4)' }}>✓ Relevé</b>
        {cartes.map((c) => (
          <span key={c.kind}>{c.kind === 'ph' ? 'pH ' : 'palier '}<span className="bz-m" style={GRAS}>{valeurAppel(c.kind, c.releve!.value)}{unite(c.kind)}</span></span>
        ))}
        {cartes.map((c) => {
          const etDonc = etDoncDe(c, c.releve!.value, zones?.[c.kind]);
          return etDonc ? <span key={`ed-${c.kind}`} data-etdonc="" style={{ ...MUET, fontSize: 13, flexBasis: '100%' }}>Et donc : {etDonc}</span> : null;
        })}
      </section>
    );
  }

  // « Plus tard » : rien n'est écrit, la carte se replie en une ligne et « reste à relever ».
  if (replie) {
    return (
      <section aria-label="Relevés du palier" data-appel="replie" style={{ margin: '8px 8px 0', ...CARTE_WARN, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 8 }}>
        <span><b style={GRAS}>{enAttente[0].nom}</b> · à relever</span>
        <button type="button" onClick={() => setReplie(false)} style={{ ...BOUTON, background: 'var(--bz-t0)', color: 'var(--bz-page)', border: 0, padding: '9px 16px' }}>Relever</button>
      </section>
    );
  }

  return (
    <section aria-label="Relevés du palier" data-appel="ouvert" style={{ margin: '8px 8px 0', display: 'flex', flexDirection: 'column', gap: 7 }}>
      {cartes.map((c) => (
        <Carte key={c.kind} carte={c} valeur={posees[c.kind] ?? null} onPose={(v) => setPosees((p) => ({ ...p, [c.kind]: v }))} zones={zones?.[c.kind]} />
      ))}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 6 }}>
        <button
          type="button"
          disabled={ecrire.length === 0}
          onClick={() => { if (ecrire.length) { onReleve(ecrire); setPosees({}); } }}
          style={{ ...BOUTON, background: 'var(--bz-t0)', color: 'var(--bz-page)', border: 0, opacity: ecrire.length === 0 ? 0.4 : 1 }}
        >Relever</button>
        <button
          type="button"
          onClick={() => setReplie(true)}
          style={{ ...BOUTON, background: 'transparent', color: 'var(--bz-t0)', border: '1px solid var(--bz-border2)', fontWeight: 600 }}
        >Plus tard</button>
      </div>
      {ecrire.length === 0 && (
        <p data-raison-inactif style={{ ...MUET, margin: 0, fontSize: 13, textAlign: 'center' }}>
          Glisse {enAttente.length === 1 ? `le curseur ${enAttente[0].kind === 'ph' ? 'de pH' : 'de température'}` : 'un curseur'} sur ta mesure pour relever.
        </p>
      )}
    </section>
  );
}
