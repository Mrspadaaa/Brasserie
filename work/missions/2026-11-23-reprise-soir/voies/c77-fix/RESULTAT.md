OK — c77Regles vert (53 verts / 58, 5 sautés) : une fonction de date `dateDite`, prix CHF et CHF/kg, arômes de la variété, Choisir, tableau, fil

# RESULTAT c77-fix

Commit du code : `e926430fa` (par chemins). Registre BUGS (13 lignes) et ce fichier : commit suivant.

## Plan (règle, endroits, correctif)
- **R103 (R77-1)** Comparer, carnet de matière : `Comparer.tsx` ajoute une ligne « CHF/kg » (le kilo rendu, ✓, épinglée, avant) et la ligne « prix CHF » dit le prix de ce qu'on achète (« ≈3,69 », sous lui « 50 g », même chiffre que la fiche) : une ligne, une unité. Helper : `quantiteDuChoix`, `centimesRendus` (existants).
- **R104 (R77-2)** une seule source par valeur : un article dont la page ne dit pas les arômes reprend ceux que le carnet dit déjà (`aromesCommuns`, le bloc « Arômes lus sur les pages ») : sur sa fiche (puces, mot « arômes · variété », plus de « Non publié : Arômes ») et dans Comparer (cellule « … · variété », donc une différence, pas un « identique »). Marqué comme repris, jamais présenté comme lu sur sa page.
- **R105 (R73-25)** UNE fonction de date : `src/domain/carnets/dateDite.ts` (`jourDit`, `semaineDite`, `moisDit`, `dateDite`). Règle : l'année est dite quand elle n'est pas celle d'aujourd'hui, l'année d'une semaine est celle de son jeudi (ISO), jamais l'année en cours. Branchée sur : Quand (`RubriqueQuand`, y compris le jour du Planning), la liste (`quandDe` de `ListeCarnets`), À faire (`quandDite` de `afaireRegles`), la puce du genre (`versQuand`, `EnTeteGenre`, paramètre `annee`). `texteIntention` (`domain/horizons.ts`) n'est pas touchée : elle sert l'assistant de brassage et la feuille d'ajout du Calendrier (sa règle des 12 mois y reste, tests `horizons`).
- **R106** : R77-3 carte de l'autre sous Choisir : « ≈3,69 CHF » (même règle que Comparer) ; R77-4 rang « ? » comme le tableau quand le prix au kilo n'est pas lu ; R77-5 cellule prix sans bouton, « ? · à relire » (carnets de matière) ; R77-7 « Brau » partout et « Choisir chez Brau » (`vendeurCourt`) ; R77-8 bulle « rattachée à MotlerHops » (`FilCarnet`) ; R73-9 fiche Motler : une fois « TVA d'import » et une fois 73,8 (la ligne cochée de « je prends » renvoie à l'offre, « offre ↓ ») ; fiche Brau : arômes une fois (puces, plus la grille) ; R75-3 `nomAuTableau` (40 signes, dimensions à la fiche, nom entier en `title`) ; R75-6 `estChiffres` (chasse fixe aux seuls chiffres) ; R73-10 la ligne « prix » de « Ses autres valeurs » ne redit plus le montant, seulement sa place ; R73-13 « Choisir · Gastro Held » dans Comparer (carnet non pesé, articles passés).
- R77-6 (liste filtrée) : test déjà vert (espace insécable) ; la coupe vient du CSS à 390 px, à voir en ligne ; ligne laissée ouverte au registre.

## Fichiers écrits
`src/domain/carnets/dateDite.ts` (neuf), `src/ui/carnets/{Choisir,Comparer,EnTeteGenre,FicheArticle,FilCarnet,ListeCarnets,RubriqueQuand,TableauCarnet}.tsx`, `src/ui/carnets/{afaireRegles,tableauRegles}.ts`, `tests/unit/carnetsLot5.test.ts` (une attente, voir conflits), `work/missions/BUGS.md` (13 lignes : R77-1 à 5, 7, 8 ; R73-9, 10, 13, 25 ; R75-3, 6), ce dossier. `src/ui/finance/UpgradeWorkspace.tsx` modifié avant moi : non touché. Aucun fichier du Calendrier écrit : la fonction de date partagée vit dans `src/domain/carnets/`, elle importe `domain/calendrier/dates` en lecture.

