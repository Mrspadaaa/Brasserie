# REPRISE-2 — saisie à la main, passe 2 (22.11)
Arrêt à ~175 k (hook). Fait : `choix-saisie.html` réécrit (8 versions, 6 états, « Corrigé » par version), `outils/cap.mjs` (6 états, planche 3×2, garde-fous bas et rognés), captures rejouées : 48 téléphones, 0 type=number, 0 débordement, 0 action coupée, 0 rognage, 0 erreur. NOTES.md : section « Passe 2 ».
Ouvert et jugé : `captures/planche/v01-clair.png` (bon).
À faire (agent neuf) :
1. Ouvrir les 15 planches restantes `captures/planche/v0{1..8}-{clair,cave}.png` (v01-cave, v02…v08 clair et cave). Chercher : chevauchements dans la phrase v03 (trous à largeur fixe, 26 px), hauteur v05 (c) et v06 (c) (frise + liste), v08 (c) (pavé ≥ 4 rangées lisibles), v04 ligne ouverte, cave (ambre #D9954A).
2. Corriger dans `choix-saisie.html` (classes préfixées par version), rejouer `node outils/cap.mjs <vNN>` pour la seule version touchée.
3. Mettre à jour « Ouvertes et jugées » dans NOTES.md, puis rendre la ligne au pilote.
