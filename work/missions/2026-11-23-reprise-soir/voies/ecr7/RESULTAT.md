OK — fin de série = dernière date listée, Habituels = Calendrier, Référence d'un salaire sans facture (E45-1..3), commit 5ff08fb54

# RESULTAT ecr7 (24.11)

## Plan (cause, fichier, correctif)
- E45-1 — cause : la fin (« … 24.04.27 · 6 fois », « → avr. 2027 ») venait de `dateDeFin` / `echeances` depuis la date de saisie, donc NON décalée, alors que les dates listées le sont (`datesDesOccurrences`, E44-1). Correctif : `finDesOccurrences` (`src/domain/finance/forecast.ts`) = la dernière des dates listées et leur nombre ; branchée à l'aperçu (`SaisieMain.tsx`, « … fin · N fois ») et à la carte de fin (« → mois an »). La borne du plan (`endDate`) ne change pas : le Calendrier la compare à la date non décalée. Résultat : Salaire 6 mois dû le 24.12 : 24.12 … 24.05.27, 6 fois ; Loyer trim. 6 mois : 24.12 · 24.03.27, 2 fois.
- E45-2 — cause : `habituels` (`src/ui/saisie/modele.ts`) annonçait la date brute de `planOccurrences` (24.02) alors que le Calendrier décale chaque occurrence du délai de la 1re pièce. Correctif : même `decalageDeLEcheance` (mêmes pièces liées que le Calendrier, filtrées par sens) ; sous-ligne et `solde.date` = date du Calendrier (Loyer trim. : 24.03 ; Salaire mensuel : 24.01). L'identifiant d'occurrence (`solde.occurrenceId`) est inchangé.
- E45-3 — cause : `indicationReference('salaire')` rendait la règle « facture ». Correctif : `modele.ts`, salaire → « Référence, facultatif » (21 caractères, même texte que l'Apport vu entier dans Modifier à 390 px). Achat, charges, vente gardent « Référence (n° de facture) ».

## Fichiers écrits
src/domain/finance/forecast.ts ; src/ui/saisie/modele.ts ; src/ui/saisie/SaisieMain.tsx ; tests/unit/ecr7Ecritures.test.tsx (neuf, 9 tests) ; tests/unit/ecr6Ecritures.test.tsx (1 ligne : salaire sorti de la liste « facture », E45-3) ; work/missions/BUGS.md (3 lignes E45) ; voies/ecr7 (RESULTAT, rouge.log, tests.log, proprietes.log, tsc.log). Rien dans src/domain/stock, src/ui/stock, carnets, calendrier/cadre ; firestore.rules intact ; aucun montant ni solde modifié.

## Critères
- Rouge sur le code d'avant : voies/ecr7/rouge.log, 8 échecs sur 9 (finDesOccurrences absente ; Habituels « échéance le 24.02 » au lieu de 24.03, « 24.12 » au lieu de 24.01 ; Référence du salaire « n° de facture »), le 9e passe (contrôle de non-régression).
- Vert : 15 fichiers, 142 tests (voies/ecr7/tests.log) : ecr7, ecr6, ecr4Modifier, ecr5, ecr4Ecritures, ecritures23soir, ecritures38, saisie-main, saisieEcritures*, saisieReprise, ecr3/ecr4 Calendrier et Récurrence.
- `npx vitest run tests/unit/proprietes` : 8 fichiers, 76 verts.
- tsc : 2 erreurs connues seulement (seedData GanttTask, virtual:pwa-register).
- `node scripts/agents/controle-bugs.mjs` : BUGS OK : 2203 bugs, 515 ouverts, 202 sources.
- Commit code : 5ff08fb54 ; registre et RESULTAT dans le commit suivant.

## Essais, doutes, limites
- Essais : 1 par critère, aucune relance.
- Pas de capture locale (consigne) : preuve en ligne par le pilote. À regarder : aperçu et carte de fin d'un Salaire 6 mois à payer d'ici le 24.12 (« 24.05.27 · 6 fois », « → mai 2027 ») ; Loyer trim. 6 mois (« 24.03.27 · 2 fois ») ; HABITUELS du Loyer (« échéance le 24.03 ») ; Référence de Salaire dans la saisie et dans Modifier (390 px, texte entier).
- Doute : la 1re occurrence (24.11) est liée à la pièce saisie ; l'Habituel propose donc tout de suite la suivante (24.03), comme avant (24.02). L'échéance « à payer » du 24.12 est la pièce elle-même, pas un Habituel.
- Limite : une fin choisie « date » (« Dernière échéance ») est comparée à la date non décalée, comme le Calendrier ; la fin annoncée peut donc tomber un mois après la date choisie quand l'écriture est « à payer d'ici ». Cohérent avec l'affichage du Calendrier ; à signaler si le brasseur s'en étonne.
- Modifier d'un Achat : « Référence (n° de facture) » peut rester coupée à 390 px (25 caractères, non demandé ici ; E45-3 vise le salaire).

DÉCISION À PRENDRE : aucune.
CONNAISSANCE : tout texte de date d'une série qui revient (dates, fin, nombre, Habituels) sort de `planOccurrences` décalée par `decalageEntre`/`decalageDeLEcheance` ; la borne `endDate` du plan reste non décalée.
LEÇON PROPOSÉE : aucune.
