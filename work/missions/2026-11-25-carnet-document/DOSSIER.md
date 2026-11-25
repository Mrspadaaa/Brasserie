# Dossier — « un carnet, pas un chat » (exploration légère, 25.11)

Ses mots (mot pour mot, SPEC-BRASSEUR.md, 25.11 après-midi) :
« Et en fait ça serait pas un chat mais un carnets donc pas de chat mais un champs text, peut-être être un bouton d'envoie pour de l'ai soit actionnable, et un bouton d'ajout de photos aussi. Et aussi comme mtn quand j'ai un lien dans le clipboard ça me conseiller de le coller super facilement. Et elle remet en partie mon carnet, car le problème c'est que dans un chat, ça s'efface et édité mal alors que dans un carnets il y a pas cette problématique... Regarder UN PEU dans cette direction. »
« Non l'ai a un rôle très important là dedans, en fait moi je fais que des mini input, mini note et elle doit m'aide, m'appuie, conseillé, classé, corrigé ECT... »
« Peut être arrêté le massacre et trouvé des vrai solution aux vrais problèmes »

Ce qu'il faut :
1. Références (WebSearch, 15 min au plus) : carnets où l'IA réorganise un document que l'on écrit (Notion AI, Apple Notes, Craft, Reflect, Mem, Obsidian + IA, Google Keep…) : comment l'IA « remet en ordre » sans effacer, comment on voit ce qu'elle a changé, comment on annule. 5 lignes par référence, au RESULTAT.
2. 3 mini maquettes statiques à 390 px (HTML autonome, une page), sur UN vrai cas : le carnet « écoulement qui fuit » (son fil réel : tests/fixtures/c79/ ; ouvre-le) :
   - un champ texte (pas de bulles), photo, coller le lien du presse-papiers, et un bouton qui envoie à l'IA ;
   - l'IA « remet en partie » le carnet : le document se structure (ce qui est trouvé / pas trouvé, pistes, devis, coût, prochaine étape, conseil, correction d'incohérence), ce qu'elle a changé se voit et s'annule ;
   - trois façons différentes de le faire (ex. : document unique réécrit par sections ; notes gardées + fiche de synthèse IA au-dessus ; notes avec annotations IA en marge).
   Chaque maquette : état avant l'envoi, état après, et le geste d'annulation.
3. Le critique calibré (PORTRAIT.md) juge les 3 : « combien et quels problèmes ? », une correction, puis une page de choix écrite à la main (page.html : les 3 côte à côte, une phrase chacune, rien d'autre), vérifiée par `node scripts/agents/verifier-page.mjs page.html --page-lot --captures cap/page` → PAGE OK.
Léger : pas de port, pas de code dans src/, pas d'autre voie. Possède : work/missions/2026-11-25-carnet-document/.
