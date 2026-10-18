# Exigences retrouvées sur l'outil houblons (relecture phase 1)

Rédigé le 18.10.2026 · Mission #119 · Lecture seule des sources · Un seul fichier écrit.

## Périmètre, méthode et conventions

- **Chemins.** Base : `C:\Users\mrspa\Documents\Brasserie\work\`. `dépôt/` désigne `C:\Users\mrspa\.codex\worktrees\openai-clean-start\Brasserie\`. Abréviations de dossiers : `cadrage/` = `houblons-v5-cadrage-2026-09-29/` ; `realisation/` = `houblons-v5-realisation-2026-09-29/` ; `complement-carte-2026-10-01/` = `houblons-complement-carte-2026-10-01/`. Fichiers cités sans dossier : `brief-exact.md`, `brief-before-radar.md`, `brief-before-gemini.md` (dans `realisation/consultation-carte-01/`) ; `prompt-a.txt`, `proofs-c.txt` (dans `realisation/consultation-carte-team-04/`) ; `01-brief-utilisateur.md`, `10-addendum-radar-team-13.md` (dans `realisation/input-carte-21/`) ; `retours-demandes-nolo.txt` (dans `realisation/team-v55-final-01/`) ; `steering-barres-radar-2026-10-01.md` (dans `houblons-v5-supervision-astra-2026-09-29/v55-team-13/input/`) ; `brief-opus.md`, `gemini-catalogues-simulateur.md`, `observations-reference.md`, `clarification-en-attente-opus.md` (dans `complement-carte-2026-10-01/`).
- **Citations.** Copie exacte du fichier source, sans gras Markdown ni retours de ligne. `[…]` marque un passage coupé. Les espaces collés présents dans le fichier source (demande du 30.09) sont conservés tels quels.
- **Nature.** « parole directe » = texte entre guillemets dans le fichier source. « transcrit » = transcription d'agent, original absent (décision D6 du corpus). « relayé » = décision du brasseur transmise par le contrôleur. « reformulation » = texte d'agent sans guillemets autour de la demande.
- **Dates.** Date de l'en-tête ou du dossier. Pour les copies du 01.10, l'ordre suit la date de modification (indicatif) : `brief-exact.md` 11:08, `brief-before-radar.md` 11:12, `brief-before-gemini.md` 12:28, `input-carte-21/01-brief-utilisateur.md` 12:58, `prompt-a.txt` 13:04, `brief-opus.md` et `gemini-catalogues-simulateur.md` 20:41.
- **Statut face à la banque** (`docs/besoins/banque-de-questions.md`). `couverte (Qxx)` ; `partielle` (ce qui manque est dit) ; `absente`, avec son type : fonctionnelle, UX, méthode, concept ou rejet. La banque ne porte que sur les questions et sur l'exigence n° 0 : une règle de méthode n'y est donc pas « couverte ».
- **Corpus.** Le champ « Corpus » donne l'identifiant `Cxxx` quand la même citation figure dans `docs/besoins/corpus-demandes.md`.
- **Dédoublonnage.** L'entrée porte la copie la plus ancienne ; les autres chemins sont listés. Les douze copies de la transcription du 29.09 (`demandes-utilisateur.md`, 131 lignes) sont identiques à la version de `houblons-v5-cadrage-2026-09-29/` ; elles sont listées en annexe.
- **Sources lues.** En entier : `docs/besoins/banque-de-questions.md`, `docs/besoins/corpus-demandes.md`, `docs/research/hop-style-implementation.md`, `houblons-complement-carte-2026-10-01/*.md` (4 fichiers), `houblons-v5-realisation-2026-09-29/demande-v5-5-2026-09-30.md`, `houblons-v5-cadrage-2026-09-29/demandes-utilisateur.md` et `clarification-creativite.md`, `input-carte-21/01-brief-utilisateur.md`. Par lignes ciblées : les briefs `consultation-carte-01/`, `consultation-carte-team-04/prompt-a.txt` et `proofs-c.txt`, `input-carte-21/10-addendum-radar-team-13.md`, `input-c1-20/04-recap-v5.md`, `team-v55-final-01/retours-demandes-nolo.txt`, `docs/validation/houblons-refonte-visuelle-2026-09-28.md`, et le document de validation `houblons-v5-2026-09-29.md` (sous `houblons-v55-integration-app-2026-10-02/…/isolated-pre-a1/`). Par mots-clés seulement : les documents d'agents `avis-opus-*.md`, `recap-avant-*.md`, `ancrages-historiques.md`, `decision-opus-commun-04.md`, `feedback-*.md`. Leurs citations du brasseur renvoient à la transcription T1 ou à T2.
- **Exclus.** Les `*.artifacts` (copies), les captures, les journaux, les `node_modules`. Les paroles du journal (M0001–M0759) ne figurent que lorsque le corpus les cite.

## Résumé

- **Exigences retenues : 61.** Couvertes : 20 · partielles : 18 · absentes : 23.
- **Absentes (23)** : 7 fonctionnelles (outil), 2 UX ou représentation, 14 méthode, concept ou rejet.
- **Exigences sans trace dans les dossiers lus** : le stock (hors corpus, seules C028 et C101 existent, issues du journal). Le moteur de prédiction n'apparaît qu'en R61 (méthode) ; C162 et C163 viennent du journal.
- **Hors périmètre outil, exclus** : voir la section finale.

## Vérification des exemples donnés pour cette tâche

- **Lager / stout (« le style recherché doit davantage changer la lecture des écarts »).** Trouvé mot pour mot dans `consultation-carte-01/brief-exact.md:7` (identique à `brief-before-radar.md:7`) et dans `complement-carte-2026-10-01/brief-opus.md:15`. C'est une **reformulation d'agent**, sans guillemets : le brasseur n'y est pas cité directement. Voir R41.
- **Bascule Barres / Radar.** Trouvée. Citation directe entre guillemets dans `consultation-carte-01/brief-before-gemini.md:11` (01.10). Voir R45.
- **Carte « Territoire » (checkpoint-05/concept-2.html).** Trouvée. Le fichier existe : `houblons-v5-realisation-2026-09-29/explorations/checkpoint-05/concept-2.html`. « une sacrée dinguerie » est entre guillemets dans le brief. Le nom « Territoire » est celui des agents (`complement-carte-2026-10-01/observations-reference.md:1`, `houblons-v5-realisation-2026-09-29/feedback-territoire-hitboxes.md:1`), pas celui du brasseur. Voir R40.
- **Biotransformation et double impact des levures.** Trouvés, en reformulation (`brief-exact.md:7`). Voir R43.
- **« Dis où tu veux aller » (objectif d'arôme → voies proposées).** **Non trouvé comme parole du brasseur.** C'est le libellé d'interface de la maquette concept-2 : `houblons-v5-realisation-2026-09-29/qa/checkpoint-05/checkpoint-05-concept-2-390.txt:63`, `…/checkpoint-05-concept-2-1280.txt:63`, `houblons-v5-realisation-2026-09-29/input-creative-08/c2-variation-390.txt:73`, `houblons-v5-realisation-2026-09-29/consultation-carte-team-04/source-b.txt:77`. Le besoin voisin (cible déplaçable, voies proposées) est une observation d'agent : `observations-reference.md:9`. **À confirmer auprès du brasseur** avant d'en faire une exigence.

## Entrées

### 12.09 et 28.09

**R01 · 2026-09-12 · Classer les houblons par style, pas par goût** · couverte (Q01, Q21) · Corpus C011
- Citation (corpus, journal Codex, hors dossiers lus) : « Les houblons sont classés par goût mais c'est complément faux ça doit être classés par style »
- Source : `docs/research/hop-style-implementation.md:13` (reformulation : « Catalogue filtré par famille de style »)
- Nature : parole directe (corpus) ; reformulation (dossiers lus)

**R02 · 2026-09-28 (reformulation) / 2026-09-29 (verbatim) · Reprendre la démarche Levure pour tout le parcours Houblons** · absente (méthode) · Corpus C046
- Citation : « Je veux faire la même chose que l'on a fait pour les levures avec les houblons. Visuellement il y a pas mal de problème mais là les problèmes sont aussi métier. »
- Source : `cadrage/demandes-utilisateur.md:10–11` (verbatim) ; `dépôt/docs/validation/houblons-refonte-visuelle-2026-09-28.md:412–413` (« Demande du 28 septembre 2026 : reprendre la démarche Levure pour tout le parcours Houblons. », reformulation)
- Nature : transcrit ; reformulation (28.09)

**R03 · 2026-09-28 · Décisions du brasseur que l'outil doit couvrir** · partielle
- Citation (reformulation) : « Décisions brasseur : choisir une référence/forme/lot, répartir les ajouts et régler leurs conditions, comprendre amertume et caractère, comparer un essai, corriger, appliquer explicitement, sauvegarder et retrouver les valeurs. »
- Source : `dépôt/docs/validation/houblons-refonte-visuelle-2026-09-28.md:424–426`
- Nature : reformulation
- Statut : Q17, Q18, Q24, Q25 couvrent le réglage et la dose. Manque : « sauvegarder et retrouver les valeurs », absent de la banque.

### 29.09 · Transcription T1 (`cadrage/demandes-utilisateur.md`) et T2

**R04 · 2026-09-29 · Maquettes multiples, disruption, intervention de Claude** · absente (méthode) · Corpus partiel (C066)
- Citation : « Je voudrais faire comme pour les levures plusieurs maquette où l'on encourager le changement et la disruption avec notamment l'intervention de Claude. »
- Source : `cadrage/demandes-utilisateur.md:12–13`
- Nature : transcrit

**R05 · 2026-09-29 · Outils tiers, compréhension visuelle maximale** · absente (méthode) · Corpus C047
- Citation : « On utilise les meilleures outils, tool, third party, library, et autres on se limite pas à ce qu'il y a en place. On maximise la compréhension visuel. »
- Source : `cadrage/demandes-utilisateur.md:13–15`
- Nature : transcrit

**R06 · 2026-09-29 · UX/UI boosters, mobile first, utilisable sur desktop** · absente (UX) · Corpus partiel (C091, C098, autres messages)
- Citation : « On utilise aussi les UX UI booster et on est toujours mobile first même si l'app doit rester utilisable sur desktop. »
- Source : `cadrage/demandes-utilisateur.md:15–17` ; copie `houblons-v5-realisation-2026-09-29/team-v55-final-01/retours-demandes-nolo.txt:99`
- Nature : transcrit
- Statut : la banque ne contient ni « booster » ni « desktop » (mesure à 390 × 844 seulement)

**R07 · 2026-09-29 · Trois versions trop semblables, pas assez de prise de risque** · absente (rejet de concept) · Corpus absent
- Citation : « les 3 version, alors que j'en avais demandé 4 sont très semblable, pas beaucoup de prise de risque, quasiment les 3 même. »
- Source : `cadrage/demandes-utilisateur.md:22–23`
- Nature : transcrit

**R08 · 2026-09-29 · L'IBU ne doit pas dominer ; palette de saveur et de chimie** · partielle · Corpus C048
- Citation : « elles mettent les 3 les ibu ultra en avant alors que le hublon c'est pas QUE ça les ibu sont qu'une partie notament dans les ipa, c'est toute une palette de saveur et de chimie. C'est des profils aromatique.. »
- Source : `cadrage/demandes-utilisateur.md:23–25`
- Nature : transcrit
- Statut : Q16 (profil) et Q20 (profil total) couvrent la palette. Manque : l'IBU n'est pas écarté de la vue par défaut.

**R09 · 2026-09-29 · Même type de visualisation dans les trois versions** · absente (UX) · Corpus absent
- Citation : « les 3 utilises quasiment tous les même moyen de visu. »
- Source : `cadrage/demandes-utilisateur.md:26`
- Nature : transcrit

**R10 · 2026-09-29 · Unités mélangées (g/L et IBU)** · partielle · Corpus C049
- Citation : « problème majeurs avec les unité, ça mélange g/l avec ibu, il faudrait le total ibu simulé avec le dryhop mais c'est pas la métrique la plus importante. »
- Source : `cadrage/demandes-utilisateur.md:27–28`
- Nature : transcrit
- Statut : Q15 couvre le total IBU dry hop compris. Manquent : la séparation des unités et le rang secondaire de l'IBU.

**R11 · 2026-09-29 · Tout revoir, quatre maquettes très différentes** · absente (méthode) · Corpus C066
- Citation : « TOUT DOIT ÈTRE revu, je veux vraiment 4 maquette très différentes, avec chaque fois des risques et disruption prises. pour la levure on a vraiment très récompensé la créativité, ça avait bien fonctionné »
- Source : `cadrage/demandes-utilisateur.md:30–32`
- Nature : transcrit

**R12 · 2026-09-29 · Une cinquième et une sixième version** · absente (méthode) · Corpus C159
- Citation : « Faire une 5 et 6 en s'inspirant des meilleurs, aussi pour les cas de figure plus classique de la vie de tout les jours. »
- Source : `cadrage/demandes-utilisateur.md:36–37`
- Nature : transcrit

**R13 à R24 · 2026-09-29 · Florilège de questions (T1, L36–67)**

| ID | Citation (verbatim) | Source | Statut banque · Corpus |
|---|---|---|---|
| R13 | « Qu'est-ce que je gagne dans ma light lager à remplacer Saaz par Styrian gold https://beermaverick.com/hop/styrian-golding/ » | L37–38 | couverte (Q05) · C050 |
| R14 | « Ou dans ma stout si j'amèrise avec nuget est-ce que je suis pas trop résineux ou au contraire pas assez et je peux aussi ajouter autre chose. » | L40–41 | couverte (Q04) · C051 |
| R15 | « Hyperboost, cryo hops... » | L43 | couverte (Q14) · C052 |
| R16 | « Est-ce que dans ma blanche je peux faire du dryhopping ai j'ajoute 20g de moins dans le moût ? » | L45 | couverte (Q12) · C053 |
| R17 | « Je voudrais une Lager ultra juicy, hyper aromatisé, sans Quelle soit amère. J'ai quoi comme choix. » | L47 | couverte (Q09) · C054 |
| R18 | « J'ai ce houblons conseillé dans ma recette mais je l'ai actuellement pas disponible, avec quoi le mettre. Quesque je gagne perds. » | L49–50 | couverte (Q06) · C055 |
| R19 | « Je veux absolument éviter le côté sapins, résine, mais je veux quand même un haut taux d'amertum sans forcément le côté tropicale. » | L52–53 | couverte (Q07) · C056 |
| R20 | « Je veux une blanche ultra tropicale qui de Marie bien avec mon goût de banane. » | L55 | couverte (Q08) · C057 |
| R21 | « Quand avec ma levure, utiliser au mieux mon houblons et lesquels pour cette super neipa. » | L57 | couverte (Q13) · C058 |
| R22 | « Ma patry stout est trop sucré comment compensé ça avec mon houblons. » | L59 | couverte (Q10) · C059 |
| R23 | « J'ai un profil de bière hyper particulier. Je veux une bière de Champagne, sucré, très fleural, légère amertume. Est-ce que la bio transformation peut m'aider là dedans. » | L61–62 | couverte (Q11, état partiel) · C060 |
| R24 | « Voilà un florilège de questions auxquelles mon app doit répondre. […] Manque encore la partie nolo, d'autres style, sour, houblon maison, hyper profile, rattrapage, raté ect ect ect... » | L64–67 | couverte (Q16, Q21, Q26 à Q29) · C061 |

Nature commune : transcrit. Les copies sont listées en annexe.

**R25 · 2026-09-29 · 80 % des cas simples, et accès au cas difficile** · couverte (Exigence n° 0 ; cas « 80 % » et « approfondi ») · Corpus C062
- Citation : « je veux que dans le 80% des cas où c'est, je sais déjà ce que je veux car j'ai trouvé où je fine tune ma recette, ça soit très pratique, pas surchargé, hyper lisible. Mais que son je veux aller dans le dur, comprendre vraiment, confronté mes idées, choisir mais aussi avoir le choix et que on me propose les choix, soit possible. »
- Source : `cadrage/demandes-utilisateur.md:70–73`
- Nature : transcrit

**R26 · 2026-09-29 · Ne pas limiter les maquettes, tout créer** · absente (méthode) · Corpus C160
- Citation : « et ça doit pas limité les maquettes, loin de là, on peut TOUT créé et justement il faut pas de limiter !!! »
- Source : `cadrage/demandes-utilisateur.md:77–78`
- Nature : transcrit

**R27 · 2026-09-29 · Repartir de zéro avec trois nouvelles maquettes** · absente (concept) · Corpus absent
- Citation : « Je pense que on peut presque répartir de 0 avec 3 nouvelle, peut être laissé les 4 nouvelle mais en refaire une v3 peut-être même dans une nouvelle session ? »
- Source : `cadrage/demandes-utilisateur.md:80–81`
- Nature : transcrit

**R28 · 2026-09-29 · Répondre à TOUTES les questions, avec un usage pratique** · couverte (Exigence n° 0) · Corpus C063
- Citation : « Mais j'ai pas l'impression que ces visuels permettent réellement de répondre à TOUTES mes questions ??? Tout en aillant un usage très pratique et aisé dans la cas d'usage standard »
- Source : `cadrage/demandes-utilisateur.md:86–88`
- Nature : transcrit

**R29 · 2026-09-29 · « Tu as compris que ça doit pouvoir répondre à TOUTES mes questions ! »** · couverte (Exigence n° 0) · Corpus C157
- Source : `cadrage/demandes-utilisateur.md:90`
- Nature : transcrit

**R30 · 2026-09-29 · Mobile : compréhensible, simple seulement pour le cas simple** · couverte (Exigence n° 0 ; Q03 pour le geste simple) · Corpus C064
- Citation : « La simplicité mobile n'est pas un vrai critères... Ça doit être compréhensible sur mobile, pas forcément simple, ça doit être simple dans le cas d'usage simple... »
- Source : `cadrage/demandes-utilisateur.md:92–93`
- Nature : transcrit

**R31 · 2026-09-29 · Les V2 sont refusées : pas utilisables** · absente (rejet de concept) · Corpus C065
- Citation : « je viens de testé les v2, et c'est bien ce que je craignais. c'est pas utilisable. il y a des bonnes idées mais sur ma liste de question je crois que aucune n'est répondu »
- Source : `cadrage/demandes-utilisateur.md:99–100`. Le corpus écrit « questions » au lieu de « question ». La variante de `dépôt/docs/validation/houblons-refonte-visuelle-2026-09-28.md:12` est : « c'est pas utilisable [...] sur ma liste de questions [...] aucune n'est répondue ».
- Nature : transcrit. L'exigence de réponse est couverte par l'exigence n° 0.

**R32 · 2026-09-29 · « stop v2 »** · absente (rejet de concept) · Corpus C161
- Citation : « stop v2, je pense que il ya pas grand chose à gardé de ces maquettes »
- Source : `cadrage/demandes-utilisateur.md:102`. Variante normalisée dans `dépôt/docs/validation/houblons-refonte-visuelle-2026-09-28.md:4` : « stop v2, je pense qu'il n'y a pas grand-chose à garder de ces maquettes ».
- Nature : transcrit

**R33 · 2026-09-29 · Aucune maquette ne fait mieux que les sites de référence** · partielle · Corpus C068
- Citation : « mais j'ai l'impression que aucune des maquette fait mieux que https://beermaverick.com/your-hop-substitutions-are-wrong/ https://beermaverick.com/hops/hop-comparison-tool/?hops=sabro,bravo, ou autre alternative de site... »
- Source : `cadrage/demandes-utilisateur.md:104–107`
- Nature : transcrit
- Statut : Q06 cite la méthode Beer Maverick. Manque : l'exigence de faire mieux que ces sites.

**R34 · 2026-09-29 · Les sites répondent bien mais pas à toutes les questions** · couverte (Exigence n° 0) · Corpus C069
- Citation : « ces site sont bien mais ne répondes pas à TOUTES mes question. »
- Source : `cadrage/demandes-utilisateur.md:109–110`
- Nature : transcrit

**R35 · 2026-09-29 · Références de substitution : l'idée reste, la fonction ne marche pas** · partielle · Corpus C158
- Citation : « ne semble pas fonctionner actuellement mais c'est l'idée »
- Source : `cadrage/demandes-utilisateur.md:115–118` (références ajoutées : `beermaverick.com/hop/citra/`, `beermaverick.com/hops/find-similar-hops-substitute/`)
- Nature : transcrit
- Statut : Q06 et Q16 couvrent l'objet. Manque : une fonction de substitution qui fonctionne, non posée comme exigence.

**R36 · 2026-09-29 · Améliorer compréhension, usage et visualisation des références** · partielle · Corpus C070
- Citation : « oui voilà l'idée est là mais le but est de l'amélioré tantôt en terme de compréhension, utilisation, visualisation ect »
- Source : `cadrage/demandes-utilisateur.md:120–121`
- Nature : transcrit
- Statut : même manque que R33 (faire mieux que les références).

**R37 · 2026-09-29 · Les agents sont bridés par l'app actuelle (T2)** · absente (règle de conception) · Corpus C067 (partielle)
- Citation : « les agents se bride sur la créativité et ont trop tendence à utilisé l'app de base comme reférence alors que non justement... que il y a encore des lacune technique et que ce qu'il y a en place ne doit pas faire foie. PAS DU TOUT même. »
- Source : `cadrage/clarification-creativite.md:5–9`
- Nature : transcrit (T2)

**R38 · 2026-09-29 · Jeu de données inventé pour libérer la créativité (T2)** · absente (fiction de conception) · Corpus absent
- Citation : « peut être même "inventé" un jeu de donnée pour ne pas bridé la créativité »
- Source : `cadrage/clarification-creativite.md:11`
- Nature : transcrit (T2)
- Note : tension à arbitrer avec le journal C111 (03.09) : « rien ne doit être inventé ».

### 30.09

**R39 · 2026-09-30 · Une nouvelle maquette V5.5 avec les meilleures idées** · absente (concept) · Corpus absent
- Citation : « une encore nouvelle maquette avec les meilleures idées de toutes dans laV5, genre uneV5.5 mais pas de nouvelles sessions. Juste plus d’usage deClaudeOpus5.5 »
- Source : `houblons-v5-realisation-2026-09-29/demande-v5-5-2026-09-30.md:3–6` (espaces collés dans la source). Copie : `houblons-v55-integration-app-2026-10-02/…/isolated-pre-a1/docs/validation/houblons-v5-2026-09-29.md:2332` (reprise en reformulation d'agent, isolated-r2 et isolated-r3 identiques).
- Nature : relayé (décision directe citée par le contrôleur)

### 01.10 · Briefs complémentaires (carte, Barres/Radar, Gemini)

**R40 · 2026-10-01 · Carte « Territoire » (concept-2) appréciée et gardée en complément** · absente (fonctionnelle : exploration) · Corpus absent
- Citation : « une sacrée dinguerie », regret d'avoir perdu ce concept. Il veut cet outil en complément pour l'analyse large spectre, revisité […]
- Source : `houblons-v5-realisation-2026-09-29/consultation-carte-01/brief-exact.md:7` (la plus ancienne ; identique à `brief-before-radar.md:7`). Copies : `brief-before-gemini.md:7`, `input-carte-21/01-brief-utilisateur.md:7`, `houblons-complement-carte-2026-10-01/brief-opus.md:15`, `houblons-v5-supervision-astra-2026-09-29/v55-team-13/input/steering-barres-radar-2026-10-01.md:7`, `houblons-v5-realisation-2026-09-29/consultation-carte-team-04/prompt-a.txt` et autres copies.
- Acquis décrits (reformulation, `houblons-complement-carte-2026-10-01/observations-reference.md:9–12`) : lecture spatiale des matières, de la cible, de la bière et du mélange ; familles à viser ou éviter ; creuset manipulable ; passage d'une exploration hors recette à une copie de bière. Exploration sans recette : `realisation/team-v55-final-01/retours-demandes-nolo.txt:223–226` (interprétation d'agent).
- Nature : relayé (citation directe) ; reformulation (acquis)
- Statut : aucune question de la banque sur l'exploration hors recette (Q16 partiel). Non posé : la carte comme outil complémentaire.

**R41 · 2026-10-01 · Le style et la bière changent la lecture des écarts (lager / stout)** · partielle · Corpus absent
- Citation : « le style recherché doit davantage changer la lecture des écarts : des variations infimes entre deux houblons de lager peuvent compter davantage que dans une stout. »
- Source : `brief-exact.md:7` ; `complement-carte-2026-10-01/brief-opus.md:15` ; `complement-carte-2026-10-01/clarification-en-attente-opus.md:7` (reformulation contrôleur : « Donner du poids au style recherché et au contexte réel »)
- Nature : reformulation (pas de guillemets)
- Statut : Q01 et Q21 classent par style ; Q02 montre « seulement les écarts qui comptent ». Manque : la granularité des écarts dépend du style et de la bière réelle. Le brief précise « ne pas recopier la règle "lager = ×3 / stout = ×0,2" » (`brief-opus.md:49`) ; origine de cette règle non retrouvée dans les dossiers lus.

**R42 · 2026-10-01 · Granularité fine entre houblons proches (IPA)** · partielle · Corpus absent
- Citation : « une IPA appelle un autre focus du graphe et une granularité beaucoup plus fine entre houblons proches. »
- Source : `brief-exact.md:7` ; `complement-carte-2026-10-01/observations-reference.md:18` (« Départager des houblons proches »)
- Nature : reformulation
- Statut : Q23 (IPA) et Q02 (écarts). Manque : nuances fines entre matières proches, sans granularité inventée.

**R43 · 2026-10-01 · Biotransformation et double impact des levures** · partielle · Corpus partiel (C040, C060)
- Citation : « la biotransformation et le double impact des levures sont trop écartés, alors qu'ils sont essentiels. »
- Source : `brief-exact.md:7` ; `complement-carte-2026-10-01/brief-opus.md:48` (expression fermentaire propre, transformation des précurseurs, conditions, pertes, hop creep)
- Nature : reformulation
- Statut : Q11, Q13, Q19. Manquent : expression fermentaire propre et transformation distinguées, pertes et extraction, hop creep (aucun des trois n'est dans la banque).

**R44 · 2026-10-01 · Les leviers levure valent aussi dans les réponses usuelles** · absente (fonctionnelle) · Corpus absent
- Citation : « Ces leviers appartiennent aussi aux réponses usuelles de V5.5, pas uniquement à la carte. »
- Source : `complement-carte-2026-10-01/clarification-en-attente-opus.md:6` ; `complement-carte-2026-10-01/observations-reference.md:36` (« ils ne doivent pas être confinés à un outil expert optionnel »)
- Nature : reformulation (contrôleur)
- Statut : Q13 et Q19 ne traitent que les cas approfondis (NEIPA, combinaisons). Le cas courant n'est pas couvert.

**R45 · 2026-10-01 · Choix Barres ou Radar pour une même comparaison** · partielle · Corpus absent (C102, C103 sur le spidergraph mobile, journal 08–09.09)
- Citation : « Les comparaisons avec un affichage de type spidergraph ont complètement été mis de côté, pourquoi ?? Je veux pouvoir avoir les deux visuels possible, un par barre type intervalle de confiance et un type spidergraph/Radar chart. Pouvoir passer de l'un à l'autre, pas avoir les deux à la fois forcément. »
- Source : `consultation-carte-01/brief-before-gemini.md:11` (plus ancienne citation directe, 12:28). Copies : `input-carte-21/01-brief-utilisateur.md:11` ; `complement-carte-2026-10-01/brief-opus.md:19` ; `steering-barres-radar-2026-10-01.md:11` ; `consultation-carte-team-04/proofs-c.txt:336`.
- Nature : relayé (citation directe dans le brief)
- Statut : Q02 couvre la comparaison de 2 à 4 houblons. Manque : le choix de rendu. C102 et C103 demandaient déjà un spidergraph visible sur mobile.

**R46 · 2026-10-01 · Mêmes données et réglages quand on change de vue** · absente (fonctionnelle) · Corpus absent
- Citation : « Même sélection, même contexte, mêmes critères/axes actifs, mêmes valeurs et mêmes sources en changeant de vue. Ne pas recalculer une autre décision ni perdre un mélange, un réglage ou une sélection lors de la bascule. »
- Source : `consultation-carte-01/brief-before-gemini.md:16` (copie `input-carte-21/01-brief-utilisateur.md:16` ; `10-addendum-radar-team-13.md:9`)
- Nature : reformulation (exigence acquise, rédigée par l'agent)

**R47 · 2026-10-01 · Échelles communes par axe, ordre stable, aucune fusion IBU / g/L / intensités** · absente (fonctionnelle) · Corpus absent
- Citation : « Les échelles restent communes entre candidats pour chaque axe et l'ordre des axes est stable. L'affinement des nuances demandé pour l'IPA doit rester disponible dans les deux modes. Ne pas fusionner arbitrairement IBU, g/L et intensités sensorielles sur une échelle sans sens. »
- Source : `consultation-carte-01/brief-before-gemini.md:17` (copies `input-carte-21/01-brief-utilisateur.md:17`, `10-addendum-radar-team-13.md:10`)
- Nature : reformulation

**R48 · 2026-10-01 · Plages honnêtes : nature réelle, pas de 95 %, inconnue non nulle** · partielle · Corpus absent
- Citation : « Montrer la nature réelle d'une plage (estimation, variabilité, fourchette simulée ou intervalle statistique justifié) ; l'expression utilisateur « type intervalle de confiance » demande une représentation avec plages, pas l'invention d'un niveau de confiance de 95 %. Une valeur inconnue ne devient ni zéro ni un point certain pour fermer un radar. »
- Source : `consultation-carte-01/brief-before-gemini.md:18` (copies `input-carte-21/01-brief-utilisateur.md:18`, `10-addendum-radar-team-13.md:11`)
- Nature : reformulation
- Statut : Q02 (plages des fournisseurs) et la règle générale de la banque (pas de chiffre inventé). Manque : la règle « inconnue ≠ zéro » dans les graphes.

**R49 · 2026-10-01 · Bascule lisible et manipulable, mobile comme desktop** · absente (fonctionnelle) · Corpus absent
- Citation : « Prévoir une bascule lisible et manipulable sur mobile et desktop. » Et : « L'apparition des deux boutons seule ne prouve pas la capacité. »
- Source : `consultation-carte-01/brief-before-gemini.md:19` ; `input-carte-21/01-brief-utilisateur.md:19–20` ; `10-addendum-radar-team-13.md:12, 14`
- Nature : reformulation

**R50 · 2026-10-01 · Gemini doit pouvoir créer des entités absentes, et enrichir les existantes** · absente (fonctionnelle) · Corpus absent
- Citation : « Gemini doit pouvoir enrichir mais aussi ajouter des nouvelles données ». Et (reformulation) : « Les deux capacités sont obligatoires et distinctes : création d'une entité absente ET enrichissement d'une entité existante. »
- Source : `consultation-carte-team-04/prompt-a.txt:76` (la plus ancienne, 13:04). Copie : `complement-carte-2026-10-01/gemini-catalogues-simulateur.md:9`.
- Nature : relayé (confirmation explicite, citée)
- Statut : aucune question de la banque sur la création ou l'enrichissement de catalogues. Q29 ne traite que l'usage d'un houblon maison.

**R51 · 2026-10-01 · Une donnée extrapolée reste une estimation attribuée** · partielle · Corpus absent
- Citation : « Une donnée extrapolée peut être conservée comme estimation/hypothèse attribuée ; elle ne remplace pas silencieusement la valeur documentaire ou mesurée. »
- Source : `complement-carte-2026-10-01/gemini-catalogues-simulateur.md:23`
- Nature : reformulation
- Statut : la règle générale de la banque (pas de chiffre inventé, inconnue visible) couvre le principe. Manque : la conservation de l'estimation ajoutée par Gemini, avec sa source contradictoire.

**R52 · 2026-10-01 · « Toutes leurs données » : garder l'information utile, sans fausses mesures** · partielle · Corpus absent · incertain
- Citation : « Toutes leurs données » signifie conserver et rendre exploitables les informations disponibles, pas remplir des champs inconnus avec de fausses mesures.
- Source : `complement-carte-2026-10-01/gemini-catalogues-simulateur.md:21`
- Nature : reformulation. Les guillemets autour de « Toutes leurs données » sont dans le texte d'agent ; leur origine (phrase du brasseur ?) n'est pas retrouvée.
- Statut : exigence n° 0 (aucun chiffre inventé). Manque : la conservation des informations brutes par entrée.

**R53 · 2026-10-01 · Outils métier exécutables par Gemini et par l'aide au brasseur** · absente (fonctionnelle) · Corpus absent
- Citation : « Les outils doivent être déclarés ET exécutables par le vrai chemin d'orchestration de l'application ; une fonction backend isolée ou une description dans un prompt ne suffit pas. »
- Source : `complement-carte-2026-10-01/gemini-catalogues-simulateur.md:27`. Code cité (non vérifié) : `src/domain/brewerTools.ts`, `functions/src/brewerHarness.ts` (`gemini-catalogues-simulateur.md:43–44`).
- Nature : reformulation

**R54 · 2026-10-01 · Simulateur qui extrapole sans donnée exacte (extrapolation autorisée)** · partielle · Corpus partiel (C023, C024)
- Citation : « Il demande en outre un simulateur pour les additions, houblons, levures, autres contributions et biotransformation, y compris lorsque les données de la combinaison n'existent pas : extrapoler à partir des données disponibles. » Et : « Autorisation utilisateur explicite d'extrapolation : ce n'est pas une permission d'appeler le résultat « mesuré », mais ce n'est pas non plus un motif pour s'en tenir à un avertissement ou à des conseils purement génériques. »
- Source : `complement-carte-2026-10-01/gemini-catalogues-simulateur.md:11, 33` ; `complement-carte-2026-10-01/brief-opus.md:64, 66` (« L'utilisateur autorise précisément l'extrapolation »)
- Nature : reformulation (autorisation rapportée par le contrôleur)
- Statut : Q19 et Q20 couvrent les combinaisons et le profil total. Manquent : hypothèses modifiables, comparaison de scénarios, confrontation observation / prédiction.

**R55 · 2026-10-01 · Principe de substitution étendu aux autres fonctions** · partielle · Corpus absent
- Citation : « Il cite le principe d'un algorithme de substitution de houblon comme niveau d'aide à étendre aux autres fonctions et demande d'examiner cela avec Claude. »
- Source : `complement-carte-2026-10-01/gemini-catalogues-simulateur.md:11, 39`
- Nature : reformulation
- Statut : Q06 (substitution) et Q18 (dose). Non posé : l'extension aux autres fonctions.

**R56 · 2026-10-01 · Refus posés par le contrôleur** · partielle · Corpus absent
- Citation : « Refus : zoom qui invente une granularité absente, coefficient uniforme de style, confusion levure/bio/extraction/pertes, promesse aromatique non étayée, carte isolée sans geste vers décision. »
- Source : `houblons-v55-integration-app-2026-10-02/final-fixes-2026-10-04/replacement-20261006/contracts/isolated-pre-a1/docs/validation/houblons-v5-2026-09-29.md:2714–2716` (copies isolated-r2 et isolated-r3, mêmes numéros de ligne). Bloc daté « Nouvelle demande : carte complémentaire / levure / contexte — 1er octobre » (L2700).
- Nature : reformulation (contrôleur)
- Statut : la règle « pas de chiffre inventé » couvre une partie. Manquent : le refus d'un coefficient par style et la « carte isolée sans geste vers décision ».

**R57 · 2026-10-01 (synthèse d'agent) · Trois résultats à réussir ensemble** · partielle · Corpus absent
- Citation : « Trois résultats sont à réussir ENSEMBLE : usage courant pratique, réponses à toutes les questions et qualité de connaissance/comparaison/substitution au moins à la hauteur des références, améliorée en compréhension, usage et visualisation. »
- Source : `team-v55-final-01/retours-demandes-nolo.txt:116–118`
- Nature : reformulation (synthèse de l'agent sur les demandes T1)
- Statut : exigence n° 0 couvre usage et réponses. Non posé : la qualité au niveau des références (C068 à C070).

**R58 · 2026-10-01 (synthèse d'agent) · Conséquences d'un réglage perceptibles** · couverte (Q17) · Corpus absent
- Citation : « Les conséquences pertinentes d'un réglage doivent être perceptibles, pas seulement la valeur du champ modifié. »
- Source : `team-v55-final-01/retours-demandes-nolo.txt:90–91`
- Nature : reformulation

**R59 · 2026-10-01 (synthèse d'agent) · Contenu attendu de chaque réponse (11 questions)** · couverte (formes de réponse des Q04 à Q13, Q18, Q22)
- Citation : « Ce que chaque réponse doit effectivement contenir » ; exemple de ligne : « Différences pertinentes pour le rôle de l'ajout, ce qui serait conservé/gagné/perdu, adaptation proposée et choix applicable. »
- Source : `team-v55-final-01/retours-demandes-nolo.txt:121–148`
- Nature : reformulation

**R60 · 2026-10-01 (synthèse d'agent) · Ne pas cloner un site concurrent** · partielle · Corpus partiel (C068 à C070)
- Citation : « Il ne s'agit pas de finir d'abord un clone de site puis d'ajouter le contexte. »
- Source : `team-v55-final-01/retours-demandes-nolo.txt:119`
- Nature : reformulation
- Statut : la banque ne fixe pas ce critère de qualité (voir R33 à R36).

**R61 · 2026-10-01 (synthèse d'agent) · Maquettes d'abord, moteur complet ensuite** · absente (méthode) · Corpus absent
- Citation : « Dans les maquettes, les données de conception et réponses simulées permettent de montrer cette expérience même si le moteur réel manque. » Et : « Le moteur complet de production vient ensuite. »
- Source : `team-v55-final-01/retours-demandes-nolo.txt:91, 114`
- Nature : reformulation

## Annexe : copies identiques de la transcription T1 (131 lignes, aucune différence)

- `houblons-v5-realisation-2026-09-29/inputs/demandes-utilisateur.md`
- `houblons-v5-realisation-2026-09-29/input-claude-05/inputs/demandes-utilisateur.md`
- `houblons-v5-realisation-2026-09-29/input-creative-06/demandes-utilisateur.md`
- `houblons-v5-realisation-2026-09-29/input-creative-07/demandes-utilisateur.md`
- `houblons-v5-realisation-2026-09-29/input-creative-08/demandes-utilisateur.md`
- `houblons-v5-realisation-2026-09-29/input-creative-10/demandes-utilisateur.md`
- `houblons-v5-realisation-2026-09-29/input-creative-12/demandes-utilisateur.md`
- `houblons-v5-realisation-2026-09-29/input-v5-5-14/demandes-utilisateur.md`
- `houblons-v5-realisation-2026-09-29/input-c1-20/02-demandes-utilisateur.md`
- `houblons-v5-realisation-2026-09-29/input-c3-19/01-demandes-utilisateur.md`
- `houblons-v5-realisation-2026-09-29/input-c3-22/01-01-demandes-utilisateur.md`
- `houblons-v5-realisation-2026-09-29/input-v5-5-17/01-demandes-utilisateur.md`

## Exclus (hors outil : méthode, comptes, quotas, hébergement)

- T1 `cadrage/demandes-utilisateur.md:17` « On va commencer par la partie visuel puis ensuite on ira sur la partie technique. » : ordre de projet.
- T1 `:95` « Peut être un peu plus d'usage Claude ? Et un meilleur suivi de ASTRA ? » ; `:109–113` (« Faire une v5 d'une fresh session… », « Fait moi un recap… ») ; `:126` « regarde ça avec opus 5.5 avant le cadrage… » : processus d'équipe.
- `houblons-v5-realisation-2026-09-29/demande-v5-5-2026-09-30.md:8–55` : ordre de travail, comptes, sessions, quotas (sauf R39).
- `houblons-v55-integration-app-2026-10-02/…/isolated-pre-a1/docs/validation/houblons-v5-2026-09-29.md:2579` « Gaëtan exige les deux comptes actifs en parallèle sur lots indépendants » : comptes.
- `houblons-v5-realisation-2026-09-29/post-merge-fixes-2026-10-04/quota-economy/heartbeat-full-reference-20261004.txt:41` ; `houblons-v5-realisation-2026-09-29/etat-courant.md:1187` : quotas.
- `dépôt/docs/validation/houblons-refonte-visuelle-2026-09-28.md:797` « c'est pas un problème d'exposer un url comme ça ? » : publication.
- `houblons-v5-realisation-2026-09-29/feedback-first-active.md:20` « Je veux une lager plus juicy, pas amère… » : saisie de test QA, pas une parole du brasseur.
- Revues Astra E1 à E6 (`houblons-v5-cadrage-2026-09-29/avis-opus-5-5.md`, lignes 17 à 49) : citations du brasseur déjà présentes dans T1, aucune exigence nouvelle.

## Tableau récapitulatif

| ID | Résumé | Statut |
|---|---|---|
| R01 | Classer les houblons par style, pas par goût | couverte (Q01, Q21) |
| R02 | Démarche Levure appliquée à tout le parcours houblons | absente (méthode) |
| R03 | Décisions brasseur à couvrir par l'outil | partielle |
| R04 | Maquettes multiples, disruption, intervention de Claude | absente (méthode) |
| R05 | Outils tiers, compréhension visuelle maximale | absente (méthode) |
| R06 | UX boosters, mobile first, utilisable sur desktop | absente (UX) |
| R07 | Trois versions trop semblables, risque insuffisant | absente (rejet) |
| R08 | IBU ne doit pas dominer, palette saveur-chimie | partielle |
| R09 | Même type de visualisation dans toutes les versions | absente (UX) |
| R10 | Unités g/L et IBU mélangées, total IBU | partielle |
| R11 | Tout revoir, quatre maquettes très différentes | absente (méthode) |
| R12 | Une cinquième et une sixième version | absente (méthode) |
| R13 | Lager : Saaz remplacé par Styrian Golding | couverte (Q05) |
| R14 | Stout au Nugget : trop résineuse ? | couverte (Q04) |
| R15 | Hyperboost et Cryo Hops | couverte (Q14) |
| R16 | Blanche : dry hop avec 20 g en moins | couverte (Q12) |
| R17 | Lager ultra juicy, non amère | couverte (Q09) |
| R18 | Houblon indisponible : remplacement, gain et perte | couverte (Q06) |
| R19 | Amertume haute sans résine ni tropical | couverte (Q07) |
| R20 | Blanche tropicale qui accompagne la banane | couverte (Q08) |
| R21 | NEIPA : levure et houblon, quel moment | couverte (Q13) |
| R22 | Pastry stout trop sucrée : compenser au houblon | couverte (Q10) |
| R23 | Bière de Champagne : biotransformation utile ? | couverte (Q11, partielle) |
| R24 | Florilège : NOLO, sour, maison, profils, raté | couverte (Q16, Q21, Q26 à Q29) |
| R25 | 80 % pratique, cas difficile accessible | couverte (exigence n° 0) |
| R26 | Ne pas limiter les maquettes, tout créer | absente (méthode) |
| R27 | Repartir de zéro avec trois nouvelles maquettes | absente (concept) |
| R28 | Répondre à toutes les questions, usage pratique | couverte (exigence n° 0) |
| R29 | Doit répondre à toutes les questions | couverte (exigence n° 0) |
| R30 | Mobile : compréhensible, simple pour le cas simple | couverte (exigence n° 0) |
| R31 | V2 refusées : pas utilisables | absente (rejet) |
| R32 | « stop v2 » : peu à garder | absente (rejet) |
| R33 | Aucune maquette ne fait mieux que les sites | partielle |
| R34 | Sites bons mais pas à toutes les questions | couverte (exigence n° 0) |
| R35 | Références de substitution : l'idée reste | partielle |
| R36 | Améliorer compréhension, usage, visualisation | partielle |
| R37 | Agents bridés par l'app actuelle | absente (règle de conception) |
| R38 | Jeu de données inventé pour la créativité | absente (fiction de conception) |
| R39 | Maquette V5.5 avec les meilleures idées | absente (concept) |
| R40 | Carte concept-2 appréciée, outil complémentaire | absente (fonctionnelle) |
| R41 | Lager vs stout : le style change la lecture des écarts | partielle |
| R42 | IPA : granularité fine entre houblons proches | partielle |
| R43 | Biotransformation et double impact des levures | partielle |
| R44 | Leviers levure dans les réponses usuelles | absente (fonctionnelle) |
| R45 | Choix Barres ou Radar pour une comparaison | partielle |
| R46 | Mêmes données et réglages en changeant de vue | absente (fonctionnelle) |
| R47 | Échelles communes, ordre stable, pas de fusion | absente (fonctionnelle) |
| R48 | Plages honnêtes, pas de 95 %, inconnue non nulle | partielle |
| R49 | Bascule Barres / Radar lisible, mobile et desktop | absente (fonctionnelle) |
| R50 | Gemini crée des entités et enrichit les existantes | absente (fonctionnelle) |
| R51 | Donnée extrapolée = estimation attribuée | partielle |
| R52 | « Toutes leurs données » : garder l'utile | partielle (incertain) |
| R53 | Outils métier exécutables par Gemini | absente (fonctionnelle) |
| R54 | Simulateur qui extrapole sans donnée exacte | partielle |
| R55 | Substitution étendue aux autres fonctions | partielle |
| R56 | Refus : granularité inventée, coefficient par style | partielle |
| R57 | Trois résultats à réussir ensemble | partielle |
| R58 | Conséquences d'un réglage perceptibles | couverte (Q17) |
| R59 | Contenu attendu par question (11 questions) | couverte (formes de réponse) |
| R60 | Ne pas cloner un site concurrent | partielle |
| R61 | Maquettes d'abord, moteur complet ensuite | absente (méthode) |

**Nombre d'exigences absentes : 23** (7 fonctionnelles, 2 UX, 14 méthode, concept ou rejet).

## Points incertains

- R52 : les guillemets de « Toutes leurs données » sont dans un texte d'agent ; l'origine n'est pas retrouvée.
- R41 : la règle « lager = ×3 / stout = ×0,2 » est mentionnée comme interdite (`brief-opus.md:49`) ; son origine n'est pas retrouvée.
- Les dates des copies du 01.10 sont des mtimes, indicatives. Le contenu est daté du 1er octobre dans les en-têtes.
- « Dis où tu veux aller » : non retrouvé comme parole du brasseur (voir la section de vérification).
