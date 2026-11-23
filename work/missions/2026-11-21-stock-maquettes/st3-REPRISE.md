# Reprise — D4 Autres stocks refait compact (st3-), 22.11

Arrêt à 152 k (consigne : rendre vers 120 k). Builds et captures rejouables : `node st3-build.mjs && node st3-capture.mjs`
(dans ce dossier ; 6 pages, 6 captures dans `st3-captures/`).

## Fait
- `st3-build.mjs` : lit le décor de `st1-build.mjs` (en-tête, onglets, CSS, rail 1280) sans copie ; classes a3-, b3-, c3-.
  Données : 30 additifs (Sels 7, Acides 3, Clarif. 7, Levure 6, Épices 7), 15 emballages (5 familles), 10 nettoyage (3).
  Filtres dynamiques sur une ligne, comptés sur Autres stocks, zéros cachés, triés : NEIPA 28.11 (3 manquent pour le
  prochain brassin), épuisés 8, bas 8, DDM 2, puis « +1 » (à compter) ; à 1280 tous visibles.
- A (froide) « étagère jumelle » : mur de d2a, un rayon par rangée, un pot par article, tiret = seuil à mi-hauteur,
  sans seuil = barre pâle ; sous chaque colonne l'article le plus urgent (rouge/brun) sinon le compte ; Additifs actif,
  liste triée par urgence. 1280 : 3 murs côte à côte (grille 1.75/1.4/.85), 4 tables par famille avec jauge.
- B (tiède) « casier nommé » : rayon ouvert = colonnes par famille, chaque article nom + quantité + jauge (30 additifs
  lisibles sans défiler) ; Nettoyage replié en une ligne (pots miniatures + ce qui manque en mots). 1280 : 3 casiers
  ouverts, 3e ligne « seuil … / DDM / sans seuil », pictos de famille Emballage.
- C (chaude) « tableau périodique » : une case à symbole par article (Gy, La, NE…), remplie selon le stock, encoches de
  bord = seuil, rouge vide = épuisé, coin orange = DDM, pointillé = à compter. 390 : Additifs + Emballage à gauche,
  Nettoyage, case ouverte (Acide lactique, Commander) et « À agir 18 » à droite. 1280 : les 55 cases d'un bloc, case
  ouverte et À agir à droite.
- Captures ouvertes : a-390, b-390 (bonnes), a-1280 (bonne, « Détart… » à revoir), b-1280 (avant 3e ligne), c-390 et
  c-1280 (avant dernière retouche).

## Reste
1. Ouvrir les 6 captures `st3-captures/st3-{a,b,c}-{390,1280}.jpg` après la dernière passe : c-390 (cases 35×34 : la
   rangée Gose doit tenir au-dessus de la barre du bas), b-1280 (3e ligne, équilibre des colonnes), c-1280 (encoches).
   `st3-capture.mjs` signale « coupé : rg » sur a-1280 : pied d'Emballage/Nettoyage à vérifier.
2. `node work/refonte-frontend/v4/tournoi/outils/controle-panel.mjs work/missions/2026-11-21-stock-maquettes/st3-captures/st3-*-390.jpg`
   puis `controle-commun.mjs --sans=mots` ; recopier les sorties.
3. Commit par chemins (déjà fait pour l'état ci-dessus) ; pas de page de choix (consigne).
