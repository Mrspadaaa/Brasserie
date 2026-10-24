// Barre au style l5b (baseline l8g, carte fils22) : piste de 0 à deux fois le haut de la bande du style, zone du
// style sur la moitié gauche ; repère rond = ma bière avant ; aplat à la couleur de la famille = la valeur montrée.
// En absolu : piste 0 → 110 sur l'échelle des axes V5.5, zone = la bande brute. Inconnu : piste hachurée, jamais 0.
import type { ReactNode } from 'react';
import type { FamilleLue } from '../moteur';
import { COULEURS, COURT } from './familles';
import { Picto } from './Pictos';

export type Echelle = 'style' | 'absolu';
const pc = (x: number) => `${Math.max(0, Math.min(100, x)).toFixed(1)}%`;

export function BarreStyle({ apres, avant, echelle = 'style', valeur, nomme = true }: {
  /** Ce que la barre montre (la bière, ou la bière après un ajout). */
  apres: FamilleLue;
  /** Repère « ma bière avant », facultatif. */
  avant?: FamilleLue;
  echelle?: Echelle;
  /** Ce qui s'écrit à droite (écart simulé, « hors style »…). */
  valeur?: ReactNode;
  nomme?: boolean;
}) {
  const f = apres.famille;
  const haut = apres.bande?.[1] ?? null;
  const pos = (x: number) => (echelle === 'style' && haut ? pc((x / haut) * 50) : pc((x / 110) * 100));
  const zone = echelle === 'style' && haut
    ? { left: '0%', width: '50%' }
    : apres.bande ? { left: pos(apres.bande[0]), width: pc(((apres.bande[1] - apres.bande[0]) / 110) * 100) } : null;
  const inconnu = apres.valeur == null;
  const hors = apres.horsStyle != null;
  return (
    <div data-barre={f} data-echelle={echelle} className="grid grid-cols-[6.25rem_1fr_4.25rem] items-center gap-2 min-h-[1.75rem]">
      <span className={`flex items-center gap-1.5 text-sm truncate ${apres.statut === 'attendue' ? 'font-semibold text-cave-50' : 'text-cave-200'}`}>
        <Picto famille={f} />{nomme ? COURT[f] : null}
      </span>
      <span className={`relative h-2.5 rounded-full bg-cave-800/60 ${inconnu ? 'pq-hachure' : ''}`} title={inconnu ? apres.raison ?? 'inconnu' : undefined}
        {...(inconnu ? { 'data-inconnu': '' } : {})}>
        {zone && <i data-role="zone" className="absolute inset-y-0 rounded-full bg-cave-700/70" style={zone} />}
        {!inconnu && <i data-role="apres" className="absolute inset-y-0 left-0 rounded-full" style={{ width: pos(apres.valeur!.centre), background: COULEURS[f].base }} />}
        {avant?.valeur && <i data-role="avant" className="absolute top-1/2 -translate-y-1/2 -translate-x-1/2 w-3 h-3 rounded-full border-2 border-cave-50 bg-cave-900" style={{ left: pos(avant.valeur.centre) }} />}
      </span>
      <span className="text-right text-xs font-mono truncate" style={hors ? undefined : { color: COULEURS[f].texte }}>
        {valeur ?? (hors ? <span className="text-alert font-sans">hors style</span> : null)}
      </span>
    </div>
  );
}
