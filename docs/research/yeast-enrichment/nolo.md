# Compléments documentaires NOLO

Collecte du 12 septembre 2026. Le supplément [nolo.json](nolo.json) contient **56 faits sur 4 références existantes**, provenant de **10 sources primaires** reçues. Il n’altère aucun catalogue actif : l’intégration est une étape distincte, conservatrice, menée par le parent.

| Référence exacte | Faits proposés | Apport principal |
|---|---:|---|
| `lalbrew-lona` | 17 | Métabolisme, préparation et conditions d’essai ; nouvelle fiche distinguée de la page produit |
| `yeast-fermentis-safbrew-la-01` | 18 | Forme sèche, données d’essai contextualisées et conduite pratique |
| `yeast-whc-10418626003283` | 12 | Identification, dosage et caractéristiques auparavant absents |
| `white-labs-wlp618` | 9 | Métabolisme, dosage cellulaire documentaire et limites de l’essai |

Le détail utile au brasseur est dans les faits, avec unités, emplacement précis et contexte. Les observations d’atténuation et de durée restent liées au moût d’essai. Les recommandations générales de température et dosage des formes sèches LA-01 et Zero Hero portent le contexte `Beer`, compatible avec le lecteur existant ; les observations conditionnelles conservent leur contexte complet. Une dose en cellules/mL n’est jamais convertie en masse ou en volume sans données de concentration et de viabilité.

## Sources effectivement reçues

Les originaux, textes de travail, reçus HTTP et pages rendues se trouvent dans `.codex-remote-attachments/yeast-enrichment/nolo/`. Chaque entrée `retrievals` conserve l’URL demandée, l’instant de réception, le SHA-256 des **octets reçus**, ETag et Last-Modified lorsqu’ils existent. Les années des faits proviennent des révisions visibles ; les pages non datées gardent `year: null`. Une date HTTP de modification n’est pas une date de publication.

| Préfixe de preuve locale | Source primaire |
|---|---|
| `lona-page` | [Lallemand : page française LoNa](https://www.lallemandbrewing.com/fr/continental-europe/produits/lalbrew-lona/?filter=resources-category%3Dall&page=1) |
| `lona-tds` | [Lallemand : TDS LoNa, révision du 26 novembre 2025](https://admin.lallemandbrewing.com/wp-content/uploads/2023/04/LoNa-TDS-ENG-A4-Print-LalBrew.pdf) |
| `la01-page` | [Fermentis : page française LA-01](https://fermentis.com/fr/produit/safbrew-la-01/) |
| `la01-tds` | [Fermentis : TDS V6, novembre 2025](https://cdn.bfldr.com/G7S7MSWL/at/h4vsgthp4n8m4tqv3vm5hbh/SafBrew_LA-01_EN_V6.pdf) |
| `la01-guide` | [Fermentis : guide V3, novembre 2025](https://cdn.bfldr.com/G7S7MSWL/at/6mrhk74gsv96xjjxxpp98xqw/SafBrew_LA-01_TechnicalGuidelines_EN_V3cleaned.pdf) |
| `whc-page` | [WHC : Zero Hero](https://www.whclab.com/products/zero-hero-low-non-alcoholic-dry-yeast) |
| `whc-tds` | [WHC : SPEC-P-67, révision 0 du 21 janvier 2026](https://www.whclab.com/cdn/shop/files/zero-hero-dry-brewing-yeast-tds.pdf?v=14666179570859637489) |
| `whitelabs-page` | [White Labs : WLP618](https://www.whitelabs.com/yeast-single?id=179&type=YEAST) |
| `whitelabs-tds` | [White Labs : fiche NOLO, révision 3.22](https://www.whitelabs.com/public/uploads/ckeditor/6238c51a7077d1647887642.pdf) |
| `whitelabs-practices` | [White Labs : Best Practices, Part 2, 13 octobre 2022](https://blog.whitelabs.com/best-practices-for-brewing-low-alcohol/non-alcoholic-beers-part-2) |

Les documents Fermentis étaient lisibles par HTTP direct malgré l’échec d’ouverture de leur CDN dans l’outil de recherche. Le produit WHC est aussi lié à l’identifiant exact `10418626003283` dans le HTML reçu. La page Yeastman liée par White Labs a été reçue, mais son corps est une coquille JavaScript sans fiche lisible : elle ne soutient aucun fait du supplément.

## Revue en quatre passes

1. **Collecte complète.** Fiches et pages des quatre produits, reçu réel par source, transcriptions françaises courtes et localisateurs de section/page.
2. **Revue métier.** Séparation de la température de réhydratation, du stockage et de la fermentation ; distinction entre sédimentation et floculation, POF et STA1, dosage recommandé et dosage expérimental. Les essais d’ABV du fabricant ne deviennent pas un simulateur universel.
3. **Recherche des défauts.** Lecture des PDF rendus, puis comparaison à l’extraction. La couche texte du PDF LoNa contient un ancien libellé d’espèce invisible dans le rendu : il est exclu. Les versions différentes restent des observations distinctes, jamais une plage moyenne inventée. Les unités cellulaires non supportées restent en texte. Les signes POF documentés sont explicites ; le parent coordonne le lecteur des anciens signes isolés.
4. **Polissage et recontrôle.** Libellés français, facts inférieurs à 500 caractères, contexte des mesures risquées, liens, identifiants, schéma et SHA vérifiés. Aucun défaut documentaire supplémentaire relevé dans cette passe.

Revue visuelle effectivement effectuée : `lona-tds-1.png`, `lona-tds-2.png`, `la01-tds-1.png`, `la01-tds-2.png`, `la01-guide-1.png`, `la01-guide-2.png`, `whc-tds-1.png`, `whc-tds-2.png`, `whitelabs-tds-1.png`. La recette WLP603 de la seconde page White Labs n’est pas attribuée à WLP618 ; aucune donnée du diagramme de fabrication WHC en troisième page n’est transcrite.

Contrôle exécuté : `node .codex-remote-attachments/yeast-enrichment/nolo/verify-supplement.mjs`. Résultat : 4 identités existantes, 56 faits conformes au schéma partagé, chaque source des faits rattachée à son reçu, SHA recalculés sur les octets locaux identiques, et témoin négatif d’unité non supportée rejeté. Cette vérification technique ne remplace pas la revue documentaire indépendante du parent.

## Limites maintenues

- La forme commerciale actuelle WLP618 n’est pas explicitement établie par les sources reçues ; le champ reste absent.
- LA-01 : aucun statut STA1 n’est déduit de l’espèce ou de POF.
- Zero Hero : absence de déclaration POF, STA1, caractère diastatique, floculation et durée ; la plage d’atténuation de la page n’indique pas son moût d’essai.
- Le résultat `Diastaticus Negative` de LoNa n’est pas converti en résultat génétique STA1.
- Aucun score aromatique, rendement de thiols, vitesse calibrée, durée ferme, ABV final garanti ou attestation de stabilité n’est créé. Les instructions de stabilisation restent celles du fabricant et ne valident pas un lot ni un cycle thermique particulier.

Statut de la feuille : **G1 satisfaite en auto-vérification**, revue indépendante et intégration attendues du parent. Aucun fichier actif, écran ou mécanisme de calcul n’a été modifié par cette feuille.
