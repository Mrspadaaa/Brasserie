# Correction 2 : problèmes → fait / non fait (nuit du 25.11)

Sources : juge-critique-2.md (JC), juge-action-2.md (JA), juge-produit-2.md (JP), CORRECTION-2.md. Le rendu jugé est le générique (`&gen=1`).
Les communs passent par `reponses/enrichi2.js` (ajout, chargé après enrichi.js par v2, v6 et v7). enrichi.js et adapt.js ne sont pas touchés.
Preuves : `cap12/<v>-<cas>.png` (36 captures au repos) et `cap/<v>-<cas>-<geste>.png` (45 gestes, plus 9 pour la v7).

## Communs (enrichi2.js : v2, v6, v7)
| Problème | État | Preuve |
|---|---|---|
| Fait accompli rangé en solution, « Raccord changé » (JC CN1, B partout) | Fait. Une option du brasseur dont le titre finit par un participe (« changé ») et dont la ligne n'a pas de « ? » sort des solutions. Elle se range en ✓ plein vert, à côté des pistes trouvées. Seul « Raccord changé » répond à cette règle sur les 12 cas. | `cap12/*-co2.png` |
| J-n sans objet : « J-8 » du pilsner, « J-1 demain 7h » de la chaudière (JC CN2, JC v7 B1, JP 4) | Fait. Quand la tâche n'a pas de date propre, le J-n porte l'échéance qui la motive, nommée dans la pastille : « 🍺 Brassage IPA · J-1 · demain 7h », « 🍺 Brassin · J-8 · 3 déc. », « ⏳ Renouveler l'assurance · J-36 · 31 déc. ». | `cap12/*-chaudiere.png`, `*-pilsner.png`, `*-assurance.png` |
| Un seul J-n par échéance (JP v2 B1, JP v6 1, JA v6 m2) | Fait. La rangée ou la tuile ⏳ ne s'affiche que si l'échéance diffère de celle du héros. Aucun cas ne la montre. | `cap12/v2-assurance.png`, `v6-chaudiere.png` |
| Urgence graduée (JA m3) | Fait : ≤ 2 j rouge, ≤ 7 j orange, au-delà gris calme. Pastille du J-n dans les 3 ; teinte du héros dans la v7. | `*-chaudiere` J-1 rouge, `*-bar` J-5 et `*-co2` J-7 orange, `*-fete` J-96 calme |
| « dans une semaine » sans ses mots, « avant le 15 » flou (JP 5) | Fait. La date est calculée depuis le 25 nov. : « 2 déc. », « 15 déc. ». Un jour ou un mois déjà dits (« samedi 6 déc. », « demain 7h », « avant mars ») restent ses mots. | `cap12/*-co2.png`, `*-bouteilles.png` |
| Citra entièrement hachuré (JC CN4, JA B1, JP C-3) | Fait. Sans aucune valeur connue : ni table, ni hachuré. Les vendeurs sont listés par leur nom avec 🔗. Dans la v7, le héros devient « Ouvrir les liens » (☐, ✓, plus tard) au lieu de « Choisir l'offre ». | `cap12/*-citra.png` |
| Hachuré sans légende (JP C-3) | Fait. La légende (« prix inconnu », ou « inconnu » sous la table) s'affiche là où le hachuré apparaît, et disparaît quand un refus retire le dernier hachuré. | `cap12/*-ecoulement.png`, `cap/v2-ecoulement-refus.png` |
| « ✦ conseillé » sans ✕ (JP C-1) | Fait. Un ✕ de 24 px retire la marque, pas l'option. Toast « Marque ✦ retirée · ↶ Annuler ». | `cap/v7-ecoulement-sansconseil.png` |
| IA absente : la tâche lue ne remonte pas, lignes coupées, « le 15 » perdu (JA m4, JP C-2, JC CN3) | Fait, avec la lecture **réelle** de l'app. Le héros est la ligne lue « à faire » (une ligne datée d'abord), avec la date lue. Les autres lignes s'affichent en entier sur 2 lignes au plus, avec les prix, quantités et dates lus. Voir l'écart ci-dessous. | `cap/*-sansia.png` |

## v7
| Problème | État |
|---|---|
| Jauge du coût total de v2 en tête des comparaisons | Fait. Une colonne par offre, alignée sous son nom : hauteur = coût pour 600, cap hachuré = livraison inconnue (≥), 👑 vert pour la moins chère, rouge ⚠ pour l'offre qui ne couvre pas. Elle remplace la ligne 🧾 et la rangée 🚚 (la livraison connue est dans le total). |
| « ✓ Prendre <offre> » sur l'offre gagnante (JA m1) | Fait : « ✓ Prendre Fournisseur B ». Le geste fait passer le héros en « ✓ Choisi · Fournisseur B », avec « ↺ Rouvrir » (`cap/v7-bouteilles-prendre.png`). |
| Table trop dense, repère 🟠 muet (JA m2) | Fait. Il reste 2 rangées (jauge, 💰/bt). La quantité qui s'écarte du besoin (📦 ≥1200, 📦 ⚠ 400) et l'état (🧽 à laver) passent sous le nom de l'offre. |
| Tuile « n/m trouvé » de v2 (JA 5) ; anneau « ✓0 » et « ✗ » (JP 8, JA m5) | Fait. La tuile anneau + « 1/2 trouvé » ouvre la rangée 🔎, dès une piste trouvée. L'anneau du coin du héros est retiré. |
| Pastille 🛒 muette (JC 4) | Fait. Retirée, avec les étapes ⚖️›✋›📦 qui doublaient ⚖️. |
| Bulle sous le dernier élément (JP 1) | Fait. Elle s'insère juste après l'élément touché, avec une pointe vers lui. Sous la table pour un en-tête de colonne. (`cap/v7-ecoulement-ligne.png`, `cap/v7-ecoulement-piste.png`, `cap/v7-chaudiere-ligne.png`) |
| « Changer le joint » coupé (JC 6) | Fait. L'option porte le titre entier sur sa ligne, et dessous le prix, la marque et le hachuré. |
| ✕ et ⏭ sans mot dans l'Aide (JP 7) | Fait : « non », « plus tard ». |
| 30 mots pile, sans marge (JC 7) | En partie. Le numéro de ligne sort du renvoi 📝 ↩ au repos (la bulle le donne), ainsi que « À faire ». Résultat : bouteilles 29, écoulement 29, **CO2 30 pile**. |

