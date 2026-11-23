# Enrichissement des fiches de levures — 12 septembre 2026

Ce travail complète **218 références commerciales existantes**, avec **2 531 observations documentaires** et **97 formes sèche/liquide auparavant absentes**. Les ajouts ont été intégrés aux données locales puis synchronisés dans la base de L’Affinée, en deux lots de 204 et 14 documents, sans conflit. La relecture finale des **218 catalogues distants** correspond intégralement aux données locales ; une seconde simulation d’import ne propose plus de changement.

Le catalogue conserve ses **1 733 références** et passe de **6 476 à 9 007 observations**. Les formats professionnels et homebrew, ainsi que certains mélanges, restent des produits distincts ; ces comptes ne représentent pas des génotypes distincts. Les observations anciennes, liens de preuve et corrections personnelles sont conservés.

| Collecte | Fiches enrichies | Observations ajoutées | Formes renseignées |
|---|---:|---:|---:|
| [Mangrove Jack’s](mangrove.md) | 29 | 194 | 29 |
| [NOLO : LoNa, LA-01, Zero Hero et WLP618](nolo.md) | 4 | 56 | 1 |
| [Escarpment Labs](escarpment.md) | 171 | 2 128 | 53 |
| [Belges et saison : Wyeast, White Labs, Fermentis](../yeast-belgian-enrichment.md) | 7 | 79 | 7 |
| [Lager et anglaises : Wyeast, White Labs, Fermentis](../yeast-lager-enrichment.md) | 7 | 74 | 7 |
| **Total** | **218** | **2 531** | **97** |

## Ce qui devient utile au brasseur

