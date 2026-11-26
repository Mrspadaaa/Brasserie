# Mini maquettes « style adulte » (26.11)

Ses mots, dans l'ordre : « Un petit peu trop enfantin et simpliste. Je comprends même plus ce que c'est » ; « Mais toujours trop simpliste et
enfentin » ; « Montre moi les mini maquettes et autres avant que soit jouable ». Plus tôt : TDAH et visuel (« un peu trop textuel »), pas de
frise générique, info utile en haut, pas de harcèlement, vrais noms, « Je préfère la vue en arbre mais pas assez compact », « Je préfère aussi un
champs text, une action en moins », comparaison « qui gagne quoi » (« C'était vraiment bien »), Organisé par défaut, ✦ suggestion de l'IA à côté du « + ».
Le défi : **visuel ET adulte**. Ni pavé de texte, ni dessin animé. Principes de départ : STYLE-ADULTE.md (même dossier) ; ce sont des pistes,
pas une recette — chaque variante est un GENRE différent.

## Livrable
Des mini maquettes statiques (HTML, thème sombre, 390 × 844), chacune sur les MÊMES 4 écrans :
1. Liste en arbre compacte (≥ 12 carnets visibles) avec le champ texte en bas ;
2. Organisé d'un problème : « écoulement qui fuit » (tests/fixtures/c79/zz-ecoulement-qui-fuit.json) ;
3. Organisé d'un achat comparé : « 600 bouteilles » (work/missions/2026-11-25-carnet-document/visuel/cas-fictifs.json : Verallia 0.42/bt
   palette 1200 min ; Fournisseur B 0.55/bt par 600, livraison 80 CHF ; occasion 0.20/bt, 400 seulement ; besoin avant le 15) ;
4. Organisé d'une échéance avec liste : « assurance à renouveler » (tests/fixtures/c79/zz-assurance-a-renouveler.json).
Données : ses notes telles quelles ; ce que l'IA ajoute marqué ✦ ; rien d'inventé.

## Contrat
Possède : work/missions/2026-11-26-liens/maquettes/<ta lettre>-*.html, maquettes/cap/<ta lettre>-*.png, maquettes/RESULTAT-<ta lettre>.md.
Tests : aucun test unitaire ; la preuve est la vision.
Gestes : repos des 4 écrans ; plus, sur Organisé problème, le ✦ ouvert (suggestions en place).
Captures 390 : 390 × 844 (deviceScaleFactor 2), puppeteer-core sur le Chrome de débug 9222, ton onglet, page.close() puis browser.disconnect(),
jamais browser.close(). Captures 1280 : aucune. Ouvre chaque capture et juge-la toi-même : « un brasseur pro de 35 ans la trouverait-il
enfantin ? trop textuel ? » ; corrige avant de rendre.
Commit local de tes seuls chemins (git add -f, git commit -- <chemins>). Rends une ligne : variantes et leur genre, commit.
