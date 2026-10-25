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

## D31 — l5e : la grille de l5b gardée, quatre coupes pour tenir 70 mots (19.10.2026, soir)

Contexte : le brasseur a coché l5b tel quel (« Il est très très bien celui-ci aussi »). l5d prend
tous ses retours (α, usage en mot, légende, fiche) mais passe à une tuile par voie pour tenir les
70 mots : la page s'allonge et sa grille change. l5e garde les deux tuiles par rangée ; il est à
79 mots au premier écran.
Choix du pilote, sans question bloquante : les quatre coupes de l'auteur.
- Le second widget ne répète pas « 10 g 10′ ».
- « +1 » et « +2 » perdent le mot « cran », que la légende explique.
- Barres et Radar s'affichent en icônes seules, avec leur libellé accessible.
- « Comparer » perd le « (3) », puisque les trois pastilles du dock montrent le nombre.
La coupe des icônes est la plus risquée après « Les icône sont pas parlant du tout » : elle est
signalée sur la page, et réversible si les deux icônes ne lui parlent pas. l5d reste publié à
côté : c'est lui qui choisit.

## D32 — l5f : les coupes de D31 défaites sur l'avis du critique (19.10.2026, nuit)

Le critique, calibré sur les verdicts du brasseur (`fils21-choisir/critique/l5e.md`), a jugé l5e :
- Barres et Radar en icônes muettes : la plainte « Les icône sont pas parlant du tout » reviendrait ;
- les ronds de Comparer sont sans mot ;
- « +1 » est sans unité ;
- la grille se troue ;
- la piste du résineux n'a pas de trait noir.
Le brasseur a dit, entre-temps, « Soit pas trop contraignante pour les contrôles sur les v0 » : les
70 mots deviennent indicatifs. Choix du pilote : l5f rend les mots, répare la grille et met le trait
noir sur les trois pistes. l5e reste intact pour comparer. D31 est donc révisée : une icône que la
légende doit expliquer est un défaut, pas une économie.

## D33 — Le critique fait office de jury pour le lot 21 (20.10.2026, nuit)

