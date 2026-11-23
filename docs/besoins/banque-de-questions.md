# Banque de questions houblons

Chaque question concrète à laquelle l'app doit répondre. Les questions viennent
des mots du brasseur ([corpus](corpus-demandes.md)) ; les identifiants `Cxxx`
renvoient à ses citations. Phase 1 de la mission #119, 17.10.2026.

> « Voilà un florilège de questions auxquelles mon app doit répondre. […] Et
> c'est que un ou deux exemples. C'est pas une généralité. » (C061)

Les exemples ouvrent un domaine. Aucune question ne justifie un écran, un
préréglage ou une règle dédiés au seul nom d'une variété ou d'une recette (C013).

## Exigence n° 0 : utilisable avant tout

> « Les questions sont bien mais traite pas le problème de fond: UX UI doit être
> UTILISABLE Pratique facile avec les info uniquement que l'on a besoin et que
> l'on veut... » (C165)

Répondre à une question ne suffit pas. Chaque réponse se lit d'un coup d'œil et
ne montre par défaut que ce qui sert le geste en cours. Le détail existe, mais
il s'ouvre à la demande, au même endroit, en un toucher (C080, C082, C083, C062).
Les règles mesurables sont dans [parcours-cles.md](parcours-cles.md), section
« Exigence n° 0 ».

## Comment lire chaque question

- **Forme de réponse** : ce qui est **visible par défaut**, le strict nécessaire
  au geste. La réponse directe vient d'abord ; aucune explication ne la précède.
- **À la demande** : ce qui s'ouvre en un toucher (raisons, sources, valeurs
  complètes, variantes). Rien de cela n'est affiché d'office.
