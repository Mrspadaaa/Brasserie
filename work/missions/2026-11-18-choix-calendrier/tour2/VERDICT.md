# VERDICT 2 — tour 2 du 19.11 (critique Opus, sans capture neuve)

Matériel : `captures/mesures.json` et `mesures-passe2.json` lus (champs ciblés), `*/RESULTAT.md` (têtes).
Images ouvertes : 28 (4 du brasseur, 19 de `captures/`, 5 de `id/`). Calendrier : jeu complet du banc.
Stocks : seul le passage `devlocal` est valable, sur un **jeu vide**. Les captures `stock-390-*` sans `devlocal`
montrent la page « Écran Stocks » de l'aperçu, pas l'onglet (erreur du banc). Identité : les captures
`captures/identite-*` ont échoué (`acces` false). Elle est jugée sur `id/`.

## 1. Lignes du 19.11 et neufs du tour 1

| Ligne | Corrigé | Preuve |
|---|---|---|
| CAL-PLACE-GACHEE | oui | `calendrier-390-clair-repos` : **une seule rangée d'axe** (S47…S52, plus de mois). 1re barre à 270/660, soit 39 % sans le bandeau du banc (seuil 45 %). Sa plainte c4ed6da2 (mois + semaines entourés) ne se rejoue plus. |
| CAL-RETOUR-PLEIN | oui | `calendrier-844-clair-plein` : bouton de retour noir plein. `…-cave-plein` : bouton jaune plein. Les deux thèmes sont prouvés. |
| CAL-ENTETE-CACHE | oui | 844 repos : en-tête 24+41 = 65, barre d'outils à 65 (≥). Fiche : en-tête jusqu'à 26, barre d'outils à 26. Plein écran : en-tête retiré (rect 0). Plus rien sous l'en-tête (b19e2698 réglé). |
| CAL-FICHE-CACHE-BARRE | oui | `calendrier-390-clair-fiche` et `…-844-cave-fiche` : barre « Saison de ferme » entière et cerclée, juste au-dessus de la fiche. Décalage de la page : 28 px (390) et 39 px (844). |
| APP-ENTETE-COLLE | oui | Calendrier : en-tête à -376 après 400 px (390 et 844), -262 à 1280. Stocks devlocal : scrollY 156, en-tête à -156. La capture `stock-390-clair-devlocal-defile-400` le montre hors écran. |
| STK-AUTRES-MORT | non vu | Le jeu est vide : « Aucun autre stock enregistré », aucune carte, et le toucher d'une carte n'est pas fait (`autres-carte-touchee` touche false). La ligne était corrigée au tour 1. |
| STK-COMMANDE-REPLIEE | oui | `…-devlocal-etagere-repos` : Articles n'a plus de bloc « à commander ». `…-courses-replie` : une ligne discrète « Rien à commander › ». `…-cave-devlocal-courses-deplie` : se déplie au toucher. |
| ID-TROP-AMBIGU | oui | `id/m390-clair-deborde` : « Cuve trop petite : 38,6 L pour 35 L » ; la cause (« 130 min… plus il faut de moût ») ; le remède mis en avant « Ajouter 3,6 L d'eau pendant ou après l'ébullition », puis « ébullition 55 min · 25 L · Eau / grain et rinçage › ». `…-eau-ajoutee` : 34,8 L ≤ 35 et « Retirer ». `…-clair-renvoi-eau` (09:21) : l'étape Eau ne dit plus « Il manque ». Tests : 11 (RESULTAT). |
| FIN-BARRES-MORTES | oui | `finances-390-clair-operations-depuis-synthese` : « Autres » est marquée et les autres barres s'estompent ; la puce « Autres frais × » ; « 1 opération » ; la liste ne garde qu'« Achats divers ». |
| FIN-PERIODE-PERDUE | oui | Depuis Synthèse août–nov., Opérations garde « 01.08–30.11 » et la frise va du 1er août au 30. Le choix est en français et entier (« d' août 2026 au novembre 2026 »). |
| FIN-DEUX-PERIODES | oui | `operations-repos` : un seul choix de période (l'en-tête « Nov. »), `nbChoix` 0 dans la page. Barres et compte suivent le filtre. La frise, qu'il aime, est intacte. |
| FIN-FRISE-AGRANDIR | oui | Poignée tenue au bord : août → juil. → juin, mois par mois, jamais d'années. Bulle « 1er juin → 30 nov. » au-dessus, `couvre` [], et « n jours » est retiré pendant la tenue (`…-cave-poignee-tenue`). |
| FIN-FICHE-CONFIRMER | non vu | Aucune opération à confirmer dans le jeu (`ops-liste-confirm` lignes [], toutes « payé aujourd'hui ») : la fiche ne s'est pas ouverte (touche false). |
| Tour 1 n° 1 — paysage, frise trop basse | non (partiel) | 844 repos : en-tête sur une ligne, 1re barre à 180/340, soit 49 % (45 % sans le bandeau). Plein écran : 139/340, soit 36 %. Tour 1 : 57 %. CAL-PAYS demande au plus 25 %. |
| Tour 1 n° 2 — « Rien à commander » trompeur | non vu | Jeu vide, manque 0 : la phrase est vraie ici. Le cas « 24 manquent » n'est pas rejoué. |
| Tour 1 n° 3 — « Rien à commander » répété | non (partiel) | Replié : dit une fois, corrigé. Déplié (`…-cave-devlocal-courses-deplie`) : dit **trois fois** (la ligne, « 0 rien à commander », l'encadré « Rien à commander »). |
| Tour 1 n° 4 — nom sorti de sa barre | oui | 390, 844 et 1280 : chaque nom est dans sa barre. Seule « Ambrée maison », barre trop courte, garde son nom à côté. |
| Tour 1 n° 5 — « du août », « nov.. » | oui | « d' août 2026 », et l'en-tête visible dit « 01.08–30.11 ». « nov.. » ne reste que dans l'étiquette lue à voix haute (`entete`). |
| Tour 1 n° 6 — pastille hors connexion | non vu | La pastille « Compagnon hors connexion · mode local » couvre encore « Ajouter le premier article » (Étagère) et le bas des listes de Finances. Le banc local seul la produit (RESULTAT stock). |

Bilan : 13 corrigés sur 19, 4 non vus, 2 non corrigés (paysage, répétition dépliée).

## 2. Problèmes neufs : 5, dont 0 bloquant (données ou geste principal)

1. **Calendrier paysage (844, repos et plein écran) : les pictos d'étape sont mangés par la barre suivante. Gênant.**
   Les barres de 18 px sont serrées, et la fiole de « Saison de ferme » ainsi que les pictos de « Blonde d'automne »
   sont coupés par la barre du dessous (`calendrier-844-clair-plein`, `…-cave-plein`). C'est CAL-POINTS-MUETS en
   paysage. Il dirait : « on voit plus les étapes en couché ».
2. **Fiche de brassin (390) : la ligne d'état est éclatée en colonnes. Gênant.**
   Elle se lit « pas brassée · brassage prévu | le 10 nov. | · prête | le 17 déc. | au plus tôt »
   (`calendrier-390-clair-fiche`). Elle répète en plus la ligne « pas brassée · prête le 17 déc. » du haut de la fiche.
3. **Fiche de brassin (390) : le bouton + couvre la fin de la ligne « Frais : … ; emb… ». Mineur.**
4. **Étape Eau, après « ajouter 3,6 L pendant l'ébullition » : l'eau ajoutée n'y apparaît nulle part. Gênant.**
   « 1. Eau 39,3 L » et la coupe osmosée / réseau ne comptent que l'empâtage et le rinçage
   (`id/m390-clair-renvoi-eau`). Rien ne dit qu'il faut préparer 3,6 L de plus, ni de quelle eau.
5. **Stocks › Autres stocks (jeu vide) : deux messages vides empilés. Mineur.**
   « Aucun autre stock enregistré » est écrit en police machine à écrire, dans une carte d'une demi-largeur,
   puis « Aucun article en stock » suit dessous.

## Doutes (non comptés)
- Jeu du banc : « Vente 10 × Bière · 75 cl — Restaurant du Lac +5 695,00 » (569 CHF la bouteille) donne la
  Synthèse « +5 429,60 gagnés ». La valeur est absurde, mais elle vient de la fixture, pas du calcul.
- Le picto de catégorie Brassage dans Opérations ressemble à un « ١ » : le sens n'est pas lisible.
- Les sels et la coupe d'osmosée ignorent peut-être l'eau ajoutée en cours d'ébullition (voir le n° 4) : c'est un
  calcul à vérifier, qui n'est pas prouvé faux.
- Identité en sombre : `m390-sombre-*` et `d1280-sombre-*` datent d'avant le correctif (09:10 et 09:15). La première
  montre encore « Il manque 3,6 L d'eau ». Le correctif n'est donc prouvé qu'en clair.

## Captures manquantes (DEMANDE EXECUTANT)
- Stocks avec des données (le jeu complet) : cartes d'Autres stocks touchées, Courses avec un manque.
- Finances : une opération ZZ TEST « à confirmer » ; toucher « c'est normal », puis « Confirmer le paiement » ; relire la base.
- Identité en sombre, après le correctif ; `captures/identite-*` à refaire (l'accès a échoué).
