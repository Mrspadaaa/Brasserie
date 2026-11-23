# Intégration des lots du Carnet (pilote)

| lot | branche | état | commits | hors lot / notes |
|---|---|---|---|---|
| 5 | claude/carnet-lot-5 | fini | 6d67376ea (L-30), 3e178c1bd (L-31 à L-35) | lot 1 : aperçu « Nouveau carnet » mais rangé dans Frigo + congel ; lot 2 : « Y ajouter en façon » n'ajoute rien (CarnetsVue.tsx:1150) ; capture de référence liste-390 régénérée (conflit possible) ; seedData.ts copié dans le worktree (ignoré, à retirer) |

Lot 11 (après fusion) : D430 (14 px), D431 (frise partout : Quand, Fixer la date, Modifier, fiche), hors-lot ci-dessus.
| 2 | claude/carnet-lot-2 | fini | ff6616e51, 2ef99c943, d07b3152c, f2e00154a (L-9 à L-16) | lot 3 : pastille « Idée » pour projet acheté sans choix (CarnetOuvert etiquetteStatut) ; Calendrier iconesIdees : icône du carnet garde sa date quand la barre du plan bouge ; lot 4 : « 1.845 » lu 1,845 dans comparer.ts ; lot 1/7 : prix tapé en bas devient note ; « Plus tard » ne déplace pas le plan ; « Supprimer avec son plan » bordure verte (rouge attendu) ; capture de référence fiche-article régénérée ; .env copié |
| 7 | claude/carnet-lot-7 | fini | c70f6f5e0 (L-44), 74b4be94a (L-45 à L-47) ; L-48 non reproduit (garde) | captures 390 non prises (à faire à l'intégration) ; Playwright L-45/L-47 pas vus rouges ; seedData.ts et .env copiés |
| 1 | claude/carnet-lot-1 | fini | 50d3c46ab, ba4a82d74, 756a3db35 (L-1 à L-8, L-5 et L-8 en partie) | FONCTION aiTask à déployer seule : ATTENDRE SON ACCORD (ai.ts porte aussi la lecture des factures, PR #199 jamais vérifiée en ligne) ; hors lot : Relire/Ranger maintenant après échec, puce « Y ajouter ? » (carnetSuggere), statut bloquee/introuvable au bandeau (CarnetsVue:614), analyseLocale.ts « 1 article · 400 CHF », « Rangé ici » pendant le rangement ; functions/node_modules installé par npm ci dans le worktree |
| 6 | claude/carnet-lot-6 | fini | f4d9c36da, c7a815452, 9e292b545, a33cedc2f (L-36 à L-43) | parseDecimal (85 appels) changé → vitest COMPLET à l'intégration ; a pris ChampNombre.tsx et retirerEcriture.ts (hors table) ; hors lot : lireMontant (src/ui/saisie/modele.ts) doit appeler lireDecimal ; barre-bord.spec instable |
