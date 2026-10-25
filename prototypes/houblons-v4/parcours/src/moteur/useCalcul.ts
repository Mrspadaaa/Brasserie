// Le crochet des écrans pour un calcul lourd (#165) : useCalcul('proposer', [recette, direction]).
// - Le résultat vient TOUT DE SUITE quand le client le peut (serveur du fil principal, ou réponse déjà reçue ou
//   préchauffée) : le premier rendu est celui d'avant, aucun état d'attente.
// - Sinon (worker, mode différé), l'écran GARDE SON DERNIER RÉSULTAT pendant le calcul : ni roue, ni « chargement »,
//   ni écran vide (ses maquettes n'ont pas d'état d'attente, D65 angles morts). Une réponse périmée (le doigt a bougé
//   entre-temps) est ignorée par le canal.
// Rend { valeur, args } : `args` sont ceux qui ont produit la valeur (un résultat gardé peut venir de la requête
// d'avant), pour que l'écran compose ce qu'il montre avec les mêmes entrées. undefined : aucune requête (args null),
// ou aucun résultat encore (premier rendu sans réponse immédiate ; jamais le cas sur le fil principal).
import { useEffect, useMemo, useRef, useState } from 'react';
import type { ArgsDe, Canal, NomCalcul, Recu } from '../../../../../src/domain/hopIndex/v4/client';
import { calcul, type CalculsParcours } from './client';

type C = CalculsParcours;

export function useCalcul<N extends NomCalcul<C>>(nom: N, args: ArgsDe<C, N> | null): Recu<C, N> | undefined {
  const client = calcul();
  const cle = args ? client.cle(nom, args) : null;
  // Le canal vit avec l'écran : fermé au démontage, ses réponses en vol sont alors ignorées.
  const canal = useRef<Canal<C, N> | null>(null);
  useEffect(() => {
    const c = client.canal(nom);
    canal.current = c;
    return () => { c.fermer(); if (canal.current === c) canal.current = null; };
  }, [client, nom]);
  const direct = useMemo<Recu<C, N> | undefined>(() => {
    if (!args) return undefined;
    const valeur = client.lire(nom, ...args);
    return valeur === undefined ? undefined : { valeur, args };
  }, [client, nom, cle]); // eslint-disable-line react-hooks/exhaustive-deps
  const [recu, setRecu] = useState<Recu<C, N> | undefined>(undefined);
  useEffect(() => {
    if (!args || direct || !canal.current) return;
    canal.current.demander(...args).then(
      (r) => { if (r) setRecu(r); },
      // Une erreur garde le dernier résultat ; elle est dite à la console, jamais tue.
      (e: unknown) => { console.error(`calcul ${nom} :`, e); },
    );
  }, [client, nom, cle, direct]); // eslint-disable-line react-hooks/exhaustive-deps
  if (!args) return undefined;
  return direct ?? recu;
}
