ECHEC — ouvrir la feuille Mesurer envoie POST saveBrewSession (409) sur LOT-016 réel ; 1280 non terminé.

Fichiers écrits :
- work/missions/2026-11-10-brassin-mesures/voies/e1/RESULTAT.md
- work/missions/2026-11-10-brassin-mesures/voies/e1/tests.txt
- work/missions/2026-11-10-brassin-mesures/voies/e1/captures/ : e1-01-accueil-390-clair.png, e1-02-brassins-onglet-390-clair.png, e1-02-conduite-390-clair.png, e1-02-mesurer-ouvert-390-clair.png, e1-03-piste-touchee-390-clair.png, e1-04-ferme-390-clair.png, e1-01-accueil-1280-clair.png, e1-02-mesurer-ouvert-1280-clair.png, e1-03-ferme-1280-clair.png
- Hors voie (scratchpad, non versé) : script de pilotage Puppeteer, scratchpad\e1\e1.mjs. Le lib.mjs de parcours-complet n'a pas été utilisé : il écrit ses captures hors voie.

Critères (GATES.md absent de la voie ; repris du VOIE.md) :
- Bundle : attendu index-a3wBuonJ.js ; lu index-a3wBuonJ.js : OK.
- Reprendre le brassage LOT-016, 390 : Conduite au repos, « Relevés du jour 0/2 », cases « ? SG » et « ? L » : OK (capture e1-02-conduite-390-clair.png, ouverte).
- Case « ? » Densité initiale, 390 : feuille Mesurer sur l'onglet Densité, curseur « Densité, curseur » présent, cible 1,079–1,083, valeur « ? SG » avant toucher : OK (e1-02-mesurer-ouvert-390-clair.png, ouverte).
- Toucher la piste, 390 : « 1,081 SG », « 0 points / OG 1,081 », Enregistrer actif, non cliqué : OK (e1-03-piste-touchee-390-clair.png, ouverte).
- Fermer par × (« Fermer la saisie »), 390 : feuille fermée, « Relevés du jour 0/2 » et « ? SG » inchangés : OK (e1-04-ferme-390-clair.png, ouverte). Le bandeau « À synchroniser » est apparu, voir problème 1.
- 1280 : feuille affichée en panneau latéral, champ « moût refroidi » focus et vide (placeholder 1,056). Piste et × non trouvés par le script (pas de role=dialog) : NON FAIT.
- Console : POST https://europe-west6-brasserie-l-affinee.cloudfunctions.net/saveBrewSession en HTTP 409, et « Failed to load resource: 409 » : NON CONFORME (problème 1).

Essais : 1 essai de script sur le parcours 390 et 1280 (plus un passage 390 de correction de la fermeture). Pas de relance après le 409.

Problèmes numérotés :
1. [Critique] Écriture non voulue. Le geste « Relever Densité initiale » ouvre la feuille et envoie POST saveBrewSession sur le brassin réel LOT-016 (409, observé à 390 et 1280). Le bandeau devient « À synchroniser — Le journal a changé sur un autre appareil. Recharge sa version avant de continuer », avec Réessayer et Recharger le serveur. Le passage sans case (Reprendre seul) n'a aucun POST : la cause est l'ouverture de la feuille ou ce qui suit. Le 409 indique un refus, mais non établi que rien n'a été écrit. Le profil de test garde « brouillon conservé » en local. À confirmer côté pilote (journaux Cloud Functions) avant tout nouveau passage.
2. Pas d'horloge dans la Conduite : la carte « Relevés du jour » est sous la barre des étapes, avec deux cases « ? » (SG et L) à droite.
3. 1280 : sheet non testée (piste, ×). À refaire seulement après correction du problème 1, sinon le geste réécrit.
4. Captures non ouvertes : e1-01-accueil-390-clair.png, e1-01-accueil-1280-clair.png, e1-02-brassins-onglet-390-clair.png, e1-02-mesurer-ouvert-1280-clair.png. Le VOIE demande toutes ouvertes.
5. Feuille Mesurer 1280 : le champ « moût refroidi » prend le focus à l'ouverture (vérifier sur la capture e1-03-ferme-1280-clair.png, qui montre le même état).

Douteux : quel geste précis déclenche le POST (ouverture ou premier rendu de la feuille) ; si le serveur a stocké quelque chose malgré le 409 (non établi) ; ce que le 1280 donne à la piste et au × (non testé).

CONNAISSANCE : Ouvrir la feuille Mesurer depuis une case « ? » (Relever…) d'un brassin en cours envoie POST saveBrewSession (Cloud Function europe-west6) ; 409 observé le 10.11 en ligne, puis bandeau « À synchroniser ».

LEÇON PROPOSÉE : Une voie « lecture seule » en ligne doit couper les requêtes non GET (interception Puppeteer) et lister les POST attendus avant le geste. Une feuille d'écriture ouverte compte comme un geste d'écriture. Cause : la voie tenait « aucun Enregistrer » pour seule garde.
