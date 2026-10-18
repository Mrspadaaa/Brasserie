# Décisions — refonte frontend houblons

Décisions numérotées, datées, avec leur raison. Une décision réversible se
corrige par une nouvelle entrée, jamais par réécriture.

## D1 — Branche et arbre (17.10.2026, 22:15)

Branche locale `claude/refonte-frontend-specs` créée depuis `origin/main`
(`c8f4c3ae`) dans l'arbre W. `.codex/hooks.json`,
`source4-portable-bundle-manifest-01.json` et `functions/.env` restent hors de
tout commit. Pas de push, PR ni fusion sans accord humain.

## D2 — Langue des livrables (17.10.2026)

Choix humain au lancement : anglais ASD-STE100 pour l'architecture et les specs.
Les livrables `docs/besoins/` restent en français : ils citent le brasseur mot
pour mot et servent sa relecture à la porte A. Les specs (phase 6) citent la
question de la banque par son identifiant et donnent sa traduction.
Raison : traduire les citations ferait perdre le besoin en mots du brasseur.

## D3 — Écritures GitHub au fil de l'eau (17.10.2026)

Demande humaine dans cette session : « Met à jour au fur et à mesure, de même
que les issues git, créé, supprimer, update ». Création, mise à jour et
fermeture d'issues sont autorisées sans nouvelle question. « Supprimer » devient
« fermer avec la raison et un lien » : le prompt interdit la suppression d'issue.
Chaque écriture GitHub va au journal du registre.

## D4 — Modèle des extracteurs (17.10.2026)

Demande humaine : « Utilise hiku 5.5 Max pour t'aider ». Les extractions
volumineuses passent par Haiku 5.5 en effort `max`, 3 agents au plus.
Opus relit et vérifie leurs sorties par script (citations mot pour mot).

## D5 — Périmètre « message humain » (17.10.2026)

Retenu : sessions Codex Desktop interactives (`source = vscode`, y compris les
fils créés par un agent où l'humain a écrit ensuite), actives et archivées ;
sessions Claude `claude-desktop` et `cli`, hors sous-agents, méta, résultats
d'outils et messages inter-sessions. Exclu : `sdk-cli` (briefs d'agents),
`exec`, sous-agents, gardiens, réveils automatiques, délégations.
La session courante est exclue : son prompt (`prompt-session.md`) est une
source humaine directe. Résultat : 759 messages, 380 k caractères, du 03.09
au 17.10.2026. Script : `scratchpad/extract/extract-human.mjs`.

## D6 — Florilège de questions houblons sans original (17.10.2026)

Le message d'origine (Saaz/Styrian gold, Nugget, cryo, pastry stout, etc.)
n'existe dans aucun journal Codex ni Claude sur disque : ni dans les fichiers
`jsonl`, ni comme `userMessage` dans `~/.codex/thread_history_1.sqlite`. Sa
première trace est la lecture de `demandes-utilisateur.md` par un agent, le
28.09 à 17:03. Source retenue : cette transcription d'agent (« orthographe
conservée autant que possible »), marquée « transcrit par agent ». Elle est
corroborée par le prompt humain du 17.10. Raison : c'est la meilleure source
disponible ; la marquer évite de la présenter comme une citation vérifiée.

## D8 — Tout reprendre côté frontend houblons (17.10.2026, 22:50)

