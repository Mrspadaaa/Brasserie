# Dossier c81-tests — CARNET-COHERENT (sa plainte du 25.11 après-midi) sur les VRAIS documents

Défaut : work/refonte-frontend/v4/DEFAUTS-RECURRENTS.md § CARNET-COHERENT ; captures plaintes/2026-11-25-co2-incoherent.jpg, -citra-tour80.jpg (ouvre-les). Documents réels : tests/fixtures/c79/ (le CO2 y est), c75/houblons-citra.json.
Règle de méthode (L12, 25.11) : un mineur revu deux fois est bloquant ; chaque test reproduit ce que montre SA capture.
- R116 : une option retenue implique l'état Décidé : l'écran ne montre jamais « Noté » (ou « Je cherche ») avec une option « retenu » ; il propose de passer à Décidé d'un toucher (pas d'écriture seule) ; pour TOUT carnet de la fixture, pas seulement le CO2.
- R117 : le titre du carnet n'est jamais redit en bulle (1re bulle égale au titre, avec ou sans « ZZ TEST — ») : masquée ou fondue dans l'en-tête ; pour tous les carnets de la fixture.
- R118 : rang « ? » d'un article : la ligne dit pourquoi (« prix à relire ») au lieu d'un « ? » seul.
- R119 : aucun chiffre du Carnet rendu dans une police à chasse fixe espacée (classe cn-mono ou font-variant appliquée aux nombres α, CHF/kg, prix) — teste la classe/le style des cellules, et note que la mesure visuelle est au contrôle Chrome de c80.
SEULEMENT des tests rouges ; aucun fichier de src/ ni functions/ modifié (c80-fix y écrit).
