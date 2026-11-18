# pu4d — passe 4 de pu4 : face à face facture | stock, la pièce offerte, la relecture acceptée, rien d’autre au détail

**Chaleur** : chaude, la forme de pu4. **Idée** : une ligne en doute montre la facture face au stock, reliés par un trait d'état, et la
décision se prend dessous. Une ligne sûre n'a que ses champs.
- pu4c (`plateau/v2/pu4c/`) et pu4b (`plateau/v1/pu4b/`) n'ont pas été touchées.
- Source : `src/` (build.mjs, capture.mjs).
- États : `etat.html?etat=repos|a|b|c|d|e|f`, `&theme=cave` pour le sombre.

## Passe 3 (de pu4b à pu4c), gardée
- **Rejet du critique (règle n° 1)** : la rangée ouverte garde exactement ce qu'elle porte fermée, comme dans p3c-3 : « ↳ 0,60 », « 6 Kg × 2,30 », « 13,80 ».
- **D350, aucun menu au téléphone** :
  - l'unité devient un segment de deux unités plausibles, en un toucher : Kg | g (malt, sucre), g | Kg (houblon), sachets | g (levure),
    pièce | L (matériel). Plus de « Kg ⌄ » ;
  - le type fin devient quatre pastilles d'un toucher sur la rangée « hors stock » du Matériel (Nettoyage, Entretien, Emballages, Outillage).
    Plus de « Nettoyage ⌄ ».
- **D351** : « ✓ au centime » disparaît, puisque toutes les lignes de la fixture tombent juste ; le gris « après l'unité » part aussi.
  « ✓ 8 lignes » et la boîte cochée des rangées reliées restent (D349).
- **D352** : les quantités de la bande et des rangées sont dans une même colonne, unités au même bord droit (≈ 505 px à 390) ; le prix
  a sa propre colonne de 62 px. L'ancienne valeur barrée suit d-lue : « 2 sachets × 4,90 » sous le nom.
- **Remarques de la critique, sans rejet** :
  - (d) les cinq cases d'unité passent juste sous les champs, avant le duel (elles étaient 150 px plus bas) ;
  - (b) la carte Stock dit « Citra bis · à créer à la confirmation » en jaune, et non plus un « nouveau » en petit ;
  - (b) « récolte inconnue » en texte jaune, et plus une pastille tiretée qui ressemblait à un champ.

## Passe 4 (D353 à D355, sur sa capture de pu4c-a)
- **D353** « Pas d'unité pour un objet ? Comment avec avec stk ? » :
  - chaque choix d'unité offre la pièce, d'un toucher : Kg | g | pièce, g | Kg | pièce, sachets | g | pièce, pièce | L ;
  - (c) l'imprimé garde « DURGOL EXPRESS 1L · 1 Stk », et l'unité lue est « pièce », sélectionnée ;
  - pour tenir la ligne, les champs prennent la largeur de leur contenu et le plateau 24 px de marge.
- **D354** « on voit toujours un changement de relecture alors que en théorie on a tout accepté ? » :
  - repos, a, b, c, d et f sont après acceptation : la rangée Safale est nette (« 3 sachets × 4,90 · 14,70 »), sans bleu ni barré, et la pastille « 1 corrigée » quitte le récap ;
  - e seul est avant acceptation : la marque de d-lue reste (bleu, ancien barré, duel 1re et 3e lecture), avec « Garder 3 » et « Remettre 2 ».
- **D355** « Ça parle d'un autre item sur le détail d'un ? » :
  - le plateau ne nomme plus aucune autre ligne ; « n à régler · X › » est retiré ;
  - le compte et le passage à la ligne vont au récap : « 1 à contrôler › » ouvre Citra, « 1 à remplir › » ouvre Lactose (et « 1 corrigée › » en e).
- Gardé de pu4c : MENU OK, unités alignées (bord droit ≈ 505 px à 390), pas de « au centime », la mouture « ↳ 0,60 · Rattacher », le face à face.
- Captures refaites et ouvertes, les 9 : repos, a à f, d-cave, 1280-b.
- Contrôles (sorties dans `sorties/`) :
  - `controle-sans-menu` : **MENU OK**, en clair et en sombre ;
  - `controle-plateau-ligne` : **LIGNE OK**, en clair et en sombre (sur pu4c : LIGNE ECHEC (15), le témoin) ;
  - **COMMUN OK** (79 mots), **CONTRASTE OK**, **PAGE OK** ;
  - `type="number"` : 0.

## Captures (toutes ouvertes)
- À 390 × 844 en clair : `pu4d-repos.png`, `pu4d-a.png` à `pu4d-f.png`.
- En sombre : `pu4d-d-cave.png`. À 1280 : `pu4d-1280-b.png`.
- Chaque plateau tient entre sa rangée et le pied (9/9). 0 erreur, 0 requête réseau.

## Contrôles de la passe 3 (sur pu4c)
- `controle-sans-menu` : **MENU OK**, en clair et en sombre, 7 états. Sur pu4b : MENU ECHEC (6).
- `controle-commun --profil=sans-houblons --sans-lignes` : **COMMUN OK**, 85 mots à l'état d.
- `controle-contraste --profil=sans-houblons` : **CONTRASTE OK**.
- `verifier-page --min-images 0` : **PAGE OK**.
- `type="number"` : 0.

## Discutable (passe 3, toujours vrai en pu4d)
- (c) Les quatre pastilles de type fin ajoutent une rangée de 28 px sur une ligne sûre (`pu4d-c.png`). Je les ai laissées visibles parce
  qu'un repli serait un menu au sens de D350.
- Autre lecture possible : le type fin suit la bande (Nettoyage) et ne se change qu'en (f). À dire si la rangée encombre.
