# Règles des lots de maquettes (v2)

Les règles de la v1 (tournois M1 à M5, grille notée, formes imposées) sont archivées dans
`_archive-v1/REGLES-v1.md`. Elles ont produit des écrans « cockpit » (D23).

Les règles en vigueur sont dans `docs/qualite/methode-conception-frontend.md` (v2) :
priorité en trois plans, références réelles, lots de 11 (4 tièdes à structure imposée,
5 chauds libres, 2 froids), contrôles automatiques éliminatoires, UX boosters exigés
(`docs/ux-boosters.md`), jury par paires dans les deux ordres, relance obligatoire si un
lot n'est pas concluant (une fois), coup d'œil du brasseur sur les fils de fer.

Contrôle d'un lot en une commande :

```
node work/refonte-frontend/v4/tournoi/outils/controle-lot.mjs <dossier> --mots=80 --fill=0.8 --boosters=4 --radar
```

Outils : `capture.mjs` (390, 1280, coup d'œil à 40 %, états supplémentaires, remplissage),
`mots-premier-ecran.mjs`, `jouer-boosters.mjs` (convention `data-booster="nom"`),
`paires.mjs` (images de paires dans les deux ordres), `planche.mjs`.
