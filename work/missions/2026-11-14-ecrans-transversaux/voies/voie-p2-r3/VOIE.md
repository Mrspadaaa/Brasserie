# Voie voie-p2-r3 — passe 2 de r3 (mission 2026-11-14-ecrans-transversaux)

- Agent : concepteur · Modèle : opus · Plafond : 60 tours · Décideur : le brasseur (choix) ; Fable interdit (10.11)
- Lis : `work/missions/2026-11-14-ecrans-transversaux/BRIEF-CONCEPTEUR.md` (obligatoire), `work/missions/2026-11-14-ecrans-transversaux/voies/voie-critique/SYNTHESE.md` (ta candidate, greffes, retouches communes),
  la section r3 de `work/missions/2026-11-14-ecrans-transversaux/voies/voie-critique/RESULTAT.md` (ses problèmes numérotés), puis ta base `work/missions/2026-11-14-ecrans-transversaux/voies/voie-recherche/r3.html`
  et ses captures (et `src/` de cette voie s'il existe : copie-le chez toi, ne modifie rien dans `voie-recherche`). Charge `boosters-ux`.
  Exigences transversales (L05) : densité utile et chrome compact ; même en-tête et même barre que l'app (logo, pictos), même place
  du + partout (D119, D129, BX-4) ; aucun menu déroulant au téléphone (D350) ; 390 tactile et 1280 ; clair et cave ; rien de perdu.

## Objectif
Ta base est r3 ; tu la gardes (plancher à enrichir, L07) et tu corriges **tous** ses problèmes numérotés, ses retouches de
candidate et les retouches communes (dates : 14.11.2026 est un samedi, J+n cohérents ; mêmes données partout : B-031 IPA Nelson,
Citra T90 1,2 kg ; mono pour les chiffres seulement ; vente d'exemple plausible).
Greffes de r1 : « 3 de plus dans les archives » en pointillé, champ collé au clavier, meilleur résultat sous le pouce ; au 1280, aperçu de la ligne choisie (stock, α, emplois).
Variante livrée : `r3p2` (même idée, finie). Ce qui est proposé et n'existe pas dans l'app est marqué « (proposé) » dans NOTE.md.

## Livrables
`r3p2.html` et captures regardées : `r3p2-a-390.png`, `r3p2-b-390.png`, `r3p2-cave-390.png`, `r3p2-1280.png`.
`NOTE.md` : une ligne `r3p2 · nom · chaleur · problèmes réglés · ce qui disparaît ou bouge`, puis la liste des corrections faites.

## Contrôles
- `node work/missions/2026-11-14-ecrans-transversaux/controle-serie.mjs voie-p2-r3 r3p2 > work/missions/2026-11-14-ecrans-transversaux/voies/voie-p2-r3/controle.txt` → SERIE OK.
- Tests : aucun Vitest (maquettes statiques, pas de --reporter=dot : pas de Vitest ici) ; sortie écrite dans un fichier (`> controle.txt`).
- RESULTAT.md tenu au fil (une ligne après chaque étape ; une limite de tours ne doit rien perdre).
- Ouvre chaque capture (Read) ; « combien et quels problèmes ? » ; corrige. Reste sous 120 k de contexte.
- Captures : puppeteer-core (`createRequire('C:/Users/mrspa/AppData/Local/Temp/deploy-bc70/package.json')`, Chrome
  `C:/Program Files/Google/Chrome/Application/chrome.exe`, headless).

## Possède
`work/missions/2026-11-14-ecrans-transversaux/voies/voie-p2-r3/**` seulement. Rien dans `src/` du dépôt, aucun serveur de l'app, aucun déploiement, aucun commit.

## Rendre
Une ligne : « voie-p2-r3 : SERIE OK, r3p2 livrée » ou « voie-p2-r3 ECHEC : <raison> ».
