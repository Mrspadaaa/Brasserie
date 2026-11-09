# PLAN up — port de p2b (impôt bière : la règle des degrés)

Étape 1 (plan seul, aucun code). Lu au 09.11 dans le worktree, sur HEAD 480f8d3e (d1 et d3 y sont commités). Aucun IBAN, aucune donnée réelle.
`dom/` = `src/domain/finance/`. Maquette lue en entier : `v0/p2b/etat.html` (2 figures), `NOTE.md`, `p2b-page.png` (ouverte en image). Registre :
`work/refonte-frontend/v4/choix/ecrans-app.json:80-87` (impot-biere, p2b, choisi, « Ça top comme ça »).
Ce que d1 laisse à up (`voies/d1/RESULTAT.md`) : `beerTaxForVolume`, `beerTaxPerFormat`, `BAREME_IMPOT_BIERE`, `litresNets`, option `litresSortis` ; période de déclaration lue
à la source (trimestre ou année, déclarer sous 20 j, payer sous 30 j) ; `volumePackagedL` est saisi (`BatchPackagingForm.tsx:31`), pas dérivé.

## 0. Constats qui orientent le plan

1. **Le calcul est déjà fait (d1).** Cette voie est de l'écran : une feuille qui lit un brassin et appelle `beerTaxForVolume`. Aucune règle neuve, aucun champ neuf, **aucune écriture
   de données** : le curseur est une simulation locale, jamais enregistrée (PLAN-METIER § 3.4). La seule écriture, la densité, passe par le chemin existant de la fiche (§ 2.3).
2. **« 12 °P » n'est pas l'OG 1,048** : `platoFromSg(1,048)` = 11,9 °P (REVUE-A D1-6), même palier (25,32). La feuille affiche le °P réel à 0,1 près ; « 12 °P » reste l'exemple
   de la maquette quand la densité est inconnue.
3. **Le Réglages ne s'ouvre que depuis `App.tsx` / `Header.tsx` (`onOpenSettings`)**, aucun événement ni contexte : la ligne « Réduction petit brasseur ›» ne peut pas y naviguer sans sortir du
   Possède. Voir DÉCISION D3.
4. **Aucune vente n'est rattachée à un brassin aujourd'hui** (pas de `batchId` sur les ventes ; `KegItem.batchRef` seul) : « aucune sortie notée » (rouge, maquette) est vrai tel quel jusqu'à
   v3a. La feuille ne lit pas `litresSortis` (hors périmètre, uv).
5. **Les formats de la maquette sont des constantes** (33 cl, 75 cl, fût 20 L) : `PricingItem` n'a pas de volume. Constantes locales de la feuille, libellées comme la maquette.
6. `tests/integration/financeAssistantContext.test.ts` rouge sur HEAD (firebase-admin absent) : sans rapport, hors de mes appelants.

## 1. Défauts visés (INVENTAIRE-CODE, `NOTE.md` de p2b)

