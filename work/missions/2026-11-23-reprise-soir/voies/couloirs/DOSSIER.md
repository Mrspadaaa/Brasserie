# Dossier couloirs (CAL-LIGNES-PACKEES)

## Sa plainte (23.11 21:27, mot pour mot) et sa capture
« Il y a toujours de l'espace vide et une donné que je cache brise les lignes »
Capture : work/missions/2026-11-23-reprise-soir/plaintes/2327-vide-lignes.jpg (OUVRE-LA). Calendrier, 20 mois, 390 portrait.
- Achats : 8 choses, chacune sur sa propre ligne en escalier (Achat brasserie, Armoire malte, Hotte, Armoire extérieur, Armoire toxique, Extincteur, Frigo + congel, Embouteillage) ; tout le côté gauche vide.
- Papiers : 5 choses en escalier de même.
- Travaux « ZZ TEST — barre » chevauché par la bande « Activités · vide » ; « Papiers » et son « −600 » chevauchés. Il a caché une donnée (œil d'une rangée, ou œil de l'en-tête) : les lignes se cassent.

## Règle (DEFAUTS-RECURRENTS, CAL-LIGNES-PACKEES)
Dans une rangée, les choses partagent une ligne dès que leurs marques ET étiquettes ne se chevauchent pas (pose en couloirs) ; hauteur de la rangée = couloirs occupés ; cacher une donnée ou une rangée ne fait jamais chevaucher deux rangées.

## État de l'art
- Problème d'école : interval partitioning / interval graph coloring (pose d'étiquettes en couloirs, « lane packing » des frises type Gantt). Méthode standard : trier par début (x de la boîte : marque ∪ étiquette), first-fit glouton sur la fin du dernier élément de chaque couloir (tas min) → nombre minimal de couloirs. Aucune bibliothèque nécessaire (20 lignes, algorithme connu, optimal).
- Mesure des étiquettes : largeur réelle (canvas measureText ou getBoundingClientRect), jamais estimée.

## Code
- src/ui/calendrier/frise/Rangee.tsx (œil, rangée), src/ui/calendrier/frise/** ; état : src/ui/calendrier/cadre/etat.ts.
- Ses choix d'écran ne changent pas (règle n° 1) : seule la pose verticale des choses change, et la hauteur des rangées.
