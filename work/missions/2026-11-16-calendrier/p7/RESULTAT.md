OK — p7 : g7 (achat glissé, payer en ✓/✗), c2h7 (courbe repliée, 5 semaines) ; 8 problèmes traités

Rebâtir : `node p7/assemble.mjs && node p7/build.mjs` (→ `plus bas 259 S24 · sans Embouteilleuse 3 059 S24`).
Fichiers (rien hors de `p6/` et `p7/`) : `p6/g6.part.mjs` (les 2 retouches de la critique reportées ; `p6/assemble.mjs` redonne
un `build.mjs` **identique** au build retouché, vérifié par `diff`) ; `p7/assemble.mjs`, `p7/retouches-p7.mjs`, `p7/g7.part.mjs`,
`p7/_g7-edits.cjs` (script de retouche déjà joué une fois, ne pas rejouer), `p7/build.mjs`, `p7/{g7,c2h7}/etat.html`, captures.

## Statut des 10 problèmes de p6/CRITIQUE.md
1, 2. **Reportés dans les sources** (LC 68, marge 5 px, rangée vide 50 px) : `g6.part.mjs`, puis copie en `g7.part.mjs`.
3. **Corrigé** : légende écrite « ○ semaine trop chargée » en haut à droite de la bande (390, paysage, 1280), et la même bulle
   dans le bouton « S50 · 4 j pour 2 › » de la carte. Plus de titre au survol seul.
4. **Corrigé** : une étiquette sortie de sa barre est toujours à droite ; contre le bord, juste dessous, soulignée d'un trait de sa
   couleur, jamais à gauche. Vu : « Malt groupé −540 » (390), « Saison », « Marché printemps », « La Cigogne » (1280).
5. **Corrigé** : un achat ou des travaux se glissent au doigt (pointerdown/move/up sur la barre, curseur grab). État `geste` :
   Frigo tenu, fantôme « Frigo −1 800 · payé en S27 ✓ », trait vertical ; une rangée « payer en » au-dessus des Achats, avec
   ✗ rouges S22 à S25 et ✓ verts S26 à S29 ; Libre barré puis nouveau ; carte « il tient, il reste au moins 1 568 · au plus tôt
   S26 · 28 juin », Annuler / Payer en S27. L'ancien « et si » passe dans l'état `etsi` ; sa bande toute verte est retirée.
6, 7. **Corrigés par la décision du pilote** : `degage` retiré (plus aucun appel `sousFab` hors définition) ; marge du bas
   142 px = haut du + (70 + 56) + 16. Rien ne saute, la section Brassins suit Achats sans trou (`c2h7-geste-390`).
8. **Corrigé** : à 390 la courbe se replie en bande de 64 px (bouton ⌄ pour la déplier) ; la période et ses segments sur une
   ligne ; six semaines par défaut ; hypothèses en tête des filtres ; un nom par ligne. Au repos : S47 à S51 entières.
9. **Corrigé** : axe des mois en initiales (D 2027 F M A…) quand un mois fait moins de 30 px (390, paysage) ; abrégés à 1280.
10. **Corrigé** : « à te permettre » choisit une place hors des deux poignées ; absent de la bande repliée.

## Restes vus (non corrigés)
- c2h7 390 : les hypothèses (~340 px) poussent les filtres hors de l'écran ; on ne voit plus les puces sans faire défiler.
  À essayer : une version courte des hypothèses (« 4 180 · +120 · 2 j exemple »).
- g7 repos 390 : les étiquettes du dessous ajoutent des sous-rangées. La rangée Libre passe donc sous le + (S52 à S1) jusqu'à
  60 px de défilement. C'est accepté par la décision du pilote, mais c'est la réponse de l'écran.
- g7 geste 390 : l'étiquette du dessous trace un trait plus large que son texte (« Fête de village »).

## Captures (ouvertes)
`p7/g7/` et `p7/c2h7/` : `*-repos-390`, `*-geste-390`, `*-paysage-844`, `*-repos-1280`, chacune en clair et en cave ; plus
`g7-etsi-390` et `g7-etsi-cave-390`. J'ai ouvert une à une g7-geste-390 et c2h7-repos-390 de la première version.
Planches ouvertes : `p7/_pl-390.png` (c2h7 repos et geste, g7 repos clair et cave) et `p7/_pl-autres.png` (g7 paysage,
c2h7 paysage cave, g7 et c2h7 à 1280). Non ouvertes : g7-etsi, les geste en cave, c2h7-repos-cave-390.
Sortie : `capt.mjs` → CAPTURES OK (à chaque série, après correction d'une erreur de syntaxe et d'un `tn` non défini).
Non joués : `controle-panel`, `controle-commun`, `controle-choix`.

Prédiction : « Le glisser du frigo avec les croix et les coches, c'est ça. Et je vois enfin mes semaines. Mais où sont passés mes filtres ? »

DÉCISION À PRENDRE : à 390 sur c2h7, faut-il donner la priorité à cinq semaines visibles, avec les hypothèses avant les filtres,
ou aux filtres visibles d'emblée ?
CONNAISSANCE : aucune
LEÇON PROPOSÉE : un assemblage par chaînes doit tester ses remplacements sur le texte produit, pas sur le code source qui l'écrit
(guillemets et `\n` échappés : deux échecs ici).
