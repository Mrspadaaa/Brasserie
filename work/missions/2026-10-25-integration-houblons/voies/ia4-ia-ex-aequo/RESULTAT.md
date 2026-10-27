OK — IA sur les seuls ex æquo, phrase fondée sur la fiche (suggerer-v2) ; banc aveugle 30 cas : +5 points, règle non tenue, IA reste éteinte

(GATES.md n'existe pas dans le dossier de la voie : critères pris dans VOIE.md.)

## Fichiers écrits
- Serveur : `functions/src/hopReclassCore.ts` (invite `suggerer-v2`, pool 3 à 12, 6 phrases, contrôle « phrase hors fiche », « Réputation : »), `functions/src/hopReclasserIA.ts` (compte `phrasesHorsFiche`, `phrasesReputation`). L'invite `v1` de Substituer n'a pas bougé.
- Client : `src/ui/hopIndex/suggerer/ia.ts` (`poolExAequo`, pool 12, minimum 3), `src/ui/hopIndex/suggerer/index.tsx` (le pool seulement : rangées du groupe « même effet » + suivantes au même effet ; les autres rangées du moment suivent dans l'ordre du moteur), `src/ui/hopIndex/parcours/adaptateur.ts` (commentaire de `poolSuggerer` : c'est le balayage, 30).
- Tests : `tests/unit/hopIndexV4/hopReclasserIA.test.ts`, `suggererIA.test.tsx`.
- Banc : `scripts/eval-hop/ia4-banc.ts` (neuf), `ia4-banc/reference.json`, `resultats.json`, `tableau.md` (dossier de la voie). Journal : section « ia4 » de `gemini-journal.md` (31 lignes).
- `scripts/eval-hop/ia3-emulateur.ts` : non touché (voir limites).

## Ce qui a changé, et pourquoi
1. **Pool = les ex æquo du moteur.** `poolExAequo` : les rangées du groupe « même effet » (ordre du moteur), puis, dans le balayage de 30 du moteur, les houblons au même effet sur les objectifs ET à la même dose, hors visée bannie. Jamais un houblon d'un autre effet.
   **Taille : 12 au plus, minimum 3**, par une règle chiffrée écrite dans `hopReclassCore.ts` : latence ≈ 0,8 s + 2,5 ms × jetons de sortie (mesure ia3) ; sortie ≈ 180 + 12 × candidats + 35 × phrases ; cible 2,2 s sous la fenêtre de 3 s, donc ≤ 560 jetons ; avec 6 phrases, N ≤ 14, on prend 12 (≈ 535 jetons, ≈ 2,1 s) ; coût ≈ 2,6 k jetons d'entrée, ≈ 0,0025 CHF l'appel. **Phrases : 6** (au lieu de 10) pour tenir cette règle. Aucune mention de ses six dans `hopReclassCore.ts`, `hopReclasserIA.ts`, `ia.ts` (grep vide).
2. **Phrase d'après la fiche.** L'invite dit : candidats à égalité selon le moteur, on les départage sur les mots, huiles, usage ; jamais un arôme hors des mots de la ligne ; sinon « Réputation : » en tête. Le serveur retire (l'ordre reste) la phrase qui nomme un arôme absent des mots de la fiche sans « Réputation : » (lexique de 10 groupes d'arômes ; une famille se contente d'un membre dans les mots, un arôme précis veut son mot).
3. **Banc aveugle** : voir plus bas.

## Critères (sorties décisives)
- `npx vitest run tests/unit/hopIndexV4 --maxWorkers=2` : **94 fichiers, 912 tests verts** (un « Timeout calling onTaskUpdate » du worker, charge de la machine, sans test en échec) ; rejoué à part : `hopReclasserIA.test.ts` + `suggererIA.test.tsx` : 82 verts. Test d'identité `v1` vert. Nouveaux : pool borné aux ex æquo (`poolExAequo` : un autre effet ou une autre dose n'entre jamais ; plafond 12 ; l'appel de l'écran commence par les rangées montrées), retrait d'une phrase hors fiche (callable : 1 retirée, ordre intact), « Réputation : » gardée et comptée, `aromesHorsFiche`, `estReputation`, règle du pool (latence < 2,5 s).
- `npx tsc --noEmit` et `npx tsc --noEmit -p functions` : sans sortie.
- grep des six dans les trois fichiers : vide.
- Banc : **`IA4-BANC-OK`**, 30 cas, 31 appels (30 + le passage final), **0,0710 CHF** sur 0,4 (enveloppe 70 appels), 0 erreur.

## Le banc (réf. écrite avant tout appel : `reference.json`, sha256 832ca32ad1ef3678)
- Cas : 28 styles de `pharesParStyle` (sauf 22A, 16D, 21C) × agrumes / floral × dry hop actif / 10′, recette de fixture (Nugget 20 g à 60′, 24 L, OG 1,06, US-05) ; 30 cas à pas régulier parmi ceux qui ont un groupe d'au moins 3 ex æquo d'effet positif. Les 30 groupes atteignent le plafond de 12.
- Référence indépendante (hors Beer Maverick et Beer Analytics) : Hopsteiner (« Aroma evaluation » citrusy / floral, cité si note ≥ 3 sur 5) et HopDatabase (descripteurs des fiches Yakima Chief). 358 rangées sur 360 couvertes. Part = confirmées / couvertes sur les 4 rangées montrées.
- **Règle écrite avant le banc** : moyenne des écarts (IA moins moteur) ≥ +10 points ET aucun cas sous −25.
- **Résultat : moyenne +5 points** (30 cas mesurables), pire cas −25 (exactement le seuil, pas au-delà) → **règle non tenue : l'IA reste éteinte.** Écarts : 7 cas en hausse (+50 : 1A et 7B, agrumes à 10′ ; +25 : 13C, 4A, 5B, 21A, 18B), 3 en baisse (−25 : 15B, 16A, 5D), 20 sans écart. Détail : `ia4-banc/tableau.md`.
- Phrases : 180 gardées, **0 retirée, 0 « Réputation : »**. Latence médiane **1,62 s** (1,40 à 2,12 s) : la règle de latence tient. Aucun classement invalide.
- Ses six + neipa v3 (un seul passage, à la fin, en rapport) : groupe de 12 ex æquo (Citra, Centennial, Amarillo, Simcoe, Nectaron, Denali, Strata, Galaxy, Cascade, Ekuanot, Sabro, Azacca) ; **l'IA rend exactement l'ordre du moteur**. Ses six ne sont pas dans le groupe : rang du moteur au balayage, El Dorado 15, Mosaic 13, Idaho 7 14, Mandarina 23, Calypso et Pacific Jade au-delà de 30. Les phrases disent « agrumes, pamplemousse… » en citant la fiche (chewing gum, groseille non cités : la phrase d'ia3 sur « mandarine » ne se reproduit pas).

## Doutes et limites
- **Plafond de saturation** : en agrumes, 12 rangées sur 12 sont confirmées par la référence dans la plupart des cas (les 12 premières du moteur sont déjà citées citron/orange) : l'IA ne peut ni monter ni descendre. Seuls les cas « floral » et quelques 10′ discriminent ; la moyenne de +5 repose sur les 12 cas où le moteur n'est pas à 100 %, avec des écarts de ±25 qui valent une rangée sur 4 (bruit de petit nombre). Je ne conclus pas à un effet.
- La référence est faible : Hopsteiner (≈ 89 variétés) et un jeu de descripteurs YCH ; elle dit « cité », pas « intense » ; le plafond 12 coupe des groupes plus larges.
- Le banc appelle le même module que le callable (`hopReclassCore.ts` : invite, schéma, analyse) mais **sans passer par le callable ni l'émulateur** (économie de tours) ; le chemin app → callable reste celui prouvé en ia3. Le contrôle « hors fiche » est un lexique : il laisse passer un arôme absent du lexique et retire une phrase qui nie un arôme (« sans agrumes »). 0 retirée sur 180 : peu éprouvé en réel, prouvé en tests.
- Les phrases deviennent mécaniques (« La fiche mentionne explicitement… ») : fidèles à la fiche, mais peu utiles pour un brasseur. À juger par le brasseur si l'IA est un jour allumée.
- `ia3-emulateur.ts` n'est pas rejoué : son fournisseur simulé écrit des phrases « agrumes » que la garde hors-fiche retirerait, et son en-tête de journal dit encore `suggerer-v1`. À mettre à jour avant de s'en servir.
- Avec plusieurs groupes au même moment, l'ordre appliqué met les ex æquo (ordre IA) en tête, puis les autres rangées du moteur dans leur ordre : elles fusionnent dans un groupe « Ajouter » (comportement d'`appliquerOrdreIA`, `voies.ts`, hors de ma voie). Non éprouvé sur un rendu (aucune interface changée : la puce et la phrase de m6 sont inchangées ; IA toujours éteinte, `VITE_IA_SUGGERER`).
- Aucun déploiement, aucun commit.

DÉCISION À PRENDRE : garder l'IA de Suggérer éteinte ? Options : (a) éteinte (règle non tenue : +5 < +10) ; (b) allumer quand même (déconseillé : gain non distinct du bruit, et le plafond de la référence masque le reste) ; (c) rejouer un banc sur floral et 10′ seulement avec une référence plus riche (BarthHaas, Crosby) avant de trancher. Recommandation : (a), et (c) seulement si le brasseur veut garder l'IA ; ne pas déployer `suggerer-v2` en l'état.

CONNAISSANCE : sur un moteur dont les groupes « même effet » atteignent 12 houblons, le classement du moteur dans le groupe est déjà confirmé par Hopsteiner et Yakima Chief à 100 % sur les 4 rangées montrées dans 18 cas sur 30 : un arbitre IA n'a presque rien à corriger au premier plan. Latence Flash-Lite à 12 candidats et 6 phrases : 1,4 à 2,1 s, ≈ 0,0024 CHF l'appel (0,0710 CHF pour 31 appels).

LEÇON PROPOSÉE : avant un banc, mesurer le plafond de la référence (part déjà confirmée à l'ordre du moteur) : si elle approche 100 % sur la moitié des cas, la moyenne ne dit rien de l'IA ; choisir une référence qui discrimine, ou ne mesurer que les cas où le moteur n'est pas au plafond.
