OK — m3 repris, période refaite : 3 variantes (une période, globale/locale, fil de l'année), préférée m3r-a

- Fichiers : `fabrique.mjs` (lit socle, pictos et CSS de m3 dans `voie-menu/generer.mjs`, puis écrit HTML et captures), `m3r-a.html`, `m3r-b.html`, `m3r-c.html`, `NOTE.md`, `controle.txt`, 15 captures.
- m3r-a fini (froide) : pastille « ‹ Nov. › » dans chaque en-tête, grille T1 à T4 et mois comptés, une seule période (Brassins → T4 → Bord et Finances en T4).
- m3r-b fini (tiède) : période de l'app plus lignes locales « = app » ou « ≠ app ↺ Nov. », feuille « Cet écran | Toute l'app », écrans à part listés dans Plus.
- m3r-c fini (chaude) : fil de 12 mois en tête de chaque écran, marques = mesure de l'écran, bord glissé = dates libres.
- G1 : `node work/missions/2026-11-14-ecrans-transversaux/controle-serie.mjs voie-r-m3 m3r-a,m3r-b,m3r-c --vues` → `SERIE OK` (code 0).
- Captures (toutes ouvertes, planches comprises) : `voies/voie-r-m3/m3r-{a,b,c}-{a-390,b-390,cave-390,1280,vues-390}.png`. Corrigé après regard : mono sur « écritures » (a), feuille T4 sans effet sur la pastille (a), puces coupées à 390 (b, c), fil illisible à 390 (c, refait en pleine largeur), valeur arrondie « 1 637 » (c, exacte 1 636,65).
- Restes connus : à 1280, la page Plus reste haute de 330 px sur 800 comme m3 ; c répète le total de Finances dans le fil et dans la carte.
- Prédiction : « La a, c'est ça : je vois la période partout et je la change sans ouvrir de page ; la c est belle, mais ça prend de la place. »

DÉCISION À PRENDRE : aucune (la lecture ambiguë « plusieurs endroits » est montrée en a et b, le brasseur choisit).
CONNAISSANCE : aujourd'hui trois périodes indépendantes coexistent : globale (Header, PERIODS), mois propre de Finances (`MonthStepper` + « Tout l'historique », qui ignore la globale) et filtre du catalogue Brassins (`select` avec « Période de l'application » et dates libres). C'est la cause probable de « on peut le régler à plusieurs endroits ».
LEÇON PROPOSÉE : aucune.
