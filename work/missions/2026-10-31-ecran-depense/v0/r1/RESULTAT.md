OK — série r : 4 concepts Nouvelle dépense, COMMUN, MOTS, CONTRASTE, PANEL OK

- r1 (froide) : la feuille d'aujourd'hui, ses 6 doutes sur leur champ, rubriques fermées ; 97 mots ; `v0/r1/etat.html`, `NOTE.md`, captures `r1-*.png`
- r2 (tiède) : le ticket de Malts s1 sur les 23 lignes, la barre des montants, la mouture pendue au malt ; 98 mots ; `v0/r2/`
- r3 (chaude) : le total en nuit, la barre hachurée, un paquet de cartes « à régler » ; 97 mots ; `v0/r3/`
- r4 (chaude) : un ruban d'argent, une étagère de tuiles par famille (relié, nouveau, bis, mouture) ; 97 mots ; `v0/r4/`

Sorties : `controle-commun --profil=sans-houblons r1 r2 r3 r4` COMMUN OK ; `mots-premier-ecran --max=100` MOTS OK (97 / 98 / 97 / 97) ;
`controle-contraste` CONTRASTE OK (pire 5,13:1) ; `controle-panel` PANEL OK (médiane 0,57, 0 sous 0,50, ressemblance 0,82) ;
`verifier-page --min-images 0` PAGE OK ×4 ; `controle-choix` sans objet (aucun choix au registre pour cet écran). Captures : `node v0/r1/capturer.mjs r1 r2 r3 r4`.

Prédiction : r2 lui parlera d'abord (« c'est ma facture, dans ma langue ») ; r3 le frappera le plus, mais il voudra l'ordre du papier.

DÉCISION À PRENDRE : aucune. Note : l'unité illisible de Sabro est simulée (sa facture imprime « g ») pour montrer D214.
CONNAISSANCE : `controle-panel` ignore les fonds à moins de 60 d'écart RVB : boîtes blanches sur gris et teintes pâles ne comptent pas au remplissage.
LEÇON PROPOSÉE : aucune.
