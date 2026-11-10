# Voie sd — le solde de départ : dire la cause exacte et y renvoyer (CP-4)

Agent : auteur (Sonnet), plafond 80. Worktree `C:/Users/mrspa/Documents/Brasserie/.claude/worktrees/jolly-mahavira-cc0cc2`.

## Ses mots (10.11, deux captures en ligne)
Feuille « Solde et paramètres financiers » : solde 100, date 08/01/2026, case « J'ai vérifié ce solde » NON cochée, Enregistrer. Puis
Finances › Prévisions dit encore « Solde de départ à renseigner › sans lui, seul l'écart de la période est connu » (écart −27,68 ; 5 sorties
d'achats du 10.11). Ses mots : « Ça fonctionne pas non plus... ». Même demande que CP-3 sur Prix : « il faudrait un renvoi et une explication ».

## Diagnostic du pilote (lu dans le code, à confirmer par un test)
`src/domain/finance/ledger.ts` `summarizeLedger` : `cashCents`/`cashComplete` seulement si `openingCash.confirmed` (la case) ; et
`cashComplete` retombe à faux dès qu'une pièce datée depuis le solde a un paiement `unknown` (« à confirmer »), ou registre en synchro,
paiement invalide, lien de remboursement. `Previsions.tsx` l.57 : `depart = ledger.cashComplete ? cashCents : null` ; l.142 le bandeau
dit toujours « Solde de départ à renseigner » et ouvre la feuille. `synthese/Caisse.tsx` dit « Des données restent à vérifier » sans renvoi.

## Ce qu'il faut (lecture étroite, réversible ; la règle « jamais un chiffre inventé » reste)
1. Domaine : `ledger.ts` expose en plus la cause, sans changer aucun calcul existant : par ex. `cashCause: 'absent' | 'a-confirmer' |
   'paiements' | 'autre' | null` et `unknownSinceOpeningCount` (paiements `unknown` datés depuis le solde). Tests unitaires de chaque cause.
2. Prévisions (maquette choisie p5b, même bandeau en pointillé rouge, même place, même forme) : le texte et le toucher suivent la cause :
   - absent → « Solde de départ à renseigner › » (inchangé) → feuille du solde ;
   - a-confirmer → « Solde de 100,00 au 8 janv. à confirmer › », petite ligne « coche « J'ai vérifié ce solde » ; sans lui, seul l'écart
     est connu » → feuille du solde ;
   - paiements → « Confirmer les paiements (N) › », petite ligne « depuis le 8 janv. ; sans eux, le solde n'est pas connu » → journal filtré
     sur les paiements à confirmer (le geste existant `onPayments` / `openJournal({scope:'all',allDates:true,filter:'unknown'})`, acquis
     des lignes-tâches, `voies/COMMUN.md`) ;
   - autre → « Données à vérifier › » avec la première alerte du registre → journal.
3. Synthèse › En caisse (`synthese/Caisse.tsx`) : la même cause, le même renvoi, dans sa forme actuelle (note sous « En caisse »).
4. Feuille du solde (`ProfileSheet`, `src/ui/finance/FinanceForms.tsx`) : quand un montant est saisi et la case non cochée, une ligne sous
   la case : « Sans cette case, ce solde n'est compté ni dans la caisse ni dans les prévisions. » Rien d'autre ne change.
Plancher à enrichir ; aucun nouvel écran, aucune carte.

## Possède
`src/domain/finance/ledger.ts` (ajout de champs seulement), `src/ui/finance/previsions/Previsions.tsx` (+ son CSS si besoin),
`src/ui/finance/synthese/Caisse.tsx` (+ Synthese.tsx pour passer le renvoi), `src/ui/finance/FinanceForms.tsx` (ProfileSheet seul),
`src/components/tabs/FinancesTab.tsx` (brancher `onPayments` là où il manque), `tests/integration/soldeDepartCause.test.tsx` (neuf),
tests unitaires du registre qui lisent `summarizeLedger` (grep), `work/missions/2026-11-09-compta-prix/voies/sd/**`.
Ne touche pas `src/ui/prix/**` (une autre voie y travaille).

## Étapes
1. Test rouge d'abord (`soldeDepartCause.test.tsx` : les quatre causes, texte et toucher) ; sortie dans `voies/sd/tests-rouge.txt` ; il
   doit échouer sur HEAD.
2. Code, puis `npx vitest run <fichiers> --reporter=dot > voies/sd/tests.txt 2>&1` (le neuf, les tests du registre, de Prévisions, de
   Synthèse, de FinancesTab : grep). `npx tsc --noEmit` hors firebase-admin, firebase-functions, cheerio, @noble/hashes, react-zoom-pan-pinch ;
   `npx vite build --outDir "$TEMP/sd-build"`.
3. Captures 390 tactile et 1280, clair et cave, sur `?dev-local&finance-demo=reel` : Prévisions et Synthèse dans chaque cause (fixture de
   capture en mémoire si besoin), feuille du solde case non cochée. Serveur : `npx vite --port 3002 --strictPort` en arrière-plan (3001 est
   à une autre voie), arrêté à la fin. Ouvre chaque capture (L12) ; liste « combien et quels problèmes ? » dans RESULTAT.md.

RESULTAT.md au fil dans `voies/sd/RESULTAT.md`. Aucun commit, pas de `git stash`, Gemini jamais appelé, aucune donnée réelle. Rends une ligne.

## Ajout du pilote (10.11, CP-7)
Ses mots : « Mais du coup on voit pas grand chose de plus alors qu'il y a eu des opérations durant l'année ?? » (Prévisions plate, « Prévu ~ 0,00 »). Cause : aucune prévision, et `forecast.ts` l.130-137 : tendance non calculée sans `profile.historyCompleteFrom` couvrant 3 mois complets. À faire dans Prévisions, même forme de bandeau p5b, sous le premier : quand l'escalier n'a aucune marche à venir, une ligne qui dit pourquoi et renvoie : « Tendance à calculer › — indique depuis quand ton historique est complet (3 mois au moins) » → feuille du solde ouverte sur « Paramètres des prévisions et des brassins » ; et « Rien de prévu › — un brassin ou un paiement à venir » → le geste existant de prévoir (PlanSheet / onOpenPlan, grep). Test dans soldeDepartCause.test.tsx, rouge d'abord.
