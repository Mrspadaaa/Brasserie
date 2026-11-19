# RAPPORT — test en ligne du tour 2 (19.11), index assets/index-BNytBXET.js

Paquet servi confirmé : `index-BNytBXET.js`. Chrome du brasseur, nouvel onglet.
Limite d'outil : la fenêtre Chrome est à 2560 px et `resize_window` n'a aucun effet. Le 390×660 a été obtenu
en chargeant le même index dans une iframe `srcdoc` de 390×660, même origine, session connectée (media queries
à 390). Pas de 844×340, pas de 1280, pas de thème sombre, pas de tactile : NON JOUÉS (voir fin).
Seul le thème clair a été vu.

## Points

1. Calendrier (390 clair)
   - Un seul axe : KO partiel. La rangée des semaines (S51…S10) est sous la frise, mais une rangée de mois
     (janv., févr., mars) reste au-dessus d'elle : deux rangées, séparées par la zone du graphique (capture vue).
   - Frise haut en paysage : NON JOUÉ (844×340 impossible). En 390, la 1re barre de brassin est à ~163/660, soit ~25 %.
   - En-tête qui défile : OK. En-tête à top 0 puis -8 au défilement maximal (page de 668 px, seulement 8 px de course) ;
     le comportement collé n'est pas prouvé à grande échelle, mais l'en-tête n'est pas fixe.
   - Plein écran et bouton de retour : NON JOUÉ (le bouton d'agrandissement existe en haut à droite, non touché).
   - Toucher une barre ouvre la fiche : KO / NON PROUVÉ. Sur le seul brassin réel (« Ttt », barre minuscule à gauche de la ligne
     Brassins), le toucher de la vignette puis du nom n'a ouvert aucune fiche. Pas de brassin ZZ TEST créé, donc pas de rejeu propre.
2. Stocks (390 clair)
   - En-tête qui part en défilant : OK (top -300 pour un défilement de 300).
   - Autres stocks : OK. Les cartes Additifs / Nettoyage se touchent et la liste change (558 / 706 car.), la puce « bas 3 »
     filtre (« Filtre bas : 3 articles », « Sels et additifs 1 sur 2 ») ; aucun Malts dans la vue.
   - « À commander » dans Courses, repliée : OK sur la forme. Courses affiche « 0 à commander cette semaine · 24 en tout » et « Tout voir »
     qui déplie la liste. Articles (Étagère) n'a plus de bloc « à commander ». Cohérence chiffrée avec Étagère : NON VÉRIFIÉE
     (Étagère dit « manque 21 », Courses « 24 en tout » ; les deux chiffres ne sont pas comparables à la lecture).
3. Finances (390 clair)
   - Toucher une barre filtre : OK. Le toucher de « Brassage » pose la puce « Brassage × », « 1 opération ».
   - Une seule façon de choisir la période : OK. Seul le sélecteur d'en-tête (« Nov. », flèches) ; les puces de Synthèse (sept./oct./nov./tout)
     pilotent ce même sélecteur.
   - Période gardée en changeant de vue : OK. Oct. choisi en Synthèse reste en Opérations ; le filtre Brassage reste aussi en changeant de mois.
   - Frise des opérations qui s'étend (poignée tenue au bord) : NON JOUÉ. Le glissé de l'outil est instantané et ne tient pas le bord.
   - « du/au » en français : NON LU en entier. La phrase « du 1er au 31 oct. · aucune opération saisie » est correcte ; le cas « d'août » n'est pas rejoué.
   - Fiche d'opération, coche « sans justificatif » : OK (« c'est normal » se coche).
   - Fiche d'opération, « Confirmer le paiement » : NON JOUÉ. Sur une opération ZZ TEST « à payer » le bouton est « Noter un paiement » ;
     sur une « déjà payée » il n'y a que « Corriger ce paiement saisi par erreur ». L'état « à confirmer » n'apparaît que pour les 5 pièces historiques
     réelles (Synthèse, « Confirmer les paiements »), non touchées.
4. Brassins : OK à moitié. Pas de titre-compteur (les compteurs sont sur les onglets « Brassins 16 » / « Recettes 23 » et les puces « Tous 16 »).
   Les cartes sont denses : 5 brassins par écran de 660 px (capture vue).
5. Recette
   - Draft ZZ TEST ouvert (le créateur a ouvert un brouillon prérempli « Milk Stout #2 », renommé « aZZ TEST — recette »). Volume 33 L sur cuve 35 L : « +3 L de trop » en rouge, ébullition 110 min, « ~5,5 L évaporés ».
   - Message « ajouter X L d'eau pendant ou après l'ébullition » avec renvoi Eau/grain et Rinçage : NON JOUÉ. Sans malts la barre de cuve est vide (« avant ébullition · sans malts ») et aucun message de cuve trop petite ne s'affiche.
     Il faut une recette avec grain ; non construite pour rester dans le budget.
   - Eau et sels, Ma levure (fluidité) : NON JOUÉ.
6. Carnet : OK. Matériel › Carnets s'affiche (« Collez le lien d'un objet… », exemple « Évier inox, 2 bacs », trois exemples). Aucune note envoyée à l'IA.

## Problèmes (combien et quels problèmes ? : 4)

1. Calendrier 390 : deux rangées d'axe subsistent (mois en haut de la frise, semaines en bas). Gênant (plainte « un seul axe »).
2. Calendrier 390 : toucher la barre du brassin « Ttt » n'ouvre rien (vignette et nom). À rejouer sur un brassin planifié ZZ TEST ; peut être propre à ce lot. Gênant si confirmé.
3. Finances > Opérations : en période Oct., « 31 jours · 0 opération » alors que la liste affiche l'opération ZZ TEST « à payer » (datée du 19.11). Compte et liste se contredisent. Mineur.
4. Fiche d'opération : l'annulation conserve la pièce (« Retirer cette écriture » est proposé seulement pour une pièce déjà payée ; une pièce à payer n'a que « Annuler cette écriture »). Mineur, à confirmer côté produit.

## Données ZZ TEST créées puis retirées

- Opération « ZZ TEST — operation » (12 CHF, à payer, 19.11) : annulée par « Annuler cette écriture ». Elle peut rester sous forme annulée/historique en base (l'annulation conserve la pièce). À vérifier dans Archives ; le brasseur peut la purger.
- Opération « ZZ TEST — ancien » (7 CHF, payée 19.10) : retirée par « Retirer cette écriture » (disparue de la liste).
- Recette brouillon « aZZ TEST — recette » : abandonnée, jamais enregistrée.
- Aucun brassin ZZ TEST créé. Aucune donnée réelle confirmée, modifiée ni supprimée. Aucun envoi Gemini.

## Reste à jouer

844×340 (calendrier couché, plein écran, retour), 1280, thème sombre, frise tenue au bord, « Confirmer le paiement », brassin ZZ TEST pour les barres du calendrier, recette ZZ TEST avec grain (message d'eau), Eau et sels, Ma levure.
