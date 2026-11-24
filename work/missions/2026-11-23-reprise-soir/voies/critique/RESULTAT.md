OK — 17 problèmes, 6 bloquants

Version : index-CoXAhg_q.js (tour 28, aiTask à jour). L'onglet servait encore index-Bl2OF9G2.js : mis à jour par le service worker avant tout geste.
Chrome de débug 9222, mon onglet, 390 × 844, toucher, thème clair. Onglet fermé à la fin, Chrome laissé ouvert.
Carnets : 15 avant, 16 avec « ZZ TEST — tour 28 », 15 après suppression (cap/F3-carnets.png, identique à cap/02-carnets.png).
Événement « ZZ TEST — barre » créé, glissé, supprimé (Travaux de nouveau vide, cap/P-C2.png).
Donnée réelle touchée par un défaut (T28-1) : article landi rangé dans « Armoire de rangement malte ». Réparé tout de suite : article retiré, le carnet est revenu à « Idée · 3 sept. » sans article (cap/P-R.png).
Coût IA : 10 lectures, soit environ 0,15 CHF (plafond 0,30). Lignes ajoutées à work/missions/2026-11-23-carnet-en-ligne/ia-journal.jsonl.
Tests : sans objet (test d'écran). Registre : `node scripts/agents/controle-bugs.mjs` donne BUGS OK (voies/critique/bugs.log).

## Liens joués (captures ouvertes, planches avec les maquettes : cap/ref-debut-milieu.png, cap/ref-fin-echec.png)
- L1 galaxus KS240L : lu en 1 s. Début vu (forme v06-1 + v05-2). Fiche : libellés en français, Volume 242 l, aucun « Non publié ». Les valeurs restent en allemand. cap/P-L1.png, cap/L1-fiche.png
- L2 sios Citra : étape Milieu vue (6 sur 7, forme v03-2). Fiche propre. cap/P-L2.png, cap/P-L2f.png
- L3 hopfenmarkt Mosaic : classé au prix brut ; α perdu dans la grille. cap/P-L3.png
- L4 brouwland : « page bloquée, lue par Google » est dit. Replier donne une barre d'une ligne, plus compacte que v01. Quitter le carnet : la barre suit. Toucher la barre ouvre la fin dans un autre carnet. La fiche dit « photo non lue ». Gestes : × fermer, Déplacer, Retirer. cap/P-L4.png, cap/L4-rouvre.png, cap/P-L4g.png, cap/P-D.png
- L5 brewtools mort : carte d'échec avec Escalader, Autre lien, Compléter, Retirer (fusion de base et v03-5). Le message est faux. Escalader ne montre rien. Compléter range le lien mort. cap/P-L5.png, cap/P-L5esc.png, cap/P-L5c.png
- L6 landi, page rechargée pendant la lecture : « Lu pendant que l'app était fermée » est juste, mais l'article est rangé dans un autre carnet. cap/P-L6.png
- L7 gastro-held : étape Milieu avec deux « douteux », gestes « C'est le bon » (effet visible) et « Corriger » (ouvre la fiche). Le prix HT est dit. 12 photos. cap/P-L7.png, cap/P-L8.png
- L8 doublon galaxus : « Déjà dans ce carnet : rien de plus rangé », compte resté à 5, mais la page est relue. cap/P-L8b.png
- CALP-5 : non vérifiable, car glisser une barre de brassin écrit sur un vrai brassin. Sur l'événement ZZ, « S47 · 16 nov. · lâcher ici » se place à droite de la barre sans la couvrir. cap/P-C.png

## Registre
T25-8, T26-1, T26-2, T26-3, T26-4 et BL-7 sont corrigés en ligne au tour 28 (0a3472f7e), avec leur capture et leurs restes renvoyés vers T28. CALP-5 reste ouvert : non vérifiable. T28-1 à T28-17 sont versés.

## Combien et quels problèmes ? 17 (B 6, D 6, m 5)
1. **B** — Après un rechargement pendant la lecture, l'article landi est rangé dans le vrai carnet « Armoire de rangement malte » (passé à « À comparer ») et pas dans ZZ, qui affiche pourtant « Lu pendant que l'app était fermée ». Brasseur : « j'ai collé dans un carnet, ça atterrit dans un autre ». (T28-1)
2. **B** — La barre repliée, touchée depuis un autre carnet (Sol), y ouvre la carte de fin du lien ZZ, sans nom de carnet ni d'article, avec des boutons Compléter. Pas à sa place. (T28-2)
3. **B** — « Compléter » sur l'échec n'ouvre aucune saisie. Le lien mort devient un article « ? brewtools.com · lecture… », compté et déplaçable, et un bandeau faux reste affiché : « L'IA n'a pas répondu : rangé sur place ». (T28-3)
4. **B** — « Escalader IA plus forte » n'a aucun effet visible : seuls « 1 sur 6 » devient « 1 sur 7 » et 5 étapes deviennent 6. Pas d'attente, pas de résultat. (T28-4)
5. **D** — « le site n'existe plus » est faux : brewtools.com répond, seule la page manque (base-echec : « la page n'existe plus (erreur 404) »). (T28-5)
6. **B** — Les houblons sont classés au prix brut sans quantité : Mosaic 7,25 CHF (100 g) passe premier devant Citra 72,50 CHF (1 kg), soit le même prix au kilo. Valeur fausse. (T28-6)
7. **D** — gastro-held affiche « Non publié par le vendeur : Poids » sous « Poids net en kg 82 », et « – » dans la colonne Poids. (T28-7)
8. **B** — landi Schwerlastregal 180 × 160 × 60 : la fiche indique « Hauteur 6 cm ». Absurde pour une étagère. (T28-8)
9. **D** — Les étapes parlent en jargon et avec un point décimal : « 72.5 CHF (schema.org) », « microdata », « JSON-LD », « dont 2 du HTML ». La maquette v03-2 parle en prix. (T28-9)
10. **m** — La durée est fausse : la barre affiche « 6 s » puis « Lu · 3 s » ; pour le doublon, 5 s vécues donnent « lu en 1 s ». (T28-10)
11. **m** — Le compte passe à « 5 articles à comparer » dès le collage, avant toute lecture, puis retombe à 4 pour le lien mort. (T28-11)
12. **D** — Des libellés anglais restent : brouwland (Full volume, Height with extension legs…) et Mosaic (Total oil, Farnesene…). (T28-12)
13. **D** — Des valeurs allemandes et des points décimaux restent : « Kühlschrank ohne Gefrierfach », « Mehrzweckhopfen », « +2 °C bis +8 °C », « 143.50 cm », « 11.4% ». (T28-13)
14. **D** — Fiche houblon Mosaic : α 11.4 % est au milieu, après Farnesene et Caryophyllene, et « Total oil 0.8ml » n'a pas d'unité /100 g (penser-brasseur, L04). (T28-14)
15. **m** — « Rangé ici, à l'instant » s'affiche sur la liste des Carnets, alors que l'article n'est pas « ici ». (T28-15)
16. **m** — Calendrier : glisser la barre vers la droite l'a posée une semaine plus tôt (23 → 16 nov.), car la frise passe à 6 semaines au toucher. (T28-16)
17. **m** — Le doublon est relu en entier, avec un appel au serveur, avant « Déjà dans ce carnet ». (T28-17)

## Doutes (non comptés)
- À la création du carnet, une note « Tour 28 » apparaît : l'IA l'a tirée de la phrase du titre.
- Le classement et la colonne Poids mélangent un frigo, des houblons et une cuve : c'est l'effet du carnet ZZ mixte imposé par le dossier.
- « Corriger » sur « Contrôle douteux (port 7.9 / gratuit) » ouvre la fiche sans viser le port.
- Au premier Compléter, le bandeau « L'IA n'a pas répondu » venait peut-être de l'escalade, arrivée au même moment.
- Barre repliée : une ligne, plus compacte que v01-repliee. Ses compteurs « 3✓ 1– 4/6 » sont lisibles. Rien à redire, sinon le point 2.

LEÇON PROPOSÉE : un test de reprise (recharger pendant une lecture) se fait avec un carnet ZZ seul ouvert, et la liste des carnets réels est relue après chaque geste : au tour 28, la reprise a écrit dans un vrai carnet, et seule une relecture immédiate l'a vu.

RESULTAT critique : 17 problèmes (B 6, D 6, m 5) — captures work/missions/2026-11-23-reprise-soir/voies/critique/cap/ — BUGS OK
