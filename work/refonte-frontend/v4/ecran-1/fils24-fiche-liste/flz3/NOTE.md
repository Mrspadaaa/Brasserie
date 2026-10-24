# flz3 — À toi de ranger (Nelson Sauvin)

- **Chaleur : chaude**.
- **Idée** : la liste devient un geste. Les 4 mots sans famille (vin blanc, groseille à maquereau, raisin, sauvignon
  blanc) sont des jetons dans un bac « range-les » ; sous le bac, les 12 familles en cibles. Le brasseur pose un mot
  sur une famille : le jeton prend la couleur de la famille avec « → Baies ~ », et le radar gagne un rayon en
  pointillé marqué « ~ toi ». La forme des fiches ne bouge pas ; son hypothèse s'ajoute, visiblement distincte.
- **Ce qui tient** : c'est lui qui corrige le lexique fermé (cause de L14), à sa main, sans qu'on invente une
  famille à sa place ; « ~ » et pointillé = hypothèse, jamais une fiche (honnêteté). L'état après geste est capturé.
- **Ce qui casse** : le rayon « ~ toi » est posé à mi-rayon (1/2) par convention ; un mot rangé devrait un jour
  nourrir le moteur (hors v0). Sur un houblon sans orphelins, le bac est vide : à masquer.
- **Geste** : toucher un jeton, puis une famille ; `ranger(mot, famille)` ; capture `flz3-range.png` après
  `ranger('groseille à maquereau','berries')`.
- **Données** : pack-fiches.json ; 16D.
- **Baseline** : complète ; en-tête en forme C (lentille au style / absolu posée dans l'en-tête du bac).
- **Captures** : `captures/flz3-premier-ecran.png`, `captures/flz3-page.png`, `captures/flz3-range.png`.

## Contrôles (sorties recopiées)
