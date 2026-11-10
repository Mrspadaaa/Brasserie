# a1h — Analyse : le relevé qui se dessine (chaude)

**Idée** : le temps descend l'écran, ligne après ligne comme un relevé de banque ; la caisse est une barre qui s'allonge quand ça rentre (vert) et se ronge quand ça sort (hachuré rouge) : l'escalier de p5b couché ; chaque mois s'ouvre par sa ligne gagné · prévu · 2025.

**Questions servies** : 1 au premier plan (chaque opération, la caisse après) ; 2 « prévu +90 » à chaque mois, « pas prévu » sur l'opération ; 3 « 2025 +120 » à chaque mois.

**Placement** : Opérations : une bascule liste / dessiné ; c'est le journal, dessiné.

**Données** : exemple (2026 janv.–oct. et 10 nov., 2025 entière, budget 810,00/mois, ventes prévues 900,00/mois — `FinancialPlan` a `direction: 'in' | 'out'`), marquées « exemple ». Annexe : **ses données aujourd'hui** — départ 100,00 « à confirmer » ; un seul bloc hachuré « rien noté 09.01 → 09.11 » (pas dix lignes à 0) ; le 10.11 en trois lignes, « −27,68 au moins », travaux rongent la barre en bleu hachuré, « à part » ; « aucun prévu », « 2025 : rien noté ».

**Boosters** : releve-dessine (une ligne touchée ouvre l'opération) ; periode (« Août et avant » replié).
B1 OK (data-booster posés) · B2 OK (la réponse domine, vue sur la capture) · B3 OK (55 mots hors données et hors en-tête ; aucune phrase d'aide au repos) · B4 OK · B5 non mesuré · B6 non mesuré (Plex Mono tabulaire pour les mesures) · B7 non mesuré (une couleur d'alerte ; orange = hors budget / à confirmer) · B8 OK (état honnête dessiné : rien noté ≠ 0, « au moins », « à confirmer », à part) · B9 s.o. (statique) · B10 s.o. · B11 voir RESULTAT · B12 OK (en-tête, rail, barre du bas, + de la baseline) · B13 non mesuré (segments 28 px, boutons 32 px).

**Contrôles** : PAGE OK (verifier-page, 390 px, sans erreur) · 1280 : débord 0, texte < 12 px : 0, erreurs 0 · MOTS 55 (mots-premier-ecran --sans-donnees --sans-coquille --profil=sans-houblons --max=60 : MOTS OK) · PANEL OK (lot a1, 8 captures). Statique.

**Captures** (ouvertes) : `a1h-haut.png` (premier écran), `a1h-page.png` (avec l'état honnête), `a1h-1280.png`.

**Tient** : le journal qu'il connaît devient l'évolution ; aucune forme nouvelle à apprendre.
**Casse** : à 22 lignes, le premier écran tient deux mois et demi ; l'échelle coupée à 3 000 doit rester visible ; proche de a1a dans l'idée (escalier), autre dans la forme.
