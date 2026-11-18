OK — 52 tests inutiles retirés (vert par construction, doublons, un caduc) ; suite identique, tsc vert

## Fichiers écrits
- 17 fichiers de tests : 16 avec des `it` retirés, plus `tests/unit/depense/ecran/bande.test.tsx` (une ligne de classe CSS retirée dans un test gardé). Liste dans `INVENTAIRE.md`.
- Allègements (lignes retirées dans des tests gardés, le test reste) : `ecran/tri.test.tsx` (classes `bg-ebc-straw` / `text-cave-950` du bouton « C’est la date » ; chevron et `.dp-no-chevron`), `ecran/finitions.test.tsx` (`whitespace-nowrap`), `ecran/bande.test.tsx` (`border-alert`), `qr/ecran-qr.test.tsx` (`min-h-[42px]`), `bandes/sous-groupes-d311.test.ts` (import `reserveInconnu` devenu inutile).
- `voies/g5-tests/` : `INVENTAIRE.md`, `retraits.json` (ligne, classe, raison de chaque retrait), `retirer.mjs` (retrait par l’arbre syntaxique TypeScript), `inventaire.mjs`, `comparer.mjs`, `suite-avant-apres.txt`, `retraits-restants.json` (reste du lot de travail).
- Rien dans `src/`, `functions/`, `scripts/`, ni dans `tests/unit/depense/g2a/**` et `g2b/**`. Vérifié : aucun fichier hors `tests/unit/depense/**` plus récent que le début de la voie.

## Critères
1. `INVENTAIRE.md` : un tableau (184 fichiers : gardés, retirés) et le détail des 52 retraits (ligne, classe, raison en une ligne). Sortie de `inventaire.mjs` : `avant 2924 après 2872 retirés 52 fichiers 16 vidés 0`.
2. Suite complète `tests/unit` dans la copie isolée (`copie.mjs`, `npx vitest run tests/unit`), avant tout retrait puis après les 52 retraits :
```
avant : 9066 tests, 9058 verts, 4 échecs, 4 ignorés ; 2075 suites dont 13 en échec
après : 9014 tests, 9006 verts, 4 échecs, 4 ignorés ; 2069 suites dont 13 en échec
échecs nouveaux : 0
échecs disparus : 0
échecs communs : 9
```
   Les 9 échecs communs (4 tests, 5 suites) sont tous dans `tests/unit/hopIndexV4/` (outil houblons) : aucun ne touche la Dépense ; ils ne sont pas retirés, ils sont un constat pour le pilote. `npx tsc --noEmit -p tsconfig.json` dans la copie : code 0 (le tsconfig n’inclut que `src`).
