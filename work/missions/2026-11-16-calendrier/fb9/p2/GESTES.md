# fb9 p2 : fb lisible au repos, gestes directs complets (prototype cliquable, 16.11)

Prototype : `fb9/p2/proto.html`, autonome. Source : `src.html` (CSS, squelette) et `app.js`, assemblés par `node fb9/p2/build.mjs`
(palette et pictos de fb repris de p1, split/join ; échoue sur un `type="number"` ou un picto absent).
Rejeu : `node fb9/p2/capt.mjs [etat,…]` (vrais gestes tactiles ; `PAYSAGE=1`, `LARGEUR=1280`, `CLAIR=1`). Captures `cap/p2-<état>[-cave]-<largeur>.png`, mesures `cap/journal-*.txt`.
Paramètres de page : `?theme=cave`, `?ep=b` (choix B épingle + favori), `?partage=1` (lien reçu, L1), `?etat=icone` (raccourcis L2), `?horsligne=1`, `?essai=1` (L7).

## Gardé de fb (règle n° 1)
Grand chiffre bleu « à te permettre », courbe et pinceau (repliés en un fil de 24 px, dépliés d'un toucher), période, frise par voie colorée,
barres teintées à bord plein (paiement), montants pointillés glissables, + volant noir « S47 », barre du bas avec l'onglet Calendrier.

## Ce qui change au repos (390)
- Un seul 166 au repos ; la rangée collée n'apparaît que si le chiffre sort de l'écran (`[data-permettre-colle]`).
- Maintenant : 2 lignes pleines (picto, nom, état, action d'un toucher), puis « +3 Munich · Stout · Détartrer › » (`[data-mnt-plus]`).
- Une rangée : loupe, ★ (épinglés), 9 filtres icône + mot, tri « Urgent » (libellé = ordre actif). Défilante à 390, entière à 1280.
- Semaines : numéro, mois au changement, charge dépassée seule en rouge (« 4/2 j ») ; le détail est dans la bulle de la semaine.
- Chose d'un jour : pastille au picto centrée dans sa semaine, nom à côté. Retard : anneau rouge et « ! » ; conflit : ambre.
- Pas de « exemple » au repos (dans la courbe dépliée et les puces IA seulement).

## Tâches (390 tactile, rejeu du 16.11)
| Tâche | Geste | Touchers | Preuve |
|---|---|---|---|
| T1 voir ce que je peux me permettre | aucun ; détail d'une semaine : `[data-sem="50"]` | 0 (1) | repos, t1 |
| T2 achat avec budget S48 → S51 | appui long sur la voie Achats (`[data-voie="achat"] [data-pose]`) en S48, glisser à S51 ; puce `[data-bulle-puce][data-nom="Malt groupé"]` | 2 | t2 (fantôme, 166 → −374 rouge), t2pose |
| T3 activité sans budget, avec jours | toucher la voie Activités en S47 ; puce « Nettoyer les cuves » (jours `[data-jour]` avant si besoin) | 2 | t3, t3pose ; `[data-dicter]` : t3dicter |
| T4 changer la durée | tirer `[data-chose="a-04"] [data-bord="debut"]` | 1 | t4 |
| T5 changer budget | glisser `[data-val][data-for="e-01"]` ; ou toucher le montant puis `[data-bulle-val="590"]` | 1 (2) | t5, t5pose, t5b |
| T5 bis changer les jours | toucher `[data-chose="t-01"]`, puis `[data-jours="2"]` | 2 | t5j |
| T6 déplacer | glisser `[data-chose="b-01"]` (fantôme, semaines visées, caisse en direct) | 1 | t6, t6pose ; hors ligne refusé : horsligne |
| T7 supprimer | appui long puis glisser sur `[data-corbeille]` ; ou menu `[data-m="del"]` ; `[data-annuler]` 5 s | 1 (2) | t7, t7annuler |
| T8 filtrer par type | `[data-filtre="achat"]` ; ou menu « Seulement achats » `[data-m="seul"]` | 1 | t8 |
| T9 trier | `.fsc [data-tri]` puis `[data-tri-choix]` (3 puces visibles) | 2 | t9menu, t9 |
| T10 épingler / favori | appui long immobile (420 ms) → `[data-m="pin"]` ; B : `[data-m="fav"]` | 2 (1 geste + 1) | t10menu, t10, t10b |
| T11 retrouver une chose épinglée | `[data-epingles]` puis `[data-aller="a-02"]` (saute à sa semaine, clignote) | 2 | t11, t11aller |
| T12 brassin, facture, fût de l'app | aucun : Maintenant et voies Brassins, Papiers, Fûts | 0 | repos |
| T13 détail d'une chose de l'app, retour | `[data-mnt="x-01"]` ou la barre, puis `[data-fiche-fermer]` ; module : `[data-fiche-ouvrir]` puis `[data-retour]` (revient au calendrier, fiche fermée) | 2 | t13, t13b, t13app, t13r |
| + payer, rendre, commander, changer de cuve | `[data-mnt-act="x-01"]`, `k-07`, `s-02`, `b-11` | 1 | t13fait, conflitok |
| + chercher sans clavier | `[data-chercher]` puis une puce `[data-aller]` ; Dire ; Taper en dernier | 2 | cherche, cherche2 |
| + liste, période | `[data-periode]` puis `[data-vue="liste"]` / `[data-rng]` | 2 | liste, mois3 |
| + voix (L3) | `[data-fab]` → `[data-fab-m="dire"]` → `[data-dire-poser]` | 3 | dire, direpose |
| + idée au carnet (tout est lié) | `[data-plus="achat"]` → `[data-idee]` | 2 | idee |
| + lien partagé (L1) | `?partage=1` : ligne Maintenant, `[data-mnt-act="sh-1"]` | 1 | partage, partagepose |
| + propositions (L5) | `[data-accepter]` sur « Café du Pont ? », « Blonde ? » | 1 | repos |

Mesuré dans les 49 états à 390 : `clavier:false`, `nombre:0`. Le seul chemin vers le clavier : `[data-clavier]` (« Autre… », « Taper »).
