# Dossier saisie — Apport, curseur de date, avis de nouvelle version

## Ses mots (23.11, mot pour mot) et captures (work/missions/2026-11-23-reprise-soir/plaintes/, OUVRE-LES)
1. « Plusieurs projets problème la vue apport, d'ailleurs elle s'affiche pas sûr le calendrier... Et elle diffère des autres vue, et il y a pas de coche pour dire que il y a pas de justificatif, c'est normal ??? » (2334-apport.jpg, 2335-apport-fin.jpg, 2336-calendrier-apport.jpg, 2337-vente.jpg)
   - Saisir à la main › Ça rentre › Apport (« De ma poche +1 200,00 », Apports privés) : seule une Note ; la vue Vente a Client, Revient ?, TVA référence. Pas de coche « pas de justificatif » (que les autres écritures ont : trouve-la).
   - Calendrier 7 sem. : l'apport n'apparaît que sur la courbe (« De ma poche +1 200 »), dans aucune rangée.
2. « Le slider met pas à jour la date en dynamique » (2339-curseur-date.jpg) : en tirant le curseur de date, le titre dit « 22.10 » mais la pastille date reste « 14.10 » : elle doit suivre le doigt en direct.
3. Même capture : l'avis « Nouvelle version · Recharger » (voie maj-pwa, 616b3aadd) se pose PAR-DESSUS l'en-tête de la saisie (cache « Autre ») : il ne doit jamais couvrir le contenu.

## Règles
- La vue Apport suit la même structure que les autres « Ça rentre » (mêmes blocs quand ils ont un sens : date, montant, statut, compte, justificatif ou coche « pas de justificatif », note) ; ce qui n'a pas de sens pour un apport (client, TVA) reste absent.
- Un apport se voit au Calendrier comme les autres entrées d'argent de même genre (cherche comment une rentrée « Autre » s'y affiche ; même rangée, même marque).
