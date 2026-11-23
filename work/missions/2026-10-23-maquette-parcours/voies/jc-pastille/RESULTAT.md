OK — pastille « ~ simulé » au toucher : psa, psb, psc (psc corrigée après critique), JEU-BIEN, COMMUN OK

## Fichiers écrits (tous dans `work/refonte-frontend/v4/ecran-1/fils24-pastille/`)
- `assets/parcours.js`, `assets/style.css` : copies de `prototypes/houblons-v4/maquettes/parcours-comparer/assets/` (Comparer de r6a rendu par la reprise r5).
- `psa/`, `psb/`, `psc/` : `etat.html` (la page r5 telle quelle, plus `<id>.css` et `<id>.js`), `<id>.css`, `<id>.js`, `NOTE.md`. Seul le comportement de la pastille change. Classes préfixées et scripts dans une fonction immédiate (L26).
- `capturer.mjs` : il produit les captures au repos, après un toucher et après le pont « Vraies valeurs ». Il vérifie aussi Échap.
- `captures/<id>-repos.png`, `<id>-toucher.png`, `<id>-suite.png` (390 × 844, ×2).
- J'ai retiré les sondes `sonde*.tmp.mjs`, des fichiers de travail. Entre-temps, un commit du pilote les avait versionnées : `git status` les montre donc supprimées, c'est voulu.

## Les trois
- **psa (froide)** : une bulle sous la pastille. Elle montre « ~ calculé par le moteur » avec fiches + 4 g/L + dry hop, 3 j + US-05, puis un hachuré « pas mesuré dans une bière » et le bouton « Vraies valeurs › », qui ouvre la feuille du dock.
- **psb (tiède, forme imposée)** : la pastille déplie la ligne des sources. Elle est rangée comme le tableau, une colonne par houblon. On y lit le nombre de fiches (8, 4, 3). Sous « mesuré, en bière » : le linalol (Cascade 57 µg/L à 2 g/L, Idaho 7 38 µg/L à confirmer, Galaxy « rien » hachuré), puis le panel (Cascade OSU, les autres « rien »). Chaque mesure ouvre sa feuille. Au repos, seul ajout : un chevron dans la pastille.
- **psc (chaude)** : le radar passe aux rayons X. Il pâlit à 42 %, en couleur, et quatre entrées coulent une fois vers un « ~ » central immobile (« le moteur calcule »). Au pied du radar : « pas mesuré en bière » et « le mesuré » avec les pictos de Valeurs et Preuve, que le dock entoure.
- **Au repos** : aucun mot ajouté (95 mots, comme r5).
- **Fermeture** : un toucher ailleurs ou Échap referme. Échap est intercepté avant le retour de l'app ; sans cela, Échap renvoyait l'écran vers Suggérer, ce que psb a révélé et qui est corrigé.

## Passe 2 de psc (critique du 24.10, `fils24-pastille/CRITIQUE.md` : REJET)
- J'ai retiré l'étiquette flottante « le mesuré ↓ », qui couvrait « ~1,3 » d'Idaho 7 dans la rangée « dry hop ». « Le mesuré » est passé au pied du radar. Mesure : le calque s'arrête à y 443,8, le tableau commence à 451,8, rien ne se pose dessus.
- Le radar passe de 16 % en gris à 42 % en couleur. Le battement est coupé (`animation-name: none` sur le « ~ »), et le flux ne boucle plus.
- psa et psb ne sont pas touchées. psc a été recapturée (repos, toucher, suite) et les captures sont ouvertes. Sur le rendu, le repos est inchangé, et au toucher on lit « ~1,3 ».

## Critères
- G1 : `JEU-BIEN` (rejoué après la passe 2).
- G2 : `COMMUN OK` (rejoué après la passe 2). Les contrôles couleurs, au-style, survol, blocs, contraste, fiche, standard, trait, legende, parlant et brutes sont tous OK ; mots est sauté par `--sans=mots`, comme le prévoit GATES.
- Hors GATES, joués une fois :
  - `controle-choix.mjs --ecran=comparer` : **CHOIX OK** pour psa, psb et psc, rejoué pour psc après sa passe 2. Le test se fait sur une copie dans `os.tmpdir()`, avec la NOTE de r5 pour l'inventaire.
  - `mots-premier-ecran` : 95 mots pour la base comme pour les trois, donc aucun mot de plus.
  - `controle-panel` : PANEL ECHEC (ressemblance 0,96). C'est attendu : le contrat demande trois copies de la même page, ce qui n'est pas un panel v0.
- `capturer.mjs` sur les trois : la pastille passe de `aria-expanded` false à true, Échap la remet à false, le pont ouvre « Vraies valeurs et chimie », et aucune erreur de page.

## Captures (regardées)
`work/refonte-frontend/v4/ecran-1/fils24-pastille/captures/` : `psa-repos.png`, `psa-toucher.png`, `psa-suite.png`, `psb-repos.png`, `psb-toucher.png`, `psb-suite.png`, `psc-repos.png`, `psc-toucher.png`, `psc-suite.png`.

## Prédiction
Il prendra psb pour le « mesuré, en bière », houblon par houblon (Galaxy : rien), ou psc pour l'image, maintenant que le tableau reste lisible. psa, il la dira « ok mais on voit plus le radar ».

DÉCISION À PRENDRE : aucune (le brasseur choisit entre les trois). Point à lui montrer : le chevron de psb est le seul signe ajouté au repos.

CONNAISSANCE : dans la maquette jouable, Échap sans feuille ouverte fait reculer d'un écran (vers Suggérer). Un élément ajouté qui s'ouvre au toucher doit intercepter Échap avant le retour de l'app (`keydown` en capture). Un `[role=dialog]` visible l'évite aussi.

LEÇON PROPOSÉE : aucune
