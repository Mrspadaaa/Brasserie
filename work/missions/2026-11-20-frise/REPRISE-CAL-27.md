# Reprise — voie cal-27 (21.11), CHG-4, 5, 6 : arrêtée à 153 k (contrat : 120 k). Rien codé, rien commité ; conception lue et arrêtée ci-dessous.

Suite de REPRISE-JOUR-2.md (relance 5) et REPRISE-CAL-26.md (points 4 à 6). Outils : `<S>/jour/jouer.sh`, `<S>/jour/commit-geste.sh`
(`<S>` = scratchpad `C:/Users/mrspa/AppData/Local/Temp/claude/2574149e6fd34767/16fc09ec-4e69-48a9-9744-5912b6ef6552/scratchpad`).
Diff HEAD au départ : seul `Rangee.tsx` (autre voie ; NE PAS toucher, ni Fenetre, EnTete, Courbe). CalendrierTab, calendrier.ts,
calendrierGestes.ts, Barre.tsx, usePointeur.ts, geste.mjs : propres. Relire `git diff HEAD -- <f>` avant chaque commit (V8, V10 écrivent).

## Lieux lus (lignes au 21.11)
- `usePointeur.ts` : `surLeBord` l. 81 ; `Etat` l. 88 ; `onPointerDown` l. 225-268 (`bord` l. 228, `annuler` l. 234-242) ; effet l. 209-219
  (`onBord` l. 217) ; move bord l. 337-346 ; `fin` l. 352-370 (`onLacheBord` l. 362).
- `Barre.tsx` : props `decalage`, `allongement` l. 87-88, `onBord`/`onLacheBord` types l. 103-104 ; `peutBord` l. 303 ; `usePointeur({…})`
  l. 325-359 ; `w = largeur + allongement` l. 370 ; `posee(gauche + decalage …)` l. 407, 420-421, 541, 545.
- Rangee l. 1023-1025 passe `decalage` (glisse) et `allongement = drag.jours × largeurJour` (bord), puis `{...props.barre}` : rien à y changer.
- `CalendrierTab.tsx` : `surLacheGlisse` l. 529, `surBord` l. 543, `surLacheBord` l. 548, `finGeste` l. 502, `defilerFenetre` l. 958-976
  (`fenetreRef`, `setFenetre`), import domaine l. 34.
- `calendrierGestes.ts` : `deplacerDe` brassin l. ~260-300 (`departBrassin`, garde `debutHorizon`, `rescheduleBatchPatch`, `courbeBrassin`,
  `texteEffetCreux`, `reperes`) ; `allongerBrassin` l. 311 ; `dureeAllongee` l. 375 ; `allonger` l. 387 (fenêtre, `courbeAvecMise`, `miseDe`, `planDe`).
- `calendrier.ts` l. 868-873 : brassin en cuve, `finInconnue`, raison « … Seul le jalon de fin se glisse. » (citée aussi dans message.css l. 99, commentaire).

## Conception arrêtée
CHG-4 (bord de début)
- usePointeur : `export type CoteBord = 'fin' | 'debut'` ; `surLeBordDebut(el, x, zone)` : `x >= r.left - zone && x <= r.left + min(zone, r.width/4)`
  (w/4 : le corps garde ≥ 5/12 de la barre) ; option `zoneBordDebut?` ; `Etat.cote`. À l'appui : `[data-bord]` (valeur `debut` → début,
  sinon fin) > `surLeBord` → fin > (pas sur `[data-jalon]`) `surLeBordDebut` → début. `onDebutBord?.(cote)`, `onBord?.(k, dx, cote)`
  (2 appels), `onLacheBord?.(k, annule, cote)` (2 appels). Dans `fin` : bord début sans `bouge`, non annulé, < 500 ms → `onToucher(s.cible)`
  aussi (le toucher près du début ouvre encore le détail).
- Barre : `peutBordDebut = peutBord && chose.deplacable === true` ; `zoneBordDebut: peutBordDebut ? ZONE_BORD_PX : 0` ; pas de poignée
  visible à gauche (maquette inchangée). État local `coteBord` (posé par `onDebutBord`, remis à 'fin' au lâcher). Début tiré :
  `decalage effectif = decalage + allongement`, `allongement effectif = −allongement` (la fin reste). Types `onBord(chose, jours, cote?)`,
  `onLacheBord(chose, jours, annule, cote?)`.
