OK — 56 fils du brasseur relevés et joués sur 5345f6ad : 4 perdus, 6 promis non faits, 1 contrôle sans correction

## Limite du relevé (à lire d'abord)

Les artefacts du 23 et du 24.10 sont sur un autre compte : rien n'est lu après la dernière lecture de chacun
(base v4.6 19.10 08:21, page 2VTRQ 19.10 18:41, maquette 23.10 23.10 20:58, maquette 24.10 24.10 05:53, base v4.10 24.10 06:17).
Deux fils de la base v4.10 n'étaient pas listés (limite de taille de l'outil). Les 56 fils sont ceux de `lectures-2026-10-24.json`
où « the user (owner) » a écrit ; ses mots sont recopiés tels quels. Un fil des planches (visionneuse) est vérifié dans le code
(`page-partagee/build.mjs`, commits), pas rejoué : son artefact est sur l'autre compte.

## Fils perdus (ni notés, ni faits) — 4

- **bce5b403** (19.10) « très dur à comprendre ces graph » : Claude promet libellés, légende, phrase de lecture ; aucune trace. Seul le voisin D77 est tenu.
- **a6151de7** (19.10) « parcontre ici ça ouvre la comparaison des houbon et autre comme en bas » : les vignettes Rail de la planche ouvrent toujours l'écran entier (`build.mjs` GESTES).
- **0cd4fb46** (19.10) « revoir cette partie là » : « cette partie » n'est pas dite, rien ne l'a relevé.
- **de0e8403** (19.10) « refaire des mini maquette pour cette partie » : même flou ; sa question de Claude est restée sans réponse.

## Promis non faits — 6

- **96d91895** (19.10) au style partout, Citra cryo trop aromatique pour une lager : lecture au style jouée partout sauf la fiche ; aucune mini maquette « fiche et Comparer au style, stout et lager » ; #141 ouvert, sans commentaire.
- **2f687ce7** (23.10) fiche : radar avant la liste fait ; la liste (« nommé en premier », mots anglais) reste, ses variantes promises ne sont pas montrées.
- **552eb2dd** (24.10) « ????? » sur « ~ simulé » : un toucher ne montre rien sur 5345f6ad ; D122 sans contrôle.
- **578d88e4** (19.10) ouvrir la page jouable depuis la visionneuse : aucun lien dans `build.mjs`.
- **10908446**, **01db4e15** (19.10) cadre en `srcdoc` sans base href, pas de test du statut : impact faible (pages autonomes).

## Contrôle sans correction — 1

- **73c34ecd** (18.10) « Que de j+3 » : côté froid, 5345f6ad écrit « actif · n j », « après · n j » (1 à 7 j), « whirlpool » sans °C, « ? IBU », sans J+n ni −/+ du jour ; D123 et D124 (voies p19, p20) ont leurs contrôles, la reprise n'est pas faite.

## Attend son choix — 2

- **87303327** Dryhopper « à revoir » : a1 (provisoire), b4, d8, e5, g1 ; les cinq lui ont été montrées (page 2026-10-23-dryhopper), les variantes sur a1 promises non ; ticket #146.
- **a0f0b6ef** l'entrée vers l'analyse : A, B ou C ; montrées en mini maquettes le 24.10 (artefact 6V21JEc5CqsjpLWrp184be) ; la maquette porte A.

## Décompte par verdict (56)

| Verdict | Fils |
|---|---|
| fait | 42 |
| promis-non-fait | 6 |
| perdu | 4 |
| attend-son-choix | 2 |
| caduc | 1 (l8 Typographique, remplacée par q2b) |
| controle-sans-correction | 1 |
| note-sans-controle | 0 |

Par artefact : base v4.6 6 fils, base v4.10 12, page 2VTRQ 20, maquette 23.10 17, maquette 24.10 1.
Vues non convaincantes : 7 entrées encore ouvertes (fils concernés) dans `vues-a-revoir.md` (Dryhopper, liste de la fiche, « ~ simulé », entrée de l'analyse, graphes, rail côté froid, partie non dite) ; 7 fils ouverts portent une vue non convaincante.

## Fichiers écrits

- `work/refonte-frontend/v4/choix/commentaires/fils-2026-10-24.json` (56 entrées)
- `work/refonte-frontend/v4/choix/commentaires/vues-a-revoir.md`
- `work/refonte-frontend/v4/choix/commentaires/captures/` : 45 captures `p22-*.png`, toutes prises sur 5345f6ad (pages de route en `file://`, 390 × 844 tactile, ×2 ; 1280 × 800 pour le survol), les citées ouvertes en image.
- Mes scripts : `os.tmpdir()/p22/`.

## Critères

Rejoués depuis la racine, une seule fois chacun, tous tenus (voir ci-dessous).

- G1 : `FILS-BIEN-56`
- G2 : `NOTE OK`
- G3 : `NOTE OK`

Essais utilisés : 1 par critère (un premier générateur a échoué sur la taille de la commande, relancé en fichier ; un fil, b1c676bf, ajouté après la première génération).

## Doutes et limites

- Chrome partagé avec quatre autres voies : l'appui long a été essayé sur 15 points, un seul ne répond pas (« résine 2/4 ») ; je ne sais pas si c'est voulu.
- D108 : Suggérer répond « Sans agrumes : Aucune voie houblon » ; le fil disait « 17 voies sur 18 écartées ». À revoir par p21b.
- Légende de Suggérer ouverte : elle déborde à droite à 390 px (texte coupé). Défaut neuf, non signalé par lui.
- 5345f6ad n'a pas servi à rejouer les contrôles `controle-*.mjs` (certains sont en cours d'écriture par p19 et p20, et `controle-au-style.mjs` lit l'ancien format de page) : les verdicts viennent de mes gestes joués, pas de leurs sorties.
- Le choix de `caduc` pour l8 (19112547) et de `promis-non-fait` pour 10908446 et 01db4e15 est une lecture ; l'autre option, `perdu` ou `caduc`, change peu.

DÉCISION À PRENDRE : « cette partie là » de 0cd4fb46 et de0e8403 (19.10, base v4.9). Options : lui demander de quelle partie il parlait ; ou les clore comme couvertes par la fiche g1 et le survol (lecture probable). Ma recommandation : les ranger dans « à lui de dire » sans fil de fer tant qu'il n'a pas précisé.

CONNAISSANCE : les fils ouverts d'un artefact ne sont jamais refermés par une correction : 23 fils encore « open » sur 56 sont en réalité tenus dans la maquette ; le relevé se fait sur le rendu, pas sur le statut du fil.

LEÇON PROPOSÉE : un ticket et un contrôle écrits pour un fil ne valent pas un verdict : jouer le geste du fil sur la dernière construction (ici le froid de D123 : le jour change, mais l'échelle de sa base est perdue). Les fils de visionneuse (planche) sortent du contrôle des maquettes : ils n'ont ni contrôle ni ticket propre (#119 seul).