## Critères
- `npx vitest run tests/unit/c77Regles.test.tsx` : `Tests 53 passed | 5 skipped (58)` (les 5 : `it.runIf` des formes Planning, pas de date dans la liste).
- Lot rejoué en fin de voie (99 fichiers : carnets*, c48..c77Regles, noteRegles, c70RangementIA, c68Realises, lot3CarnetOuvert, virgule-transversale, proprietes, stocksMaterielUneRangee, horizons, pxPrix*) : `Test Files 99 passed (99) · Tests 2406 passed | 8 skipped`.
- `npx tsc --noEmit` : les 2 erreurs connues seulement (seedData GanttTask, virtual:pwa-register). `functions/` : compile sans erreur.
- `node scripts/agents/controle-bugs.mjs` : `BUGS OK : 2437 bugs, 614 ouverts, 202 sources`.
- `node scripts/controle-liste-compacte.mjs` : voir la fin.

## Essais
R105 : 1 essai (tout vert). R106 : 2 essais (R77-3 : ≈4 CHF rendu arrondi, remplacé par le prix au centime du sachet). Régressions de l'ancien lot : 3 tours de correctifs (ordre des lignes de Comparer, bouton nommé, « arômes » en mot, détail de l'offre).

## Conflits avec des tests plus anciens (cités, tranchés au plus petit changement)
1. `tests/unit/carnetsLot5.test.ts` : attendait `quandDe(2027-02-01, 2026-11-23) = 'vers févr.'` : c'est exactement la forme que R105 (c77 cas 4b : « vers mars 2027 ») rouvre. Attente changée en `'vers févr. 2027'` + une garde `'vers déc.'` (même année). Seul test modifié.
2. c77 R77-5 (aucun bouton dans la cellule prix) contre c48 R1 et `pxPrixEcrans` (Relire et Escalader dans cette cellule) : réconcilié par le contexte : sans bouton dans un carnet de matière pesée (houblons, où la fiche les porte), boutons gardés ailleurs (Chambre froide). DÉCISION À PRENDRE ci-dessous.
3. c77 R73-13 (Choisir nommé) contre `carnetsGreffeP2Cartes` (Comparer sans `articles` : « Choisir » nu) : le nom du vendeur ne s'ajoute que si les articles sont passés (toujours le cas dans l'app).
4. c77 R73-9 (73,8 une fois) contre c74b R93 et c75 R75-4 (« 73,8 CHF/kg » dans l'offre) : la valeur reste dans l'offre ; la ligne cochée de « je prends » dit « offre ↓ ».

## Doutes et limites
- Rendu à 390 px non vérifié (jsdom ne mesure rien) : à voir en ligne par le pilote et le critique : ligne « CHF/kg » avant « prix CHF » dans Comparer (ordre voulu par les tests de classement, c66 R53), « offre ↓ » dans « je prends », libellé « arômes · variété », nom court au tableau, bouton « Choisir chez Brau ».
- `nomAuTableau` : deux noms longs qui raccourcissent pareil gardent leur nom entier (pas de doublon muet). Il coupe à la première dimension (« 1800 x 1500 mm… ») : un nom où la dimension précède le mot qui distingue serait coupé trop tôt.
- Les arômes repris de la variété supposent qu'un carnet de matière pesée compare une seule variété (hypothèse du bloc existant « lus sur les pages »). Si un jour un carnet mêle deux variétés, la reprise serait fausse : `aromesCommuns` ne la teste pas.
- `EnTeteGenre.versQuand` : le troisième paramètre `annee` est facultatif (tests existants appellent sans) ; sans lui, jamais d'année.

DÉCISION À PRENDRE : R77-5 dit « ni Relire ni Escalader dans la cellule prix » ; deux tests plus anciens les y exigent (Chambre froide). Options : (a) garder la réconciliation actuelle (houblons sans bouton, le reste avec) ; (b) retirer les boutons partout et changer c48 R1 / pxPrixEcrans ; (c) tout rendre. Recommandation : (a), jusqu'à ce que le brasseur juge Chambre froide en ligne.

CONNAISSANCE : une date dite dans un carnet passe par `src/domain/carnets/dateDite.ts` (règle : année seulement si autre que l'année d'aujourd'hui, année ISO du jeudi pour une semaine) ; `texteIntention` ne sert plus les carnets.
LEÇON PROPOSÉE : un correctif de format (date, prix) se pose dans UNE fonction appelée par toutes les surfaces, et son test lit la règle sur chaque surface (c75 l'avait posé pour Embouteillage seul : deuxième retour R73-25).
