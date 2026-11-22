# Inventaire de l'existant (banc local, 14.11)

Banc : `npx vite --port 3020`, `?dev-local`, 390 tactile (DPR 1 et 2) et 1280, clair et cave. Script `inventaire.mjs`
(100 captures dans `captures/`, mesures dans `inventaire.json`), références propres `references.mjs` (24 captures dans
`references/` : bord, recherche, menu, plus, réglages, journal). Données : base locale presque vide (11 enregistrements
de démarrage, 0 brassin, 0 article) ; la recherche « ipa » ne rend rien faute de données.

## Ce qui existe
- **En-tête** (37 px, les deux formats) : logo + « L'Affinée » (retour au Bord, 86×28), soleil/lune (thème, 28×28),
  loupe « Rechercher (⌘K) » (28×28), ⋮ « Menu » (28×28, seul bouton plein de l'en-tête). À 1280 seulement, le sélecteur
  de période (« Ce mois ▾ ») est dans l'en-tête ; à 390 il est la première ligne du menu ⋮ (select natif).
- **Menu ⋮** (9 lignes à 390, 8 à 1280) : Période de l'application · Mes conversations · Saisie au nom de Gaëtan ·
  Assistant de brassage · Atelier R&D (pastille 1) · Journal des modifications · Connexions cloud et IA · Réglages ·
  Se déconnecter. Libellés de période : Tout l'historique, Ce mois, Mois dernier, Exercice 2026, 1er à 4e trimestre.
- **Recherche** (`src/ui/CommandPalette.tsx`, cmdk) : fenêtre centrée (390 : 366 px en haut ; 1280 : 575 px),
  champ « Article, recette, brassin, client, écriture… », case « Inclure les archives · écritures comptables », groupes
  par type, pied « 0 résultat · ↑↓ parcourir · ↵ ouvrir · Échap fermer ».
- **Barre du bas** (`src/components/BottomNav.tsx`) : Bord · Finances · Brassins · Stocks · Clients, 40 px de haut ;
  390 : 5 × 62 px sur 310 px + bouton « + » noir 64×40 (cave : ambre) à droite ; 1280 : barre de 1200 px, onglets de
  90 px groupés au centre, « + » détaché à l'extrême droite.
- **Menu du +** (`src/domain/fabActions.ts`, `QuickActionModal.tsx`) : sur le Bord, Nouvelle écriture · Compagnon
  brasseur · Encaisser une vente · Créer une recette · Lancer un brassin ; ailleurs, la 1re ligne devient l'action de
  l'écran (« Nouvelle idée · Sur cet écran » sur Atelier) et « Entrer une facture » s'ajoute (6 lignes).
- **Ce qu'ouvre le ⋮** : Réglages = feuille du bas, 4 onglets (Fiscalité, Brasserie, Accès, Sauvegardes), formulaires ;
  Journal des modifications = feuille (recherche, puces Tous/Finances/Production/Stocks/Gaëtan/Aricia, « 0 / 0 entrée ») ;
  Connexions cloud et IA = feuille longue (IA Rapide/Max, Google Drive) ; Saisie au nom de… = dialogue de confirmation ;
  Assistant de brassage et Atelier R&D = changent d'écran.

## Trous et défauts constatés (numérotés)
1. Recherche ouverte sans rien taper : « Rien ne correspond · 0 résultat ». Aucun récent, aucun raccourci, aucune
   destination : l'état vide parle d'échec avant toute frappe.
2. Recherche : écrans et actions absents (on ne peut pas « aller à Courses » ni « nouvelle recette »), alors que la palette
   est faite pour ça (docs/ui-compacte.md : « Chercher une destination ou une action transversale »).
3. Recherche à 390 : fenêtre flottante en haut, clavier ouvert sous elle ; la case « Inclure les archives » prend une
   ligne entière au premier plan ; le pied clavier (↑↓ ↵ Échap) n'a pas de sens au toucher (masqué à 390, OK).
4. Menu ⋮ : neuf choses de natures différentes dans une liste plate (période, compte, outils, administration, sortie).
   La période y est à 390 mais dans l'en-tête à 1280 : deux places pour la même chose.
5. « Saisie au nom de Gaëtan » se lit comme un état, pas comme un geste (bascule d'auteur des écritures).
6. « Mes conversations » (menu) et « Compagnon brasseur » (menu du +) n'ouvrent rien de visible hors ligne : aucun retour.
7. Thème : bouton isolé dans l'en-tête, libellé « Thème sombre (cave) » ; le ⋮ est le seul bouton plein, il attire l'œil
   plus que la loupe.
8. Réglages : feuille dense de formulaires ; à l'ouverture un message d'erreur IBAN rouge de 5 lignes (sur la fixture).
9. Journal des modifications : puces tronquées à droite (« Stocks · ( »), état vide « Aucun événement ne correspond à vos
   filtres » sans filtre posé.
10. Barre du bas à 1280 : une barre de téléphone étirée sur 1200 px, icônes de 90 px au centre, « + » isolé à 1 200 px
    de là ; aucune navigation latérale.
11. « + » : le menu mêle l'action de l'écran, le compagnon, la vente, la facture, la recette et le brassin (5 ou 6 lignes,
    l'ordre change selon l'écran) ; sur Atelier, l'écran a déjà son propre « + » noir : deux « + » à l'écran.
12. La pastille « Compagnon hors connexion · mode local » flotte au-dessus de la barre et chevauche le menu du +.
13. Le toast « Base initialisée avec 11 enregistrements » couvre les onglets de l'écran sous l'en-tête pendant ~4 s.
14. Au rechargement l'app rouvre le dernier écran (ex. Brassins › Atelier), pas le Bord : à garder (attendu), noté.

Hors portée : Bord, Clients, et les écrans couverts par d'autres missions (Stock, Finances, Brassins, Recette, Atelier,
Fûts, Matériel, compagnon) ; seuls leurs points d'entrée (onglet, ligne de menu, ligne du +) sont dans cette mission.
