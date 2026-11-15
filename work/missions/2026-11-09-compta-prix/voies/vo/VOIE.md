# Voie vo — Opérations comme sa maquette v6b, sur ses vraies données (CP-5, CP-6)

Agent : auteur (Sonnet), plafond 90. Worktree `C:/Users/mrspa/Documents/Brasserie/.claude/worktrees/jolly-mahavira-cc0cc2`.

## Ses mots (10.11, captures en ligne de Finances › Opérations)
1. « Pourquoi je peux pas changer de mois ? Je veux !! » — « ‹ novembre 2026 › » grisé, sous-titre « Archives comprises ».
2. « Lignes serrées / v6a / v5a à − 12 % ; « ✓ Payé » reste à 24 px, le minimum. / Ça ressemble pas tellement à la mini maquettes ??? »
Sa capture (lue par le pilote) : AUCUN graphe du mois (piles Ventes, Fixes, Brassage…, ligne « payé · à payer · dépensé ») ; textes de
ligne nettement plus grands que la maquette (nom sur deux lignes) ; un groupe « Matériel · à part 0,00 » au-dessus de deux lignes
« Annulé » (108,10 et 35,00) ; une grande carte en pointillé « Vérifier mes opérations · Compagnon brasseur › » ; puces Par date, Filtres,
Doublons, Apport ou prélèvement privé, Archives en gros ; une vente « Vente 10 × Bière · 75 cl — Restaurant du Lac » avec « Annuler ».

## Maquette choisie (règle n° 1, reprise telle quelle, 99 %)
v6b : `work/missions/2026-11-09-compta-prix/p4/v6b/` (etat.html, NOTE.md, v6b-page.png, v6b-1280.png), famille v6a « lignes serrées »
(`p4/v6a/`). Ouvre les deux avant de coder. Remplacer, jamais fusionner ; acquis : les lignes-tâches filtrées (`voies/COMMUN.md`).

## Déjà fait par le pilote (à garder, à tester)
`src/ui/finance/TransactionJournal.tsx` l.166 : `modeMois` vaut aussi pour le scope « all » (archives comprises) ; `onMonth` remet
`year`, sort des archives vers « all » et d'un suivi vers `filter: 'all'`. `src/ui/finance/operations/Bande.tsx` : plus de `disabled` sur
‹ › et le mois. Conséquence attendue : le graphe (`piles`, l.236) revient aussi archives comprises.

## À faire
1. Tests rouges d'abord (sur HEAD 00595f90 via `git show HEAD:<f>` dans `os.tmpdir()` si besoin) : (a) scope « all » : « Mois précédent »
   actif et la liste passe à octobre ; (b) scope « all » mois : le graphe du mois est rendu ; (c) depuis « Par date » / exercice, toucher
   ‹ revient au mois.
2. Fidélité à v6b sur SES données : fabrique un état de capture qui imite sa capture (jeu `?dev-local&finance-demo=reel` + deux pièces
   annulées en Matériel + une vente encaissée aujourd'hui + archives comprises). Captures côte à côte v6b / app à 390 tactile, clair, puis
   liste « combien et quels problèmes ? » élément par élément (bande, graphe, en-têtes de groupe, lignes : tailles de police, hauteurs,
   puces d'état, pièce, bouton, carte IA, puces du bas). Corrige chaque écart vers la maquette. Points déjà vus par le pilote :
   - tailles de texte et hauteurs de ligne de la maquette (mesure-les dans etat.html, reprends-les) ;
   - une pièce annulée n'alourdit pas le mois : un groupe dont tout est annulé ne montre pas un en-tête « 0,00 » au-dessus ; range les
     annulées comme la maquette rangerait un état neuf (dans son état le plus proche, sans composant neuf), écris ton choix ;
   - la question IA a la forme de la maquette (puce en pointillé « ✦ … ? »), pas une carte pleine largeur plus lourde ;
   - les puces du bas à la taille de la maquette.
3. `npx vitest run <fichiers> --reporter=dot > voies/vo/tests.txt 2>&1` (les tests neufs et ceux qui lisent Opérations / le journal : grep
   `TransactionJournal`, `ops-`, `Bande`). `npx tsc --noEmit` hors firebase-admin, firebase-functions, cheerio, @noble/hashes,
   react-zoom-pan-pinch ; `npx vite build --outDir "$TEMP/vo-build"`.
4. Captures finales 390 tactile et 1280, clair et cave, côte à côte avec v6b, ouvertes (L12). Serveur `npx vite --port 3003 --strictPort`
   en arrière-plan (3001 et 3002 sont à d'autres voies), arrêté à la fin.

## Possède
`src/ui/finance/TransactionJournal.tsx`, `src/ui/finance/operations/**`, leur CSS, `src/ui/finance/TransactionRow.tsx` si la ligne y vit,
tests neufs `tests/integration/operationsV6b*.test.tsx`, tests existants qui lisent Opérations (grep), `work/missions/2026-11-09-compta-prix/voies/vo/**`.
Ne touche pas : `src/components/tabs/FinancesTab.tsx`, `src/ui/finance/previsions/**`, `src/ui/finance/synthese/**`,
`src/ui/finance/FinanceForms.tsx`, `src/domain/finance/ledger.ts` (voie sd), `src/ui/prix/**` (voie pc). Un besoin là : écris-le dans RESULTAT.md.

RESULTAT.md au fil dans `voies/vo/RESULTAT.md`. Aucun commit, pas de `git stash`, Gemini jamais appelé, aucune donnée réelle. Rends une ligne.
