# fb9 p3 : fb enrichi, lisible en 3 secondes (prototype cliquable, 16.11)

Prototype : `fb9/p3/proto.html`, autonome. Source : `src.html` + `app.js`, assemblés par `node fb9/p3/build.mjs` (palette et pictos de fb via p1, split/join ;
refuse `type="number"` et tout picto absent). Rejeu : `node fb9/p3/capt.mjs [etat,…]` (`PAYSAGE=1`, `LARGEUR=1280`, `CLAIR=1`) ; tâches : `node fb9/p3/mesure.mjs`.
Paramètres : `?theme=cave`, `?ep=b`, `?partage=1`, `?etat=icone`, `?horsligne=1`, `?essai=1`.

## Repris de fb (règle n° 1) et rendu
- Grand chiffre « 166 CHF · à te permettre », « au plus serré S24 », fil de la courbe ; courbe dépliée d'un toucher avec caisse 4 180, +120 / sem. et **présence 2 j**, glissables (exemple).
- **Libre en fin de semaine** sous chaque S (fb), rouge sous 0 ; charge en pastilles (●○), dépassée en pilule rouge « 4/2 j ».
- « + » devant tout montant positif (+1 180, +640, +520).
- Frise par voie colorée, barres teintées à bord plein, montants pointillés glissables, + volant, onglet Calendrier.

## Lisibilité (corrections des juges)
- Un nom, une place : dans la barre s'il tient (mesuré au canvas), sinon une ligne dessous alignée au bord gauche (au bord droit en dernière colonne) ; picto puis nom à droite, dessous si la place manque. Jamais « … ».
- Zéro redite : une chose montrée dans Maintenant devient un point teinté sans nom sur la frise (`[data-dot]`, un toucher fait clignoter sa tuile) ; « +n » montre des pictos, pas de noms.
- Conflit écrit sur la chose : « cuve 1 ×2 » (Stout), « malt manque » (Porter), « manque » (Munich) ; « Cuve 3 en panne » en entier ; barre qui continue : chevron au bord.
- Brassin : pictos des étapes datées sur la barre (dry hop, garde, mise en fût), trait « aujourd'hui » au jour, « demain › » sur la Blonde (démarrer d'un toucher).
- Activité : fenêtre en pointillé fin, jours posés en pavés pleins dans leurs semaines, « · 3 j » dans le nom.
- Loyer : une marque ↻ « Loyer −400 » au 1er du mois, plus de barre pleine largeur.
- Filtres entiers à 390 : loupe, ★ n, tri, Types (9 couleurs) ; toucher un titre de voie l'isole.

## Tâches (390 tactile)
| Tâche | Geste | Touchers |
|---|---|---|
| T1 voir ce que je peux me permettre | aucun ; semaine en 7 jours : `[data-sem="47"]` | 0 (1) |
| T2 achat avec budget S48 → S51 | appui long dans `[data-voie="achat"] [data-pose]` en S48, glisser à S51 ; puce `[data-nom="Malt groupé"]` | 2 |
| T3 activité sans budget, avec jours | toucher la voie Activités en S47 ; `[data-jour]` puis puce | 2 (3) |
| T4 changer la durée | tirer `[data-chose="a-04"] [data-bord="debut"]` | 1 |
| T5 changer budget | glisser `[data-val][data-for="e-01"]` ; ou montant puis `[data-bulle-val]` | 1 (2) |
| T5 bis changer les jours | `[data-chose="t-01"]` puis `[data-jours="2"]` | 2 |
| T6 déplacer | glisser `[data-chose="b-01"]` ; bandeau flottant « 166 = » ou « 166 → x » pendant tout geste | 1 |
| T7 supprimer | appui long + glisser sur `[data-corbeille]` ; ou menu `[data-m="del"]` ; Annuler 5 s | 1 (2) |
| T8 filtrer par type | toucher le titre de voie `[data-voie-titre="achat"]` ; plusieurs : `[data-types]` | 1 |
| T9 trier | `[data-tri]` : Urgent → Prochain → Montant, libellé à jour | 1 |
| T10 épingler | deux touchers rapides sur la chose (Annuler 5 s) ; ou appui long → `[data-m="pin"]` | 1 geste |
| T11 retrouver une chose épinglée | `[data-epingles]` puis `[data-aller]` | 2 |
| T12 brassin, facture, fût de l'app | aucun : Maintenant et voies | 0 |
| T13 détail d'une chose de l'app, retour | `[data-mnt="x-01"]` puis `[data-fiche-fermer]` ; module : `[data-fiche-ouvrir]`, `[data-app-act]` (Payer), `[data-retour]` | 2 |
| + étape due | `[data-mnt-act="b-01:2"]` (Dry hop · Fait) | 1 |
| + présence | `[data-sem]` puis `[data-pres]` ; ou courbe, glisser `[data-hyp="pres"]` | 2 |
| + module | onglet `[data-tab="Finances"]` : son chiffre, son calendrier 6 sem., ses gestes ; `[data-voir]` revient sur la chose | 1 |

Aucun clavier dans ces tâches ; le seul chemin vers le clavier : `[data-clavier]` (« Autre… », « Taper »).
