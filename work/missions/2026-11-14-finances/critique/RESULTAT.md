OK — tri : s2b, s1b, s2a, s3b, s3c

Le détail est dans `work/missions/2026-11-14-finances/critique/SYNTHESE.md` : un tableau par variante (défauts numérotés et correctifs), le
classement, les 5 candidates et les greffes. La mesure du panel est dans `tests.txt` : PANEL ECHEC, avec une ressemblance de 0,93 attendue
puisque toutes partent du repos v6a ; la diversité est dans les états après. Les montants après le geste sont justes dans les 12 variantes
(payé 325,40 · à payer 0,00 · dépensé 296,80 · Fixes 68,00). C'est un tri : aucun REJET, le brasseur voit les 12.

- **s2b** (calendrier en feuille) — ACCEPTÉ, rang 1, garder. « Le calendrier, c'est clair. » À corriger : garder ‹ › en plage (ils
  glissent la plage), montants dans le pied de feuille, pilule teintée et non noire.
- **s1b** (pilule étirée) — ACCEPTÉ, rang 2, garder. « Je garde mes flèches. » À corriger : « 1er », bornes de 32 px (zone de 44 px),
  ligne « hors plage » sous Charges fixes.
- **s2a** (frise à poignées) — ACCEPTÉ, rang 3, garder. « J'aime voir quand l'argent bouge. » À corriger : frise repliée au repos
  (règle n° 1), poignées rondes et bulle, à cheval par défilement.
- **s3d** (règle du mois) — ACCEPTÉ, rang 4, corriger. « Pourquoi c'est hachuré comme un truc à payer ? » À corriger : hors plage en
  gris uni, ligne « hors plage », règle repliée au repos.
- **s1a** (feuille aux dates natives) — ACCEPTÉ, rang 5, corriger. « Où sont mes flèches ? » À corriger : ‹ › gardés, « 1er »,
  raccourcis dans la feuille.
- **s3b** (phrase aux dates touchables) — ACCEPTÉ, rang 6, corriger. « Novembre deux fois. » À corriger : puce seule au repos, ligne
  « hors plage », un seul retour.
- **s3c** (la loupe comprend une période) — ACCEPTÉ, rang 7, corriger. « Taper une date sur le téléphone, bof. » À corriger : la puce
  ouvre le calendrier, « loyer du 25 hors plage » au lieu de « 1 après le 17 ».
- **s2d** (brush sur l'histogramme) — ACCEPTÉ, rang 8, corriger. « Les fixes sont à 68 ou 468 ? » À corriger : étiquette au sommet de
  la part pleine (valeur trompeuse aujourd'hui), repli au repos.
- **s1c** (rangée et chevron) — ACCEPTÉ, rang 9, corriger. « C'est novembre ou du 1 au 15 ? » À corriger : icône calendrier, la plage
  remplace la pilule.
- **s3a** (préréglages) — ACCEPTÉ, rang 10, corriger. « Trop de boutons. » À corriger : au plus trois préréglages, dans la feuille.
- **s1d** (bascule Mois | Plage) — ACCEPTÉ, rang 11, corriger. Elle change la pilule v6a au repos, un écart à sa maquette signalé
  (règle n° 1). À corriger : pilule v6a telle quelle, « Plage » en icône.
- **s2c** (frise des 12 mois) — ACCEPTÉ, rang 12, corriger. « Il dit novembre et octobre en même temps ?? » À corriger : pilule
  remplacée, cadre sur O et N, jours posés au toucher. Sa greffe : le bandeau de la part sans données.

DEMANDE EXECUTANT (non bloquante, avant de montrer au brasseur) :
1. Captures pleine page à 390 px, échelle 2 : `node work/missions/2026-11-14-finances/voies/s2/outils/capturer.mjs` et
   `node work/missions/2026-11-14-finances/voies/s3/_outils/fabriquer.mjs`, en mode page entière pour s2b, s2a, s3b et s3c.
2. Fichier attendu : `<id>-apres-page.png` dans chaque dossier.
3. À vérifier dans ces captures : la rangée du bas (IA, Par date, Filtres, Doublons, Apport ou prélèvement privé, Archives) est intacte, et
   la suggestion IA suit la plage.

LEÇON PROPOSÉE : un panel de variantes sur une base imposée se mesure aussi sur les états après (`controle-panel.mjs` sur `*-apres.png`) :
au repos, une ressemblance haute est voulue et ne dit rien de la diversité.