- Domaine `allongerDebut(chose, jours, ctx)` et `dureeDebutTiree(chose, jours)` (« 5 nov. → 12 déc. ») dans calendrierGestes.ts :
  fête, activité : `fenetre.du` décalé, `au` gardé, patch `{ date: du, fenetre }` ; plan manuel : `{ fenetre, date: miseDeCote ? au : du }`,
  courbe `courbeAvecMise` si mise de côté et centimes, sinon `courbeDecalee(courbe, id, ecart date→du)` ; refus si `du > au`.
  Brassin `deplacable === true` (planifié) : `nouveau = decale(departBrassin(chose, prevu, ctx, true), jours)`, garde `debutHorizon`,
  fin vue `chose.preteLe ?? chose.pretePrevue ?? finDeBrassin(batch)?.jour` (sinon refus « Sa recette ne dit pas… » comme allongerBrassin),
  refus si `nouveau >= fin` ; patch `rescheduleBatchPatch(batch, nouveau)` + `finPrevue = fin` ; courbe `courbeBrassin(…, repli = écart
  ancienne fin → fin)` ; message `texteEffetCreux ?? « titre : reperes(depart) → reperes(nouveau) »`. En cuve : refus (raison de la chose).
- Tab : `surBord(chose, jours, cote = 'fin')` (texte : `dureeDebutTiree` si début) ; `surLacheBord(…, annule, cote)` →
  `allongerDebut` si début. Tests vitest à ajouter dans `tests/unit/calendrierGestes.test.ts` (fête : du −14, au gardé ; brassin planifié :
  plannedBrewDate −14, finPrevue = fin d'avant ; en cuve : refus).
CHG-5 : Tab `fenetreAvant = useRef<FenetreSemaines | null>(null)` posée dans `defilerFenetre` (si null, `f` avant changement) ; lue au début
  de `surLacheGlisse` et `surLacheBord` (avant `finGeste`), remise à null ; si `annule` et posée : `fenetreRef.current = avant; setFenetre(avant)`.
  `finGeste` la remet aussi à null. Marque passe par le même `surLacheGlisse` (à vérifier : Rangee l. ~998 `{...props.barre}` ou équivalent).
CHG-6 : Barre `peutBord` vrai aussi si `brassin && chose.finInconnue` (sans `deplacable === true`) ; `allongerBrassin` écrit déjà
  `finPrevue = chose.fin + jours` (fin = aujourd'hui). calendrier.ts l. 872 : sans fin, raison « Brassin en cuve : le jour de brassage ne bouge
  pas. Tire son bord droit pour poser sa fin. » (avec fin : inchangée). Vérifier qu'aucun test ne cite l'ancienne phrase (grep : aucun dans tests/).

## Étapes geste.mjs (un bloc par point, marques distinctes, avant `  // ── CAL-VIDE (21.11`, appel après `  await sectionBarreBord();`)
Fixture `scripts/parcours/fixtures/calendrier.mjs` : `B-SSR` « Ssr » planifié s(−2) l. 46 ; `B-MILK`, `B-NEIPA-TEST` en cuve sans fin l. 56-57 ;
`P-ACHAT-1` « Commande de malt » s(2,1) l. 85. Cache : `JSON.parse(localStorage[CLE_CACHE]).find(x => x.id === id).data`
(brassin : `plannedBrewDate` en format suisse, `finPrevue`). Barre : `[aria-label^="Nom,"]` ; message : `[data-message]` ; aide : `barreGeste`,
`valeurGeste`, `glisser(x0, y, pas(a, b), { pendant })`, `choisirPeriode`, `versCalendrier`, `cap`, `ok`/`echec`, CDP comme sectionBarreBord.
- CHG-4 (`// ── CHG-4 (21.11`) : 3 mois, 390. « ZZ TEST Geste » ramenée si son début est à < 100 px du cadre gauche ; doigt à `l + min(4, w/5)`,
  tiré de −2 colonnes (hors bande de 40 px) : attendu `du = a.du − 14`, `au = a.au` ; puis rechargement relu. tour8 : la barre entière part (KO).
- CHG-5 (`// ── CHG-5 (21.11`) : tactile seul (sinon sauté, ok). Marque « Commande de malt » (`[aria-label^="Commande de malt"]`) : lire sa gauche
  et le libellé de période ; touchStart, touchMove jusqu'à `fr.r − 12` en 12 pas, tenir 1 s, `Input.dispatchTouchEvent` `touchCancel` ;
  attendu : date du cache inchangée, période inchangée, gauche ±2 px. tour8 : gauche décalée de ~4 colonnes (KO).
- CHG-6 (`// ── CHG-6 (21.11`) : 3 mois, 390. « NEIPA Test » : bord droit à `r − min(8, w/4)` tiré de +2 colonnes ; attendu `finPrevue` posée,
  à aujourd'hui + 14 j (±1). Puis « Milk Stout » glissé par le corps : `[data-message]` ne contient pas « jalon de fin ». tour8 : aucune finPrevue (KO).
Puis `<S>/jour/jouer.sh chg 390 "CHG|KO "` (rouge tour8, vert arbre), tests (`calendrierGestes` unit + integration, `calendrierEntete`,
`toucherFantome`), `npx tsc --noEmit -p .`, commit par `commit-geste.sh` (une fois par point ou un commit pour les trois blocs, chemins :
usePointeur.ts, Barre.tsx, CalendrierTab.tsx, calendrierGestes.ts, calendrier.ts, test unit). BUGS.md (Brasserie) l. 2130-2132 : CHG-4 à 6
« corrigé (<sha>) » à la main, puis `node scripts/agents/controle-bugs.mjs` (dans Brasserie) doit sortir OK.

## ÉTAT cal-28 (21.11, arrêt à ~150 k) : CORRECTIFS ÉCRITS, NON COMMITÉS ; reste étapes geste, jouer, commit, BUGS
Fait (arbre, tsc propre, `npx vitest run tests/unit/calendrierGestes.test.ts` 52 verts) :
- `usePointeur.ts` : `CoteBord`, `surLeBordDebut`, `zoneBordDebut`, `Etat.cote`, callbacks avec `cote`, toucher du bord début = onToucher.
- `Barre.tsx` : import `type CoteBord`, `coteBord` (état), decalage/allongement effectifs, `peutBord` (+ brassin `finInconnue`, CHG-6), `peutBordDebut`, `zoneBordDebut`, onDebutBord/onBord/onLacheBord avec cote.
- `calendrierGestes.ts` : `allongerDebut`, `dureeDebutTiree` (avant « Livrer le 5 janv. »).
- `CalendrierTab.tsx` : import `CoteBord`, `allongerDebut`, `dureeDebutTiree` ; `fenetreAvant` + `rendreFenetre(annule)` (CHG-5) dans surLacheGlisse et surLacheBord, posé dans `defilerFenetre`, remis à null dans `finGeste` ; `surBord`/`surLacheBord` à `cote`.
- `calendrier.ts` l. 873 : raison sans fin « … Tire son bord droit pour poser sa fin. » (HUNK À ISOLER : le fichier a d'autres hunks, V8/V10 ; `git diff HEAD -- src/domain/calendrier.ts`).
- `tests/unit/calendrierGestes.test.ts` : import l. 9 + describe final « CHG-4, CHG-6 » (3 tests verts).
Reste : (1) blocs geste.mjs CHG-4/5/6 (conception ci-dessus ; helpers lus : `barreGeste` = ZZ TEST Geste {l,r,w,y,col}, `valeurGeste` {du,au,cle}, `glisser(x0,y,pas(a,b),{pendant})`, `choisirPeriode`, `echap`, `cap`, `ajouter`, `auj = new Date().toISOString().slice(0,10)` l. 231, `tactile`, `periode()` = aria-label `[aria-label$="période, liste, tri et filtre"]`, cache `CLE_CACHE`) à insérer avant `  // ── CAL-VIDE (21.11` (l. ~650), appel après `await sectionBarreBord();` (l. ~685) ;
(2) `<S>/jour/jouer.sh chg 390 "CHG|KO "` : rouge tour8, vert arbre (corriger l'étape si l'arbre est rouge) ; (3) vitest `calendrierGestes` unit+integration, `calendrierEntete`, `toucherFantome`, `npx tsc --noEmit -p .` ; (4) commit par `commit-geste.sh` (chemins : usePointeur.ts, Barre.tsx, CalendrierTab.tsx, calendrierGestes.ts, calendrier.ts = mon seul hunk, test unit) ; (5) BUGS.md l. 2130-2132, puis `node scripts/agents/controle-bugs.mjs` (dans Brasserie).
Note : un heredoc `<<'EOF'` long a échoué deux fois en Bash (« unexpected EOF ») ; écrire les modules d'édition avec l'outil Write dans le scratchpad, appliquer par `node <S>/rep.cjs <fichier> <module.cjs>` (paires [ancien, nouveau], échec si non unique).
