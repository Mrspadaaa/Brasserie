# Défauts du Carnet trouvés par la suite Playwright (23.11)

Chaque défaut est gardé en `test.fail` (rouge attendu : la suite reste verte tant que l'app ne change pas, et devient rouge le jour où il est
corrigé, ce qui rappelle d'enlever le `test.fail`). L'app n'a pas été corrigée. Données : fixture simulée du banc `carnet.mjs`, jour figé
23.11.2026. Captures d'échec : `npx playwright show-report e2e/rapport/arbre`.

| Id | Règle | Constat | Où | Épreuve |
|---|---|---|---|---|
| CA12-PW-1 | CARNET-LIS (« au plus 40 mots visibles ») | Un carnet ouvert au repos (Frigo + congel) dit 70 mots dans la zone du Carnet (titre, critère, notes, « Quand », six puces de date, « Prix estimé » et ses cinq puces, « Au calendrier »). À trancher : la règle a été écrite pour les maquettes ; l'app porte plus de contenu | 390 | regles.spec.ts, « CA12-PW-1 » |
| CA12-PW-2 | GESTE-DATE-PARTOUT | **Levé au lot 11 (D431)** : puces raccourcis + frise partagée tirée au doigt. Avant : La rubrique « Quand » d'un carnet est une rangée de puces d'horizon (Aujourd'hui, 1 mois, 3 mois, 6 mois, 1 an, Plus tard), sans la frise partagée (`.cal-f-duree`) ; le contrôle statique `controle-geste-date.mjs` ne le voit pas (aucun champ natif) | tous | feuilles.spec.ts, « CA12-PW-2 » |
| CA12-PW-3 | « aucun chevauchement » | Dans un carnet qui a des articles (Chambre froide, Prix en euros, Ventilation, Frigo de garde), la rangée « Quand » partage sa ligne avec « Au calendrier » : les puces passent sous le bouton (« Aujourd'hui » coupé, « 1 mois » et « 3 mois » recouverts, 8 à 55 px) | 390 | mise-en-page.spec.ts, `CONNUS` |
| CA12-PW-4 | « aucun chevauchement » | Tableau des articles de « Prix en euros » : la colonne « Volume » touche la colonne du prix (« 4,06 m³3 350 », 7 px) | 390 et 844 | mise-en-page.spec.ts, `CONNUS` |

## À noter, sans épreuve rouge

- **CARNET-LIS : 14 px ou 12 px.** Tranché par D430 (lot 11) : 14 px, l'épreuve le tient. La ligne CARNET-LIS dit « aucun texte sous 14 px », DESIGN.md donne 12 px à un libellé compact. L'épreuve
  prend 12 px (le plancher de DESIGN.md). Sous 14 px, la liste porte 13 px (« À comparer », « Idée », « Choisi ») et 12 px (sous-titres, puces,
  « Au calendrier »). À trancher par le brasseur ; une seule constante (`< 12`) à changer.
- **Tableau des articles : le prix d'un article en francs sous une colonne « EUR »** (Prix en euros, article CH, 3 350 sous l'en-tête EUR). Non
  épinglé : le comportement des devises est encore mouvant (D419).
- **Paysage 844 × 340, Comparer** : la barre du bas et le champ recouvrent la moitié du tableau au repos (le contenu défile dessous). Non épinglé :
  une barre collante est voulue, la hauteur utile en paysage est à juger à l'œil.

## Portée des lignes demandées

- CARNET-LIS, CLAV, AJOUT-FOUILLIS, IA-AIDE, CARTE-MUETTE, THEME, PLANNING, AVENIR-PLACE : `regles.spec.ts`. CARNET-COEUR : `coeur.spec.ts`
  (carnet vide, trois cas refaits de zéro). CARNET-MAIGRE (inventaire avant/après d'une maquette) n'est pas une règle de l'app : sans épreuve.
- PC-1 : côté Carnet seulement (`feuilles.spec.ts`) : un geste du Carnet n'écrit que dans les carnets et les plans ; brassin, dépense, stock,
  clients intacts. PC-2 (catégorie de l'article, dépense sans justificatif, client sans suppression) concerne la saisie et les Finances, pas le
  Carnet : sa part Carnet (l'achat prévu s'annule) est T11-1.
- Les lignes CARNET-* de maquette (CARNET-THEME, CARNET-CARTE-MUETTE) sont jouées sur l'app : structure (nom, pays, prix connu, caractéristiques,
  lien ; polices et couleurs prises dans les jetons), jamais un texte figé.
- Trois tailles : `android-390`, `paysage-844` et `bureau-1280` (ajouté à `playwright.config.ts`, réservé aux épreuves du Carnet). Le clavier de
  300 px (CARNET-CLAV) ne se juge qu'à 390 × 844.

## Preuves que les épreuves savent échouer

Mutations temporaires du code de l'app (retirées, `git checkout` des fichiers du Carnet ; rien d'autrui touché), suite jouée sur l'arbre :

- police des libellés à 10 px → CARNET-LIS rouge aux 3 tailles ; couleur de texte hors jetons → CARNET-THEME rouge (liste) ;
- titre du carnet à 90 px avec overflow caché → « aucun texte rogné » rouge à 844 et 1280 ; colonne décalée de 50 px → « aucun chevauchement » rouge ;
- libellé « Ajouter » changé → CARNET-IA-AIDE et CARNET-COEUR rouges ; un second champ dans un carnet → CARNET-AJOUT-FOUILLIS rouge ;
- origine des cartes masquée → CARNET-CARTE-MUETTE rouge ; clavier simulé neutralisé → CARNET-CLAV rouge (champ à 779 px sur 544) ;
- prix estimé non porté sur l'achat → T11-1 rouge ; `<input type="date">` ajouté → contrôle statique GESTE-DATE rouge ;
- lien « Dans À venir › Voir » sans effet → CARNET-AVENIR-PLACE rouge ; les captures de référence rouges sur ces changements de CSS.
- Non prouvées par mutation : CARNET-PLANNING (les deux épreuves) et PC-1 (aucune mutation simple du code ne les touche sans réécrire l'écriture des données) ; l'épreuve « aucun texte rogné » n'a été vue rouge qu'à 844 et 1280 (mutation de titre), pas à 390 dans le résumé de cette preuve.
- Aucune version passée du dépôt (historique comprimé en un commit : pas de tag `en-ligne/*`), donc pas de `E2E_REF` rejoué.
