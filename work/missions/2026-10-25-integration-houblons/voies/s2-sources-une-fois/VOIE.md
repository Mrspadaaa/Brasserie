# Voie s2-sources-une-fois : les sources à un seul endroit, la carte qui se referme, plus d'anglais

Agent : auteur (Sonnet), code de l'app. Le critique (Fable) jugera ensuite les captures. Corrige ce qui est **en production depuis
D95**.

## Ses mots (26.10), sur sa capture
Capture : `work/missions/2026-10-25-integration-houblons/voies/brasseur-sources-partout-lotus.jpg`. C'est la carte dépliée de Lotus
(J+14, à froid, 144 g), dans l'étape Houblons, Ma bière, `src/ui/hopIndex/maBiere/Carte.tsx`. Ouvre-la.

- « Tu as ajouté à beaucoup beaucoup trop d'endroits les sources. Regarde juste ici, ça surcharge et ça apporte rien. »
- « Aussi cette vue doit de ferme dans on ouvre ou change de vue. » Lecture : elle doit se fermer quand on ouvre une autre carte
  ou qu'on change de vue.
- « Mais sur les info de houblons, un endroit qui renvoie la source suffit. C'est tout »

Ce qu'on voit sur sa capture : chaque mot porte ses sources (« vanille Beer Maverick, Hopsteiner, Charles Faram », « crème Beer
Maverick », « fruité Hopsteiner », « doux Hopsteiner »), et les huiles aussi (« Hopsteiner 2025 »). On voit encore « orange · lemon »
et « tropical fruits » en anglais (D160 n'est pas fini).

## Ce qu'il faut faire
1. **D168, les sources une seule fois.**
   - Inventaire. Dans tous les écrans d'info de houblon, liste chaque endroit qui affiche un nom de source au premier plan ou à un
     toucher, avec fichier et ligne : Ma bière (carte, bande, légende), la fiche, Substituer, Comparer (Valeurs), Suggérer,
     Dryhopper. Les lecteurs connus sont `src/ui/hopIndex/fiche/sources.ts`, `fiche/complements-ui.ts`, `commun/sourcesMesures.ts`
     et `commun/plagesSources.ts`, mais cherche aussi les autres.
   - Règle, lecture étroite : sur les infos d'un houblon (mots, valeurs, huiles, α), **aucun nom de source** à côté d'un mot ou d'une
     valeur. Les noms vivent à **un seul endroit**, la section « Sources » de la fiche du houblon, où le lien Beer Maverick existe
     déjà (t12e). Ailleurs, au plus un renvoi vers cet endroit, et seulement s'il manque.
   - Les traits par plage de source qui diffère restent : il a demandé de voir les plages différentes (Lotus, β), et leurs noms ne
     s'affichaient qu'au survol. Enlève aussi les noms du survol si l'écran a déjà son renvoi « Sources ».
   - Les citations d'études dans les feuilles de Dryhopper (Maye 2016, H68) **ne sont pas des infos de houblon** : n'y touche pas.
     Note-les dans RESULTAT.md comme une question pour lui.
   - Le marqueur « ◇ » et la mention « autres n % » restent tels qu'ils sont : seuls les noms de sources partent.
2. **D169, la carte qui se referme.** La carte dépliée de Ma bière se referme dans trois cas :
   - quand on ouvre une autre carte (une seule ouverte à la fois) ;
   - quand on change de vue (onglets Ma bière, Suggestions, Comparer, ou ouverture d'un outil) ;
   - quand on revient sur la vue : elle est alors fermée.

   Vérifie le même défaut dans les autres listes à cartes dépliables de l'étape Houblons, et dis ce que tu trouves.
3. **D170, plus d'anglais.** « orange · lemon » et « tropical fruits » doivent passer en français, par la table de traduction de t1
   (`voies/t1-traduction/`). Trouve pourquoi ce chemin y échappe. Contrôle : pour les 318 houblons, aucun mot anglais dans les mots
   par famille de la carte, en élargissant `tests/unit/hopIndexV4/traductionMots.test.ts`.

## Contrôles qui échouent d'abord (L13), sur HEAD
- **Un test ou un contrôle Chrome** (`tests/integration/controle-sources-une-fois.mjs`), sur la carte de Lotus dépliée, sur la fiche
  et sur Substituer : aucun nom de source connu au premier plan d'une carte ou d'une rangée, hors de la section « Sources » de la
  fiche. Les noms connus sont Beer Maverick, Hopsteiner, Charles Faram, Yakima, YCH, BarthHaas, John I. Haas, Hop Products
  Australia, NZ Hops, Freestyle, Crosby, Beer Analytics, etc.
- **Un test** : ouvrir une carte ferme l'autre, et changer de vue les ferme toutes.
- **Le test de traduction** élargi.

## Vérifier dans l'app (règle frontend)
- Captures avant et après, en 390 × 844 : la carte de Lotus dépliée, la fiche (section Sources), une rangée de Substituer. Ouvre-les.
- Jeu à rejouer : ouvrir Lotus, ouvrir une autre carte, changer d'onglet, revenir.

## Critères
- `npx vitest run tests/unit/hopIndexV4` vert.
- `npm run build` vert.
- Les nouveaux contrôles rouges sur HEAD, puis verts.
- `node work/refonte-frontend/v4/tournoi/outils/controle-etats.mjs prototypes/houblons-v4/maquettes/parcours` après `construire.mjs`.
  Si un état change, mets-le à jour avec preuve, comme e3.

## Possède
- `src/ui/hopIndex/maBiere/`, `src/ui/hopIndex/fiche/`, `src/ui/hopIndex/commun/sourcesMesures.ts`,
  `src/ui/hopIndex/commun/plagesSources.ts`.
- Dans `src/ui/hopIndex/substituer/`, `comparer/` et `suggerer/` : seulement les lignes qui affichent des noms de source.
- La table de traduction de t1.
- Les tests neufs, et `traductionMots.test.ts`.
- `work/refonte-frontend/v4/choix/etats/`, si un état change.
- `work/missions/2026-10-25-integration-houblons/voies/s2-sources-une-fois/`.

Ne touche pas `src/domain/hopIndex/v4/` : les voies g2b et g2d sont en cours. N'écris aucun code par heredoc ni par `node -e`. Pas de
`git mv`, pas de `git stash`. Écris RESULTAT.md tôt. Retour en une ligne.
