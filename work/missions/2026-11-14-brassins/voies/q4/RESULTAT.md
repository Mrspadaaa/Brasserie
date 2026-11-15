OK — Atelier R&D e9na porté : carnet « Noter en vrac », tiroirs, essai de prix, fiche ; G4 rouge pour un fichier d'une autre voie.

## Fichiers écrits
- `src/components/CreativeLabTab.tsx` (réécrit : assemblage et stockage, mêmes props et mêmes appels `StorageService`, `onDraftRecipe`, `createRequest`, `openSectionRequest`).
- `src/ui/atelier/` : `atelierModel.ts` (règles pures), `Ecrire.tsx`, `NoteCarte.tsx`, `EssaiPrix.tsx`, `CurseurPrix.tsx`, `FicheIdee.tsx`, `dictee.ts`.
- `tests/unit/port-q4-modele.test.ts` (9 tests), `tests/unit/port-q4-carnet.test.tsx` (9 tests).
- Voie : `INVENTAIRE.md`, `tests.txt`, `banc.mjs`, `journal.json`, `captures/` (27 PNG : `e9na-<état>-app-<390|1280>-<clair|cave>.png`).
- Rien d'autre écrit. Réutilisé en lecture seule : `Sheet`, `ConfirmSheet`, `CreativeItemSheet`, `UpgradeWorkspace`, `BrewerChat`, `lucide-react`.

## Critères
- G1 : `TSC OK`.
- G2 : `18 passed (2 files)` ; `tests.txt` écrit. `TESTS OK`.
- G3 : commande à rejouer par le pilote (mon agent a atteint 200 k avant de la lancer) ; `INVENTAIRE.md` écrit et `captures/e9na-*-app-390-clair.png` présentes (27 PNG). Banc : « BANC OK 27 captures », 0 geste sans effet, 0 erreur console, 0 erreur de page.
- G4 : **`HORS ? src/components/tabs/ProductionTab.tsx`** : une ligne modifiée par une autre voie (q1/q2 ; je n'y ai jamais écrit). Rien d'autre hors périmètre. À régler par le pilote (ordre de commit) ; ma voie est propre.
- Essais : 1 par critère (aucun échec). Regex : 2 passes (`\b` ne connaît pas « é » : réécrit en `(?<!\p{L})` / `(?!\p{L})`, testé).

## Écarts restants (combien et quels problèmes ? : 6)
Captures ouvertes à côté des PNG de la maquette (repos, geste, tarifs, idée, vide, cave ; 1280).
1. Icône « Bière » (lucide actuel) : à 13 px elle se lit un peu comme une corbeille, la maquette dessinait une chope. Même icône que la barre du bas de l'app ; pas touchée.
2. Pas de pastille de style (« Ambrée forte », « Lager », « NEIPA ») : `CreativeItem` n'a pas de style. Retiré (ACCORD 2).
3. Le toast arrive après « Ranger ainsi », pas en même temps que la carte de rangement comme sur la PNG « geste » : c'est le sens de la maquette (« Note gardée » ne peut venir qu'une fois rangée).
4. Vide : environ un tiers d'écran vide en bas (défaut déjà avoué par la maquette ; j'ai remonté le lien Matériel et ajouté un exemple, sans meubler).
5. 1280 : colonne unique pleine largeur, comme le port des autres écrans ; la maquette n'existe qu'à 390. Lisible, mais les lignes de note sont longues.
6. Le bandeau « Compagnon hors connexion · mode local » du banc recouvre le bas de l'écran sur les captures : coque de l'app, pas l'Atelier.

## ACCORD / DÉCISION À PRENDRE (rien de neuf dans Firestore)
- **ACCORD 1 : « L'IA range ».** Aucune tâche IA « ranger » n'existe dans `aiTask` (côté `functions/`, hors de ma voie). « Noter » lance donc une **lecture locale à indices** (`ranger()` : phrases, verbe d'action, prix « à 6 », lieu, mots de bière), jamais un appel Gemini. L'écran ne dit plus « L'IA » mais « Le rangement se propose, tu valides » et chaque ligne se corrige (Corriger, Retirer). Recommandation : garder ainsi ; si tu veux la vraie IA, ajouter une tâche `rangerNote` à `aiTask` (voie `functions/`), puis brancher `ranger()` dessus avec cette lecture locale en repli.
- **ACCORD 2 : données que la maquette montre et que le modèle n'a pas** : style de la bière, degré visé, arômes, « Pour » (événement), liaison note ↔ idée (« 3 notes en parlent »), « rappeler » en pastille. Retirés, pas inventés. Les dates de saisie (12.11) viennent de l'identifiant `CR-<ms>` ; absentes pour `CR-001`.
- **DÉCISION À PRENDRE 3 : « Convertir en client »** (prospect → fiche client, verrou BE-22). La maquette ne l'a pas : retiré de l'écran. C'est la seule fonction réelle perdue. Options : (a) la loger dans la feuille d'édition d'un contact (`CreativeItemSheet`, hors de ma voie) ; (b) la laisser partir. Recommandation : (a), à un bouton « Convertir en client » en pied de la feuille d'un prospect, avec `handleConvertToClient` de l'ancienne version (`git show HEAD:src/components/CreativeLabTab.tsx`, lignes 168-204).
- **DÉCISION À PRENDRE 4 : tests existants rouges** (hors de ma voie, à adapter par le pilote, ils testaient l'ancien écran) : `contactConversionUnique` (Convertir en client, voir 3), `dashboardNavigation` ×2 (le bouton « À faire » devient la puce « À faire 2 » : chercher `/^À faire/`), `equipmentProjects` (le tiroir par défaut est « Tout », plus « Matériel » : ouvrir `openSectionRequest` matériel avant ; le + hors Matériel met le curseur dans « Noter en vrac »), `liveDataViews` (idem, un projet de matériel s'affiche dans le tiroir Matériel), `bDiversContraste` BE-24 (le « Visuel : … » n'est plus dans la liste : dans la fiche, rubrique « Notes »). 37 autres tests de ces fichiers passent.
- Écart de choix signalé : le **coût de revient** reste au curseur (comme la maquette choisie), mais part de « non saisi » ; k9 le jugeait inventable (« coût lu »). À toi de dire si le coût doit venir d'ailleurs.

## Honnêteté des données
Inconnu jamais 0 : prix, coût, marge, numéro, date, échéance disent « non saisi », « sans date », « pas de numéro noté ». Marge = prix retiré de la TVA selon `config.fiscal` (même règle que l'ancien `CreativePricing`) moins le coût. Aucun type=number ; virgule partout ; cibles 44 px par pseudo-élément. Fixtures du banc : préfixe « ZZ », cache mémoire `?dev-local`.

CONNAISSANCE : en Tailwind de l'app, `text-cave-950` est l'encre sombre dans les deux thèmes (cave-texte-950) : un texte clair sur fond `bg-cave-50` doit s'écrire `text-[rgb(var(--cave-950))]` (surface). Et `\b` d'une regex JS ne connaît pas les lettres accentuées.
LEÇON PROPOSÉE : aucune
