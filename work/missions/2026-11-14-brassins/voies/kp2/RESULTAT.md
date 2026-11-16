OK — 32 problèmes, 4 bloquants : e10c CONFORME ; e1a, e2a, e4c, e7a, e11a CORRIGER (VERDICT.md)

- **e1a** — CORRIGER : 4 problèmes, 0 bloquant (anciens [B] de kp tous corrigés). « La date se choisit bien, il reste le coche du jour proposé et des lignes en trop dans le starter. »
- **e2a** — CORRIGER : 10 problèmes, 1 bloquant : « Rebrasser cette Saison » absent (`onRebrew` non câblé, DÉCISION de p5). « Il est fini, je veux le rebrasser, pas fermer. »
- **e4c** — CORRIGER : 9 problèmes, 1 bloquant : Garde sans « 2 °C » ni « 11 j · depuis le 03.11 » (date d'entrée en garde hors modèle ; DÉCISION pilote). « Depuis quand elle est en garde ? »
- **e7a** — CORRIGER : 2 problèmes, 1 bloquant : « Alcool 2/2 » au lieu de « 2/3 » (la Pils en garde, FG confirmée, n'est pas comptée). « 3 FG mais 2 alcools, il en manque une. »
- **e10c** — CONFORME : 1 problème non bloquant (décimales des écarts en kg), inchangé depuis kp.
- **e11a** — CORRIGER : 6 problèmes, 1 bloquant neuf : la phrase-réponse a disparu de la liste Brassins (masquage de p6 qui déborde de la vue Bilan). « Où est passée ma phrase du jour ? » ; 1, 2, 5 de kp attendent son choix, non comptés.

Gates : G1 VERDICT OK (`tests.txt`). Anciens [B] de kp : 16 sur 21 corrigés, 2 restent (e2a Rebrasser, e4c date de garde), 3 attendent son choix (e11a 1, 2, 5) ; 2 bloquants neufs (e7a alcool, e11a phrase).
LEÇON PROPOSÉE : un masquage conditionnel (« cacher X dans la vue Y ») se capture aussi dans la vue voisine où X doit rester ; ici la phrase de la liste a disparu sans qu'aucune capture de p6 ne le montre comme écart.
