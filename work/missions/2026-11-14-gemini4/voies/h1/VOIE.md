# Voie h1 — Hydrogen (réflexion basse) à la place de 3.8 dans la lecture des justificatifs (mission 2026-11-14-gemini4)

- Agent : auteur · Modèle : sonnet · Plafond : 120 tours · Décideur : brasseur, 14.11 : « Met le à la place de 3.8 pas beaucoup plus long et pas mal mieux »
  (banc g1, moitié impaire : Hydrogen@low 93/108 lignes justes contre 78 pour 3.8@low, 3ᵉ lecture p50 20 s contre 14 s, même tarif 1,50 $ / 7,50 $).
- Portée (L01, lecture étroite) : seulement les appels 3.8 de la lecture des justificatifs (3ᵉ lecture du vote `invoiceScanVote.ts`, lectures
  de A, revue de vision si elle passe par le même modèle fort). Le reste de l'app (compagnon, imports, fiches) garde 3.8 : voie g2 en cours.
- Lis : `CLAUDE.md`, `cerveau/LECONS.md` (L17, L20, L29), `functions/src/models.ts`, `functions/src/invoiceScan*.ts`, `functions/src/invoiceVisionReview.ts`,
  `functions/src/geminiCosts.ts`, `functions/src/ai.ts`, `scripts/banc-lecture-modeles.ts` (`FORT_MAX_OUT`, `FORT_TIMEOUT_MS`, prix et niveaux vérifiés),
  `scripts/banc-lecture-facture.ts` (`--fort`, ce que g1 a dû changer pour Hydrogen : plafond de sortie, délai), `../g1/RESULTAT.md`.
  Jamais `functions/.env` ni `functions/.secret.local`.

## Objectif
1. Modèle de la 3ᵉ lecture = `gemini-4-hydrogen`, `thinkingLevel` LOW, avec le plafond de sortie et le délai mesurés au banc g1. Une constante
   unique (ex. `INVOICE_STRONG_MODEL` dans `models.ts`), ajoutée à la liste blanche ; tarif dans `geminiCosts.ts` ; réservation de budget
   (`invoiceScanBudget.ts`) au bon tarif. Repli : si Hydrogen échoue (erreur, délai, réponse inutilisable), une tentative sur 3.8, comme
   aujourd'hui pour Flash-Lite → 3.8. Commentaires à jour (plus de « la 3.8 » faux dans ces fichiers).
2. Le banc suit la production : `STRONG_MODEL` du banc lit la même constante (le témoin du banc devient Hydrogen), sans casser `--fort`.
3. L13 : un test qui échoue sur HEAD (3ᵉ lecture = 3.8) et passe après ; tests du repli et du tarif. Gemini toujours simulé.

## Contrôles
- Tests : `npx vitest run tests/unit/invoice* tests/unit/banc-lecture* tests/unit/models* tests/unit/gemini* tests/integration/invoice* --reporter=dot > work/missions/2026-11-14-gemini4/voies/h1/tests.txt` (fichiers absents : retire-les du glob et dis-le).
- `npm --prefix functions test` si présent, sinon les tests `functions/` concernés ; `npx tsc --noEmit -p .` et `npx tsc --noEmit -p functions` ; `npm --prefix functions run build`.
- `git diff --stat` : seulement les fichiers ci-dessous.

## Possède
`functions/src/models.ts`, `functions/src/invoiceScan*.ts`, `functions/src/invoiceVisionReview.ts`, `functions/src/geminiCosts.ts`, `functions/src/ai.ts` (seulement si
le routage de la lecture y passe), `scripts/banc-lecture-facture.ts` (constante seulement), leurs tests, `work/missions/2026-11-14-gemini4/voies/h1/**`.
Pas de `scripts/banc-lecture-modeles.ts` ni des autres fichiers de g1/g2 (voies en cours). Aucun appel Gemini réel, aucun déploiement. Ni stash.
Commit par chemins, message terminé par « Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com> ».

## Rendre
`RESULTAT.md` au fil : diff résumé, preuve L13 (rouge sur HEAD, vert après), sortie des tests, commit. À 150 k : « REPRISE : <fichier> ». Une ligne.

## Ajout du 14.11 (brasseur : « Et comme Argon, réflexion basse 108 / 108 est aussi bon, ajoute un bouton pour l'appeler explicitement en fallback »)
4. Serveur : une option de la requête de lecture (ex. `relecture: 'argon'`), jamais un nom de modèle venu du client, qui fait la 3ᵉ lecture
   (ou une lecture unique forte) en `gemini-4-argon` LOW ; liste blanche, tarif Argon (2 $ / 10 $ jusqu'au 30.11, 4 $ / 20 $ dès le 1.12 :
   le tarif suit la date), budget réservé au bon prix. Tests simulés.
5. Écran : dans le résultat de lecture d'une pièce (écran Dépense / lecture du justificatif, là où le brasseur relit les lignes), un bouton
   discret « Relire avec Argon » (secondaire, compact, DESIGN.md ; lire `.claude/rules/affinee-frontend.md` une fois) qui relance la lecture
   avec cette option et remplace le résultat ; état en cours, erreur claire, hors ligne désactivé. Ne touche rien d'autre de l'écran (règle n° 1).
   Test d'intégration (bouton → requête avec l'option ; Gemini simulé). Possède en plus : le composant de ce résultat et son test.
6. Capture de l'écran avec le bouton (390 et 1280, deux thèmes) sur fixture locale, chemin dans RESULTAT.md.
7. Le bouton sert à l'utilisateur qui a un doute sur la lecture (brasseur : « Pour les users si ils ont un doute ») : visible sur toute pièce lue, pas seulement en échec ; libellé du type « Un doute ? Relire plus finement », sans nom de modèle à l'écran.
