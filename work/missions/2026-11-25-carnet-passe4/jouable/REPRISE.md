# REPRISE — jouable passe 4 (agent concepteur arrêté à 350 k, 25.11 nuit)

## Fait
- `p4.html` (2 516 lignes) assemblé par `scratchpad/p4/build.mjs` (tranches de lignes de m4b.html + fragments, sans remplacement de chaîne, L26).
  Fragments (copie de travail, scratchpad de session) : css.txt, html.txt, exemples.js, liste.js, cible.js, ouvrir.js, consigne.js, valider.js, organise.js.
  Si le scratchpad a disparu : éditer `p4.html` directement (les fragments y sont, repérables par « passe 4 »).
- Moteur m4b gardé ; corrigé : symboles `i-*`, aucun id d'élément `i-*` (build : collision 0, doublons 0) ; clé localStorage `p4-jouable` ;
  propositions : l'état mis par l'IA se coupe dans « Changé par l'IA » ; « Résolu ? » plus proposé sur un carnet déjà résolu.
- Consigne étendue (mot de jeton, qui, estimé, attente, manque, attention, relecture + calcul, valeurs « page » lues sur les liens, emoji de valeur) ;
  `valider` vérifie chaque ajout (pages lues, nombres des calculs, « estimé » posé par la page si SA ligne le dit).
- 19 exemples (14 + 5 fictifs « ZZ TEST — ») ; citra porte ce que l'app a lu sur ses pages (fixture c75).
- Réponses écrites à la main : `reponses/ecrire.mjs` → 19 JSON + `index.json` (+ aide écoulement). Erreur voulue : chaudière (état « Décidé », lecture inventée).
- `cap.mjs` joué : **gestes 19/19**, 0 erreur de page, 63 captures dans `cap/`, `cap/resultats.json` (mesures, mots vus par cas).
  Liste : 14 lignes entières, 82 % de la hauteur. Première info utile : 52 px sous la barre partout (cave 85 px).

## Pas fait (à reprendre, dans cet ordre)
1. **Mots > 30** au premier écran d'Organisé (ORGANISE-TROP-TEXTUEL) : CO2 35, fête 37, frigo 44, levure 52, malt 46, pompe 43, citra 47,
   600 bouteilles 56, IA en erreur 81, assurance 32, inspection 32, vapeur 33. OK : écoulement 28, chaudière 29, sureau 26, bar 25, starter 28, cave 24, embouteillage 17.
   Pistes : relecture (savais/fait) trop textuelle → n'afficher que l'emoji + 2 mots, ou replier « tu savais » ; erreur : « Tes notes, telles quelles » sous la ligne de flottaison
   (ou repliées) ; achat 3 colonnes : retirer « calcul » répété, critères en icône seule ; frigo : retirer le label des chiffres ; « Toujours le bon choix ? » compte 4 mots.
   Le détail des mots comptés est dans `cap/resultats.json` (champ `vus`).
2. **Aucune capture n'a été ouverte** (Read) : les ouvrir toutes (63) avant de rendre, puis CAS.md (cas → OK / problème → corrigé, capture).
3. CAS.md et RESULTAT.md à écrire ; commit local de `work/missions/2026-11-25-carnet-passe4/jouable/` seul (`git add -f`, `git commit -- <chemin>`).

## Rejouer
`node C:/Users/mrspa/AppData/Local/Temp/claude/2574149e6fd34767/f97e7359-a046-4072-af48-f44ecac2f73e/scratchpad/p4/build.mjs` (si fragments modifiés),
puis `node work/missions/2026-11-25-carnet-passe4/jouable/reponses/ecrire.mjs` (si réponses modifiées),
puis `node work/missions/2026-11-25-carnet-passe4/jouable/cap.mjs` → attendu `GESTES 19/19`, `ERREURS PAGE 0`, mots ≤ 30 par cas.
