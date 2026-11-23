OK — V4 : CHN-5, 6, 8, 11, 12 corrigés (commit b338192d4), 4 étapes geste `navigation` rouges sur tour8, vertes sur l'arbre

## MISE À JOUR (message du pilote) : CHN-11 refusé
L'en-tête collé est retiré (commit 136fdc928 : prop `colle` de Header et App, étape CH-N11 de geste.mjs). BUGS : CHN-11 « écarté — refusé : contredit APP-ENTETE-COLLE » (commit d23e434ad). Les lignes ci-dessous sur CHN-11 et N11 sont caduques ; il reste 4 ids corrigés (CHN-5, 6, 8, 12). `controle-bugs.mjs` ne cite plus aucun CHN ; son ECHEC actuel vient de lignes CHE/CHD d'autres voies, « corrigé » sans commit tant qu'elles n'ont pas commité.

## Fichiers (worktree port-carnet, commit b338192d4 ; BUGS commit 8cb656a3b)
- `src/App.tsx` : `ouvrirChoseCalendrier(date, id)` ne réécrit plus `globalTimeFilter` (CHN-6) ; transmet `viser` {id, at} ; l'événement du Carnet et la palette (plans, fêtes) portent l'id de la chose (CHN-5, 12) ; l'ouverture d'un brassin depuis le Calendrier porte `retour: true` et `onRetourEcran` (CHN-8) ; `Header colle` sur l'onglet Calendrier (CHN-11) ; import `dansPeriode` retiré.
- `src/components/tabs/CalendrierTab.tsx` : prop `viser` (fiche de la chose sélectionnée ; idée du carnet : ± posé, ampoule visible, message « <titre> · idée du carnet, S7 » + « Ouvrir le carnet ») ; période locale posée dans la fenêtre quand `centrerSur` (la période de l'app reste « Nov. ») ; la loupe depuis le Calendrier recentre la fenêtre.
- `src/components/tabs/ProductionTab.tsx` : `openBatchRequest.retour` + `onRetourEcran` : la croix de la fiche ramène au Calendrier (historique `laffinee-retour` si présent, sinon `setActiveTab('calendrier')`).
- `src/components/Header.tsx` : prop `colle` (sticky top-0 seulement quand demandé ; hauteur republiée quand elle change).
- `src/ui/carnets/CarnetsVue.tsx` : l'événement « Au calendrier » porte `id: c.id`.
- `scripts/parcours/geste.mjs` : endroit `navigation` (CH-N5 avec N6, CH-N8, CH-N11, CH-N12 ; 390 tactile ; une page neuve par étape ; fixture calendrier).

## Preuves
- Arbre : `node scripts/parcours/geste.mjs <dossier> --largeurs 390 --themes clair,cave --endroits navigation` → `PARCOURS GESTE OK` (clair et cave).
- tour8 : `--ref en-ligne/2026-11-21-tour8 --largeurs 390 --themes clair --endroits navigation` → 6 KO : N5 « chambre froide à l'écran : 0 fois ; ampoule 0 » ; N6 « Novembre 2026 → Février 2027 » (saut et retour) ; N8 « le Calendrier n'est plus là » ; N11 « défilé de 268 px : ‹ top −265, loupe top −262 » ; N12 « aucune fiche ». Mêmes chiffres que la chasse.
- Captures ouvertes : N5 (ampoule S7 + message, « Nov. » gardé), N12 (fiche Marché de Noël ouverte), N11 cave (barre collée en haut), N8 (retour au Calendrier).
- Vitest : 8 fichiers, 73 tests verts (calendrierPaquetG-entete, calendrierTour2Cal, calRenvois, carnetEntreeUnique, headerSignataire, bDiversEntete, productionCatalog, dashboardNavigation). `tsc --noEmit` propre. `controle-bugs.mjs` : `BUGS OK : 1617 bugs, 188 ouverts`.
- Essais : un par critère (sauf N11 : 3, la fixture ne défile que de 58 px, d'où une cale de 900 px posée sous le Calendrier par le contrôle).

## Doutes et limites
- CHN-11 : la barre de l'app (période, loupe) colle sur le Calendrier seulement. Elle s'empile au-dessus de l'en-tête collé du Calendrier (≈ 40 px de moins pour les lignes). Cela contredit en partie APP-ENTETE-COLLE (19.11, « le header n'a pas besoin d'être visible partout »), limité à cet onglet. Les autres onglets inchangés.
- CHN-5 : une idée du carnet n'a ni barre ni fiche au Calendrier (c'est une icône de bande). Le saut pose donc ± (réglage d'affichage non gardé), l'ampoule de sa semaine et un message avec « Ouvrir le carnet ». Aucune maquette choisie n'existe pour cet état (règle n° 1 : rien de neuf dans l'écran, un message du composant existant).
- CHN-6 : la période de l'en-tête du Calendrier (pastille « Nov. ») lit la fenêtre sautée tant qu'on ne change pas la période de l'app ; la barre de l'app dit « Nov. ». Écart voulu entre les deux, lié à CHN-1 (voie du bord/horizon).
- Fait en 390 tactile, clair et cave, sur banc local. 1280 et en ligne non joués.
- `geste.mjs` porte d'autres hunks d'autres voies : non commités par moi (hunks 3 à 6 laissés).

## DÉCISION À PRENDRE
Barre de l'app collée sur le Calendrier (CHN-11) : option A (faite : barre sticky sur ce seul onglet), option B (ajouter ‹ › et la loupe dans l'en-tête déjà collé du Calendrier, `EnTete.tsx`, après V8/V9), option C (ne rien faire, 19.11). Recommandation : A tant que le brasseur ne dit pas qu'elle prend trop de place ; sinon B.

CONNAISSANCE : aucune
LEÇON PROPOSÉE : aucune
