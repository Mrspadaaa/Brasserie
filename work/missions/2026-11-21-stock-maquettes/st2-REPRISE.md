# Reprise — mini maquettes du Stock, tour 1 (st2-), 21.11

Arrêt à 164 k de contexte (images lourdes), avant de regarder les captures. Tout est rejouable par script.

## Fait
- `st2-build.mjs` écrit 17 maquettes statiques (aucun `<script>`), `st2-capture.mjs` les capture à 390 × 844 tactile ×2 dans `st2-captures/` : 17 « ok » (aucun débord, aucun texte < 14 px ; contenu au-dessus de la barre ou du pied).
- Références copiées dans `st2-ref/` : ses captures 01 et 02, Autres stocks et Recompter du jour (chasse STG).
- Base : la clé « stock » n'existe ni dans `maquettes.json` ni dans `ecrans.json`. Seule `stocks-pastille` (proto seuil v3 C, sans gardes) ; l'étagère sy/fA est l'acquis « incroyable » (VOIES-CORRECTION). Les maquettes reprennent le vocabulaire de l'étagère (rangées, colonnes, pots à l'échelle, tirets = seuil, cadre rouge = épuisé) et l'en-tête de sa capture 01 annotée (D1 a : Houblons et bascule Étagère retirés, Recompter en onglet) ; à dire dans la page : D1 reste un choix à part.

## Versions (id · idée · états)
- D4a · Rayons comme Malts, une colonne par unité, Fûts et Matériel en rangée d'icônes (froide) · repos, bulle (Acide lactique)
- D4b · Objets sur la planche : sachet, flacon, bidon, seau, bouteille, capsule, étiquette, carton, gants, remplis à l'échelle (tiède) · repos, bulle (Étiquette IPA, Commander / Fiche)
- D4c · Un seul mur : plus de bascule Ingrédients / Autres, six rayons, le nom du rayon filtre (chaude) · repos, filtre (Emballage)
- D5a · Pastilles chiffrées, modèle v02 (stock, seuil, besoin, prix) + Stock et Seuil en un pavé ; Modifier replié (froide) · repos, modif (Modifier déplié, fournisseur pleine largeur, α dans la rangée)
- D5b · Règle à tirer : la barre = le stock, le tiret = le seuil, motif ensuite ; frise des mouvements (tiède) · repos, geste (3 Pck, seuil 2)
- D5c · Paquets : 1 paquet dessiné, + en pointillé, tiret de seuil ; Modifier dans une feuille (chaude) · repos, feuille
- D6a · Tiret : colonne EBC gardée, inconnu « — » hachuré, barres ▂▄▆ retirées
- D6b · Pastille seule : couleur du grain sans mot, inconnu = rond « ? », barres remplacées par le pot de l'étagère
- D6c · Groupé : « EBC inconnu sur 3 malts · Compléter › » une fois en tête, barres gardées avec légende peu / plein
- D7a · Colonne « Sucres » au bout du rang Malts ; D7b · rang « Sucres » à part entre Malts et Houblons. Additifs écarté (un sucre compte dans la densité).

## Prochaine action (dans l'ordre)
1. Ouvrir chacune des 17 captures `st2-captures/st2-*.jpg` et la juger (portrait : comprend-on en 3 s ?). Points à vérifier : D4a la bulle ne recouvre pas la rangée voisine ; D4b noms courts lisibles et objets reconnus ; D4c pots assez hauts (H 22 à 26 px) ; D5a/D5b/D5c fin du contenu à 113 à 535 px pour un pied à 767 : D5b et D5c peuvent sembler vides en bas (« pages à moitié vides », à remplir : par exemple Besoin et prix en pastilles, ou mouvements en lignes) ; D5a-modif : l'écran commence à « Modifier » (haut masqué) : vérifier qu'il ne paraît pas vide.
2. Corriger dans `st2-build.mjs`, puis `node st2-build.mjs && node st2-capture.mjs` (3 essais au plus).
3. Contrôles : `node scripts/agents/controle-base.mjs stocks-pastille <f> --dures --statique` sur chaque `st2-d*.html` (les fiches D5 n'ont pas de barre d'onglets, comme sa capture 02 : l'échec « + volant » y est attendu, à dire dans la page).
4. Écrire à la main `choix-stock-2.html` sur le modèle de `../2026-11-21-carnet-maquettes/choix-carnet-2.html` : ses mots du 21.11 en tête, `#a-choisir`, un `h2.axe` par axe D4 à D7, une section Référence (`st2-ref/…`) puis une section par version (captures de ses états, « Je prends », note), docs Firestore `choix/stock2-<id>`, `localStorage` `choix-stock-2`. Puis `node scripts/agents/verifier-page.mjs work/missions/2026-11-21-stock-maquettes/choix-stock-2.html --page-lot` → PAGE OK.
5. Commit par chemins de tout `work/missions/2026-11-21-stock-maquettes/` (`git add -f`), message terminé par « Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com> » ; sans publier.
