# M3 — Scénarios de bout en bout du brasseur — Carnet (23.11, tour 12)

Méthode : test par scénarios (Kaner 2003) ; persona : le brasseur, téléphone Android, d'une main. App en ligne,
**paquet `index-zpcbYIem.js`** (le service worker servait d'abord `index-Cmzen8eH.js` ; rechargé sans cache et sans
service worker, vérifié avant chaque série et après le dernier rechargement). Ma propre page dans son Chrome 9222
(Playwright `connectOverCDP`), émulation 390×844, toucher (CDP `Input.dispatchTouchEvent`), Android UA ; à la fin
`page.close()` puis déconnexion, Chrome et ses 2 autres onglets laissés tels quels. Thème clair. Captures toutes
regardées (`M3/*.png`), mesures DOM et cache Firestore en appui. Défauts : `defauts.jsonl` (18).

## ⚠ Donnée réelle touchée (à décider par le pilote)
S1, 02:48 : ma phrase « ZZ TEST — M3 — cellule de garde 2,6 m3 », tapée dans le champ de la liste, a été rangée par
l'IA dans le **vrai carnet Chambre froide** : critère « 2,6 m³ · de votre phrase » (creativeItems/CARNET-a803e02f-e8c4-4119-8ef2-d3ff0ae803af,
`carnet.criteres[]` id CRIT-ffa36c63-9017-419d-849a-339404309dc6, message MSG-06383e2a-cac2-4e55-bea5-8b0ca36994d9).
Le toast Annuler était déjà passé quand je l'ai vu (capture 11). **L'app n'a aucun geste pour retirer un critère** :
appui court et long sur la ligne Critère (47), sur la puce « 2,6 m³ » de Comparer (48), menu ⋯ (Renommer / Supprimer
l'idée seulement) ; au code, `supprimerLigne` n'est branché que pour les notes. Pas d'écriture directe dans Firestore
de ma part (données réelles : accord requis). **Encore présent** après rechargement. Pour le défaire : retirer ce seul
élément de `carnet.criteres` (et le message ZZ MSG-06383e2a). Ensuite je n'ai écrit que dans des carnets ZZ ouverts
ou créés par Calendrier › + › Noter une idée (sans IA) ; aucun autre vrai carnet modifié (cache vérifié : seul
Chambre froide a une date de mise à jour du 23.11 après 02:40).

## Ses mots sur le Carnet (SPEC-BRASSEUR) qui fondent les scénarios
- 16.11 : « J'ai besoin d'un endroit pour noter toutes ces recherches … ça permettrait de comparer, et aussi je pourrai utiliser l'ai pour voir si ce produit est disponible »
- 16.11 : « Dans l'application tout a un lien avec tout... Je pourrais par exemple sur le calendrier … ajouter avec un + une nouvelle idée, et ça viendrait directement là bas »
- 17.11 : « Non focus sur l'achat de matériel mais ça peut aussi être utilisé comme brouillon »
- 17.11 : « En gros, un chat, et ça met en forme, c'est tout et ça permet de comparer les idée »
- 17.11 : « La carte de l'article est peu parlant » ; « L'ajout d'une nouvelle idée est encore assez fouillis »
- 21.11 : « il ya même pas le prix de la chambre froide ?? » ; « Il y a une vue lors de la création ??? Mais qui s'ouvre même pas automatiquement et qui change par la suite ?? »
- 22.11 (choix-carnet-2, C3) : « SI sur le calendrier au doigt je peux placer, ça serait top »
- 23.11 : « Tu fera le même batch de test avec le carnet. »

## Scénarios
| # | Scénario (sa phrase) | Joué | Verdict |
|---|---|---|---|
| S1 | Noter une idée de matériel depuis un vrai lien (« utiliser l'ai pour voir si ce produit est disponible » ; « même pas le prix ») | Champ de la liste → carnet absorbé par l'IA dans Chambre froide (CA12-M3-1). Champ avec « Déjà un carnet proche » → texte perdu (-3). Création par Calendrier › + › Noter une idée (S48, sans IA) OK (22, 23). Lien brewtools B100 (vrai, déjà dans ses données) : « page non lue », nom de l'adresse, **ni prix CHF ni image** (27). Lien ggmgastro de sa Chambre froide : « L'IA n'a pas répondu », « lecture… » sans fin (30) | **KO** |
| S2 | Chiffrer puis « Au calendrier » (« tout a un lien avec tout ») | Prix estimé 500 CHF › Au calendrier : en-tête −5 513 → **−6 013**, « Achats −500 probable », fiche S48, toast « achat prévu posé · −500 CHF · Annuler » (33). 2e Au calendrier : pas de doublon (36). Autres essais : 200 CHF → −6 213. Annuler : au doigt sans effet 2 fois (44, 45), au clic DOM rend −100 (46) | Somme **OK** ; Annuler **KO au doigt** (à confirmer M5) |
| S3 | Placer (« au doigt je peux placer ») | Glisser l'icône de l'achat de +60 px : « 23 nov. → 30 nov. · Annuler », aria S49 (55) | **OK** |
| S4 | L'acheter, qui solde l'achat prévu (WFA-15) | + › Écriture › Achat 500, Matériel : « ✓ Solde l'achat prévu « ZZ … », prévu le 30.11 » proposé seul (58) ; Payé : « soldé, quitte le Calendrier » (59) ; Achats −1 000 → −500 probable (60). En-tête « à dépenser » inchangé (−6 513) : le paiement du jour y reste compté, pas de double compte | **OK** |
| S5 | Le retrouver dans Stocks › Matériel | Réalisés 1 : « Payé 500 CHF · prévu 500 CHF », Ouvrir le carnet (61) ; date affichée = date prévue (-18) | **OK** (d) |
| S6 | Note rangée par l'IA (« un chat, et ça met en forme ») | 3 lignes brutes dans le carnet ZZ ouvert : 2 notes propres « Rangé ici · Annuler » (63) ; la 1re ligne invisible, comptée « 3 notes » à la suppression (-7) | **KO partiel** |

## Lignes ouvertes de BUGS.md rejouées
| Ligne | Verdict | Preuve |
|---|---|---|
| CRU-1 (tableau Comparer débordant) | non reproduit (2 articles, colonnes dans l'écran) | 16 |
| CRU-3 (création : fiche non ouverte, vue qui change) | **KO**, pire : le carnet créé est absorbé dans un autre | 10, 11, 12, 13 |
| CRU-5 (premier plan de Comparer) | **KO** : 1re valeur vers 520 px | 16 |
| CRU-11 (tailles de texte) | OK sur la fiche carnet (12, 14, 16 px mesurés) ; liste et Comparer non mesurés | DOM |
| CRU-13 (ombre après défilement) | non joué (pas de défilement à 2 articles) | — |
| CRU-NOTE-1 (IA lente, en échec) | **KO** : échec joué, « lecture… » sans fin, nom d'article perdu | 30, 63 |
| T11-1 (somme à dépenser) | **OK** pour la somme ; Annuler KO au doigt / OK au clic | 33, 44–46 |
| T11-7 (titre rogné à 390) | **KO** | 33, 73 |
| PC-34 (idée datée par Noter une idée) | **OK** | 21, 22 |

## Couverture et IA
- Jouée : 6/6 scénarios, 8/9 lignes de BUGS (CRU-13 non joué) : 14/15 ≈ **93 %**. Pas joué : 390×660 et 844×340,
  hors ligne, image par photo.
- IA : 4 gestes, 9 appels `aiTask`, **≈ 0,04 CHF** (journal `ia-journal.jsonl`).
- Défauts : **18** (B 2, G 5, m 8, d 3).

## Nettoyage (vérifié après rechargement, 79, 78)
Retirés : 6 carnets ZZ M3, leurs 5 plans (À venir, Réalisés), les achats du Calendrier (Achats « vide »).
Restent : l'écriture « ZZ TEST — M3 — achat B100 » **annulée** (une écriture ne se supprime jamais, paiement
inversé), le message ZZ MSG-06383e2a, et **le critère dans Chambre froide** (voir plus haut).
