# rpb2 · Trois plans, sur les colonnes de r6a

Série rpb. **Chaleur : tiède** (forme imposée : les « Trois plans » de w2, « Ça c'est vraiment très intéressant »).

## L'idée
Chaque colonne de r6a devient un plan : un houblon **et son moment**. La tête de colonne est une carte de w2 (bandeau
à la couleur du houblon, rond lettré C / I / G), avec sa petite frise y1b (60′ · 10′ · WP | actif · après) : un toucher
sur un point déplace ce houblon seul. Au départ, le moteur pose chaque houblon à son meilleur moment pour le floral
sans sortir de ta 16D : Cascade après (~+0,9), Idaho 7 après (~+1,3 ★), **Galaxy à 10′** (~+0,9, ~50 IBU, dans ta 16D ;
au dry hop il en sort par les tropicaux). En haut, à côté du radar, la piste commune de w2 sur tes deux vœux (Floral ↑,
Résineux ↓) : un rond lettré par plan, le trait de ta stout, la zone de ta 16D.

## Greffes (`data-greffe`)
- `trois-plans-w2` : les pistes communes à ronds lettrés ; les têtes en cartes de plan.
- `frise-y1b` : la frise de chaque carte (le moment du plan).
- `hors-16d` : le mot que lui seul porte, sous chaque carte.

## Baseline
r6a : radar r2 (plus petit, 190 px), Au style / Absolu, « ~ simulé », têtes (nom, α du lot en %, rôle en mot, verdict
~✓/~⚠), 9 rangées l5b avec ta stout et ton Nugget au moment de la colonne, inconnus hachurés ; fiche à l'appui long
sur une carte ; légende derrière « ? ». **Écart** : le titre n'est plus la question de r6a (« Trois plans pour ma
stout ») et les familles des fiches quittent la tête pour faire place à la frise (elles restent dans la fiche) ; raison :
la carte de plan de w2 porte le moment, le floral et le résineux gagnés.

## Données
Moteur de la maquette (`donnees-moteur.ts`, `lireColonnes` aux cinq moments, 4 g/L, US-05). Le meilleur moment est
calculé, pas choisi à la main. Idaho 7 à 10′ : ~+0,7 floral, ~+0,8 résineux, ~37 IBU.

## Ce qui tient
- La réponse « lequel et quand » au premier coup d'œil : trois plans comparables, chacun à son meilleur moment.
- Le résineux : les trois plans restent au-dessus de ta 16D (ta stout y est déjà) ; Galaxy à 10′ en ajoute le moins
  (~+0,6).

## Ce qui casse ou reste douteux
- Deux facteurs libres par colonne (houblon et moment) : contre D98 (UNE-QUESTION), voulu par l'approche ; les plans
  ne se comparent plus « à moment égal ».
- Les ronds de la piste qui se chevauchent sont écartés de 9 % : la position n'est plus exacte (les valeurs sont dans
  les cartes).
- Points de la frise : 19 px de cible, sous les 24 px.
- 98 mots (alerte modérée).

## Contrôles (joués une fois)
TRAIT OK (34 pictos) ; COMMUN OK ; FAMILLES OK (9) ; HORS-16D OK ; ALPHA OK ; PANEL OK (série).
UNE-QUESTION ECHEC (titre sans « ? », 2 facteurs libres) et ACQUIS ECHEC (chimie, OSU) : indicatifs, gardés.

Captures : `captures/rpb2.png` (plans du moteur), `captures/rpb2-geste.png` (Idaho 7 passé à 10′ : ★ à Galaxy).
