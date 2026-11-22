# Voie voie-p2-b3 — passe 2 de b3 (mission 2026-11-14-ecrans-transversaux)

- Agent : concepteur · Modèle : opus · Plafond : 60 tours · Décideur : le brasseur (choix) ; Fable interdit (10.11)
- Lis : `work/missions/2026-11-14-ecrans-transversaux/BRIEF-CONCEPTEUR.md` (obligatoire), `work/missions/2026-11-14-ecrans-transversaux/voies/voie-critique/SYNTHESE.md` (ta candidate, greffes, retouches communes),
  la section b3 de `work/missions/2026-11-14-ecrans-transversaux/voies/voie-critique/RESULTAT.md` (ses problèmes numérotés), puis ta base `work/missions/2026-11-14-ecrans-transversaux/voies/voie-barre/b3.html`
  et ses captures (et `src/` de cette voie s'il existe : copie-le chez toi, ne modifie rien dans `voie-barre`). Charge `boosters-ux`.
  Exigences transversales (L05) : densité utile et chrome compact ; même en-tête et même barre que l'app (logo, pictos), même place
  du + partout (D119, D129, BX-4) ; aucun menu déroulant au téléphone (D350) ; 390 tactile et 1280 ; clair et cave ; rien de perdu.

## Objectif
Ta base est b3 ; tu la gardes (plancher à enrichir, L07) et tu corriges **tous** ses problèmes numérotés, ses retouches de
candidate et les retouches communes (dates : 14.11.2026 est un samedi, J+n cohérents ; mêmes données partout : B-031 IPA Nelson,
Citra T90 1,2 kg ; mono pour les chiffres seulement ; vente d'exemple plausible).
Greffes de b1 : au 1280, rail latéral et lettres de raccourci N, E, F, V ; « Hors connexion » dans l'entrée Compagnon, plus de pastille flottante ; le toast de démarrage rangé au-dessus de la barre, sans couvrir l'en-tête ni les onglets. En plus (couverture, une vue sans maquette = pas fini) : une planche `b3p2-ecrans-390.png` qui montre le + ouvert sur chaque écran — Bord, Finances, Brassins, Recettes, Atelier, Volumes, Stock, Courses, Fûts, Matériel, Houblons, Clients — avec l'action de l'écran à sa place (actions actuelles : `src/domain/fabActions.ts`, lecture seule ; Atelier a aujourd'hui son propre + dans l'écran : un seul + à l'écran). L'état « a » montre la barre au repos sur un écran rempli (pas un bas vide).
Variante livrée : `b3p2` (même idée, finie). Ce qui est proposé et n'existe pas dans l'app est marqué « (proposé) » dans NOTE.md.

## Livrables
`b3p2.html` et captures regardées : `b3p2-a-390.png`, `b3p2-b-390.png`, `b3p2-cave-390.png`, `b3p2-1280.png`, `b3p2-ecrans-390.png`.
`NOTE.md` : une ligne `b3p2 · nom · chaleur · problèmes réglés · ce qui disparaît ou bouge`, puis la liste des corrections faites.

## Contrôles
- `node work/missions/2026-11-14-ecrans-transversaux/controle-serie.mjs voie-p2-b3 b3p2 > work/missions/2026-11-14-ecrans-transversaux/voies/voie-p2-b3/controle.txt` → SERIE OK.
- Tests : aucun Vitest (maquettes statiques, pas de --reporter=dot : pas de Vitest ici) ; sortie écrite dans un fichier (`> controle.txt`).
- RESULTAT.md tenu au fil (une ligne après chaque étape ; une limite de tours ne doit rien perdre).
- Ouvre chaque capture (Read) ; « combien et quels problèmes ? » ; corrige. Reste sous 120 k de contexte.
- Captures : puppeteer-core (`createRequire('C:/Users/mrspa/AppData/Local/Temp/deploy-bc70/package.json')`, Chrome
  `C:/Program Files/Google/Chrome/Application/chrome.exe`, headless).

## Possède
`work/missions/2026-11-14-ecrans-transversaux/voies/voie-p2-b3/**` seulement. Rien dans `src/` du dépôt, aucun serveur de l'app, aucun déploiement, aucun commit.

## Rendre
Une ligne : « voie-p2-b3 : SERIE OK, b3p2 livrée » ou « voie-p2-b3 ECHEC : <raison> ».
