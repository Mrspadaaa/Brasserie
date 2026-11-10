# pu4c — passe 3 de pu4 : face à face facture | stock, sans menu, la mesure gardée

**Chaleur** : chaude, la forme de pu4. **Idée** : une ligne en doute montre la facture face au stock, reliés par un trait d'état, et la
décision se prend dessous. Une ligne sûre n'a que ses champs.
- pu4b (`plateau/v1/pu4b/`) n'a pas été touchée.
- Source : `src/` (build.mjs, capture.mjs).
- États : `etat.html?etat=repos|a|b|c|d|e|f`, `&theme=cave` pour le sombre.

## Ce qui change depuis pu4b
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

## Captures (toutes ouvertes)
- À 390 × 844 en clair : `pu4c-repos.png`, `pu4c-a.png` à `pu4c-f.png`.
- En sombre : `pu4c-d-cave.png`. À 1280 : `pu4c-1280-b.png`.
- Chaque plateau tient entre sa rangée et le pied (9/9). 0 erreur, 0 requête réseau.

## Contrôles (sorties dans `sorties/`)
- `controle-sans-menu` : **MENU OK**, en clair et en sombre, 7 états. Sur pu4b : MENU ECHEC (6), comme attendu.
- `controle-commun --profil=sans-houblons --sans-lignes` : **COMMUN OK**, 85 mots à l'état d.
- `controle-contraste --profil=sans-houblons` : **CONTRASTE OK**.
- `verifier-page --min-images 0` : **PAGE OK**.
- `type="number"` : 0.

## Ce que je juge discutable (à trancher par le pilote)
- (c) Les quatre pastilles de type fin ajoutent une rangée de 28 px sur une ligne sûre (`pu4c-c.png`). Je les ai laissées visibles parce
  qu'un repli serait un menu au sens de D350.
- Autre lecture possible : le type fin suit la bande (Nettoyage) et ne se change qu'en (f). À dire si la rangée encombre.
