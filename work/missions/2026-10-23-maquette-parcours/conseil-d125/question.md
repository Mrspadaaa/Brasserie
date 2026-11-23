# Conseil complet du 24.10 — cadrer le lot D125 (les vues dont il n'est pas convaincu) et Substituer

Dossier unique du conseil (skill `conseil`). Les regards le lisent ; ils n'ouvrent une source que pour vérifier un point.

## Question cadrée

Le brasseur, 24.10 matin, sur la maquette jouable du 24.10 (construction 5345f6ad), mot pour mot :
1. « Ça a bien avancé mais le rail par exemple à perdu en fonctionnalités et certaines de mes choix ont été perdue » (D124).
2. « J'avais mis des commentaires, j'ai la nette impression que ils ont pas tous été pris en compte aussi » (D125).
3. « Il faudra aussi refaire des mini maquettes fils de fer sur les vue dont je suis pas convaincu » (D125).
4. « Utilise les bons outils pour la création. Le conseil et la chaleur notamment » ; « Pourquoi tu n'as pas utiliser de base
   les bon outils ? »

D124 est une régression : ses maquettes choisies sont rendues telles quelles par cinq reprises (étape et rail, Ma bière,
fiche, Suggérer, Comparer), chacune gardée par des contrôles qui échouent sur 5345f6ad. Ce n'est pas la question.

**La décision** : comment mener la création demandée en 3 (les fils de fer des vues dont il n'est pas convaincu), avec
les bons outils (entonnoir à trois chaleurs, critique, passes ; règle n° 1 ; L24) :
- **Q1 — Le périmètre et la forme.** Quelles vues entrent, et pour chacune, quelle forme : l'entonnoir complet (48 v0
  au moins en 6 séries, trois chaleurs dont 30 % de chaudes, une série Fable créative et une série libre, tri du critique,
  5 candidates, greffes, passes 2 et 3), ou un jeu court de 2 à 3 mini maquettes ? Un lot par vue, ou un lot commun ?
- **Q2 — Substituer.** Que faire de son choix du 19.10 (« Substitution, ça serait plus du u4 ») face à la « porte » du
  conseil du 22.10 et au registre qui marque l'écran « ouvert » ?
- **Q3 — L'ordre.** Les fils de fer partent-ils pendant les reprises D124 (en parallèle) ou après, et sur quelle base
  (5345f6ad, ou la version rendue) ?
- **Q4 — L'imprécis.** Deux fils du 19.10 disent « revoir cette partie là » et « refaire des mini maquette pour cette
  partie » sans dire laquelle ; « très dur à comprendre ces graph » n'a jamais eu de réponse sur le graphe en cause.
  Comment les traiter sans question bloquante (L24) ?

