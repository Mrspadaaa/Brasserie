# Contrôle des 16 fils (16.11, 390 × 844, Chrome headless, clair et cave)

Mesure au rendu (puppeteer-core) et captures de `cap/` regardées (planches clair 4 par 4 et cave a1, b1, c1, d1-cave). `d1-cave.html` est la version cave de d1, pas une 17e version.
Règles : jetons DESIGN.md ; + en bas à droite, bas 4 à 24 px au-dessus des onglets ; onglets Bord · Finances · Calendrier · Brassins · Stocks · Clients, Calendrier actif ; tête ≤ 30 %, bande des semaines ≤ 2 lignes, ≥ 6 rangées ; rien sous 14 px ; zones réduites ou à un toucher, jamais supprimées ; données de proto.html.

## Mesures

| v | + centre x / bas au-dessus onglets | tête (header) / 1re rangée | rangées | police min | onglet actif |
|---|---|---|---|---|---|
| a1 | 350 / 14 | 25 % / 27 % | 6 | 14 | Calendrier (cuivre) |
| a2 | 350 / 14 | 28 % / 29 % | 6 | 14 | idem |
| a3 | 350 / 14 | 29 % / 32 % | 6 | 14 | idem |
| a4 | 350 / 14 | 30 % (29,6) / 31 % | 6 | 14 | idem |
| b1 | 352 / 12 | 6 % ligne, tête 22 % | 7 | 14 | Calendrier (violet) |
| b2 | 352 / 12 | 20 % | 7 | 14 | idem |
| b3 | 352 / 12 | 22 % | 7 | 14 | idem |
| b4 | 352 / 12 | 20 % | 7 | 14 | idem |
| c1 | 349 / 14 | 28 % | 7 | 14 | Calendrier (encre) |
| c2 | 349 / 14 | 25 % | 7 | 14 | idem |
| c3 | 349 / 14 | 25 % | 7 | 14 | idem |
| c4 | 349 / 14 | 27 % | 7 | 14 | idem |
| d1 | 350 / 12 | 26 % | 7 | 14 | Calendrier (cuivre) |
| d2 | 350 / 12 | 23 % | 7-8 | 14 | idem |
| d3 | 350 / 12 | 15,5 % | 8 | 14 | idem |
| d4 | 350 / 12 | 23 % | 7-8 | 14 | idem |

Toutes : + dans le tiers droit, 52-54 px, jamais sur du contenu ; 6 onglets dans le bon ordre ; aucun débordement horizontal de page (scrollW 390) ; texte SVG au moins 14 px effectifs.

## Verdict

- a1 OK
- a2 OK (réserve : le « 4 032 » est coupé par le trait de fenêtre)
- a3 OK (limite : tête 29 %, mais la première rangée commence à 32 %)
- a4 OK (limite : tête 29,6 %, 1re rangée 31 % ; noms de rangée absents, seuls pictos et liseré de couleur ; « +113 avant 0 » sans CHF)
- b1 KO : données. « Porter », « Malt », « Loyer » à la place de Porter d'hiver, Commande groupée de malt, Loyer du local. Le reste est conforme.
- b2 KO : même raison
- b3 KO : même raison (bandeau noir plein + + noir : deux aplats d'action)
- b4 KO : même raison
- c1 KO : thème. Neutres chauds hors jetons (#e2ddd8, #5a524c, #f6f4f1 au lieu de #DDDDDD, #666666, #F5F5F5) ; en cave le + est crème #F5F0EA au lieu de l'action paille #F2C14E.
- c2 KO : même raison
- c3 KO : même raison
- c4 KO : même raison (dos noir plein + + noir)
- d1 OK (réserves : « S24 » touche la courbe ; « Porter d'hiver −17 » tronque le montant)
- d2 OK
- d3 OK (réserves : puce « 6 sem. » chevauche « 113 CHF » ; montant de Porter tronqué)
- d4 OK (réserves : « 6 sem. » et « 113 CHF » posés sur la courbe ; bande des semaines noire, avec le + noir : deux aplats)

## Réserves transversales (non bloquantes)

- Onglet Calendrier actif en cuivre dans a, c, d ; DESIGN.md donne le violet à Agenda. Seul b est violet.
- a, c, d reprennent l'alerte de proto.html (#b3261e, cave #f08a80), pas celle de DESIGN.md (#C8382F, cave #DC5F58). b l'a exacte.
- a ajoute « Éclairage du local −320 », absent de proto.html ; b, c, d écrivent « Travaux : rien ».
- Seul a suit prefers-color-scheme ; b, c, d ne suivent que data-theme (sans effet sur la planche).
