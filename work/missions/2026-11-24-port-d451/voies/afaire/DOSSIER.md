# Dossier afaire (voie 5)

Maquette : maquettes3/src/v01.mjs, écrans `afaire` (l. 145-159) et `epreuve` (l. 191-201) ; atomes.mjs (`tg('achat', …)`,
`p3-chk`, `p3-h`, `p3-l`).

À faire (VERDICT § 4 n° 7) : filtres « Arbre · À faire n · 🔔 n » (rangée de la voie liste ; toi tu rends le corps) ;
groupes « Cette semaine n », « Fin du mois n », « Un jour n » ; chaque ligne : case, texte, sous-ligne picto de catégorie +
problème d'origine (· coût, · « dans À venir »), jeton de coût à droite (« ≈ 35 CHF », « 540 CHF »). Les achats datés vont
dans À venir (plan du carnet, `planAuCalendrier`, une clé idempotente `PLAN-CARNET-<id>` : un seul plan par carnet, celui
de l'option retenue ; les autres achats restent des tâches avec leur coût). Une tâche faite se coche, sort du groupe,
et reste dans le fil de son problème (événement `tache`).
Ses mots : « Peut être aussi avoir une Todo ?? … tâche et autres à mettre en vigueur pour résoudre » (SES-MOTS) ; Things
« Un jour » (ETAT-DE-L-ART § 2). Rien ne reproche une tâche en retard : elle reste dans « Cette semaine », sans rouge.

Imprévus (VERDICT § 4 n° 8) : l'arbre (voie liste) montre « Brasserie › Événements », « Papiers › Assurances » et
« À ranger n » ; toi, la carte IA « photo seule, sans texte » / « Rattacher à <problème> ? » avec Oui, Nouveau problème,
Laisser. Tant que la décision « photo seule » (PLAN) n'est pas prise : option B, le problème ouvert touché en dernier, raison
dite (« ouvert hier »), jamais une description de la photo ; « truc à voir » sans autre texte : la carte dit « rien d'autre
écrit : reste ici » et propose Laisser d'abord.

Tests (Vitest) : groupes (semaine, fin du mois, un jour ; en retard → cette semaine ; dimanche et fin de mois aux bornes,
fuseau Europe/Zurich) ; coût absent ≠ 0, « ≈ » gardé ; achat daté → plan idempotent ; carte À ranger : proposition B ou
aucune, jamais de texte inventé ; un cas neuf (fête : « tireuse, 4 fûts ») qui n'est pas un problème matériel.
