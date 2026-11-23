# Reprise 4 : port D420 (Stock), 22.11, arrêt à ~152 k (Sonnet)

Code : worktree `C:/Users/mrspa/.codex/worktrees/openai-clean-start/port-carnet` (branche `claude/port-carnet-1711`). Tout est commité. Script : `%TEMP%/pc/commit.sh "message" chemin...`.
Règle du brasseur 22.11 : un thème (clair), 390 tactile en profondeur, 1280 en simple contrôle (passes des étapes réduites à `['390-clair','1280-clair']`).

## Fait
- `7b7fa60b4` D8a : Matériel en parc (`ListeParc.tsx`, `parc.css`, `EquipmentList.tsx` réécrit, `readAvenirParc` dans StocksTab). En-tête « Parc 900 CHF + N ? », lignes (tuile, nom, sous-ligne, prix mono ou « ? » pointillé, ›), « À venir » sous le parc (plans d'équipement ; « carnet · N façons » seulement si carnet source trouvé, prix « ? » si inconnu), plus de frise ni de filtre Tout / À traiter ni de gestes Fait/Réparée dans la liste (restent dans la fiche). « N projets » de la maquette NON écrit : aucun lien appareil → projet (inconnu ≠ « aucun projet »). Captures 390 clair/cave et 1280 clair ouvertes. D8A-1 vert (4 passes) et ROUGE OK sur tour9 ; `materiel.mjs` (STC-16) vert. Vitest : `equipmentTimeline` réécrit (8 tests de la frise remplacés), `materielFicheStocks` N1 réécrit (plus de note « à jour jusqu'au » dans la liste) : 27 verts.
- Commit suivant (hash : voir `git log -1`) : barre de rayon de Recompter teintée par famille (`data-fam` sur `.sz-r-ray`, CSS en fin de `recompter.css` : Malts beige `#F6EBD9`, Houblons vert, Levures fauve ; cave par color-mix) ; `stock-etapes/recents.mjs` (RECENTS-1 : pastille « récents » avec un mouvement ZZ posé aujourd'hui ; RECOMPTER-TEINTE).
  - RECENTS-1 : ROUGE OK sur tour9 (pastille absente), vert sur l'arbre ; capture 390 ouverte (filtre « récents 1 », article ZZ TEST Récent).
  - **RECOMPTER-TEINTE : PAS rouge sur tour9** (ROUGE INCOMPLET) : tour9 avait déjà des barres de couleurs différentes selon les rayons. À resserrer : comparer la barre Malts à la teinte exacte de la maquette (beige ≈ 246,235,217) et exiger la jauge brune ; ou constater que la plainte était déjà tenue et le dire au pilote. Rejeu rouge : `PARCOURS_GARDER` inutile, build tour9 `%TEMP%/parcours-stock-build-knPvVB`, `--rouge RECOMPTER-TEINTE`.
  - Captures Recompter 390 et 1280 ouvertes : barre Malts beige, bouton Compter contour, jauge.

## Reste, dans l'ordre
2. **vitest rouges** : `stockCompteursOnglet` (6), `compactStocks` (pastille ★ épinglés = `.sz-etoile[data-f=epingles]`, `aria-label` « Épinglés : N »), ceux de STOCK-TRI-INUTILE (`stocksPaquetG` : « Trié par » à réécrire). Causes : pastilles dynamiques (seulement n > 0 ; 4 à 390, 6 en large), sous-onglets = boutons `aria-current` et non `tab`, `data-autre="Emballage"` (voir voie Autres stocks). Lancer d'abord `npx vitest run <fichiers>` filtré (`grep -E "×|Tests "`).
3. `stock.mjs` et `fiche.mjs` complets en arrière-plan (un thème : clair 390 + 1280), sortie filtrée (`grep -E "KO|OK|PARCOURS"`). `fiche.mjs` STC-7 lit la barre supprimée de la tête : adapter. Vitest qui lisent `data-stock-besoin`, `sfp-cord`, `.sfp-pasr`, `Dernier prix`, `sfp-qrow`, `data-barre`, « Caractéristiques techniques · α » : `compactStocks`, `defautsStocksEcrans`, `iaFichesStock`, `scripts/check-invoice-journey-emulator.mjs`.
4. Brasserie `work/missions/BUGS.md` : lignes « Pck = 25 g » (taille de paquet, aucune donnée : ouvert) et date d'achat sur la pastille prix (ouvert, données manquantes), plus « N projets » du Matériel (pas de lien appareil → projet) ; `node scripts/agents/controle-bugs.mjs` ; commit Brasserie par chemins (`git add -f`).

## À dire au pilote
- d5a : « Pck = 25 g · il en reste » non reproduit ; pastille prix sans date ; besoin « ? » quand source manque ; code mort `infoEntree`, `phraseSeuil` dans `StockDetailSheet.tsx`.
- d8a : pictogrammes de l'app (silhouettes za3) à la place de ceux de la maquette ; `ListFil.tsx` garde du code mort (`FilHaut`, `FilSans`, `FilPied`, `FilVide`) : suppression à accorder ; ligne « À venir » sous le parc double le segment À venir (comme la maquette).
- Écart d7a 390 (mur Malts qui défile, « Sucres » coupé) : toujours ouvert (reprise 3, point 1).
