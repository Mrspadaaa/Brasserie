OK — 24 problèmes, 4 bloquants : gfa, gfc, gfd à CORRIGER (α du lot sans la plage des fiches ; gfc trop proche de gfa au repos) ; g6a, g6b, e5ga, e5gb à MONTRER

- **gfa** (graphique d'abord) — REJET : α perdu (« α du lot non saisi », sans plage), SPEC § 0 l. 21 et D29 ; phrase prédite : « C'est le graph de s4a en propre, j'aime bien. L'α ??? » ; correction : « α du lot — · fiches x–y % » (catalogue de l'app), relance.
- **gfc** (houblons pendus à J+6) — REJET : même défaut d'α ; au repos à 390, se distingue à peine de gfa (refus « toutes les propositions se ressemblent », PORTRAIT § 2) ; phrase prédite : « C'est la même que gfa ??? » ; correction : houblons pendus sous la colonne J+6, ou gfc écartée, relance.
- **gfd** (le jour J+6 ouvert à côté) — REJET : même défaut d'α ; phrase prédite : « Là je vois tout mon graph et le dry hop à côté, ok. Mais l'α il est où ??? » ; correction : celle de gfa, relance.
- **g6a** (puces qui comptent) — ACCEPTÉ : « C'est ma liste, ok… elle compte quoi de plus ? » ; montrer aussi la rangée de puces défilée.
- **g6b** (la phrase qui filtre) — ACCEPTÉ : « Je touche "2 en cuve" et ça filtre, c'est direct, pas mal. »
- **e5ga** (carte fantôme, frise en travers) — ACCEPTÉ : « Je garde ma liste et je vois quand tombe le dry hop, c'est clair. »
- **e5gb** (carte dépliée, liste pliée) — ACCEPTÉ : « Bien aussi, mais ma liste disparaît le temps de créer. »

Points de la revue (§ A) : n° 1, 2, 4 à 10 et 12 à 18 corrigés ; n° 3 corrigé à l'excès (plage retirée au lieu d'être mise en repli).
Verdict : `work/missions/2026-11-14-brassins/voies/k7/VERDICT.md`. Critères : `tests.txt` (G1 VERDICT OK). Aucune suite Vitest : rien n'a été touché dans src/.
Captures : les 33 images de gf{a,c,d}, g6{a,b} et e5g{a,b}, ainsi que les 7 repos des parents. Toutes ont été ouvertes.
Écart à signaler (pilote) : dans la CHECK de G1, la regex a perdu sa barre inverse. Elle cherche la lettre « d » répétée au lieu d'un chiffre, et échoue donc sur toute ligne « OK — 24 problèmes… ». Avec la classe chiffre (barre inverse suivie de d), la même CHECK rend VERDICT OK. Mes écritures dans ce dossier perdent leurs barres inverses : GATES.md reste à corriger par le pilote.
LEÇON PROPOSÉE : une CHECK écrite par le shell perd ses barres inverses (« \d » devient « d ») ; systeme.mjs devrait rejouer chaque CHECK sur un exemple valide à la création de la voie.
