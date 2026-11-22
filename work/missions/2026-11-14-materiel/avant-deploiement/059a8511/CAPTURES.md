# Captures avant déploiement — 059a8511

Banc : W = `C:/Users/mrspa/AppData/Local/Temp/materiel-port` (HEAD 059a8511), `vite` port 3467, arrêté après usage. `seedData.ts` jetable : fixtures 13 appareils (BRIEF-AUTEUR §3), 2 dépenses reliées au pH-mètre (08.10 24,90 ; 22.05 12,50), 5 brassins après 01.08 ; états « vide » captures avec le gabarit `seedData.example.ts` (équipement vide). Restauré par `cp` puis `cmp` : identique à l'original. Date figée 14.11.2026 10:00 (shim Date). Requêtes hors localhost bloquées (interception). Aucun Gemini, aucun commit, aucun fichier de src/ modifié.

Vérifications par capture (journal `scratchpad/journal-avant-{fixture,vide,fin}.json`) : 0 texte < 12 px, 0 `input[type="number"]`, 0 débordement horizontal, 0 exception page, 0 erreur console applicative. Les erreurs console `ERR_BLOCKED_BY_CLIENT` (ressources externes coupées) ne sont pas comptées.

Limite : les 36 PNG n'ont pas toutes été relues en image dans cette session (contrôle visuel pièce par pièce non fait : budget de contexte). Ce qui suit est le contrôle du flux et des données, plus les doutes de pixels identiques.

| Fichier | Contrôle flux / ce qui est attendu | Erreurs console |
|---|---|---|
| repos-390-clair.png | liste Tout 13, fil, panneau absent en 390 ; identique à annule-390-clair (doute : repos après Annuler) | aucune applicative |
| traiter-390-clair.png | filtre À traiter cliqué ; à juger visuellement | aucune |
| fiche-390-clair.png | fiche pH-mètre, 7,01 et 4,02 saisies (valeurs relues dans le journal) | aucune |
| apres-etalonne-390-clair.png | après Étalonné : toast attendu « Étalonné · à jour jusqu'au 15.12 » | aucune |
| annule-390-clair.png | après Annuler : pH-mètre revient « prévu le 11.11 » ; identique à repos-390-clair | aucune |
| fiche-pompe-390-clair.png | fiche pompe « fuit au raccord · depuis le 05.11 », pied Réparée | aucune |
| ajout-390-clair.png | feuille Nouveau matériel ouverte par « Déjà possédé » | aucune |
| gestion-390-clair.png | fiche pH-mètre, ⋯ cliqué ; menu visible non vérifié | aucune |
| vide-390-clair.png | gabarit vide : « Aucun matériel », Tout 0 | aucune |
| repos-390-sombre.png | cave, liste ; identique à annule-390-sombre (doute) | aucune |
| traiter-390-sombre.png | cave, filtre À traiter | aucune |
| fiche-390-sombre.png | cave, fiche pH, 7,01 / 4,02 saisies | aucune |
| apres-etalonne-390-sombre.png | cave, après Étalonné | aucune |
| annule-390-sombre.png | cave, après Annuler ; identique à repos-390-sombre | aucune |
| fiche-pompe-390-sombre.png | cave, fiche pompe | aucune |
| ajout-390-sombre.png | cave, Nouveau matériel | aucune |
| gestion-390-sombre.png | cave, ⋯ ouvert ; menu visible non vérifié | aucune |
| vide-390-sombre.png | cave, gabarit vide | aucune |
| repos-1280-clair.png | liste + fil + panneau de la Pompe (premier à traiter) | aucune |
| traiter-1280-clair.png | filtre À traiter, panneau | aucune |
| fiche-1280-clair.png | panneau pH-mètre, 7,01 / 4,02 saisies | aucune |
| apres-etalonne-1280-clair.png | après Étalonné | aucune |
| annule-1280-clair.png | après Annuler ; identique à gestion-1280-clair (doute : ⋯ non visible) | aucune |
| fiche-pompe-1280-clair.png | panneau pompe | aucune |
| ajout-1280-clair.png | Nouveau matériel (« Matériel déjà possédé » cliqué via « possédé ») | aucune |
| gestion-1280-clair.png | ⋯ cliqué ; identique à annule-1280-clair (doute : menu non visible) | aucune |
| vide-1280-clair.png | gabarit vide | aucune |
| repos-1280-sombre.png | cave, panneau pompe ; identique à fiche-pompe-1280-sombre (attendu : pompe par défaut) | aucune |
| traiter-1280-sombre.png | cave, filtre À traiter | aucune |
| fiche-1280-sombre.png | cave, panneau pH, 7,01 / 4,02 | aucune |
| apres-etalonne-1280-sombre.png | cave, après Étalonné | aucune |
| annule-1280-sombre.png | cave, après Annuler ; identique à fiche-1280-sombre et gestion (doute) | aucune |
| fiche-pompe-1280-sombre.png | cave, panneau pompe | aucune |
| ajout-1280-sombre.png | cave, Nouveau matériel (passe « fin ») | aucune |
| gestion-1280-sombre.png | cave, ⋯ (passe « fin ») | aucune |
| vide-1280-sombre.png | cave, gabarit vide | aucune |

## Doutes à juger
1. Pixels identiques (md5) : annule-390-clair = repos-390-clair ; annule-390-sombre = repos-390-sombre ; repos-1280-sombre = fiche-pompe-1280-sombre (attendu, pompe par défaut) ; annule-1280-clair = gestion-1280-clair ; annule/fiche/gestion-1280-sombre (groupe de 3). Le ⋯ ne s'ouvre peut-être pas en capture pleine page.
2. Toast « Étalonné » et Annuler : leur présence n'est pas vérifiée sur les PNG (journal seulement).
3. Passe « fin » (ajout-1280-sombre, gestion-1280-sombre) : refaite après une coupure de serveur.
4. Le fichier vide n'est pas garanti par `&vide` : l'état vide vient du gabarit d'origine, pas du paramètre.
