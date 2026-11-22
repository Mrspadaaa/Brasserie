# pu4b — passe 2 de pu4 : face à face facture | stock, sur ses champs

**Chaleur** : chaude, la forme de pu4. **Idée** : pour une ligne en doute, la facture et le stock face à face, reliés par un trait d'état ; la décision se prend dessous. Une ligne sûre garde seulement ses champs.
La v0 (`plateau/v0/pu4/`) n'a pas été touchée. Source : `src/` (build.mjs, capture.mjs). États : `etat.html?etat=repos|a|b|c|d|e|f`, plus `&theme=cave` pour le sombre ; défaut : d.

## Retouches de la synthèse (§ pu4)
1. **Ses champs reviennent** en tête du plateau, alignés : 6 · Kg ⌄ · 2,30 = 13,80 (D248).
   - Ligne sûre (a, c) : trois rangées compactes, celles de pz4 (imprimé, champs, segment), puis l'article et la mouture. Aucune carte, donc plus de vide.
   - Ligne en doute (b, d, e) : le duel Facture | Stock, en contenu seul.
2. **Concordances sur chaque sortie** (b), pa4 :
   - « Citra bis · = variété · = α 12,5 · proposé » est cochée en jaune (bis par défaut, D215) ;
   - « Relier à Citra · 2024 · = variété · ≠ α 13,1 » ;
   - « Nouvel article · ≠ doublon de Citra », en rouge (pa1), « IA ≈ 1 ct ».
   - Le lien de 24 px entre les cartes : = trait plein vert, ≈ tireté jaune, ? rompu rouge. Il suit le choix : bis, Relier, Nouveau.
3. **(d) un seul contrôle d'unité** : cinq cases de 48 px (Kg, g, sachet, pièce, L), chacune avec son prix par unité (« 6,20 le g », pu2).
   - « Kg » est proposé en jaune, comme au stock. Le cadre reste rouge, « unité à remplir », et le focus y va, sans anneau.
   - La place de l'unité dans les champs est une case ▒ inerte, pas un second contrôle.
   - « au centime : après l'unité » reste en gris.
   - Au pied du plateau : « 1 à régler · Citra › » (pu2).

## Correction du pilote (D349, règle n° 1)
- Remis comme dans p3c-3 :
  - « ✓ au centime » sous les champs, sauf quand l'unité manque : « au centime : après l'unité », en gris ;
  - « ✓ 8 lignes » au récap, à la place de « Somme = imprimé » ;
  - la boîte cochée des rangées reliées, déjà présente et vérifiée sur les captures.
- « Sûr = rien » ne vaut que pour les ✓ ajoutés hors de sa maquette : aucun n'est ajouté.
- « n à régler · X › » devient un bouton à contour, à la même place, pour ne plus concurrencer Confirmer.
- Les 9 captures sont refaites et ouvertes, repos compris.
- Contrôles rejoués : COMMUN OK (90 mots), CONTRASTE OK, PAGE OK.

## Corrigé partout
- **Aucune question sur une ligne sûre**, aucun ✓ hors de sa maquette. Le signal reste jaune (proposé), rouge (à remplir) ou bleu (relu).
- **La mouture dite une fois** : la pastille « ↳ 0,60 » quitte la rangée ouverte, la ligne mouture reste au plateau.
- **La mesure dite une fois** : la rangée ouverte garde son nom et son montant ; la mesure est dans les champs.
- **Bis par défaut**, jamais Relier.
- **« Stk » devient « pièce », « sachets »**. Seul l'extrait du document garde « Stk », car il recopie le papier.
- **Greffes reçues** :
  - type fin en menu « Nettoyage ⌄ » à côté du segment (pz1), ouvert au toucher ;
  - gestes rares sur une rangée discrète « extrait · supprimer », sans « ⋯ » (pz1) ;
  - extrait avec la case ▒ dans la carte Facture (d) (pg3, pz3) ;
  - stock après réception : « 18 → 24 Kg » à côté du segment (a), « 4 → 7 sachets » (e), « 0 → 100 g » pour le bis (b) ;
  - « + Ajouter une ligne » au pied de la liste ;
  - à 1280, le récap à gauche et la liste à droite.

## Les six cas (captures à 390 × 844, clair)
- `pu4b-a.png` : Maris Otter. Les trois rangées, l'article relié ⇄ Retirer, 18 → 24 Kg, la mouture Rattacher, « 2 à régler · Citra › ».
- `pu4b-b.png` : Citra 12.5 %. Le duel α 12,5 / récolte ? contre Citra bis, le bis coché, les trois sorties avec leurs concordances.
- `pu4b-c.png` : Détartrant. Matériel, « Nettoyage ⌄ », hors stock.
- `pu4b-d.png` : Lactose. L'extrait « 1 ▒ », le stock « compté en Kg · 0,5 Kg au stock », le lien ? rompu, les cinq cases.
- `pu4b-e.png` : Safale US-05. Le champ 3 en bleu, le 2 barré, 1re et 3e lecture côte à côte, 4 → 7 sachets, Remettre 2.
- `pu4b-f.png` : le Détartrant avec l'extrait ouvert, la ligne 9 surlignée ; supprimer est en gris, rouge au toucher.
- Aussi : `pu4b-repos.png`, `pu4b-d-cave.png` (sombre), `pu4b-1280-b.png`.
- Ouvertes : les 9, repos compris.
- Chaque plateau tient entre sa rangée et le pied (capture.mjs : 9/9 « tient »). 0 erreur, 0 requête réseau.

## Baseline p3c-3 (un plancher à enrichir)
- [x] imprimé · référence
- [x] champs q · unité · × prix = montant
- [x] « ✓ au centime », en gris « après l'unité » tant qu'elle manque ; « ✓ 8 lignes » au récap ; boîte cochée des rangées reliées (D349)
- [x] segment Ingrédient · Service · Matériel
- [x] article « … » · relié ⇄ Retirer
- [x] mouture Rattacher
- [x] plateau dans la rangée, liste groupée (bande, filet), pied Catégorie | Papier + Confirmer
- [x] d-lue : relu en bleu, l'ancien barré
- [x] D277, sur le champ même
- [x] le nom en français sur la rangée (B)

## Contrôles (une fois, sur etat.html à l'état d ; sorties dans `sorties/`)
- `controle-commun --profil=sans-houblons --sans-lignes` : **COMMUN OK**, 90 mots (alerte modérée sous 98).
- `controle-contraste --profil=sans-houblons` : **CONTRASTE OK** (le pire : 5,2:1).
- `verifier-page --min-images 0` : **PAGE OK** (390 px, sans erreur).
- `type="number"` : 0.
- Non mesuré : le contraste en sombre. Il a été regardé sur la capture, pas mesuré.
