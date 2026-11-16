# fb9 p1 : fb enrichi vers 9/10 (prototype cliquable, 16.11)

Prototype : `fb9/p1/proto.html`, autonome. La source est `build.mjs` : il reprend `fl/fb/proto.tpl.html` (inchangé) ligne par ligne, avec un préfixe vérifié, écrit `proto.tpl.html`, puis assemble le moteur d'argent de p2 et les données de fb.
Rejeu : `node fb9/p1/capt.mjs [etat,…]` (vrais gestes tactiles ; `PAYSAGE=1`, `LARGEUR=1280`, `CLAIR=1`). Captures dans `fb9/p1/cap/`, mesures dans `cap/journal-*.txt`.
fb reste la base : grand chiffre, « ensuite », courbe et pinceau, période, frise par type, libre en fin de semaine, charge, + volant, poser sans clavier, glisser sur les valeurs.

## Ajouts au repos (sans phrase d'aide)
- **Maintenant** `[data-maintenant]` sous le grand chiffre : en retard (rouge), en conflit (ambre), dû cette semaine, puis épinglé ★. Un toucher sur `[data-mnt="<id>"]` ouvre la chose.
- **Sources de l'app, en lecture** : brassins et leurs étapes (Brassins), factures (Finances), loyer, assurance et impôt (Finances), fûts à rendre (Stocks), stock qui manque ou levure qui expire (Stocks), entretien (Matériel). Chaque barre porte `data-origine` ; `data-ro` = non déplaçable, puisque c'est un calcul ou une donnée d'ailleurs.
- **Signal** : `.bar.retard` (anneau rouge et « ! »), `.bar.conf` (anneau ambre), `.bar.fait` (estompée).
- **Rangée collée** : `[data-permettre-colle]` (« à te permettre 173 », puis « 173 → −367 » rouge pendant un geste) reste visible en défilant.
- **Filtres** : 8 pastilles à picto, toutes visibles à 390 et 844, avec leur compte (`.chips [data-filtre]`). Un nom n'apparaît qu'une fois, en court.
- La pose discrète : une bande fine par type, `[data-voie=x] [data-pose]`, avec un seul « + » au bout. Les 42 « + » de fb sont retirés.
- Chaque bandeau d'annulation commence par l'effet : « 173 → −367 · Malt groupé posé… ».

