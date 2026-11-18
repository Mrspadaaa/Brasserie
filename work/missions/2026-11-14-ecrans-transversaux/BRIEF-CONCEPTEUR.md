# Brief commun des concepteurs — écrans transversaux (mission 2026-11-14-ecrans-transversaux)

La demande (le brasseur, 14.11, mot pour mot) : « Lance des autres sous session pour les autres écrans important(sauf
clients) pour des mini maquettes. Notamment ces écran et d'autres et sauf l'écran principal ». Ici : ce qui entoure
tous les écrans — la recherche, l'en-tête et son menu ⋮, la barre du bas et le bouton « + ». Jamais refaits.

## Obligatoire, et rien d'autre
1. **Mini maquettes NON jouables** : HTML statique, aucun script de jeu ; chaque état voulu est une page (ou un cadre)
   figée. Vrais mots du métier, chiffres plausibles et cohérents (exemples ci-dessous) ; rien d'inventé sur ce que l'app
   sait faire sans le marquer « (proposé) » dans NOTE.md.
2. **Densité utile, chrome compact** (règle principale, `.claude/rules/affinee-frontend.md`) : premier plan léger, le
   détail à un toucher ; en-tête, barres, lignes et boutons compacts selon l'échelle de DESIGN.md ; pas de légende ni de
   texte d'explication inutile (« Inutile ce texte », « encore pas mal de légende et texte inutile, qui n'apporte rien »).
3. **Au doigt à 390 px** : cibles utilisables sans chevauchement ; rien de fixe ne cache le contenu ; le pouce atteint ce
   qui sert souvent. **Et 1280** : une vraie mise en page d'ordinateur, pas un téléphone étiré (défaut n° 10).
4. **Deux thèmes, les mêmes jetons** : clair et cave (DESIGN.md § Colors). Couleurs de rubrique, sémantique et états
   comme DESIGN.md ; la palette des styles et l'échelle EBC restent réservées.
5. **Le même en-tête partout, la même place pour le +** (D119 « Header qui change ??? », D129 « Fait attention aux header,
   footer, sur la continuité de l'app », BX-4 « sur plein d'écran il est pas au bon endroit. Différents, donne pas les
   bonnes actions »).
6. **Rien de perdu** : chaque entrée qui existe aujourd'hui (INVENTAIRE.md § Ce qui existe) a une place, ou sa disparition
   est dite et motivée dans NOTE.md. Les onglets restent Bord · Finances · Brassins · Stocks · Clients.
7. **Partir des défauts** : chaque variante dit dans NOTE.md quels défauts numérotés d'INVENTAIRE.md elle règle.
8. Préfixer ses classes et ses identifiants par l'id de la variante (L26) ; aucune ressource externe sauf polices Google
   déjà utilisées par DESIGN.md ; pictos en SVG au trait en ligne (style lucide, celui de l'app).

## Indicatif
- Sources à lire (une fois) : `INVENTAIRE.md` de la mission ; `DESIGN.md` lignes 101-200 et 401-606 (thèmes, échelle,
  deux régimes, layout, budget vertical, dimensions compactes, composants) ; `docs/ui-compacte.md` lignes 155-180 (contrôle
  par besoin) ; les captures de l'existant `references/<390|1280>-<clair|cave>-<bord|recherche|menu|plus|reglages|journal>.png`
  (ouvrir celles de ta série). Skills : `boosters-ux`, puis `impeccable` et `ui-design-system` pour ce qui sert.
- Données d'exemple : recettes « IPA Nelson », « Triple d'automne », « Blanche au yuzu » ; brassin « B-031 IPA Nelson ·
  fermentation J+4 » ; articles « Citra T90 · 1,2 kg », « Malt Pilsner · 3 sacs de 25 kg », « Bouteilles 33 cl · 480 » ;
  écritures « Brouwland · 352,05 CHF · 09.11 », « Vente Marché d'automne · 640,00 CHF » ; client « Bar du Tilleul » ;
  période « Ce mois (novembre) » ; auteurs Gaëtan et Aricia.
- Chaleurs : sur tes 4 variantes, au moins une froide (sobre, outil), une tiède, une chaude (plus de forme, de couleur).
  Une seule idée par variante, mais une idée qui remplit son écran ; pas de squelette commun aux 4.
- Ose ce qui sert : palettes de commande, feuilles du bas, rail latéral, segments, pastilles, gestes ; références
  connues (Linear, Things, iOS, Material 3) comme direction, jamais copiées.

## Livrables (dans ta voie `voies/<id>/`)
Pour chaque variante `<v>` : `<v>.html` (un fichier, tous ses états en cadres) et quatre captures PNG regardées :
`<v>-a-390.png` (état principal, clair, 390×844 DPR 2), `<v>-b-390.png` (second état, clair), `<v>-cave-390.png`
(état principal, cave), `<v>-1280.png` (clair, 1280×800). `NOTE.md` : une ligne par variante
(`<v> · <nom court> · chaleur · défauts réglés n° … · ce qui disparaît ou bouge`), puis ton jugement en 3 lignes.
