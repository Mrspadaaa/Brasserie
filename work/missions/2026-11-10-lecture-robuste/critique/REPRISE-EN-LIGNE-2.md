# Reprise — jeu en ligne n° 2 (lecture-robuste), critique Opus, 10.11 ~11:40 local

Arrêt à 160 k de contexte. Un agent neuf finit : C/D (⌘K + retrait ZZ), verdict, BUGS.

Version : bundle servi `index-5P6eAqnP.js` (vérifié à chaque passe), aiTask a26a6d27 (dit par le pilote). pageErreurs [] partout ; × › Abandonner ok
(preuveEncore false) partout ; jamais Confirmer.
Outils (`critique/en-ligne/`) : `jouerA2.mjs` (jouerA + interception fetch de tout envoi aux Functions ; `--envoi=<dossier>` écrit chaque image
décodée et logue `ENVOI`, `ENVOI-CHAMPS`, `ENVOI-IMAGE`, `ORIGINE`), `jouerC.mjs` (⌘K + retrait ZZ), `lotB.sh`. Sorties `en-ligne-2/sortie-<p>.log`,
captures `en-ligne-2/*.png`, planches `en-ligne-2/planches/` (a1, b1, d1, f1 OUVERTES). Pièces `<scratchpad>/pieces-el2/`. Analyse :
`node <scratchpad>/compare.mjs <log> <doc>` et `nom.mjs <log> <doc>`. Gemini : 7 lectures neuves (a, b, d, f, h, k, l) ≈ 0,4 à 0,6 CHF.

## Lectures neuves (UTC)
a BAUHAUS copie 1280 cave 10:24 (12/32 s) ; b doc7 390 clair 10:25 (7/11 s) ; c cache 1280 cave ; d doc2 390 clair 10:27 (6/18 s) ; e cache 1280 cave ;
f doc14 1280 clair 10:28 (9/27 s) ; g cache 390 cave ; h Sun Store 1+2 390 cave 10:30 (9/25 s) ; k BAUHAUS tâché 1280 cave 10:31 (12/38 s) ;
l BAUHAUS copie bis 390 clair 10:33 (12/34 s).

## Diagnostic copie (point 2) — ÉTABLI
Ce que le client envoie, mesuré (passes a et l, idem pour toutes les pièces) : UN appel `aiTask` `scanInvoice` (tier `fast`, context null), UN fichier
`image/jpeg` 1280 × 2772 px, 3 composantes (couleur), 1751 Ko, IDENTIQUE OCTET au fichier choisi (cmp sur `<scratchpad>/envoi-copie/envoi-a-4-0.jpg`) ;
puis 1 ou 2 appels `traduireNoms` (texte seul, une entrée). Sun Store : 1 appel, `files[0..1]`, 2 JPEG 1280 × 2772. Photo d'origine (doc25,
`2026-11-09-depense-totaux/pieces/bauhaus-copie.jpg`) : 1280 × 2772, 1792469 octets, orientation EXIF 1. Donc ni découpe (rapport 2,17 < 3,
`RAPPORT_DECOUPE`), ni recadrage, ni redressement, ni gris, ni réduction (≤ 1600). Le client n'explique pas l'écart banc / en ligne : il est au
serveur (trois lectures, modèle, consigne, `mediaResolution` HIGH dans `functions/src/ai.ts` contre groupes du banc) ou au hasard des lectures.
Même octets, deux lectures neuves : a JUSTE (22/22 noms au bon montant, 136,65), l FAUSSE.

## Constats (à verser ; LR1-x = repris)
BLOQUANT
1. Revient (4e lecture fausse sur 5 en ligne) — BAUHAUS copie, passe l : SEAU 3,95 (vrai 2,95), MASKTIUS 9,50 (vrai 4,25), MARKEL 4,25 (vrai 3,95),
   COMBINAISON 2,95 (vrai 9,50) ; DEBOUCREOR porte « ROULEAU 12CHTUBEEO » barré ; ROULEAU « ? × — 9,50 », Masque « ? × — 9,95 » (1re lecture 9,50
   barrée) ; somme 136,65 juste donc rien de rouge sur ces lignes ; « Lectures 3/3 · 4 désaccords », « Voir le désaccord » ouvre VITRIFIC. (LR1-1)
CORRIGÉS (vérifiés neuf + cache) : LR1-2 doc7 (7 lignes « 1 × 5,00 »…, 29,65, TVA 2,20/2,22, kSuite « 0,00 » sans « × 0,000 » : LR1-13 aussi) ;
LR1-3 doc2 (« Articles lus 6 · annoncé par la lecture » gris, aucun geste « en trop ») et doc14 (« Articles 17 lus · non imprimé » gris, aucun geste).
Sun Store h : 7 lignes, 163,85 = imprimé, payé TWINT 163,85, brut − rabais 163,85 : non-recul tenu.
NON BLOQUANTS
2. Sun Store h (reprise LR1-7, autre forme) : H21 « 2 × 50,00 = 50,00 » (vrai 2 × 25,00) ; ambre « Qté × prix 4/5 · Ouvrir la ligne fausse › » ouvre
   bien H21 (« ≠ montant, écart à vérifier ») : honnête, mais prix faux.
3. doc14 f/g : drapeau ambre « À vérifier · 3 désaccords de lecture » sur une pièce juste : les 3 « désaccords » sont des noms barrés (CARABELGE® /
   CARABELGE, Premium Pilsner Malz / Malt Pilsner Premium, SPECIAL W®) ; « Voir le désaccord » ouvre CARABELGE sans montrer de désaccord (LR1-5, LR1-9).
