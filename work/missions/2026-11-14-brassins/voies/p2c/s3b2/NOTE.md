# NOTE s3b2 — Le plan en filigrane, passe 2 (série C, l'écart au prévu)

Chaleur : tiède (forme de s3b gardée : frise du plan en tuiles par jour, réel par-dessus ; plancher enrichi, L07).
Base : `voies/s3/s3b/etat.html`, copiée puis refaite ; classes `s3b2-`, script dans une fonction immédiate (L26).
États : `?etat=repos|geste|dryhop|liste`, `&theme=clair|cave`. Captures : `node capture.mjs` dans ce dossier.

## Défauts t1 de s3b, corrigés
1. Étiquettes sur leur point : OG 1,062, 1,058, 1,030 et 1,018 chiffrés chacun à côté de son point ; °C 19,3 · 19,6 · 19,4 · 19,1 aussi.
2. 19,6 gris (dans 18 à 20 °C, retouche commune 2). La tolérance est écrite une seule fois, en tête de frise : « consigne 19 °C (18 à 20) ».
3. Repos à 21 °C : une tuile par jour, J+7 à J+9 seulement (plus de bande qui commence avant J+7) ; garde 2 °C en J+10 et J+11.
4. Bas rempli : calendrier 12 cases, puis Stock, Carnet, Dossier en boutons de 48 px avec icône et mot. Vide sous le pied : environ 59 px (< 80).
5. Curseur du geste : bande 18 à 20 °C sur l'échelle 17–23 (bornes 18 et 20 en vert sous la piste).

## Retouches communes
1 remplissage (0,61 au premier écran) · 2 consigne 18–20 partout, « °C cuve » dit comme une action (Relever), pas un badge · 3 chiffres :
virgule resserrée en mono, unité hors du mono, une espace · 4 aucune étiquette sous la colonne du jour ni sous la ligne du dry hop
(le FG est passé à gauche de la bande, « encore 0,004 » à droite) · 5 cibles ≥ 44 px (contrôle : aucun bouton sous 44) · 6 s.o. · 7 « Ajouté
aujourd'hui · sort 180 g du stock » au repos.

## Greffes reçues
- Calendrier de 12 cases (s3e) + cases °C face à /19 (s1c) : fusionnés en une grille 2 × 6, date, densité, °C/19 ; futures en pointillé, teinte
  de leur phase (19 vert, 21 cuivre, 2 bleu) ; J+5 encadré, « à relever » puis « relevée 19,2/19 » après le geste.
- Pastilles d'écart datées (s2e) : « 13.11 · bande +0,004 » (densité), « 13.11 · dans la consigne » (°C). Pas de pastille d'alerte.
- Dry hop au geste (s3d) : « Dry hop · J+6 barré → J+5 », « ajouté le 14.11 », « 1 j d'avance », « stock −180 g », Annuler ; dans la frise, la
  goutte passe de J+6 (barrée) à J+5 ; dans le calendrier, J+6 barré, J+5 « dry hop ».
- Barre des phases Fermenter · Repos · Garde · Cond. sous l'en-tête (s2a, ligne « Reçue par s3b » de la SYNTHÈSE).
- Liste à mini-courbes (s1a) : NEIPA sur son plan (bande FG, repos et garde en filigrane, jour, dry hop), Pils sur la seule partie connue
  (1,010 depuis le 06.11, « avant le 06.11 : — »). Pale Ale en retard en tête : Brasser / Replanifier.
- Relevé dans la rangée du jour, sans feuille (s1b) : le curseur s'ouvre à la place de la rangée.

## Baseline (BRIEF-AUTEUR « Obligatoire »)
- [x] geste m2 : piste, bande cible 18–20, ±0,1, valeur tapée au crayon, pas de `type="number"` (grep : 0)
- [x] grammaire z1 : en-tête de lot, « Relevés du jour », rangées-cartes ; jetons clair et cave
- [x] J+5 · levuré le 09.11 (en-tête), J+n et date dans chaque case
- [x] deux températures : °C cuve (rangée, cases /19) et « Densité + °C éch. »
- [x] FG en bande 1,010–1,014 ; « — » pour l'inconnu (°C du 09.11, °C du jour) ; aucun chiffre inventé (19,2 = saisie simulée du geste)
- [x] dry hop nommé, dosé, daté ; « Ajouté aujourd'hui » date et déstocke en un geste
- [x] premier plan actionnable, ni cockpit ni bandeau ; alcool 5,8 % et att. 71 % « provisoires »
Écarts : aucun. Hypothèse : liste des « Prochains gestes » tirée du plan de recette (15.11, 16.11, 19.11 « si stable ») ; fermenteur de la Pils non donné, non affiché.

## Boosters UX (boosters-ux)
- frise-plan (suivre : tuiles du plan, points réels, colonne du jour) ; curseur-cuve (ajuster : piste m2, effet vu : point 19,2 dans la frise et
  case J+5) ; releve-densite (déclencher) ; dryhop-ajoute (déclencher : J+6 → J+5, stock −180 g) ; calendrier-plan (lire) ; phases (suivre).
- B2 une primaire par état (Relever, puis Enregistrer) · B3 premier écran sans paragraphe · B6 chiffres en IBM Plex Mono, rien sous 12 px ·
  B7 contraste OK (COMMUN) · B8 inconnu « — » · B13 aucun bouton sous 44 px (mesuré par capture.mjs).

## Contrôles (sorties dans ../tests.txt)
- controle-panel : remplissage médian 0,61, 0 sous 0,50 ; DIVERSITÉ 0,91 → PANEL ECHEC, structurel : la mesure ne porte ici que sur 2 captures
  d'une même variante (repos et geste partagent forcément la frise).
- controle-commun --sans=mots --profil=sans-houblons : COMMUN OK (couleurs, survol, blocs, contraste, standard, parlant, brutes).
