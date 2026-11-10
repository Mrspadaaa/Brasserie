VERDICT OK — 2 problèmes, 0 bloquant

Version : 6d024815, https://brasserie-l-affinee.web.app (app réelle, compte connecté, profil `scratchpad/profil-test`).
Recette « ZZ TEST — levure-retours », créée à 1280 clair (`jouer.mjs --mode=creer`), rejouée à 390 tactile cave (`--mode=modifier`),
supprimée à 1280 (`verifier-suppression.mjs`, 25 → 24 recettes). Captures : `critique/en-ligne/` (44 + 5 de suppression),
planches `critique/en-ligne/planches/` ; toutes ouvertes (L12). Rien d'autre que « combien et quels problèmes ? » (D342 à D344).

## Au fil des gestes

| geste | vu | problème |
|---|---|---|
| Ouvrir Brassins › Recettes › Nouvelle recette, nommer | `a1-identite-390-cave`, `-1280-clair` : identité, 24 L, ébullition 60 min | nom doublé dans le champ : saisie du script, voir doutes |
| 1a Ma levure : taper « verdant », choisir | `l2-tape-verdant-*` : deux tuiles (« Levure LALLEMAND Verdant IPA · 4 sachet en stock », « LalBrew Verdant IPA · Lallemand Brewing · sèche ») ; `l3-verdant-choisie-*` : carte en place, « Levure choisie · non enregistré · Annuler le changement », conduite « Levure LALLEMAND Verdant IPA · conduite actuelle » | n° 1 : carte vide (FG ?, floculation à chercher, 5 × non documenté) pour une levure du catalogue |
| 1b taper « zzqxjw », toucher la saisie libre | `l4-sans-resultat-*` : tuile « Mon stock ou saisie libre : « zzqxjw » · rien dans le catalogue ni le stock · saisie libre » ; `l5-saisie-libre-*` : repli ouvert sous le champ, « Nom de la souche » pré-rempli « zzqxjw », focus, « Utiliser cette levure » ; journal : `present true, dansEcran true, focus true` | — |
| 1c toucher un palier de la conduite | `l6-conduite-palier-390-cave` : palier 2 ouvert (4 °C, 5 j, « j » entier), poignées ↕ à J10–J15 et ↔ sous « fin J15 », éditeur « Palier 2 · Maturation », rien ne flotte sur « Retour · Suivant — Paliers » ; `-1280-clair` idem avec « Supprimer » et « Rétablir ce palier » | — |
| 2 Chercher : toucher une ligne hors du nom | `c1-ligne-ouverte-*` : piste touchée sur la 1re ligne (Pomona), la ligne s'ouvre : « Choisir pour ma recette · Comparer » | — (doute : deux boutons, pas de donnée en plus) |
| 3 Houblons : « Avancée », Arômes = Tropicaux, ouvrir, ajouter | `h1-etape-*` : « Avancée » à 390, « Recherche avancée » à 1280, à côté d'« Ajouter — houblon… » ; `h2-avancee-repos-*` : 498 houblons, Chez moi 10 ; `h3-feuille-*` : Rôle aromatique + Arômes Tropicaux cochés, « Voir 20 » ; `h4-filtre-*` : 20, « chez moi 1 · épuisés 1 · à acheter 18 », Tropicaux en première pastille sur chaque ligne (Citra cryo, Nectaron, Azacca, Callista, Cashmere, Citra, Elixir…) ; `h5-nelson-ouvert-*` : Nelson Sauvin 9,6 % · Agrumes Tropicaux Melon Noyau · vin blanc +10, « Ajouter à ma recette · 12 g à 10′ », « Fiche » ; `h6-nelson-ajoute-*` : Nelson Sauvin 12 g à 10′ dans l'ébullition, vue refermée | n° 2 : « mixte » dans la recherche, « double » dans l'étape |
| Récap, Enregistrer | `r1-recap-*` : Levure « Levure LALLEMAND Verdant IPA · quantité à préciser », Houblons 12 g (1280) / 24 g (390, Nelson deux fois) ; `r2-enregistre-*` : enregistrée (25 recettes) | — |
| 4 Supprimer, vérifier l'absence | `v1-recettes-avant-1280-clair` : 25, présente ; `v3-confirmer` : boîte « Supprimer cette recette ? … La suppression est journalisée » ; `v5-recettes-apres` : « Recettes (24) », `PRESENTE_APRES false` | — (le premier essai `s1`–`s3` avait retapé la corbeille, voir doutes) |

## Sa question : « combien et quels problèmes il y a ? »

1. **Ma levure, carte après le choix de « Levure LALLEMAND Verdant IPA » (tuile du stock, proposée en premier et encadrée)** :
   FG « ? », floculation « à chercher », esters, phénols, thiols, terpènes, sucres restants « non documenté », « ? dose à saisir »
   alors que la même levure est au catalogue juste à côté (tuile « LalBrew Verdant IPA »). La ligne du stock n'est pas reliée à sa
   fiche ; les puces de rappel montrent d'ailleurs deux Verdant (« Verdant IPA » et « Levure LALLEMAND Verdant IPA ») et la
   première qu'on touche vide la carte. En brasseur : « J'ai 4 sachets de Verdant, elle est au catalogue, et ma carte me dit
   non documenté partout ? ». Captures `l3-verdant-choisie-390-cave`, `-1280-clair`, `l1-repos-1280-clair` (puces).
   Attendu : la tuile du stock porte la fiche du catalogue quand le nom correspond (FG, atténuation, floculation, familles), ou une
   seule tuile Verdant avec l'icône de stock.
