# Dossier c70-fix

- Tests à rendre verts : tests/unit/c70Regles.test.tsx (voie c70-tests, 22 rouges ; causes au RESULTAT de c70-tests).
- Décision du pilote : À faire garde les trois groupes de la maquette (Cette semaine · Fin du mois · Un jour), règle n° 1.
- R81 d abord : Comparer passe la quantité et le prix cochés à Choisir ; « ≈ » devant le prix converti.
- La voie c70-ia écrit functions/src/carnetIA.ts, src/domain/carnets/ia.ts, scripts/banc-rangement.ts, tests/unit/c70RangementIA.test.ts : n y touche pas ; R83 côté écran seulement (carte et carnet créé suivent la réponse).
- Garder c48..c69Regles, c68Realises, carnets*, lot3CarnetOuvert, virgule-transversale, proprietes, stocksMaterielUneRangee verts. Aucun appel Gemini réel. Aucune donnée réelle.