## v6 (bloquants seulement, plus les communs)
| Problème | État |
|---|---|
| B : raccord fait (JC 1) | Fait (commun). |
| B : chiffres sans légende, en bas (JA B1) | Fait. Chaque chiffre porte sa légende (« Avant coupure », « Budget », « Le 15 / Le 22 »). Le groupe des chiffres monte sous le héros. |
| m : J-n répété (JP 1, JA m2) | Fait (commun). |
| Défaut neuf vu : dans l'Aide, ✕ et ＋ débordent de la carte | Fait. La carte passe de 200 à 226 px. |

## v2 (bloquants seulement, plus les communs)
| Problème | État |
|---|---|
| B : tuile « Fournisseur B / par 600 » (JC B1, rejouée) | Fait. Les tuiles par critère sont retirées ; la jauge suffit. |
| B : raccord fait (JC B2) | Fait : tuile verte ✓ « 🔧 Raccord changé ». |
| B : deux J-n identiques (JP B1) | Fait (commun). |
| « ⚠ 80 » sans raison (JP 2) | Fait : « ⚠ 80 » porte « 400/600 » dessous. |
| Défaut neuf vu : rangées de la jauge à 22 px (cible < 24) | Fait : 28 px. |
| Non fait, hors contrat (mineurs) : « 0/1 trouvé » sur une question, demi-tuiles qui laissent des trous, « Appeler / le / technicien » sur 3 lignes à côté de la pastille. | — |

## Écart : ce que l'app lit vraiment sans IA (src/domain/carnets/analyseLocale.ts, tacheDatee.ts)
La lecture est produite par le vrai code, et non par la copie simplifiée d'enrichi.js :
- outil : esbuild sur `genreLocal`, `objetDe`, `mettreEnForme`, `prixTousDe`, `quantitesDe`, `urlsDe`, `echeanceDite`, avec aujourd'hui = 25 nov. 2026 ;
- sortie : `reponses/local-reel.js`.

**Ce qu'elle lit.**
- Le genre d'une ligne :
  - à faire, quand la ligne commence par un mot en -er/-ir/-re hors liste PAS_VERBES ;
  - question, achat (prix, lien, « devis ») ou note ;
  - une étiquette « À faire : » ;
- les prix, les quantités et les domaines de lien ;
- une date dans les formes fermées de `echeanceDite` :
  - « avant / pour / d'ici le J mois » ;
  - « le / samedi J mois » ;
  - « dans N jours / semaines / mois » ;
  - « en <mois> ».
  
  La date est rangée au **lundi de sa semaine** : la maquette affiche « semaine du 28 déc. », pas un J-n.

**Ce qu'elle ne lit pas, et que la maquette ne montre donc plus** : « demain 7h », « lundi », « avant le 15 du mois », « avant mars », le réglé du pilsner, le constat ni l'option.

**Écart avec l'ancienne maquette** (enrichi.js simplifié) :
- elle mettait 🛒 sur « Devis attendu » et ☐ sur « Chaudière… » : l'app fait pareil ;
- elle oubliait les dates lues : « sem. 28 déc. » (assurance), « sem. 30 nov. » (cave, CO2) ;
- elle coupait les lignes à 26 caractères.

**Défaut de l'app mis au jour (non corrigé, hors possession)** : `genreLocal` teste la terminaison sur le mot **sans accent**. Il prend pour une tâche :
- « Chaudière s'arrête… » (chaudière → chaudiere, -re) ;
- « Rencontré le gérant… » (rencontré → rencontre) ;
- « Levure récoltée… » (-re) ;
- « Pilsner 25 kg… » (-er).

En IA absente, la ligne lue en tête devient fausse dans 4 cas sur 12 : chaudière, bar, levure, pilsner. La maquette le montre tel quel, avec « lu par l'app » (`cap/v7-chaudiere-sansia.png`, `cap/v7-pilsner-sansia.png`).

Piste pour le port :
- tester la terminaison sur le mot accentué (« -ère », « -é » ne sont pas des infinitifs) ;
- écarter un mot suivi d'un verbe conjugué ou d'un pronom réfléchi (« s'arrête ») ;
- ajouter les noms du métier à PAS_VERBES (pilsner, levure, chaudière).
