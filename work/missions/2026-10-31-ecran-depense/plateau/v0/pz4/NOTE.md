# pz4 — la rangée s'édite elle-même (chaude)

**Chaleur** : chaude, forme libre.

**L'idée en une phrase** : rien ne s'ouvre sous la rangée ; la rangée **devient** le plateau. Chaque cellule se change en pastille qu'on
touche : l'article (⇄), la quantité, l'unité (« g ⌄», ou rouge « unité ? »), le prix ; la nature sur la rangée suivante avec l'imprimé en
petit à droite ; et seulement si le cas pose une question, une rangée de plus (la proposition et ses trois sorties, le choix d'unité, la
correction). Les gestes rares sont au glissé : la rangée tirée vers la gauche découvre « extrait » et « supprimer », comme une liste de
téléphone (D209, D211 : « à la volée… sans ouvrir une sous-vue »).

## Baseline cochée (p3c-3)
- [x] « imprimé « … » » : en 12 px au bout de la rangée de nature (la référence n'est pas montrée : à un toucher sur l'extrait)
- [x] quantité, unité, × prix = montant sur une ligne : la 2e rangée, en pastilles
- [x] « ✓ au centime » : au bout de la 2e rangée
- [x] le segment Ingrédient · Service · Matériel : 3e rangée, le type fin à côté
- [x] la ligne article : la 1re rangée (pastille du nom, ⇄, le montant) ; « Retirer » n'y est pas : à faire en passe 2 (glissé ou ⇄)
- [ ] la mouture « Rattacher » : hors des six cas
- [x] la liste groupée, le pied inchangé
- [~] **écart voulu** : pas de plateau « sous » la rangée ; la rangée s'étire sur 3 rangées (90 px) et garde ses cellules à leur place. Raison :
  ses mots sur les malts (« modifier à la volée… sans ouvrir une sous-vue ») ; la question du cas reste une rangée de plus, au même endroit.
- [x] B du nom, d-lue (pastille quantité bleue « 2̶ 3 »), D277 sur la pastille même

## Les six cas
a Maris Otter : trois rangées, rien d'autre · b Citra : nom en jaune « · proposé », la raison et Relier · Citra bis · Nouveau sur la 4e rangée ·
c Détartrant : « aucun article · matériel », Matériel + Nettoyage ⌄, Mettre au stock · d Lactose : « unité ? » rouge en focus, le choix en cadre
rouge · e Safale : « 2̶ 3 » bleu, Garder 3 / Reprendre 2 · f Détartrant glissé : « extrait » gris et « supprimer » rouge découverts.

## Honnêteté
Comme pz1. Le glissé a son équivalent au toucher : « ← glisse la rangée » est écrit sur la rangée de (c) ; en passe 2, un bouton « ⋯ » le doublera.

## Contrôles (joués une fois, 02.11 ; mêmes commandes que pz1)
- PANEL OK · COMMUN OK (sans-houblons, --sans-lignes) · mots sans --sans-lignes : **147**
- CONTRASTE OK en clair (pire « · proposé » 4,53:1) ; cave : capture ouverte (`pz4-b-cave.png`) · STANDARD OK · PAGE OK

## Boosters UX
- `article`, `unite`, `quantite`, `nature`, `type-fin` — choisir sur place ; `sortie-article`, `unite-choix`, `correction` — la rangée de la question ;
  `gestes-rares` — le glissé (pointerdown/up, seuil 40 px ; `prefers-reduced-motion` coupe la transition).
- B2 : un `primary` par cas ; B3 : 90 px pour une ligne sûre, 130 px avec une question ; B13 : pastilles 28 px, actions du glissé 84 × 100 px.
