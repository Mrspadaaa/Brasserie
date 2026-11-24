# Dossier poignees

Ses mots (24.11, capture work/missions/2026-11-23-reprise-soir/plaintes/2026-11-24-poignee-bord.jpg : flèche rouge sur la fin de la barre « Fruty », collée au bord droit de l'écran) :
« Parcontre le fait que maintenant tout est au bord, l'actionnable est du coup plus difficile sur mobile. Rentre la zone plus accessible »

- Contexte : la frise va bord à bord depuis le 23.11 (son choix CAL-BORDS-ET-LIGNES : pas de bords autour du calendrier, traits continus). Les poignées de fin de barre (et toute cible au bord) tombent sur le bord de l'écran, là où Android place le geste retour.
- Règle : garder le dessin bord à bord ; rendre chaque actionnable proche d'un bord facile à toucher (zone ≥ 44 px, rentrée vers l'intérieur). La barre tenue au bord agrandit la frise (son choix CAL-BARRE-BORD) : ne pas casser ce geste.
- Fichiers probables : src/ui/calendrier/frise/Barre.tsx, Frise.tsx, entete/Fenetre.tsx, EnTete.tsx.