2. **Rôle du houblon, deux mots pour une même donnée** : Nelson Sauvin et Galaxy sont « mixte » dans la recherche avancée
   (`h5-nelson-ouvert-*`, `h2-avancee-repos-*`) et « double » sur leur ligne dans l'étape Houblons (`h6-nelson-ajoute-*`, `h1-etape-390-cave`).
   En brasseur : « mixte ou double, c'est le même houblon, lequel je crois ? ». Attendu : un seul libellé, celui de l'étape ou de la
   recherche, partout.

Bloquants (geste sans effet, valeur fausse, élément de sa maquette absent, texte illisible) : aucun. Les quatre gestes demandés ont
leur effet à 390 tactile ; le repli de saisie libre s'ouvre pré-rempli à l'écran ; rien ne déborde sur le pied ; la ligne de Chercher
s'ouvre hors du nom ; le filtre Tropicaux ne laisse que des Tropicaux ; l'ajout arrive à 10′ dans la recette ; la suppression retire la
recette.

## Table des captures

| capture | thème | largeur | état | problèmes | bloquants |
|---|---|---|---|---|---|
| a0-ouverture, a1-identite | clair · cave | 1280 · 390 | ouverture du wizard, identité nommée | — (doute nom doublé) | 0 |
| l1-repos | clair · cave | 1280 · 390 | Ma levure au repos (1280 : sans levure, 4 puces ; 390 : Verdant du stock) | n° 1 (puces) | 0 |
| l2-tape-verdant | clair · cave | 1280 · 390 | « verdant » : 2 tuiles | — | 0 |
| l3-verdant-choisie | clair · cave | 1280 · 390 | carte de la levure du stock | n° 1 | 0 |
| l4-sans-resultat | clair · cave | 1280 · 390 | « zzqxjw » : tuile libre | — | 0 |
| l5-saisie-libre | clair · cave | 1280 · 390 | repli ouvert, pré-rempli, focus | — | 0 |
| l6-conduite-palier | clair · cave | 1280 · 390 | palier 2 touché, éditeur, poignées | — | 0 |
| c1-ligne-ouverte | clair · cave | 1280 · 390 | Chercher, piste touchée, ligne ouverte | — | 0 |
| h1-etape | clair · cave | 1280 · 390 | étape Houblons, bouton Avancée | n° 2 (Galaxy « double ») | 0 |
| h2-avancee-repos | clair · cave | 1280 · 390 | recherche avancée, 498 | n° 2 (Galaxy « mixte ») | 0 |
| h3-feuille | clair · cave | 1280 · 390 | feuille Filtres, aromatique + Tropicaux | — | 0 |
| h4-filtre | clair · cave | 1280 · 390 | 20 résultats Tropicaux, rayons chez moi / épuisés / à acheter | — | 0 |
| h4b-nelson-filtres | clair · cave | 1280 · 390 | « nelson » + filtres : 0, « Retirer les filtres » | — | 0 |
| h5-nelson-ouvert | clair · cave | 1280 · 390 | Nelson Sauvin ouvert, Ajouter · Fiche | n° 2 | 0 |
| h6-nelson-ajoute | clair · cave | 1280 · 390 | Nelson à 10′ dans l'étape (390 : deux fois, rejeu) | n° 2 | 0 |
| r1-recap, r2-enregistre | clair · cave | 1280 · 390 | récap, enregistrée | — | 0 |
| s1-fiche, s2-confirmer, s3-liste | clair | 1280 | 1er essai de suppression (corbeille retapée, recette restée) | — (script) | 0 |
| v1 à v5 | clair | 1280 | suppression rejouée : 25 → 24, absente | — | 0 |

## Doutes (non comptés)
- Nom « ZZ TEST — levure-retoursZZ TEST — levure-retours » dès `a1-identite-1280-clair` : l'essai raté de 18:22 (`zz-erreur`) a laissé un
  brouillon avec le nom, et le triple-clic du script sur le champ (textarea) n'a pas tout sélectionné avant de retaper. À rejouer à la
  main au doigt avant d'incriminer le champ (L28 : noms doublés déjà vus le 01.11 sur la commande).
- Nelson Sauvin deux fois à 10′, 12 g chacun (`h6-nelson-ajoute-390-cave`, récap « 2 ajouts · 24 g ») : l'ajout rejoué à 390 après celui
  de 1280. L'app empile une ligne identique sans fusionner ni le dire ; à trancher par le brasseur.
- Chercher : la ligne ouverte montre « Choisir pour ma recette · Comparer », aucune donnée en plus (atténuation ou floculation chiffrée) ;
  c'est ce que le nom ouvrait déjà, le retour n° 4 est honoré au sens strict.
- Après « Enregistrer la recette » à la création (1280), retour sur Brassins › Carnet filtré « Ce mois » : « Aucun résultat pour ces
  critères » ; la recette est bien dans Recettes (25). Hors mission.
- Suppression, premier essai (`s3-liste`) : le script a retapé la corbeille (même libellé « Supprimer la recette » que le bouton rouge de
  la boîte), la recette est restée ; rejoué sur le bouton de la boîte : supprimée. Script, pas l'app.
- Une autre « ZZ TEST — Recette » (Double IPA, 24 L) reste dans le carnet (`v5-recettes-apres`) : pas de cette mission, laissée au pilote.
- « ? IBU », OG « — » : 0 kg de grain, existant.
- « plage levure 18–25 °C » affichée pour la levure du stock sans fiche : plage par défaut, pas celle de Verdant (fiche Lallemand : 18–23 °C) ;
  rejoint le n° 1.

LEÇON PROPOSÉE : un script de test qui cherche un bouton par libellé prend le dernier visible dans la boîte de dialogue, pas le premier
de la page : la corbeille et le bouton de confirmation portent le même texte (s3).
