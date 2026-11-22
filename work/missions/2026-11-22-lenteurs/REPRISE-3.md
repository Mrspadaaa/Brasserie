# Reprise 3 — lenteurs (23.11), arrêt à ~140 k

Faits : banc CAL-LENT `eae658145` (lenteur.mjs : retour à « 3 mois » avant d'ouvrir l'événement) ; cause 2 `108409571` (PageShell : isolation et focus après la 1re image, Recette 472 → 280 ms) ;
BUGS.md (WFP-9, WF2-3) `c091d1a6d` + `controle-bugs` vert ; MESURES.md § 4 à jour. Port-carnet : tous mes commits par `scratchpad/commit.sh` ; BUGS.md par `outils/bugs-ligne.mjs` (ne prend pas les lignes d'un autre agent).
Outils neufs (`outils/`) : `trace-somme.mjs` (somme par type d'une trace devtools.timeline, avec les éléments de UpdateLayoutTree), `exp-style.mjs` (coût en page d'un attribut/inert/pointer-events), `pas2.mjs` : pas `prof` (démarre le
profil ici) et `TRACE=1` ; `pas/poser.txt`, `ajouter.txt`, `recette.txt`. Builds : `%TEMP%/lenteurs-22-11-b/build-{c0 (HEAD), c4 (.cal-tab, défait), c5 (PageShell retenu), c6 (variante B, rejetée)}`.

Reste, dans l'ordre :
1. Banc CAL-LENT (`lenteur.mjs`, 5 tours, `ab2.mjs`) rejoué sur un build de HEAD : pas fait, ouvrir/Modifier/Enregistrer à vérifier (5/5 ?).
2. Feuilles Radix du Calendrier (Poser un brassin 300–420, Ajouter en 450, Noter 260–460) : recalcul de style de ~970 éléments à l'insertion. À essayer, A/B + trace : monter le détail de la feuille après la 1re image ;
   `content-visibility: auto` sur le calendrier derrière la feuille ; Sheet.tsx `onOpenAutoFocus` (le focus() de Radix FocusScope force le style). Mesurer avec `trace-somme.mjs`, pas à l'INP seul (bruit ±100 ms à n=5).
3. Recette (280) : précharger `yeastReferences` au repos, `measure` du hook visualViewport (137 ms) après la peinture.
4. Toucher une semaine (~500) : profil après eb90d630b non fait ; Courbe.tsx (`placerNoms`) appartient à l'agent de la frise : lui rendre la mesure ou attendre son commit ; côté Frise.tsx : `setSousFab` rend la frise entière.
5. Brassin : Commencer le brassage est déjà ≤ 200 ms médian sur HEAD (cause 4 non reproduite).
