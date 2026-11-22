OK — bande hors du flux, « y aller » toujours effectif, une seule date par défaut, BANDE OK

## Le diff en une phrase
`BandeCollante` devient un support collant haut de 0 (marge basse -0,5 rem pour annuler le `space-y-2`) qui porte la bande en `absolute` : elle ne prend plus de place ; `aller` vise toujours une cible (date de l'achat, total, lignes, panneau TVA ou paiement, sinon la preuve) ; le point `date-absente` se règle par une date valide posée ; la date du paiement n'est plus un champ par défaut (« Payé le <date> » + « Autre date »).

## Fichiers écrits
- `src/ui/depense/Verdict.tsx` : support `sticky top-0 h-0 -mb-2` + bande `absolute` (même dessin, `lg:hidden`).
- `src/ui/finance/ExpenseSheet.tsx` : `scroll-pt-10 lg:scroll-pt-0` sur le défilant ; `viser` + `aller` refait (flushSync pour les panneaux et la preuve) ; `dateValide` + `estRegle` pour `date-absente` ; `dateSeparee` (champ « Date du paiement » seulement sur « Autre date », ou si `paymentDateBasis === 'typed'`, ou si la date du paiement diffère de celle de l'achat) ; ligne « Payé le … / Autre date » ; `focusIssue` fait apparaître la date du paiement quand une erreur la vise.
- `src/ui/depense/apercuDev.ts` : état `date` (dev seulement), la forme du serveur via `makePoint` ; sept lignes sans mouture ni voisin, total = somme des lignes ; un seul point `date-absente`.
- `tests/unit/depense/ecran/bande.test.tsx` (nouveau, 7 tests).
- `tests/unit/depense/ecran/tri.test.tsx` (C1 adapté) et `tests/unit/depense/raccord/ecran-lecture.test.tsx` (R3 adapté, voir Doutes) : la date du paiement n'est plus montée avant « Autre date ».
- `voies/b1-bande/controle-bande.mjs` et `voies/b1-bande/captures/`.
- `tests/integration/expenseSheet.test.tsx` et `jus0Journey.test.tsx` : NON modifiés (aucune hypothèse de date du paiement visible : verts tels quels).

## Critères
- `npx tsc --noEmit -p .` : `TYPES OK`.
- Tests écran (commande du VOIE.md, 63 fichiers) : `Test Files 63 passed (63)`, code 0.
- `node scripts/audit_inputs.mjs` : `INPUT PROTECTION AUDIT PASSED: 653 protected usages in 364 files`.
- `controle-bande.mjs` : `BANDE OK` (tactile 390 x844 échelle 2 et souris 390 x844). Sorties décisives : B0 la chip « 1 Date » est seule ; B1 repère 153,0 / 153,0 / 153,0 (écart 0,0 px) ; B2 18 positions de la zone frontière, 0 bascule, repère 0,00 px ; B3 « y aller » (vrai tap / clic au centre du bouton, `elementFromPoint` vérifié) : bloc ouvert, focus dans `input[type=date]` de `[data-purchase-date]`, visible sous la bande ; B3 bis avec le panneau Règlement ouvert avant : focus dans la date de l'achat, `focusPaiement:false` ; B4 idem depuis la chip ① ; B5 chip « 1 Date réglé », bande « 1 | points revus » sans « y aller » ; B6 aucune erreur de page, aucune requête hors localhost ; B7 un seul champ de date visible (1 dans l'achat, 0 dans le paiement), moyen de paiement visible, « Autre date » fait apparaître la date du paiement, date de l'achat posée : tuile « Payé le 01.11.2026 ».
- Série e-port : `DEPENSE ECHEC 3` sur les trois modes, un seul motif : « les 6 points se règlent sur leur ligne (4 barrés, « points revus » false) ». Il ÉCHOUE AUSSI SUR HEAD (rejoué : mêmes mots, souris 390) : défaut existant, non causé par cette voie (les 5e et 6e points de la scène 06 ne se règlent pas par la manœuvre du script). Tout le reste de la série passe.

## Témoin négatif (HEAD de Verdict.tsx et ExpenseSheet.tsx, mon apercuDev.ts, mes versions remises ensuite : `git diff --stat` confirme)
`BANDE ECHEC 44`, tactile et souris. Le sautillement se reproduit en Chrome sans écran : B2 `rel -8` et `rel -4` : 40 bascules en 600 ms (une image sur deux), repère 45,0 px, défilement bougé de 37 px ; B1 écart 45,0 px (153 -> 198) ; B2 aux autres positions, décalage permanent de 8 px (la marge de `space-y-2` de la bande) ; B3 / B3 bis / B4 : `ouvert:false`, aucun focus (« y aller » sans effet) ; B5 exception (bloc fermé) ; B7 2 champs de date visibles (1 dans le paiement) et pas de « Autre date ».

## Captures regardées (L12), tactile 390 x2, dans `captures/`
- `tactile390-1-bande-visible.png` : la bande « 1 Date · y aller » en haut du défilant, les lignes en dessous ; elle recouvre le haut du contenu sans le déplacer.
- `tactile390-2-apres-y-aller.png` : le bloc « Achat du … » ouvert, « Date de l'achat » au focus (jj.mm.aaaa surligné), visible sous la bande.
- `tactile390-5-paiement-une-seule-date.png` : panneau Règlement ouvert : « Payé le … [Autre date] » et le moyen de paiement ; aucune seconde date.
(Captures 3 et 4 et celles en souris : non ouvertes, couvertes par les mesures du script.)

B1 OK — bande hors du flux, « y aller » toujours effectif, une seule date par défaut (témoin HEAD : BANDE ECHEC 44)

## Réponse à la précision du brasseur sur la date du paiement
`patchPurchaseDraft` (purchasePrefill.ts:107-110) fait bien suivre : date de l'achat posée sur un brouillon sans date de paiement, la tuile dit « Payé le 01.11.2026 » (basis `document_date`, donc « supposée » dit par la tuile). Non modifié. Le point `date-absente` ne met jamais le focus hors de `[data-purchase-date]`.

## Essais
Un essai par critère, aucun échec résiduel hors le point e-port (existant). Deux itérations de code : fixture `date` (une chip mouture apparaissait : fixture réduite à sept lignes) ; deux « Autre date » dupliqués (le second réservé au cas non supposé).

## Doutes et limites
- `tests/unit/depense/raccord/ecran-lecture.test.tsx` est hors de mon Possède (et hors des deux fichiers ajoutés) ; je l'ai adapté d'une ligne (clic sur « Autre date » avant « Hier ») parce que le critère TESTS ECRAN OK le rend rouge sinon. À valider par le pilote.
- Le défilement vers la date en B3 se fait en ~0 ms mesuré : à 390 le bloc rouvert tombe déjà dans la zone visible ; la preuve d'un vrai défilement long n'est donc pas exercée en B3 (les cas total, lignes et preuve ne sont couverts que par tests unitaires en jsdom, sans défilement).
- `scroll-pt-10` s'ajoute au `scroll-mt-12` déjà porté par `data-dp-ligne` : un « y aller » vers une ligne laisse ~88 px au lieu de ~48 (sans gravité, non corrigé : le test n° 15 de `fiche/ecran.test.tsx` exige `scroll-mt-12`).
- Les scripts d'émulateur (`scripts/`) ne cherchent pas « Date du paiement » (grep vide) : pas d'impact connu.
- Thème clair en headless : les captures montrent le thème clair par défaut.

## CONNAISSANCE : aucune
## LEÇON PROPOSÉE : un élément qui apparaît dans un défilant doit se superposer, jamais s'insérer dans le flux : l'insertion change la position du déclencheur de son propre affichage (boucle d'IntersectionObserver). Se contrôle en échantillonnant le repère image par image sur la zone frontière, pas seulement avant/après.
