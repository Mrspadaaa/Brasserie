# REPRISE · voie-destinations (14.11, concepteur Opus arrêté à ~150 k par le hook)

## Fait
- `src/common.mjs` : jetons clair/cave (DESIGN.md), pictos lucide `ic(nom, taille)`, `appHeader`, `ghostBord`, `bottomNav`,
  `page(v, titre, css, frames, desk)` (planche 6 colonnes, figure `#<v>-v<n>`, ordinateur `#<v>-dk`).
- `src/build.mjs` : `node src/build.mjs d2 [d3 d4] --vues-scratch=<dossier>` écrit `<v>.html` et les 5 captures exigées
  (a = vue 1 clair, b = vue 5 clair, cave = vue 1 cave, 1280 = `#<v>-dk`, vues-390 = planche) ; avec `--vues-scratch`,
  chaque vue clair et cave + planche cave dans ce dossier (hors voie).
- `src/d1.mjs` : modèle à suivre (11 cadres : 1, 2, 3, 4, 5, 5b, 6, 7, 8, 9, 10 + ordinateur). d1 finie et regardée.
- `NOTE.md` (ligne d1), `RESULTAT.md` (ECHEC provisoire).

## Contenu réel (lu dans le code, ne pas relire)
- Fiscalité : TVA réduite 2,6 % (denrées admissibles), normale 8,1 % (bière alcoolisée, matériel), assujettie (case),
  « Quel statut indiquer ? » (repli), Réserve impôt bière : Réduction annuelle OFDF (%), Année confirmée, Périodicité
  (À confirmer auprès de l'OFDF / Annuelle / Trimestrielle), « Calcul et déclaration » (16,88 / 25,32 / 33,76 CHF/hl selon
  Plato), IBAN Brasserie (fixture : CH44 0076 2011 6238 4920 1, clé fausse). Bouton Sauvegarder.
- Brasserie : installation « Royal Catering · cuve 45 L », L visés, rendement fermenteur, évaporation L/h, pertes fond de
  cuve (L froids), + BrewhouseSettings (volume habituel fermenteur, cuve capacité totale / limite utile à chaud + « J'ai
  vérifié », fermenteur capacité, mousse %, absorption grain L/kg, place grain L/kg, empâtage L/kg, rétraction %, chauffe
  °C/min, sparger L, rinçage habituel / max L, eau osmosée pack L, bouilloire annexe, froid régulé après serpentin),
  calibration « Ce que tes brassins nous apprennent » (médiane, Appliquer, Voir les mesures sources).
- Accès : compte Google (Firebase), Journal des modifications (Ouvrir), Arborescence Google Drive (Exporter).
- Sauvegardes : Justificatifs sur Drive (Déplacer les anciens justificatifs), Garder une copie (Préparer ma sauvegarde,
  volumes, Éléments sauvegardés, Originaux de justificatifs), Restaurer (Choisir les fichiers), Cet appareil
  (Réinitialiser l'affichage de cet appareil).
- Journal : recherche « Filtrer par mot-clé, réf (LOT-001, B-008)… », Tous/Finances/Production/Stocks/Clients/Fûts,
  Gaëtan (eau)/Aricia (cuivre), actions Création (hop) / Modification (straw) / Suppression (alerte) / Statut (eau),
  export Extrait/Complet JSON, « Charger les 100 événements précédents ».
- Connexions : ⚡ Rapide « Réponse en quelques secondes » / 🎯 Max « Plus long, plus fouillé », clé Gemini sur serveur
  (Secret Manager), « Vérifier que l'IA répond », Google Drive (Connecter / Renouveler la connexion Drive).
- Saisir au nom : « Saisir au nom de Aricia ? » — « Les prochaines écritures seront signées Aricia, plus Gaëtan. Tu peux
  revenir en arrière depuis ce menu. »
- Conversations : « Mes conversations », « Compagnon hors connexion · mode local », vide « Aucune conversation. Le bouton +
  ouvre le compagnon sur l'écran en cours. », « Supprimer les échanges ».
- Encaisser : Montant TTC encaissé, Client (facultatif, « Client comptoir »), Bière / conditionnement (facultatif),
  Règlement TWINT/Espèces/Virement/Facture, Joindre un justificatif (facultatif), Quittance PDF dans le Drive privé,
  Valider l'encaissement / Enregistrer à encaisser (Facture).
- Période : Tout l'historique, Ce mois, Mois dernier, Exercice 2026, 1er à 4e trimestre.

## À faire (concepts arrêtés, une idée chacun, pas le squelette de d1)
- **d2 · Tuiles d'état · tiède** (forme imposée : « est-ce bon ? » avant « régler ») : page plein écran sous l'en-tête de
  l'app, barre du bas visible ; en-tête de page « ‹ depuis Bord · titre » + × à droite ; onglets Réglages avec pastille
  de santé par onglet. Chaque vue = grille de tuiles (libellé 12, valeur mono 16–20, point d'état) ; tuile à problème
  bordée d'alerte avec une ligne (IBAN : « CH44 » surligné). Brasserie : tuile jauge de cuve verticale 45 / 40 utile / 20 L.
  Journal : frise verticale par jour, points colorés par action, pastilles G/A. Connexions : deux grosses tuiles IA / Drive.
  Saisir au nom : deux tuiles-personnes. Encaisser : montant géant, règlement en 4 tuiles à picto. Période : tuiles avec
  plages, T1–T4 en rangée. Ordinateur : grille 4 colonnes Fiscalité + frise Journal à droite.
- **d3 · Dessiné · chaude** : bandeau de couleur de rubrique en tête de chaque vue, qui porte un dessin-réponse
  (Fiscalité : barre d'une vente de 100,00 CHF TTC = 92,51 HT + 7,49 TVA ; impôt 25,32 CHF/hl → 0,084 CHF / 33 cl, taux
  plein avant réduction à saisir ; Brasserie : schéma SVG cuve 45 L, ligne utile 40 L, mousse 15 %, pertes 1,5 L, flèche
  évaporation 3,5 L/h ; Sauvegardes : frise des copies, dernière il y a 12 j ; Journal : histogramme 7 jours empilé G/A ;
  Connexions : deux voyants ; Saisir au nom : bascule moitié eau / moitié cuivre ; Encaisser : montant géant + quittance
  dessinée ; Période : frise des 12 mois 2026, novembre surligné). Lignes compactes dessous.
- **d4 · Phrases à trous · chaude** : chaque vue se lit en 2–4 phrases courtes à pastilles touchables (valeurs mono,
  couleur d'état) : « La brasserie [est assujettie] à la TVA : [2,6 %] sur les denrées, [8,1 %] sur la bière. » ;
  Encaisser : « [Aricia] encaisse [640,00 CHF] de [Bar du Tilleul] pour [2 cartons IPA Nelson], en [TWINT]. » ; Journal
  en fil par jour, avatar à gauche. Risque « trop textuel » (C094) à écrire dans la NOTE.
- Puis : ligne NOTE par variante + 3 lignes de jugement ; `node work/missions/2026-11-14-ecrans-transversaux/controle-serie.mjs
  voie-destinations d1,d2,d3,d4 --vues > work/missions/2026-11-14-ecrans-transversaux/voies/voie-destinations/controle.txt`
  → SERIE OK ; RESULTAT.md ligne 1 « OK — … » ; préférée probable : d3 ou d1.
- Pièges vus : sélecteurs `.x span` qui touchent les spans imbriqués (utiliser `>`), feuille à hauteur du contenu (pas de
  vide avant le pied), pas de mono pour un mot (mois).
