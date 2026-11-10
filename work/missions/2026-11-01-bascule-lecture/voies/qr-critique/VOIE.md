# Voie qr-critique — le sceau QR porté dans l'app, jugé contre z2 (D246, D252)

Agent `critique` (Fable), 30 tours au plus. Décideur : pilote. Règle n° 1 : sa maquette choisie se reprend telle quelle.

## Ses mots
« Le sceau QR z2 parfait comme telle » (D246, `work/refonte-frontend/v4/SPEC-BRASSEUR.md`). Avant de juger, lis ton portrait
(`work/refonte-frontend/v4/ecran-1/fils21-choisir/critique/PORTRAIT.md`) et la section Dépense de SPEC-BRASSEUR.

## Ce que tu compares
- La maquette choisie : `work/missions/2026-10-31-ecran-depense/qr/v1/z2/etat.html`, sa `NOTE.md`, ses captures `z2-*.png`.
- Le port : les captures de l'app, `work/missions/2026-11-01-bascule-lecture/voies/qr-app/captures/z2-*.png` (mêmes noms).
- Les écarts que l'auteur déclare : `voies/qr-app/RESULTAT.md`, « Écarts restants » et « Suite 1 ». Le relevé côte à côte de
  l'exécutant : `voies/qr-rejeu/RESULTAT.md`, étape 7.
- La base de l'écran (r2b portée, puis p3c-3 choisie pour la liste, D248) n'est pas jugée ici : seulement ce que z2 ajoute.

## Questions
1. Chaque état de z2 (confirme, contredit et ses gestes, partiel, illisible, sans, lecture, feuille ouverte, 1280) est-il reconnu
   tel quel dans l'app ? Ouvre chaque paire en image. Mesure ce qui se mesure (taille et place du sceau, du duel) plutôt que de
   l'estimer.
2. Les écarts déclarés : lesquels changent ce qu'il a choisi (à corriger), lesquels sont imposés par la base ou par une règle
   (à garder, en disant pourquoi) ? En particulier : le sceau « lecture… » dans le bloc de lecture et non à côté du total ;
   les barres de verdict blanches ; le sceau à 64 × 72 contre 64 × 62 ; les deux états ajoutés (« invalide », « écart »).
3. Ce qu'il dirait devant la capture (une phrase par état, dans ses mots) ; tout ce qu'il refuserait (DEFAUTS-RECURRENTS).
4. Lisibilité au téléphone : 390 tactile, contrastes rapportés (≥ 4,5), cibles, IBAN copiable.

## Possède
`work/missions/2026-11-01-bascule-lecture/voies/qr-critique/**`. Lecture seule ailleurs ; aucun code changé, aucun commit.

## Retour
`voies/qr-critique/VERDICT.md` : par état, RETENU ou À CORRIGER (défaut précis, capture, correction attendue). Puis une ligne :
`QR-CRITIQUE RETENUE — …` ou `QR-CRITIQUE A CORRIGER — <défauts>`.
