# Brief passe 2 : compta et prix

Lis `BRIEF-AUTEUR.md` (le métier, la fixture, l'obligatoire, ses deux ajouts : IA au toucher, maquettes **statiques**), puis ce brief.
Pas besoin de relire l'inventaire entier : ses problèmes tiennent dans `INVENTAIRE-CODE.md` § « Problèmes principaux ».
Panel v0 : https://claude.ai/artifact/TxmDK9GPdx61jP3UG7kTLS ; captures dans `v0/<id>/<id>-haut.png`, `-page.png`, `-1280.png`.

## Ses verdicts, mot pour mot (09.11)
| Écran | Base | Ses mots | Ce que fait la passe 2 |
|---|---|---|---|
| Coût d'un brassin et d'un litre | c1c | « Très bien, faire d'autres petites variantes » | 4 variantes **proches** de c1c (même idée : quand tu paies → pour quoi → ÷ litres) |
| Prix et marges | — | « Pas de candidat probant » | 5 concepts d'**un autre genre** que c2a/b/c (L13 : après un refus, changer de genre) |
| Prévisions | p1b | « Ça j'aime beaucoup, faire d'autres variantes » | 4 variantes de p1b (avec / sans le fermenteur, escalier, point le plus bas) |
| Impôt bière | p2b | « Ça top comme ça » | **Choisi.** Ne pas redessiner. Sa langue sert de référence. |
| Facture de vente | v1c | « Ça j'aime bien, faire d'autres variantes » | 4 variantes de v1c (la caisse : à qui, quoi en tuiles, payé ici ou QR) |
| Opérations | v2a | « Le meilleur mais pas de vrai candidats » | 4 concepts : v2a est le plancher, aller plus loin |
| Synthèse | g1b | « Ma mieux pas pas de vrai candidats » | 4 concepts : g1b est le plancher, aller plus loin |
| Annuel | g2c | « Ça j'aime bien mais en plus, pas de vrai bon candidat mais dans la bonne version je veux une version tuile par mois, ça c'est top mais ça doit pas être la vue principal mais plus un outil d'analyse » | 4 concepts : une **vue principale neuve** ; les tuiles par mois de g2c en **outil d'analyse** à un toucher (dessinées ouvertes à côté) |

Ce qu'il aime dans ce lot (sa langue, à reprendre) : c1c (le flux « quand tu paies → pour quoi », moderne), p1b (une réponse oui/non
dessinée : deux soldes et l'escalier), p2b (le barème devenu une règle à bandes, la bière posée dessus), v1c (la caisse en tuiles),
g2c (les tuiles de mois teintées). Des représentations, peu de mots.

## Corrections transversales du critique (obligatoires dans toutes les maquettes)
1. **Un seul coût du litre en tête : 7,51 CHF/L** (tout compris, bouteille 33 cl incluse). Si tu montres la bière seule (6,37 CHF/L), écris-le
   « bière seule, sans emballage ni impôt » et montre le lien vers 7,51.
2. **Une grille de prix d'exemple** partout : 33 cl 5,00 · 75 cl 10,00 · fût 20 L 160,00 CHF (marquée « exemple »).
3. **Trois notions d'argent nommées** : « payé » (sorti du compte) ≠ « à payer » (engagé) ≠ « coût » (ce que la bière consomme). Chaque chiffre
   dit laquelle. Novembre : payé 325,40 · à payer 400,00 · dépenses du mois 725,40 dont matériel 28,60.
4. **Un volume** : « 27 L nets » partout (la Pale Ale de septembre).
5. **Hors fixture = « exemple »** (mois mai–oct., amortissement, répartition des 41,84 de frais, emballage).
6. **Glossaire** : « Gagné » (résultat positif) / « Perdu » ; « Dépensé » (charges du mois, matériel à part) ; « Il te reste » (marge) ;
   « À payer » / « On me doit » ; « Usure du matériel » (pas « amorti ») au premier plan.
7. **Pas de cockpit** : pas de rangée de barres fournisseurs au premier plan (replié).
8. Libellés : toute couleur ou hachure a son nom visible au moins une fois ; aucun chiffre sans nom ; décimales constantes (42,00).

## Ce que rend chaque concept (`work/missions/2026-11-09-compta-prix/p2/<id>/`)
- `etat.html` statique (classes préfixées par l'id) ; `NOTE.md` court (idée en une phrase, ce qui change par rapport à la base, B1–B13 en
  une ligne chacun) ; captures `node scripts/agents/verifier-page.mjs <etat.html> --captures p2/<id>/<id>` + une à 1280 ; un état utile en plus
  au besoin (`<id>-etat.png`). **Ouvre-les** (L12).
- 60 mots au plus hors chiffres au premier écran ; la réponse domine ; une action primaire.
- Environ 8 tours par concept. Pas de geste jouable.

## Voies
| Voie | Ids | Agent |
|---|---|---|
| g | Synthèse `g3a`–`g3d` ; Annuel `g4a`–`g4d` | concepteur (Opus) |
| c | Coût `c3a`–`c3d` ; Prix et marges `c4a`–`c4e` | concepteur (Opus) |
| p | Prévisions `p3a`–`p3d` ; où vivent Prix et marges et Impôt bière : `e1a`–`e1c` (trois rangements du domaine en mini maquettes : onglets, entrées, ce que voit le brasseur au premier toucher) | concepteur (Fable) |
| v | Facture `v3a`–`v3d` ; Opérations `v4a`–`v4d` | concepteur (Opus) |

Plancher à enrichir (L07), jamais une copie. N'écris que dans `p2/<tes ids>/` et `p2/RESULTAT-<voie>.md`. Pas de heredoc ni `node -e`
pour du code, pas de `git stash`, aucun commit, rien dans `src/`. Rends une ligne.