**Type de décision** : Q1, Q3, Q4 déléguées (cadrage d'un lot, réversible ; le conseil tranche, le pilote applique).
Q2 touche un choix du brasseur : le conseil dit comment le respecter (règle n° 1), il ne choisit pas à sa place.

## Les vues candidates (relevé de ses 56 commentaires, voie p22, `work/refonte-frontend/v4/choix/commentaires/vues-a-revoir.md`)

| Vue | Ses mots | Aujourd'hui | Déjà vu |
|---|---|---|---|
| Dryhopper « Quand ajouter Idaho 7 ? » | « Ajouter que cette vue là est à revoir, j'aime bien mais il y a des améliorations à faire » (23.10) ; ticket #146 | a1 (y1b affiné), écran **ouvert** au registre (a1, b4, d8, e5, g1) | y1b « meilleur » (20.10) ; passe 3 a1, b4, d8, e5, g1 (23.10) ; 56 v0 « vraiment moins quali » (23.10) ; manques connus : arôme interpolé entre moments simulés, contour chaleur ou CO₂, courbe de levure |
| Fiche, la liste des familles | « Mettre le radargraph avant, cette vue est vraiment pas terribles. À revoir... » (23.10) | g1, radar d'abord (fait, D115) | aucune variante de la liste ; défauts vus : « · nommé en premier » répété, mots anglais (« woody, resinous », « black currant ») |
| Comparer, pastille « ~ simulé » | « ????? » (24.10) | r6a ; le sens n'est que dans un `title` invisible au doigt (D122) | aucune |
| Entrée de l'analyse (étape) | « Seul bouton qui ouvre vraiment l'analyse. Peut, être amélioré » (23.10) | version A | A, B, C en mini maquettes le 24.10 (artefact 6V21JEc5CqsjpLWrp184be), sa réponse attendue |
| Les graphes (barres, absolu, radar ; petits traits de Suggérer) | « très dur à comprendre ces graph » (19.10) ; « Un peu dur à comprendre ce système de petit bar » (23.10) | barres l5b, radars m4, h4, r2 ; traits lus au toucher (D110, fait) | m4 et h4 choisis ; « lequel te bloque ? » jamais répondu |
| Levure | — (écran ouvert : « étape de Dryhopper » ou outil propre a2b) | étape de Dryhopper, provisoire | carte des outils 22.10 ; a2b « interessant mais peut être pas en main. voir ce que la levure change reset vraiment interessant » (20.10) |
| Substituer | « Substitution, ça serait plus du u4 » (19.10) ; « Ajouter, vue -> substituer à faire dans le git » (23.10, #145) | la « porte » vers Comparer, provisoire ; registre « ouvert » | u1 à u4 (lot 11, 19.10) ; carte des outils 22.10 |

## Extraits utiles, mot pour mot

- Règle n° 1, CLAUDE.md : « C'est critique que mes choix soient respectés. SI non, rien n'a de valeur. » (23.10). « Sa maquette
  choisie est la base de l'écran, reprise telle quelle ; jamais une carte ni une règle à sa place. […] Rien n'y vient d'un écran
  dont le choix est ouvert (D123). Un choix qu'on lui demande se montre en mini maquettes, dans un artefact neuf, jamais en mots
  seuls (24.10). »
- Son message du 24.10 (SPEC § 1) : « Il me faut des mini maquettes avec un nouvel artefacts comme pour les mini maquettes côté à
  côté.... Pour les autres gros changement aussi au non je peux pas choisir. Met ca dans tes règles aussi ».
- L'entonnoir, `.claude/skills/voies/references/entonnoir.md` : « 48 au moins (60 visés) en 6 séries, dans trois chaleurs, la
  baseline toujours suivie » ; « une variante froide reprend les idées déjà retenues […] tiède suit une forme imposée par
  l'approche de la série ; chaude a une forme libre » ; deux contrepoids : « une série créative à fond en Fable (z) » et « une
  série libre, au brief minimal (u) » ; tri : « ## Classement, ## Candidates, ## Greffes » ; passes jusqu'au satisfaisant, quatre
  au plus ; « Chaque passe est publiée dans un artefact neuf ». Pourquoi : lot 21 (44 v0, puis 5 améliorées) « vraiment plus
  qualitatif » que le lot 22 (12 variantes) ; M14 : le 23.10, 56 concepts « minimalistes » de Dryhopper « vraiment moins quali »
  (pages à moitié vides, même squelette) ; « minimaliste veut dire une seule idée, pas un écran vide ».
- L24 (LECONS) : « chaque choix ouvert devient un axe de variantes du lot suivant ; on lui montre, il choisit. »
- L10 : « définir chaque outil par le seul facteur qui y varie, afficher les autres sur une ligne de contexte ».
- Conseil du 22.10, carte des outils (`cerveau/decisions/2026-10-22-carte-outils-houblons.md`) : « Comparer […] Entrée « Je n'ai
  pas X » (u4) : X épinglé en colonne 1. » ; « Dryhopper : « Quand l'ajouter ? » C'est y1b sans sélecteur de houblon, sans
  second houblon et sans levure. Varie : le moment, par 5′. » ; « Pont : vers Levure. »
- Son retour sur le lot 21 (20.10) : « y1b est de mon point de vue semble meilleur » ; « j'aime bien aussi la y3 même si la
  molette prends trop de place, mais la panel osu j'aime assez » ; « La x3b est aussi interessant mais dur à lire. mais ça peut
  être interessant de l'utiliser jsute pour de la comparaison entre ma bière de base -> 1 dry hop, 2 dry hop: levure » ;
  « aussi problème global, on a plusieur confusion entre timing, comparaison, houbons side by side, on aurais suggestions,
  comparer, substituer, dryhopper ect ect.. il faudrait voir ce que l'on peut faire. »
- Sur le picto « épicé » (23.10), le panel trop sage : « pas vraiment diversifié, pas de prise de risque et trop focus sur mes
  exemple ».

## Contexte chiffré

- Relevé de ses 56 commentaires (p22) : 42 faits, 6 promis non faits, 4 perdus, 2 attendent son choix, 1 caduc, 1 contrôle
  sans correction. Les artefacts du 23 et du 24.10 sont sur un autre compte que la session pilote : rien n'est lu après 07 h 53
  le 24.10.
- D124 (p20, p21a, p21b) : rail de l'étape, 18 fonctions sur 39 perdues ; étape, Ma bière, fiche : 10 états absents, 26
  différents sur 50 ; Suggérer 10 écarts sur 18 ; Comparer 6 sur 19 ; acquis 8 sur 26. Contrôles écrits : controle-fonctions-rail
  (base 37/37, 5345f6ad 21/37), controle-geste-etape --froid, controle-etats (en cours).
- Reprises D124 prêtes (concepteur Opus, puis critique Fable) : r1 étape et rail, r2 Ma bière, r3 fiche, r4 Suggérer, r5 Comparer.
  Elles écrivent dans `prototypes/houblons-v4/parcours/src/ecrans/<écran>/**`.
- Budget : forfait Max ; semaine à 2 %, fenêtre de 5 h à 5 % (24.10, 9 h). Un lot du lot 21 : 10 agents de série, un critique.
- Moteur : `simulerCas` 1,4 ms léger, 4 à 6 ms complet, en direct dans le navigateur (`cerveau/metier/cout-calcul-moteur.md`).

## Contraintes
Téléphone 390 px au doigt ; honnêteté des données (simulé dit « ~ », inconnu ≠ 0) ; thème blanc de ses maquettes (D106) ; peu
de mots (80 au premier écran) ; rien d'un écran au choix ouvert dans la maquette ; une version, un artefact neuf ; aucun code de
l'app (porte B fermée) ; pas de question bloquante au brasseur.

## Captures (4)
- `work/refonte-frontend/v4/choix/commentaires/captures/p22-dryhopper-repos.png` — Dryhopper a1 dans la maquette 24.10
- `work/refonte-frontend/v4/choix/commentaires/captures/p22-fiche-cascade-liste.png` — la liste de la fiche
- `work/refonte-frontend/v4/choix/commentaires/captures/p22-comparer-simule-touche.png` — Comparer, « ~ simulé » touché
- `work/refonte-frontend/v4/choix/commentaires/captures/p22-substituer-repos.png` — Substituer (la porte) aujourd'hui

## Sources (à ouvrir seulement pour vérifier)
`work/refonte-frontend/v4/SPEC-BRASSEUR.md` (§ 0 ; § 1 fin) ; `work/refonte-frontend/v4/choix/ecrans.json` ;
`work/refonte-frontend/v4/choix/commentaires/fils-2026-10-24.json` ; `cerveau/decisions/2026-10-22-carte-outils-houblons.md` ;
`.claude/skills/voies/references/entonnoir.md` ; `cerveau/produit/acquis-valides.md` ;
`work/refonte-frontend/v4/ecran-1/fils21-choisir/critique/PORTRAIT.md` (Brasseur) ;
`work/missions/2026-10-23-maquette-parcours/MISSION.md` (Décisions, « D124 »).
