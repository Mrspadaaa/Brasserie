# Dossier couloirs — CONTRAT RÉÉCRIT (23.11 21:35) : bords et lignes, PAS de pose en couloirs

## Ses mots (mot pour mot)
1. « Il y a toujours de l'espace vide et une donné que je cache brise les lignes » (plaintes/2327-vide-lignes.jpg)
2. « Je sais pas si tu as bien compris le problème c'est que il y a des bords tout autour du calendrier » (plaintes/2332-bord-gauche.jpg, 2332-bord-droit.jpg, 2332-calendrier.jpg) — OUVRE les trois.

## Ce qu'il veut dire (lecture du pilote, captures à l'appui)
- « bords tout autour » / « espace vide » : la zone des rangées (fond gris rayé de traits verticaux) ne touche pas les bords : marge blanche ≈ 28 px à gauche, ≈ 28 px à droite, et du vide blanc sous la dernière rangée jusqu'à la barre du bas.
- « une donnée que je cache brise les lignes » : la rangée « Activités · vide » est une bande BLANCHE pleine largeur qui coupe les traits verticaux des graduations (ils s'arrêtent sous Travaux et reprennent à Papiers).
- PAS demandé : changer l'escalier des choses (ne pas toucher à la pose verticale ; sa maquette choisie fait foi). Si tu as déjà codé une pose en couloirs, retire-la (rien de ce qu'il n'a pas demandé ne part en ligne).

## Règle (DEFAUTS-RECURRENTS, CAL-BORDS-ET-LIGNES)
La frise va d'un bord à l'autre de l'écran et jusqu'à la barre du bas ; les traits des graduations traversent toutes les rangées, vides ou cachées comprises. Les en-têtes de rangée (+ Travaux 👁) gardent leur place (lisibles, pas collés au bord : un retrait interne suffit).

## Code
- src/ui/calendrier/frise/** (Rangee.tsx : rangée vide, œil), conteneur de l'onglet (CalendrierTab, son CSS), styles du fond rayé.
