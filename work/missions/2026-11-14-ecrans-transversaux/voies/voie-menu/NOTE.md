# voie-menu — l'en-tête et son menu ⋮ (v0, 4 mini maquettes)

m1 · Menu de compte groupé · froide · défauts réglés n° 4, 5, 6, 7, 9 · le ⋮ devient l'avatar de qui saisit (même poids que la loupe) ; le soleil/lune quitte l'en-tête pour le menu ; la période n'a plus qu'une place, le menu, aux deux formats (le select « Ce mois ▾ » quitte l'en-tête à 1280) ; menu en 4 groupes : état (Je saisis, Période en pastilles, Thème), outils, administration, sortie ; second état : Journal resserré (rubrique et auteur en deux segments, jours datés).
m2 · Pastille de contexte · tiède · défauts réglés n° 4, 5, 6, 7, 8 · l'état de l'app (période, auteur, thème) sort du ⋮ vers une pastille « Nov. · G » dans l'en-tête, même place à 390 et à 1280 ; le ⋮ (creux, plus plein) ne garde que les destinations, en deux groupes nommés ; période en raccourcis + frise des 12 mois + trimestres ; second état : Réglages resserré (lignes de 36 px, valeurs sur place, IBAN fautif en une ligne « Clé de contrôle fausse · Corriger »).
m3 · Page « Plus » à sections · chaude · défauts réglés n° 4, 5, 6, 7, 9 (8 en statut) · le ⋮ devient un duo d'avatars G/A qui ouvre une page plein écran : qui saisit (avec ses écritures du mois), période sur un histogramme d'activité par mois, thème en deux vignettes, outils en tuiles, administration avec son état à droite (Drive · IA Rapide, IBAN à corriger) ; un écran de plus (retour ‹) ; second état : Journal en frise par jour, part de chacun, rubriques en couleur sans troncature ; 1280 : trois colonnes.
m4 · Tiroir du pouce · chaude · défauts réglés n° 4, 5, 6, 7, 8 · le ⋮ devient l'avatar ; tout s'ouvre en feuille du bas, à portée de pouce : bascule d'auteur en interrupteur à deux faces, période en pas à pas (‹ oct. Novembre 2026 déc. ›, le pas suit Mois/T4/2026/Tout, donc T1–T3 par les flèches), grille 3 × 2 avec pastilles d'état, thème et sortie en pied ; libellés raccourcis (Conversations, Journal, Cloud et IA) ; second état : Réglages en sections résumées, Fiscalité ouverte (pas à pas, Oui/Non, IBAN avec la clé « 44 » surlignée) ; 1280 : même grille en panneau sous l'avatar.

Jugement : m2 est ma préférée, parce qu'elle sépare l'état de l'app (période, qui saisit, thème) des destinations et règle le défaut n° 4 aux deux formats sans alourdir l'en-tête (une pastille de 28 px). m4 est la plus forte au pouce, mais elle raccourcit trois libellés. m1 est l'outil sobre, sans risque. m3 est la plus parlante, mais elle coûte un écran de plus pour changer de période.

## (proposé) — ce que l'app ne sait pas encore afficher
- Compte des écritures par auteur (« 14 / 9 », m3), activité par mois (histogramme, m3), « 4 aujourd'hui » (m1), statut de connexion « Drive · IA » et alerte « IBAN » remontés dans le menu (m1 à m4), « Modifié · non enregistré » (m2). Toutes viennent de données existantes (journal, réglages, connexions), le calcul reste à écrire.
- Données des captures : fictives, celles du brief (B-031, Citra T90, Brouwland 352,05 CHF, Marché d'automne 640,00 CHF, Gaëtan et Aricia).

## Rien de perdu (INVENTAIRE § Ce qui existe)
Les 9 lignes du ⋮ ont toutes une place dans chaque variante : Période (avec Tout l'historique, Ce mois, Mois dernier, Exercice 2026, T1 à T4), Mes conversations, Saisie au nom de… (devenue « Je saisis : Gaëtan | Aricia »), Assistant de brassage, Atelier R&D (pastille 1), Journal des modifications, Connexions cloud et IA, Réglages, Se déconnecter. Le thème quitte l'en-tête dans les quatre. La barre du bas et le + restent la baseline (voie-barre). L'Échéances du Bord sert seulement de contexte.

## Boosters UX (boosters-ux)
- Boosters : bascule d'auteur (choisir ; segment / interrupteur à deux faces ; m1, m2, m4), frise des mois + trimestres (choisir ; m2), histogramme d'activité (lire + choisir ; m3), vignettes de thème (choisir ; m3), pas à pas de période (ajuster ; m4), pastilles d'état sur les destinations (suivre ; m1, m3, m4). Maquettes non jouables : effet montré par l'état figé, pas d'avant/après.
- B2 OK : une dominante par capture (menu ou feuille) ; une seule action pleine (période active ou Sauvegarder).
- B3 OK : en-tête de 40 px, une rangée ; menus de 28–32 px par ligne ; aucune légende d'explication.
- B6 : trois tailles (12, 14, 18) ; chiffres en IBM Plex Mono, mots en Source Sans 3 (corrigé : « 14 écritures », « 4 aujourd'hui »).
- B8 : inconnu affiché « — % » (réduction OFDF), jamais 0 ; état vide du Journal non dessiné en v0 (à faire : « Rien en novembre · Tout l'historique › »).
- B12 : rayons 10 / 16 / 24 ; bordure 1 px ; pictos lucide au trait.
- B13 : cibles ≥ 28 px à 390 (pastilles 28, lignes 32–36, tuiles 76).
- Mesures R1–R6 non jouées en v0 (règle de l'entonnoir) ; à jouer en passe 2.

## Contrôles
- `controle-serie.mjs voie-menu m1,m2,m3,m4` : sortie dans `controle.txt`.
- Captures ouvertes et regardées (planches côte à côte 390 clair, second état, cave, 1280) ; corrigés après regard : chips de période mal coupées (m1), filtres du Journal (m1, m3), duo d'avatars masqué (m3), espaces de l'IBAN avalés (m4), mono sur des mots (m1, m3, m4), titre 1280 cassé (m3), feuille Réglages ajustée au contenu (m2).

LEÇON PROPOSÉE : aucune
CONNAISSANCE : une page de planche en `setContent` (about:blank) ne charge pas d'image `file://` : écrire la planche en fichier puis `goto`.
