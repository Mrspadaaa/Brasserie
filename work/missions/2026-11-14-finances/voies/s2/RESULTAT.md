OK — quatre mini maquettes v6a + plage par booster (frise, calendrier, 12 mois, brush), repos et après

## Variantes (id · idée · images ouvertes · défauts vus)
- s2a · frise des 30 jours sous les piles, deux poignées · oui (repos, apres) · +62 px au repos ; une plage à cheval ne tient pas dans la frise d'un mois
- s2b · bouton ▦ → feuille calendrier mode plage (react-day-picker), pilule « ▦ 1 → 15 nov. × » après · oui (repos, feuille, apres) · flèches ‹ › masquées pendant la plage ; la feuille cache le graphe pendant le choix
- s2c · frise des 12 mois ; un mois touché s'ouvre sur ses jours (avec le mois d'avant) ; plage 15 oct. → 10 nov. · oui (repos, zoom, apres) · un jour = 5,8 px au zoom (glisser + lecture en tête, pas de toucher par case) ; la frise des mois doublonne ‹ ›
- s2d · brush : histogramme quotidien au-dessus des piles, fenêtre glissée (9 → 15 nov.), piles fantômes du mois · oui (repos, apres) · +62 px au repos ; proche de s2a par la frise (diffère par la fenêtre mobile et le fantôme)

Commun aux quatre après : loyer du 25 nov. sorti en ligne « hors plage » (400,00 en gris, pas mis à 0) ; Fixes 68,00 ; payé 325,40 · à payer 0,00 · dépensé 296,80 (recalculé : 68 + 186,80 + 42 ; matériel à part) ; retard 2025 gardé (dette hors période).

## Fichiers écrits (tous sous voies/s2)
- s2a/, s2b/, s2c/, s2d/ : etat.html, NOTE.md, <id>-repos.png, <id>-apres.png (+ s2b-feuille.png, s2c-zoom.png)
- outils/construire.mjs (assemble depuis ref/v6a/etat.html par split/join, préfixe par id), outils/capturer.mjs (390 px, échelle 2)
- fonts/ (Source Sans 3, IBM Plex Mono en woff2 locaux : aucune requête réseau dans les pages), tests.txt

## Critères
- G1 controle-serie : `SERIE OK` (aussi dans tests.txt)
- G2 à G5 verifier-page s2a/s2b/s2c/s2d : `PAGE OK (1 images chargées, 390 px, sans erreur)` ×4
- Captures : node outils/capturer.mjs → « sans erreur », 5 polices chargées, pour les quatre

## Captures (toutes ouvertes)
work/missions/2026-11-14-finances/voies/s2/s2a/s2a-repos.png, s2a-apres.png ; s2b/s2b-repos.png, s2b-feuille.png, s2b-apres.png ; s2c/s2c-repos.png, s2c-zoom.png, s2c-apres.png ; s2d/s2d-repos.png, s2d-apres.png

## Prédiction
« La 2b, c'est ce que je connais : je touche le calendrier, je pose mes deux jours, et je vois la plage en haut » ; s2a/s2d lui plairont pour voir où tombent les dépenses, s2c sera jugée trop petite au doigt.

DÉCISION À PRENDRE : aucune pour la voie ; au brasseur (page de choix) : la frise des 12 mois de s2c pourrait remplacer les flèches ‹ ›.
CONNAISSANCE : aucune
LEÇON PROPOSÉE : aucune (une collision de classes du socle, « -g » et « -on », vue sur capture et corrigée : L26 tient)
