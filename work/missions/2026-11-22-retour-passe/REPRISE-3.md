# REPRISE-3 — Frise du temps du Calendrier : finir et éprouver (22.11, Opus, arrêt à ~150 k)

Worktree `port-carnet`, branche claude/port-carnet-1711, partagé : commit par index temporaire (GIT_INDEX_FILE, read-tree HEAD, seulement
ces hunks). L'index réel a des entrées périmées pour calendrier.mjs, geste.mjs, CalendrierTab.tsx (MM) : ne pas y toucher.
Nouvelle règle du brasseur (22.11) : « les deux thèmes, pas besoin, et surtout testé en version téléphone, peu en version desktop » :
épreuve en clair seul, 390×660 tactile et 844×340 en profondeur, 1280 en simple contrôle.
Aucun commit dans cette passe (rien n'était vert d'un bout à l'autre). Rien n'est écrit avec Bash (regex).

## Non commité, à moi (tsc sans erreur sur ces fichiers)
- `src/ui/calendrier/frise/DureeFenetre.tsx` + `FeuilleAjout.tsx` : T9-3. Prop `jourSeul` : sans fin ni jours actifs, la Durée dit
  « 1 j · le S52, mar. 22 déc. » (le jour `jourDit`) au lieu de « 1 semaine · jusqu'à …, dim. ». Non prouvé au banc.
- `src/components/tabs/CalendrierTab.tsx` l.654 : le message d'échelle ne dit plus « , Finances aussi » (faux depuis CAL-PERIODE-APP-FIXE).
- `scripts/parcours/geste.mjs` : `tenirAuBord` (doigt tenu, levé AU bord) et `sectionT9` (T9-1 barre « lol » tenue 2,1 s au bord droit en
  6 sem. : fenêtre agrandie, même début, posée dans la vue ; T9-2 poignée de début tenue 3,6 s au bord gauche : ≥ 8 sem. de recul en un geste ;
  T9-3 fiche « Marché de Noël » (souche) = Durée de Modifier), enregistrée en fin de liste. `node --check` OK. NON LANCÉE.
- vitest réécrits « onPeriode non appelé » (8) : calendrier-onglet (E07 3 mois, d3, CRITIQUE-10 n° 2), calendrierEchelle (PC-144 ×2),
  calendrierGestes (n° 4 paysage), calendrierPeriodeFinances (×3). Rejeu des 6 fichiers : 167/169 verts. Restent :
  (a) calendrier-onglet « C19 … CRITIQUE-4 n° 9 (D-68, E34, D404) : dans l'App, Plus de détails › » : NOUVEAU, cause non lue (vérifier si
  `jourSeul` ou mes réécritures ; `git stash` interdit : comparer en lisant l'assertion) ; (b) calendrierMenuV12 CHN-3 (« S47 – S48 2026 »
  attendu sans année : étiquette de cadre, hors voie ou à trancher). calendrierLotA (`--cave-100` clair) hors voie.

## Rouges obtenus (C:/tmp/rp/an-t9.log et an-arbre.log ; captures C:/tmp/rp/ge-an-t9, ge-an-arbre)
- tour9 : sectionEtiquettes 1 KO (« S44 » deux fois à 1 sem.) + période de l'app changée ; arbre : sectionEtiquettes VERTE. CAL-FRISE-ETIQUETTES
  : rouge sur tour9, vert sur l'arbre (capture 35 non reproduite au-delà).
- sectionAn390 rouge sur tour9 ET sur l'arbre. Faux positifs à retirer du contrôle : `.sr-only` (« Compagnon hors connexion », h1
  « Calendrier ») ; zone « entete » trop haute (remonte jusqu'à la barre d'onglets : « Papiers » croise « Bord ») : prendre la racine de
  l'en-tête du Calendrier (EnTete), pas un ancêtre commun ; à An « zone introuvable » (pas de `.ent-cb` ou de bande en An : lire EnTete).
- Vrais défauts (capture an390-An-fiche.png ouverte) : fiche à 390 : pastilles « 27 o… », « cou… » ; actions « Com… » (Commander).
  Cause : `fiche.css` `.cal-fi-p { flex: 1 1 0 }` et `.cal-fi-act { flex: 1 1 0 }`, `.cal-fi-pri { flex: 2 1 0 }` partagent à parts égales.
  Correction prévue : `flex: 1 1 auto` (pri `2 1 auto`), padding/gap 3 px, `b` 13 px ; re-mesurer (la ligne b fait ≈ 310 px à 390).
  Étiquettes de rangée `span.cal-lbl` « Fruty », « Ttt » rognées de 2 px (143 > 141) : arrondi de `d.place` (Rangee.tsx l.469-490, Math.floor ?).
- À l'œil (An, 390) : mois « O N D J'27 … » lisibles ; « prévu oct. 26–oct. 27 » de la rangée Brassins passe sur 2 lignes (« 27 » seul).

## Reste dans l'ordre
1. Corriger le contrôle sectionAn390 (faux positifs), corriger fiche.css et cal-lbl ; rouge tour9 / vert arbre ; commit.
2. Lancer sectionT9 sur tour9 (`--ref en-ligne/2026-11-22-tour9 --sections sectionT9 --largeurs 390 --themes clair`) puis sur l'arbre ;
   corriger T9-1 (`defilerFenetre`, CalendrierTab l.1028 : `mode 'glisse'` rend false si `aDesJours` ; limite `PERIODE_DE_L_ECHELLE.mois`)
   et T9-2 (Fenetre.tsx `bord` l.294 : span borné à `total * 1.3`, `o.min: 0`) si rouges ; commit avec la T9-3.
3. Lire la cause du C19 vitest ; commit des vitest.
4. REPRISE-2 point 1 : calendrier.mjs étape 9 (G5 : choisir « 3 mois » avant l'instantané) et rechargement (barre S52, fête) non faits.
5. Épreuve au doigt (clair, 390×660 et 844×340 en profondeur, 1280 simple) → Brasserie work/missions/2026-11-22-frise-epreuve/EPREUVE.md ;
   BUGS.md (Brasserie) : T9-1..3, CAL-FRISE-ETIQUETTES, CAL-AN-390 ; calendrier.mjs et geste.mjs --endroits calendrier complets en
   arrière-plan ; controle-bugs.

LEÇON PROPOSÉE : un contrôle « texte rogné » doit écarter `.sr-only` et borner sa zone à l'élément nommé, sinon il est rouge partout et ne
distingue plus la version rejetée.
