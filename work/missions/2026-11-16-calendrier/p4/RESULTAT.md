OK — p4 : c4e4, c2h4, g4 avec le + volant et ses actions de calendrier

Fichiers écrits : `p4/build.mjs` (repris de `p3/build.mjs`, moteur lu dans `p2/c4e2/p2-build.mjs`), `p4/montage.mjs` (copie),
`p4/{c4e4,c2h4,g4}/etat.html`, 30 captures, planches `p4/_pl-*.png`.

Règle n° 1 (« Le + n'a jamais été en bas, c'est un bouton "volant" […] il pourra avoir ces propre action calendrier ») :
- La barre fixe (dock) est supprimée. Le + est un bouton volant en bas à droite, au-dessus de la barre du bas (à 14 px du bord en paysage).
  Il porte la semaine en cours de lecture (« + S47 », « + S14 », « + S50 », selon la vue).
- Le toucher ouvre ses actions, état `?etat=plus` : d'abord le groupe « Calendrier » (« Et si… » pour barrer une chose et voir la
  caisse, « Aujourd'hui » pour revenir en S47), puis « Poser en S47 · 16 nov. » avec Brassin, Fête ou vente, Achat ou travaux et
  Activité sans budget (pointillés). Un voile couvre le reste de l'écran et le + devient ×.
- Une zone libre est réservée en bas du contenu : 150 px à 390, 84 px en paysage. Les boutons qui étaient dans le dock sont
  replacés hors de la zone du + : « Plein écran » dans l'en-tête (c4e4), les zooms sous le titre (c2h4), la ligne de la semaine
  au-dessus du tableau (g4), « et si » dans une carte posée sous le tableau (g4). Une feuille ouverte masque le +.

Défauts corrigés :
- c2h3, paysage : « Revenir » passe sur la ligne du titre et la caisse sur la ligne suivante. Rien ne déborde
  (`c2h4-paysage-844.png`). Les puces défilent sur une ligne.
- c2h3, signe : les montants à fenêtre ont leur « − » (« Frigo · −1 800 », « −166/sem. », « payé −1 800 »). La bulle du Frigo reste
  dans l'écran.
- c4e3, cible : une chose d'une semaine (moins de 16 px) devient une pastille de 16 px. Barres et pastilles reçoivent une cible
  invisible de 28 × 28 px au moins.
- g3, cible : les aimants font 24 px de large au moins et ont une cible de 30 px de haut.
- g3 « et si », lisibilité : l'aimant barré est opaque, hachuré, avec un trait rouge. Sur la bande, le libellé est « sans elle :
  plus bas 3 059 · S24 », en vert sur halo. Le barré à faible contraste est supprimé.
- g3 « et si », rangée Libre : la carte est sous le tableau et la page défile jusqu'à elle. On voit la rangée Libre entière, ancien
  et nouveau niveau (`g4-geste-*.png`). Au repos, la légende tient sur une ligne et la rangée Libre reste visible au-dessus du +.

Sorties :
- `node p4/build.mjs` → `plus bas 259 S24 · sans Embouteilleuse 3 059 S24` (même moteur que p3).
- `node p2/capt.mjs p4 repos,geste,plus c4e4 c2h4 g4` → CAPTURES OK.
- `PAYSAGE=1 node p2/capt.mjs p4 paysage c4e4 c2h4 g4` → CAPTURES OK.
- `LARGEUR=1280 node p2/capt.mjs p4 repos c4e4 c2h4 g4` → CAPTURES OK.
- `scripts/agents/controle-panel.mjs` : manquant. À la place, `work/refonte-frontend/v4/tournoi/outils/controle-panel.mjs` sur les
  30 captures → `remplissage médian 0,72, 0 sous 0,50 · paires presque identiques 3/435 (1 %)` · PANEL OK.
- Non joués : `controle-commun`, `controle-choix`.

Captures : `p4/<v>/<v>-{repos,geste,plus}-{390,cave-390}.png`, `<v>-paysage-{844,cave-844}.png`, `<v>-repos-{1280,cave-1280}.png`
(v = c4e4, c2h4, g4). Planches ouvertes, clair et sombre : `p4/_pl-<v>-{clair,cave}.png`, `p4/_pl-paysage.png`,
`p4/_pl-c2h4-paysage.png`, `p4/_pl-1280.png`. Les captures sombres de 1280 n'ont pas été ouvertes une à une.

Restes vus, non corrigés :
- Au repos, sans défilement, le + couvre encore du contenu non interactif : la fin de deux libellés dans c4e4 et la colonne
  « libre » de S49 dans c2h4. La zone libre ne le dégage qu'en bas de page.
- c2h4, geste : l'étiquette « S14 → S38 » du cadre mange « plus bas 259 ».
- À 1280, la mise en page reste celle du téléphone, étirée.

Prédiction : « Là le + vole, et il connaît le calendrier : je barre l'Embouteilleuse et je vois 3 059. »

CONNAISSANCE : un + volant garde sa place si la page réserve 150 px de bas de contenu (56 de barre, 14 de marge, 56 de bouton, plus
une marge) et que les actions qui vivaient dans une barre fixe retournent dans la page (en-tête, carte sous la vue).
LEÇON PROPOSÉE : aucune
