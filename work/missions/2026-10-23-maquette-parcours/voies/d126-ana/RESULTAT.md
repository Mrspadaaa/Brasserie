OK — série ana : quatre entrées de l'analyse (carte, feuille, station, aperçu), baseline et choix tenus

## Les concepts (une ligne chacun)
- **ana1**, chaleur froide : A affinée, le bloc devient une carte qui s'enfonce au doigt, et une ligne annonce « 6 au style · 5 non situées · résineux ×2,8 ». Tient : A reste A, l'annonce dit ce qu'on va trouver. Casse : l'état pressé se voit peu sur une image fixe ; ×2,8 figé pour ce cas.
- **ana2**, chaleur tiède : le bloc est le haut d'une feuille (poignée, « Ma bière ⌃ ») ; toucher ou pousser fait monter la vraie page Ma bière depuis sa place. Tient : la forme dit « une page dessous », le mouvement relie l'étape et l'analyse. Casse : la feuille ne colle pas au bas de l'écran ; rayons ramenés à 8 px (S3).
- **ana3**, chaleur chaude : la frise a une dernière station, « ma bière », dont le nœud est un verre à la couleur de l'EBC. Un fil pointillé continu y mène depuis post-fermentation, en contournant les ajouts par la marge ; au toucher, le fil se remplit, puis le verre s'enfonce. Tient : il pense en brassin, et le verre se lit sans légende. Casse : le fil frôle le bord des ajouts (4 px) ; aucun chiffre de l'analyse. Reprise après le rejet du critique (D82) : l'onde grise est retirée, le toucher est capturé à sa dernière image, le fil est continu ; COMMUN OK et CHOIX OK rejoués.
- **ana4**, chaleur chaude : « Ma bière » est souligné de points comme un nom de houblon ; un toucher bref ouvre l'onglet, un appui long ouvre un aperçu (verdict, résineux ×2,8 sur sa barre, bande des 12, « Ouvrir l'analyse › », croix). Tient : le même geste que ses fiches, et il voit sans quitter l'étape. Casse : l'appui long est à deviner ; une seule famille fautive est montrée.

## Fichiers écrits
- `work/refonte-frontend/v4/ecran-1/fils24-petits-choix/ana{1,2,3,4}/` : `etat.html`, `ana<n>.js`, `ana<n>.css`, `NOTE.md`, `assets/` (copie de `prototypes/houblons-v4/maquettes/parcours/assets/`).
- `work/refonte-frontend/v4/ecran-1/fils24-petits-choix/captures/ana<n>-repos.png`, `ana<n>-toucher.png`, `ana<n>-suite.png` (n = 1 à 4).
- Scripts de travail (hors dépôt) : `%TEMP%/d126-ana/` (capturer.mjs, maquettes construites pour controle-choix).

## Critères (rejoués depuis la racine)
- G1 : `SERIE-BIEN-4`.
- G2 : `controle-commun … ana1 ana2 ana3 ana4 --page=etat.html --sans=mots` donne `COMMUN OK`. Couleurs, au-style, survol, blocs, contraste, fiche, standard, trait, légende, parlant et brutes passent. Deux échecs ont été corrigés en route : S3, des rayons de 16 et 24 px ; S4, un trait de 1,7 px.
- G3 : `systeme.mjs note … --contient "ana1,ana2,ana3,ana4,chaleur"` donne `NOTE OK`.
- Règle n° 1 : `controle-choix.mjs <maquette construite, ma-biere remplacée par le concept> --ecran=etape-houblons` donne `CHOIX OK` pour ana1, ana2, ana3 et ana4. Deux corrections avant cela :
  - ana2 écrivait « Ma bière » en CSS, invisible pour `controle-profil-ouvre` ;
  - ana3 et ana4 masquaient le bouton de A, donc ETATS ne rejouait plus `etat-etape-analyse`.
- Indicatif :
  - mots hors données : 45, 40, 40, 40 ;
  - `controle-une-question` ne s'applique pas : l'étape n'est pas un écran d'outil ;
  - `controle-panel` (8 captures) : PANEL ECHEC. Médiane de remplissage 0,54, ressemblance 0,86, 2 paires sur 28 presque identiques (ana1 et ana3, entre repos et toucher). C'est attendu : le contrat pose les quatre concepts dans le même écran, seul le bloc change.

## Captures (regardées, à côté de base-profil.png et d121-a.png)
`work/refonte-frontend/v4/ecran-1/fils24-petits-choix/captures/` :
- ana1-repos, ana1-toucher (doigt posé) ;
- ana2-repos, ana2-toucher (la page Ma bière à mi-montée, ralentie ×8) ;
- ana3-repos, ana3-toucher (dernière image : fil rempli, verre enfoncé) ;
- ana4-repos, ana4-toucher (l'aperçu).

## Prédiction
« ana4 très bien, l'aperçu c'est ce qu'il manquait. ana3, le verre j'aime beaucoup mais il flotte. ana2 pas mal. ana1 trop proche de A. »

DÉCISION À PRENDRE : aucune. Pour la passe 2 : ×2,8 est figé pour ce cas (la maquette n'expose pas le moteur de l'onglet), à brancher sur `lireBiere` si un concept est retenu.

CONNAISSANCE : Chrome sans tête (puppeteer) répond `prefers-reduced-motion: reduce`. Un mouvement gardé par cette requête ne se joue donc pas en capture : il faut `page.emulateMediaFeatures([{ name: 'prefers-reduced-motion', value: 'no-preference' }])`. Les contrôles, eux, voient l'écran sans mouvement.

LEÇON PROPOSÉE : un concept qui masque un bouton de la base (`display: none`) lui fait perdre son `data-etat`, et `controle-choix` échoue (ETATS) : restyler le bouton de la base plutôt que le cacher et en poser un autre.