Le brasseur a voulu un critique « qui pourrait être moi ». Calibré sur ses verdicts réels (test à
l'aveugle : 3,5 sur 4), il a joué un geste sur chacune des 41 variantes jugées, et sa synthèse
(`fils21-choisir/critique/SYNTHESE.md`) choisit déjà les cinq pour la diversité utile : y1, x3, v1,
s3, w3. Un jury de plus referait le même travail. Choix du pilote : la synthèse du critique tient lieu
de verdict de jury. JURY.md reste la grille de lecture. Les cinq passent en seconde passe chez leurs
auteurs (y1b, x3b, v1b, s3b, w3b), et trois relances ciblées partent : r3b, a2b et e4. MOTS se compte
hors données (`--sans-donnees`, 70 au plus), avec 110 au total comme cible indicative. Le brasseur voit
les 44 variantes et les cinq améliorées, et c'est lui qui choisit.

## D34 — Le lot D125 et Substituer, après le conseil complet (24.10.2026, matin)

Conseil complet (`cerveau/decisions/2026-10-24-lot-d125-vues.md`). Substituer : « Substitution, ça serait plus du u4 »
(19.10) est son choix ; le registre le marquait « ouvert » avec la porte du conseil du 22.10 en provisoire. Il passe à
« choisi u4 », avec ses mots, et u4 est rendu par une reprise (r6), comme les écrans de D124. Dryhopper : passe 4 sur
a1 (8 à 12 greffes en trois chaleurs), pas de nouveau panel v0. La liste de la fiche : le seul entonnoir complet, après
la reprise de la fiche (r3). La pastille « ~ simulé » : 3 mini maquettes, avec la reprise de Comparer (r5). Les graphes :
une planche où il désigne celui qui le bloque. Rien n'est publié avant la lecture de ses commentaires d'après 07 h 53
(autre compte : accès demandé à l'utilisateur) ; le critique est réétalonné sur les 56 fils avant le tri.
## D35 — Les décisions des voies d'audit D124, après avis croisé (24.10.2026, matin)

Avis croisé (Brasserie en Fable, Contradicteur en Opus ; `work/missions/2026-10-23-maquette-parcours/conseil-decisions-voies/`).
Fiche : les quatre boutons du pied de g1 reviennent, avec le titre « α 11–14 % » et les notes de Citra cryo ; la liste des
substituts sort du même calcul que u4. Dose : pas de 2 g, comme sa base ; le filtre du champ « Ajouter » porte sur tout le
catalogue (« souvent pas présent », D21). Végétal : placé seulement si une source le décrit, sinon « non situé » ; les mots
de sa maquette font foi (« double usage »). Suggérer et Comparer : tout ce que ses maquettes montraient revient, sauf ses
refus postérieurs (la règle « ‹ visée | visée › », D91) et le groupe « Changer de levure » (L10 ; Levure ouvert), qui passera
en variantes. Quantité : la base v4.10 et le stock en petit badge ; la mise à jour des tickets #122 et #123 attend l'accord
de l'utilisateur.
## D36 — Le conseil dans la création (24.10.2026, matin)

Sa demande, mot pour mot : « Faire intervenir le conseil aussi pour la partie création ». Après le tri de chaque panel D125
(liste de la fiche, Substituer) et sur la passe 4 de Dryhopper, un conseil rapide (six regards, le Brasseur en Fable, un
président en Opus) reçoit la synthèse du critique et les planches de captures ; il conteste le classement et fixe les cinq
candidates et leurs greffes, dont partent les passes 2. Le critique garde le tri et le jugement de chaque variante ; un
désaccord entre eux après une passe passe en avis croisé. Le brasseur voit tout le panel et choisit.
## D37 — Le critique après l'épreuve du 24.10 (24.10.2026)

Épreuve à l'aveugle sur 70 items (5 verdicts du 23 et du 24.10 ajoutés) : paires 89 %, classes 73 % ; la moitié A tombe à 67 % sur
les classes (seuil 70 %), et le critique est trop clément (il prédit « mitige » ou « aime » là où le brasseur rejette). Une
contamination légère : il a vu les réponses d'une passe précédente (pas la clé). Choix du pilote : le critique trie les panels
D125, mais son classement reste une proposition ; il penche vers « rejette » quand il hésite ; le conseil rapide (D36) conteste
son tri ; le brasseur voit tout le panel. Le portrait sera revu avec ses verdicts sur les panels.
## D38 — La passe 4 de Dryhopper avant de la montrer (24.10.2026)

Conseil rapide (`work/missions/2026-10-23-maquette-parcours/conseil-dh4/verdict.md`). En tête : p4a4, p4b2, p4a3, p4b3, p4a2
(trois chaleurs, cinq genres) ; derrière, sans rien cacher : p4b1, p4a6, p4a1, p4a5, p4b4, p4b5 et a1. Retouches avant de les
montrer, par les agents de leurs séries : la loupe hors de la figure, les rubans et boutons de jours d'a1 gardés, la bosse de
levure et la densité hachurées, les chevauchements supprimés ; pas de greffe croisée avant son choix. Noyau et Baies (pilote) :
l'avant est inconnu (les fiches de Nugget ne les décrivent pas), le gain d'Idaho 7 est connu : « ? → ~+21 » partout (D65).
## D39 — La construction commune après r7 (24.10.2026, après-midi)
Décideur : pilote, réversible. r7 rend BATTERIE OK 33/33 et ETATS 113/117 ; les quatre restes :
- `etat-acquis-radars-m4-h4` (« Radar: m4 h4 très bien ») : la grille m4 est rendue, mais relevée sur `biere-radar.html`, la
  même page déjà en Radar. L'acquis se joue désormais comme sa base l'ouvre, depuis les barres, par le toucher de « Radar » ;
  le bouton porte les deux jetons (`etat-biere-radar etat-acquis-radars-m4-h4`).
- `etat-acquis-y1b-brassin-au-doigt` : mots de y1b sur Dryhopper, écran au choix ouvert. Rien d'un écran au choix ouvert
  (D123) : `attend_choix: dryhopper`, compté à part par `controle-etats.mjs`, rejoué quand il aura choisi.
- `etat-etape-dose-plus` et `-moins` : délai de 180 s à quatre pages en parallèle seulement ; seuls, ils passent. Rejeu à
  machine calme avant de conclure.
- Les traits de la jauge de q2b (« en contour si la famille baisse, orangée hors du style », NOTE q2b) étaient annulés par
  une règle CSS placée plus bas (relevé de jc-levure) : choix perdu, rendu (deux classes par modificateur).
Signature : les « LEÇON PROPOSÉE » et « CONNAISSANCE » des voies triées par s1-lecons, appliquées par le pilote (M16 ; M11,
M12, M14 passés dans [[controles-mecanises]] pour tenir la charge ; trois notes neuves, sept complétées).

## D40 — Les écarts des critiques des reprises (24.10.2026, soir)
Décideur : pilote, réversible. Critiques r8a, r8b, r8c (Fable), 128 états en images : étape REJET, le reste ACCEPTÉ. Passe 3 de
r7 (`work/missions/2026-10-23-maquette-parcours/voies/r7-batterie/PASSE3.md`) :
- ajouts rapides : une recette qui a des houblons garde les propositions aromatiques de sa base (stock d'abord, 10 g à 10′),
  jamais des doses de compensation à 60′ ; recette vide à l'ouverture : sa page cas-k2 ; après « retirer » du dernier houblon,
  la lecture la plus proche de sa capture (REPRISE § 6) ;
- Végétal non situé pour Nugget (D35 appliqué) ; « Substituts » de la fiche du calcul de u4 (D35) ; « Pour égaler » par
  famille comme r6n2 ; survol à 1280 en fiche flottante ; ses mots (« Boisé et résineux trop marqué ») ;
- laissés, avec leur raison : fil d'étapes sans autre écran, Citra cryo « 1 seule fiche », nombres de Nelson Sauvin (L14),
  groupe « Changer de levure » (D35), « Sans Nugget › » (#145).
- D40 bis (pilote, après la passe 3 de r7) : le plafond de 80 mots au premier écran reste (SPEC § 3, « Dense mais pas
  surchargé ») ; les mots de r6a restent, les ajouts postérieurs passent à un toucher. La règle Végétal (D35) ne vise qu'une
  famille sans source : une famille apportée par la levure reste placée (cas-k2 : « 1 au style · 11 non situées »).

## D41 — Les mots au premier écran : modéré (24.10.2026, soir)
Décideur : le brasseur (« dépasse les 70 mots au premier écran c'est pas ultra grave. Il faut être modéré avec les mots »),
appliqué par le pilote : `mots-premier-ecran.mjs --modere` (alerte au-dessus du seuil, échec au-delà de 40 % de plus), dans
controle-commun. Les autres appels gardent leur seuil strict (aucun ne passe --modere) ; aucun critère n'attend un échec de mots
de controle-commun, donc l'assouplissement ne fait échouer aucune voie (pas de rejeu des 85 appels). Substituer à 118 mots :
au-delà même du modéré (98) ; r9 vise 70 à 80.
- D42 (pilote, réversible ; D129) : le titre d'en-tête des outils à 18 px (DESIGN.md, « Titre d'écran »), le pied de Dryhopper en
  bas comme les autres ; reprise r12-continuite après r9.
- D43 (le brasseur, 24.10 soir, sur p4b2f : « Partir sur cette version ») : Dryhopper choisi = p4b2f ; registre mis à jour,
  reprise r13-dryhopper (relevé de ses états, rendu dans la maquette, continuité D129, acquis y1b réévalué) ; r12 laisse Dryhopper.
- D44 (le brasseur, 24.10 soir, sur sa q2b : « Celle ci aussi est toujours meilleures. Mais aussi ajouter les spec en plus type
  comme matrice nettoyée flb5b ») : le groupe « Changer de levure » de q2b revient tel quel dans Suggérer (remplace la partie
  levure de D35) ; houblons et levures de Suggérer disent ce qui leur est propre (D130) ; r11.
- D45 (le brasseur, 24.10 soir, sur B : « La meilleure ») : D121 tranché, B (« Ouvrir l'analyse de ma bière › ») par défaut dans
  l'étape ; A et C derrière ?d121=a|c ; ETATS OK 15/15 étape, PROFIL OK.
- D46 (pilote, réversible ; règle n° 1, D41) : r13 G5, les mots de Dryhopper se comptent contre sa p4b2f (106 mots), non contre
  le seuil commun de 98 ; `controle-commun --sans=mots` (forme REPRISE-D124) puis `mots-premier-ecran --max=106`.
- D47 (le brasseur, 24.10 soir, sur flb5b : « le footer doit être aussi avec tout ces informations comme 4 · Les cartes de
  famille · flu2b » ; « Le footer est top » sur le pied de flu2b ; « C'est pas exhaustif sur les infos du houblons ») : D132,
  la fiche reprend le pied de flu2b et porte toute l'information du pack ; `controle-fiche-exhaustive.mjs` (témoin : flb5b
  EXHAUSTIVE ECHEC, P1 et 8 catégories) ; r14.
- D48 (le brasseur, 24.10 soir : D131 bis, ter, quater et Galaxy/Saaz) : le lot de pictos D131 ajoute le picto « en plus »,
  la légende aux endroits clés, le mot précis dans sa famille (Galaxy face à Saaz) et la règle « Il faut pas que ça gêne ! » ;
  deux séries de quatre jeux (d131-pha Opus, d131-phz Fable), d131-critique juge d'abord l'intégration.
- D49 (pilote, réversible) : sur la route fiche (Ma bière, feuille ouverte au chargement), COMMUN se joue `--sans=mots,fiche,legende`
  (échecs par construction dès HEAD ; raison dans fiche/NOTE.md) ; le geste reste couvert par ETATS 16/16 et FICHE OK. Ouvert :
  rendre ces trois contrôles conscients d'une feuille ouverte.
- D50 (pilote, D35) : `controle-fiche-exhaustive` lit les remplaçants de la fiche (`[data-role="fiche-remplacants"]`, calcul de
  Substituer au style), non la liste figée du pack ; Nugget et Nelson Sauvin EXHAUSTIVE OK, flb5b toujours ECHEC (témoin).
- D51 (pilote, règle n° 1) : la hauteur de Ma bière se compte contre sa B (D45, « La meilleure ») : 1,09 écran avec la barre
  pleine « Ouvrir l'analyse de ma bière › » (1,05 avant) ; batterie `controle-hauteur --max=1.10`.
- D52 (le brasseur, 24.10 soir, sur le radar de la fiche de Nelson Sauvin : « le spidergraph doit être en pic pas juste des
  traits... Enfin comme sur les mini maquettes ») : D133, le radar de la fiche reprend l'échelle de g1 (de -0,5 au maximum ;
  l'inconnue dans le disque du centre, jamais au centre exact) ; chaque famille décrite fait un pic ; `controle-radar-pics.mjs`
  (témoin : la maquette PICS ECHEC, g1 PICS OK) ; dans la batterie avec les contrôles D127 à D132.
- D53 (pilote, honnêteté des données) : etat-etape-ajout-rapide (r8a le matin, r15a le soir) : le point « avant » gris est
  bien dessiné et relié, mais le moteur en direct ne déplace Floral que de 2,5 % de la barre (Agrumes 5,7 %, Tropicaux 1,7 %)
  pour 10 g de Motueka à 10′ ; sa base, aux chiffres figés, montrait 12 → 40 %. Pas d'écart grossi : les valeurs du moteur
  restent ; « floral +1 » sur la carte dit l'effet. Signalé au brasseur. Ouvert : capturer en pleine page les états sous le pli.
- D54 (le brasseur, 24.10 soir, commentaire sur le rail : « il y a un peu de délai pour "sortir" du mode rail ») : D134, les
  propositions d'ajout rapide se recalculent après la première image (useDeferredValue dans Ajouter.tsx) ; 142 → 8 ms du lever
  du doigt à la première image ; `controle-sortie-rail.mjs` dans la batterie. Le retour des rangées (240 ms) reste celui de sa base.
- D55 (le brasseur, 24.10 soir, commentaires sur la fiche publiée ; pilote pour la forme) : D135, « Substituts › » ouvre
  Substituer pour un houblon de ma recette (hors recette, la liste se déplie dans la fiche : Substituer remplace un ajout) ;
  D136, « classé » devient un point creux et « 1/2 », le compte du radar, la légende dit « Hopsteiner le range dans cette
  famille, sans mot qui le décrive ». `controle-fiche-pied.mjs` dans la batterie.
- D56 (le brasseur, 24.10 soir, Comparer : « pas de possibilité d'enlever, remplacer un houblon choisi, ni en recherche un ») :
  D137, chaque houblon choisi (sauf l'épinglé de Substituer) porte ⇄ et × sous sa tête ; ⇄ ouvre la feuille « Remplacer X » ;
  la feuille cherche tout le catalogue (nom et alias). `controle-comparer-choix.mjs` dans la batterie.
- D57 (le brasseur, 24.10 soir : « Sauver cette maquette on est quasiment à du 100% ») : la maquette du soir, D134 à D137
  compris, est figée comme référence (étiquette git locale, copie de la construction, cerveau) ; la réactivité (D138) et le
  report des choix d'un écran à l'autre (D139) sont les points suivants.
- D58 (le brasseur, 24.10 soir, commentaires sur la maquette publiée ; pilote pour la forme, réversible) : le nom de l'étape
  retiré de l'en-tête (le fil d'étapes le dit) ; la ligne de tête d'une carte du rail passe à la ligne (plus de défilement en
  largeur, le × reste) ; « Plus utilisé les icône hors 16d » lu « utilise plus les icônes » (ses trois autres commentaires
  demandent des icônes) : le ◇ et le premier mot hors des 12 sur chaque ajout proposé, le ◇ devant « lui seul » / « hors 16D » de
  Suggérer et en dernière case des effets (discret, les mots au toucher) ; la phrase « X seul dit … » de « Ses mots » de Comparer
  retirée (la vue reste à reprendre) ; les légendes sous les pastilles, en mini maquettes (lot leg) ; le moment proposé par le
  moteur (10′) : noté pour la vraie app.
- D59 (le brasseur, 24.10 soir : « Faire des mini maquettes du dryhopping avec mes feedback ») : lot de douze variantes sur sa
  p4b2f (règle n° 1 : la base reste), trois séries : la frise de y1b retravaillée (dga), les trois plans de w2 (dgb), libre
  (dgz, Fable) ; critique dg ; planche dans un artefact neuf.
- D60 (le brasseur, 24.10 soir : « Faire en Todo la recherche avancée, mettre dans le git. Pas si utile pour le moment. Ajoute
  les mini maquettes ») : #151 passe en P3 et `status:deferred` ; les douze mini maquettes, leurs captures et les verdicts sont
  commités (7f9cac8c), la branche poussée, les images posées dans l'issue.
- D61 (le brasseur, 24.10 soir : « Tu peux intégrer légende type leg3-v2a · Les barres n/N mais barre leg3-v2e · Les spéciaux
  repliés ») : la légende des pastilles devient leg3-v2f, intégrée sous les pastilles des cartes du rail et des ajouts
  proposés ; registre `choix/ecrans.json` (complément de l'étape) à mettre à jour après la reprise.
- D62 (le brasseur, 24.10 nuit : « Je veux qqch comme ça moi ???? », sur sa capture de la carte ouverte de Nugget dans
  leg3-v2a) : D61 relue. « Les spéciaux repliés » est le nom de la vignette v2e, pas une consigne. La légende des pastilles
  est v2a telle quelle (mots précis avec leurs pictos, ◇ et ses sources, ce que disent les fiches, huiles, ligne-clé, ouverts
  sous la bande, puis marquée, citée, non décrite, « ? » et « Sans X › »), avec seulement la petite barre de v2e et le point
  « en tête » ; plus de pastille repliée. Contrôle D140 : `controle-legende-v2a.mjs`.
- D63 (le brasseur, 24.10 nuit : « Les commentaires pour le dryhopping était pour la partie compare ») : ses mots sur la frise
  de y1b et les trois plans de w2 visent Comparer. Ils vont au lot r6a++ (Comparer sur r6a, critique rp) ; la planche
  « Dryhopper, tes retours » (D59) les greffait sur Dryhopper : elle reste en ligne, marquée, et ne sert pas de choix pour
  Comparer. La base de Dryhopper reste l'écran jouable (« la meilleure version est celle de l'app jouable »).
- D64 (le brasseur, 24.10 nuit : « Tu peux commencer la mise en place pour l'intégration dans la vrai application. Faire une
  liste des tâche, mettre à jour git et suivre tout ça. Jusqu'à l'intégration. La fluidité, l'optimisation de code est très
  importante vu qu'il y aura beaucoup de données !! ») : la porte B s'ouvre. Épopée #159, mission
  `work/missions/2026-10-25-integration-houblons/` ; état des lieux mesuré (voie i0), puis conseil complet sur l'architecture
  de fluidité avant le premier code dans `src/`. Push, PR, fusion et déploiement restent sur son accord.
- D65 (conseil complet, 24.10 nuit, `cerveau/decisions/2026-10-25-integration-architecture.md`) : pile de routes dans App, le
  wizard reste monté sous les outils ; une seule porte d'écriture (`applyHopV4Change` sur `writeRecipeDraft`, ou `saveRecipeConfirmed`
  pour RecipePage, patch de `hops` seul) ; calcul : causes mesurées d'abord (T5), interface asynchrone dès T6, worker persistant
  seulement si le banc ×4 échoue ; catalogue en JSON à la demande ; V5.5 sous drapeau. Ordre : T1, T14, T3, T4, T5, T6, T17, T9,
  T11, T8, T12, T7 (si besoin), T10, T13, T15, T16, T18 (issues #160 à #176, épopée #159).
- D66 (le brasseur, 25.10 : « Je veux partir de la version de base, celle sur la maquette jouable ») : un nouveau lot de Comparer,
  `ecran-1/fils25-comparer/`, part de l'écran Comparer de la maquette jouable (figé dans `maquettes/parcours-cmp-base`, capture
  `captures/base-jouable.png`), et non de r6a. Obligatoire : choisir quand comparer (60′, 10′, dry hop…), les hors 16D bien montrés, les
  huiles, moins de texte (≤ 100 mots au premier écran, la base en a 114), et tous ses commentaires sur Comparer. La planche r6a++ reste
  montrée, marquée « bâtie sur r6a ». Dérogation M13 : « Refait une série » (trois séries de quatre, critique, planche).