| Id | Défaut | Corrigé par |
|---|---|---|
| 4 | aucun impôt par format vendu (le 1er maillon du coût d'une bière) | 3 cartes 33 cl / 75 cl / fût 20 L, `beerTaxForVolume` par format |
| 14 | le barème n'est nulle part dessiné ; son texte est recopié en dur (`ClientsTab.tsx:~302`) | règle à 3 bandes lue de `BAREME_IMPOT_BIERE` ; la phrase de Clients en dérive aussi ; `beerTaxFullRatePerHl` jamais lu ni affiché |
| 13 | « Quand » ambigu (conditionné pris pour l'assiette) | « à la sortie de cave », « aucune sortie notée » ; les litres sont dits `conditionnés`, `enregistrés` ou `attendus` selon la source |
| 125-métier | l'impôt se lit en réserve annuelle abstraite, pas par bière | « à 12 °P, ce brassin doit 6,74 CHF » + par format + année |

## 2. Changements, fichier par fichier

### 2.1 `src/ui/production/ImpotBiereSheet.tsx` (neuf)
`export function ImpotBiereSheet({ batch, onClose, onNoteDensity }: { batch: Batch; onClose: () => void; onNoteDensity: () => void })`. Dans un `Sheet` (`src/ui/Sheet.tsx`) :
`title="Impôt bière"`, `subtitle=` nom du brassin · id. Remplace le « fil » de la maquette (« ‹ Pale Ale de septembre · Impôt bière ») ; le retour est la fermeture de la feuille.
L'en-tête d'app, la barre du bas et le FAB de la figure sont le cadre de l'app, pas l'écran : non portés (dit dans RESULTAT).
Sources, chacune citée à l'écran quand elle compte :
- litres : `litresNets({ conditionneL: batch.volumePackagedL, netEnregistreL, netAttenduL: null })` (d1, la même chaîne que c3a). `netEnregistreL` = `netVolumeL` du dernier plan `brewEstimate` du brassin
  (`FinanceService.snapshot().plans`, via `useStorageValue`) **seulement si** `netVolumeSource === 'saisi'` (un net pris sur le volume à brasser n'est pas un net : d1 § 0 ; jamais l'inventer). Aucune source de « net attendu » : `null`.
  Mot du libellé : `conditionne` → « conditionnés », `enregistre` → « nets enregistrés (estimé) », rien → « litres à noter ».
- °P : `platoFromSg` n'est pas rappelé ici ; `beerTaxForVolume({ og: batch.og, abv: batch.abv, litres, reductionPct })` rend `plato`, `chfParHl`, `montant`, `exonere`.
- réduction : `config.fiscal.beerTaxAnnualReductionPct` si `beerTaxReductionYear` = année du brassin (`bottlingDate || brewDate || plannedBrewDate`, comme `estimateSwissBeerTax`), sinon 0 (taux plein, dit).
- production annuelle : `FinanceService.snapshot().profile.annualProductionL` ; absente → ligne « Sur l'année » avec « — » et « production annuelle à indiquer » (jamais 1 200 inventé ; 1 200 n'est que la valeur de la fixture `?finance-demo`).
- Exports purs (testés) : `positionRegle(plato)` → % de 0 à 100 (règle 0–20 °P, bornée), `platoDuCurseur(valeur)` (dixièmes → °P), `formatsImpot` (les trois constantes).

### 2.2 `src/ui/production/impot-biere.css` (neuf)
Classes préfixées `ibr-…` (L26) ; jetons de l'app (`cave-*`, `ebc-*`, `area-finances`) : aucun `--page`/`--fin` de la maquette copié. Clair et cave. Pas de `finance.css` partagé. `<input type="range">`, jamais `type="number"`.
Bandes : paille / or / cuivre clair de la maquette (choisie : « Ça top comme ça ») ; texte foncé, vérifié 4,5:1 sous les hachures dans les deux thèmes (B7 de la note). L'écart « bandes frôlent l'échelle EBC » (NOTE, « Casse ») est
un point à lui montrer, pas un changement : les bandes restent. Le contrôle de teinte `controle-teinte.mjs` (D106) est rejoué sur les captures.

### 2.3 `src/ui/BatchDetailSheet.tsx` — le lien seulement, plus un geste
- Section `overview`, juste sous `<BrewBudgetButton batch={draft} />` (`:249`) : bouton « Impôt bière › » (même gabarit que `BrewBudgetButton`, `BrewBudgetDialog.tsx:48`) qui ouvre `<ImpotBiereSheet batch={draft} …/>` (rendu seulement ouvert).
- « Noter la densité » : la feuille appelle `onNoteDensity` ; la fiche ferme l'impôt, passe en section `measurements` et met le focus sur le champ « Densité initiale » (`name="batch_sheet_og"`, `:309`). Elle **n'écrit rien** de plus :
  la saisie continue de passer par `saveGravity('og')` (`:151-170`), qui valide (`gravityProblem`, `gravityKeepable`), alerte et recalcule l'alcool. Une deuxième voie d'écriture de l'OG dans la feuille d'impôt l'aurait contournée (abv non recalculé).
- Le focus après fermeture d'une feuille est repris par `ModalShell` (`transferModalReturnFocus`) : le focus de l'OG se pose après la fermeture (effet sur `section` + drapeau) ; à vérifier dans Chrome, pas seulement en jsdom.

### 2.4 `src/components/tabs/ClientsTab.tsx` — section Impôt seulement (l. 279-315)
- La phrase du barème (« Barème par hectolitre : 16,88 CHF jusqu'à 10 °P ; 25,32 … ») est construite depuis `BAREME_IMPOT_BIERE` : même texte à l'écran, plus de littéral. Rien d'autre.
- **Pas de liste « brassins de l'année » ni de lien vers la feuille** : le total annuel est le choix ouvert B3 (p2a/p2c non choisis) ; rien n'entre d'un choix ouvert (D123). Voir DÉCISION D1.

## 3. Inventaire de la maquette p2b (L03) : chaque élément, chaque état, sa place dans le port

| # | Élément de la maquette | Port | Donnée / état |
|---|---|---|---|
| 1 | Cadre (en-tête d'app, onglets, FAB) | non porté (cadre de l'app) | — |
| 2 | Fil « ‹ Pale Ale de septembre · Impôt bière » | titre « Impôt bière » + sous-titre du `Sheet` ; retour = ✕ / glisser | nom, id du brassin |
| 3 | Tête « Combien par bière » + « CHF par hl, selon le °Plato » | identique | texte fixe |
| 4 | Ligne « ce brassin · **26,6 L** conditionnés » | identique ; le mot suit la source des litres (§ 2.1) ; sans litres : « litres à noter » | `litresNets` |
| 5 | Puce « densité à noter » (attention) | idem ; OG notée : « densité notée 1,048 · 11,9 °P » (neutre) ; OG hors bornes : « densité à vérifier » ; exonéré : « exonéré · ≤ 0,5 % vol. » | `batch.og`, `abv`, `gravityProblem` |
| 6 | Bandes 0–10 / 10–14 / 14–20 : **16,88 légère · 25,32 normale · 33,76 forte**, largeurs 50/20/30 % | identique ; taux et seuils lus de `BAREME_IMPOT_BIERE` ; la bande atteinte est marquée (`aria-current`) | barème |
| 7 | Hachures sur toute la règle (inconnu) | identique tant que la densité est inconnue ou à vérifier ; aucune hachure quand l'OG est notée | `plato == null` |
| 8 | Graduations 0 · 10 · 14 · 20 °P | identique | fixe |
| 9 | Curseur noir + étiquette « 12 °P · exemple » | identique ; OG notée : étiquette « 11,9 °P » posée au °P réel ; curseur déplacé : « simulation » ; °P > 20 : collé à droite, étiquette du vrai °P | `positionRegle` |
| 10 | Réglage `range` 0–200, « Degrés Plato du brassin » | identique (dixièmes de °P, `aria-valuetext` « 12 degrés Plato, exemple ») ; départ 12 sans OG, °P réel avec OG ; hauteur 28 px | état local, jamais écrit |
| 11 | Ligne résultat « à 12 °P, ce brassin doit **6,74 CHF** » | identique ; sans litres : « — » (jamais 0) ; exonéré : « 0,00 CHF » + mot « exonéré » ; réduction confirmée : le net, et « réduction 20 % appliquée » | `beerTaxForVolume` |
| 12 | « Par format vendu · à 12 °P, exemple » + 3 cartes picto : 33 cl 0,08 · 75 cl 0,19 · fût 20 L 5,06 | identique ; les cartes ne dépendent pas des litres (un brassin sans litres les montre) | `beerTaxForVolume` par format |
| 13 | Ligne année, pastille hachurée : « Sur l'année, si 1 200 L à 12 °P — estimé · exemple — ~ 303,84 » | identique ; litres = production annuelle du profil ; absente : « — », « production annuelle à indiquer » ; « exemple » seulement tant que le °P est un exemple ou une simulation | `profile.annualProductionL` |
| 14 | Carte « Quand : à la sortie de cave / aucune sortie notée » (rouge) | identique | fixe (§ 0.4) |
| 15 | Carte « À qui : OFDF, par Taxas / déclarer sous 20 j, payer sous 30 » | identique | d1 (OFDF) |
| 16 | Ligne « Réduction petit brasseur › — à confirmer dans Réglages » | même ligne, **en pli** (D3) : dit l'année et l'état (« 20 % confirmée pour 2026 » / « non confirmée pour 2026 : taux plein ») et où la régler | `config.fiscal`, année du brassin |
| 17 | Ligne « Comprendre le barème ⌄ — classes OFDF, °Plato et densité » | pli fermé au repos ; contient : classes et bornes (du barème), °P ↔ densité, « dû à la sortie de la brasserie », échéances (+ périodicité réglée `beerTaxPeriod`), exonération à confirmer, TVA | barème, config |
| 18 | Liens « Taxas », « Directives OFDF » | identiques (mêmes URL que Clients : Taxas ; `BEER_TAX_SOURCE`) | fixe |
| 19 | Primaire « + Noter la densité » | identique ; OG déjà notée : « Corriger la densité » ; ouvre le champ de la fiche (§ 2.3) | — |
| 20 | Copier (baseline, « à dire au port » ; absent de la figure) | lien texte « Copier » après les deux liens (même style) ; D2 | texte des montants affichés |
| 21 | Annexe : curseur à 15 °P, bande « forte », 8,98 · 0,11 / 0,25 / 6,75 · ~ 405,12 | l'état « curseur déplacé » de 10, rien de plus | calcul |

États neufs rangés dans un état existant (aucun composant neuf) : OG notée (5, 7, 9), litres inconnus (4, 11), exonéré (5, 11), réduction (11, 16), production annuelle inconnue (13). Nuit/jour : deux thèmes (L12).

## 4. Tests qui échouent d'abord (Vitest, fixtures, aucun Gemini)

Fichiers neufs : `tests/integration/impotBiereSheet.test.tsx`, `tests/integration/impotBiereLien.test.tsx`, `tests/integration/impotBiereClients.test.tsx`. Brassin de référence : 26,6 L conditionnés, sans OG ; profil 1 200 L par `vi.spyOn(FinanceService,'snapshot')`. Rouge sur HEAD : module introuvable (sheet) ; bouton absent (lien) ; littéral présent (Clients).

| # | Règle | Données | Attendu |
|---|---|---|---|
| 1 | repos, OG inconnue | 26,6 L, sans OG | « densité à noter », « 12 °P · exemple », règle hachurée, « 6,74 CHF », cartes 0,08 · 0,19 · 5,06, année « ~ 303,84 » |
| 2 | curseur déplacé (annexe) | curseur à 150 | « 8,98 », 0,11 · 0,25 · 6,75, « ~ 405,12 », bande « forte » marquée, « simulation » |
| 3 | bornes de la règle | curseur 100 / 101 / 140 / 141 | 4,49 légère · 6,74 · 6,74 normale · 8,98 forte (bornes 10,0 / 10,1 / 14,0 / 14,1) |
| 4 | OG notée | `og: '1.048'` | « densité notée », « 11,9 °P » sans « exemple », aucune hachure, 6,74 ; curseur déplacé → « simulation » |
| 5 | OG absurde | `og: '1.001'` | « densité à vérifier », hachures, aucun montant tiré de l'OG |
| 6 | litres inconnus : jamais 0 | sans `volumePackagedL`, sans plan | résultat « — », « litres à noter », cartes par format présentes, aucun « 0,00 » |
| 7 | chaîne des litres | plan `brewEstimate` `netVolumeL: 27, netVolumeSource:'saisi'` ; puis `'volume-a-brasser'` ; puis conditionné 26,6 en plus | 27 « nets enregistrés » ; ignoré (« litres à noter ») ; 26,6 « conditionnés » prime |
| 8 | réduction | 20 % pour l'année du brassin ; puis autre année | 5,39 « réduction 20 % appliquée » (formats et année aussi) ; puis 6,74 « non confirmée : taux plein » |
| 9 | exonération | `abv: '0.4'`, OG 1.048 | « exonéré », « 0,00 CHF » (cas connu, pas inconnu), cartes 0,00 |
| 10 | °P > 20 | `og: '1.100'` | curseur à 100 %, étiquette du vrai °P, bande « forte » |
| 11 | année | pas de `annualProductionL` | « — », « production annuelle à indiquer », pas de 1 200 |
| 12 | Quand / À qui / liens | — | « à la sortie de cave », « aucune sortie notée », « déclarer sous 20 j, payer sous 30 », lien Taxas (`href` de Clients), lien Directives = `BEER_TAX_SOURCE` |
| 13 | barème en donnée | réglage `beerTaxFullRatePerHl: 99` | « 99 » absent ; bandes = `BAREME_IMPOT_BIERE` |
| 14 | pas de champ numérique ; pli | — | aucun `input[type=number]` ; réglage `role=slider` « Degrés Plato du brassin » ; « Comprendre le barème » fermé, déplié montre classes et TVA |
| 15 | Copier | `navigator.clipboard` simulé ; puis refus | texte avec litres, °P, montant ; message de refus lisible |
| 16 | « Noter la densité » | clic | `onNoteDensity` appelé ; OG notée : libellé « Corriger la densité » |
| 17 | lien depuis la fiche | `BatchDetailSheet` section overview | bouton « Impôt bière » ouvre la feuille (titre, sous-titre) ; « Noter la densité » la ferme, ouvre Mesures, focus sur « Densité initiale » ; saisie → `updateBatch` appelé via le chemin existant, abv recalculé |
| 18 | Clients | source de `ClientsTab.tsx` | aucun littéral `16,88` / `25,32` / `33,76` ; la phrase rendue est identique à celle de HEAD |
| 19 | fonctions pures | `positionRegle(0)`, `(12)`, `(20)`, `(23,7)`, `(NaN)` | 0, 60, 100, 100, `null` |

## 5. Appelants hors Possède (grep `src/` `tests/` `scripts/`, rejoués sur HEAD)

`tests/integration/*` et `tests/unit/*` qui chargent `ClientsTab`, `BatchDetailSheet`, `ProductionTab`, `swissBeerTax` ou `calculateSwissBeerTax` : **30 fichiers, 304 tests verts sur HEAD** (`voies/up/tests-head.txt`,
`Test Files 30 passed (30)` · `Tests 304 passed (304)`). Ceux qui peuvent changer :
- `bDiversImpot.test.tsx`, `compactClients.test.tsx` : lisent la section Impôt de Clients (rôle, textes « Pour 85,9 litres conditionnés », « Barème par hectolitre », « Comprendre le calcul et les démarches »). Aucun texte ne change : doivent rester verts sans modification.
- `batch*.test.tsx` (8 fichiers), `yeastPitchingExecution`, `brewDayCssB`, `compactProduction`, `productionCatalog`, `mobileDailyViews`, `dashboardNavigation`, `liveDataViews` : montent la fiche du brassin ; un bouton de plus dans « Aperçu ». Aucun ne cherche « Impôt ».
  Plusieurs mockent `BrewBudgetDialog` seul : l'import statique de `ImpotBiereSheet` doit rester sans effet à l'import (aucun `FinanceService` appelé hors rendu).
- `swissBeerTax`, `contreCalculTauxImpotBiere`, `gravityBounds`, `chaineLitre`, `brewingMath*` : domaine, non touché par up.
- `scripts/` : `inventaire-ecrans.mjs:162` décrit l'écran Clients › impôt (liste des feuilles) ; `check-live-data-mobile.mjs`, `check-production-catalog.mjs`, `build-recipe-open-qa.mjs`, `fixtures/brewerSheetProbe.tsx` montent la fiche. Aucun n'est modifié par up ; **`inventaire-ecrans.mjs` devra recevoir une ligne « feuille Impôt bière » : pilote** (hors Possède).
Rejeu après code : les mêmes 30 fichiers + les 3 neufs, dans `voies/up/tests.txt`.

## 6. Risques

- **Données existantes** : aucune lecture nouvelle de champ obligatoire, aucune écriture, aucune migration. Un brassin ancien sans `og`, sans `volumePackagedL`, sans plan : états « densité à noter » et « litres à noter » (jamais 0, jamais 12 présenté comme fait).
- **Hors ligne** : lecture du cache local seulement (`FinanceService.snapshot()`, `StorageService.getConfig()`) ; rien à synchroniser.
- **Double clic / course** : aucun écrit dans la feuille. « Noter la densité » ferme puis déplace le focus : un double clic ne rouvre rien. Le brouillon `useSyncedDraft` de la fiche ne reçoit aucune écriture externe.
- **Arrondis** : les montants restent exacts jusqu'à l'affichage (`beerTaxForVolume` ne les arrondit pas), puis un seul arrondi (`montantChf`) ; jamais resommé (81 × 0,08 ≠ 6,84, d1). Séparateur des milliers de `Intl` fr (« 1 200 ») : les tests normalisent l'espace insécable.
- **Plage de la règle** : 0–20 °P comme la maquette ; une OG > 1,083 (> 20 °P) existe en vrai (stout impérial) : curseur collé à droite, bande « forte », le vrai °P écrit ; jamais tronqué en silence.
- **Accessibilité** : le curseur est le geste principal : `role=slider`, `aria-valuetext`, flèches ±0,1 °P ; la valeur est aussi écrite (étiquette et ligne résultat), jamais portée par la couleur seule ; hachures = inconnu (B8).
- **Poids** : un import statique de plus dans une fiche déjà longue (727 lignes) ; je mesure `npm run build` une fois (taille du paquet de la fiche).
- **Focus** : voir § 2.3, retour du focus par `ModalShell`.

## 7. Hors périmètre

- Total annuel de l'impôt, liste des brassins, entrée depuis Clients (choix B3 ouvert : à dessiner).
- `litresSortis` et l'assiette réelle (v3a, uv) ; la pastille « sorties notées » reste « aucune ».
- Lecture de l'OG visée de la recette comme départ du curseur (D4).
- `swissBeerTax.ts`, `chaineLitre.ts`, `brewBudget.ts`, `storage.ts` (réglage `beerTaxFullRatePerHl` stocké, jamais lu), `Header`/`App.tsx` (ouvrir Réglages), `SettingsModal.tsx`, `scripts/`.
- Le jugement visuel final : critique (étape 2 ne rend que les captures ouvertes, 390 / 1280, deux thèmes, côte à côte avec `p2b-page.png`).

## 8. DÉCISIONS À PRENDRE (défaut prudent et réversible appliqué si aucun mot)

- **D1** Clients › Impôt : garder le total annuel tel quel (seule la phrase du barème dérive du barème), sans liste ni lien vers la feuille, tant que B3 n'est pas tranché. Recommandé : oui (D123).
- **D2** « Copier » : lien texte à droite de « Directives OFDF ». La maquette n'a pas ce bouton, la baseline l'a (« à dire au port : via le partage de la feuille » : la feuille n'a pas de partage). Recommandé : lien texte.
- **D3** « Réduction petit brasseur » : pli qui dit l'état et renvoie à Réglages en mots (menu du haut › Réglages › Réserve impôt sur la bière), faute de pouvoir l'ouvrir sans toucher `App.tsx`. Option : un `onOpenSettings` optionnel passé par `ProductionTab`/`App` (autre voie). Recommandé : pli maintenant.
- **D4** Départ du curseur sans densité : 12 °P « exemple » (maquette) ; option : l'OG visée de la recette (`recipeSnapshot.ogTarget`, déjà montrée dans Mesures, `:299`), étiquette « visée recette ». Recommandé : D4 oui, c'est la valeur du brasseur et elle est sourcée ; défaut en attente : la maquette.
- **D5** Le geste « Noter la densité » passe par le champ « Densité initiale » de la fiche (garde-fous et alcool recalculé) au lieu d'un champ dans la feuille d'impôt : un écran de plus dans le parcours (fermer, saisir, rouvrir). Recommandé : oui.

Limites : rien rendu dans Chrome à ce stade ; `ModalShell`/vaul (focus en cascade de deux feuilles) lu en surface seulement ; `controle-choix.mjs` lu par son emplacement (`work/refonte-frontend/v4/tournoi/outils/`), pas rejoué ; thème clair/cave : correspondance exacte des jetons à fixer à l'écriture du CSS.
