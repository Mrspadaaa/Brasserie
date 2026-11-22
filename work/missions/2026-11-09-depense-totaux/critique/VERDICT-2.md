OK — 7 problèmes, 3 bloquants (les 2 bloquants de VERDICT.md sont corrigés ; 3 défauts neufs, dont 2 sur la pièce ajoutée `bauhaus-eur`)

Version : 59fb5c10 (« DP-1 : les 12 retouches du critique »)
Banc : `voies/d2/banc` (5 pièces : Sun Store 1, Sun Store 2, BAUHAUS tachée, BAUHAUS copie, `bauhaus-eur`), Vite :5199, Chrome réel. 20 planches de d2 (`voies/d2/captures/`, 2 pastilles touchées par planche) et 28 captures de gestes à moi (`critique/captures-2/`, script `critique/gestes-2.mjs` ; recherches rejouées par `critique/recherches.mjs`). Toutes ouvertes. Aucune `ERREUR PAGE`.

## Les 12 points de VERDICT.md, rejoués
| n° | point | verdict | preuve |
|---|---|---|---|
| 1 | rabais comptés en pièces | **corrigé** | Sun Store 2 : « Autres 5 · 4 pièces · 149,25 » ; « Rabais −0,68 » en sous-ligne sans picto ni quantité, sous son article ; recherche « rabais » : 2 lignes. Reste : voir 5 ci-dessous (fiche ouverte). |
| 2 | geste du compte concordant | **corrigé** | copie : « ✓ Articles lus = comptés 22 », « Somme ≠ imprimé … Vérifier les montants › » ouvre la ligne C01 (66,95) ; « Prix connus · 1 ligne à revoir · « C01 » 66,95 contre 6,95 connu (×9,6) · relire le prix et la quantité (virgule déplacée ?) › » ouvre la même ligne. 390 et 1280, clair et cave. |
| 3 | tuile Règlement contre « Payé » | corrigé | « date supposée » : c'est la date qui est supposée, le montant payé est à part. |
| 4 | écart dit trois fois | corrigé | tache au repos : le bloc seul ; le pied n'a plus que « Regrouper en une dépense » ; la bande « 117,65 CHF · 6 articles non retrouvés » n'apparaît qu'au focus du champ, avec « Ajouter la ligne · Photo ». Sur la copie (compte concordant) aucune bande. |
| 5 | « 23/23 · incomplet » | corrigé | « 23/23 justes ». Mais voir 4 ci-dessous (Sun Store 2 « 2/5 »). |
| 6 | « imprimés » | corrigé | « Articles lus ≠ comptés 23 / 29 », « = comptés ». |
| 7 | banc enjolivé | **moitié** | Sun Store 2 : « · Payé · TWINT · montant non lu » + « Le terminal affiche 163,85, plus que le total » (fidèle) ; tache : plus de rangée Photo (fidèle). Mais « ✓ Lectures 3/3 d'accord » sur les 5 pièces, voir 1 ci-dessous. |
| 8 | « modifier ou retirer » jamais exercé | corrigé | copie : « Prix connus » ouvre la ligne ; `bauhaus-eur` : « Lignes hors articles · « Montant en EUR 370,92 » · retirer cette ligne › » ouvre la ligne avec « supprimer ». Mais « Voir la ligne en trop » n'ouvre rien, voir 2 ci-dessous. |
| 9 | bouton « Chercher » | corrigé | absent de la bande (vérifié : aucun bouton « Chercher »). |
| 10 | focus de « Ajouter la ligne » | corrigé | focus dans « Article ou prestation ». |
| 11 | « Ouvrir le PDF original » | corrigé au banc | « Voir l'original · Justificatif source » ; l'image est cassée au banc (`proofDataUrl` vide) : à confirmer en ligne (doute). |
| 12 | rangées muettes | corrigé | « Lignes hors articles · Photo : rien à signaler » en petit texte gris. |

