# Captures s2 — description par l'exécutant (20.11)

Lancement : `node scripts/with_server.mjs --server "npm run dev -- --port 3105 --strictPort" --port 3105 -- node work/missions/2026-11-19-bugs-ecrans/voies/s2/capturer-s2.mjs`, ouvert en `?dev-local`. Fixtures posées par `FirestoreRepo.put('stockItems', …)` en mémoire : levure « Safale US-05 (test s2) » DDM 01.10.2026 (2 sachets), levure « Lalvin Kveik (test s2) » DDM 30.11.2026 (1 sachet, seuil 1), malt « Pilsner Malz » sans EBC saisie (25 kg, seuil 10 kg). Captures PLEINE PAGE (fullPage), pas défilées : voir les réserves.

Huit PNG, tous ouverts (Read) :

1. `bord-clair-390.png` : Bord, carte Stocks en tête de la zone : « Safale US-05 (test s2) — Périmé depuis 50 j » (rouge, pictogramme alerte) ; « Lalvin Kveik (test s2) — Périme dans 10 j » (ambre). Dessous « 1 article à commander » : Lalvin Kveik, « Stock 1 / seuil 1 sachet », « Seuil atteint ». Aucun recouvrement de texte.
2. `bord-cave-390.png` : même carte en thème cave, même texte, contraste lisible (rouge clair sur fond sombre, ambre pour « Périme dans »).
3. `bord-clair-1280.png` : même carte à droite de la grille (colonne Stocks), textes entiers, « Périmé depuis 50 j » et « Périme dans 10 j » alignés à droite ; rien de coupé.
4. `bord-cave-1280.png` : idem en cave.
5. `stocks-malts-clair-390.png` : Stocks, Ingrédients, zone Malts : ligne « Pilsner Malz » avec la pastille « EBC 2,5–4,5 » posée sur la barre d'échelle, « assez · seuil 10 kg », « 25 kg ». Zone Levures : « Safale US-05 (tes… » avec la pastille « DDM 10.2026 », « périmée depuis 50 j », « 2 sachets » ; la ligne « Lalvin… » est en partie recouverte en bas, par la pastille « Compagnon hors connexion · mode local » et par le bouton + (position fixe, capture pleine page) : « 1 sach… » et « périme dans 10 j » coupés à cet endroit.
6. `stocks-malts-cave-390.png` : même écran en cave ; même recouvrement en bas par les éléments fixes.
7. `stocks-malts-clair-1280.png` : tableau complet : colonne « EBC ↑ » avec la pastille « EBC 2,5–4,5 » pour le Pilsner ; colonne « DDM ↑ » avec « DDM 10.2026 » (périmée depuis 50 j) et « DDM 11.2026 » (périme dans 10 j · au seuil) ; « En stock » 25 kg, 2 sachets, 1 sachet. La pastille « Compagnon hors connexion » chevauche l'en-tête d'échelle « à l'échelle, en sachets » de la section Levures (fixe, pleine page).
8. `stocks-malts-cave-1280.png` : même tableau en cave, lisible.

Réserves (ce que ces captures ne prouvent pas) :
- Pleine page, pas défilées : le recouvrement à 390 (ligne Lalvin) et à 1280 (en-tête d'échelle) vient très probablement des éléments fixes (bouton +, pastille hors connexion) dessinés sur la fenêtre. Il reste à confirmer par une capture défilée à 390 tactile (non faite).
- Le thème cave est forcé par l'attribut `data-theme="cave"` sur `<html>`, pas par le bouton de l'app.
- « EBC ↑ » et « DDM ↑ » sont les en-têtes de tri de colonne, pas un défaut.
- Aucun contrôle de chevauchement par mesure de boîtes n'a été fait ; le jugement est visuel.
