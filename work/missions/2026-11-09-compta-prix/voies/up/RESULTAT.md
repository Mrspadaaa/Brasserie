OK — étape 2 : feuille « Impôt bière » (p2b) portée, 24 tests verts, captures ouvertes ; 2 écarts à valider

## Fichiers écrits (Possède)
- `src/ui/production/ImpotBiereSheet.tsx` (neuf), `src/ui/production/impot-biere.css` (neuf, classes `ibr-`).
- `src/ui/BatchDetailSheet.tsx` : bouton « Impôt bière › » sous le budget (section Dossier), feuille ouverte à la demande, geste « Noter la densité » (ferme, ouvre Mesures, focus sur `batch_sheet_og`).
- `src/components/tabs/ClientsTab.tsx` : la phrase du barème dérive de `BAREME_IMPOT_BIERE` (même texte, plus de littéral). Rien d'autre.
- `tests/integration/impotBiereSheet.test.tsx`, `impotBiereLien.test.tsx`, `impotBiereClients.test.tsx` (neufs).
- `voies/up/` : `PLAN.md` (§ 9 : sort de chaque constat des revues P2), `tests-rouge.txt`, `tests.txt`, `tests-appelants.txt`, `tests-head.txt`, `tsc.txt`, `capturer-impot.mjs`, `captures/`.

## Sorties décisives
- Rouge d'abord (`tests-rouge.txt`) : 3 fichiers en échec (module absent, bouton absent, littéral présent).
- Vert (`tests.txt`) : `Test Files 6 passed (6)` · `Tests 40 passed (40)` (mes 3 fichiers = 24 tests, + bDiversImpot, compactClients, batchPackagingVolume).
- Appelants (`tests-appelants.txt`, les 31 fichiers de HEAD qui chargent Clients, la fiche, Production, `swissBeerTax`, + mes 3) : `Test Files 34 passed (34)` · `Tests 377 passed (377)`.
- `npx tsc --noEmit` : 2 erreurs, toutes deux `firebase-admin/firestore` (`functions/src/brewerCatalogueStore.ts`, `brewerScenarioStore.ts`), environnement ; aucune dans mon code.
- Chrome (`?dev-local&finance-demo`, vite de ce worktree, fixture en mémoire, journal sans erreur de page) : `manques: []`, focus après « Noter la densité » = `{"actif":"batch_sheet_og","feuilleFermee":true}`.

## Captures ouvertes (`voies/up/captures/`, L12)
`clair|cave` × `390` (tactile, ×2) et `1280` : `-repos`, `-repos-bas`/`-plis-bas`, `-curseur-15`, `-densite-notee`, `clair-*-apres-noter-densite`. Ouvertes et jugées : clair-390 repos, cave-390 repos, clair-390 curseur 15 et plis, clair-390 densité notée, clair-390 après « Noter la densité », cave-390 curseur 15, clair-1280 repos. Non ouvertes en image : les autres (cave-1280, cave-390 densité notée, clair-1280 curseur/densité notée) : à ouvrir par le critique.
Côte à côte avec la maquette : `cote-a-cote-clair-390.png` (maquette repos | app | maquette 15 °P | app). Même ordre, mêmes éléments, mêmes chiffres (6,74 · 0,08/0,19/5,06 · ~ 303,84 ; 8,98 · 0,11/0,25/6,75 · ~ 405,12).
Défauts vus et corrigés : étiquette « 15 °P · exemple » coupée à droite (elle passe à gauche du curseur au-delà de 60 %) ; panneaux invisibles sur le fond de la feuille en clair (fond `cave-850`).

## Écarts à la maquette, à montrer au critique et au pilote
1. « Réduction petit brasseur » : pli `⌄` au lieu de `›` (Réglages ne s'ouvre pas hors `App.tsx`) ; même gabarit titre + état.
2. Cadre de l'app (en-tête, barre du bas, FAB) non porté : la feuille a son titre « Impôt bière » et le nom du brassin en sous-titre.
3. Départ du curseur sans densité : OG visée de la recette, « visée recette » (D4 retenu, revue A UP-2) ; 12 °P « exemple » seulement sans OG visée.
4. Carte « Quand » neutre et « aucune sortie rattachée à ce brassin » pour un brassin conditionné ou terminé (revue A UP-3) ; la maquette rouge pour les autres.
5. « Copier » : lien texte après les deux liens (baseline, absent de la figure).
6. Année du brassin dans les sous-lignes (revue A UP-6).
7. Densité notée : curseur posé au °P réel, sans hachures ; puce « densité notée 1,048 · 11,9 °P » ; primaire « Corriger la densité ». Litres inconnus : « — ». Exonéré : « 0,00 CHF ». Cas neufs rangés dans les états de la maquette.

## Doutes et limites
- Le focus est prouvé par `document.activeElement` ; la capture d'après n'affiche pas l'anneau de focus (fenêtre headless sans focus système).
- Un bug hors Possède trouvé : `batch.abv` s'écrit « 5% » sur la fiche et `beerTaxForVolume` (`swissBeerTax.ts`, d1) lit un nombre : « 0.4% » donne NaN, l'exonération sans alcool ne se déclenche jamais, et `estimateSwissBeerTax` (Clients, Annuel) idem. La feuille retire le « % » elle-même (test 9). Correctif de fond : `swissBeerTax.ts`.
- Règle des litres (net saisi seulement) et règle de la réduction recopiées ici : pas de helper commun (revue B).
- Reste hors Possède : ligne `inventaire-ecrans.mjs`, texte « 16,88 / 25,32 / 33,76 » de `SettingsModal.tsx:234` (uv), défaut `storage.ts:245`.
- Jugement visuel final : critique. Serveur vite arrêté.

DÉCISION À PRENDRE : (1) confirmer D4 (curseur sur l'OG visée) — appliqué par défaut, une ligne à retirer sinon ; (2) donner à une voie le correctif « abv avec % » dans `swissBeerTax.ts` ; (3) valider les écarts 1 et 4 avec le brasseur (mini maquettes si besoin).

CONNAISSANCE : `batch.abv` est une chaîne « 4,8% » (écrite par `saveGravity`) ; tout calcul d'impôt qui la lit doit retirer le « % ». Le focus d'un champ de la fiche après fermeture d'une feuille imbriquée se pose avec un délai de 350 ms (retour du focus par `ModalShell`).

LEÇON PROPOSÉE : la revue B la porte déjà (un fait de domaine lu par trois voies = un helper nommé) ; en plus : un test qui nourrit un calcul avec le format réel écrit par l'app (« 0.4% »), pas celui de la fixture (« 0.4 »).
