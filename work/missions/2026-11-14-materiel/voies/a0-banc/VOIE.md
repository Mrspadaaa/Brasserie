# Voie a0-banc — captures de Stocks › Matériel au banc local

- Mission : 2026-11-14-materiel
- Agent : executant
- Modèle : haiku
- Niveau : mécanique
- Plafond : 40 tours ; 3 essais par critère
- Dépend de : —
- Décideur en cas de doute : pilote

## Objectif
Capturer chaque vue actuelle de Stocks › Matériel au banc local (`?dev-local`), sur fixtures posées en mémoire, à 390 tactile et
1280, en clair et en cave, et les lister dans `banc/INDEX.md`. M = `C:/Users/mrspa/.codex/worktrees/openai-clean-start/Brasserie/work/missions/2026-11-14-materiel`.

## Entrées
- `.claude/skills/webapp-testing/SKILL.md` — puppeteer-core, Chrome sans écran (`C:/Program Files/Google/Chrome/Application/chrome.exe`).
- `cerveau/agents/verification-locale.md` — `?dev-local`, densité lue au montage (redimensionner PUIS recharger).
- Code servi (version en ligne) : copie détachée `C:/Users/mrspa/AppData/Local/Temp/materiel-banc` (déjà prête : `.env`,
  `src/data/seedData.ts`, `node_modules` en jonction). Lire là : `src/components/tabs/StocksTab.tsx` (sous-onglet `materiel`),
  `src/ui/EquipmentList.tsx`, `src/ui/EquipmentSheet.tsx`, `src/services/migration.ts` (collection `equipment`, ligne ~127 ;
  `?dev-local` peuple la mémoire par `FirestoreRepo.bulkWrite`), `src/services/firestoreRepo.ts`.

## Possède (seuls chemins où écrire, avec RESULTAT.md)
- `M/banc/`, `M/voies/a0-banc/`
- Scripts : `os.tmpdir()` seulement. Rien dans `src/` de quiconque, aucun commit.

## Consignes
- Serveur depuis la copie : `cd C:/Users/mrspa/AppData/Local/Temp/materiel-banc && PORT=3427 npx vite --port 3427 --strictPort`
  en arrière-plan. Ouvrir `http://localhost:3427/?dev-local`, onglet Stocks (barre du bas), sous-onglet « Matériel ».
- Fixtures en mémoire seulement (le seed n'a pas de matériel) : après chargement, poser par le module de dépôt de l'app
  (import dynamique `/src/services/firestoreRepo.ts` dans la page, `put`/`bulkWrite` sur la collection `equipment`), ou, si plus
  simple, ajouter `stocks.equipment` dans la copie `materiel-banc/src/data/seedData.ts` (copie jetable, autorisée). Douze lignes
  comme les siennes, plus des cas d'état :
  EQ-001 « Cuve d'ébullition 100L » Brassage Neuf, prix 1 450, achat 2026-03-02, entretien « Joint du robinet chaque année » ;
  EQ-002 « Cuve fermentation 100L » Brassage Neuf ; EQ-003 « Pompe de recirculation » Brassage « À réparer », note « fuit au
  raccord » ; EQ-004 « Refroidisseur à plaques » Brassage « À entretenir », entretien « Détartrer après 5 brassins » ;
  EQ-005 « pH-mètre » Mesure Bon, entretien « Étalonner chaque mois (pH 4 et 7) » ; EQ-006 « Densimètre + éprouvette » Mesure Bon ;
  EQ-007 « Réfractomètre » Mesure Bon ; EQ-008 « Capsuleuse manuelle » Embouteillage Bon ; EQ-009 « Balance 0,1 g » Mesure Bon ;
  EQ-010 « Frigo levures & houblons » Stockage Bon ; EQ-011 « Déshumidificateur » Atelier Bon ; EQ-012 « Hotte recyclage »
  Atelier Bon ; plus un matériel créé par un achat (ref `EQ-1b2c3d4e-5f6a-7b8c-9d0e-112233445566-0`, « Moulin à malt », Brassage,
  Neuf, achat 2026-10-20, 289 CHF).
- Thème cave : bouton lune de l'en-tête. 390 tactile : émulation mobile (touch, 390×844, DPR 2) PUIS rechargement, page entière ;
  1280 : 1280×900, page entière.
- Captures `banc/<vue>-<390|1280>-<clair|cave>.png`, vues :
  `liste` (Tout), `a-traiter` (filtre À traiter), `recherche` (« mètre » tapé), `recherche-vide` (« zzz »), `actions` (« Actions du
  matériel » déplié), `fiche` (toucher « pH-mètre »), `fiche-achat` (fiche de « Cuve d'ébullition 100L », repli « Achat »
  déplié), `fiche-reparer` (fiche de « Pompe de recirculation »), `fiche-gestion` (repli « Gestion du matériel » déplié),
  `nouveau` (« Matériel déjà possédé »), `achat` (« Enregistrer un achat » : feuille ouverte, ne rien enregistrer),
  `vide` (sans fixtures).
  Les quatre combinaisons (390/1280 × clair/cave) pour `liste`, `a-traiter`, `fiche`, `actions` ; 390 clair seulement pour les autres.
- Aucun appel Gemini, aucune donnée réelle, ne jamais toucher « Enregistrer » d'une Dépense.
- Pour chaque capture, dans `banc/INDEX.md` : une ligne (nom, ce qu'on voit, erreurs de console). Noter aussi, par vue, le nombre de
  lignes visibles au premier écran 390 et la hauteur d'une ligne de la liste (px, mesurée).
- Ouvrir chaque capture avant de l'inscrire (L12). Arrêter le serveur à la fin.

## Exigences transversales et acquis (recopiés, L05 et L06)
- Données fictives seulement ; rien sur Firestore réel ; Gemini jamais appelé.
- Captures non regardées = pas de preuve (L12).

## Critères
Dans `GATES.md`, même dossier. Ne pas le modifier. Lancer chaque `CHECK:` depuis la racine du dépôt
`C:/Users/mrspa/.codex/worktrees/openai-clean-start/Brasserie`.

## Rendre
- `RESULTAT.md` tenu au fil, mis à jour tous les 5 éléments.
- La ligne « Tests » écrite dans un fichier : sans objet ici (aucun code de l'app touché, pas de `--reporter=dot > …`), à écrire « Tests : sans objet » dans RESULTAT.md.
- Captures 390 tactile et 1280, clair et cave, toutes ouvertes.
Réponse finale au pilote : une ligne.
