# Voie n2-pages — son choix B : plusieurs captures pour une seule dépense, bouton noir coupé en deux (D291)

Agent : `auteur` (Sonnet). Plafond : 120 tours (plan : 40 au plus). Deux temps, comme `../COMMUN.md` § « Deux temps » : relis tout
`../COMMUN.md` (il vaut ici, sauf « L'écran n'est pas refait ici » : l'interface de ce choix est dite plus bas, sa maquette est donnée).
Aucun commit, aucun déploiement, aucun appel réseau hors localhost, Gemini toujours simulé. Copie isolée pour les tests :
`node work/missions/2026-10-31-ecran-depense/voies/p3c-port/copie.mjs "<commande>"` (une commande simple par appel, sans `;` ni redirection).
**Le code attend la voie n1-nom-fr** (elle possède aussi `ExpenseSheet.tsx`, `purchaseEntry.ts` et le banc bout en bout) : le temps 1 se
fait maintenant ; le temps 2 part quand le pilote te l'envoie, sur l'arbre où n1 est posé.

## Ses mots (SPEC-BRASSEUR, mot pour mot) — règle n° 1 : son choix est respecté, sa maquette reprise telle quelle
- 02.11, sur la page `choix-captures` : « Variante b, mais dans la première vue, pouvoir choisir entre envoyé 1 ou plusieurs documents,
  dans 99% des cas c'est que 1 document » ; puis « Le bouton noir est splitter en 2 ».
- 02.11, sur `choix-captures/retenue/img/1-entree-f3.png` : « Celle là que je veux ».
- 01.11 : « les tests local sont très loin de la vérité » (le banc lisait trois captures en trois images, l'app n'en prend qu'une).
- 01.11 : « C'est pas du tout compacte, comme demandé » ; « Pas besoin d'afficher autant ».

## La maquette (à reprendre telle quelle ; ouvre chaque image)
`work/missions/2026-10-31-ecran-depense/choix-captures/retenue/` : `RESULTAT.md`, `maquettes/*.html` (sources), `img/*.png`.
- Entrée : **forme 3** (`img/1-entree-f3.png`) : le bouton noir coupé en deux, « Un document » (large, le geste d'aujourd'hui, la lecture
  part tout de suite) | « Plusieurs » (étroit, picto pages). Le reste de l'entrée ne change pas. Les formes 1 et 2 sont écartées.
- Un document : identique à aujourd'hui (`img/2-un-document.png`) ; dépôt par glisser d'un fichier : comme aujourd'hui.
- Plusieurs : `img/3-plusieurs-1.png`, `img/4-plusieurs-3.png` : vignettes numérotées avec ×, tuile « + page », « Lire N pages », sans
  délai ; la partie basse d'aujourd'hui dessous.
- Après « Lire » : `img/5-lecture.png`. Lue : `img/6-lue-repos.png` (la pile « N » à la place de l'icône du document, la preuve
  « ✓ N pages lues ») et `img/7-lue-pages.png` (au toucher de la pile, un panneau compact : vignettes ~56 px sur une ligne, « Changer »).
- Le verdict du critique sur cette maquette : `critique/VERDICT-retenue-pages.md` (ses majeurs sont des consignes ; ses manques listés —
  photo d'une page suivante, retrait, ordre, erreur, hors ligne — se tranchent dans le plan, au plus près de B, sans écran neuf).

- **Tranché par le pilote (majeur e-t12, réversible)** : la photo d'une page suivante passe par « + page », qui ouvre un `input` image
  **sans** `capture` (iOS et Android proposent alors « Prendre une photo » à côté des fichiers) ; aucun bouton ajouté à B. Repli si
  le téléphone ne le propose pas : à dire dans RESULTAT, avec la capture du sélecteur.

## Les faits du code (pilote, 02.11)
- L'entrée ne prend qu'un fichier : `fileInput` sans `multiple`, `onChange` lit `files?.[0]`, le dépôt `dataTransfer.files?.[0]`
  (`src/ui/finance/ExpenseSheet.tsx` ~l. 912 et ~l. 993) ; l'appareil photo (`cameraInput`, `capture="environment"`) aussi.
- La lecture : `src/services/geminiScanner.ts` ~l. 88, `AiClient.run({ task:'scanInvoice', tier:'fast', file })` ; côté serveur
  `functions/src/ai.ts` : `file?: { data; mimeType }` (l. 85), `scanInvoiceSafely(uid, suppliedFile, …)` (l. 104),
  `validateInvoiceFile`, `MAX_FILE_B64 = 11_000_000` (l. 176), une seule partie `inlineData` par appel (~l. 200).
- Le banc lit déjà plusieurs fichiers par cas (`scripts/banc-lecture-facture.ts`, `files`, l. 42) : c'est la forme mesurée
  (doc10 : trois images 11/12 au banc, contre le PDF de trois pages 9/12 en ligne).
- Le justificatif : un seul fichier au Drive, 4 Mo au plus (`src/services/driveFileStore.ts`, `MAX_DRIVE_ORIGINAL_BYTES`, l. 51, 269,
  281) ; `jspdf` est déjà une dépendance (`financeExport.ts`, `receiptService.ts`). La file hors ligne des preuves : `proofQueue`.
- Le cache de lecture (D273c, D274) a une clé par contenu : plusieurs pages = une clé sur toutes les pages, dans leur ordre.

## Ce que B demande (les défauts visés)
- **P1 — l'entrée coupée** : forme 3 telle quelle. « Un document » garde exactement le parcours d'aujourd'hui (aucun toucher de plus,
  mêmes tests verts). « Plusieurs » ouvre la rangée.
- **P2 — la rangée** : chaque page ajoutée par « + page » (un fichier à la fois, image ou capture) ; × retire une page ; l'ordre est celui
  d'ajout (plan : dire si un réordonnancement est nécessaire, sans glisser si B ne l'a pas) ; « Lire N pages » lance une seule lecture
  de toutes les pages. Plafond de pages et de taille, dit et testé.
- **P3 — la lecture de plusieurs pages** : une lecture, toutes les pages envoyées comme images séparées (comme le banc), les deux
  Flash-Lite et la 3.8 comme aujourd'hui. Côté serveur, `scanInvoice` accepte une liste de fichiers ; un fichier seul reste accepté tel
  quel (compatibilité de l'app en ligne avant mise à jour). **Le redéploiement d'`aiTask` attend son accord** : le plan dit ce que le
  client fait tant que le serveur ne prend qu'un fichier (repli honnête, jamais une lecture d'une seule page présentée comme complète).
- **P4 — un seul justificatif** : les pages deviennent un seul PDF (jsPDF, une page par image, dans l'ordre) gardé au Drive, sous
  4 Mo (réduction des images si besoin, dite et testée) ; la file hors ligne garde ce PDF comme aujourd'hui un fichier.
- **P5 — la trace** : la pile « N » dans l'en-tête, le panneau des pages au toucher, « Changer », la preuve « ✓ N pages lues ».

## Les pièges à trancher dans le plan
- Le geste des 99 % ne change pas : tous les tests et cas bout en bout d'aujourd'hui (un fichier) restent verts sans modification.
- Le cache (même pages, autre ordre = autre lecture) ; une page retirée après « Lire » ; « Changer » sur une dépense de plusieurs pages.
- Hors ligne : la lecture demande le réseau ; la dépense peut-elle partir sans lecture avec ses pages (comme « Saisir sans
  justificatif » plus le PDF) ? Le plan tranche, au plus près d'aujourd'hui.
- Taille : trois captures de téléphone en PNG dépassent vite 4 Mo ; dire la conversion (JPEG, échelle) et ce qu'elle coûte à la lecture
  (les images lues sont les originales, le PDF est la preuve).

## Possède (temps 2, après n1)
`src/ui/finance/ExpenseSheet.tsx` (l'entrée, la rangée, la trace), `src/ui/depense/**` (si la trace y vit, par exemple `Entete.tsx`),
`src/services/geminiScanner.ts`, `src/services/aiClient.ts` (la requête à plusieurs fichiers), un module nouveau
`src/services/pagesJustificatif.ts` (assemblage PDF), `functions/src/ai.ts` (la liste de fichiers ; rien d'autre), `tests/unit/depense/pages/**`,
`functions/test/**` (un test de la liste, sans Gemini), `scripts/check-invoice-journey-emulator.mjs` (un cas nouveau `pages`, hors
`ALL_CASES` s'il le faut, les autres inchangés), `work/missions/2026-10-31-ecran-depense/voies/n2-pages/**`.
Si un autre fichier doit changer, le plan le dit et le pilote tranche.

## Critères (le pilote les rejoue)
1. Les témoins P1 à P5 échouent sur l'arbre d'aujourd'hui (« TEMOIN AVANT : »), puis passent.
2. `npx vitest run tests/unit/depense --maxWorkers=2` (copie isolée) : tout vert ; les tests de `functions/` touchés aussi.
3. `npx tsc --noEmit -p tsconfig.json`, le tsc de `functions/` et `npm run build` (copie isolée) : 0 erreur.
4. Bout en bout sur l'émulateur (`voies/e-bout/lancer.sh`, comme n1), cas `pages` : trois images fictives (aucune image de ses pièces dans
   Git ; une pièce du banc hors Git, lue par chemin, si le rejeu l'a), « Plusieurs », trois « + page », « Lire 3 pages », la dépense lue
   avec la pile « 3 », « Confirmer », un seul PDF de trois pages dans le Drive émulé. Puis doc14 et les six autres pièces par
   « Un document » : 0 KO. Aucun « hmr update » ni « page reload » dans vite.log pendant la passe (L17). Ouvre les captures à 390
   tactile et à 1280 (L12), côte à côte avec `retenue/img/*` : écris les écarts.

## Rendre
`RESULTAT.md` (format de `../COMMUN.md` § « Rendre »). Temps 1 : `PLAN.md`, puis `PLAN PRÊT — <n> défauts`. Temps 2 : une ligne,
`N2 OK — …` ou `N2 ECHEC — …`.
