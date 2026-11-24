# RESULTAT liens-banc (rejoué par le pilote : l'exécutant n'a pas le droit d'appeler Gemini)

Commande : npx tsx scripts/banc-liens.ts --ia reel --confirm-paid-ai --budget 0.40 --secret functions/.secret.local --etiquette lm-complet (banc.log, mesures/lm-complet.json).
- Ce lancement : 7 appels (6 Hydrogen, 1 Flash-Lite), 0,074 CHF ; 45 réponses rejouées du cache ; 3 relectures refusées par la réservation prudente (cumul voie 0,339 CHF). Relectures de la règle : 21/24.
- Règle D449 sur le banc : prix 54/56, photo 56/59, caractéristiques 41/48, HT 9/9, livraison CH 15/23, 0 invention ; les 6 relectures Hydrogen neuves n'ont rien ajouté.
- Coût par lien avec IA : p50 0,0076 CHF, p90 0,017 CHF ; durée p50 3,3 s, p90 5,7 s.
- Décision du pilote : pas de dépense de plus pour les 3 restantes ; la règle de sa décision D449 passe en ligne (gain : +3 caractéristiques sur 48 ; coût < 1 centime par lien en médiane).
BANC COMPLET (21/24) : prix 54/56, caract 41/48, inventions 0