- **Données et calcul** : ce qu'il faut pour répondre, avec ce que le dépôt
  contient déjà (fichier, nombre d'entrées) et le calcul utilisé.
- **Incertitude** : ce qui reste estimé ou inconnu. Règle du produit : l'app
  n'invente pas un chiffre plausible ; une inconnue reste visible (PRODUCT.md).
- **Cas** : `simple` (geste direct), `80 %` (cas courant, « je sais déjà ce que
  je veux », C062) ou `approfondi` (« aller dans le dur », C062).
- **État actuel dans l’app** : `absent`, `partiel` (code présent, réponse
  incomplète ou non atteinte) ou `fait`. Le rendu n'est mesuré que pour
  l'étape Houblons à 390 × 844 ([parcours](parcours-cles.md)) ; le reste est
  lu dans le code et sera joué en phase 2.
- **Sources** : citations du corpus.

Faits communs aux états (vérifiés le 17.10.2026) :
- usage par style : `src/data/hopStyleUsageBootstrap.json`, 67 variétés, IPA
  seulement ; `HOP_STYLE_ROLES['stout-porter'].examples` vide
  (`src/domain/hopRecipeDesign.ts`) ;
- profils : `src/data/hopBeerMaverickBootstrap.json`, 318 variétés, 164 tags
  d'arôme, alpha/bêta/huiles totales pour 318, myrcène/humulène/caryophyllène
  pour 260 ; scores de substitution Beer Maverick **non importés** ; forme
  `unknown` pour les 318 ;
- production : 12 variétés au catalogue, stock sans lien vers les variétés,
  alpha souvent absent, recettes avec alpha 0 (#120) ;
- étape Houblons mesurée : 0 sur 8 houblons du stock visibles sans toucher ;
  6 sur 8 après 2 touchers, dans une liste brute (parcours-cles.md).

## Vue d'ensemble

| Id | Question | Cas | État |
|---|---|---|---|
| Q01 | Stout : tous mes houblons classés du + au − | 80 % | absent |
| Q02 | Comparer 2, 3 ou 4 houblons | 80 % | partiel |
| Q03 | Un toucher, sans défiler : mon houblon et mon stock | simple | absent |
| Q04 | Stout amérisée au Nugget : trop résineuse ? | approfondi | absent |
| Q05 | Light lager : Saaz remplacé par Styrian Golding | 80 % | partiel |
| Q06 | Houblon indisponible : avec quoi le remplacer ? | 80 % | partiel |
| Q07 | Forte amertume sans sapin, sans résine | approfondi | absent |
| Q08 | Blanche tropicale qui se marie avec la banane | approfondi | absent |
| Q09 | Lager juicy, aromatique, non amère | approfondi | absent |
| Q10 | Pastry stout trop sucrée | approfondi | absent |
| Q11 | Bière de Champagne florale et biotransformation | approfondi | partiel |
| Q12 | Blanche : dry hop avec 20 g de moins dans le moût | 80 % | partiel |
| Q13 | Quel houblon avec ma levure pour ma NEIPA ? | approfondi | partiel |
| Q14 | Cryo et HyperBoost : quand et combien ? | 80 % | partiel |
| Q15 | IBU total simulé, dry hop compris | 80 % | partiel |
| Q16 | Profil d'un houblon : saveurs, chimie, usages | 80 % | partiel |
| Q17 | IBU et apport aromatique de mon programme | 80 % | partiel |
| Q18 | Remplacer X par Y : quelle dose pour le même IBU ? | simple | partiel |
| Q19 | Tel houblon, tel moment, telle levure : quel résultat ? | approfondi | partiel |
| Q20 | Simuler l'ensemble des ajouts | 80 % | partiel |
| Q21 | Houblons pour n'importe quel style | 80 % | absent |
| Q22 | Stout très amère et chocolatée | approfondi | absent |
| Q23 | Houblons pour une IPA, sans se limiter aux noms cités | 80 % | partiel |
| Q24 | Ai-je assez de ce houblon pour ma recette ? | simple | partiel |
| Q25 | Erreur de moment : +30 au lieu de +60 | simple | partiel |
| Q26 | Goût trop herbeux ou raté : que faire ? | approfondi | absent |
| Q27 | NOLO : quels houblons, quelle stratégie ? | approfondi | absent |
| Q28 | Sour : quels houblons avec la culture acidifiante ? | approfondi | absent |
| Q29 | Houblon maison ou sans analyse | approfondi | absent |
| Q30 | Où l'acheter en Suisse ? | 80 % | absent |

Bilan : 0 `fait`, 16 `partiel`, 14 `absent`. Aucune question n'est aujourd'hui
répondue de bout en bout dans l'app, ce que le brasseur constate (C003, C065).

## Questions

### Q01 — Stout : tous mes houblons classés du + au − pour ma stout, stock d'abord

- **Forme de réponse** : visible par défaut : la liste classée de mes houblons pour ce style, stock d’abord : nom, quantité, rang. Rien d’autre sur la ligne. Un toucher ajoute le houblon ou le coche pour comparer (Q02).
- **À la demande** : raison courte du rang et sa base, catalogue complet, « non documenté pour ce style », profil (Q16).
- **Données et calcul** : style exact de la recette (famille et variante :
  Irish, Imperial, Milk, Export…), rôles et usages attestés des variétés par
  style, profil de chaque variété (alpha, huiles, tags), stock normalisé (variété,
  forme, alpha, quantité). Calcul : adéquation au style à partir d'usages
  sourcés et de propriétés documentées, puis tri stock d'abord. Pas de score
  sensoriel inventé.
- **Incertitude** : les usages par style sont peu documentés hors IPA ; les
  tags Beer Maverick sont communautaires. Chaque rang affiche sa base et son
  niveau de preuve.
- **Cas** : 80 %
- **État actuel dans l’app** : absent. Mesuré : 0 sur 8 houblons du stock
  visibles à l'étape Houblons ; aucun classement. Usage par style limité aux IPA ;
  exemples stout vides. Production : catalogue de 12 variétés, stock sans lien.
- **Sources** : C001, C002, C011, C012, C013

### Q02 — Comparer 2, 3 ou 4 houblons côte à côte, avec infos et simulations

- **Forme de réponse** : visible par défaut : 2 à 4 colonnes côte à côte, avec seulement les écarts qui comptent pour ma recette ; les valeurs identiques ne s’affichent pas. Critère du brief : 3 touchers au plus.
- **À la demande** : toutes les valeurs (alpha, bêta, huiles, tags), sources, simulation détaillée (Q17).
- **Données et calcul** : profils (tags, huiles, analyses), recette (volume,
  densité, moment, dose). IBU par Tinseth (`src/services/brewingMath.ts`), dose
  équivalente (`replacementHopDose`, `src/domain/hopDecision/calculations.ts`),
  comparaison de programmes (`compareHopPrograms`,
  `src/domain/hopDecision/programAnalysis.ts`).
- **Incertitude** : plages historiques de fournisseurs, pas des analyses de
  lot ; huiles détaillées absentes pour 58 des 318 variétés.
- **Cas** : 80 %
- **État actuel dans l’app** : partiel. Une comparaison existe dans l'onglet
  « Explorer » de l'atelier V5.5 (`src/ui/hopV55/ContextualExploration.tsx`),
  mais aucun houblon du stock n'y apparaît en un toucher (mesuré). L'ancien
  panneau de comparaison et de simulation a été retiré (corpus A13).
- **Sources** : C001, C015, C068, C069, C070

### Q03 — Sur mobile, en un toucher, sans défiler : choisir mon houblon et voir ce que j'ai

- **Forme de réponse** : visible par défaut : mes houblons avec nom et quantité ; les 5 premiers visibles sans défiler à 390 × 844 ; un toucher sur une ligne l’ajoute.
- **À la demande** : alpha, forme, lot, fournisseur ; moment et dose se règlent sur la ligne.
- **Données et calcul** : stock houblons normalisé ; style de la recette pour
  l'ordre (Q01). Aucun calcul lourd : tri local.
- **Incertitude** : faible ; elle dépend de la qualité du stock (#120).
- **Cas** : simple
- **État actuel dans l’app** : absent. Mesuré : 0 sur 8 sans toucher ; après
  2 touchers cachés (« Corriger les lignes de houblon », puis la liste), 6 sur 8
  dans l'ordre de saisie, avec identifiants internes et quantités tronquées.
- **Sources** : C002, C073, C028

### Q04 — Stout amérisée au Nugget : trop résineuse ou pas assez, et que puis-je ajouter ?

- **Forme de réponse** : visible par défaut : la réponse en une phrase (peu ou beaucoup de résineux pour cet emploi) et 3 compléments classés avec leur dose.
- **À la demande** : descripteurs par source et leurs désaccords, huiles, base du jugement, effet de la torréfaction.
- **Données et calcul** : huiles (myrcène, humulène, caryophyllène), tags,
  moment et durée d'ébullition, style stout ; IBU par Tinseth. Les tags Beer
  Maverick du Nugget (herbal, citrus, ginger, pineapple, geranium, lychee,
  earthy, coconut) ne contiennent pas « resin » : la réponse doit montrer ce
  désaccord entre sources.
- **Incertitude** : forte. Le dépôt n'a aucun modèle chiffré de l'arôme résiduel
  d'un amérisant : la réponse reste qualitative et sourcée.
- **Cas** : approfondi
- **État actuel dans l’app** : absent. Nugget manque au catalogue de production ;
  il est écrit « Nuget » dans le stock (0 g) et dans 2 recettes (#120).
- **Sources** : C051, C035

### Q05 — Light lager : Saaz remplacé par Styrian Golding, qu'est-ce que je gagne ou perds ?

- **Forme de réponse** : visible par défaut : gagné, perdu et la dose pour garder l’IBU, en trois lignes, avec « Appliquer ».
- **À la demande** : profils complets des deux houblons, identité exacte du produit, sources.
- **Données et calcul** : profils « Saaz (CZ) » et « Styrian Golding » (Beer
  Maverick), alpha, identité exacte du produit ; Tinseth et dose équivalente.
- **Incertitude** : profils communautaires ; perception non chiffrée.
- **Cas** : 80 %
- **État actuel dans l’app** : partiel. `findHopSubstitutions` et
  `replacementHopDose` calculent une dose sans similarité aromatique ; rendu non
  joué. Ni Saaz ni Styrian Golding au catalogue de production.
- **Sources** : C050, C068

### Q06 — Houblon indisponible : avec quoi le remplacer, et qu'est-ce que je gagne ou perds ?

- **Forme de réponse** : visible par défaut : 3 à 5 remplaçants classés, stock d’abord, chacun avec sa dose et un mot sur l’écart.
- **À la demande** : écarts détaillés, mélange proposé, offres d’achat (Q30), base de la similarité.
- **Données et calcul** : similarité pondérée par l'usage (amertume ou arôme),
  comme le décrit la référence « your-hop-substitutions-are-wrong » ; stock ;
  disponibilité chez les fournisseurs suisses. Code : `findHopSubstitutions`,
  `proposeHopBlend`, `proposeRemainingHopReplacement`.
- **Incertitude** : la similarité est une estimation ; la disponibilité des
  fournisseurs n'est pas suivie.
- **Cas** : 80 %
- **État actuel dans l’app** : partiel. Dose et blocages calculés ; aucun
  classement par similarité aromatique ; scores Beer Maverick non importés ;
  rendu non joué.
- **Sources** : C055, C031, C032, C068

### Q07 — Forte amertume, sans sapin, sans résine et sans forcément du tropical

- **Forme de réponse** : visible par défaut : les houblons qui tiennent l’amertume haute et les exclusions, avec dose et moment.
- **À la demande** : tags, huiles, compromis et sources.
- **Données et calcul** : alpha, huiles, tags (`pine` : 58 variétés, `resin` :
  21, `tropical` : 50), produits (`hopsteiner-co2-extract`,
  `src/domain/hopDecision/products.ts`), Tinseth.
- **Incertitude** : tags incomplets ; le caractère d'un amérisant dépend du
  moment d'ajout.
- **Cas** : approfondi
- **État actuel dans l’app** : absent. Aucun filtre qui combine objectif et
  exclusions.
- **Sources** : C056

### Q08 — Blanche ultra tropicale qui se marie avec le goût de banane

- **Forme de réponse** : visible par défaut : 3 associations avec moment et dose, et un mot sur l’effet sur la banane.
- **À la demande** : esters et phénols de la levure, ce qui masque la banane, sources.
- **Données et calcul** : tags tropical et fruity, levure (esters, phénols),
  rôle du style witbier (exemples actuels : Saaz, Hallertauer Mittelfrüh, Styrian
  Golding, Tettnanger, aucun tropical).
- **Incertitude** : interactions esters × houblon peu documentées ; origine du
  caractère banane à préciser (corpus A06).
- **Cas** : approfondi
- **État actuel dans l’app** : absent.
- **Sources** : C057, C079

### Q09 — Lager juicy, très aromatique et non amère : quels choix ?

- **Forme de réponse** : visible par défaut : 2 ou 3 stratégies nommées, chacune avec ses houblons et l’IBU visé.
- **À la demande** : compromis avec la lagerisation, amertume à cru, sources.
- **Données et calcul** : tags juicy, tropical, citrus ; IBU de whirlpool
  (Tinseth atténué) ; amertume à cru (Maye 2016, `hopBitternessBootstrap.json`) ;
  levure lager.
- **Incertitude** : écart entre IBU calculé et amertume perçue ; contribution à
  froid en plage.
- **Cas** : approfondi
- **État actuel dans l’app** : absent.
- **Sources** : C054, C036

### Q10 — Pastry stout trop sucrée : compenser avec le houblon ?

- **Forme de réponse** : visible par défaut : la réponse d’abord : le levier houblon, l’IBU ou la dose à ajouter, et sa limite en une phrase.
- **À la demande** : rapport BU:GU, leviers hors houblon, sources.
- **Données et calcul** : IBU, rapport BU:GU (IBU et densité), densité finale,
  style.
- **Incertitude** : l'équilibre sucre et amertume perçu n'est pas modélisé ; le
  rapport BU:GU reste un repère.
- **Cas** : approfondi
- **État actuel dans l’app** : absent.
- **Sources** : C059, C035

### Q11 — Bière de Champagne sucrée, très florale, légère amertume : la biotransformation peut-elle aider ?

- **Forme de réponse** : visible par défaut : l’avis en une phrase (oui, si… ; ou peu probable) et 2 voies concrètes.
- **À la demande** : conditions de la biotransformation, levures β-lyase, alternatives, sources.
- **Données et calcul** : précurseurs connus des variétés, levures β-lyase
  (`src/data/hopYeastBootstrap.json`, 6 levures), stade de fermentation
  (`src/domain/hopDecision/biotransformation.ts`).
- **Incertitude** : effets non chiffrés ; le module actuel est qualitatif
  (documenté, non détecté, inconnu).
- **Cas** : approfondi
- **État actuel dans l’app** : partiel. Module qualitatif présent ; rendu non joué.
- **Sources** : C060, C037, C042

### Q12 — Blanche : dry hop si j'enlève 20 g dans le moût ?

- **Forme de réponse** : visible par défaut : avant et après sur deux lignes : IBU perdu, dose à cru proposée.
- **À la demande** : amertume à cru en plage, apport aromatique, sources.
- **Données et calcul** : Tinseth à l'ébullition ; amertume à cru
  (`dryHopBitterness`, Maye 2016) ; comparaison de programmes
  (`compareHopPrograms`).
- **Incertitude** : arôme non chiffré ; amertume à cru en plage.
- **Cas** : 80 %
- **État actuel dans l’app** : partiel. Fonctions présentes ; rendu non joué ;
  le brasseur a signalé que l'IBU à cru ne fonctionnait pas (C019).
- **Sources** : C053, C019, C049

### Q13 — Avec ma levure, quels houblons et quand pour ma NEIPA ?

- **Forme de réponse** : visible par défaut : 2 ou 3 options houblon × moment pour ma levure, la meilleure en premier.
- **À la demande** : modèle et intervalle, essais documentés, part qui dépend vraiment de la levure.
- **Données et calcul** : levure (β-lyase, atténuation), houblons à thiols,
  moments ; modèles expérimentaux houblon × levure × moment
  (`src/data/hopExtrapolationV4Bootstrap.json`).
- **Incertitude** : modèles expérimentaux avec intervalles ; peu d'essais
  documentés (Lafontaine 2018, Cascade).
- **Cas** : approfondi
- **État actuel dans l’app** : partiel. Index et modèles présents ; rendu non joué.
- **Sources** : C058, C016, C023, C024, C040

### Q14 — Cryo et HyperBoost : quand les utiliser et en quelle quantité ?

- **Forme de réponse** : visible par défaut : oui ou non pour mon objectif, et la dose convertie.
- **À la demande** : règles du fabricant, emplois documentés, limites.
- **Données et calcul** : produits documentés (`products.ts` : Cryo Hops,
  HyperBoost, SPECTRUM, INCOGNITO, LUPOMAX, extrait CO₂) avec leurs règles de
  remplacement ; forme du lot en stock.
- **Incertitude** : règles de fabricant ; la forme manque sur les fiches variété
  (318 « unknown »).
- **Cas** : 80 %
- **État actuel dans l’app** : partiel. Produits dans le code ; en production,
  la forme n'existe que dans le nom (« Houblon Cryo Hops Citra 24.8% », 65 g) ;
  rendu non joué.
- **Sources** : C052, C047

### Q15 — Quel IBU total simulé, dry hop compris ?

- **Forme de réponse** : visible par défaut : un nombre : l’IBU total, avec la part à cru en plage à côté.
- **À la demande** : détail par ajout, modèle utilisé, contact à froid.
- **Données et calcul** : Tinseth, whirlpool atténué, amertume à cru (Maye 2016),
  contact à froid (`src/domain/hopDecision/coldIbuContact.ts`).
- **Incertitude** : la contribution à cru dépend des humulinones ; elle reste une
  plage.
- **Cas** : 80 %
- **État actuel dans l’app** : partiel. La barre « IBU à chaud · Tinseth » est
  affichée (mesuré) ; la part à cru n'est pas jouée ; les lignes à alpha 0 de
  production donnent 0 IBU (#120).
- **Sources** : C049, C018, C019, C041, C048

### Q16 — Quel est le profil de ce houblon : saveurs, chimie, usages ?

- **Forme de réponse** : visible par défaut : un profil lisible d’un coup d’œil (axes aromatiques) et l’alpha.
- **À la demande** : huiles, usages par style, associations, substituts, sources et confiance.
- **Données et calcul** : Beer Maverick (318), `hopDatabaseBootstrap.json` (220),
  fabricants (102). Les thiols et phénols demandés (C021) ne sont pas dans ces données.
- **Incertitude** : plages agrégées et données communautaires.
- **Cas** : 80 %
- **État actuel dans l’app** : partiel. `HopKnowledgePanel` et
  `HopTechnicalPanel` lisent les données embarquées ; rendu non joué ; le
  catalogue client de production n'a que 12 variétés.
- **Sources** : C048, C021, C071, C022

### Q17 — IBU et apport aromatique pour la dose et le moment prévus

- **Forme de réponse** : visible par défaut : sur chaque ligne d’ajout : l’IBU et le profil en petit, mis à jour à chaque réglage, en moins d’une seconde.
- **À la demande** : plages, base des estimations, total détaillé.
- **Données et calcul** : Tinseth ; modèles d'extrapolation aromatique (axes) ;
  dose en g/L.
- **Incertitude** : l'apport aromatique est une estimation expérimentale.
- **Cas** : 80 %
- **État actuel dans l’app** : partiel. IBU affiché ; l'apport aromatique de
  l'atelier V5.5 n'est pas atteint depuis l'étape (mesuré). Le brasseur constate
  qu'« aucune simulation semble fonctionner » (C006).
- **Sources** : C001, C015, C017, C006

### Q18 — Si je remplace X par Y, quelle quantité pour le même IBU ?

- **Forme de réponse** : visible par défaut : la dose de Y en grammes, sur la ligne.
- **À la demande** : écart d’arôme et alphas utilisés.
- **Données et calcul** : alpha des deux houblons (en champ, pas dans le nom) ;
  Tinseth ; `replacementHopDose`.
- **Incertitude** : faible si l'alpha est connu ; plage si l'alpha est une plage.
- **Cas** : simple
- **État actuel dans l’app** : partiel. Calcul présent ; rendu non joué ; alpha
  absent sur 7 articles du stock de production (#120).
- **Sources** : C001, C055

### Q19 — Si j'ajoute tel houblon à tel moment avec telle levure, qu'est-ce que ça va donner ?

- **Forme de réponse** : visible par défaut : le résultat attendu de ce geste en une ligne (profil, IBU).
- **À la demande** : intervalle, base, essais comparables.
- **Données et calcul** : modèle houblon × levure × moment, index et essais
  documentés.
- **Incertitude** : intervalles larges hors des combinaisons essayées (C023).
- **Cas** : approfondi
- **État actuel dans l’app** : partiel. Modèles présents ; rendu non joué.
- **Sources** : C016, C024, C023

### Q20 — Simuler l'ensemble de mes ajouts : saveur et chimie totales

- **Forme de réponse** : visible par défaut : un profil total du programme, à côté de la liste des ajouts.
- **À la demande** : contribution de chaque ajout, saturation, sources.
- **Données et calcul** : `analyzeHopProgram` et `compareHopPrograms`
  (`programAnalysis.ts`), modèles aromatiques, Tinseth.
- **Incertitude** : cumul et saturation des ajouts estimés.
- **Cas** : 80 %
- **État actuel dans l’app** : partiel. Fonctions présentes ; rendu non joué.
- **Sources** : C015, C017

### Q21 — Quels houblons pour ce style, quel qu'il soit (lager, saison, witbier, sour, stout…) ?

- **Forme de réponse** : visible par défaut : le même classement que Q01, pour le style de la recette.
- **À la demande** : « non documenté » détaillé, rôles par famille de style.
- **Données et calcul** : usages par style pour tous les styles, pas seulement
  les IPA ; rôles par famille (`HOP_STYLE_ROLES`).
- **Incertitude** : couverture des sources variable selon le style.
- **Cas** : 80 %
- **État actuel dans l’app** : absent. Usage par style limité aux IPA ;
  exemples vides pour stout, Kölsch et Altbier, sour.
- **Sources** : C011, C039, C061

### Q22 — Stout très amère et chocolatée : quel houblonnage ?

- **Forme de réponse** : visible par défaut : 2 ou 3 amérisants avec l’IBU visé et le moment.
- **À la demande** : rapport BU:GU, interaction avec la torréfaction.
- **Données et calcul** : IBU, rapport BU:GU, style stout, profils.
- **Incertitude** : interaction torréfaction × amertume perçue non modélisée.
- **Cas** : approfondi
- **État actuel dans l’app** : absent. La recette « stout amère » de production
  (17.10) porte Ariana 7 g tiré d'une fiche à 0 g (#120).
- **Sources** : C035, C001

### Q23 — Quels houblons recommander pour une IPA, sans se limiter aux noms cités ?

- **Forme de réponse** : visible par défaut : le classement IPA, ouvert à tout le catalogue.
- **À la demande** : usages attestés et sources.
- **Données et calcul** : `hopStyleUsageBootstrap.json` (IPA, American IPA,
  Hazy IPA, English IPA ; 67 variétés).
- **Incertitude** : usages attestés, pas de score sensoriel.
- **Cas** : 80 %
- **État actuel dans l’app** : partiel. Seule famille couverte par les données
  d'usage ; rendu non joué.
- **Sources** : C012, C013

### Q24 — Ai-je assez de ce houblon pour la dose prévue ?

- **Forme de réponse** : visible par défaut : sur la ligne : la quantité en stock à côté de la dose, en couleur d’alerte si elle manque.
- **À la demande** : lots, dates, fournisseur.
- **Données et calcul** : stock normalisé (article lié à la variété), dose de la
  recette.
- **Incertitude** : faible, si le stock est à jour et lié.
- **Cas** : simple
- **État actuel dans l’app** : partiel. Le stock se déduit au brassage ; en
  production, l'article n'est pas lié à la variété et des doublons existent (#120).
- **Sources** : C002, C028

### Q25 — J'ai mis le houblon à +30 au lieu de +60 : qu'est-ce que ça change ?

- **Forme de réponse** : visible par défaut : l’IBU recalculé et l’écart en une ligne, avec une correction proposée.
- **À la demande** : détail du calcul.
- **Données et calcul** : Tinseth sur la durée réelle.
- **Incertitude** : faible pour l'IBU calculé.
- **Cas** : simple
- **État actuel dans l’app** : partiel. Le calcul existe ; le geste de correction
  au jour de brassage n'est pas joué.
- **Sources** : C034

### Q26 — Mon houblon a un goût trop herbeux (ou un autre raté) : que faire maintenant et au prochain brassin ?

- **Forme de réponse** : visible par défaut : ce que je peux faire maintenant, en 2 ou 3 actions, puis ce qu’il faut changer au prochain brassin.
- **À la demande** : causes possibles, sources.
- **Données et calcul** : stade du brassin, programme réel, descripteurs ;
  connaissances sourcées sur les défauts (herbacé, végétal).
- **Incertitude** : diagnostic qualitatif ; cause parfois hors houblon.
- **Cas** : approfondi
- **État actuel dans l’app** : absent. Le conseil assisté est désactivé en
  production et le conseil V6 est refusé par l'API (#103).
- **Sources** : C033, C061

### Q27 — NOLO : quels houblons et quelle stratégie pour une bière peu ou pas alcoolisée ?

- **Forme de réponse** : visible par défaut : 2 stratégies NOLO avec leurs houblons et leur dose.
- **À la demande** : différences avec la recette habituelle, sources.
- **Données et calcul** : mode NOLO de la recette (`src/domain/nolo.ts`), profils,
  IBU.
- **Incertitude** : peu de sources houblon spécifiques au NOLO dans le dépôt.
- **Cas** : approfondi
- **État actuel dans l’app** : absent pour le houblon.
- **Sources** : C061

### Q28 — Sour : quels houblons avec ma culture acidifiante ?

- **Forme de réponse** : visible par défaut : oui ou non pour ma culture, et l’IBU acceptable.
- **À la demande** : accords aromatiques, absence de seuil universel, sources.
- **Données et calcul** : culture, procédé, IBU ; rôle « sour » de
  `HOP_STYLE_ROLES` (texte présent, exemples vides).
- **Incertitude** : aucun seuil universel (texte du rôle actuel).
- **Cas** : approfondi
- **État actuel dans l’app** : absent.
- **Sources** : C061, C039

### Q29 — Houblon maison ou sans analyse : comment l'utiliser ?

- **Forme de réponse** : visible par défaut : une dose de départ et une phrase sur ce qu’il faut observer.
- **À la demande** : plages par défaut, observations à noter.
- **Données et calcul** : observations du brasseur, plages par défaut sourcées.
- **Incertitude** : forte ; alpha et huiles inconnus.
- **Cas** : approfondi
- **État actuel dans l’app** : absent.
- **Sources** : C061

### Q30 — Où acheter ce houblon en Suisse, avec un lien direct ?

- **Forme de réponse** : visible par défaut : le fournisseur suisse le plus sûr, avec un lien direct.
- **À la demande** : autres offres, date de vérification.
- **Données et calcul** : offres fournisseurs datées, distinctes de la fiche
  variété (même règle que la levure dans PRODUCT.md).
- **Incertitude** : disponibilité changeante ; offre datée.
- **Cas** : 80 %
- **État actuel dans l’app** : absent.
- **Sources** : C032, C044

## Questions anticipées par des agents (non confirmées)

Ces formulations viennent de `recap-avant-seconde-passe.md` et de
`recap-avant-opus.md`. Ce sont des propositions d'agents (corpus A03), à
confirmer à la porte A avant d'entrer dans la banque :

- Un remplaçant suffit-il, ou un mélange apporte-t-il un meilleur compromis ?
- Faut-il changer la dose, le moment, la température, le contact ou la forme,
  plutôt que la variété ?
- Pourquoi deux lots d'une même variété donnent-ils des données différentes ?
- Comment l'arôme visé évoluera-t-il d'ici la dégustation ?
- Comment garder mes essais et dégustations pour affiner mes prochains choix ?
