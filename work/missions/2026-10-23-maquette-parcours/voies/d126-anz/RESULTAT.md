OK — série anz : quatre entrées de l'analyse sur l'étape rendue, COMMUN OK, captures regardées

## Concepts (une ligne chacun : chaleur, idée, ce qui tient, ce qui casse)
- **anz1** — chaleur tiède — le rail du brassin finit dans le verre : un nœud à chope sur l'alerte, dans l'axe du rail, et « Ma bière › » en pilule ; tient : dit où ça mène avec le nom de l'onglet et pourquoi c'est là (fin du brassin) ; casse : le rail s'interrompt entre post-fermentation et le nœud, et deux entrées sur une ligne.
- **anz2** — chaleur chaude — la vignette radar : le radar m4 de Ma bière en 48 px, dessiné en direct depuis les 12 barres (inconnu en pointillé, Résineux rouge), ouvre Ma bière sur le radar ; tient : montre la destination au lieu de la nommer, et déjà la pointe rouge ; casse : muette (pas un mot), les axes inconnus se devinent à cette taille.
- **anz3** — chaleur chaude — la page d'à côté : le bloc du profil a deux pages, barres puis radar (374 × 300, même échelle) avec la porte « Ouvrir Ma bière › » ; « radar › », deux points, ou glisser ; tient : rien ne bouge au repos, le radar est une vraie deuxième lecture (acquis D7) ; casse : deux touchers jusqu'à l'onglet, un radar qui double celui de Ma bière.
- **anz4** — chaleur chaude — la feuille en attente : l'analyse dépasse en bas de l'étape, avec sa poignée et sa propre en-tête (« Ma bière · Suggestions · Comparer ») ; toucher ou tirer la monte ; tient : la destination se voit avant d'ouvrir, geste de téléphone, visible depuis tout l'écran ; casse : 60 px pris en permanence, l'entrée quitte le bloc du profil, trois destinations.

## Fichiers écrits
- `work/refonte-frontend/v4/ecran-1/fils24-petits-choix/anz{1,2,3,4}/etat.html` (page statique : l'étape rendue de la base v4.10, bundle copié dans `anz*/assets/`, plus le script et les classes `anz*-` de l'entrée), `anz{1,2,3,4}/NOTE.md`
- `work/refonte-frontend/v4/ecran-1/fils24-petits-choix/captures/anz{1,2,3,4}-{repos,toucher}.png` (390 × 844, ×2)
- Scripts de travail dans `%TEMP%/d126-anz/` (capturer.mjs, recadrer.mjs, dom.mjs, points.mjs, debug4*.mjs) ; rien à la racine, rien dans `prototypes/` ni `choix/`.

## Critères
- G1 `SERIE-BIEN-4`
- G2 `COMMUN OK` (couleurs, au-style, survol, blocs, contraste, fiche, standard, trait, legende, parlant, brutes ; mots sauté par le contrat). Un STANDARD ECHEC intermédiaire (S4 : mes pictos à 1,6 px contre 1,2–1,4 pour ceux de l'app) corrigé en alignant les traits à 1,33 px.
- G3 : ce fichier (anz1, anz2, anz3, anz4, chaleur).
- Indicatifs : `mots-premier-ecran --max=80 --sans-donnees` MOTS OK (40, 38, 39, 42 mots hors données) ; `controle-panel.mjs` PANEL ECHEC (ressemblance 0,94, 60 % de paires presque identiques) : attendu, quatre copies de la même étape où seule l'entrée change (règle n° 1 ; même constat que psa) ; `controle-une-question.mjs` sans objet sur l'étape (3 facteurs, pas de ligne de contexte ; la base échoue de même).
- Chaque toucher joué dans Chrome (puppeteer, tactile) : anz1, anz2, anz4 arrivent sur `#/biere` (anz2 sur la vue radar) ; anz3 reste sur l'étape, page 2 ; aucune erreur de page.

## Captures regardées (L12)
Les huit, plus des recadrages ×2 du bloc du profil. Chaque repos est l'étape de la base au pixel près hors de la ligne de l'alerte (anz4 : plus la feuille en bas et 72 px de marge basse). anz4-toucher montre l'onglet Ma bière ouvert : la montée (420 ms) ne se voit pas en capture headless.

## Prédiction
Il gardera anz2 ou anz4 comme idée (« la vignette c'est pas mal mais trop petite » ; la feuille : « ça c'est intéressant mais ça prend de la place »), trouvera anz1 propre mais sans surprise, et dira d'anz3 « deux fois le radar ? ».

## Piège trouvé
La route plein écran de la maquette jouable marque `inert` tous les autres enfants de `body` : un élément fixe ajouté à `body` se voit mais ne reçoit aucun toucher (la capture le montrait, le doigt passait au travers). Il faut le monter dans `.page-shell`.

DÉCISION À PRENDRE : aucune.
CONNAISSANCE : maquette jouable — un ajout statique par-dessus l'écran rendu se monte dans `.page-shell`, pas dans `body` (`inert` posé par la route plein écran) ; le bouton « analyse › » de la base se masque par `.pq-ma-biere-profil-a .pq-ma-biere-pont-analyse`.
LEÇON PROPOSÉE : une capture qui montre un élément ne prouve pas qu'il reçoit le doigt ; jouer le toucher et lire ce qui a changé (hash, écran) avant de dire OK (vu sur anz4 : la capture montrait la feuille, le toucher ouvrait la variante A de la base).
