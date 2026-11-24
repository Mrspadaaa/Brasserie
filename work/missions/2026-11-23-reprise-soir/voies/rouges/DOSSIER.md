# Dossier rouges

- Rouges signalés par la voie frise-centimes (voies/frise-centimes/RESULTAT.md) sur la suite tests/unit : hopReclasserIA, designTokens, gemini38LiveProof, geminiModelRouting, stock/murDonnees ; contrôle virgule-transversale : 29 violations, dont 4 neuves (francsExacts(…) CHF).
- Pistes : geminiModelRouting et gemini38LiveProof peuvent venir de D449 (gemini-4-neon ajouté pour « Escalader », voie liens-modeles, commit 40c6766a5) ; un test « LiveProof » qui appelle Gemini réel ne doit jamais tourner dans npm test (simulé, ou exclu et lancé à part).
- stock/murDonnees : fichiers non commités d'une autre session (src/domain/stock) : ne rien toucher, seulement noter.
- K51-1 (m) : deux achats le même jour : la courbe de l'en-tête n'en nomme qu'un (« ZZ TEST — achat rond −80 ») alors que la marche fait −159,95. Attendu : la bulle nomme les deux (ou « 2 achats ») et le total.
- PC-117 (m, ancien) : Finances › Prévisions nomme le groupe « TEST (2 fois) » au lieu des noms des écritures. Attendu : le nom de l'écriture.
