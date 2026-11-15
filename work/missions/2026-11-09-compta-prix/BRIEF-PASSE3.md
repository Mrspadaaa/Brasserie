# Brief passe 3 : compta et prix

Lis `BRIEF-AUTEUR.md` (métier, fixture, obligatoire, IA au toucher, maquettes **statiques**) et `BRIEF-PASSE2.md` § « Corrections
transversales » (toujours obligatoires : 7,51 CHF/L, grille 5,00 · 10,00 · 160,00, payé ≠ à payer ≠ coût, 27 L nets, « exemple »,
glossaire, pas de cockpit, couleurs nommées). Panel passe 2 : https://claude.ai/artifact/1ePJcgviBQ5SqzqJe7w2Su ; captures `p2/<id>/`.

## Ses mots du 09.11 (SPEC-BRASSEUR) et ce qu'en fait la passe 3
- **Choisis, définitifs** (ne pas redessiner, servent de langue) : `c3a` coût du litre, `v3a` facture (caisse), `p2b` impôt bière.
- Synthèse : « g3a … Pas mal mais peu faire mieux » ; « Aussi bien Où part la vente / g3c » → **4 concepts** qui font mieux que g3a et g3c.
- Annuel : « g4a … La meilleure, montre moi les autres écrans de clôture » → g4a est la base ; **dessiner les écrans de clôture** dans sa langue.
- Prix : « c4a … Bien / J'aime aussi Le prix sur l'année / c4e » → **2 concepts** : c4a avec c4e greffé (comment on passe de l'un à l'autre).
- Prévisions : « À revoir avec mes nouveaux input... Le graph suffit pas je pense.. » + le métier ci-dessous → **4 concepts**.
- Rangement : « e1b … Ça semble le mieux mais toujours pas 100% convaincue » → **3 concepts** autour de e1b.
- Opérations : « v4c … j'aime bien mais plus de détails et plus compact, pas assez d'info sur les opérateurs directement, sans les déroulement,
  ouvrir » → **4 concepts** : v4c, plus serré, chaque opération dit tout sur sa ligne (qui, quoi, payé / à payer, échéance, pièce) sans rien déplier.

## Le métier nouveau (« pas que mini maquettes, sûrement changement business »)
1. **Un brassin futur crée sa prévision.** Quand il planifie un brassin (recette + date), l'app estime seule son coût (le calcul de c3a : ingrédients
   manquants au stock, frais, usure), pose dans les prévisions les achats à payer avant la date de brassage et l'impôt bière au conditionnement,
   et les met à jour quand la recette, le stock ou les prix changent. On voit d'où vient chaque montant (recette, stock, dernière facture) ; inconnu
   = « à compléter », jamais 0. Exemple : Pale Ale de septembre rebrassée le 20 nov. : 64,26 CHF à payer (ingrédients 22,42 + frais 41,84).
2. **Un achat de matériel futur se mesure.** Exemple : « je veux acheter un frigo à 3 000 CHF ». À montrer : la trésorerie au mois d'achat et le point
   le plus bas après ; l'usure par an (exemple : 5 ans → 600 CHF/an) ; ce qu'il ajoute au coût du litre (600 ÷ 1 200 L = + 0,50 → 8,01 CHF/L) ;
   ce qu'il faut vendre pour le payer (en bouteilles 33 cl à 5,00, « exemple ») ; le meilleur mois pour l'acheter. Montants hors fixture = « exemple ».
3. Les deux vivent dans Prévisions, et se retrouvent là où on les crée (fiche du brassin planifié ; projet de matériel).

## Ce que rend chaque concept (`work/missions/2026-11-09-compta-prix/p3/<id>/`)
`etat.html` statique, classes préfixées ; `NOTE.md` court ; captures `node scripts/agents/verifier-page.mjs <etat.html> --captures p3/<id>/<id>` +
1280 ; états utiles en plus (`<id>-etat*.png`), **ouverts** (L12). 60 mots au plus hors chiffres au premier écran ; une action primaire ; ~8 tours
par concept. Pour la clôture : une image par écran de clôture (`g6-<étape>.png`), dans un seul concept.

## Voies
| Voie | Ids | Agent |
|---|---|---|
| g | Synthèse `g5a`–`g5d` ; clôture de l'Annuel `g6` (g4a en tête, puis chaque étape de clôture : opérations à vérifier, solde d'ouverture, inventaires, matériel et usure, dettes et créances, parts privées, vérifications, montants à reporter, dossier) | concepteur (Opus) |
| p | Prévisions `p4a`–`p4d` (brassin futur et frigo à 3 000 CHF dessinés, état « avant / après » le frigo) | concepteur (Fable) |
| c | Prix `c5a`–`c5b` ; rangement `e2a`–`e2c` | concepteur (Opus) |
| v | Opérations `v5a`–`v5d` | concepteur (Opus) |

Plancher à enrichir (L07). N'écris que dans `p3/<tes ids>/` et `p3/RESULTAT-<voie>.md`. Pas de heredoc ni `node -e` pour du code, pas de
`git stash`, aucun commit, rien dans `src/`. Rends une ligne.
