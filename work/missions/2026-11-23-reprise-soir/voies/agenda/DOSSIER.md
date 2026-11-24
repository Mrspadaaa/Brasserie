# Dossier agenda (T29-4, feuille sur place)

 T29-4 | Bord › Agenda (390 px, en ligne index-BWLOL1xf.js, frise inchangée en index-KxF0Bcaa.js) | Toucher le nom de la fête « vi » → observé : la ligne est un <label>, la fête est cochée « Fait » (vraie donnée, décochée aussitôt : « 12.10.2026 · en retard ») ; aucun renvoi vers sa feuille ; attendu : le nom ouvre la chose sur place, seule la case coche | B 

## Décision du pilote (23.11)
- Son choix déjà fait pour le Calendrier (CALP-11, 21.11) : fête, événement, idée s'ouvrent dans une feuille SUR PLACE (Modifier), le retour ramène d'où l'on vient. Même règle pour Bord › Agenda : toucher le nom ouvre la feuille de la ligne sur place ; seule la case coche.
- fix29 (9f407872e) a fait du nom un bouton vers l'agenda de l'Atelier (provisoire). Sa note : « Ouvrir la feuille de la ligne exige que navigateToCreativeLab (App.tsx) porte l'id de l'item et que CreativeLabTab ouvre son éditeur. »
- Réemployer la feuille du Calendrier (celle de CALP-11) si elle convient : chercher son composant (grep « Modifier » dans src/ui/calendrier).