## Sélecteurs neufs
| Élément | Sélecteur |
|---|---|
| Carte Maintenant | `[data-mnt="x-01"]` (Brewferm), `k-07` (fût 7), `b-02` (Porter, malt manquant), `b-01`, `m-01`, `e-01` ★, `a-02` ★ |
| Fiche d'une chose de l'app | `[data-fiche="<id>"]` ; `[data-fiche-fermer]` (× ou fond) ; `[data-fiche-fait]` (Payé, Rendu, Fait) ; `[data-fiche-ouvrir]` (« Finances › ») ; `[data-fiche-commander]` (conflit) ; `[data-epingle]` |
| Écran de l'app (simulé) | `#appv [data-retour]` (« ‹ Calendrier ») |
| Tri | `[data-tri]` : Trier → Urgent → Montant → Prochain → Trier (un toucher par cran) |
| Seulement les épinglés | `[data-epingles]` |
| Épingler | `[data-bulle] [data-epingle]` ou `[data-fiche] [data-epingle]` ; une barre épinglée porte `data-epingle-on` et ★ |
| Bulle de pose | `[data-bulle-puce][data-nom]` (★ = favorite apprise, ✦ = proposée par l'IA · exemple, `data-ia`) ; `[data-dicter]` (dictée simulée) ; `[data-clavier]` (le seul chemin vers le clavier) ; `[data-bulle-val="590"]` (valeurs proposées) |

## Les tâches (rejeu du 16.11, `cap/journal-390.txt`)
| Tâche | Geste | Touchers | Clavier | Preuve |
|---|---|---|---|---|
| T1 Voir ce que je peux me permettre | Aucun ; autre semaine : `[data-libre-sem="50"]` | 0 (1) | non | repos : 173, « au plus serré S24 », rangée collée « à te permettre 173 » |
| T2 Achat avec budget S48 → S51 | Appui long dans `[data-voie="achat"] [data-pose]` en S48, glisser jusqu'à S51 ; puis `[data-bulle-puce][data-nom="Commande groupée de malt"]` | 2 | non | t2pose : 173 → −367, rouge dans la rangée collée et dans le bandeau |
| T3 Activité sans budget, avec ses jours | Toucher `[data-voie="activite"] [data-pose]` en S47, puis la puce « Nettoyer les cuves » | 2 | non | t3pose : « Nettoyer les cuves posé · S47 · 1 j ». Variante : `[data-dicter]`, puis Poser (t3dicter : « Fenêtres 2 j », « 4 j pour 2 · trop chargé ») |
| T4 Changer la durée | Tirer `[data-chose="a-04"] [data-bord="debut"]` | 1 | non | t4 |
| T5 Changer le budget | Glisser sur `[data-chose="e-01"] [data-val="montant"]` (+132 px) ; ou toucher la barre, puis `[data-bulle-val]` | 1 (2) | non | t5 : « 173 → 393 » dans la rangée collée ; t5b : −540 → −590 |
| T5 bis Changer les jours | `[data-chose="t-01"] [data-val="jours"]`, puis `[data-jour="48:2"]` | 2 | non | t5j |
| T6 Déplacer | Glisser `[data-chose="b-01"]` de 2 colonnes | 1 | non | t6 |
| T7 Supprimer | Appui long sur `[data-chose="a-04"]`, lâcher sur `[data-corbeille]` ; `#toast [data-annuler]` | 1 (+1) | non | t7 : « 173 → 713 » ; t7annuler : « 173 → 713 · Malt groupé retiré » |
| T8 Filtrer par type | `[data-filtre="achat"]` ; ajouter un type : un autre `[data-filtre]` ; tout : `[data-tout]` | 1 | non | t8 : « Montré : Achats » |
| T9 Trier | `[data-tri]` | 1 | non | t9 : voies « brassage fut charge evenement… » (retard d'abord) |
| T10 Épingler | Toucher `[data-chose="a-04"]`, puis `[data-bulle] [data-epingle]` ; depuis une fiche : `[data-epingle]` | 2 | non | t10 : « ★ Malt groupé épinglé », carte ajoutée à Maintenant |
| T11 Retrouver une chose épinglée | `[data-epingles]`, puis `[data-mnt="a-02"]` (la période saute en S9, la barre clignote) ; sans filtre : faire défiler Maintenant, puis toucher la carte | 2 | non | t11 : « Montré : ★ épinglés », Embouteilleuse en S10 |
| T12 Voir un brassin, une facture à payer, un fût à rendre | Aucun : Maintenant (Brewferm −86 échue, Fût 7 à rendre, Porter malt manquant, Blonde brassage mar. 17) et les voies Brassins, Papiers, Fûts | 0 | non | repos |
| T13 Ouvrir le détail d'une chose de l'app, puis revenir | `[data-mnt="x-01"]` ou un toucher sur la barre, puis `[data-fiche-fermer]` | 2 | non | t13 (facture), t13b (brassin et ses étapes), t13r (revenu) ; vers l'app : `[data-fiche-ouvrir]`, puis `[data-retour]` (t13app) |
| + Payer, rendre, faire | Fiche, puis `[data-fiche-fait]` | 2 | non | t13fait : « Brewferm : payé · 16 nov. », la carte quitte Maintenant |
| + Résoudre un conflit | `[data-mnt="b-02"]`, puis `[data-fiche-commander]` | 2 | non | conflitok : « 173 → 135 · Malt Munich commandé · S49 · −38 », l'anneau ambre de Porter s'éteint |

Mesures relevées dans tous les états : `clavier:false`, `nombre:0` (aucun `type="number"`), `filtresVus:8` à 390 comme à 844, et `colleVue:true`.