Mots de l'humain, après la mesure de l'étape Houblons actuelle : « Non mais il
va falloir tout reprendre de tout manière... ». V5.5 n'est pas réparée sur
place (piste B de #115 écartée par l'humain). Le contrôle « un clic, sans
défilement » devient le critère d'acceptation de la refonte ; l'app actuelle
sert de témoin négatif (elle doit faire échouer le contrôle). Les calculs, données
et Functions utiles sont triés en phase 5, avec preuve. Aucun code de l'app
avant la porte B.

## D9 — Critère « comparer en 3 touchers » à préciser (17.10.2026)

Le critère « Comparer 2 à 4 houblons demande 3 touchers au plus » vient du
prompt de session, rédigé par un agent à la demande de l'humain. L'humain a dit :
« pouvoir en comparé 2,3,4 facilement ». Règle de comptage retenue par défaut :
depuis la liste classée, sélection comprise, 3 touchers pour 2 houblons, et
1 toucher de plus par houblon ajouté. Question posée à la porte A.

## D10 — D9 annulée : le critère du brief reste tel quel (17.10.2026, 22:55)

Rappel de l'humain : « Tu as déjà oublié le brief ? ». D9 traitait le § 6 du
prompt comme un texte d'agent et assouplissait son critère. Erreur : le prompt
est le brief de l'humain et il prime. Critère maintenu mot pour mot : « Comparer
2 à 4 houblons demande 3 touchers au plus, avec une lecture côte à côte nette à
390 ». C'est une contrainte de conception à tenir, pas une règle de comptage à
négocier. Ordre des phases maintenu : les garde-fous viennent en phase 4, après
la porte A ; la phase 1 livre seulement corpus, banque et parcours.

## D11 — Fin de la phase 1 dans cette session, phase 2 en session neuve (17.10.2026, 22:58)

Le contexte atteint 540 k, au-delà du seuil de 450 k du brief. La banque et les
parcours dépendent de l'inventaire déjà chargé (corpus, données, code, mesure) :
les rédiger ici évite une relecture complète. Le registre est mis à jour pour la
reprise ; une session neuve est proposée pour la phase 2.

## D12 — Fils de fer ultra basiques avant la porte A (17.10.2026, 23:25)

Question de l'humain : « Est-ce que il faudrait faire des maquettes ultra basic
pour valider les concept? Des visuel, diagram ? MOC ou autre ? ». Réponse : oui.
Des fils de fer basse fidélité (boîtes grises, vrais mots, vrai stock) des
4 gestes à 390 × 844, plus un schéma du parcours (touchers, visible par défaut /
à la demande), passent avant la porte A, après la matrice de la phase 2.
Chaque élément renvoie à une question de la banque et à une règle U1-U7.
Une ou deux directions au plus. Page privée cliquable sur téléphone, avec une
tâche : « trouve ton meilleur houblon pour la stout ». Raison : valider l'usage
avant l'apparence ; c'est réversible et cela n'exige aucun code de l'app. La
phase 7 garde la haute fidélité et la critique indépendante.

## D13 — Autonomie jusqu'à la porte B (17.10.2026, 23:10)

Mots de l'humain après la compaction : « Je ne vais plus intervenir soit
autonome ». La porte A ne bloque plus : le résumé de 10 lignes va dans #119 et
dans le message de fin de tour ; ses corrections s'intègrent quand elles
arrivent. Les phases 4 à 8 avancent sans attendre. La porte B reste une porte :
rien n'entre dans l'app, et push, PR, fusion, déploiement et données réelles
attendent toujours l'accord humain. Les choix ouverts se tranchent par l'option
prudente et réversible, ou par une session arbitre (Opus ; Fable pour la
critique UX), puis vont dans ce journal.

## D14 — Poursuite dans cette session au-delà de 450 k (18.10.2026, 01:10)

Le contexte atteint 478 k après la phase 3. Le brief demande de proposer une
session neuve au-delà de 450 k. En phase 1 (D11), l'humain a répondu à cette
proposition par « Donne moi la cmd je le fais ici » et a compacté la session
plutôt que d'en ouvrir une autre ; il a ensuite demandé l'autonomie (D13).
Choix : continuer ici ; tenir le registre à jour à chaque phase pour qu'une
compaction automatique ne perde rien. Réversible : une session neuve peut
reprendre depuis la section « Reprise » du registre.

## D15 — Comparer 4 houblons choisis un à un (18.10.2026)

Le critère du brief (3 touchers au plus pour 2 à 4 houblons) est tenu tel quel
(D10) pour 2 ou 3 houblons choisis, et pour les 4 premiers du classement
(1 toucher). Pour 4 houblons choisis un à un, il faut au moins 4 touchers : un
par houblon à désigner. C'est une limite physique, signalée à la porte A, pas un
assouplissement. La conception cherchera un raccourci (proposition de
comparaison d'emblée) sans tricher sur le comptage.

## D16 — Groupes au lieu d'un rang chiffré sans usage documenté (18.10.2026, 05:00)

Critique UX à l'aveugle (session Fable 5.1) : pour la stout, un rang chiffré tiré des
seuls descripteurs n'est pas crédible (Idaho 7 devant Target, East Kent Goldings 42e).
Choix : le rang chiffré n'apparaît que si le style a des usages documentés. Sinon
l'écran regroupe : en amertume, « assez en stock » puis « pas assez », triés par alpha ;
en arôme, « typique » (usage documenté, ou origine citée par le guide BJCP et
descripteurs dans le sens du style), « compatible », « hors style ». Une ligne dit
« classement estimé ». Spec F1 mise à jour. Réversible dès qu'une source d'usages par
style existe (#127).

## D17 — Porte B refusée : prototype v2 rejeté (18.10.2026)

Mots du brasseur après essai : « Ça correspond pas du tout à une UX UI propre... C'est
pire que les alternatives » (lien vers l'outil de comparaison de Beer Maverick).
Constat Opus : le prototype tenait tous ses contrôles (un toucher, U1/U4/U5/U6,
budgets) et la critique Fable ; il échoue sur ce que le brasseur juge : la propreté
visuelle et la comparaison face à la référence qu'il avait nommée (C068). Le
prototype n'a aucun graphique, alors que les maquettes V5/V5.5 qu'il trouvait
meilleures en avaient (radar, barres). C'est la cause racine de la phase 3 répétée :
les contrôles ont validé un substitut (gestes, densité) ; la comparaison visuelle à
la concurrence (H6) n'a pas été faite, parce que Beer Maverick bloque les robots et
que je n'ai pas demandé l'aide du brasseur. Suite : étudier la référence avec lui
(son Chrome ou ses captures), proposer une direction visuelle à valider avant tout
nouveau prototype. Rien n'entre dans l'app.

## D18 — Refaire le prototype dans une session neuve (18.10.2026)

Mots du brasseur : « Oui... Comment c'est possible de faire qqch d'aussi mauvais ? Ça
répond à peine à une des 30 question. Ça suit aucun logique UX UI .. C'est
catastrophique. Lance une fresh session pour refaire qqch de correct. Je vais plus
intervenir jusqu'à la nouvelle version. Utilise des sous session notamment fable pour
des reviews frontend de composants ». Le « Oui » répond à « Puis-je étudier Beer
Maverick dans ton Chrome, en lecture seule ? ». Session neuve lancée, branche partie
de `claude/refonte-frontend-specs`, avec un brief qui impose : réponses réelles aux
30 questions à l'écran, logique UX/UI explicite, comparaison visuelle à Beer Maverick
comme test de réussite, revues Fable par composant, à l'aveugle.

## D19 — Arrêt de la v3 ; exigences perdues retrouvées (18.10.2026, 10:00)

Mots du brasseur : « on doit pas non plus perde le modèle de calcul de la 5.5 ces
comparatif doivent nous aider: par exemple: ma stout est trop résineuses, je la veux plus
floral. La moteur nous propose plusieurs houblons et on peut ensuite comparé. » ; « Avoir
une vue d'ensemble des houblons pour le style ATTENTION ! … Les échelles doivent être
revu en fonction du style … J'avais déjà fait cette demande... » ; « J'ai aussi
l'impression que on a pas vraiment encore les bons outils, leviers, skills, info sur le UX
UI, si on doit comparé avec qqch de déjà fait pour s'assurer que on fait bien c'est que il
y a un vrai problème ».

Constat vérifié : la demande existe dans le brief du 01.10
(`houblons-v5-realisation-2026-09-29/input-carte-21/01-brief-utilisateur.md`, l. 7 et 41),
avec la carte Territoire qu'il avait jugée « une sacrée dinguerie » et la bascule Barres /
Radar (« exigence acquise »). La phase 1 l'a perdue : D5 excluait les briefs d'agents
(`sdk-cli`), et ses paroles relayées par ces briefs ne sont pas entrées au corpus. La v2
et la v3 ont donc été conçues sans ses propres références, puis jugées contre Beer
Maverick faute de critère à nous.

Choix (réversible) : arrêter les retouches de la v3 (l'agent commite et mesure l'état) ;
inventorier les exigences perdues dans l'archive ; écrire un brief v4 qui part du moteur
(objectif → voies proposées → comparaison) et de la carte, avec des échelles relatives au
style marquées comme hypothèse à valider ; utiliser le skill impeccable (`shape` avant le
code, `critique` après), jamais utilisé en v2 ni en v3. Les critères deviennent les
scénarios du brasseur ; Beer Maverick ne sert que de grammaire de graphique. Correction :
la recommandation « texte à 16 px » tirée de Beer Maverick est retirée (décision du
brasseur sur la densité, DESIGN.md).

## D20 — Phase maquette allégée, tournois, trois versions finales (18.10.2026)

Mots du brasseur, dans l'ordre :

1. « Construis direct une fois un plan sain avec les bon outil, skill et que l'ux UI soit
   au top niveau qualité. »
2. « Et en place une vraie méthodologie de travail de conception frontend, avec des vrai
   outils. »
3. « à chaque mini étape ajoute la création de mini Proto 5,10,15,20 le nombre qu'il en
   faut. Ensuite jette les pire et consolide les meilleurs […] récompense à fond la
   créativité, disruption, l'ux. »
4. « Playwright ne me semble pas utile pour la conception […] c'est pour le moment juste
   des maquettes […] utilise les outils adaptés à ça sans pour autant rendre le
   processus plus compliquées. »
5. « me faire 3 version à la fin plutôt qu'une. »

Choix :

- La méthode `docs/qualite/methode-conception-frontend.md` sépare deux phases : la phase
  maquette (maintenant) et la phase intégration (après son accord).
- Storybook, Playwright, axe-core et la page React sont retirés de la phase maquette. Je
  les avais ajoutés à tort : j'avais traité une maquette comme une construction de
  production.
- À chaque petite étape, M1 à M5 : un tournoi de mini-maquettes, un jury Fable à
  l'aveugle, puis une consolidation qui nomme ses greffes.
- À la fin, trois maquettes aux partis pris différents ; le brasseur choisit.
- Registre `v4/GATES.md` révisé en conséquence (G0 à G10).

## D21 — Pack v4 : classement qui reste au style, S2 en lager tchèque premium (18.10.2026)

Constat à la relecture du pack de la tranche A (commit `1057939b`) :

- En S1 (« ma stout est trop résineuse, je la veux plus florale »), le classement plaçait
  Motueka et Citra cryo en tête. Ils ajoutent agrumes et tropical, familles neutres de la
  stout, bande 0–30. Golding, East Kent Goldings et Celeia venaient en dernier.
- S2 visait la 3A (Czech Pale Lager), où le floral est neutre ; la question « lequel est
  le plus floral » y perd son sens.

Choix (pilote, réversible) :

- Le classement v4 ajoute un critère « reste au style » : un effet de bord qui sort d'une
  bande compte en crans du style. Ordre : pas de conflit, débordement de style, distance
  dirigée, stock. Les égalités restent visibles.
- S2 passe à la 3B (Czech Premium Pale Lager), qui attend du floral (33–68).
- Le modèle de calcul V5.5 (plages, fiches, IBU) reste intact ; seul le classement v4
  change. C'est la thèse « lu au style » appliquée au choix des voies.

Limites du modèle V5.5, à montrer dans les maquettes plutôt qu'à cacher : il situe mal
la bière (plages de 0 à 45–55), distingue surtout « cité » ou « non cité » pour un
houblon, et aucune fiche ne cite Nugget comme résineux, donc aucune voie ne peut établir
une baisse de la résine en S1.

## D22 — Relance obligatoire et température de création (18.10.2026)

Le brasseur : « il faut relancer un batch de mini maquette si c'est pas concluant » et
« modifier la "température" des paramètres de création ».

- Relance obligatoire si aucun finaliste n'atteint 7,0 (Territoire à la calibration) ou
  si un défaut commun reste sans solution chez les finalistes. Une relance par étape.
- La température d'échantillonnage des sous-agents n'est pas réglable depuis le pilote :
  elle est réglée par la consigne (froid : affiner les finalistes ; tiède : forme
  imposée ; chaud : aucune forme, liste de lignes interdite).
- Répartition par lot fixée par le brasseur : « 4 tiède, 5 chaude, 2 froide » (11).
- M1 : premier lot concluant en note (p07 et p09 à 8,1), pas sur le défaut (mur des
  9 familles neutres). Relance p11 à p23 : 6 tièdes déjà lancés avant sa consigne
  (gardés), complétés à 5 chauds (p17, p18, p21, p22, p23) et 2 froids (p19, p20).

## D23 — Pause des tournois, recherche des causes (18.10.2026)

Le brasseur, sur les 23 mini-maquettes de M1 : « il y a toujours énormément d'information
pour rien, beaucoup de text inutile qui ne devrait pas être là en premier plan. Une UI ux
toujours pas très moderne », puis : « On dirait des écrans de central nucléaire ou cockpit
d'avion. […] Ça n'utilise pas les bon outil UX, ni les bonnes représentation UI. On met en
pause et il faut trouver d'où vient de problème, faire une recherche approfondie sur
comment mettre en place un workflow qui intègre ça et comment utiliser les bon pratique
frontend actuel ».

Mesure (`tournoi/outils/mots-premier-ecran.mjs`) : 166 à 383 mots visibles au premier
écran à 390 px, pour les 23.

Choix :

- Tournois en pause. Lots 1 et 2 de M1 archivés dans `M1/_lots-1-2/` ; le jury du lot 2
  arrêté avant son verdict. Le brief du lot 3 (budget de 60 mots, premier et second plan,
  normes actuelles) est écrit mais non lancé : il attend la recherche.
- Recherche en quatre volets, rapports dans `v4/recherche/` : A causes internes (Fable),
  B pratiques UI actuelles (Opus), C workflow de conception avec IA (Opus), D profils de
  goût grand public (Sonnet). Synthèse et nouvelle méthode par le pilote ensuite.
- Sa définition de la densité, qui fait référence : « Il faut que ce soit dense sur
  téléphone car je veux voir un Max d'info au même endroit mais ça doit pas être
  surchargé, et surtout on doit voir que en premier plan les informations réellement
  utilise. Ensuite on peut trouver plus d'infos avec des raccords, renvoie, replis ou
  autre. » Transmise aux recherches A, B et C.
- Hypothèses du pilote sur sa propre part : consignes qui mettaient tout au premier plan,
  vérité qui punissait l'omission et pas le bavardage, jury qui récompensait « l'honnêteté
  écrite », formes imposées en objets anciens, premier écran surchargé dans le contrat.

## D24 — Méthode v2, deux régimes d'écran, documents alignés (18.10.2026)

Le brasseur : « Met tout ça en place » ; « L'app a une identité visuelle actuel mais je
suis ok de changer ça au ça fait sens.. et aide le processus » ; coup d'œil accepté :
« ok ping moi quand cela est bon ».

Fondé sur les rapports A (causes) et C (workflow), B (pratiques UI) :

- `docs/qualite/methode-conception-frontend.md` v2 : prioriser en trois plans avant de
  dessiner, références réelles, atelier de primitives, fils de fer gris, coup d'œil du
  brasseur, tranche verticale, trois versions ; jury par paires dans les deux ordres,
  après des contrôles automatiques éliminatoires (60 mots au premier écran).
- Maquettes haute fidélité dans `prototypes/` avec les composants, jetons et moteur de
  l'app, sans changer son `package.json` (remplace le principe « une maquette reste une
  maquette » de la v1 : la version choisie se déplace au lieu d'être réécrite).
- Températures gardées (D22) : tiède = parti de structure imposé, plus de métaphore
  d'objet ; chaud = libre ; froid = idées retenues.
- DESIGN.md : description reformulée et section « Deux régimes : chrome compact, lecture
  claire » (trois plans, n'étiqueter que l'exception, trois tailles au plus, une couleur
  d'alerte, pas de légende au premier plan, cibles et contraste).
- PRODUCT.md : « compacter les données autant que possible » remplacé par sa définition
  du 18.10, mot pour mot.
- `.claude/rules/affinee-frontend.md` : règle principale réécrite (« Montrer d'abord
  l'utile, replier le reste, compacter le chrome »).
- `SPEC-BRASSEUR.md` : document unique de ses demandes, 46 citations vérifiées
  (`v4/outils/check-spec.mjs`, témoin négatif en échec).
- Outils : `capture.mjs` produit le coup d'œil `pNN-oeil.png` (40 %) ;
  `mots-premier-ecran.mjs`.
- Non retenu : Vaul (non maintenu, déjà refusé par PRODUCT.md) ; Storybook et
  Playwright restent hors de la phase maquette.

## D25 — Données d'arôme : constats de la recherche E, décisions en attente (18.10.2026)

Rapport `v4/recherche/E-donnees-houblon.md` (31 sources) :

- Le flou des plages 0–55 vient du moteur V5.5 (famille non citée = domaine 0–100), pas
  d'un manque de données : le dépôt a l'huile totale pour 318 variétés, myrcène, humulène
  et caryophyllène pour 260, linalol pour 77, jamais convertis.
- Trou d'import : la boutique Hopsteiner US décrit Nugget « woody and resiny », Yakima Chief
  « woody ». La résine de S1 devient explicable et une voie « diminuer ou remplacer Nugget »
  devient possible.
- Après 60′ d'ébullition le myrcène a disparu : le boisé vient plutôt de l'oxydation de
  l'humulène et du caryophyllène ; l'amertume (60 IBU, haut de bande), le torréfié et
  l'oxydation sont d'autres pistes.
- Aucun modèle publié ne prédit l'intensité des familles depuis une recette avec une
  précision mesurée (meilleur R² moyen 0,21).

Pistes retenues pour la tranche verticale (réversibles, dans `prototypes/` seulement) :
partir de la dégustation du brasseur pour situer la bière (`HopTasting.axes[].perceived`
existe), trois niveaux de citation (non décrit, cité, marqué) avec le compte des fiches,
pistes hors houblon sans chiffres, jamais de plage 0–100 affichée.

**En attente du brasseur** : importer en masse des fiches sans licence ouverte (Yakima
Chief, Hopsteiner, BarthHaas). D'ici là, seuls quelques faits cités sont relevés, comme le
dépôt le fait déjà.

## D26 — Clair ou sombre, défauts récurrents en contrôles (18.10.2026)

Recherche G (`v4/recherche/G-clair-sombre.md`) : en lumière forte, avec du petit texte et
en coup d'œil, le clair se lit mieux (Piepenbrock 2013–2014, Dobres 2016). Le « cockpit »
vient de l'empilement (teintes saturées, micro-texte, filets fins), pas de la polarité.
Grainfather, Brewfather et BeerSmith offrent les deux modes. Quatre références du
brasseur sur cinq sont claires.

Choix (réversible) : les versions haute fidélité de l'écran 1 se font en **clair par
défaut**, avec le « cave » comme thème sombre ; au moins une des trois versions reste
sombre. La migration de l'app entière (781 couleurs hex isolées, 12 couleurs de texte sur
13 sous 4,5:1 sur fond clair) se décide à la porte B, pas avant.

Le brasseur : « je te demande à chaque fois […] mais que au final on se retour toujours
pas les même problèmes ». Réponse : `v4/DEFAUTS-RECURRENTS.md` (12 défauts, ses mots, un
contrôle chacun, témoin négatif sur les versions rejetées : 13 échecs sur M1 p07 et p15,
8 sur les fils de fer p10 et p04) ; `tournoi/outils/controle-lot.mjs` ; rien ne lui est
montré sans `LOT OK`.

## D27 — Lot 3 : p2, p3 et le rail de p8 ; le stock discret (18.10.2026, soir)

Le brasseur, sur la planche des étapes du lot 3 : « P2,3,8 sont vraiment bien, la 8
seulement pour la manière dont ont voit les étapes d'houblon. » ; « La stock sont beaucoup
trop mis en avant surtout que dans l'app on voit dans le récap à la fin. Juste un petit
badge ou info très subtil suffit. » ; « Maintenant il faut aussi les radar graph et autres
écrans ».

Choix : les auteurs de p01, p04–p07, p10 et p11 sont arrêtés (pages conservées dans
`fils3/`) ; p02, p03 et p08 sont finies avec le nouveau contrôle D23 (stock : l'exception
seule, sans pastille pleine, ni achats ni filtre au premier écran ; D21 révisé, la liste
d'achats vit dans le récap de l'app) et toutes leurs pages mesurées (D4, D5, D14 bis, D19
bis). Ensuite : lui montrer toutes les vues de p2, p3 et p8, radars compris, puis
consolider (p3 + le meilleur de p2 + le rail de p8).

## D28 — Radars refaits sur bibliothèques, fiche à l'appui long, baseline gelée (18.10.2026, soir)

Le brasseur : « C'est toujours n'importe quoi les spidergraph Radar graph il faut faire
qqch.... » ; « Est-ce qu'il faudrait pas utiliser d'autres outils, framework, libraries pour
ces radar ? » ; « quand je fasse un appuie long, hover long super ordinateur, sur houblons, je
puisse voir sa fiche en détails » ; « on avait établi une Baseline, ça différent complètement ? »

Diagnostic : l'ordre des axes suivait le style (pas de lobe), 3 ou 4 séries en pointillés se
superposaient, les familles non situées cassaient les polygones, et la bière en crans faisait
de la zone un disque uniforme. Chaque auteur dessinait son SVG à la main. Les données d'arôme
continues du moteur sont inutilisables (492 valeurs sur 492 à « confiance faible, non situé ») ;
les citations des fiches (0–2) restent la donnée des houblons, comme les entiers 0–5 de Beer
Maverick, dont le radar reste lisible grâce au dessin.

Choix :
- contrat radar v2 contrôlé (D24 : roue des arômes, ≤ 2 séries par radar, petits multiples,
  silhouettes pleines, grand radar, libellés ≥ 11 px) ;
- bière, zone et voies en intensité absolue continue 0–3 (le moteur l'ajoute) ;
- lot 4 radars en concurrence de bibliothèques : Recharts (déjà dans l'app), Nivo, ECharts
  en SVG, plus des variantes libres ; installées hors de l'app (`scratchpad/libs-radar`) ;
- lot 4 fiche (D25) en parallèle ;
- baseline p03 gelée hors du composant (D26, `controle-baseline.mjs`) ;
- les 8 variantes écartées du lot 3 rangées dans `fils3/_ecartes/`, pour qu'aucune planche
  ne les remontre.

## D29 — Base consolidée : p2, la levure de p8, le moment qu'on glisse (18.10.2026, soir)

Le brasseur, sur la page partagée (capture de p2, flèche de 60′ à 10′) : « J'aime beaucoup
l'intégration de la levure directement dans la p8 mais la p2 a un meilleur visuel, j'aimerais
aussi pouvoir une fois mon houblons sélectionner pouvoir glisser comme un slider le moment de
l'ajout. »

Choix : la base de l'étape devient p2 (visuel), avec la levure comme étape du rail entre le
whirlpool et le dry hop en fermentation (p8), et le moment de chaque ajout glissable le long du
rail, au doigt comme à la souris, IBU en direct depuis le pack. Contrôles D27 et D28
(`controle-rail.mjs`, `--rail`) prouvés dans les deux sens : page témoin à poignée inerte et
levure mal placée → échec ; page qui fonctionne → RAIL OK. Sortie : `ecran-1/base/consolide/`.
Le lot 4 (radars, fiche) garde la baseline p03 : ses composants se greffent ensuite sur la base.

## D30 — Ma bière : au style par défaut, absolu en bascule ; Suggestions et Comparer à refaire (18.10.2026, soir)

Le brasseur garde l'aperçu compact à 12 familles de p2 (« super car très compact et facile »),
juge le détail de p2 confus (« je sais pas comment bannir une contraintes ou réduire une
autre, il y a des truc jaune ?? »), préfère celui de p8, et rappelle l'échelle : « Tropicale
4/5 sur une ipa et 4/5 sur une Lager ça doit pas correspondre » ; « Reste sur une échelle par
style mais avoir en tout cas une vue qui affiche l'échelle en absolue ». Le moteur le confirme :
la bande tropicale vaut 0–30 pour la lager tchèque et 0–100 pour l'IPA ; en crans, les deux se
dessinent pareil.

Choix : « Ma bière et la cible » au style par défaut (crans, écart chiffré hors zone, jamais
écrasé au bord), avec une bascule vers une vue absolue commune 0–3 (`biere-absolu.html`) ;
gestes bannir, réduire, augmenter par famille ; plus de focus posé par script (le cadre jaune
de la vue web). Contrôles D31, D32, D33, prouvés dans les deux sens. Suggestions et Comparer :
« très mauvaise et […] pas terminé » ; d'accord : un lot dédié, pensé en brasseur, après la
base consolidée.

## D7 — Issue de suivi de la mission (17.10.2026)

Une issue GitHub suit la mission, liée à #115 et #116, et reçoit l'état de
chaque phase. L'épopée « Houblons pour le brasseur » vient en phase 5.
