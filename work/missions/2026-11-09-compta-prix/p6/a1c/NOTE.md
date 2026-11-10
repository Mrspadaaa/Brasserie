# a1c — Analyse : deux années superposées (tiède)

**Idée** : le cumul de ce qui est gagné, mois après mois : 2026 en bleu sur 2025 en gris, l'écart teinté en vert, le prévu en pointillé ; dessous, l'écart (+2 856,00) se décompose par catégorie, à droite ce qui rapporte plus, à gauche ce qui coûte plus.

**Questions servies** : 3 au premier plan (les deux courbes) ; 1 la pente de chaque courbe dit quand ça monte et quand ça descend (point bas 2025 en avril-mai) ; 2 la droite du prévu, et la décomposition qui montre où l'argent part.

**Placement** : un cinquième onglet de Finances, « Comparer » (le titre de l'écran dit « 2026 contre 2025 », pas le nom de l'onglet).

**Données** : exemple (2026 janv.–oct. et 10 nov., 2025 entière, budget 810,00/mois, ventes prévues 900,00/mois — `FinancialPlan` a `direction: 'in' | 'out'`), marquées « exemple ». Annexe : **ses données aujourd'hui** — « rien noté jusqu'au 10.11 » hachuré, puis un saut au plus +5 667,32 (5 achats à compléter) ; travaux 5 500,00 à part ; « Rien à comparer · 2025 : rien noté », sortie : « Ajouter 2025 » (un total par mois) ; prévu : aucun.

**Boosters** : annees-superposees (toucher un mois pose une règle verticale et lit les deux valeurs) ; ecart-par-categorie (barres de part et d'autre de l'axe, un toucher ouvre la catégorie mois par mois) ; legende.
B1 OK (data-booster posés) · B2 OK (la réponse domine, vue sur la capture) · B3 OK (42 mots hors données et hors en-tête ; aucune phrase d'aide au repos) · B4 OK · B5 non mesuré · B6 non mesuré (Plex Mono tabulaire pour les mesures) · B7 non mesuré (une couleur d'alerte ; orange = hors budget / à confirmer) · B8 OK (état honnête dessiné : rien noté ≠ 0, « au moins », « à confirmer », à part) · B9 s.o. (statique) · B10 s.o. · B11 voir RESULTAT · B12 OK (en-tête, rail, barre du bas, + de la baseline) · B13 non mesuré (segments 28 px, boutons 32 px).

**Contrôles** : PAGE OK (verifier-page, 390 px, sans erreur) · 1280 : débord 0, texte < 12 px : 0, erreurs 0 · MOTS 42 (mots-premier-ecran --sans-donnees --sans-coquille --profil=sans-houblons --max=60 : MOTS OK) · PANEL OK (lot a1, 8 captures). Statique.

**Captures** (ouvertes) : `a1c-haut.png` (premier écran), `a1c-page.png` (avec l'état honnête), `a1c-1280.png`.

**Tient** : la réponse « mieux ou moins bien que l'an passé » se lit en une seconde ; la décomposition dit pourquoi.
**Casse** : le cumul cache les mois isolés (un mauvais mois se lit seulement à la pente) ; un cinquième onglet charge le rail à 390 (« Opérations » serré).
