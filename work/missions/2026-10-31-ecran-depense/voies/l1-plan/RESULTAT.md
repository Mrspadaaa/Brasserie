OK — plan D v2 : flux aiTask, fusion « sa saisie l'emporte » spécifiée, appariement mesuré 183/184

L1-PLAN OK — (a) un appel en flux ; v2 après RELECTURE (B1 à B3, M1 à M7, m1 à m7) — voies/l1-plan/PLAN.md

## Fichiers écrits (tous dans `voies/l1-plan/`)
- `PLAN.md` (v2).
- `octets.mjs`.
- `apparier.ts` (M3), qui écrit `gen/invoiceVisionReview-copie.ts`, une copie de production avec un export ajouté.
Les trois derniers sont ignorés par Git. Je n'ai touché ni au code, ni à `functions/src/`, et je n'ai fait aucun appel.

## Reprise v2 : où chaque point est traité dans PLAN.md
- **B1** (§ 4 bis, « La base ») : la base est l'instantané du brouillon posé par `applyOutcome(provisoire)`, tenu à jour par la seule
  traduction. Le final passe par le même calcul extrait (`lignesDeLecture`). Témoin E1.
- **B2** (§ 4 bis) : deux tables de cellules, en-tête et rangée, avec la source et le registre de chacune (`reviewedFields`,
  `descriptionSource`, `paymentDateBasis`, `manuallyClassified`, `reglees` « TVA| »). `alphaPct` et `vatCode` suivent le résultat
  remappé. Témoin E2.
- **B3** (§ 4 bis) : une table unique « rang final → id ». Elle s'applique à `points` (`ligne`, `lignes`, `champs`, `cle`, et la
  `signature` recalculée), à `skippedIds`, aux `remarques`, aux `rejets` et aux `items`. Les lignes ajoutées prennent
  `line-${nProvisoire + k}` ; le plan dit pourquoi. Témoin E3.
- **M1** (§ 4 ter) : la table des états. `verif` est distinct de `busy` ; `showForm` passe à vrai au morceau ; `scanLocked` reste vrai ;
  « Fermer » est permis ; « Rattacher » et « Changer » sont désactivés ; `attach` et `lirePages` gardent un seul `await`.
- **M2** : la fin de partie est bornée côté client (150 s, ou la seconde reprise), dans la forme de « 3.8 en échec », **à montrer**.
  Aucun bornage côté serveur : `invoiceScanBudget.ts:26` le refuse exprès. C'est la décision (3).
- **M3** (§ 2 bis) : `APPARIER 12/14 … 183 lignes rapprochées sur 184 provisoires (99.5 %) et 190 finales (96.3 %) ; sans paire
  1 provisoires, 7 finales … repêchables par la position 1`. Le repli par la position est dans S, avec le témoin S7.
- **M4** : plus de `apresProvisoire`. Un jeton par appel, posé sur le final seulement s'il a été calculé dans cet appel. La règle d'un
  final sans jeton est écrite, avec les témoins C5 et E4.
- **M5** : E possède aussi `Verdict.tsx`, `etat.ts` et `types.ts`. Chaque voie a son fichier de test. L'ordre : r4-port-d (D311), puis
  l2-lignes, puis E, puis B ; n3-ht après E.
- **M6** : l'appel `traduireNoms` de plus est borné à environ 0,005 CHF, sur environ 10 pièces sur 12 (mesuré : 10 sur 12 ont un nom
  changé ou une ligne ajoutée). La fusion incrémente `nomsJeton` et efface `nameFr`. Témoin E11.
- **M7** : B réécrit le shim de page, avec un `ReadableStream` construit dans la page et un délai réglable.
- **m1 à m7** :
  - m1 : `onProvisoire` est le cinquième paramètre ;
  - m2 : la puce compte une fois chaque cible ;
  - m3 : la fusion n'appelle jamais `applyOutcome`, garde `choixGroupes`, et traite une rangée qui a le focus comme touchée ;
  - m4 : noté, hors de E ;
  - m5 : les octets sont des tailles de texte brut ;
  - m6 : `reglees`, par signature remappée ;
  - m7 : une PWA ancienne fonctionne, sans fil ni puce.

## Critères
1. J'ai relu les lignes neuves sur le worktree. J'ai corrigé deux écarts : la garde de `nomsJeton` est à la l. 370, et « Rattacher »
   aux l. 991-992.
2. Le flux est prouvé : inchangé depuis la v1, la relecture le confirme.
3. Les temps viennent de m-lenteur, sans temps neuf. Le 0,005 CHF et le 4,1 s de la traduction viennent de D280
   (`decisions.md:1241`), et ne sont pas des temps de lecture.
4. Pour les fichiers de la voie, `git status --short --ignored voies/l1-plan` donne :
   - ` M PLAN.md` ;
   - `?? RELECTURE.md` et `?? RESULTAT.md` ;
   - `!!` pour `apparier.ts`, `gen/` et `octets.mjs`.
   Je n'ai écrit nulle part ailleurs.

## Essais
`apparier.ts` a tourné une fois, sans erreur. Il n'a fait aucun appel.

DÉCISION À PRENDRE : voir PLAN.md. (1) Les cas « à montrer » qui restent : je recommande d'ajouter l'en-tête corrigé et la fin de partie
à la page l2-lignes. (2) (c3) : non. (3) La borne côté serveur d'un `running` : non dans ce port.
CONNAISSANCE : voir PLAN.md (le flux, et l'appariement 183/184).
LEÇON PROPOSÉE : celle de RELECTURE.md, reprise en fin de PLAN.md.
