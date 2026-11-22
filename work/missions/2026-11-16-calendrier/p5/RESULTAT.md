OK — p5 : g5, c4e5, c2h5 ; + en pile au pouce (Partout toujours là), 23 sur 23 corrigés

Fichiers écrits : `p5/build.mjs` (p4/build.mjs + 69 retouches vérifiées une à une), `p5/montage.mjs` (copie), `p5/{g5,c4e5,c2h5}/etat.html`,
42 captures, planches `p5/_pl-*.png`. Rien d'autre n'est touché.

## Le + (bloquant n° 1)
Il reprend la pile au pouce de b1s-b (« Ça j'aime énormément », 15.11) avec sa règle : « certaines actions doivent toujours être possible,
juste celle de l'écran actuel sont plus mis en avant. Et le bouton doit toujours être flottant ».
- En haut, loin du pouce : **Partout**, toujours là, en pilules compactes 2 × 3 : Nouvelle écriture, Facture, Encaisser une vente,
  Créer une recette, Lancer un brassin, Compagnon.
- Près du pouce : **Sur Calendrier** (Et si…, Aujourd'hui), puis **Poser en S50 · 7 déc.** (Activité sans budget, Achat ou travaux,
  Fête ou vente, et Brassin en pilule pleine, juste au-dessus du ×).
- Un seul accent : la pilule pleine prend la couleur du + (noir en clair, jaune en cave). On évite ainsi le défaut b1s-b n° 4.
- Paysage : trois colonnes alignées en bas (Partout, Calendrier, Poser), à gauche du ×. Rien ne déborde (état `paysage-plus`, nouveau).
- « Lancer un brassin » (Partout, maintenant) et « Brassin » (Poser en S50, au plan) restent deux gestes distincts, pas un doublon.

## Les 23 problèmes de p4/CRITIQUE.md
1. **Corrigé** : groupe Partout ci-dessus. Preuve : `*/…-plus-390.png`, `…-plus-cave-390.png`, `…-paysage-plus-844.png`, `…-plus-1280.png`.
2. **Corrigé** : 1280 a sa propre mise en page. g5 montre 26 semaines (S47 → S20), avec une gouttière pour le +. c4e5 garde
   les couloirs à gauche et « Les 6 semaines » en colonne de 380 px à droite ; les textes passent de 11 à 13 px. c2h5 a la courbe
   à gauche (480 px) et le détail à droite, limité à 760 px : le vide de 800 px disparaît. Preuve : `…-repos-1280.png`, `_pl-1280.png`.
3. **Corrigé** : le grand chiffre de f1 est en tête des trois : « 259 reste au plus serré · S24 · 14 juin ». Dans la courbe, on lit
   « au plus serré · 259 », comme dans f1. Preuve : `…-repos-390.png`.
4. **Corrigé** : un libellé que le + couvrirait passe à sa gauche, ou garde seulement son nom (contrôle `sousFab` au rendu). Preuve : `c4e5-repos-390.png`.
5. **Corrigé** : un libellé ne commence jamais avant aujourd'hui + 5 px. La ligne d'aujourd'hui passe sous les libellés, qui ont un halo. Preuve : `c4e5-repos-390.png` (« Blonde · −148 »).
6. **Corrigé** : chaque brassin affiche son coût à toutes les largeurs (« Blonde · −148 »). Preuve : `c4e5-repos-390.png`, `…-1280.png`.
7. **Corrigé** : en paysage, quatre couloirs sont visibles (Brassins, Fêtes, Ventes, Achats) au lieu de deux. Une gouttière de 84 px
   laisse la place au +. Preuve : `c4e5-paysage-844.png`.
8. **Corrigé** : la phrase « Un genre par couloir… » est retirée.
9. **Corrigé** : les étiquettes de l'axe ont un halo, la courbe ne barre plus « 4 000 ». Preuve : `c2h5-repos-390.png`.
10. **Corrigé** : la pastille des hypothèses a sa propre ligne, sous le grand chiffre et le bouton Plein écran. Preuve : `c2h5-repos-390.png`.
11. **Corrigé** : l'étiquette du cadre évite celle du plus serré (au centre, à gauche, à droite, sinon sous le cadre). En geste, on lit
    « S14 → S38 » sous le cadre et « au plus serré · 259 » en entier. Preuve : `c2h5-geste-390.png`, `…-cave-390.png`.
12. **Corrigé** : le Frigo glissé reste sur sa propre ligne. « vert tient » est lisible. Preuve : `c2h5-geste-390.png`.
13. **Corrigé** : le Frigo glissé est en encre sur fond (clair sur sombre en cave), avec un bord de la couleur des achats. Preuve : `c2h5-geste-cave-390.png`.
14. **Corrigé** : le libre se lit en tête de semaine. Au repos, « 3 872 » de S49 est au-dessus du + ; s'il le touchait encore, la semaine
    passerait sous lui. Preuve : `c2h5-repos-390.png`.
15. **Corrigé** : « présence 2 j », marquée exemple, est dans la pastille des hypothèses des trois variantes.
16. **Corrigé** : en paysage, les puces passent sur deux lignes, sans rien de coupé. « libre » se place à au moins 4 semaines des poignées. Preuve : `c2h5-paysage-cave-844.png`.
17. **Corrigé** : les filtres sont Brassins, Fêtes, Ventes, Achats, Travaux, Sans budget et Charges. Les Sols sont sous Travaux, le Marché de Noël sous Fêtes.
18. **Corrigé** : les couloirs miniatures passent de 2 à 6 px, sur trois rangées au plus. Toucher la bande y amène la vue. Preuve : `c2h5-repos-390.png`.
19. **Corrigé** : plus de trace du toucher au repos ; « S50 · 7 » est lisible. Preuve : `g5-repos-390.png`, `g5-repos-1280.png`.
20. **Corrigé** : un libellé posé hors de sa barre a un fond et passe au-dessus des colonnes et du curseur : « Malt groupé −540 » est net.
    Il reste posé contre sa barre, à sa gauche. Preuve : `g5-repos-390.png`.
21. **Corrigé** : il n'y a plus de bouton principal. « Retirer du plan » est un bouton secondaire au texte rouge, placé en dernier. Preuve : `g5-geste-390.png`.
22. **Corrigé** : en paysage, 18 semaines, dates en 10 px sans retour à la ligne (« 1 mars »). Le tableau laisse 104 px au +, qui ne
    couvre plus Blanche. Preuve : `g5-paysage-844.png`.
23. **Corrigé** : « Fête ou vente · marché, fête, café ».

## Sorties
- `node p5/build.mjs` → `ECRIT c4e5 / c2h5 / g5` ; `plus bas 259 S24 · sans Embouteilleuse 3 059 S24` (même moteur que p4).
- `node p2/capt.mjs p5 repos,geste,plus g5 c4e5 c2h5` → CAPTURES OK. `PAYSAGE=1 … paysage,paysage-plus` → CAPTURES OK. `LARGEUR=1280 … repos,plus` → CAPTURES OK.
- `controle-panel.mjs` sur les 42 captures → PANEL ECHEC, diversité 2 % : les seules paires presque identiques sont les états +,
  et le menu est volontairement le même dans les trois variantes. Sans les états + (24 captures) : remplissage médian 0,71,
  0 sous 0,50, 0/276 paires presque identiques, **PANEL OK**.
- Non joués : `controle-commun`, `controle-choix`.

Captures : `p5/<v>/<v>-{repos,geste,plus}-{390,cave-390}.png`, `<v>-{paysage,paysage-plus}-{844,cave-844}.png`, `<v>-{repos,plus}-{1280,cave-1280}.png`
(v = g5, c4e5, c2h5). Ouvertes : `_pl-g5-clair`, `_pl-g5-cave`, `_pl-c4e5-clair`, `_pl-c2h5-clair`, `_pl-c2h5-cave`, `_pl-paysage` (deux versions),
`_pl-1280` (g5, c4e5, c2h5). Non ouvertes une à une : `c4e5` en cave à 390, les 1280 en cave.

Restes vus, non comptés :
- c2h5 geste : en défilant, le + couvre la fin d'« Ambrée » (page défilée, pas au repos).
- À 390, « Encaisser une vente » passe sur deux lignes dans sa pilule compacte.
- Greffes de la critique (cuve dans c4e5, feuille de période dans g5, glisser pour « La déplacer ») : non faites dans cette passe.
- La place de l'onglet Calendrier (3e sur 6) reste un choix ouvert, à lui montrer.

Prédiction : « Là j'ai mes actions de partout en haut et le calendrier sous le pouce, et le 259 en gros comme f1 : g5 c'est mon tableau. »

CONNAISSANCE : un + volant ne cache rien au repos si chaque vue vérifie au rendu ce qui passe sous lui (`sousFab`) : un libellé passe
à sa gauche, une valeur clé se lit en tête de bloc. En paysage et à 1280, une gouttière de 84 à 104 px lui est réservée.
LEÇON PROPOSÉE : un contrôle de diversité (controle-panel) se joue sans les états d'un composant commun voulu identique (le menu du +) ;
sinon, il échoue par construction.
