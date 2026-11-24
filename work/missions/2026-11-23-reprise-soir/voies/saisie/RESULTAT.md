OK — PRÊT À METTRE EN LIGNE 307577f47 : coche sans justificatif, apport au Calendrier, date en direct, avis au-dessus de la barre

## Fichiers écrits (commit 307577f47, par chemins)
- src/ui/saisie/modele.ts : `Brouillon.sansJustificatif`, `preparer` écrit `finance.proofNotNeeded`, `dateMontree` (jour tiré ou valeur).
- src/ui/saisie/SaisieMain.tsx : coche « Sans justificatif, c’est normal » (ligne sous le pli, tous les genres sauf Remboursement) ; la pastille de date et le nom par défaut suivent le doigt (`onBrouillon` de ChoixDate, sans toucher ChoixDate).
- src/ui/saisie/saisie.css : `.sai-ck`, et le bas du contenu réserve `--avis-maj`.
- src/ui/calendrier/useDonneesCalendrier.ts : l’apport encaissé devient une chose de la rangée Ventes (« apport, reçu le … »).
- src/services/miseAJour.ts : `hautDesBarresBasses`, `basDeLAvis`. src/ui/BandeauMiseAJour.tsx : avis en bas, juste au-dessus de la barre la plus haute.
- tests/unit/saisieReprise.test.ts (14 tests, rouges avant : 11 échecs, tests-rouge.log).

## Critères
- `npx tsc --noEmit -p .` : seulement les 2 erreurs connues (seedData GanttTask, virtual:pwa-register).
- 13 fichiers (saisieReprise, saisie-main, miseAJourRepos, bugsWorkflowsCalendrier, calendrier*, calPasse, lot11Carnet, fenetreFrise) : 290 verts (tests.log).

## Constats et choix
1. Apport : la vue n’avait que « Note ». Vente et Autre n’avaient pas non plus la coche (aucun genre de la saisie à la main ne l’avait ; elle existait dans la dépense avec document et sur la fiche). Je l’ai mise sur tous les genres (sauf Remboursement), décochée par défaut : l’inconnu reste « sans justificatif ». Client, Revient ? et TVA restent absents de l’apport (sans sens).
2. Calendrier : le filtre ne gardait que `kind === 'income'` ; l’apport n’était que sur la courbe. Il est maintenant dans Ventes, au jour de son paiement. Un prélèvement privé reste dehors.
3. Date : la frise n’écrit qu’au lâcher ; la pastille lisait la valeur écrite. Elle lit maintenant le jour tiré.
4. Avis : mesure des barres du bas (footer, nav, pied sticky) toutes les 400 ms et au clavier ; l’avis se pose au-dessus ; la saisie réserve sa hauteur sous son contenu.

## Doutes et limites (preuve en ligne par le pilote, aucune capture locale)
- Avis : dans les autres feuilles que la saisie, il se pose sur le bas du contenu, au-dessus du pied, sans place réservée. À regarder sur téléphone avec clavier ouvert (position du pied pendant la frappe).
- Rangée Ventes : un apport y est compté dans le total de la rangée, avec « apport » dans le détail. Si le brasseur veut une rangée à part, c’est une décision de dessin.
- Le titre « 22.10 » vs pastille « 14.10 » de la capture : dans le code actuel tous deux lisaient `b.date` ; la version en ligne était sans doute antérieure. Les deux suivent désormais le doigt.
- Pas rejoué en ligne : ZZ TEST (apport avec et sans coche, puis vérifier la ligne au Calendrier).

DÉCISION À PRENDRE : aucune bloquante (rangée Ventes pour l’apport : défaut prudent ; recommandation : garder).
CONNAISSANCE : aucune
LEÇON PROPOSÉE : aucune
