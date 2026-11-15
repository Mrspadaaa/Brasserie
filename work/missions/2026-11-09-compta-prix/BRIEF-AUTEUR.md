# Brief commun : lot v0 « comptabilité et prix »

Ses mots (09.11) : « le buinsess n'est pas claire mais surtout le ux, ui est horrible, je veux des minimaqueette ». Le domaine entier :
Finances (Synthèse, Opérations, Prévisions, Annuel), coût d'un brassin et d'un litre, prévisions de coûts et d'achats, Prix et marges,
Impôt bière, facture de vente.

**La question du lot** : en un coup d'œil, le brasseur sait combien il gagne, combien lui coûte un litre, à quel prix vendre, ce qu'il
va devoir payer, et il facture une vente en quelques touchers.

## Lire d'abord (une fois)
- `INVENTAIRE-CODE.md` (ce dossier) : ce que chaque écran montre et calcule, et les 30 problèmes. **C'est la baseline du métier.**
- `inventaire/captures/*.png` (ouvre celles de tes écrans) : **la baseline visuelle**, l'écran d'aujourd'hui. Si une capture manque,
  ouvre `http://localhost:3000/?dev-local&finance-demo` à 390 × 844 (serveur déjà lancé, ne pas l'arrêter).
- **Sa langue** (écrans qu'il a choisis, à reprendre comme vocabulaire visuel) :
  - `work/missions/2026-11-09-ecran-levure/p2/l5b/l5b-cadres.png` (jauges, + sur place, peu de mots) ;
  - `work/missions/2026-11-09-ecran-levure/p2/s5a/s5a-cadres.png` (colonnes côte à côte) ;
  - `work/missions/2026-10-31-ecran-fermentescibles/v7/s1/p7-s1-ouverture-pendant.png` (recherche sous le champ) ;
  - la Dépense : il a aimé « les pastilles sur les items, ça rend la chose très clair » et « un récap en haut » (SPEC 01.11).
- Skills `boosters-ux`, `impeccable`, `ui-design-system` **avant de dessiner** ; puis `.claude/rules/affinee-frontend.md`, DESIGN.md
  (échelle, couleurs : finances = `area-finances` #86B9E6, alerte #D6453D, attention #E3B55D), `docs/ui-compacte.md`,
  `cerveau/brasseur/pas-de-cockpit.md`, `cerveau/brasseur/glossaire.md`.

## Le métier à rendre clair (ce que l'écran doit faire comprendre)
Micro-brasserie suisse, une personne, ~1 200 L conditionnés par an, Fribourg, CHF. Non assujetti à la TVA aujourd'hui (seuil
100 000 CHF), mais l'app doit tenir l'assujetti (HT/TTC). Impôt fédéral sur la bière (OFDF) par hl selon °Plato, réduction petit
brasseur. Factures QR suisses.
Une chaîne unique, aujourd'hui cassée en trois (problèmes 3, 4, 18, 19) :
**coût d'un brassin → coût d'un litre → coût d'un format vendu (bouteille 33 cl, 75 cl, fût 20 L : + emballage + impôt bière)
→ prix de vente et marge → facture → résultat.**
Deux nombres à ne jamais confondre : **l'argent qui sort** (achats TTC à payer) et **le coût de revient** (ce que la bière consomme).
Un seul « résultat » (problème 2) : ventes − charges de la période, le matériel à part (amorti, pas une charge du mois).

## Données de démonstration (à utiliser, jamais inventer d'autres ordres de grandeur)
Fixture `src/dev/financeDemo.ts`, mois en cours novembre 2026 : trésorerie 4 181,60 CHF ; à payer 460,00 (Loyer 400,00 le 25 nov.,
Solde atelier 60,00 en retard depuis le 20 déc. 2025) ; dépenses du mois 725,40 (Charges fixes 468,00 · Brassage 186,80 ·
Nettoyage 42,00 · Matériel 28,60) ; vente au marché + 720,00 ; Pale Ale de septembre, 30 L brassés, 27 L nets, coût estimé 7,51 CHF/L,
achats 64,26 CHF TTC (ingrédients 22,42 + frais 41,84) ; prévisions 90 jours : loyer 400/mois, fermenteur supplémentaire 750,00
(janv. 2027, devis), système de brassage (idée, sans prix) ; solde estimé fin de période 2 107,34 ; production annuelle 1 200 L.
Clients exemples : « Café du Bourg » (Pro), « Martin Rey » (Privé). Tarifs exemples : Pale Ale 33 cl, 75 cl, fût 20 L ; prix à
choisir plausibles (bouteille 33 cl vendue 4,50 à 6,00 CHF), à marquer « exemple ». Impôt bière 12 °P : 25,32 CHF/hl taux plein.
**L'IBAN n'apparaît jamais** (ni vrai ni inventé) : « CH·· ···· (Réglages) » au plus.

## Obligatoire, et rien d'autre
1. **La baseline, plancher à enrichir** (L07) : chaque fonction de l'écran d'aujourd'hui reste atteignable (au besoin à un toucher), ou
   ta NOTE dit où elle part. Éléments communs gardés : en-tête de l'app, barre du bas (Bord, Finances, Brassins, Stocks, Clients) et le
   + flottant à droite.
2. **L'honnêteté** : inconnu ≠ zéro (« À compléter », « ? », hachures) ; estimé marqué « estimé » ; aucun chiffre inventé hors de la
   liste ci-dessus ; les exemples marqués.
3. **Le pouce à 390 × 844**, et ça tient à 1280. Premier écran : la réponse de l'écran domine (B2), **60 mots au plus hors chiffres,
   aucune phrase d'aide au repos**, une seule action primaire. Cibles 24 px au moins.
4. **Interdits** : le cockpit (rangées de chiffres-clés) ; texte ou légende au premier plan ; trois niveaux d'onglets ; un mot répété
   (onglet = titre) ; jargon comptable au premier plan (écriture, pièce, imputé, avoir, immobilisation, FriTax, plan) — le mot du
   brasseur d'abord, le terme exact au second plan ; un texte sous 12 px ; `type="number"` ; un chiffre sans unité ; points et
   virgules mêlés (format suisse : 4 181,60 CHF, espace fine des milliers).

## Indicatif
- Boosters : chaque décision a son contrôle choisi pour elle (curseur de prix → marge vivante ; barre empilée du coût d'un litre ;
  courbe de trésorerie ; pastille d'état ; segment de période…). Marque `data-booster="nom"` et coche B1 à B13 dans ta NOTE.
- États en annexe (un au moins) : données incomplètes (solde de départ à confirmer, prix inconnu), ou vide (premier client, premier tarif).
- Où vit l'écran (onglet, sous-onglet, entrée) : tu peux proposer de le déplacer (ex. Prix et marges hors de Clients) ; dis-le en une
  ligne dans la NOTE, dessine-le si c'est ton idée.

## Ce que rend chaque concept (`work/missions/2026-11-09-compta-prix/v0/<id>/`)
- `etat.html` : page statique jouable à 390 × 844, qui tient à 1280. Vrais mots, vrais chiffres. Classes et globales JS préfixées par
  l'id (L26). Fil de fer **léger**, mais pas « gris un seul accent » : couleur, hiérarchie et forme osées ([[fil-de-fer-d-abord]]).
- `NOTE.md` : chaleur, idée en une phrase, problèmes de l'inventaire qu'il résout (numéros), boosters, B1 à B13, ce qui tient, ce qui casse.
- Captures : `node scripts/agents/verifier-page.mjs <etat.html> --captures <dossier>/<id>` (premier écran et page entière à 390),
  plus une capture à 1280. **Ouvre-les** (L12) avant de rendre.
- Environ 10 tours par concept. Minimaliste = **une idée forte, pas un écran vide**.

## Les voies (chacune lit la liste pour ne pas refaire les autres)
| Voie | Écrans | Agent |
|---|---|---|
| g | « Combien je gagne » : **Synthèse** (Finances, premier onglet) et **Annuel** (le résultat de l'année d'abord ; la clôture et les impôts cantonaux ensuite) | concepteur (Opus) |
| c | « Combien coûte un litre » : **coût d'un brassin et d'un litre** (feuille budget) et **Prix et marges** (la chaîne coût → prix) | concepteur (Opus) |
| p | « Ce qui va sortir » : **Prévisions** (échéances, achats prévus, puis-je acheter ce matériel) et **Impôt bière** (combien, quand, à qui) | concepteur (Fable) |
| v | « Vendre et suivre » : **facture de vente** (créer, PDF QR) et **Opérations** (le journal : qui me doit, ce qui est payé) | concepteur (Opus) |

Par écran, **3 concepts tous différents** : 1 froid (affine la baseline), 1 tiède (une représentation neuve), 1 chaud (forme libre).
Ids : `<voie><écran 1|2><a|b|c>` (ex. `g1a` = Synthèse froide, `g2c` = Annuel chaud). Le lot fait 24 concepts.

N'écris que dans `v0/<voie>*/` et `v0/RESULTAT-<voie>.md`. N'écris aucun code par heredoc ni par `node -e`. Pas de `git stash`,
aucun commit, rien dans `src/`. Rends une ligne.

## Ajout du 09.11 (ses mots : « on peut mettre de l'ia partout où c'est nécessaire btw »)
L'IA est permise partout où elle épargne un geste ou explique un chiffre (proposer un prix depuis le coût, expliquer un écart, lire une
pièce, préparer la clôture, rédiger une relance). Elle ne remplace jamais le calcul, montre sa source, et ses réponses sont marquées
« exemple » dans la maquette. Un toucher la déclenche ; rien d'IA au repos qui prenne la place de la réponse de l'écran.

## Ajout du 09.11 (ses mots : « btw les manquette ont pas besoin d'être jouable »)
Maquettes statiques : aucun geste à rendre jouable. Un état utile de plus se dessine à côté, en image, au lieu d'un script.
