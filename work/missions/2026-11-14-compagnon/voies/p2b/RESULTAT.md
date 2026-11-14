OK — p2b reprise : les 10 défauts de VERDICT-P2 corrigés, 12 cadres clair et cave

## Fichiers écrits (tous dans la voie)
- `p2b/build.mjs` : corrigé (script de reprise hors voie, dans le scratchpad), puis reconstruit `p2b/etat.html`.
- `p2b/p2b-clair.png`, `p2b/p2b-cave.png` : recapturés par `p2b/capture.mjs`.
- `p2b/NOTE.md` (ligne « Reprise après VERDICT-P2 »), `tests.txt`, ce fichier.

## Défauts du verdict, un par un
1. Absurdité métier : l'accueil, l'attente, l'erreur, le plafond, le zéro et l'urgent sont à J+1 (36 h). La DF 1,012 ne figure plus qu'au bureau (J+8 : « DF relevée à J+6 », frise, journal). Citra J+2 est « demain », non fait. La suggestion devient « Densité à J+4 : la levure a fini ? ». Le plafond et le zéro reprennent la réponse info de la question 1. Les fournisseurs sont à J+4. Le journal du bureau suit J+4 « Densité 1,020, passage à 20 °C », puis J+6 « DF 1,012 ».
2. La Blonde de garde est le Brassin 30 (accueil et conversations).
3. Bureau, pile coupée. Cause : la classe large `p2b-pile-l` portait le nom de la légende, qui est en `display:flex`. Renommée en `p2b-pile-lg` : la pile prend toute la largeur, au-dessus des totaux.
4. Bureau, vide : une frise du brassin de J+0 à J+12 y entre. Elle montre les contacts (Citra fait, Galaxy « purge ce soir », Mosaic 3 → 2 j proposé, le jour retiré hachuré), aujourd'hui J+8, et les mesures (pression à J+1, 1,020, DF 1,012, herbe coupée, goût à J+10).
5. « pH visé 5,3 » est retiré. À sa place : « Densité à J+4 », le prochain contrôle.
6. Erreur : un seul geste, le basculeur « Envoyer au retour du réseau ». « Reformuler » vient en second. « Envoyer maintenant » est retiré.
7. Erreur : le mode est masqué dans le champ pendant la lecture.
8. Conversations : l'en-tête dit « Compagnon · 4 conversations », et le décompte n'est plus donné qu'une fois. La rangée Stout tient sur deux lignes : « Arrêtée à « Calculer » », puis « Rien n'est compté ».
9. Réponse : la question est entière, sur deux lignes. La pile montre Mosaic 43 g « à venir », au trait. Elle n'est plus en vert tant que la case est décochée. La légende dit « 171 g · 9,0 g/L prévus » et « si coché : 163 g · 8,6 g/L ».
10. Attente : les temps sont des durées, 4 s, 37 s et 1 min 48 s, soit 2:29 au total. Ils sont placés sous un en-tête « Étape · durée ».
- Au passage : la pile est aussi ajoutée aux fournisseurs (« dose inchangée »), ce qui ramène leur vide de 123 à 75 px.

## Critères
- G1 `controle-serie.mjs … p2b --complet` : **SERIE OK**.
- G2 `verifier-page.mjs …/p2b/etat.html` : **PAGE OK** (1 image chargée, 390 px, sans erreur).
- Mesures `capture.mjs` : débord 0 dans les 12 cadres. Vide en bas ≤ 111 px (plafond 111, bureau 108). Aucun texte sous 12 px. Ni erreur ni appel réseau.

## Captures
- `work/missions/2026-11-14-compagnon/voies/p2b/p2b/p2b-clair.png`
- `work/missions/2026-11-14-compagnon/voies/p2b/p2b/p2b-cave.png`
- J'ai ouvert les 5 rangées finales (r1 à r5, bureau compris), en clair et en cave, avec deux tours de correction. Au premier tour, le libellé « Mosaic 43 · J+9 » était coupé à 390 px, et le trait d'aujourd'hui barrait « herbe coupée ». Les deux sont corrigés et revus.

Prédiction : « Là c'est juste : J+1, la levure travaille, le Citra c'est demain ; et au bureau je vois tout le brassin d'un coup. »

Défaut restant (non compté, doute du critique) : en cave, le primaire et les cases restent paille, comme le veut DESIGN.md.

DÉCISION À PRENDRE : aucune.
CONNAISSANCE : aucune.
LEÇON PROPOSÉE : un modificateur de taille ne doit pas reprendre le nom d'une sous-partie (`-l` pour large, et aussi pour légende). Une classe qui en heurte une autre casse la mise en page sans erreur. Nommer les variantes `-lg`, `-sm`, et les parties par un nom plein.
