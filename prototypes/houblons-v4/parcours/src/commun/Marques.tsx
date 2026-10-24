// Marques d'honnêteté : le simulé porte « ~ », l'inconnu « ? » hachuré (jamais 0).
import type { ReactNode } from 'react';
import { signe as ecrireSigne, nombre } from './nombres';

/** Valeur simulée : « ~+23 » (écart) ou « ~24 » (niveau). */
export function Simule({ valeur, ecart = false, decimales = 0, couleur }: { valeur: number; ecart?: boolean; decimales?: number; couleur?: string }) {
  return (
    <span data-simule="" className="font-mono tabular-nums" style={couleur ? { color: couleur } : undefined}>
      ~{ecart ? ecrireSigne(valeur, decimales) : nombre(valeur, decimales)}
    </span>
  );
}

/** Inconnu : « ? » sur un fond hachuré ; la raison au survol et pour le lecteur d'écran. */
export function Inconnu({ raison, children = '?' }: { raison: string; children?: ReactNode }) {
  return (
    <span data-inconnu="" title={raison} aria-label={`inconnu : ${raison}`}
      className="pq-hachure inline-flex items-center justify-center min-w-[1.25rem] px-1 rounded font-mono text-cave-200">
      {children}
    </span>
  );
}
