OK — 5 bloquants kq2 traités : toast lisible, bande °C cuve, période unique, pastille de style teintée, « L'IA range » en attente d'accord

## Défauts [B] (kq2 : gfc, e6a, e9na)
- [x] gfc n° 1 : toast « Stock Citra −100 g / Annuler » lisible. Cause : fond `bg-cave-50` (encre en clair) avec `text-cave-950` (aussi une encre) ; le texte prend maintenant `rgb(var(--cave-950))` (jeton de la page, clair en cave comme en clair). `FicheFermentation.tsx`. Capture 390 clair ouverte : texte blanc et « Annuler » souligné se lisent.
- [x] gfc n° 2 : bande « °C cuve » sur les relevés existants. Le point vient de la cuve notée si elle l'est, sinon du °C du relevé de densité (décision du pilote) ; rien d'inventé. Sans aucune température sur les jours écoulés : « cuve non relevée du 10 au 14.11 » écrit sur la bande. Un relevé du jour avec température retire « auj. non relevée ». `GrapheTemps.tsx`, `modele.ts` (champ `datesJm`, optionnel). Fixtures du banc : déjà trois relevés avec °C (19,6 · 19,4 · 19,1), donc rien à ajouter ; capture 390 clair ouverte : trace et valeurs comme sa maquette.
- [x] e6a n° 1 : un seul réglage de période sur la liste Brassins. `body:has([data-liste-brassins]) [data-periode-entete] { display:none !important }` dans `liste.css` ; drapeaux `data-liste-brassins` (ListeBrassins) et `data-periode-entete` (Header, seul changement du fichier). Les autres onglets gardent le leur. Une ligne hors de ma liste : `ProductionTab.tsx` passe `batches={batches}` à la liste (la décision de q6, sinon le réglage masqué de l'en-tête filtrerait en silence). Hors liste « Possède » : à confirmer par le pilote.
- [x] e9na n° 1 : « L'IA range » attend l'ACCORD (tâche serveur d'IA, `rangerNote`) : coché comme décidé, non touché.
- [x] e9na n° 2 : pastille de style selon le style : Lager jaune, NEIPA lime, Ambrée (forte) orange (comme sa maquette ; le catalogue met les ambrées en rouge, un décalage local dans `PastilleStyle.tsx`), inconnu gris chaud. Remplace l'ambre commun dans `NoteCarte`, `FicheIdee` et la ligne de proposition de `Ecrire`.

## Fichiers
`src/ui/production/fermentation/{FicheFermentation.tsx,GrapheTemps.tsx,modele.ts}`, `src/ui/production/liste/{ListeBrassins.tsx,liste.css}`, `src/components/Header.tsx`, `src/components/tabs/ProductionTab.tsx` (1 ligne, hors Possède), `src/ui/atelier/{PastilleStyle.tsx (neuf),NoteCarte.tsx,FicheIdee.tsx,Ecrire.tsx}`, `tests/unit/port-q9-bloquants.test.tsx`, `voies/q9/{banc.mjs,banc-sortie.txt,journal.json,tests.txt,captures/}`.

## Critères
- G1 : COCHE OK (5/5).
- G2 : `npx tsc --noEmit` : aucune erreur hors functions/.
- G3 : `npx vitest run port-` : 22 fichiers, 218 tests verts (`tests.txt`). Intégration rejouée sur 11 fichiers touchés par l'en-tête, la liste, la fiche ou l'Atelier (bDiversEntete, headerSignataire, compactProduction, productionCatalog, dashboardNavigation, liveDataViews, contactConversionUnique, batchFollowUp, batchAm4Am5, equipmentProjects, AppQuickActionReturn) : 90 verts.
- Essais : un par critère.

## Doutes et limites
- Captures : banc q1 copié, port 3119 ; 19 PNG dans `captures/`. Une seule ouverte et jugée (`gfc-geste-confirmation-app-390-clair.png`, ex-geste) : toast et bande cuve bons. NON ouvertes : les 18 autres ; 1280 ; cave pour la bande ; Atelier (pastille) et liste (période) non capturés : prouvés par tests seulement. Validation visuelle incomplète.
- Le banc dit « confirmation introuvable » (`geste`) : l'écran déstocke sans étape « Confirmer et déstocker » ; l'étape du banc est périmée, la capture `geste` n'est donc pas prise (la capture « geste-confirmation » montre déjà l'état après déstockage). À corriger dans le banc.
- Restent visibles sur cette capture, non bloquants et non traités : le toast tient sur trois lignes à 390 (« Stock / Citra / −100 g », colonne étroite, kq2 n° 6), « ZZ-002 · cuve · 24 L » (kq2 n° 9). Non traités : plafond de tours atteint.
- Le °C du relevé est la température de l'échantillon ; l'afficher en « °C cuve » est la décision du pilote, la cuve notée prime quand elle existe.

DEMANDE EXECUTANT :
- `node scripts/with_server.mjs --server "npm run dev -- --port 3119 --strictPort" --port 3119 -- node work/missions/2026-11-14-brassins/voies/q9/banc.mjs` (après retrait de l'étape « Confirmer et déstocker » du banc) ; attendu « BANC OK » ; ouvrir `gfc-geste-app-390-clair`, `gfc-geste-app-1280-clair`, `gfc-repos-app-390-cave`, `gfc-apres-releve-app-1280-clair`, et prendre à la main la liste Brassins 1280 et l'Atelier geste 390 (Lager).

DÉCISION À PRENDRE : `ProductionTab.tsx` hors de ma liste : garder la ligne `batches={batches}` (recommandé : sinon un mois choisi avant reste appliqué sans réglage visible) ou la retirer.

CONNAISSANCE : aucune
LEÇON PROPOSÉE : aucune
