# Dossier c81-fix

- Tests à rendre verts : tests/unit/c81Regles.test.tsx (voie c81-tests), sur les vrais documents.
- Règles : voies/c81-tests/DOSSIER.md (R116..R119). Garder c48..c79Regles, noteRegles, c70RangementIA, c68Realises, carnets*, lot3CarnetOuvert, horizons*, pxPrix*, virgule-transversale, proprietes, stocksMaterielUneRangee verts ; LISTE OK et MISE-EN-PAGE OK. Utilise Edit. Aucun appel Gemini réel.
- R121 élargi (sa plainte « Ça répond à Aucune problématique ??? », DEFAUTS § CARNET-REPOND-AU-BESOIN) : la structure du problème (jetons trouvé / pas trouvé / devis / coût, options, prochaine tâche) se calcule À L AFFICHAGE pour tout carnet problème sans étiquettes, dès l ouverture, marquée « lu par l app » ; un toucher l enregistre. Écoulement et CO2 (fixtures c79) : écris aussi ces tests rouges toi-même en premier, avant le code, si c81-tests ne les a pas.
