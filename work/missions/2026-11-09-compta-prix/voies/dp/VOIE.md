# Voie dp — Dépense : une ligne non signalée, sans unité, et la liaison stock ouverte sans geste (DE, 10.11)

Agent : auteur (Sonnet), plafond 100. Worktree `C:/Users/mrspa/Documents/Brasserie/.claude/worktrees/jolly-mahavira-cc0cc2`.

## Ses mots (10.11, capture en ligne de « Nouvelle dépense », mode Déplié)
« Pas flaggé ??? Aucune unité rien ? Et ça m'avait ouvert la liaison stock ?? »
Sa capture : ticket de pharmacie BENU Matran (« Pour quoi ? BENU Matran · proposé ») ; une ligne « MEFENACIDE cpr pell 500 mg sécables
30 pce » 13,40, rangée « Autres (1) » ; sous la ligne : quantité VIDE, unité affichée « pièce L », prix unitaire VIDE, « = 13,40 » ; boutons
+1 +2 +3 +5 +10 ; type « Ingrédient · Service · Matériel » avec Matériel choisi ; « article — · hors stock » ; « Suivant › » ; règlement
« Payé le 31.08.2026 · date supposée » ; en tête « 1 à contrôler » (pour une autre raison) ; en bas « Date : une lecture diffère des autres
(non lu / non lu /… désaccord) · Garder · Voir ».

## Trois défauts à lire dans le code, puis corriger (lecture étroite, réversible)
1. **« Pas flaggé ??? »** : un médicament acheté en pharmacie n'est pas un achat de brasserie ; la ligne (ou la pièce) doit être signalée
   « à contrôler » avec sa raison (ex. « pas un achat de brasserie ? ») et un renvoi vers le geste existant de dépense privée (« Apport ou
   prélèvement privé », grep) — même forme que les autres « à contrôler » de l'écran. Cherche où se décident ces drapeaux (`confiance.ts`,
   `rangees.ts`, `finale.ts`, `groupes.ts`, …) et pourquoi celui-ci n'est pas levé. Pas de liste de mots codée en dur si une règle existe
   déjà (fournisseur, famille, catégorie) : lis l'existant d'abord (L02, L29).
2. **« Aucune unité rien ? »** : quantité et prix unitaire vides alors que la ligne a un total et « 30 pce » dans son nom ; l'unité s'affiche
   « pièce L » (deux unités collées ?). Attendu : une ligne lue avec un seul total donne quantité 1, prix unitaire = total, une unité lisible
   (ex. « pièce ») — ou, si l'on refuse de deviner, la ligne est signalée « quantité à compléter » (renvoi au champ). Jamais un champ vide
   muet. Corrige l'affichage « pièce L ».
3. **« ça m'avait ouvert la liaison stock ?? »** : la liaison au stock s'est ouverte sans qu'il la demande, pour une ligne hors stock. Trouve
   le déclencheur (ouverture automatique au chargement, au choix du type, au « Suivant ») ; la liaison stock ne s'ouvre que sur son geste,
   et jamais pour une ligne Matériel / Service / hors stock.
Acquis à garder : les lignes-tâches filtrées, la règle « chaque manque est un renvoi » (`voies/rv/RENVOIS.md`), le hors ligne, aucune
écriture réelle. Défauts et paroles antérieurs de l'écran Dépense : grep `Dépense` dans `work/refonte-frontend/v4/DEFAUTS-RECURRENTS.md`
et `SPEC-BRASSEUR.md` (ne casse aucun acquis listé).

## Tests et preuves
- Rouges d'abord sur HEAD (`ef2e8820`), `tests/integration/depenseMedicament.test.tsx` : une pièce « BENU Matran » avec la ligne MEFENACIDE
  13,40 (fixture tirée de sa capture, aucune donnée réelle d'autre) → (a) drapeau « à contrôler » sur la ligne ou la pièce, avec renvoi ;
  (b) quantité 1, prix unitaire 13,40, unité unique lisible (ou drapeau « quantité à compléter ») ; (c) la liaison stock n'est pas ouverte
  au chargement ni au choix « Matériel ». Sortie dans `voies/dp/tests-rouge.txt`.
- `npx vitest run <fichiers> --reporter=dot > voies/dp/tests.txt 2>&1` (neuf + tests existants de la Dépense : grep `src/ui/depense`,
  `ExpenseSheet`). `npx tsc --noEmit` hors firebase-admin, firebase-functions, cheerio, @noble/hashes, react-zoom-pan-pinch ;
  `npx vite build --outDir "$TEMP/dp-build"`.
- Captures 390 tactile, clair et cave, de la Nouvelle dépense sur cette pièce (fixture locale, `?dev-local`), avant et après, ouvertes (L12).
  Serveur `npx vite --port 3012 --strictPort` en arrière-plan, arrêté à la fin.

## Possède
`src/ui/depense/**`, `src/ui/ExpenseSheet.tsx` et les modules de domaine de la Dépense qu'il faut toucher (grep ; écris-les dans RESULTAT),
`tests/integration/depenseMedicament.test.tsx` (neuf), tests existants de la Dépense, `work/missions/2026-11-09-compta-prix/voies/dp/**`.
Ne touche pas : `src/ui/finance/analyse/**`, `src/domain/finance/analyse.ts`, `src/ui/finance/synthese/**`, `FinanceOverview.tsx`,
`FinancesTab.tsx` (voie an en cours). Gemini jamais appelé (lecture simulée).

RESULTAT.md au fil dans `voies/dp/RESULTAT.md` (cause de chacun des trois défauts, avec fichier:ligne). Aucun commit, pas de `git stash`. Rends une ligne.

## Ajout du pilote (10.11, CP-20)
Ses mots : « 2 endroit qui ne font pas le lien sur la date d'achat ??? » (captures : « Date de l'achat » 10.11.2026 et, dans « Déjà payé », « Date du paiement » 11/10/2026, chacune avec son « Changer le mois, garder le jour » affiché « November 2026 »). À faire, même Possède : (a) la date du paiement suit la date de l'achat tant que le brasseur ne l'a pas choisie à part (un paiement « déjà payé » est du jour de l'achat par défaut) ; s'il la choisit, le lien se rompt, et c'est dit en une petite ligne (« payé le … , autre jour que l'achat ») ; (b) les mois du sélecteur « Changer le mois » en français (fr-CH), comme le reste ; (c) test rouge d'abord, dans ton test neuf ou un voisin. Grep le composant de date commun (, tests/unit/dateFieldMois.test.tsx).
