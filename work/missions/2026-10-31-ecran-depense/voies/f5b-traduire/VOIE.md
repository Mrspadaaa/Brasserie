# Voie f5b-traduire — la désignation en français par un appel à part, texte seul, qui ne touche pas la lecture (D271, D275, D278, D279)

Agent : `auteur` (Sonnet), la même que f5 (tu connais le banc). Plafond : 60 tours. Pilote : Opus. Suis `.claude/skills/banc-lecture/SKILL.md`.
Aucun commit, aucun déploiement, **aucune passe payante lancée par toi** : tu écris, tu simules, tu estimes ; le pilote paie et journalise.
Rien ne change dans `functions/` ni `src/`.

## Pourquoi (D279)
Csv8F (ta variante) a été payée et jugée : **PERTE**. Mettre `nameFr` dans la lecture change la lecture elle-même : un total HT rempli d'un
sous-total non imprimé (doc10, doc11, doc14), les prix unitaires omis (doc1), les unités tirées du nom (doc6) ; et la traduction est
inégale (doc9 et doc10 : « Pilsner Malz », « Wiener Malz, Kg », « Zuschlag Schrotung », « Porto und Verpackung » laissés en allemand ;
« CARAFA® Spezial 3 » coupé en « CARAFA® »). Ce qui allait bien : « Malt de blé clair », « Orge grillée », « Tuyau en silicone 10x14mm »,
« Supplément concassage », « Bouchon en silicone percé pour fût de fermentation ».

## Le geste
Un appel **texte seul**, après la lecture, qui ne voit ni l'image ni un montant : il reçoit la liste des noms de base et rend leur français.
- Entrée par ligne : `{ i, base, kind, stockCategory }`, où `base = lireOptions(name, variant, unit).base` (`src/ui/depense/optionsDuNom.ts`,
  voie f1 : options, état, supplément et suffixe d'unité déjà retirés par le code). Rien d'autre de la pièce.
- Sortie : `[{ i, nameFr }]`, une par entrée, même ordre ; schéma strict ; un `i` manquant = pas de traduction (la base reste).
- Règles de la consigne : français ; marque, nom propre, variété de houblon, souche et code de levure, `®`/`™`, références, dimensions
  (« 5x8mm », « 30 L ») gardés tels quels ; mots ordinaires traduits (Malz, Hopfen, Hefe, Schlauch, Deckel, Porto, Verpackung, Zuschlag…) ;
  un nom déjà en français rendu tel quel ; aucune explication. **Exemples de la consigne inventés, jamais tirés des 14 pièces** (L20,
  « overfit »).
- Cohérence : une même base rend un même français dans une même passe (l'appel reçoit les bases dédoublonnées).

## À faire
1. `scripts/banc-noms-fr.ts` (neuf) : lit les lignes finales d'une sortie de banc existante (par défaut `banc-d272b-hl`, la production
   rejouée : `records[].variants['Csv8+N'].result.items[]`), calcule les bases par `lireOptions`, appelle le modèle par pièce (une requête
   par pièce, texte seul), réutilise le journal, le budget, le plafond de passe, `--confirm-paid-ai`, `--simuler`, `--estimer`,
   `--reprendre` du banc existant (importer, ne pas recopier). Deux modèles à comparer : `gemini-3.5-flash-lite` et `gemini-3.8-flash`,
   réflexion au plus bas. Mesure : temps par pièce, jetons, coût.
2. Le juge : ton `jugerNomFr` (langue, marque, option, unité, long, absent) sur les paires, plus **cohérence** (même base → même
   français entre pièces) et **identité** (la base déjà en français rendue telle quelle). Le lexique s'enrichit des mots vus en perte
   ci-dessus. Paires dans le dossier de sortie (hors Git) ; le tableau publiable ne porte que des comptes.
3. Réglage choisi sur les pièces impaires (doc1, doc3…), jugé sur les paires (doc2, doc4…) (L20) ; dire lequel a été retouché.
4. `--simuler` → `NOMS FR TEXTE SIMULE OK` (fautes fabriquées retrouvées, aucun réseau) ; `--estimer` sur les 14 pièces, les deux modèles
   → `BANC ESTIME <x> CHF` ; la commande exacte de la passe payante dans RESULTAT.md.
5. Où le brancher, en production (recommandation chiffrée, rien fait) : (a) dans `scanInvoice` d'aiTask, après le vote, sur les lignes
   finales ; ou (b) une tâche `aiTask` à part, appelée par le client après la lecture, sans attendre. Dire le temps ajouté de chacun,
   le hors ligne, le cache (une base déjà traduite ou déjà reliée à un article du stock n'appelle rien), et la liste des fichiers à changer.

## Critères (rejoués par le pilote)
- `NOMS FR TEXTE SIMULE OK` ; `BANC ESTIME` ≤ 0,30 CHF pour les deux modèles ensemble.
- Tests : `npx vitest run tests/unit/banc-lecture-facture.test.ts tests/unit/banc-lecture-k5.test.ts tests/unit/banc-lecture-noms-fr.test.ts tests/unit/banc-noms-fr-texte.test.ts --maxWorkers=2` verts.
- `git status --short` : rien hors de « Possède ».

## Possède
`scripts/banc-noms-fr.ts` (neuf), `scripts/banc-lecture-facture.ts` et `scripts/banc-lecture-facture-juger.ts` (exports et lexique
seulement, rien de changé pour les variantes existantes), `tests/unit/banc-noms-fr-texte.test.ts` (neuf),
`work/missions/2026-11-01-banc-lecture/GESTES.md` (une ligne « Désignation en français, texte seul »),
`work/missions/2026-10-31-ecran-depense/voies/f5b-traduire/**`.

## Rendre
`RESULTAT.md` (ligne 1 `OK — …` ou `ECHEC — …`). Ni ses données personnelles ni les valeurs de ses pièces ; aucun nom d'achat privé
(doc2, doc4, doc13). Réponse au pilote : une ligne.
