# Reprise — voie cal-26 (21.11) : courbe des prix (CAL-FRISE-PRIX, CAL-ECHELLE-FIGEE, CH-visuel 1-3 et 11). Arrêtée à 156 k, RIEN CODÉ.

Outillage, scratchpad, builds (tour8 gardé, arbre) : REPRISE-CAL-24.md. Ne pas toucher calendrierGestes.ts ni la feuille (autre voie) ;
principes.mjs en lecture seule. Commit par chemins, index temporaire (`cal-24/commit.mjs`). Chaque point : un contrôle rouge sur tour8, vert sur l'arbre
(étape geste.mjs, via `geste-mien.mjs`, `--endroits calendrier`), plus un test vitest pour les fonctions pures.

## Diagnostic (lu, sûr)
- Cadre actuel : `src/ui/calendrier/entete/Fenetre.tsx` l. 223-321, `demarrer(genre)` à la main (listeners window). Début = DÉPLACE la fenêtre
  (faux, R6), fin = étire ; corps du cadre = lecture (usePointeurCourbe). EnTete l. 437-452 décide par `zonesPoignees` (44 px) puis `z.tirer`.
- Modèle à reprendre : `src/ui/finance/operations/Frise.tsx` l. 87-131 (useGlisse + roleSous + poserPlage, R5 pan au bord, R7 resserre l'échelle
  ancrée sur l'autre bout, lacher/annuler). `src/ui/geste/` : `roleSous(x, xa, xb)` (22 px dehors, ≤ 1/3 dedans), `poserPlage(role, a0, b0, d,
  {min:0, max:total, minLarg:1})`, `cadrerDeuxBouts`, `useGlisse(rappels)` → ref. APPUI_LONG_MS = 450 (`src/ui/gestes/useAppuiLong.ts`).
- Plan Cadre : unités = semaines, fin exclusive (a0 = index, b0 = index + nombre, xa = (a0 − v0)·unit, xb = (b0 − v0)·unit). Attacher
  `useGlisse` au nœud de la petite courbe (cadreCourbe, `refCourbe` d'EnTete) via une ref passée au Cadre ; `saisir(x)` rend null hors de
  [xa − 22, xb + 22] (alors usePointeurCourbe lit, c2-b) et fait `e.stopPropagation()` sinon (le listener natif passe avant le onPointerDown
  React délégué) ; retirer `prise`/`zonesPoignees` de la décision d'EnTete (garder `versCourbe` pour l'ajustement tactile). Corps : minuterie
  450 ms à la saisie ; sans R1 avant elle → `s.lit = true`, `onLire(index)` (setLecture), puis `suivre` lit (`indexSous`) au lieu de déplacer ;
  R1 franchi avant → minuterie coupée, corps déplace (R5). Lâcher : `onChange({index:a, nombre:b−a})` + `recaler` (garder recaler existant).
  Supprimer le geste natif `demarrer` et le `onAnnee` automatique du lâcher (voir ÉCHELLE). Les boutons `.ent-poi` restent pour le clavier
  (clavierDebut : passer en R6, étirer le début).
- Étape geste.mjs existante « reculer le début » vérifie `b.n === a.n` : à réécrire en R6 (durée change, fin reste).
- ÉCHELLE FIGÉE : `Fenetre.tsx` `suit` fait `if (annee) return;` (l. 285) et `fin` en An appelle onRevient (l. 303) ; `EnTete.tsx` l. 181 force
  `nombre` à 52 en An ; `MenuPeriode.tsx` l. 105 `actif(52) = annee || semaines >= 52`. À faire : gestes actifs en An ; `onChange` depuis l'An →
  `onVue('semaines')` + `ecrire` (quitter l'An) ; menu : `libelleDuree` dit « 40 sem. », rien de coché ; `echelleEffective` (echelle.ts l. 32) :
  mois au-delà de 26 sem. aussi hors An (sinon 40 colonnes de semaines à 390). Étape : An, étirer/réduire au doigt → durée ≠ 52, « An » non
  coché, rechoisir « 3 mois » = 13 sem.
- BANDEAU : `src/ui/PersistenceStatus.tsx` l. 10, `<div role="status" className="px-4 py-1.5 …">` dans le flux : passer en `fixed` (haut, z au-
  dessus, `pointer-events` sur le bouton seul). Étape : forcer l'état « Enregistrement… », écart du haut de la courbe ≤ 1 px.
- NOMS (Courbe.tsx) :
  - CH-visuel-1 (cause probable sûre) : `toucheLeTrace` l. ~238 prend `j0 = floor(l / g.unit)`, juste seulement si x(j) = j·unit ; avec
    `avecAbscisses` (vue R4 et aligné) les colonnes sont décalées → le test regarde les mauvaises semaines, les noms se posent sur le tracé.
    Corriger : parcourir les j dont [g.x(j), g.x(j+1)] croise [l, r]. Étiquette du cadre (`.ent-cadre-l`, `.ent-cadre-tir`) : fond opaque
    (var de surface) en CSS `entete.css`, aucun trait ne la traverse.
  - Ligne zéro : ajouter aux obstacles (`obstaclesCourbe` ou appel l. ~540) une bande {t: y0 − 2, b: y0 + 2, toute la largeur} quand
    `g.lo < 0`, et la boîte du repère « 0 » (x largeur − 3, ancre end, y0 − 3 ; ≈ 12 × 16 px, + 6 px d'écart) — CH-visuel-2 (« −45 » + « 0 »).
  - CH-visuel-3 (escalier en aligné) : dans `placerNoms`, refuser un nom dont l'étendue x croise déjà 2 noms posés (au plus 2 rangées
    empilées) ; le reste se lit au doigt.
  - CH-visuel-11 : `src/ui/calendrier/frise/Barre.tsx` l. 113 et `DetailChose.tsx` l. 262 écrivent « ' +' » après le montant (partiel) :
    écrire « + à venir » (comme le pied « −228 + coût à venir »). Barre.tsx n'est pas calendrierGestes : permis.

## Reste, dans l'ordre
1. Cadre useGlisse + appui long (CAL-FRISE-PRIX R1-R10, D410). 2. ÉCHELLE FIGÉE. 3. Bandeau fixed. 4. Noms (toucheLeTrace, zéro, 0, empilement,
fond de l'étiquette du cadre, « + à venir »). 5. Étapes geste.mjs (rouge tour8, vert arbre ; 390 tactile et 1280, deux thèmes), vitest
(`tests/unit/calendrier*`, Courbe : placerNoms avec abscisses décalées), build `VITE_HOP_V4=on VITE_CARNET_IA=production`, commits par chemins.
6. BUGS.md (dépôt Brasserie) : lignes CAL-FRISE-PRIX, CAL-ECHELLE-FIGEE, CH-visuel-1/2/3/11.
