# Reprise n2-pages (02.11) — R-N2CODE et sa maquette

Agent : `auteur` (Sonnet), neuf. Plafond : 60 tours. Ligne `n2-reprise` de MISSION.md. Relis `VOIE.md` (ses mots, la maquette,
« Possède », règles), `REVUE-CODE.md` (constats 1 à 7, preuves et lignes) et le code tel qu'il est. Aucun commit, aucun déploiement,
aucun appel réseau hors localhost, Gemini toujours simulé. Tests dans la copie isolée :
`node work/missions/2026-10-31-ecran-depense/voies/p3c-port/copie.mjs "<commande>"` (une commande simple par appel).
Ne lance **aucun banc Chrome** : le pilote les rejoue après toi. La voie f4-malts est finie avant ton départ ; dans le banc
`scripts/check-invoice-journey-emulator.mjs`, tu ne touches que le cas `pages` (son `enrichirAnswer` et ses contrôles `enrichir` sont à f4).

## Possède
`src/ui/finance/ExpenseSheet.tsx`, `src/ui/depense/**`, `src/services/geminiScanner.ts`, `src/services/pagesJustificatif.ts`,
`functions/src/ai.ts` (plafond des pages seulement), `tests/unit/depense/pages/**`, `tests/integration/financeQuickActions.test.tsx`,
`scripts/check-invoice-journey-emulator.mjs` (cas `pages` seulement), `work/missions/2026-10-31-ecran-depense/voies/n2-pages/**`.

## À corriger (décisions du pilote, lecture étroite et réversible)
1. **Une seule borne de 12 Mo** (REVUE-CODE n° 1, majeur). Le client descend à 12 000 000 octets (« 12 Mo » décimal, message inchangé) :
   `TOTAL_OCTETS_MAX` et `scanPages`. Le serveur (`MAX_PAGES_B64 = 16_000_000`) ne bouge pas : la taille du corps d'`aiTask` n'est pas
   encore prouvée en ligne, la borne la plus basse est la prudente. Test qui relie les deux : le total maximal qu'accepte `refuserPage`
   passe `pagesDeLecture` (octets réels en base64), et un octet de plus est refusé par la rangée.
2. **Course après l'empreinte** (n° 2) : après l'`await` d'`ajouterUnePage`, `if (!mounted.current || scanLocked.current) return;`.
   Test avec un `arrayBuffer` différé : une page ajoutée pendant « Lire » n'entre ni dans la pile ni dans « N pages ».
3. **Contrôle du banc qui ne peut pas échouer** (n° 3), cas `pages` : `const f = await frise();` puis un contrôle qui échoue si la frise
   manque (`f !== null && …`), réécrit pour la frise du point 9 (au repos : « 3 pages ✓ », pas de « envoi ») ; le contrôle « envoi ✓ une
   fois les pages parties » devient « lecture » en cours après « Lire », avec « 3 pages ✓ » gardé.
4. **Échec d'assemblage sans issue** (n° 5) : après l'échec, la rangée montre sous son message le lien existant
   « Saisir sans justificatif », même style qu'à l'entrée, qui ouvre le formulaire avec les pages retirées. Aucun élément neuf. Test.
5. **Ordre du QR** (n° 7) : un test, QR présent seulement sur la page 3 ; `etat.qr` est appelé d'abord avec la page 3, arrêt au premier QR lu.
6. **« ✓ 3 pages lues »**, sa maquette telle quelle (`choix-captures/retenue/img/6-lue-repos.png`, `7-lue-pages.png`, ouvre-les) : quand les
   lectures concordent et que la pièce a plus d'une page, la rangée dit `✓ <N> pages lues`, sans valeur à droite. Lectures en désaccord :
   inchangé (« Lectures · N pages », « n lectures »). Document seul : inchangé (« Lectures », « 2/2 »). Retire le commentaire « « lues »
   n'est pas dit… ». Test des trois cas.
7. **Preuve qui déborde** (défaut vu par le pilote, antérieur à n2) : à 390 et à 1280, « · Quantité × prix non contrôlé » sort de sa case et
   de la carte (`bout/pages3/390-04-pages-lue-repos.png`, `bout/doc1-6/390-01-doc1-revue.png`, `bout/pages3/1280-04-pages-lue-repos.png`).
   Dans `ExpenseSheet.tsx`, le libellé devient « Qté × prix » dans les deux états (son mot, maquette) ; dans `Preuve` (`Recap.tsx`), une rangée
   ne peut plus sortir de sa case (le bouton `min-w-0`, la valeur tronquée, le libellé qui ne pousse pas au-delà). Au banc, cas `pages`,
   un contrôle : chaque `[data-dp="preuve"] button` a `scrollWidth <= clientWidth + 1` après la lecture.
8. **Taille du corps** (n° 4) : rien à coder ; RESULTAT dit que la limite réelle se vérifie en ligne après déploiement (pilote).

9. **La frise du parcours « Plusieurs »** (critique `critique/VERDICT-n2.md`, écart a ; sa maquette `3-plusieurs-1.png`, `4-plusieurs-3.png`,
   `5-lecture.png`) : son dessin au repos, avec un mot vrai. Dès qu'une page est posée, le premier segment est **plein** avec **« N pages ✓ »**
   (« 1 page ✓ », « 3 pages ✓ ») ; « lecture » et « vérification » gris. Après « Lire », le premier segment garde « N pages ✓ », « lecture »
   passe en gras et pointillé comme aujourd'hui. Le mot « envoi » n'apparaît plus dans ce parcours ; « Un document » reste inchangé
   (« envoi ✓ »). Tests : repos, lecture, document seul.

## Critères (le pilote les rejoue)
1. Chaque test neuf (1, 2, 4, 5, 6, 9) échoue sur l'arbre d'avant ta correction (« TEMOIN AVANT : » dans RESULTAT), puis passe.
2. `npx vitest run tests/unit/depense tests/integration/financeQuickActions.test.tsx --maxWorkers=2` (copie isolée) : tout vert ; et le
   test `tests/unit/depense/pages/lecture-serveur*` qui lit `functions/`.
3. `npx tsc --noEmit -p tsconfig.json`, le tsc de `functions/` et `npm run build` (copie isolée) : 0 erreur.
4. `node --check scripts/check-invoice-journey-emulator.mjs` : 0 erreur ; `git diff` du banc limité au cas `pages`.

## Rendre
Ajoute à `RESULTAT.md` une section « Reprise 02.11 » (fichiers, témoins avant/après, sorties des critères, ce qui reste douteux), puis
`LEÇON PROPOSÉE : …` et `CONNAISSANCE : …`. Une ligne : `N2-REPRISE OK — …` ou `N2-REPRISE ECHEC — …`.
