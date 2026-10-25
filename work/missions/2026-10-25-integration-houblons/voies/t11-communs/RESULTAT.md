OK — neuf composants communs et familyTokens dans src/ui/hopIndex/, une copie ; batterie 46/46, états 141/141, démarrage 919 ko

## Fichiers écrits
- `git mv` vers `src/ui/hopIndex/` : `BarreStyle.tsx`, `JetonHoublon.tsx`, `Pictos.tsx`, `Legende.tsx`, `LigneContexte.tsx`, `Marques.tsx`, `Pont.tsx`, `gestes.ts`, `nombres.ts`, `familles.ts` -> `familyTokens.ts`.
- Neufs dans `src/ui/hopIndex/` : `lecturesAffichees.ts` (`FamilleAffichee`, `HoublonAffiche` : seulement les champs que `BarreStyle` et `JetonHoublon` affichent ; `FamilleLue` et `HoublonLu` de la maquette y entrent par typage structurel, donc plus d'import de `../moteur`) ; `communs.css` (`.pq-hachure`, importée par `Marques` et `BarreStyle`).
- Imports relatifs dans les fichiers déplacés (`../../data/hopV4/…`, `../../domain/hopIndex/v4/families`) ; `familyTokens` et `Pictos` importent `families.ts` et non l'index du moteur : ils n'attirent pas le moteur entier dans un chunk.
- Maquette : `commun/index.ts` réexporte les déplacés depuis `@app/ui/hopIndex/…` (les 30 écrans qui importent `../../commun` n'ont pas bougé) ; chemins directs corrigés dans `coquille/Coquille.tsx` (Pictos, familyTokens), `ecrans/fiche/Replis.tsx` (Pont), `ecrans/ma-biere/LegendeGroupe.tsx` (familyTokens), `commun/Cadres.tsx` (Pont) ; `styles.css` : la règle `.pq-hachure` en est sortie (une seule copie).
- `work/refonte-frontend/v4/tournoi/outils/controle-traits.mjs` : chemin de `COURT` (`src/ui/hopIndex/familyTokens.ts`) et message.
- `parcours/ARCHITECTURE.md` : la ligne `src/commun/*` marquée faite (avec ce qui reste) ; mention de `nombres.ts`.
- `tests/unit/hopIndexV4/communsHopIndex.test.tsx` : 15 tests (12 familles, couleurs, ROUE ; 12 symboles et pictos ; jeton : nom, α, plage, « ≠ », « α ? » jamais 0, rôle, icône de stock sans quantité ; barre : échelle du style et absolue, inconnu hachuré sans barre, « hors style » ; marques ; garde : aucun import de la maquette, de `@app/`, de `coquille`, de l'adaptateur ni de l'index du moteur ; plus de copie côté maquette).
- Aucun écrit hors Possède (`git status` : `pistes-l5f.png` et les dossiers `work/refonte-frontend/…` non suivis étaient déjà là).

## Grep de l'ancien chemin (L17)
`parcours/src/commun` : 1 fichier hors `work/missions`, `controle-traits.mjs` (corrigé). Les 34 importeurs de `parcours/src/` passaient par `commun/index` sauf 4 chemins directs (corrigés). Les `commun/` des générateurs de `work/refonte-frontend/v4/ecran-1/**` sont leurs propres dossiers, pas la maquette. Après : `git grep "commun/(Pictos|…|familles)"` hors `work/missions` et maquettes construites -> aucun.

## Critères
- **G1** `node …/t11-communs/verifier.mjs` -> `COMMUNS OK` (tests de rendu 15/15, `npm run build` vert, démarrage B1 919 ko gzip ≤ 919, inchangé). Essai 1. (Le vérificateur exige RESULTAT.md : écrit tôt, provisoire, avant.)
- **G2** `node prototypes/houblons-v4/parcours/outils/batterie.mjs` -> `BATTERIE OK 46/46` (CONSTRUIT, TYPES, FONCTIONS INTACTES, CHOIX 7 conformes, TEINTE 7/7, TRAITS, LEGENDE-V2A, ROUTES 8/8, PONTS 18 gestes, PARCOURS 29+29). Essai 1 après une correction de type (`Cadres.tsx` important encore `./Pont`, vu par `verifier-types.mjs` avant la batterie).
- **G3** `controle-etats.mjs prototypes/houblons-v4/maquettes/parcours` -> `ETATS OK (141/141) ; 13 voulu(s) non rejoué(s)`. Essai 1.

## Doutes et limites
- Pas de comparaison octet par octet de l'ancien et du nouveau `parcours.js` ; le rendu identique est prouvé par la batterie et les 141 états. Aucune capture regardée à l'œil : le déménagement ne change aucun pixel, les contrôles de teinte, traits, pictos et légende le mesurent.
- `.pq-hachure` change de feuille (même règle, ordre de cascade différent). Elle ne règle que `background-image`, sans conflit avec les utilitaires (qui règlent `background-color`) : teinte et états verts.
- Restent dans la maquette : `Onglets.tsx` (importe `coquille/navigation` et `etat/EtatParcours`), `PiedAnnuler.tsx` (idem), `Cadres.tsx` ; `retour.css`, `feuille.css`, `pied-annuler.css` les accompagnent. Le VOIE citait `Onglets` dans la carte, mais la consigne « toute pièce qui importe `coquille/` reste » l'emporte. Dans l'app, `Onglets` et `PiedAnnuler` seront à refaire sur `useHopDraft` et la pile de routes (T12).
- Un écran porté de l'app (T12) qui emploie `BarreStyle` ou `Marques` apporte `communs.css` avec eux ; `COULEURS`/`COURT` ne dépendent d'aucun CSS.
- B2 (étape Houblons) lit 773 ko contre 772 en T4 : écart non attribué (T8/T9 ont aussi touché `src/ui/hopIndex`), hors critère ; B1 reste 919.
- Le tsc de l'app compile `src/ui/hopIndex/` : build vert, donc `?raw` et le JSON des jetons passent.

DÉCISION À PRENDRE : aucune.
CONNAISSANCE : les composants communs vivent dans `src/ui/hopIndex/` ; `BarreStyle` et `JetonHoublon` lisent `FamilleAffichee`/`HoublonAffiche` (`lecturesAffichees.ts`) au lieu des types de l'adaptateur ; importer `domain/hopIndex/v4/families` et non l'index du moteur pour ne pas attirer le moteur dans un chunk.
LEÇON PROPOSÉE : aucune
