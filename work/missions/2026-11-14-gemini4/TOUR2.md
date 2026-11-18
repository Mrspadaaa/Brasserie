# Tour 2 — Gemini 4 ailleurs dans l'app (14.11 soir)
Brasseur : « D'autres endroits où certains changements vaudrait la peine ? Fait des tableaux de comparaison, budget jusqu'à 15chf ».
Lecture du pilote (L01) : 15 CHF pour ce tour, journal propre `journal-tour2.md` (une ligne par appel, cumul), arrêt dur à 14,5 CHF tous voies confondues ; part par voie ci-dessous.

Commun à t2a, t2b, t2c :
- Lis `CLAUDE.md`, `cerveau/LECONS.md` (L20, L28, L29), `cerveau/agents/gemini-tests-reels.md`, `voies/g1/RESULTAT.md` (identifiants, prix, niveaux de réflexion vérifiés), `voies/g2/RESULTAT.md` (banc du compagnon, juge), `functions/src/models.ts`, `functions/src/geminiCosts.ts`. Jamais `functions/.env` ni `functions/.secret.local` (les bancs chargent la clé).
- Déjà en place (ne pas refaire) : 3ᵉ lecture des justificatifs = Hydrogen@low ; « Un doute ? » = Argon@low ; analyse du compagnon = Hydrogen@low.
- Pour chaque usage : grille {production actuelle, Hydrogen, Argon, Carbon} × réflexion acceptée (au moins basse ; moyenne/haute si l'usage est « Max » ou si la basse perd) ; Flash-Lite (3.5) aussi là où il sert déjà. Passe courte qui élimine, puis approfondir.
- Qualité jugée contre une vérité écrite AVANT les passes (fixtures, cas réels anonymisés, grille de faits) ; moitié pour choisir, moitié pour juger (L20) ; juge aveugle. Mesures : qualité, inutilisables, p50/p90 s, CHF par appel, appels.
- Tableau par usage dans RESULTAT.md, format : `| réglage | qualité | inutilisables | p50 s | p90 s | CHF/appel | verdict |`, première ligne = production. Puis une ligne « Recommandation : … (gain mesuré) » ou « garder ».
- Rien en production : diff proposé seulement. Aucun déploiement, aucune donnée réelle écrite, Gemini jamais dans `npm test` (tests simulés). HTTP 429 : arrêt. Ni stash. Commits par chemins, « Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com> ».
- Gemini 4 Argon/Carbon : tarif doublé au 1.12.2026, le dire dans le verdict.
