# REPRISE-5 — Frise du temps du Calendrier (22.11, Opus, arrêt à 150 k)

Worktree `port-carnet`, partagé : commit par index temporaire (GIT_INDEX_FILE, read-tree HEAD, git add de ses chemins, commit, puis
`git reset -q HEAD -- <chemins>` sur l'index réel). Une autre voie commite en même temps (HEAD a bougé pendant mon commit : relire HEAD avant).
Règle de test : clair seul, 390×660 et 844×340 tactiles d'abord, 1280 en simple contrôle.

## Fait
- **702fed7fc** — point 1 de REPRISE-4. (a) `Rangee.tsx` : la période posée à côté de la pastille est un bloc `.cal-conf-p` (nowrap, frise.css) :
  « prévu » puis « nov. 26–nov. 27 » entière sur la 2e ligne, jamais « 27 » seul ; une seule colonne dit « prévu S47 » (plus « S47–S47 »,
  champ `periode` de `Pastille`). (b) le picto d'étape `.cal-jalon` touchait la barre du dessous en portrait : `MESURES_PORTRAIT_BRASSINS`
  (ligne 32, barre 26) branché dans `Frise.tsx` pour Brassins, picto à `bottom: -4px` : 2 px d'air (précédent PC-147 en paysage).
  Contrôle `sectionAn390` « rangées » (geste.mjs) : rouge sur tour9 à 1 sem., 6 sem., 3 mois, 6 mois, An (C:/tmp/rp/an7-t9.log : S47–S47,
  période coupée, pictos de Ssr/Ttt/Hefe/Jhhh sur la barre voisine) ; vert sur l'arbre (an7-arbre.log, PARCOURS GESTE OK). Captures ouvertes :
  C:/tmp/rp/an7-arbre/calendrier-390-clair-an390-An.png et -1sem.png. vitest calendrierPaysageV1 adapté (portrait 32 px), 5 fichiers frise verts.
- Hors de ma voie : `calPasseG3` « en 6 semaines, au banc » rouge (`bornes(...)` undefined), non lié à ce commit (à attribuer).

## Outil d'épreuve au doigt (point 3)
`C:/tmp/rp/ep/ep.mjs <build> <scenario.json> <sortie> 390 660` : sert un build, pose la fixture du banc geste (fixtureGeste), joue des gestes
TACTILES CDP (menu, texte, sel, doigt avec vitesse réelle, tenue `immobile` ou `tremble` ms de ±1 px, `capPendant`), capture après chaque geste,
`zoom`. Build : `PARCOURS_RACINE=<port-carnet> npx vite build --config scripts/parcours/vite.parcours.config.mjs --outDir C:/tmp/rp/b-arbre`
(le build actuel date d'AVANT 702fed7fc : le refaire). Générateur T9 : `C:/tmp/rp/ep/gen-t9.cjs` → s-t9.json.
Défaut du scénario : la fixture n'est posée qu'une fois ; après la 1re variante de T9-1, « lol » est en févr. 2027, hors des 6 sem. suivantes
(« points du doigt introuvables ») : poser une fixture neuve par variante (nouveau tag) ou rendre la date avant chaque variante.

## T9-2 : piste sérieuse (doigt IMMOBILE, 390×660, arbre)
`s-t92.json` : 2 sem., 6 sem., poignée de début tirée au bord gauche de la courbe puis tenue 3 s SANS aucun touchMove (un vrai doigt immobile
n'émet rien). Pendant la tenue, la bulle de tirage n'a pas été lue (lire() lit `.ent-cadre`, vide pendant le tirage : lire `[data-cadre-tirage]`).
Au lâcher (C:/tmp/rp/ep/o-t92/03-t92-immobile.png, ouverte) : bouton « An », frise « prévu nov. 25–nov. 26 » (un an EN ARRIÈRE, avant
l'ouverture de caisse S33), mais l'étiquette du cadre reste « S47 – S52 2026 » et le cadre couvre presque toute la courbe : en-tête et frise
se contredisent. Variante « banc » (touchMove toutes les 100 ms) : « S23 – S52 2026 », 30 sem., cohérent (o-t9/24-…png).
Le brasseur dit « bute sur S47 » : c'est l'étiquette restée à S47 qu'il a pu lire. À faire : capturer `[data-cadre-tirage]` pendant la tenue,
lire `index/nombre` d'EnTete et la fenêtre de la frise après le lâcher ; chercher pourquoi un recul qui dépasse le début de la courbe (index 0,
`poserPlage` min 0) bascule en « An » sur l'année d'avant (EnTete onChange, CAL-ECHELLE-FIGEE). Contrôle : la même tenue immobile dans
`sectionT9` (tenirAuBord a un tremblement toutes les 100 ms : il masque le défaut), rouge sur tour9 attendu.

## T9-1 et R7 : seconde piste (bruit du doigt)
`useGlisse.ts` l. 76 et `usePointeur.ts` l. 342 arment le sens au moindre pas de 0,5 px ; au bord, un tremblement réel (±1 px à 120 Hz)
change `arme` sans cesse : `vitesseBord` rend 0, l'image R7 s'arrête, `usePointeur` remet `acc` à 0 et la reprise commence par dt = 0.
Le défilement n'avance alors presque plus. Banc : variante « banc » de T9-1 verte (6 → 12 sem., « lol » posée dans la vue) ; variantes
`tremble8` et `tremble16-ecran` non jouées (défaut du scénario ci-dessus). Remède à éprouver : sens armé sur un déplacement cumulé ≥ 6 px
(`aBouge`), ou sens déduit de la bande du bord ; ne pas remettre `acc` à 0 sur une coupure brève.

## Reste dans l'ordre
1. T9-2 immobile : comprendre, contrôle rouge sur tour9, corriger, commit. 2. T9-1 avec tremblement 8 ms et au bord de l'écran (x = 389).
3. Épreuve au doigt complète (liste du contrat) avec ep.mjs, à 390×660 puis 844×340 → Brasserie work/missions/2026-11-22-frise-epreuve/EPREUVE.md.
4. Bancs complets en arrière-plan (`calendrier.mjs`, `geste.mjs --endroits calendrier`), KO attribués. 5. BUGS.md Brasserie (T9-1..3,
CAL-FRISE-ETIQUETTES, CAL-AN-390 rangées), controle-bugs.

LEÇON PROPOSÉE : un doigt de banc « tenu » doit aussi être joué immobile (aucun touchMove) et bruité (±1 px à 120 Hz) : un tremblement régulier
toutes les 100 ms relance le geste et masque ce que le vrai téléphone montre (T9-2 non reproduit deux passes durant).
