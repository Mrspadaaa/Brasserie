// Le crochet des écrans pour un calcul lourd (#165) : useCalcul('proposer', [recette, direction]).
// - Le résultat vient TOUT DE SUITE quand le client le peut (serveur du fil principal, ou réponse déjà reçue ou
//   préchauffée) : le premier rendu est celui d'avant, aucun état d'attente.
// - Servi par le worker (#171) : une réponse préchauffée est lue tout de suite ; une réponse absente est calculée sur le
//   fil principal (repli synchrone du client, option b), à la première ouverture comme à un recalcul : l'écran rend
//   exactement ce qu'il rendait. Les recalculs ne passent au worker (l'écran garde alors son dernier résultat) qu'avec
//   recalculsAsynchrones() (`?recalcul=worker`) : Substituer perd son choix à un changement de moment quand sa réponse
//   arrive après le rendu (son état part des défauts du résultat d'avant, ecrans/substituer/index.tsx) ; à réparer là
//   avant de l'allumer.
// - Sinon (recalcul servi par le worker, mode différé), l'écran GARDE SON DERNIER RÉSULTAT pendant le calcul : ni roue, ni « chargement »,
//   ni écran vide (ses maquettes n'ont pas d'état d'attente, D65 angles morts). Une réponse périmée (le doigt a bougé
//   entre-temps) est ignorée par le canal.
// Rend { valeur, args } : `args` sont ceux qui ont produit la valeur (un résultat gardé peut venir de la requête
// d'avant), pour que l'écran compose ce qu'il montre avec les mêmes entrées. undefined : aucune requête (args null),
// ou aucun résultat encore (premier rendu sans réponse immédiate ; jamais le cas sur le fil principal).
import { useEffect, useMemo, useRef, useState } from 'react';
import type { ArgsDe, Canal, NomCalcul, Recu } from '../../../../../src/domain/hopIndex/v4/client';
import { calcul, recalculsAsynchrones, type CalculsParcours } from './client';

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
  // Le dernier résultat montré par cet écran (le garder pendant un recalcul, même s'il est venu « direct »).
  const dernier = useRef<Recu<C, N> | undefined>(undefined);
  const direct = useMemo<Recu<C, N> | undefined>(() => {
    if (!args) return undefined;
    const valeur = dernier.current && recalculsAsynchrones() ? client.lireGarde(nom, ...args) : client.lire(nom, ...args);
    return valeur === undefined ? undefined : { valeur, args };
  }, [client, nom, cle]); // eslint-disable-line react-hooks/exhaustive-deps
  // Un nouveau rendu à chaque réponse reçue ; la réponse elle-même passe par `dernier`.
  const [, setRecu] = useState<Recu<C, N> | undefined>(undefined);
  useEffect(() => {
    if (!args || direct || !canal.current) return;
    canal.current.demander(...args).then(
      (r) => { if (r) { dernier.current = r; setRecu(r); } },
      // Une erreur garde le dernier résultat ; elle est dite à la console, jamais tue.
      (e: unknown) => { console.error(`calcul ${nom} :`, e); },
    );
  }, [client, nom, cle, direct]); // eslint-disable-line react-hooks/exhaustive-deps
  if (!args) return undefined;
  if (direct) dernier.current = direct;
  return dernier.current;
}