- **Choisir sa conduite de fermentation.** Le [guide Mangrove Jack’s, version 10](https://help.mangrovejacks.com/hc/en-us/article_attachments/13551379984785) apporte notamment les fenêtres de M20, M29 et des lagers, des tolérances déclarées et les exceptions de dosage selon la densité ou la température. Une dose de 10 g pour 23 L garde ses conditions ; elle n’est pas transformée en dose universelle.
- **Comparer une culture auparavant peu renseignée.** [Cali Ale](https://escarpmentlabs.com/products/cali-ale) expose désormais 16–22 °C, 73–85 % d’atténuation et une floculation moyenne. Les [doses professionnelles Escarpment](https://knowledge.escarpmentlabs.com/article/70-standard-pitch-rate) restent exprimées en cellules/hL : aucune conversion en grammes ou mL sans concentration connue.
- **Préparer une bière NOLO avec les bonnes conditions.** La [notice Zero Hero de janvier 2026](https://www.whclab.com/cdn/shop/files/zero-hero-dry-brewing-yeast-tds.pdf?v=14666179570859637489) renseigne l’espèce, 18–22 °C et 50–100 g/hL. Les essais de [LA-01, notice V6 de novembre 2025](https://cdn.bfldr.com/G7S7MSWL/at/h4vsgthp4n8m4tqv3vm5hbh/SafBrew_LA-01_EN_V6.pdf) et de [LoNa, notice de novembre 2025](https://admin.lallemandbrewing.com/wp-content/uploads/2023/04/LoNa-TDS-ENG-A4-Print-LalBrew.pdf) gardent leur moût et leur température d’essai. Une atténuation documentaire ne garantit aucun degré final.
- **Préparer la maturation et l’ensemencement.** [S-189](https://fermentis.com/en/product/saflager-s-189/) conserve son dosage de 80–120 g/hL, sa méthode d’ajout direct et la réhydratation facultative à 15–25 °C. [Wyeast 1968](https://wyeastlab.com/product/london-esb-ale/) distingue clarification et repos de diacétyle ; [3711](https://wyeastlab.com/product/french-saison/) apporte son statut STA1 explicite et ses usages documentés. Ces renseignements restent propres à chaque produit.

## Lecture dans l’interface et transmission

Le résumé d’une fiche groupe température et atténuation. Il affiche **« à comparer »** lorsque plusieurs valeurs diffèrent, au lieu de privilégier la première observation historique. LA-01 conserve ainsi son ancien point 15 % et le nouvel intervalle 13–17 % avec ses conditions d’essai.

La sélection de la culture est accessible avant les longues observations. Les plages sans doublons restent visibles ; **Caractéristiques et consignes** puis **Sources et mises à jour** sont repliés. Les détails contiennent les valeurs, unités et contextes complets. Changer de produit ne reprend pas automatiquement la quantité de l’ancienne levure.

Les références NOLO embarquées reçoivent les mêmes ajouts que le catalogue ; M20 est aussi complétée dans la sélection recette. Les usages IA, overview et jour de brassage s’appuient sur l’identité exacte et les mêmes faits sourcés. Les compléments de conduite et leur transmission sont décrits dans [Informations de levure utiles au brassage](../yeast-information-enrichment.md). Les valeurs contradictoires ou trop conditionnelles restent documentaires ; elles n’imposent pas une consigne automatique.

## Limites conservées

- M08 ne reçoit pas les températures d’un kit cidre comme fenêtre générale. La forme actuelle de WLP618 reste non documentée.
- Les descriptions phénoliques, POF, activité diastatique et statut génétique STA1 restent distincts. Aucune valeur n’est déduite d’un produit voisin.
- Les qualificatifs d’arôme, de vitesse ou de biotransformation ne deviennent pas des coefficients de simulation. La conversion géraniol → β-citronellol ne renseigne pas un rendement de libération des thiols.
- Les contradictions Celsius/Fahrenheit, les bornes ouvertes et les divergences entre documents restent visibles sans moyenne inventée. Les absences et exclusions sont détaillées dans chaque rapport et dans les champs `gaps` des suppléments.
- Chaque observation possède sa source primaire et son localisateur. Les reçus conservent le SHA-256 des octets réellement reçus. Une date de consultation ou de modification HTTP ne remplace pas une date de publication inconnue. La lecture visuelle des PDF a permis d’écarter un ancien texte invisible dans la notice LoNa.

## Reproduction et synchronisation

Les suppléments `mangrove.json`, `nolo.json`, `escarpment.json` et [yeast-style-enrichment-supplement.json](../yeast-style-enrichment-supplement.json) sont conservés avec leurs rapports. Les originaux et reçus locaux se trouvent dans `.codex-remote-attachments/yeast-enrichment/` ; le répertoire reste ignoré par Git. Les 21 reçus du complément par style et leurs octets ont été vérifiés indépendamment et copiés dans son sous-dossier `style-reviewed`. Le collecteur Escarpment possède un mode `--cached` qui vérifie les empreintes sans refaire la collecte.

Depuis la racine du dépôt, l’intégration locale est d’abord une simulation :

```powershell
npm --prefix functions run build
node scripts/enrich-yeast-catalogue.mjs --supplement=docs/research/yeast-style-enrichment-supplement.json
```

Après lecture du plan `.codex-remote-attachments/yeast-enrichment/last-local-plan.json` :

```powershell
node scripts/enrich-yeast-catalogue.mjs --supplement=docs/research/yeast-style-enrichment-supplement.json --apply
node scripts/import-yeast-catalogue.mjs --project=brasserie-l-affinee --ids-file=docs/research/yeast-enrichment/import-ids.json
```

Conserver l’argument `--supplement` pour inclure les 14 références du complément et générer la sélection complète de 218 identifiants. La seconde commande prépare le plan distant sans écrire. L’import ciblé accepte `--apply` après inspection de ce plan, puis une relance sans ce drapeau vérifie l’absence de changement. Il ne supprime aucun document, conserve les champs personnels et exige la version relue avant chaque écriture. Une forme déjà renseignée reste prioritaire. Un catalogue corrigé manuellement est signalé et exclu du remplacement automatique.

## Vérifications effectuées

Le contrôle des données compare les trois jeux actifs à leur état avant enrichissement : mêmes identités, mêmes anciens faits, documents et reçus, mêmes champs personnels et formes déjà connues. Le schéma, l’idempotence, les sélections d’import invalides, les corrections distantes et les préconditions d’écriture font l’objet de tests ciblés. **177 tests passent dans 13 fichiers**, couvrant aussi la transmission des informations au contexte IA, l’import/export de recette et le jour de brassage. Les builds frontend et functions passent. Le test du contexte IA ne lance pas de génération payante.

Le navigateur a été ouvert avant et après modification. Les captures de Cali Ale, LA-01, Zero Hero et M20 ont été regardées à **375, 320 et 1 280 px** ; recherche, filtre fabricant, détails au clavier et sélection ont été joués. S-189 a ensuite été contrôlée à 375 et 1 280 px après intégration du second lot : dose, réhydratation, conservation, détails repliés et sélection explicite. Les valeurs utiles restent visibles, les longues consignes accessibles à la demande et la sélection ne reprend pas l’ancienne dose. Les preuves détaillées sont dans `.unlazy/yeast-enrichment/visual-verification.md`.

Les données ont été synchronisées ; les modifications d’interface sont vérifiées dans l’application locale. Aucun déploiement de l’application n’est inclus dans ce travail.