4. doc14 : en-tête « 16 lignes · dont port 30,00 » et rangée « Articles 17 lus · non imprimé » : 17 / 16 sur le même écran (reste de LR1-3).
5. Compteurs qui ne disent rien : BAUHAUS a « 11 désaccords », « 22 corrigées », « 1 à contrôler », pied « 1/4 » alors que tout est juste ; doc2
   provisoire « 20 à contrôler » pour 6 lignes, final « 5 à contrôler » avec « 3/3 d'accord » ; tâché k « 16 désaccords », « 28 corrigées ».
6. doc2 : Sédation (imprimée sans montant, comprise dans le total) : « 1 à remplir » rouge et bande « Autres 768,55 + ? » rouge alors que
   « Somme = imprimé 768,55 » est verte : on pousse à saisir un montant qui n'existe pas (d1).
7. doc2 : actes vétérinaires (Sédation…) rangés « Matériel » (segment actif), bande « Autres » (d1).
8. BAUHAUS tâché k : « Matériel de brassage 1 · 11,50 » revient (LR1-4).
9. VITRIFIC : 1re lecture barrée « 1 ? × 0,69 » (a) ou « 69,95 » (l) (LR1-8). Noms barrés = variantes d'orthographe (AFFRET/AFPRET, MASKTUS/MASKTIUS,
   PDLATRE/POLATRE) (LR1-5).
10. Provisoire rouge renversé au final : doc14 f « 29,99 CHF manquants · Somme ≠ 140,21 / 170,20 » puis final juste (LR1-6).
11. Le geste de la rangée Somme change d'une lecture à l'autre de la même pièce : a « Comparer à la photo › », l « Ajouter la ligne manquante › »
    (ajoute une ligne vide, focus Libellé : attendu) ; écart 215,40 juste dans les deux.
DOUTES : tâché k « Vues par une seule lecture 1 · +8,90 · Les garder · il resterait 65,55 › » : le geste ajoute une 30e ligne (vérité : 29 lignes,
277,60) ; un 8,90 en double (GRATTE-VITRES / JEU DE CLES ALLEN 8,90) ou une ligne cachée par la tache ? Non établi. Unité « Kg » majuscule (doc14).
Noms OCR bruts non traduits (TAETS, TURGTNE…) (LR1-NOTE-2).

## C / D — À REFAIRE (jouerC cassé)
`sortie-zc.log` : la frappe n'entre pas dans le champ ⌘K (la liste montre les recettes par défaut pour « Hopfenhandel » et « 17,50 ») ; le clic a
ouvert une AUTRE écriture de test, « ZZ TEST — parcours 10.11 achat · 12,50 CHF · À payer » (existe donc aussi en ligne : à signaler et retirer,
avec accord). `zr` (retirer) tournait à 11:40 : sa garde (feuille avec ZZ TEST + Hopfenhandel + 17,50) bloque tout geste sur la mauvaise écriture ;
lire `sortie-zr.log` (NOTE garde:ecriture, annulation, suppression).
Correctif : dans `chercher()`, après ouverture, `await page.click('input[placeholder^="Article, recette"]')` (ou focus) AVANT `keyboard.type`, et
vérifier `input.value === q` ; puis relancer `jouerC.mjs --largeur=390 --theme=cave --passage=zc2` et `--largeur=1280 --theme=clair --passage=zr2 --retirer=1`.
Ordre : annuler l'écriture (rend le stock) puis supprimer l'article ; dire ce qui reste (écriture annulée tracée, fichier Drive, état de clôture LR1-14).

## Reste
1. C/D comme ci-dessus. 2. `critique/VERDICT-EN-LIGNE-2.md` (1re ligne « OK — N problèmes, B bloquants (…) », version, lectures avec heure, captures
ouvertes, table, liste). 3. BUGS vivant `C:/Users/mrspa/.codex/worktrees/openai-clean-start/Brasserie/work/missions/BUGS.md` : ligne source
(`| <chemin VERDICT-EN-LIGNE-2> | LR2 | n | doutes | |`, après la ligne LR1 l. 75), lignes `| LR2-n | VERDICT-EN-LIGNE-2 (lecture-robuste) 10.11 | écran |
constat | B/G/D | ouvert | | note |` après LR1-NOTE-5 (l. 876) ; LR1-2, LR1-3, LR1-13 : état corrigé (commits a26a6d27, c24e6a38) si le contrôle
l'admet ; puis `node scripts/agents/controle-bugs.mjs` dans cet arbre-là → « BUGS OK ».

## Mise à jour 11:45 — zr fini (lire `en-ligne-2/sortie-zr.log` et ses captures zz-zr-*)
L'écriture « ZZ TEST — Hopfenhandel Test GmbH · ZZ-TEST-1110 · 17,50 · À payer » a été ouverte par ⌘K « Hopfenhandel » (le clic ouvre bien la
dépense), garde vraie, puis Corriger › Annuler cette écriture › Confirmer la correction : okC, okA, okF vrais, aucune alerte. Vérifier sur la capture
`zz-zr-*-annulee` et `ecriture-apres` qu'elle est marquée annulée. Article ZZ : voir NOTE garde:article / suppression (l'ouverture depuis ⌘K n'a
pas donné de dialogue au 1er essai). Reste à faire : ⌘K « 17,50 » et « Cascade » avec le champ focalisé (avant ou après annulation : noter l'état).
Article ZZ : NON supprimé (garde:article surA false, fiche vide : ⌘K n'ouvre pas de dialogue d'article ; passer par Stocks). Restent en ligne : l'article « ZZ TEST Houblon Cascade Pellets 100 g », l'écriture ZZ annulée (tracée), le fichier Drive, l'écriture « ZZ TEST — parcours 10.11 achat 12,50 » (autre test).
