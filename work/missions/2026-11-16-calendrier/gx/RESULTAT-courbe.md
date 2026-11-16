OK — 10 mini maquettes des gestes de la courbe sur g-d1, avant/après, clair et cave, page14/courbe.html

## Fichiers écrits (voie courbe)
- `gx/gx.js`, `gx/gx.css` : couche injectée dans une copie de `paliers/g-d1.html` (non modifié). `gx/serie.json` : caisse lue sur la courbe de g-d1.
- `gx/build.mjs` (20 pages `gx/c?-?-avant|apres.html`), `gx/cap.mjs` (captures DPR 2 + règles dures), `gx/planche.mjs`, `gx/dbg.mjs`, `gx/page-courbe.mjs`.
- `gx/cap/c?-?-{avant,apres}[-cave].png` (40), `gx/cap/pl-*.png` (planches de lecture).
- `page14/courbe.html` (même forme que `page14/frise.html`), `page14/img/c?-?-*.webp` (40).
- Fichiers de la voie frise (`f*`, `build-frise.mjs`, `page14/frise.html`) : pas touchés.

## Une ligne par version
- c1-a : tirer la fenêtre bleue sur la courbe jusqu'en février : bande et frise passent à S5–S10 (IPA, Carnaval, frigo de côté), fantôme de l'ancienne fenêtre, « ↩ 16 nov. ».
- c1-b : glisser la frise vers la gauche, la fenêtre avance sur la courbe (S50–S2), soldes et barres suivent.
- c2-a : toucher un point de la courbe (S13) : fiche sous la courbe, 5 mouvements nommés = −892, libre 2 908, « Voir S13 dans la frise ».
- c2-b : toucher une semaine de la bande (S50) : sa colonne s'allume, Marché de Noël et facture ressortent, le reste s'efface, compte +1 180 −312 +120 = +988.
- c3-a : glisser le long de la courbe : le chiffre de tête lit la semaine sous le doigt (2 908 · S13 · −892), étiquette des deux plus gros mouvements.
- c3-b : appui long : la courbe s'agrandit (axe 0–6 000), la frise s'efface, la semaine S22 détaillée dessous (−400, −381, +120 = −661).
- c4-a : glisser le Porter d'une semaine dans la frise : courbe zoomée avant/et si (+176), S51 → 5 240, « au plus serré : inchangé », Annuler/Valider.
- c4-b : appui long sur la marche du malt de printemps (S13) posée en S27 : courbe agrandie recalculée, 113 → 653 au plus serré, Annuler/Valider.
- c5-a : pincer la frise : 3 mois (13 semaines), bande en mois + barres du libre, fenêtre élargie sur la courbe.
- c5-b : tirer la poignée droite jusqu'au bout : l'année, 12 mois en barres, juin cerclé (113), frise d'un an étiquetée par gros montants.

## Contrôles (sortie décisive)
- `node gx/build.mjs` → `BUILD OK 20 pages`.
- `node gx/cap.mjs` → `REGLES OK` sur les 40 captures : police ≥ 14 px, aucun texte coupé ni chevauché, rien hors des 390 px, + à 16 px au-dessus des onglets (inchangé de g-d1).
- `node gx/page-courbe.mjs` → `PAGE OK 40 images`.
- `controle-panel.mjs` (10 après) → remplissage médian 0,74, 0 sous 0,50 ; ressemblance 0,92 → `PANEL ECHEC` (diversité). Écart voulu : ce lot n'est pas une série v0 ; les 10 partent tous de g-d1, son choix (règle n° 1).
- Captures ouvertes : les 10 planches en clair, 3 en cave, plus c5-b en plein format.

## Chiffres
Même caisse que g-d1 (libre 4 032, 4 152, 4 132, 5 120, 5 064, 5 550 ; au plus serré 113 en S24). Mouvements nommés posés pour S5–S10, S13, S21–S24, S50 : leur somme égale l'écart de la semaine. Pour c4, le recalcul déplace un montant entre semaines : Porter −176 de S51 à S52, ou malt −540 de S13 à S27, soit +540 de S13 à S26 et 653 au plus serré.

## Limites vues
- La puce « 6 sem. » de g-d1 couvre déjà le haut du pinceau (défaut n° 11 de CHOIX-CALENDRIER) : en c1-a et c5-b, le doigt la recouvre en partie.
- c4-b (appui long sur la courbe) n'a pas d'indice au repos ; c2-a peut lui en servir (la fiche liste les mouvements que l'on peut décaler).
- c5-a et c5-b : la frise s'allonge, car elle a plus de choses à montrer ; en année, les petits montants n'ont plus d'étiquette.

Prédiction : il comprendra c2-a, c4-b et c3-b en trois secondes (« là je vois ce qui fait bouger la caisse »), et trouvera c5-b trop chargé dans la frise.

DÉCISION À PRENDRE : aucune.
CONNAISSANCE : aucune.
LEÇON PROPOSÉE : aucune.
