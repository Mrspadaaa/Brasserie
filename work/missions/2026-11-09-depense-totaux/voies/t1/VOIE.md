# Voie t1 — Dépense : recherche dans les lignes, contrôles croisés des totaux (mission 2026-11-09-depense-totaux)

- Agent : auteur · Modèle : sonnet · Plafond : 120 tours · Décideur : pilote
- Lis : `CLAUDE.md`, `cerveau/LECONS.md` (L01, L03, L11, L12, L13, L28), `.claude/rules/affinee-frontend.md`, `DESIGN.md`,
  `docs/ui-compacte.md`, skill `boosters-ux` ; ses mots (fin de `work/refonte-frontend/v4/SPEC-BRASSEUR.md`, 09.11, « mini recherche ») ;
  ses deux captures `../../captures-brasseur/` (ouvertes) ; l'écran `src/ui/finance/ExpenseSheet.tsx` (bloc de contrôles vers les lignes
  1300-1320 : « Somme ≠ imprimé », « Qté × prix », « Lectures » ; la phrase « Lignes … · total … · … de moins » sous « Ajouter une ligne ») et
  les règles serveur `functions/src/invoicePoints.ts` (lecture seule).

## Objectif
Sur l'écran de lecture d'une pièce (Nouvelle dépense) :
1. **Mini recherche dans les lignes** : un petit champ (loupe, discret, dans la bande des lignes) qui filtre les lignes lues par nom
   (imprimé et français), référence/EAN et montant (« 14,90 » trouve la ligne), groupes ouverts sur les trouvailles ; « aucune ligne ne
   contient … » dit clairement que l'article manque. Échap ou × vide. Le filtre ne change aucune donnée.
2. **Contrôles croisés** dans le bloc de contrôles existant (même style, mêmes pastilles ✓ / ·) :
   - Articles : attendus (le nombre que la pièce imprime, si la lecture le donne ; sinon « non imprimé », jamais inventé) · trouvés (lignes lues) ;
   - CHF : total imprimé · somme des lignes trouvées · montant effectivement payé (règlement lu : TWINT, carte, QR… ; sinon « — ») ;
   - chaque paire comparée ; drapeau (attention) dès qu'au moins une ne concorde pas, avec l'écart en CHF et en articles.
   Vérifie dans le schéma de lecture (`functions/src/` : invoice schema / aiTask) si un « nombre d'articles » imprimé est déjà lu ; s'il ne
   l'est pas, dis-le dans RESULTAT.md (ajouter un champ au schéma Gemini est un geste serveur : le proposer au pilote, pas le déployer).
3. **La phrase « Lignes 277,60 · total 352,05 · 74,45 de moins »** devient une information : ce qui manque (« 74,45 CHF non retrouvés
   dans les lignes : une ligne illisible, cachée ou un rabais ? ») et les gestes possibles (rechercher, ajouter la ligne manquante,
   relire la photo), sans phrase longue.
Sur son ticket BAUHAUS, les 29 montants lus font bien 277,60 : l'écart est sur la pièce ; l'écran doit le rendre évident.

## Contrôles
- Tests qui échouent avant (L13), sur une lecture simulée du ticket (29 lignes, 277,60, total 352,05, payé TWINT 352,05) : la recherche
  « serre » montre SERRE-JOINT seul ; « 14,90 » trouve sa ligne ; « marteau » dit absent ; le bloc montre trouvés 29, imprimé 352,05,
  lignes 277,60, payé 352,05, drapeau levé, écart 74,45.
- `npx tsc --noEmit -p .` ; `npx vitest run tests/integration/finance tests/unit/finance <tes tests> --reporter=dot > work/missions/2026-11-09-depense-totaux/voies/t1/tests.txt`
  (adapter les dossiers à ceux qui testent ExpenseSheet), ligne « Tests » dans RESULTAT.md ; rouges hors zone dits.
- Captures Chrome sans écran (skill `webapp-testing`) du banc de lecture existant (chercher `?dev-local` et le banc Dépense dans
  `src/App.tsx` / `work/missions/2026-10-31-ecran-depense/`), 390 tactile et 1280, clair et cave : repos, recherche tapée, recherche
  sans résultat, bloc avec drapeau ; côte à côte avec sa capture 1, toutes ouvertes. Dans `voies/t1/captures/`.

## Possède
- `src/ui/finance/ExpenseSheet.tsx` et un nouveau module `src/ui/finance/controlesCroises*.ts(x)` ; leur CSS ;
- tests `tests/**/depenseTotaux*` ;
- `work/missions/2026-11-09-depense-totaux/voies/t1/**`.
Ni commit ni stash. Rien dans `functions/` (lecture seule).

## Exigences transversales et acquis
La maquette choisie de la Dépense reste la base (règle n° 1 ; `work/missions/2026-10-31-ecran-depense/`) : on n'ajoute que ces trois
éléments, dans son langage (pastilles, tirets d'attention). Inconnu ≠ 0 : un nombre non imprimé est « non imprimé ». Peu de texte.
Jamais `type="number"`. Une donnée réelle (photo, montants) n'entre pas dans Git : la fixture est anonymisée (fournisseur fictif, mêmes montants).

## Rendre (exigé par `.claude/hooks/garde-jetons.mjs`, L18)
- `RESULTAT.md` tenu au fil, mis à jour tous les 5 éléments : une limite de tours ne perd rien.
- La ligne « Tests » écrite dans un fichier (`--reporter=dot > …/t1/tests.txt`).
- Les captures 390 tactile et 1280, clair et cave, côte à côte avec sa capture, toutes ouvertes.
Réponse finale au pilote : une ligne. Avec « CE QUI EXISTAIT : … » en tête de RESULTAT.md (pour sa question « Qu'est-ce qui est déjà présent ? »).

## Contrat réécrit (09.11, ses deux précisions ; fin de SPEC-BRASSEUR, `captures-brasseur/3-bloc-controles-entoure.jpg`)
- Pas de second bloc : c'est le bloc existant « Somme ≠ imprimé · Qté × prix · Lectures » qu'on refait. Ses mots : « elle fait pas
  correctement son travail ». Chaque ligne montre ses deux valeurs, l'écart et son verdict. « Qté × prix » ne passe plus au vert quand
  des articles manquent : la couverture (articles attendus · trouvés ; CHF imprimé · trouvé · payé) a ses propres lignes. Le drapeau se
  lève dès qu'une ligne échoue. RESULTAT.md : ce que faisait chaque ligne avant (code et règle d'`invoicePoints.ts`), et pourquoi elle échouait.
- Chaque pastille d'erreur guide, dit le geste et y mène au toucher :
  - ligne manquante : recherche, puis « Ajouter une ligne » ouverte ;
  - ligne fausse ou en trop : la ligne, ouverte pour la modifier ou la retirer ;
  - total imprimé douteux : son champ (cas rare, dit comme tel).
  Un test par renvoi.
