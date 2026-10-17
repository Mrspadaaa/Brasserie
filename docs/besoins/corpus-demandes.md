# Corpus des demandes du brasseur

Ce document cite **mot pour mot** les demandes de l'humain sur les houblons,
l'UX/UI, les règles de travail, ses exemples et ses frustrations. Il sépare
ses mots (section « Demandes explicites ») des interprétations écrites par des
agents (section « Interprétations d'agents »). Les mots de l'humain priment.

Phase 1 de la mission #119. Rédigé le 17.10.2026. Décisions : D5, D6 et D10 de
`work/refonte-frontend/decisions.md` (dossier local, non versionné).

## Sources et méthode

| Code | Source | Contenu |
|---|---|---|
| `M0001` à `M0759` | Journaux Codex Desktop (`~/.codex/sessions`, `~/.codex/archived_sessions`) et Claude (`~/.claude/projects`, entrées `claude-desktop` et `cli`) | 759 messages tapés par l'humain du 03.09 au 17.10.2026, après retrait des briefs d'agents, réveils, délégations et résultats d'outils |
| `S01` à `S11` | Session Claude de cette mission (17.10.2026, soir) | Messages de l'humain pendant la phase 1 |
| `T1` | `C:\Users\mrspa\Documents\Brasserie\work\houblons-v5-cadrage-2026-09-29\demandes-utilisateur.md` | Transcription d'agent du 29.09 ; le message d'origine n'existe plus sur disque (D6) |
| `T2` | `…\houblons-v5-cadrage-2026-09-29\clarification-creativite.md` | « Message exact » recopié par un agent le 29.09 |
| `P1` | `work/refonte-frontend/prompt-session.md` | Brief de la mission, validé par l'humain au lancement |

Extraction : script `extract-human.mjs` (lecture seule). Classement par thème :
trois agents Haiku 5.5 en effort maximal (D4), 1 015 citations. Sélection,
regroupement et retrait des doublons : Opus. Le corpus retient les demandes
distinctes sur les thèmes du brief ; l'extraction complète (759 messages,
1 015 citations classées) reste hors dépôt, dans `work/refonte-frontend/extraction/`. Contrôle : chaque citation
ci-dessous est comparée à sa source par
`work/refonte-frontend/checks/check-phase1.mjs corpus` (dossier local de la
mission, non versionné ; espaces normalisés,
segments séparés par `[…]`). Les fautes de frappe sont conservées.