## Table
| capture | thème | largeur | état | problèmes | bloquants |
|---|---|---|---|---|---|
| sunstore2-390 / 1280 (d2), F1, F2 (rabais ouvert), H-sunstore2-1280-plein | clair, cave | 390, 1280 | repos · rabais ouvert · « vaccin » 3/5 | 1, 4, 5, 7 | 1 |
| bauhaus-copie-390 / 1280 (d2), E2, E3, E4, H-copie-plein | clair, cave | 390, 1280 | repos · Prix connus touchée · Somme touchée (ligne C01 ouverte) · focus recherche (pas de bande) · « C05 » 1/22 | 1, 7 | 1 |
| bauhaus-tache-390 / 1280 (d2), B1, B3, B4, H-tache-plein | clair, cave | 390, 1280 | repos · Somme et Articles touchées → recherche + bande · « Ajouter la ligne » (focus libellé) · « Photo » (Voir l'original) · « T07 » 1/23 | 1, 7 | 1 |
| bauhaus-eur-390 / 1280 (d2), G1, G2, G3-articles, G3-somme, H-eur-plein | clair, cave | 390, 1280 | repos · hors-articles touchée (ligne EUR ouverte) · Articles et Somme touchées (rien) · « T07 » 1/30 | 1, 2, 3, 6, 7 | 1, 2, 3 |
| sunstore1-390 / 1280 (d2) | clair, cave | 390, 1280 | repos · « ibu » 1/2 | 1 | 1 |
| recherches (tache « 14,90 » absent, « 8,85 » 2/23, « 14.90 » absent, « T1 » 10/23, « 86 » 1/23 ; copie « 66,95 » 1/22 ; sun2 « rabais » 2/5 ; Échap vide et lève le filtre) | clair | 390 | — | — | — |

## Combien et quels problèmes ? 7, dont 3 bloquants

Bloquants
1. **« ✓ Lectures 3/3 d'accord » sur les cinq pièces, pendant que la barre du bas dit « nom : lectures divergentes (ligne 1) · désaccord · Garder · Voir ».** Le banc pose `review.status: 'disputed'` et des points de désaccord (tache 45, copie 25, Sun Store 2 : 3) ; d2 annonce « Lectures 3 · n désaccords », l'écran dit « 3/3 d'accord ». Deux verdicts contraires à l'écran sur la même chose, et c'est la rangée qu'il a entourée le 09.11 (« Lectures 3/3 » à côté de « 1 à contrôler · 6 corrigées » : « j'ai l'impression qu'elle fait pas correctement son travail »). Cause probable : la rangée compte `nDesaccords` depuis `review.findings` (vide au banc) et non depuis les points « lectures-divergentes » qui nourrissent la barre ; à vérifier aussi sur une vraie lecture (b1 : 45 désaccords sur la tache). Correction : la rangée et la barre lisent la même source ; « 3/3 · 1 désaccord · Voir le désaccord › » ; ou, si la rangée ne porte que sur les montants, le dire (« montants 3/3 d'accord · 1 nom en désaccord »).
2. **« Voir la ligne en trop › » ne fait rien** (`bauhaus-eur`, pastilles « Articles lus ≠ comptés 30 / 29 +1 » et « Somme ≠ imprimé 648,52 / 352,05 +296,47 », page fraîche, 390 et 1280, clair et cave) : aucune ligne ne s'ouvre, le focus reste sur la pastille. Cause lisible dans `ExpenseSheet.tsx` (renvoi `fausse`) : la cible est `qteFausses[0]` ou la ligne dont le montant égale l'écart exact ; ici la ligne en trop vaut 370,92 et l'écart 296,47 (la pièce manque aussi 74,45) : aucune cible, `versListe()`. Le script de d2 n'a vu « 1 ligne ouverte » que parce qu'il avait touché « hors-articles » juste avant sur la même page. Correction : la cible de « ligne en trop » est d'abord la ligne désignée par `hors-articles` (ou `coupablesDeLEcart`), sinon la plus grosse ligne ; le geste ouvre toujours quelque chose. (SPEC 09.11 « On appuie et ça fait un renvoi sur l'action du besoin ».)
3. **Sous-total faux en recherche sur une pièce à sous-groupes** : `bauhaus-eur`, « T07 » : « Rénovation 1/30 · 1 pièce · 5,50 » puis « Peinture et sols 1/29 · 0,00 » pour la même ligne à 5,50 (390 et 1280, clair et cave). Sa pièce BAUHAUS réelle a trois sous-groupes (Peinture et sols, Outillage, Divers travaux) : il le verra à la première recherche. Correction : le sous-groupe filtré somme ses lignes visibles comme le groupe parent.

À corriger
4. **Sun Store 2 : « · Qté × prix 2/5 »** (pastille grise). Les 2 rabais (sans quantité ni prix, voulu au point 1) et « Prestation vaccination 2 pièces × — » (pas de prix unitaire imprimé) sont comptés comme non vérifiés : « 2/5 » se lit « 3 lignes fausses » sur une pièce entièrement juste. Dire « 2/2 justes · 3 sans prix unitaire », ou ne compter que les lignes vérifiables (« 2/2 justes »). Défaut induit par la retouche 1 ; Sun Store 1 et les Bauhaus sont justes (« 2/2 », « 23/23 », « 22/22 », « 30/30 justes »).
5. **La fiche ouverte d'un rabais** (Sun Store 2, « Rabais −0,68 » touché) : deux champs vides « [ ] × [ ] = −0,68 », puis des boutons « +1 +2 +3 +5 +10 » de quantité, « extrait · plus · supprimer ». Une remise n'a ni quantité ni prix : la fiche doit n'avoir que le montant, « imprimé « NoVatTax - 0% » », et « supprimer ».

Mineurs
6. `bauhaus-eur`, ligne « Montant en EUR 370,92 » ouverte à 390 : « 1 pièce L × 370,92 = » puis le montant seul à la ligne suivante (le champ passe à la ligne ; C01 « 66,95 » tient sur une ligne).
7. Barre du bas « nom : lectures divergentes (l… » tronquée à 390 (texte « (ligne 1) » coupé ; entier à 1280). Existant (D329), visible maintenant que le banc rejoue les désaccords.

## Ce qui tient (vu, passe 2)
- Bloc : deux valeurs, écart signé, geste par rangée ; drapeau « À vérifier · 117,65 CHF · 6 articles » (tache), « 155,40 CHF · Prix connus » (copie), « 296,47 CHF · 1 article · Lignes hors articles » (eur) ; aucun sur Sun Store 1 et 2 ; piège EFT tenu (« Le terminal affiche 163,85, plus que le total », sans drapeau).
- Payé : Sun Store 1 14,60 ✓ ; Bauhaus 352,05 ✓ ; Sun Store 2 « montant non lu » (fidèle à la lecture réelle).
- Pastilles → geste : Articles/Somme (manque) → focus recherche + bande « Ajouter la ligne · Photo » ; Somme (compte concordant) → ligne au prix douteux ouverte ; Prix connus → ligne ouverte ; Lignes hors articles → ligne ouverte avec « supprimer » ; « Ajouter la ligne » → ligne neuve, focus libellé, en-tête « 24 · 23 pièces + ? · 234,40 + ? » ; « Photo » → « Voir l'original · Changer ».
- Recherche : « serre » absent (phrase claire), « 14,90 » absent (vrai sur cette lecture), « 8,85 » 2/23, « 86 » trouve 86,85, « vaccin » 3/5, « rabais » 2/5, « ibu » 1/2 ; Échap vide et lève le filtre ; « Toutes les lignes » visible.
- Pied : « Lignes = total 14,60 » sur une pièce juste ; muet quand le bloc lève le drapeau ; « … de moins » disparu.
- Rien de coupé ni chevauché en clair et en cave, hors 6 et 7 ci-dessus et le clip 470 px du script d2 (artefact de capture ; pleins formats `H-*.png` regardés).

## Doutes (non comptés)
- Image du justificatif cassée au banc après « Photo » (« Voir l'original » + icône brisée) : `proofDataUrl` vide dans `banc.tsx`, pas l'app ; à confirmer en ligne.
- Chip « 2 » sur la tuile Règlement des Bauhaus (« 1 » sur Sun Store et eur) : ce que compte le second point n'est pas visible.
- La tache rejouée reste la lecture d'avant c1 (23/29) ; après déploiement d'`aiTask` le brasseur verra 28 ou 29 lignes et un écart de 74,45 à 83,35 : à rejouer en ligne (L28).
- `bauhaus-eur` est une pièce construite par d2 (EUR lu comme ligne) : le cas est plausible (b1 l'a vu avant c1), mais aucune lecture réelle ne l'a produit depuis c1.
