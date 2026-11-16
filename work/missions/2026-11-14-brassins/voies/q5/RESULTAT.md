REPRISE : work/missions/2026-11-14-brassins/voies/q5/RESULTAT.md — code gfc et e3gb fini, G2 et G3 verts, 49 captures prises mais NON ouvertes ; reste à les juger, cocher G1, finir 5 non bloquants.

# État (agent 3)

## Code (tout typé, tsc hors functions : OK ; `npx vitest run port-` : 21 fichiers, 210 tests verts, sortie dans tests.txt)
Fiche gfc (agent 2, voir plus bas) + ce tour :
- e3gb n° 1 : `carnet/PictosHoublons.tsx` (neuf) : `famillesDuHoublon(batch, nom)` = signature + famille à égalité de part (Citra citrus+tropical, Mosaic berries seule, hors catalogue : aucun) ; `LignesDryHop` rendu sur la ligne `data-dry-hop` de `CarnetFil.tsx` (texte inchangé « Dry hop Citra 100 g + Mosaic 80 g ») ; `<JeuPictos/>` posé dans `CarnetFil` ; pictos aussi dans `DossierPied` (`DossierFil.tsx`, JeuPictos local).
- e3gb n° 2 : `CarnetFil.tsx` : `nbAcceptables`, `toutRange` (fait + rien d'acceptable) -> titre « Carnet à jour », ligne « rangés depuis ta note de … », `data-etat="rangement"` ; `CarnetPied` rend le toast « n rangés · … Annuler » au lieu de « Accepter les 0 » ; le morceau sans jour reste dans le fil avec « Quel jour ? ». e3gb n° 5 : « n morceaux à placer » en `text-xl` pendant le geste.
- e3gb n° 4 : `carnetModel.construireFil` : puce « éch. » (tempC), puce « cuve » (`cuveDansNotes`), bulle de note sans la ligne de cuve (`notesSansCuve`).
- Bug corrigé : `BatchDetailSheet.tsx`, les 3 hooks `toastStock` étaient après le `return null` (cassait `port-p7-phrase-rebrasser`, « Rendered more hooks ») ; remontés avant le retour.

## Tests neufs (15 + 3)
- `tests/unit/port-q5-destockage.test.ts` (8) : Citra seul sort (stock Mosaic intact, Mosaic reste réservé, pas de `remaining`), le second ferme l'étape, refus sans ligne, titre « ZZ Citra ajouté, » + accent « ZZ Mosaic demain », cuve rangée dans les notes, courbe cuve.
- `tests/unit/port-q5-carnet.test.tsx` (7) : pictos (modèle et rendu), pied « 5 rangés · 1 envoyé à la Stout » sans « Accepter les 0 » ni bouton grisé, « Carnet à jour », « 2 morceaux à placer » `text-xl`, puces « éch. »/« cuve ».
- `tests/unit/port-q5-taches.test.ts` (3) : case de tâche écrit/retire l'entrée dans `notesBrewDay`, relue par la fiche.
- Les tests d'intégration `tests/integration/batch` ne sont pas rejoués ce tour (2 rouges connus : `batchFollowUp`, `batchAm4Am5`).

## Bancs (port 3115, fixtures ZZ, fait)
- `banc.mjs` (fiche gfc : repos, geste, tâche, fait, mesurer ×3, accès) -> « BANC OK 20 captures » ; sonde du geste : `{"toast":"Stock Citra −100 g Annuler","cases":1,"feuilleIntercalee":false}` (390 et 1280) ; journal.json : aucun geste sans effet, aucune erreur console.
- `banc-carnet.mjs` (e3gb : repos, geste, rangement, dossier, dossier-bas) -> « BANC OK 29 captures » au total dans `captures/` ; journal-carnet.json sans erreur.
- Captures : `captures/gfc-*-app-<390|1280>-<clair|cave>.png` et `captures/e3gb-*`.

## Reste à faire (ordre)
1. **Ouvrir chaque PNG** (une fois) à côté de la maquette (`voies/gf/gfc/`, `voies/e3g/e3gb/`), question « combien et quels problèmes ? » ; corriger. À ouvrir d'abord : `e3gb-repos-app-390-clair` (pictos Citra, Mosaic), `e3gb-rangement-app-390-clair` (titre « Carnet à jour », pied « n rangés … Annuler », morceau sans jour), `e3gb-geste-app-390-clair` (titre sur une ligne), `gfc-repos-app-390-clair` et `-1280-clair` et `-390-cave`, `gfc-geste-app-390-clair` (toast, Mosaic garde sa case), `gfc-tache-app-390-clair`, `gfc-mesurer-app-390-clair` (courbe, 3 curseurs), `gfc-repos-bas-*`.
2. **G1** : écrire ici `- [x] gfc n° 1` à `n° 5` et `- [x] e3gb n° 1` et `n° 2` (7 lignes, format `- [x] <id> n° <k> : <correction>`) seulement après la vérification sur rendu ; sinon dire ce qui reste. Vérif : `node -e` de GATES.md G1 attendu « COCHE OK 7/7 ».
3. Non bloquants restants : gfc 9 (« Garde 2 °C si stable » sur une ligne `text-[13px]`), e3gb 6 (fond beige des lignes réservées, `fond` dans `Rang`), e3gb 7 (libellé « Passer en garde » : `BATCH_STATUS[suivant].label` ne convient pas), e3gb 8 (« Budget · non estimé »), gfc 8 (étiquettes 1,018/1,016 sur capture), gfc 13 (retirer `BatchSchedule` en fermentation).
4. Rejouer `npx tsc --noEmit` et `npx vitest run port- --reporter=dot > …/tests.txt` après toute correction (G2, G3).

## Fiche gfc (agent 2, inchangé)
- `fermentation/cuve.ts`, `destockage.ts` (plan de déstockage d'un seul houblon), `modele.ts` (ContexteStock, statut par houblon, tâches faites dans `notesBrewDay`, cuve dans `gravityLog[].notes`, titre « Citra ajouté, » + accent), `GrapheTemps.tsx` (trace « °C cuve », losange et point verts), `FicheFermentation.tsx` (accès dans l'en-tête, case 44 px par tâche, toast « Stock <nom> −<g> g » + Annuler, curseurs °C cuve et °C échantillon), `BatchDetailSheet.tsx` (`destockerHoublon`, `basculerTache`, `PanneauMesure` au pied, titre « <nom> en fermentation », « Corriger les mesures » sous le Dossier).

## Doutes
- Toast à 1280 : posé en tête de la grille des tâches (`gridRow: 2`, colonnes 1 à 6) ; la maquette le met colonnes 1 à 5 ligne 1 : à juger sur capture.
- Le portail de l'en-tête insère un nœud dans le `header` de `Sheet.tsx` (hors Possède, non modifié). DÉCISION À PRENDRE (pilote) : ajouter un vrai emplacement `actions` à `Sheet.tsx` (3 lignes).
- ACCORD à écrire : tâches cochées rangées dans `notesBrewDay` (entrée « Cuve ») et visibles au fil du Carnet ; cuve d'un relevé rangée dans `gravityLog[].notes` (première ligne `Cuve 19,2 °C`) ; aucun champ Firestore neuf.
- Les relevés enregistrés par q1 ont leur `tempC` lu comme température d'échantillon : la courbe « °C cuve » reste vide pour eux jusqu'au prochain relevé avec cuve.
- Deux jeux de symboles `JeuPictos` peuvent coexister dans le DOM (fiche et carnet) : mêmes ids, même contenu, sans effet visible.

CONNAISSANCE : `Sheet.tsx` n'a ni slot `actions` ni titre en nœud ; `completeBrewStock('remaining')` consomme toutes les lignes réservées d'un coup, `planDestockageHoublon` en sort une seule ; `gravityLog[].tempC` est la température de l'échantillon, la cuve se range dans `notes` ; `RecipeSnapshot` n'a pas `equipmentRefs` ; la rangée « aujourd'hui » du fil n'existe que si une entrée y tombe.
LEÇON PROPOSÉE : un hook ajouté dans un composant doit se poser avant tout `return null` ; le test voisin (`port-p7-phrase-rebrasser`) l'a détecté, d'où `npx vitest run port-` en entier après chaque retouche de `BatchDetailSheet.tsx`.
