# Voie voie-r-m3 — reprise de m3 (son choix) : la période, mieux faite et cohérente partout (mission 2026-11-14-ecrans-transversaux)

- Agent : concepteur · Modèle : opus · Plafond : 60 tours · Décideur : le brasseur ; Fable interdit (10.11)
- Lis : `work/missions/2026-11-14-ecrans-transversaux/BRIEF-CONCEPTEUR.md` (obligatoire) ; sa base **m3** telle quelle :
  `voies/voie-menu/m3.html` et ses captures, la ligne m3 de `voies/voie-menu/NOTE.md`, la section m3 de `voies/voie-critique/RESULTAT.md`
  (« la période coûte un écran et T1 à T3 n'ont plus de place ») ; les greffes possibles : `voies/voie-p2-m2/m2p2.html` (frise des mois,
  trimestres T1 à T4 avec leurs écritures, pas à pas « ‹ oct. Novembre déc. › »). Où la période se règle aujourd'hui (lecture seule) :
  `src/components/Header.tsx` (PERIODS : Tout l'historique, Ce mois, Mois dernier, Exercice 2026, 1er à 4e trimestre),
  `src/components/tabs/FinancesTab.tsx`, `src/components/tabs/ProductionTab.tsx`, `src/ui/production/CatalogToolbar.tsx`,
  `src/components/tabs/DashboardTab.tsx`, `src/App.tsx` (période globale et filtres locaux). Charge `boosters-ux`.
  Exigences transversales (L05) : sa maquette choisie est la base, reprise telle quelle (règle n° 1, L03) ; densité utile, chrome compact ;
  aucun menu déroulant au téléphone (D350) ; 390 tactile et 1280 ; clair et cave.

## Ses mots (15.11)
« Page « Plus » / m3 -> attention pour l'interval de temps ça doit être mieux fait. Et on peut le réglés à plusieurs endroits, attention à ce
détails très important !! / Duo d'avatars, page plein écran. »

## Objectif
m3 reste m3 (duo d'avatars G/A, page « Plus » plein écran à sections, Journal par personne) : seule la période change.
1. **Mieux faite** : l'intervalle se choisit vite et se lit d'un coup d'œil (mois, mois dernier, exercice, trimestres, tout l'historique ;
   une plage libre si elle sert), sans coûter un écran, chaque trimestre à sa place.
2. **Réglable à plusieurs endroits** : lecture ambiguë, donc **trois variantes** (D144), chacune montrée dans la page Plus, sur Finances
   et sur Brassins (le même brassin B-031, les mêmes chiffres) :
   - `m3r-a` · **une seule période** : la même pastille dans chaque écran ; la changer à un endroit la change partout ;
   - `m3r-b` · **globale et locale** : un écran peut regarder une autre période, marquée visiblement (« ≠ app ») avec retour à celle de l'app ;
   - `m3r-c` · ta propre lecture, si elle sert mieux sa phrase (sinon une forme différente de a).
Chaleurs : a froide, b tiède, c chaude.

## Livrables
Pour chaque `<v>` : `<v>.html` et captures regardées `<v>-a-390.png` (page Plus, période ouverte), `<v>-b-390.png` (Finances avec sa période),
`<v>-cave-390.png`, `<v>-1280.png`, `<v>-vues-390.png` (planche : Plus, Finances, Brassins, Bord, la période réglée ailleurs).
`NOTE.md` : une ligne par variante (`<v> · nom · chaleur · ce qui change de m3`), puis 3 lignes de jugement.

## Contrôles
- `node work/missions/2026-11-14-ecrans-transversaux/controle-serie.mjs voie-r-m3 m3r-a,m3r-b,m3r-c --vues > work/missions/2026-11-14-ecrans-transversaux/voies/voie-r-m3/controle.txt` → SERIE OK.
- Tests : aucun Vitest (maquettes statiques, pas de --reporter=dot : pas de Vitest ici) ; sortie écrite dans un fichier (`> controle.txt`).
- RESULTAT.md tenu au fil (une ligne par variante finie ; une limite de tours ne doit rien perdre). Sous 130 k de contexte.
- Ouvre chaque capture ; « combien et quels problèmes ? » ; corrige. Captures : puppeteer-core
  (`createRequire('C:/Users/mrspa/AppData/Local/Temp/deploy-bc70/package.json')`, Chrome `C:/Program Files/Google/Chrome/Application/chrome.exe`).

## Possède
`work/missions/2026-11-14-ecrans-transversaux/voies/voie-r-m3/**` seulement. Rien dans `src/`, aucun déploiement, aucun commit.

## Rendre
Une ligne : « voie-r-m3 : SERIE OK, 3 variantes, préférée <v> » ou « voie-r-m3 ECHEC : <raison> ».
