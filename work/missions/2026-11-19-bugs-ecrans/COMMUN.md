# Commun à toutes les voies — défauts ouverts du 19.11

Le brasseur (19.11) : « Corrige tout alors tu attendais quoi ??? Tout tout tout ». Les défauts datent du 07 au 10.11 ;
l'app a beaucoup changé depuis : beaucoup sont peut-être déjà corrigés ou sans objet. Le prouver, ne pas le supposer.

## Lieu
- Dépôt : `C:/Users/mrspa/.codex/worktrees/openai-clean-start/port-carnet`, branche `claude/port-carnet-1711`. Toutes les commandes
  depuis ce dossier.
- Partagé avec trois sessions vivantes et six autres voies. Zones interdites : Carnet, Dépense, Finances (`src/ui/finance/**`,
  `src/ui/carnets/**`, `src/ui/depense/**`, `FinancesTab`), Calendrier (`src/ui/calendrier/**`, `CalendrierTab`), Levure et
  Conduite (`src/ui/etapeLevure/**`, `src/ui/Yeast*.tsx`), défauts T2-* et T2B-*. Jamais toucher `.codex/hooks.json`,
  `source4-portable-bundle-manifest-01.json`, `firestore.rules`, `.firebaserc`, `firestore.indexes.json`, `functions/.env`.
- Avant d'éditer un fichier : `git status --short -- <f>`. S'il est modifié sans être à toi : ne pas le toucher, verdict « hors voie ».

## Pour chaque défaut (dans l'ordre de BUGS-VOIE.md, doublons BR/BE ensemble)
1. **Rejouer** : lire le code actuel du geste ; puis le jouer dans l'app locale (`?dev-local`, voir `cerveau/agents/verification-locale.md`
   et le skill webapp-testing : `.claude/skills/webapp-testing/SKILL.md`, `scripts/with_server.mjs`, ton port à toi : t1 3101, r1 3102,
   a1 3103, a2 3104, b1 3105, s1 3106, c1 3107). Les données locales viennent des fixtures de dev-local, jamais de Firestore réel.
2. **Déjà corrigé** (le geste ne montre plus le défaut) : trouver le commit qui l'a corrigé (`git log -S`/`-G` sur le fichier) ;
   verdict `corrigé | <sha> | déjà corrigé : <preuve en quelques mots>`.
3. **Sans objet** (écran retiré, geste disparu, remplacé par sa maquette choisie) : `écarté | — | <raison vérifiée>`.
4. **Présent** (L13) : d'abord un test Vitest qui échoue sur le code actuel (`tests/unit/bugs-<voie>-<id>.test.ts(x)`, règle de calcul ou
   rendu Testing Library) ; le lancer, voir l'échec ; corriger ; le relancer vert, avec les tests existants du fichier touché.
   Pour un défaut purement visuel (recouvrement, contraste), le contrôle peut être un script puppeteer qui mesure (boîtes, contraste)
   et échoue avant. Puis commit (ci-dessous) et verdict `corrigé | <sha> | <ce qui a changé>`.
5. **Goût non tranché** (« décision », « à confirmer », « goût ») : appliquer la lecture la plus étroite et réversible qui fait
   disparaître le défaut sans redessiner sa maquette (ex. message, borne, mot, ordre), et le noter « lecture étroite : … ». Si toute
   lecture change sa maquette choisie, ou demande une source métier introuvable : `ouvert | — | accord requis : <la question, les options>`.
6. **Données réelles, sécurité, suppression en ligne, PDF envoyé, compte** : jamais. `ouvert | — | accord requis : …`.
7. **Fonction manquante** (pas un défaut d'un geste existant, ex. lier vente et stock) : la construire si elle tient dans ta zone,
   petite, testée ; sinon `ouvert | — | accord requis : fonction à construire, <taille>`.

## Saisie et métier
- Bornes : refuser l'impossible avec un message court au champ (pas en silence) ; une valeur douteuse = alerte, pas refus.
- Avant tout algorithme non trivial, la méthode standard (L29). Facture QR suisse : bibliothèque maintenue (`swissqrbill`, MIT) plutôt
  qu'à la main ; arrondi aux 5 centimes : `Math.round(x * 20) / 20`.
- Gemini jamais réel (toujours simulé). Aucune requête vers Firebase réel.

## Commit (par chemins, à toi seul)
- `git add <tes fichiers>` puis `git commit -m "<message>" -- <tes fichiers>` (`git add -f` pour work/). Jamais `git add -A`, `.`,
  `stash`, `reset`, `checkout`, `switch`, `merge`, `push`. Si `index.lock` : attendre 5 s et réessayer (3 fois).
- Message : « Bugs <voie> : <ids> — <quoi> », terminé par une ligne vide puis
  `Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>`.
- Un commit par défaut ou par petit groupe lié. Ne pas éditer `work/missions/BUGS.md` : le pilote reporte tes verdicts.

## Vision (avant de rendre)
- Chaque écran touché : captures 390 tactile (en défilant) et 1280, thème clair et cave, dans `voies/<voie>/captures/`, toutes ouvertes
  (Read de l'image) ; dire ce qu'on y voit dans RESULTAT.md. Un geste corrigé se capture avant et après quand c'est possible.

## RESULTAT.md
```
# Voie <id>
- <id> | corrigé | <sha> | <note>
- <id> | écarté | — | <raison>
- <id> | ouvert | — | accord requis : <question> (ou « hors voie : <fichier> »)

Tests : <commande> → <n passés, n échoués>
Captures : <liste, ce qu'on y voit>
LEÇON PROPOSÉE : … (si utile)
```
Contrôle : `node work/missions/2026-11-19-bugs-ecrans/verdicts.mjs <voie>` → VERDICTS OK, et `--tests` → TESTS OK.
Réponse finale au pilote : une ligne (« <voie> : x corrigés, y écartés, z ouverts ; VERDICTS OK »).
