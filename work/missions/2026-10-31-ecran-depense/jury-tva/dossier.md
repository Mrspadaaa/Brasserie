# Jury rapide — la vue TVA (D250), avant le lot de mini maquettes

## Hypothèse du pilote (confiance 60 %)
La « vue TVA » est une vue de Finances qui donne au brasseur, **non assujetti** (chiffre d'affaires sous 100 000 CHF), la TVA qu'il a
payée sur ses achats, par taux et par période, comme un coût ; à part, un seul chiffre « ce que tu récupérerais si tu étais assujetti »,
sans conseil. Confiance basse : la place de la vue (Finances, fiche de dépense, les deux) et la donnée par taux (l'app ne garde qu'un taux
par dépense) ne sont pas tranchées.

## Ses mots (`work/refonte-frontend/v4/SPEC-BRASSEUR.md`, mot pour mot)
- 01.11, matin : « Aussi pour la TVA. SI plusieurs articles dans la même facture ont différentes taux, comment cela est géré ? En tant que
  indépendant je dois pouvoir me faire rembourser la TVA ? J'aurais besoin d'avoir une vision là dessus ». Réponse donnée : la lecture
  contrôle chaque taux, l'enregistrement ne garde que la TVA totale et un seul taux, la TVA ne se récupère que si l'entreprise est
  assujettie ; ouvert : une vue TVA, « assujetti ou pas », à montrer en mini maquettes.
- 01.11, soir : « Vue TVA : elle attend aussi ton choix. Je comprends pas ? Je vois pas l'artefact où j'ai déjà validé ? » (aucune page
  TVA n'existait ; L24 complétée : un choix se montre en page de mini maquettes, jamais en mots seuls).
- 01.11, soir, à « TVA : es-tu assujetti ? » : « Je fais moins de 100k » (D250).

## D250 (`work/refonte-frontend/decisions.md`)
« En Suisse, sous 100 000 CHF, l'entreprise est libérée de l'assujettissement à la TVA, sauf si elle y renonce (assujettissement
volontaire) ; non assujettie, elle ne récupère pas la TVA payée sur ses achats. Lecture du pilote : la vue TVA (à dessiner en mini
maquettes, L24) part du cas « non assujetti » : la TVA payée est un coût, montrée par taux et par période ; l'assujettissement volontaire
n'y est qu'un chiffre « ce que tu récupérerais », sans conseil, à confirmer avec sa fiduciaire ou l'AFC. Réversible. »

## Faits du code (lus par le pilote)
- Une dépense enregistrée porte **un** `tvaRate` et **un** `tvaAmount` (`src/types/index.ts:22-23`). Plusieurs taux d'une même facture
  ne survivent pas à l'enregistrement (seul le total de TVA et un taux restent).
- La lecture, elle, rend la TVA par taux (`vat`, tableau ; `amountHT`, `tvaAmount`, `tvaRate` ; `functions/src/invoiceScanCore.ts`).
- Le budget de brassin connaît déjà « assujetti ou non » (`isTvaRegistered`, `src/domain/finance/brewBudget.ts:308`) : non assujetti, le
  coût d'un ingrédient est son prix TTC.
- Dans l'écran Nouvelle dépense choisi (p3c-3, capture jointe `v3/p3c-3/p3c-3-geste-tva.png`), la tuile ① TVA règle **quelle** TVA de
  cette facture garder (colonne MWST lue, N + R lu, ou HT vide) ; ce n'est pas la vue TVA d'ensemble.
- Taux suisses : 8,1 % normal, 2,6 % réduit (denrées : malt, houblon, levure), 3,8 % hébergement. Les boissons alcooliques (sa bière)
  sont au taux normal 8,1 % (exclues du taux réduit). Assujetti volontaire, il facturerait 8,1 % sur ses ventes de bière et récupérerait
  la TVA de ses achats : le seul chiffre « ce que tu récupérerais » montrerait une moitié de l'équation.

## Questions (réponse recommandée par le pilote ; le jury confirme ou corrige, avec sa classe)
- J1 Qui, quelle scène ? → au bureau ou sur le canapé, au téléphone, attention hachée ; une fois par trimestre ou quand une facture le
  fait douter. 
- J2 Que vient-il décider ou savoir ici ? → « combien la TVA me coûte, et est-ce que ça vaudrait la peine d'être assujetti ? » ; un seul
  facteur libre : la période (trimestre / année).
- J3 Pourquoi maintenant ? → il a demandé « une vision là dessus » et n'a aucune page ; la TVA par taux se perd à l'enregistrement.
- J4 Réussite mesurable → en un écran, sans défiler à 390 : la TVA payée sur la période, sa part par taux, et le chiffre « si
  assujetti » ; 40 mots au plus au premier plan.
- J5 Acquis à garder → la tuile ① TVA de p3c-3 telle quelle (D248) ; pas de cockpit ; le stock et les états de dépense intouchés.
- J6 Déjà refusé → une phrase « Tu n'es pas assujetti » présentée comme vraie (critique v1 : rien de déduit montré comme vrai) ; le
  cockpit chiffré ; le texte long.
- J7 Contraintes, et qui gagne → aucun chiffre inventé (une dépense sans TVA lue compte « TVA inconnue », pas zéro) ; hors ligne ; 390
  d'abord. Honnêteté > complétude.
- J8 Ses mots → « TVA », « taux », « assujetti », « rembourser » ; pas « impôt préalable » seul (terme AFC, à mettre entre parenthèses).
- J9 Code et sources se contredisent-ils ? → oui : l'enregistrement perd les taux multiples ; la vue par taux est donc fausse pour les
  factures à deux taux tant que le schéma ne change pas (ACCORD).
- J10 Premier plan → total de TVA payée sur la période, barre par taux, un chiffre « si assujetti » ; au toucher : la liste des
  dépenses du taux, les factures « TVA inconnue ».
- J11 Limites → aucune dépense ; dépenses sans TVA lue ; factures à deux taux enregistrées avant le changement ; hors ligne ; année à
  cheval.
- J12 Hors périmètre → la déclaration AFC, le conseil fiscal, le calcul de la TVA sur ses ventes réelles (sauf comme chiffre « si »).
- J13 Approches → (a) une vue dans Finances (onglet ou carte), (b) une carte dans la Synthèse qui ouvre la vue, (c) le « si assujetti »
  comme simulateur à curseur de chiffre d'affaires. (a) contre (b) est un GOÛT ; (c) dépend de J16.
- J14 Suppositions → sa période naturelle est le trimestre ; ses ventes de bière seraient à 8,1 % ; ses achats d'ingrédients à 2,6 %.
- J15 Vouloir réel → savoir si l'assujettissement volontaire lui rapporte, sans devoir faire le calcul.
- J16 Irréversible ou externe → garder la TVA par taux à l'enregistrement change le schéma Firestore des dépenses : ACCORD. Le chiffre
  « si assujetti » touche au conseil fiscal : rester factuel, sources AFC citées.
- J17 Où le bâtisseur devinerait → la place de la vue ; ce que montre le « si assujetti » (récupéré seul, ou récupéré moins facturé).
- J18 Autre chose ?

## Captures
`work/missions/2026-10-31-ecran-depense/v3/p3c-3/p3c-3-geste-tva.png` (la tuile ① TVA ouverte, dans p3c-3 choisie).