Format d'une entrée : identifiant · date locale (Europe/Zurich) · outil ·
source (puis doublons) · type — « citation ». Types : `explicite` (tapé par
l'humain), `relayé` (décision humaine transmise par un agent), `transcrit`
(recopié par un agent, original absent), `réponse` (réponse à une question
d'agent), `collé` (texte collé, souvent rédigé par une IA ; exclu ici).

Limites :
- des demandes tapées hors de ces journaux (claude.ai, ChatGPT, téléphone) peuvent
  manquer ; le florilège du 28.09 en est la preuve (D6) ;
- trois messages (M0009, M0642, M0643) contiennent une clé API en clair : ils ne
  sont pas cités ; la clé doit être révoquée ;
- les autres domaines métier (eau, finances, stock, jour de brassage) ne sont
  repris que lorsqu'ils posent une règle générale d'UX ou de travail.

## Demandes explicites

### 1. Le besoin houblons, dans les mots du 17.10

- **C001** · 2026-10-17 · Claude Desktop · M0758, M0746 · explicite — « Si je fais une stout, je veux voir tous mes houblon qui correspondent du + au - à ma stout et pouvoir en comparé 2,3,4 facilement avec des infos ou des simulations. C'était ma demande principal... »
- **C002** · 2026-10-17 · Claude Desktop · M0758 · explicite — « Et je veux que sur mobile en un click, sans scroll je puisse choisir mon houblon et voir ce que j'ai. C'est pas du tout le cas.. »
- **C003** · 2026-10-17 · Claude Desktop · M0758 · explicite — « Ensuite l'application doit répondre à plusieurs questions explicitement donné, ça ne semble pas du tout être le cas... »
- **C004** · 2026-10-17 · Claude Desktop · M0758 · explicite — « Regardé ce qui a été perdue et comprendre les vrais besoins avant quoi que ce soit. J'avais même donné plusieurs fois des exemples concrets... »
- **C005** · 2026-10-17 · Claude Desktop · M0746 · explicite — « Déjà c'est lent, et j'avais demandé à ce que ce soit lisible facilement et si je veux plus d'infos je peux les avoir facilement... Ça correspond pas à ce que je veux pour mon activité de brasserie. »
- **C006** · 2026-10-17 · Claude Desktop · M0746 · explicite — « La c'est un brouillon pas possible, rien n'est clair, plein de données manque en production, aucune simulation semble fonctionner c'est n'importe quoi. »
- **C007** · 2026-10-17 · Claude Desktop · M0747 · explicite — « Regarde ce qui c'est vraiment perdu en route, les v5 et des versions de v5.5 semblait largement mieux que ce qu'il y a actuellement... »
- **C008** · 2026-10-17 · Claude Desktop · M0758 · explicite — « Faire une révision complète à ce niveau ferme et créé de nouveaux ticket dans ce sens, côté backend probablement que beaucoup de choses peuvent être gardé mais niveau frontend il y a beaucoup de boulot. »
- **C009** · 2026-10-17 · Claude Desktop · M0758 · explicite — « Là on a une version bien en dessous de la concurrence, c'est ridicule que autant de temps aille été mis pour un résultat aussi catastrophe... »

### 2. Houblons : demandes antérieures

- **C010** · 2026-09-12 · Codex Desktop · M0411 · explicite — « la partie houblon dans la création de recette me sert pour le moment à rien. »
- **C011** · 2026-09-12 · Codex Desktop · M0411 · explicite — « Les houblons sont classés par goût mais c'est complément faux ça doit être classés par style »
- **C012** · 2026-09-12 · Codex Desktop · M0429 · explicite — « Pour les ipa les houblons recommandé c'est n'importe quoi. Pourquoi il y a pas de citra, idao7 Galaxy ou autre houblon ipa ??? »
- **C013** · 2026-09-12 · Codex Desktop · M0430 · explicite — « Citra Idaho et Galaxy était juste des exemples »
- **C014** · 2026-09-12 · Codex Desktop · M0411 · explicite — « Regarde aussi les interactions avec les autres Steps notamment les levures. »
- **C015** · 2026-09-09 · Codex Desktop · M0314 · explicite — « Ensuite nibveau algo je veux pouvoir avoir un coche qui simule toutes les graph de saveur et de chimie. et aussi une choche qui simule l'addition de l'ajoue de tout les houblons. »
- **C016** · 2026-09-09 · Codex Desktop · M0314 · explicite — « Ensuite je veux aussi un aglo reverse, c'est à dire, si j'ajoute moi à x moment avec x levure. je veux savoir ce que ça va faire. »
- **C017** · 2026-09-09 · Codex Desktop · M0334 · explicite — « Pareil pour les houblons, j'avais demandé de pouvoir faire la simulation. »
- **C018** · 2026-09-09 · Codex Desktop · M0352 · explicite — « Aussi le calcul des ibu semble être un peu étrange. »
- **C019** · 2026-09-09 · Codex Desktop · M0352 · explicite — « Et le calcul d'ibu en dryhop ne fonctionne juste pas. »
- **C020** · 2026-09-09 · Codex Desktop · M0352 · explicite — « De même pour l'autocomplete des houblons du c'est en dryhop l'autocomplete semble pas bien fonctionné. »
- **C021** · 2026-09-08 · Codex Desktop · M0276 · explicite — « Je veux aussi les info sur phenol tyol et autres info technique. »
- **C022** · 2026-09-08 · Codex Desktop · M0276 · explicite — « Et aussi par exemple cascade n'est pas trouvé. »
- **C023** · 2026-09-08 · Codex Desktop · M0276 · explicite — « Et au final comme il y a quasiment pas de combo gagnsnt, proposer vraiment ceux que l'on sait. Et ensuite pour extrapoler avec ce que l'on veut. »
- **C024** · 2026-09-08 · Codex Desktop · M0277 · explicite — « Ensuite utilise toutes tes ressources afin de créer un modèle experimental d'extrapolation pour predir justement tout ça peut importe le combo avec des intervalles de confiance »
- **C025** · 2026-09-08 · Codex Desktop · M0273 · explicite — « En plus de ça il n'y a pas d'helper pour cibler ce que l'on veut durant la création de recette »
- **C026** · 2026-09-06 · Codex Desktop · M0190, M0018 · explicite — « Ensuite faire peut être soit genre du drag and drop des ingrédients ou genre choix pour température moment genre citra 50g en Whirlpool et 50g en dryhopping »
- **C027** · 2026-09-06 · Codex Desktop · M0190, M0018 · explicite — « Ensuite ingrédients, les houblons sont toujours pas bon d'ailleurs c'est toujours du place Holder le grammage... »
- **C028** · 2026-09-03 · Claude Desktop · M0013 · explicite — « Aussi la visu des stock, seul le malt à une barre, fait en pour les autre si ils ont un stock mini si nous juste montre si il y en a unpeu beaucoup,peu ect.. »
- **C029** · 2026-09-05 · Claude Desktop · M0057, M0147 · explicite — « j'aime beaucoup ces histoires de tag, par exemple sur les houblons ébullition, houblonage à frue. »
- **C030** · 2026-09-06 · Codex Desktop · M0209 · explicite — « Je veux par exemple avec un timer de quand mettre mes houblons et monter mes plier de mash. »
- **C031** · 2026-09-06 · Codex Desktop · M0209 · explicite — « pareil j'ai parfois des petits soucis de stock et certains mal sont pas dispo sous la main. Donner des alternatives.. je veux ça comme helper !!! »
- **C032** · 2026-09-07 · Codex Desktop · M0237 · explicite — « J'attends à ce qu'il trouve des substituts pas forcément en stock et aussi possible là où je peux m'en procurer en Suisse en stock »
- **C033** · 2026-09-07 · Codex Desktop · M0235 · explicite — « Mon houblons a un goût trop herbeux comment faire ect... Ect... »
- **C034** · 2026-09-07 · Codex Desktop · M0232 · explicite — « Si par exemple je mets le houblons à+30 au lieu de +60, »
- **C035** · 2026-09-20 · Codex Desktop · M0469 · explicite — « Une stout très amère et chocolaté. »
- **C036** · 2026-09-20 · Codex Desktop · M0469 · explicite — « Une session neipa douce et peu amère, très légère. »
- **C037** · 2026-09-20 · Codex Desktop · M0469 · explicite — « Je voudrais pas exemple avec une bière de Champagne avec un goût assez sucré. »
- **C038** · 2026-09-20 · Codex Desktop · M0469 · explicite — « Est-ce que le simu est vraiment utilisable au quotidien si je veux une cible bien particulière avec une levure un peu en dehors des cas thoerique ? »
- **C039** · 2026-09-20 · Codex Desktop · M0463 · explicite — « Teste une recette avec une impérial stout, barly wine, sour, neipa. Est-ce que les données sont vraiment celle attendus ? »
- **C040** · 2026-09-20 · Codex Desktop · M0463 · explicite — « Est-ce que le lien entre houblon, levures, recette fonctionne vraiment ? »
- **C041** · 2026-10-01 · Codex Desktop · M0552 · explicite — « bien regardé aussi pour avoir un modèle d'ibu pour le contact à froid »
- **C042** · 2026-10-16 · Claude CLI · M0666 · explicite — « choix de levure et houblons bio Transfo et autres donnée complexe, comment il s'en sort 3.8 ? »
- **C043** · 2026-10-12 · Claude Desktop · M0626 · explicite — « Et est-ce que les jeux de données et tout ce qui en découlent sont bien chargées aussi en db maintenant ? Les vrais info réel ? »
- **C044** · 2026-09-09 · Codex Desktop · M0338 · explicite — « il doit donner le vrai url pour par exemple le stock ou houbon, lien d'achat directe et correctem !!! »
- **C045** · 2026-10-01 · Codex Desktop · M0551 · explicite — « Met moi à disposition toutes les versions que je puisse tester jouer avec, pas trop grave du tout ne fonctionne pas pour ces test. »

### 3. Le florilège de questions houblons (transcrit par un agent)

Message d’origine introuvable sur disque (décision D6). Source : `houblons-v5-cadrage-2026-09-29/demandes-utilisateur.md`, transcription d’agent datée du 29.09, « orthographe conservée autant que possible ».

- **C046** · 2026-09-29 · transcription d’agent · T1 · transcrit — « Je veux faire la même chose que l'on a fait pour les levures avec les houblons. Visuellement il y a pas mal de problème mais là les problèmes sont aussi métier. »
- **C047** · 2026-09-29 · transcription d’agent · T1 · transcrit — « On utilise les meilleures outils, tool, third party, library, et autres on se limite pas à ce qu'il y a en place. On maximise la compréhension visuel. »
- **C048** · 2026-09-29 · transcription d’agent · T1 · transcrit — « elles mettent les 3 les ibu ultra en avant alors que le hublon c'est pas QUE ça les ibu sont qu'une partie notament dans les ipa, c'est toute une palette de saveur et de chimie. C'est des profils aromatique.. »
- **C049** · 2026-09-29 · transcription d’agent · T1 · transcrit — « problème majeurs avec les unité, ça mélange g/l avec ibu, il faudrait le total ibu simulé avec le dryhop mais c'est pas la métrique la plus importante. »
- **C050** · 2026-09-29 · transcription d’agent · T1 · transcrit — « Qu'est-ce que je gagne dans ma light lager à remplacer Saaz par Styrian gold https://beermaverick.com/hop/styrian-golding/ »
- **C051** · 2026-09-29 · transcription d’agent · T1 · transcrit — « Ou dans ma stout si j'amèrise avec nuget est-ce que je suis pas trop résineux ou au contraire pas assez et je peux aussi ajouter autre chose. »
- **C052** · 2026-09-29 · transcription d’agent · T1 · transcrit — « Hyperboost, cryo hops... »
- **C053** · 2026-09-29 · transcription d’agent · T1 · transcrit — « Est-ce que dans ma blanche je peux faire du dryhopping ai j'ajoute 20g de moins dans le moût ? »
- **C054** · 2026-09-29 · transcription d’agent · T1 · transcrit — « Je voudrais une Lager ultra juicy, hyper aromatisé, sans Quelle soit amère. J'ai quoi comme choix. »
- **C055** · 2026-09-29 · transcription d’agent · T1 · transcrit — « J'ai ce houblons conseillé dans ma recette mais je l'ai actuellement pas disponible, avec quoi le mettre. Quesque je gagne perds. »
- **C056** · 2026-09-29 · transcription d’agent · T1 · transcrit — « Je veux absolument éviter le côté sapins, résine, mais je veux quand même un haut taux d'amertum sans forcément le côté tropicale. »
- **C057** · 2026-09-29 · transcription d’agent · T1 · transcrit — « Je veux une blanche ultra tropicale qui de Marie bien avec mon goût de banane. »
- **C058** · 2026-09-29 · transcription d’agent · T1 · transcrit — « Quand avec ma levure, utiliser au mieux mon houblons et lesquels pour cette super neipa. »
- **C059** · 2026-09-29 · transcription d’agent · T1 · transcrit — « Ma patry stout est trop sucré comment compensé ça avec mon houblons. »
- **C060** · 2026-09-29 · transcription d’agent · T1 · transcrit — « J'ai un profil de bière hyper particulier. Je veux une bière de Champagne, sucré, très fleural, légère amertume. Est-ce que la bio transformation peut m'aider là dedans. »
- **C061** · 2026-09-29 · transcription d’agent · T1 · transcrit — « Voilà un florilège de questions auxquelles mon app doit répondre. Particulement la partie houblon. C'est très complexe, très large. Et c'est que un ou deux exemples. C'est pas une généralité. Manque encore la partie nolo, d'autres style, sour, houblon maison, hyper profile, rattrapage, raté ect ect ect... »
- **C062** · 2026-09-29 · transcription d’agent · T1 · transcrit — « je veux que dans le 80% des cas où c'est, je sais déjà ce que je veux car j'ai trouvé où je fine tune ma recette, ça soit très pratique, pas surchargé, hyper lisible. Mais que son je veux aller dans le dur, comprendre vraiment, confronté mes idées, choisir mais aussi avoir le choix et que on me propose les choix, soit possible. »
- **C063** · 2026-09-29 · transcription d’agent · T1 · transcrit — « Mais j'ai pas l'impression que ces visuels permettent réellement de répondre à TOUTES mes questions ??? Tout en aillant un usage très pratique et aisé dans la cas d'usage standard »
- **C064** · 2026-09-29 · transcription d’agent · T1 · transcrit — « La simplicité mobile n'est pas un vrai critères... Ça doit être compréhensible sur mobile, pas forcément simple, ça doit être simple dans le cas d'usage simple... »
- **C065** · 2026-09-29 · transcription d’agent · T1 · transcrit — « je viens de testé les v2, et c'est bien ce que je craignais. c'est pas utilisable. il y a des bonnes idées mais sur ma liste de question je crois que aucune n'est répondu »
- **C066** · 2026-09-29 · transcription d’agent · T1 · transcrit — « TOUT DOIT ÈTRE revu, je veux vraiment 4 maquette très différentes, avec chaque fois des risques et disruption prises. pour la levure on a vraiment très récompensé la créativité, ça avait bien fonctionné »
- **C067** · 2026-09-29 · transcription d’agent · T2 · transcrit — « les agents se bride sur la créativité et ont trop tendence à utilisé l'app de base comme reférence alors que non justement... que il y a encore des lacune technique et que ce qu'il y a en place ne doit pas faire foie. PAS DU TOUT même. »

### 4. Références concurrentes citées

- **C068** · 2026-09-29 · transcription d’agent · T1 · transcrit — « mais j'ai l'impression que aucune des maquette fait mieux que https://beermaverick.com/your-hop-substitutions-are-wrong/ https://beermaverick.com/hops/hop-comparison-tool/?hops=sabro,bravo, ou autre alternative de site... »
- **C069** · 2026-09-29 · transcription d’agent · T1 · transcrit — « ces site sont bien mais ne répondes pas à TOUTES mes question. »
- **C070** · 2026-09-29 · transcription d’agent · T1 · transcrit — « oui voilà l'idée est là mais le but est de l'amélioré tantôt en terme de compréhension, utilisation, visualisation ect »
- **C071** · 2026-09-09 · Codex Desktop · M0314 · explicite — « et niveau front, inspire toi de [https://beermaverick.com/hop/cascade/](https://beermaverick.com/hop/cascade/) la manière dont il affiche. »
- **C072** · 2026-09-03 · Claude Desktop · M0019 · explicite — « je veux qqch comme ça, et mieux si tu peux »

### 5. Levure, le modèle cité

- **C073** · 2026-09-20 · Codex Desktop · M0468 · explicite — « Est-ce que vraiment en 1 clic je peux choisir ma levure »
- **C074** · 2026-09-12 · Codex Desktop · M0411 · explicite — « Mais une levure aura la possibilité de prononcé plus le goût clou de girofle ou banane, le brasseur choix et l'interface l'aide à comprendre, anticipé, donner les instructions, simuler. »
- **C075** · 2026-09-20 · Codex Desktop · M0459 · explicite — « Le problème principal est COMMENT les informations sont affichées : hiérarchie, organisation, regroupement, lisibilité, comparaison et place occupée. »
- **C076** · 2026-09-20 · Codex Desktop · M0459 · explicite — « Comprend-il l’écran dès le premier regard ? »
- **C077** · 2026-09-25 · Codex Desktop · M0507 · explicite — « comparaison alignée et sourcée de 2–3 levures, avec écarts discriminants et inconnues visibles ; »
- **C078** · 2026-09-12 · Codex Desktop · M0420 · explicite — « Je veux comme pour les sels. Un outil de simulation qui pré-rempli tout les champs suivants la consigne une et avec les données de ma recette. »
- **C079** · 2026-09-08 · Codex Desktop · M0290 · explicite — « Je veux aussi une Integration pour la levure, du par exemple pour une weissbiere je veux maximiser le goût banane, donne moi la ou les levures parfait. »

### 6. UX/UI : règles d’écran

- **C080** · 2026-09-09 · Codex Desktop · M0352 · explicite — « Ce que tu caches c'est les infos pas les actionable. »
- **C081** · 2026-09-12 · Claude Desktop · M0367 · explicite — « et regarde que les info sont des actionnable pas des "information, warning" ou explication »
- **C082** · 2026-09-09 · Codex Desktop · M0314 · explicite — « Il y a encore plsieurs petit soucis: premier UI frontend -> il y a trop d'info, trop de text ouvert de base. ça pollue beaucoup et il y a de la redondance. »
- **C083** · 2026-09-09 · Codex Desktop · M0345 · explicite — « Donc de base les caché ou trouver une astuce pour avoir juste les infos que j'ai besoin en premier, là voir un maximum de mes recettes. Vérifie ça sur toute les vues. »
- **C084** · 2026-09-05 · Claude Desktop · M0063 · explicite — « mais ça doit être ultra user expérience orienté smooth et sans accor. visuel sombre mais compact. pas d'info surplus en doublon ou inutile. »
- **C085** · 2026-09-05 · Claude Desktop · M0055 · explicite — « réfléchis comme un vrai brasseur qui aime l'ergonomie mobile first. qui veut voir un Max d'info sans que ce soit étouffant. »
- **C086** · 2026-09-04 · Claude Desktop · M0026 · explicite — « il faut simplifier çaà réduir le header au stric minimum sur mobile pareil pour le footer »
- **C087** · 2026-09-04 · Claude Desktop · M0026 · explicite — « et redimensionner les éspace, la police et taille des element pour maximiser l'espace. »
- **C088** · 2026-09-05 · Claude Desktop · M0096 · explicite — « Mais tout peut être plus petit plus compact avec BEAUCOUP MOINS d'espace entre les composants. »
- **C089** · 2026-09-12 · Claude Desktop · M0378, M0428 · explicite — « BOUTON TOUJOURS TROP GROS IMPOSANT !! maximise la place !! »
- **C090** · 2026-09-12 · Codex Desktop · M0384 · explicite — « dans l'application il y a des regles sur les taille de boutons qui sont contre ce que je veux faire: sure mobile maximiser l'espace et compatcer les données le plus possible. »
- **C091** · 2026-09-12 · Codex Desktop · M0384 · explicite — « plein d'outils UI à dispo autre que les boutons ou champs text cherche ce qu'il y a et utilise ces nouveaux moyen pour maximiser l'UX sans détrimant de l'ui. »
- **C092** · 2026-09-03 · Claude Desktop · M0018 · explicite — « Je vois aussi aucun slider ou autre UX booster. »
- **C093** · 2026-09-24 · Codex Desktop · M0494 · explicite — « J'ai l'impression que ça met pas trop en avant les UX UI booster. »
- **C094** · 2026-09-24 · Codex Desktop · M0488 · explicite — « Actuellement l'application est très textuel. »
- **C095** · 2026-09-05 · Claude Desktop · M0057 · explicite — « sur j'appuie dessus celà change et fait une rotation. utilise ce principe PARTOUT et fait plus de petits tag pratique comme ça »
- **C096** · 2026-09-12 · Claude Desktop · M0366 · explicite — « car il faut que ce soit visuelement parlant et frappant ! »
- **C097** · 2026-09-12 · Codex Desktop · M0382 · explicite — « plus de couleurs de quoi se retrouver facilement. »
- **C098** · 2026-09-03 · Claude Desktop · M0015 · explicite — « utilise aussi des slider ou autre outil du genre pour simplifier l'utilisation mobile, mais n'oublie pas que je dois aussi utiliser ça sur mon ordi »
- **C099** · 2026-09-03 · Claude Desktop · M0015 · explicite — « faire de l'autocomplte et surtout du j'appuie sur tab ou entrer ça me met au champs suivants. UX parfait. »
- **C100** · 2026-09-05 · Claude Desktop · M0066 · explicite — « par exemple pour les malt sur PC, je veux juste à avoir à taper le nom et quantité au clavier. c'est clair ? »
- **C101** · 2026-09-03 · Claude Desktop · M0013 · explicite — « c'est pas du tout userfriendly mobile first. un exemple il y en a des milier dans l'app mais pour le stock on passe de 1 en 1 alors que on voudrait plutot un bouton genre +5, +10 +0.5 ect.. »
- **C102** · 2026-09-09 · Codex Desktop · M0352 · explicite — « Surtout sur mobile acide, sel, slider et Spider graph doivent être visible sur un seul écran !! »
- **C103** · 2026-09-08 · Codex Desktop · M0289 · explicite — « Contraintes imposées et pas respecté, sur mobile, je veux voir spidergraph, sel et acides et slider. Comme c'etait disposer avant »
- **C104** · 2026-09-26 · Codex Desktop · M0533 · explicite — « Sur mobile, le graph doit prendre le plus de largeur possible pour simplifier son édition avec les doigts »
- **C105** · 2026-09-09 · Codex Desktop · M0349 · explicite — « Les sélections de sous menu en dropdown est une grave erreur UI !!! »
- **C106** · 2026-10-17 · Claude Desktop · M0743 · explicite — « Non mais le bouton+ doit être flottant pas en mode footer bloquant »
- **C107** · 2026-09-12 · Claude Desktop · M0369 · explicite — « je veux toujours pouvoir changer d'etape instasntasnement comme c'était avant. »
- **C108** · 2026-09-13 · Codex Desktop · M0435 · explicite — « Vérifie que les écrans qui du coup charge ces données les charges intelligemment et que ça prenne pas plus que quelques secondes »
- **C109** · 2026-09-12 · Codex Desktop · M0407 · explicite — « Avec le Gboard certains champs trigger l'ouverture pour l'autocomplete position, carte, password. »
- **C110** · 2026-09-05 · Claude Desktop · M0096 · explicite — « Je veux pas ouvrir l'app en aillant un chantier pas possible, je veux un résultat clean »

### 7. Règles de travail, de vérification et de qualité

- **C111** · 2026-09-03 · Claude Desktop · M0013 · explicite — « tout ce genre de truc doit êre dynamique, repris de la db du stock et tout. rien ne doit être inventé.. ça suit pas la logique métier. révise ça »
- **C112** · 2026-09-09 · Codex Desktop · M0313 · explicite — « prend toujours en compte le fait que c'est pour un brasseur alors avant quoi que ce soit, pose toi toujours la question. de quoi à besoin un brasseur. »
- **C113** · 2026-09-12 · Codex Desktop · M0390 · explicite — « Regarde des vrais cas concrets et implémente des outils, helper, visualiseur, analyse et simulateur qui sont réellement un besoin pour un brasseur. »
- **C114** · 2026-09-20 · Codex Desktop · M0457 · explicite — « est-ce vraiment pratique pour le brasseur, est-ce que tout fonctionne parfaitement, est-ce facilement lisible et utilisable du premier coup »
- **C115** · 2026-09-04 · Claude Desktop · M0036, M0126 · explicite — « tu n'as pas testé l'ui que le fonctionnement »
- **C116** · 2026-09-05 · Claude Desktop · M0057 · explicite — « et fait du UI testing. j'ai l'impression que pas mal de champs de répondent pas comme il faut. »
- **C117** · 2026-09-05 · Claude Desktop · M0063 · explicite — « c'est le cas ???? si non fait en sorte que ça le soit utilse tes outils de vision ou autre pour vraiment voir et comprendre l'aperçu et les problèmes »
- **C118** · 2026-09-12 · Codex Desktop · M0374 · explicite — « juste le code ne suffit pas il faut voir la genneration des vues mais faire un re view visuel »
- **C119** · 2026-09-12 · Claude Desktop · M0376, M0426 · explicite — « fait une vrai revue UX avec vue generer !!! »
- **C120** · 2026-09-12 · Claude Desktop · M0368 · explicite — « regarde surtout le rendfu reel »
- **C121** · 2026-09-08 · Codex Desktop · M0280 · explicite — « Comment les tests ne voient pas ça ?? C'est flagrant et le premier truc visible et première logic de base ??? Respecter le profil »
- **C122** · 2026-09-05 · Claude Desktop · M0076, M0114 · explicite — « comment as tu pu louper ça dans tes pass de vérification ?? »
- **C123** · 2026-09-25 · Codex Desktop · M0498 · relayé — « Ces restrictions de test ne sont pas des règles métier. »
- **C124** · 2026-09-12 · Codex Desktop · M0384 · explicite — « tu peux et dois modifier ces regles ui qui ne respecte pas la regle principal de l'app. »
- **C125** · 2026-09-03 · Claude Desktop · M0013 · explicite — « tu peux TOUT CHANGé TOUT REFONDRE tant que la logique métier reste intacte. »
- **C126** · 2026-10-17 · Claude Desktop · M0758 · explicite — « Beaucoup de mes règles ont été ingnoré, faire en sorte que cela ne se reproduise plus. Mettre des mécanismes qui impose certaines contraintes. »
- **C127** · 2026-10-17 · Claude Desktop · M0758 · explicite — « Trop peu de tests ont été vraiment été effectué sur la vrai app. »
- **C128** · 2026-10-17 · Claude Desktop · M0758 · explicite — « Et il y a des gros problèmes majeurs de UX, UI, qui ont passé à travers des dizaines de Review, comment cela est possible ?? Il faut absolument mettre des choses en place pour que cela n'arrive plus... »
- **C129** · 2026-10-08 · Claude CLI · M0600 · relayé — « au début, tous les tests se font en local (fixtures dans Chrome local, puis émulateurs Firebase), comme les issues l'indiquent. »
- **C130** · 2026-10-12 · Claude Desktop · M0630 · explicite — « une issue se ferme dès qu'elle est utilisable et prouvée, sans aucun bloquant »
- **C131** · 2026-10-12 · Claude Desktop · M0630 · explicite — « une passe doit être fait de bout en bout avec test d'intégration et tout cela valide le final. »
- **C132** · 2026-09-07 · Codex Desktop · M0245 · explicite — « Exclus les test IA du pipline normal, ça va me coûter pour rien. »
- **C133** · 2026-09-25 · Codex Desktop · M0505 · explicite — « Non je veux pas un a,b,c,d comparable. Je veux une version final comme tu l'a toi fait. »
- **C134** · 2026-09-25 · Codex Desktop · M0510 · explicite — « La livraison actuelle ne correspond pas à la refonte demandée. »
- **C135** · 2026-10-17 · Claude Desktop · M0758 · explicite — « Une fois que cela est fait il va falloir revoir l'architecture et créé une vraie doc la conserant, Use ASDSTE100 to about 80%, for clarity but still natural enough to recreate the specs. Then create diagram of the core logic. »
- **C136** · 2026-10-17 · Claude Desktop · M0758 · explicite — « Finally, create an new html page for the frontend with the new specs, UX UI logic. Only the hop part. »

### 8. Frustrations et constats de l’humain

- **C137** · 2026-09-20 · Codex Desktop · M0463 · explicite — « C'est une pseudo app pour brasseur là, c'est pas du tout pensé pour un brasseur. »
- **C138** · 2026-09-20 · Codex Desktop · M0456 · explicite — « la partie froont de mon app est toujours vraiment mauvaise surtout en terme d'ergonomie ux. »
- **C139** · 2026-09-12 · Codex Desktop · M0390 · explicite — « la partie NOLO dans la création de recette me sert pour le moment à rien. »
- **C140** · 2026-09-12 · Codex Desktop · M0391 · explicite — « la partie levures dans la création de recette me sert pour le moment à rien. »
- **C141** · 2026-09-12 · Codex Desktop · M0420 · explicite — « Toujours pas utilisable en l'état. »
- **C142** · 2026-09-03 · Claude Desktop · M0019 · explicite — « c'est beaucoup mieux mais tu n'as pas pensé comme un brasseurs. »
- **C143** · 2026-09-03 · Claude Desktop · M0013 · explicite — « tu as rien vraiment modifier en terme de viusel. c'est un point crucial si non l'app ne sera pas utiliser fait une vrai passe. »
- **C144** · 2026-09-05 · Claude Desktop · M0065 · explicite — « vraiment beaucoup mieux mais j'ai perdu cette info »
- **C145** · 2026-09-12 · Codex Desktop · M0381 · explicite — « le dernier merge de main a crée des regression. »
- **C146** · 2026-09-13 · Codex Desktop · M0434 · explicite — « Il y a beaucoup de lenteur dans mon app. Fait une nouvelle branche et fix tout ça sans créé de régression ni de problème »
- **C147** · 2026-09-30 · Codex Desktop · M0547 · explicite — « Tu as vraiment tout scanné ? Tu as vraiment TOUTES les données qu'il te faut ??? Rien n'a été mis de côté ??? Tout tout tout ??? »
- **C148** · 2026-10-12 · Claude Desktop · M0628 · explicite — « Mener les issues jusqu'à la fermeture. Après 4 jours, aucune issue n'est fermée. »
- **C149** · 2026-10-07 · Codex Desktop · M0586 · explicite — « pourquoi ça prends autant de temps de finir tout ces ticket ??? »

### 9. Session de la mission (17.10, soir)

- **C150** · 2026-10-17 · session de la mission · S06 · explicite — « Ça ne respecte rien de mes critères UX UI, c'est une catastrophe »
- **C151** · 2026-10-17 · session de la mission · S07 · explicite — « Comment cela a pu passer plusieurs tests, revue et autre, il faut impérativement mettre qqch en place pour que la V6 n'aille pas ces problèmes. C'est aberrant »
- **C152** · 2026-10-17 · session de la mission · S08 · explicite — « Non mais il va falloir tout reprendre de tout manière... »
- **C153** · 2026-10-17 · session de la mission · S09 · explicite — « Tu as déjà oublié le brief ? »
- **C154** · 2026-10-17 · session de la mission · S10 · explicite — « J'ai l'impression que les données sur l'app réel ont des problèmes aussi regarde la db »
- **C155** · 2026-10-17 · session de la mission · S11 · explicite — « Il faut aussi créé un ticket pour de l'optimisation, comme mis dans le brief, l'app est devenu très lente... Beaucoup d'info sont chargés pour rien... »
- **C156** · 2026-10-17 · session de la mission · S04 · explicite — « Met à jour au fur et à mesure, de même que les issues git, créé, supprimer, update ect.. »

### 10. Compléments de la relecture (source 1)

Ajoutés après relecture ligne à ligne de `demandes-utilisateur.md` ; placés ici pour garder stables les identifiants déjà cités.

- **C157** · 2026-09-29 · transcription d’agent · T1 · transcrit — « Tu as compris que ça doit pouvoir répondre à TOUTES mes questions ! »
- **C158** · 2026-09-29 · transcription d’agent · T1 · transcrit — « ne semble pas fonctionner actuellement mais c'est l'idée »
- **C159** · 2026-09-29 · transcription d’agent · T1 · transcrit — « Faire une 5 et 6 en s'inspirant des meilleurs, aussi pour les cas de figure plus classique de la vie de tout les jours. »
- **C160** · 2026-09-29 · transcription d’agent · T1 · transcrit — « on peut TOUT créé et justement il faut pas de limiter !!! »
- **C161** · 2026-09-29 · transcription d’agent · T1 · transcrit — « stop v2, je pense que il ya pas grand chose à gardé de ces maquettes »

### 11. Compléments de la relecture (source 2)

Ajoutés après relecture des 1 015 citations extraites.

- **C162** · 2026-09-09 · Codex Desktop · M0314, M0287 · explicite — « revoit ton algo de prédiction pour être encore plus précis. »
- **C163** · 2026-09-09 · Codex Desktop · M0316 · explicite — « tu peux par exemple prendre un exemple documenté, lancé l'algo et voir si ça marche. »
- **C164** · 2026-09-13 · Claude Desktop · M0436 · explicite — « mais maintenqnt cela cache ou met moin en valeur les info principale les plus important tell que les ingrédiant timing et autrre. »

### 12. L’exigence de fond (17.10, 22:56)

- **C165** · 2026-10-17 · session de la mission · S12 · explicite — « Les questions sont bien mais traite pas le problème de fond: UX UI doit être UTILISABLE Pratique facile avec les info uniquement que l'on a besoin et que l'on veut... »
## Ce que disent ces mots (synthèse Opus)

Cette synthèse est une lecture d'agent. Chaque point renvoie aux citations.

0. **L'exigence de fond est l'utilisabilité** : « UX UI doit être UTILISABLE
   Pratique facile avec les info uniquement que l'on a besoin et que l'on
   veut » (C165). Répondre aux questions ne suffit pas : l'écran doit rester
   pratique, et ne montrer par défaut que ce qui sert le geste en cours
   (C080, C082, C083, C062, C005).

1. **Le besoin principal est un classement de mes houblons pour le style de
   ma recette**, stock d'abord, avec comparaison de 2 à 4 houblons et
   simulations (C001, C002). Le classement par style est demandé depuis le
   12.09 (C011) ; le refus d'une liste valable seulement pour les noms cités
   date du même jour (C012, C013).
2. **L'app doit répondre à des questions concrètes**, données plusieurs fois
   (C003, C004, C050 à C061, C063, C069, C157). Les sites concurrents sont un
   plancher à dépasser, pas un modèle à copier (C068 à C070).
3. **Le houblon n'est pas que l'IBU** : saveurs, chimie, profils aromatiques
   (C048, C021). L'IBU reste utile, dry hop compris (C018, C019, C049, C041).
4. **Le cas courant doit être pratique et lisible ; la profondeur doit rester
   accessible** (C005, C062, C064). Simple ne veut pas dire pauvre (C064).
5. **Les règles d'écran sont constantes depuis septembre** : compact et sombre
   (C084, C086 à C090), outils visuels plutôt que du texte (C091 à C098),
   les actions visibles, les informations secondaires repliées (C080 à C083),
   un clic (C002, C073), rapide (C005, C108).
6. **Les règles de vérification aussi** : juger le rendu réel, pas le code
   (C115 à C120) ; ne rien inventer, partir des vraies données (C111, C043) ;
   tester sur la vraie app (C127, C129).
7. **La même alerte revient depuis septembre** : « Comment les tests ne voient
   pas ça ?? » (C121), puis « passé à travers des dizaines de Review » (C128) et
   « Comment cela a pu passer plusieurs tests » (C151). Les causes sont
   étudiées en phase 3.
8. **Les données réelles manquent** : la question du 12.10 (C043) reçoit une
   réponse mesurée le 17.10 : 12 variétés au catalogue de production, stock non
   normalisé, recettes avec alpha 0 (#120).

## Interprétations d’agents

Ces textes sont des **interprétations**. Ils servent à repérer ce qui a été
ajouté, déformé ou perdu entre les mots de l'humain et le travail livré.

| Id | Source | Texte d'agent | Lecture critique |
|---|---|---|---|
| A01 | `houblons-v5-cadrage-2026-09-29/recap-avant-opus.md` | « Un outil de conception et de décision de houblonnage intégré à MA recette » | Le « MA » est écrit à la place du brasseur. Ni le classement par style, ni le stock, ni « un clic » n'apparaissent. Le besoin concret devient un « outil de conception » abstrait. |
| A02 | `recap-avant-opus.md` | « Mobile first signifie COMPRÉHENSION et maîtrise sur téléphone » | Fidèle à C064, mais jamais traduit en critère mesurable (touchers, contenu visible sans défiler). |
| A03 | `recap-avant-seconde-passe.md` | « leurs formulations précises sont des propositions, pas des citations utilisateur » | Bon marquage. Ces questions anticipées (NOLO, sour, raté…) restent des propositions dans la banque. |
| A04 | `recap-avant-seconde-passe.md` | « Les noms sont des illustrations ; aucun preset, écran ou règle dédiée uniquement au nom d'une recette/variété n'en découle. » | Fidèle à C013. Pourtant la base d'usage par style livrée ne couvre que les IPA (`src/data/hopStyleUsageBootstrap.json`). |
| A05 | `clarification-creativite.md` | « Cela ne choisit pas Claude comme moteur de l'app. » | Interprétation plausible, non confirmée par l'humain. |
| A06 | `clarification-creativite.md` | « L'origine du caractère banane n'est pas établie dans la demande » | Prudence d'agent. La question de l'humain (C057) reste entière. |
| A07 | #115 | « Chaque houblon porte une raison courte et un niveau de confiance » | Ajout d'agent, compatible avec PRODUCT.md (« refuse d'inventer un chiffre »). À confirmer à la porte A. |
| A08 | #115 | « profil aromatique, acides alpha, huiles, rôle (amérisant ou aromatique), stock et prix » | La liste des attributs comparés est d'agent ; l'humain n'a pas demandé le prix. |
| A09 | `prompt-session.md` § 6 | « Comparer 2 à 4 houblons demande 3 touchers au plus » | Rédigé par un agent, adopté par l'humain comme brief : il prime (D10). |
| A10 | `prompt-session.md` § 6 | « Les 5 premiers sont visibles sans défilement, avec la quantité en stock. » | Même statut que A09. |
| A11 | Titre de l'épopée #21 | « [EPIC][P0] V5.5 dans le vrai créateur de recette » | Le besoin du brasseur n'apparaît ni dans le titre ni dans les critères (constat de #115). |
| A12 | Titre de #29 | « V55-APP-01.2 — Appliquer le programme sans duplication ni perte de provenance » | Critère technique, sans question du brasseur ni geste mesuré. |
| A13 | `scripts/check-recipe-journey-ui.mjs` | « The native V5.5 hop workbench replaced the former comparison/simulation tools and the aromatic workshop of this step. » | Un test a acté la disparition de la comparaison et de la simulation, au lieu de les exiger. |

## Doublons retirés

- **127 messages répétés** d'une session à l'autre (même début de texte) ; 115
  ont été renvoyés dans Codex le 06.09 après avoir été tapés dans Claude du 03
  au 05.09 (par exemple M0040 → M0110, M0076 → M0114, M0077 → M0115). Le
  corpus garde la première occurrence et cite la copie en deuxième source
  (C026, C027, C029, C089, C115, C119, C122).
- **Relais d'agents** d'une décision déjà tapée par l'humain : M0742 (= M0741),
  M0744 (= M0743), M0753 (= M0750), M0754 (= M0751). Seul le message direct est
  cité.
- La citation C001 cite M0758 et sa première formulation M0746 (17.10, 17:31).
- **Textes collés** (106 objets marqués `collé` par les extracteurs) : briefs ou
  plans rédigés par une IA puis collés. Ils ne sont pas cités comme demandes.