3. `git status --short` : le dépôt contenait déjà, avant la voie, des modifications étrangères à g5 (src/ui/depense/*, ExpenseSheet, tests déjà modifiés par g2a/g2b, captures, cerveau, SPEC). Les seuls fichiers que cette voie a écrits sont les 17 tests ci-dessus et `voies/g5-tests/**` (`find -newer` sur `tests src functions scripts` après le début de la voie).

## Essais
Premier essai pour tout. Une erreur de ma part : un numéro de ligne faux pour un `it` (M1 de `sous-groupes-d311.test.tsx`), que `retirer.mjs` a refusé avant d’écrire ; corrigé. Aucun critère rejoué.

## Couverture des règles (critère 4 de la voie)
Pour chaque fichier de `src/` touché par un test retiré, le test gardé qui prouve encore sa règle :
- `src/ui/finance/ExpenseSheet.tsx` et `src/ui/depense/*` (écran) : les retraits relisaient des classes, des attributs, des libellés. Les règles restent prouvées : sous-totaux, port, 23 lignes, invariant « bandes + port = brouillon = Détail = Total » (`ecran/p3c.test.tsx` T1 à T9, T16, T17, invariant, D12), unité déduite et mouture (`ecran/tri.test.tsx` R1, R10 ; `ecran/p3c.test.tsx` T19), noms et liens (`fiche/ecran.test.tsx` R2, R3, R4, R9, R12, R13, n° 13, 14, 16), file de validation (`lecture-d/ecran.test.tsx`), 3.8 et relance hors ligne (`lecture-d/finitions.test.tsx`), pliage (`ecran/sous-groupes-d307.test.tsx`, `d311.test.tsx`, `bandes/sous-groupes-*.test.ts`), QR (`qr/ecran-qr.test.tsx`, `qr/vue.test.ts`), pages (`pages/parcours.test.tsx`, `pages/rangee.test.tsx`).
- `src/ui/ModalShell.tsx` (test T11 retiré : classes `h-full`, `rounded-none`) : plus aucun test unitaire. C’est du visible : à prouver dans Chrome (D339).
- `src/ui/depense/Liste.tsx`, `reserveInconnu` (3 tests de la bande et un d’écran retirés : chaînes CSS recopiées) : plus de test unitaire sur la largeur réservée ; le geste « un montant inconnu ne décale pas la colonne » se prouve dans Chrome (`controle-bande.mjs`).
- `src/ui/depense/Entete.tsx` (T-A12) : le panneau et le picto d’un fichier seul restent touchés par `pages/parcours.test.tsx` T-A13 et `ecran/p3c.test.tsx` (T13 retiré, mais « Changer » est joué par `raccord/changer-fichier.test.tsx`).
- `src/services/stockLineMatching` (6 retraits de `stock/relecture.test.ts`) : la règle « un mot du fournisseur n’est retiré du nom que s’il est dans les deux » reste prouvée par les boucles `DESCRIPTEURS`, les dix malts et les huit houblons du même fichier, et par le test « Cascade du Banc » (ligne 59).
- `functions/src/ai/aiTask` (traduireNoms et empreintes sha256) : les tests de routage, de corps de requête et de refus de pièce jointe restent (`noms-fr/aiTask-traduireNoms.test.ts`, 5 tests). Les empreintes ne prouvaient aucune règle et rougissaient à chaque réglage de consigne.
- Lecture de facture (`lecture/document.test.ts`, prompt et schéma) : les règles de lecture (α, TVA, pro-forma, forme rejetée) restent ; le test « plus de certitude de 100 % » est gardé.

## Doutes et limites
- Portée de la lecture : parmi les fichiers `.tsx` (rendu jsdom, hors g2a), 16 ont été lus en entier (`ecran/*`, `fiche/ecran`, `lecture-d/*`, `pages/parcours`, `pages/entree`, `rangees/rangees` en partie) ; les autres (`qr/ecran-qr`, `raccord/*`, `drive-fond/*`, `nom-b/ecran-nom-b`, `pages/rangee`, `pages/alleger`, `stock/renovation-d306`, `doublon/feuille`, `onglets/ta2`…) ont été classés sur leurs titres, plus une recherche de `className`, `toHaveClass` et `style`. Les fichiers de logique pure (`.test.ts`) de la Dépense ont été classés sur leurs titres et ouverts quand un titre laissait un doute ; les tests de finances et de facture hors dépense (`tests/unit/*.test.ts`, 28 fichiers dont `invoiceScan*`, `finance*`) ne sont pas lus test par test : ils sont comptés « gardés » par défaut. Je n’ai pas lu 2 900 tests un par un ; j’ai retiré ce que la lecture a montré avec certitude.
- Ce qu’on trouve : la suite de la Dépense est surtout faite de tests de règle (somme, TVA, arrondi, unités, rapprochement, file, hors ligne) ; ce n’est pas la masse de tests vides que son mot laisse penser. Les tests de rendu jsdom sont minoritaires et déjà en bonne partie des tests d’état. Leur limite est ailleurs : ils prouvent le DOM de jsdom, pas ce qu’il voit (hauteur, alignement, clavier). C’est ce que D339 sépare.
- Gardés avec un doute : `ecran/fixture.test.ts` et `fiche/fixture-s6.test.ts` (« se réécrit à la demande, puis reste identique ») comparent la fixture à sa propre fabrique, un instantané de l’implémentation ; mais ils portent aussi le réécriveur `ECRIRE_FIXTURE` du banc : gardés pour ne pas perdre cet outil. `enrichir/malts.test.ts` ligne 230 garde une empreinte sha256 de consigne de levure (mêlée à de vraies vérifications de schéma). `banc-k6/troisieme-d261c.test.ts` : trois `it.skip` « EN ATTENTE D261c », suspendus exprès pour se rallumer avec un correctif non posé ; je ne les ai pas retirés (un skip n’est pas un chemin disparu). `lecture/document.test.ts` : le test « plus de certitude de 100 % » compare du texte de consigne, gardé parce qu’il porte une correction documentée.
- Retraits discutables, à rétablir si le brasseur les veut : `pages/entree.test.tsx` « preuve : une rangée ne sort pas de sa case » (il contrôlait aussi les libellés « Qté × prix non contrôlé » et « Somme non contrôlée ») ; `qr/ecran-qr.test.tsx` lignes 256 et 264 (ordre des éléments dans le DOM : mise en page, à voir dans Chrome) ; `ecran/p3c.test.tsx` T10 (étiquette « hors ligne » de l’en-tête).
- Les retraits sont réversibles : `git diff` par fichier, ou `git checkout -p`. Les numéros de ligne de `retraits.json` sont ceux de l’état avant retrait.
- Aucun appel Gemini, aucune écriture de données.

## Constat pour le pilote
Neuf échecs de `tests/unit/hopIndexV4/` (hors voie, non retirés) : `clientWorker`, `f8Intensite`, `hopReclasserIA`, `substituerOrdreImpose`, `t2Typicite` (suites en échec) ; `collecteIhps`, `collecteNzhops`, `complements`, `radarBiere` (tests). Identiques avant et après.

CONNAISSANCE : la suite `tests/unit` compte 9 066 tests (avant g5) ; ceux de la Dépense et des finances sont 2 924 ; la lecture faite montre une suite qui prouve surtout des règles (chiffre non mesuré). Les instantanés sha256 de consignes (`aiTask-traduireNoms.test.ts`) rougissent à chaque réglage de consigne sans protéger une règle : ne pas en écrire de nouveaux.

LEÇON PROPOSÉE : un retrait de tests se fait par l’arbre syntaxique (numéro de ligne vérifié), jamais par regex ni sed ; et un chemin de sortie passé à `npx vitest --outputFile=` dans la copie isolée se donne relatif ou en `C:/…`, pas en `/c/…` (le shell de la copie l’a écrit dans `C:\c\Users\…`).
