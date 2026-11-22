REPRISE — n° 5 à 9 codés, non commités (anciens tests à mettre à jour) ; n° 4 en DEMANDE ; DEMANDE 1 et 2 de f5b à faire ; plafond 150 k atteint

| n° | verdict | commit | test | rouge→vert | état à capturer |
|---|---|---|---|---|---|
| 4 | ouvert → DEMANDE f5b (ChampCarnet.tsx, pas à moi) ; en partie artefact du banc (`scrollIntoView({block:'center'})` sur un champ collant, v4/banc.mjs l. 252) | — | — | — | `&ouvrir=ventilation&g8=1`, page en haut, toucher le champ, 390 |
| 5 | corrige en partie : « Façons · 1 façon » sans compte à 1 (CarnetOuvert) ; citation « « … » · votre phrase en titre » ecarte : maquette greffe5 v04-4 (R11) | à faire | tests/unit/carnetsTour3F5c.test.tsx | rouge → vert | moulin créé, 390/1280 |
| 6 | corrige : « proposé par l'IA » une fois si source commune ; « classées par … » ne garde que « à égalité, le moins cher » (`texteClassees`, Comparer) ; sans critère, « classées par <règle> » (g01-8) | à faire | idem | rouge → vert | Comparer Ventilation, 390/1280 |
| 7 | corrige : cellule « < min. 1 500 » sur une ligne (phrase entière en title et .cn-cache) ; colonnes d'articles à largeur partagée `--cn-col` mesurée dans `useSuiteADroite` (aucune colonne coupée au repos) — CSS non vu au navigateur | à faire | idem | rouge → vert | Comparer Ventilation 390 clair/sombre, puis défiler à droite |
| 8 | corrige : « Critères : tient 80 °C, puis le débit, proposé par l'IA » (`criteresQuiRangent`, Choisir et choisi) | à faire | idem | rouge → vert | Choisir carte pointillée 390/1280 |
| 9 | corrige : réalisé payé = prévu → « Payé en entier, au montant prévu » (11 700 CHF une fois) ; noms du tableau du carnet entiers (`cn-nom-entier`, plus de clamp) | à faire | idem | rouge → vert | Réalisés 390 ; Embouteillage réalisé 390 sombre |
| 10 (DEMANDE 1 f5b) | à faire : repli `moinsBienQueDe` (Comparer.tsx) encore « moins bien que la 1re sur tout » pour la 2e pompe ; domaine corrigé en 7160b51e8 | — | — | — | Pompe, Comparer et tableau |
| 11 (DEMANDE 2 f5b) | à faire : lien collé appelé « votre phrase » (LigneRangee.tsx / CarnetOuvert.tsx) | — | — | — | carnet avec lien collé |

Preuves : `tests-rouge.txt` (7 failed sur le code d'avant, raisons attendues) ; `tests-vert.txt` (F5c : 7 passed après correctif du regex) ;
`tests-final.txt` : 14 failed / 684 passed, dont des anciens tests qui figent l'ancien texte (à mettre à jour, pas des régressions) :
Critique6Decider 12 (« Payé 11 700 CHF · prévu 11 700 CHF ») et 16 (source IA), Critique6Figes 1 (noms sur 2 lignes) et 9 (« 1 façon »),
carnetsEcrans R06 ×2 et Critique4/5/6Decider (« classées par … »). carnetsTour3F4b PCN-103 (bulle G8) : ChampCarnet modifié par f5b, à vérifier
s'il échoue aussi sans mes fichiers. tsc : `npx tsc --noEmit -p tsconfig.json` sans erreur.

## REPRISE (agent neuf, Opus)
Code : port-carnet, HEAD 1f243127a + modifications NON commitées de f5c dans : src/ui/carnets/{CarnetOuvert,Comparer,Choisir}.tsx,
src/ui/carnets/{carnets,carnets-decider}.css, src/ui/finance/UpgradeWorkspace.tsx, tests/unit/carnetsTour3F5c.test.tsx (nouveau).
Les autres fichiers modifiés (CadreArrivee, CarnetsVue, ChampCarnet, domain/*) sont à f5b ou à d'autres sessions : ne pas les toucher.
Fichiers en CRLF : éditer avec Edit ; un script node perd les barres inverses dans les gabarits (regex de `horsSeuilCourt` déjà réparé).
1. Lire la liste des échecs de `tests-final.txt` ; mettre à jour chaque ancienne assertion au nouveau texte (n° 5 à 9), sans affaiblir le reste.
2. Rejouer F5c + fichiers mis à jour, puis `tests-final.txt`, `npx tsc --noEmit -p tsconfig.json`.
3. Commit par chemins (`-- <chemins>` ci-dessus), `git show --stat HEAD`.
4. DEMANDE 1 et 2 (lire voies/f5b/RESULTAT.md) : test rouge, correctif, vert, commit.
5. DEMANDE à f5b pour n° 4 : dans `useChampPublie` (ChampCarnet.tsx), ne défiler de la hauteur de la bulle que si la page était en bas
   (`d.scrollTop + d.clientHeight >= d.scrollHeight - b.offsetHeight - 10`) : en haut, le titre ne passe plus sous la barre À venir/Carnets/Réalisés.

DÉCISION À PRENDRE : aucune.
CONNAISSANCE : aucune.
LEÇON PROPOSÉE : aucune.
