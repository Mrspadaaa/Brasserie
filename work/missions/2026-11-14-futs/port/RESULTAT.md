OK — Port F2 « carte d'identité » et R1 « lot d'abord » des fûts : fiche, remplir depuis un lot, ajouter des fûts

Dossier : `C:/Users/mrspa/AppData/Local/Temp/futs-port`, branche `claude/futs-port`, non déployé.

## Fichiers
- Domaine : `src/domain/stock/futsFiche.ts` (nouveau, fonctions pures), `src/types/index.ts` (`KegItem` + `clientId`, `deliveryDate`, `historique`).
- UI : `src/ui/KegFiche.tsx` (F2, 4 états), `KegFillSheet.tsx` (R1), `KegAddSheet.tsx` (bouton « + »), `keg-fiche.css`, `KegBoard.tsx` (réécrit ; la liste, ses lignes et ses filtres ne changent pas ; bouton de barre « Remplir depuis un lot »).
- Branchement : `StocksTab.tsx` (prop `clients`, « + » ouvre « Ajouter des fûts »), `App.tsx`. `KegSheet.tsx` inchangé, plus ouvert.
- Banc : `src/design/StockPreview.tsx` (`?preview=stock&vue=futs`, `&parc=propres`), parc fictif en mémoire, dev seulement.
- Tests : `tests/unit/futsFiche.test.ts` (39), `tests/integration/futsPort.test.tsx` (17), trois tests existants adaptés au nouveau flux.
- Captures : 20 PNG dans ce dossier + `capturer.mjs` (rejouable, serveur sur :3021).

## Preuves
- Tests : 5 fichiers, 93/93 verts (futsFiche, futsPort, bStockFuts, compactEquipment, defautsStocksEcrans).
- Les 2 rouges de futsPort : vrai défaut de code (`filled.forEach(save)` passait aussi l'index et le tableau à `onSaveKeg`) ; corrigé en `filled.forEach((keg) => save(keg))`.
- Autres fichiers touchés par `KegBoard|KegSheet|StocksTab` : 10 fichiers, 128/131 verts. Les 3 rouges sont dans `dashboardNavigation.test.tsx` (« Garde du mois précédent » introuvable). Ils échouent aussi avec `src/App.tsx` remis à HEAD ; le test mocke StocksTab. Cause : la base de cette branche (8ba5a4ec) est antérieure au dépôt principal (3d6838ed), où ce fichier passe 7/7. À rejouer après fusion.
- `npx tsc --noEmit` : 0 erreur hors `functions/`.
- `VITE_HOP_V4=on npx vite build` : vert (40,9 s). `check-no-dev-auth.mjs` : bundle propre.
- Données : `kegs` figure dans `firestore.rules.template` (l. 130) sans schéma de champs ; Dexie : champs non indexés, pas de migration.

## Captures (toutes ouvertes ; 390 tactile, 1280 ; clair et cave)
f2-plein, f2-livre, f2-propre, r1-remplir (LOT-003, F-002 et F-005 cochés, « 10 L restent »), ajouter (3 fûts de 30 L, F-009 à F-011), en `<nom>-<390|1280>-<clair|cave>.png`.
Écarts trouvés par la comparaison, corrigés :
1. Pastille du champ Lot cachait le « A » d'« Ambrée » à 390 (le champ y est un textarea) : `padding-left` posé sur `[role="combobox"]`.
2. Segment actif (Aujourd'hui, 30 L) gris, la maquette le montre plein (noir en clair) : classe `keg-choice`.
3. `.keg-gesture-bar` inutilisé retiré du CSS.

## Écarts restants et doutes
- « Gestion du fût » (retirer du parc, confirmation « Son historique reste au journal. ») figure en plus dans la fiche : la maquette F2 ne le montre pas, mais l'app le permettait avant ; à confirmer par le brasseur.
- « Livrer » est grisé tant qu'aucun client n'est choisi (la maquette le dessine noir).
- À 1280 la feuille s'étale sur toute la largeur (comportement du Sheet de l'app, pas d'un cadre téléphone comme la maquette).
- La pastille de bière prend la teinte du style (pas de mesure EBC dans le fût) ; repère d'âge 90 j pour un style inconnu ; défaut « Combien » = 1 (la maquette montre 3 en exemple) ; « Autre date » via `DateField` sans raccourcis ; « Revenu plein » sans Annuler (comme F2b) ; `Batch.kegIds` non nourri (hors périmètre).
- Pas de « (réglable par style) » dans l'aide d'âge.

DÉCISION À PRENDRE : « Gestion du fût » dans la fiche F2 (absent de la maquette). Options : garder (recommandé, sinon on ne peut plus retirer un fût) ou le placer ailleurs.
CONNAISSANCE : aucune
LEÇON PROPOSÉE : aucune
