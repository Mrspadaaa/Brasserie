# a1b — Analyse : les tuiles de g2c en outil (froide)

**Idée** : les tuiles de g2c, à un toucher d'Annuel : chaque mois teinté par ce qu'il a gagné ou perdu, une règle de budget au pied (gris jusqu'au trait des 810,00 prévus, rouge hachuré au-delà), le même mois 2025 au coin ; la 13e case noire compare les deux années (+2 016,00 contre −840,00, « budget dépassé 6 mois sur 10 »).

**Questions servies** : 1 la teinte des douze mois (la saison se voit) ; 2 la règle au pied de chaque tuile ; 3 le chiffre 2025 au coin et la 13e case.

**Placement** : Annuel › « Mois par mois » (le bouton existe déjà dans g6, en haut à droite) ; retour « ‹ Annuel ». Ce n'est pas la vue principale (ses mots du 09.11).

**Données** : exemple (2026 janv.–oct. et 10 nov., 2025 entière, budget 810,00/mois, ventes prévues 900,00/mois — `FinancialPlan` a `direction: 'in' | 'out'`), marquées « exemple ». Annexe : **ses données aujourd'hui** — dix tuiles « rien noté » hachurées (jamais 0) ; novembre vert « ≤ +5 667,32 · 5 achats à compléter » ; décembre à venir ; 13e case : travaux 5 500,00 à part, aucun budget fixé, 2025 « rien noté » ; la règle de budget disparaît, « Fixer un budget » à la place.

**Boosters** : tuiles-mois (le mois touché, mai, cerclé : il s'ouvre dans Opérations filtrées) ; annee (2026 ⌄) ; treizieme-case ; ia-ecart (« Pourquoi mai ? », au toucher, réponse marquée exemple) ; legende.
B1 OK (data-booster posés) · B2 OK (la réponse domine, vue sur la capture) · B3 OK (48 mots hors données et hors en-tête ; aucune phrase d'aide au repos) · B4 OK · B5 non mesuré · B6 non mesuré (Plex Mono tabulaire pour les mesures) · B7 non mesuré (une couleur d'alerte ; orange = hors budget / à confirmer) · B8 OK (état honnête dessiné : rien noté ≠ 0, « au moins », « à confirmer », à part) · B9 s.o. (statique) · B10 s.o. · B11 voir RESULTAT · B12 OK (en-tête, rail, barre du bas, + de la baseline) · B13 non mesuré (segments 28 px, boutons 32 px).

**Contrôles** : PAGE OK (verifier-page, 390 px, sans erreur) · 1280 : débord 0, texte < 12 px : 0, erreurs 0 · MOTS 48 (mots-premier-ecran --sans-donnees --sans-coquille --profil=sans-houblons --max=60 : MOTS OK) · PANEL OK (lot a1, 8 captures). Statique.

**Captures** (ouvertes) : `a1b-haut.png` (premier écran), `a1b-page.png` (avec l'état honnête), `a1b-1280.png`.

**Tient** : c'est g2c qu'il a trouvé « top », enrichi sans changer de forme ; trois questions dans une tuile.
**Casse** : la tuile porte trois choses : à 390 le chiffre 2025 du coin reste petit (12 px) ; la teinte demande une échelle fixe (seuils à définir).
