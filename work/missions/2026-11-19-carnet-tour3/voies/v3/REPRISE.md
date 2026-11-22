# REPRISE v3 (19.11, reprise 2) : agent arrêté à 200 k (hook). 9 états jugés sur 16, dans RESULTAT.md

## URGENT au départ
- La tâche de fond du serveur Vite (port 5186) s'est terminée seule après la dernière mesure (code 127, non vérifié depuis).
  Avant de relancer : `netstat -ano | grep ":5186 .*LISTENING"` ; s'il reste un processus, `taskkill //PID <pid> //T //F`. En fin de voie : port libre.

## Banc (corrigé dans cette reprise, fichiers de la voie seulement)
- `vite.v3.config.mjs` : `cacheDir` = `%TEMP%/v3-vite-cache` (le cache partagé de port-carnet donnait « Invalid hook call »), `hmr:false`,
  `watch:null` (d'autres sessions éditent port-carnet et rechargeaient la page). Relance (cwd port-carnet, en fond) :
  `VITE_FIREBASE_API_KEY=fake node_modules/.bin/vite --config ../Brasserie/work/missions/2026-11-19-carnet-tour3/voies/v3/vite.v3.config.mjs --port 5186 --strictPort`
  Chauffer : `node t1.mjs` jusqu'à `boutons: ["…` (1 à 2 passes).
- `outil.mjs` : ouverture rejouée si page vide ; « Facture, photo ou PDF » se touche par aria-label (`label: true`).
- Leçons de banc : les champs d'une ligne de Plateau ne s'éditent qu'après avoir touché la ligne (prendre le DERNIER élément du label) ;
  saisie à la main : Actions rapides › « Facture, photo ou PDF » (label) › « Saisir sans justificatif » ; « Pour quoi ? » est obligatoire
  pour Enregistrer ; lignes manuelles : « Articles, stock et matériel », `Stock ligne N` = « Nouvel article » fait paraître `Quantité ligne N` et `Unité ligne N`.
- Scripts joués : g1 (LR1-6, doc25/doc14/doc2, LR1-9), g3/g4 (T3-7, T3-6, M9-3), g5 (LR1-7, BE-23, BE-27). Captures dans `captures/`.
- Une écriture « ZZ TEST — v3 dépense » 1,00 à payer existe dans le Dexie du Chrome sans tête (profil jetable, rien en ligne).

## Reste à faire (RESULTAT.md : lignes « non-joue »)
1. E1-2 : saisie à la main de 3 lignes, « pièce » sur chacune. En saisie à la main, l'unité vient de `Unité ligne N` après « Nouvel article » ;
   les cases « Unité à remplir, ligne N » sont celles du Plateau (feuille de lecture, ex. banc `medicament` + « + Ajouter une ligne »).
   Enregistrer/Confirmer, rouvrir l'écriture depuis Finances › Opérations, lire l'unité de chaque ligne.
2. BR-27 et TE-36 : `node ../f3/captures.mjs http://localhost:5186/ <chemin absolu de v3/captures> 390-clair 1280-cave` (script f3 prêt, il écrit br27-*, te36-*).
3. TE-35 : `UpgradeSheet` (champ « Livraison TTC (CHF) », prix, installation) : ouverte par FinancesTab (`setUpgrade`) ou UpgradeWorkspace (`setEditing`).
   Trouver le bouton : `grep -n "setUpgrade(" src/components/tabs/FinancesTab.tsx`. Saisir « abc », « −5 », « -5 » : message « ce n’est pas un nombre… ».
4. LR1-14 : Finances › Annuel, noter « n / 9 prêtes », Confirmer une dépense (banc `medicament`), relire.
5. BE-23 : barre `correctionBarre` (ExpenseSheet:1059) seulement pour `precisIds` (ligne au stock sans unité) ; essayer `medicament`,
   ligne ouverte, « + Ajouter au stock », puis chercher « imprimé … ? · g kg pièce ».
6. LR2-3 : reste « non-tranché » (doc25 : 7 désaccords affichés pour 35 points, dont 6 nature) ; trancher seulement si le code du compte est lu.
7. Puis question ouverte sur chaque écran traversé, arrêter le serveur, vérifier le port 5186 libre.
