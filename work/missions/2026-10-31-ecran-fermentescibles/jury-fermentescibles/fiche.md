# Cadrage de l'étape « Malts/sucres 2/7 » : fiche du jury (31.10, niveau rapide)

## Hypothèse
- **Avant** (70 %) : au premier coup d'œil, l'étape montre chaque malt ou sucre (part, masse, couleur) ; on ajoute en un toucher, même sans
  stock ; la forme reprend la langue de r4-a.
- **Après** (85 %) : la même hypothèse, avec trois corrections.
  1. L'ajout sans stock existe déjà : la création à la volée.
  2. Le parcours au clavier sur PC est un acquis.
  3. Il n'y a pas de « panel de comparatif » des malts à construire.

## Tranché
| n° | Question | Réponse | Source |
|---|---|---|---|
| J1 | Scène | Téléphone, une main, attention hachée, comme à Identité. **Et l'ordinateur au clavier** : taper le nom, Entrée, puis la masse. | `BrewWizard.tsx` l. 1279 (« pour les malts sur PC, je veux juste avoir à taper le nom et la quantité au clavier »), l. 1289 (le curseur passe à la masse) |
| J2 | Le geste | Voir ce que la recette contient, ajouter vite, régler la masse (curseur et saisie, comme r4-a). Le clavier reste ; le curseur s'ajoute. | SPEC l. 76 (« quel matière première j'ai, et […] ajouter en un click ») ; ses mots sur r4 (« modifier aussi les chiffre directement ») |
| J3 | Pourquoi maintenant | Le principe est le sien, mais l'écran est un formulaire. Deux phrases d'aide et le texte de la famille sont au repos. L'avertissement « rendement que 75 % » s'affiche sur une recette à 0 kg. Ajouter demande plusieurs gestes (ouvrir, taper, choisir). Les couleurs manquent. | captures `fermentescibles-ajout-390.png`, `-vide-390.png` ; `BrewWizard.tsx` l. 2496, 2518 ; app en ligne (« Couleur à renseigner ») |
| J4 | Réussite | À 390 px, clavier fermé :<br>• chaque ligne lisible : nom, part, masse, couleur ou « à renseigner » ;<br>• l'ajout visible au premier écran ;<br>• 80 mots au plus, aucune phrase d'aide au repos ;<br>• le stock en 0 mot (D23 ter) ;<br>• 1,05 écran au plus avec 8 grains (D5) ;<br>• chaque chiffre écrit une fois. | D13, D23, D5 (`DEFAUTS-COURT.md`) |
| J5 | Acquis | **Les éléments communs** : en-tête, fil, bandeau, pied, + flottant.<br>**La ligne** : nom, moment, part, masse.<br>**Les règles** :<br>• les 5 familles ;<br>• **la famille figée sur la ligne** (l. 2552 : un Maris Otter rangé en lactose faussait la densité finale) ;<br>• **la masse à zéro à l'ajout** (l. 1296 : « Zéro, pas une quantité plausible ») ;<br>• le jour d'ajout en fermentation ;<br>• les avertissements du lactose et de la densité.<br>**L'ajout** : depuis le stock, en premier choix, jamais comme une porte ; et **le parcours au clavier**. | `BrewWizard.tsx` l. 1279-1296, 2552 ; D13 |
| J6 | Déjà refusé | • le cockpit ;<br>• le texte et la légende au premier plan (D3 : 2 lignes au plus) ;<br>• « en stock » ou « stock épuisé » écrit sur chaque option (D23) ;<br>• l'en-tête qui change (D119) ;<br>• le bouton imposant ;<br>• la superposition (D164) ;<br>• un EBC chiffré seul, sans teinte (PORTRAIT § 4) ;<br>• un avertissement sur une recette vide. | `DEFAUTS-COURT.md` ; `IngredientPicker.tsx` l. 61-63 ; PORTRAIT |
| J7 | Contrainte | Ne rien inventer :<br>• une couleur inconnue : pastille vide « ? » ou « à renseigner », EBC total « — », jamais 0 ;<br>• le rendement de 75 % est une valeur par défaut, marquée « repère ».<br>La lisibilité gagne sur la densité. | `?? 75` (l. 895) ; PORTRAIT (« l'inconnu jamais à zéro ») |
| J9 | Code contre récit | (1) Sans stock, l'ajout crée à la volée dès 2 lettres (« Créer « X » (stock à zéro) »), mais il écrit **aussitôt dans le stock** (`App.tsx` l. 545-557).<br>(2) Le « panel de comparatif » de SPEC l. 76 vise les houblons : rien à construire pour les malts.<br>(3) Aucun catalogue de couleurs de malts : la couleur vient du stock (saisie à la main, ou par l'IA de `MaltDetails`). | `IngredientPicker.tsx` l. 87-89 ; `Combobox.tsx` l. 151-154 ; `BrewWizard.tsx` l. 1301 ; `MaltDetails.tsx` l. 30, 57-65 |
| J10 | Premier plan | Au premier plan :<br>• une ligne par ingrédient : la teinte ou « ? », le nom, la part en barre, la masse en curseur tapable ;<br>• l'ajout ;<br>• la marque « à renseigner » tant que l'EBC vaut « — » ;<br>• l'avertissement de densité, seulement sur une recette non vide.<br>Replié : la fiche du malt, l'aide des familles, le rendement, « % ferm. ». | les deux regards ; D3 |
| J11 | Cas limites | • recette vide ;<br>• recette collée, avec des malts inconnus ;<br>• stock vide, donc création ;<br>• couleur inconnue, **le cas de sa vraie recette** ;<br>• un sucre ajouté en fermentation à J+N ;<br>• le lactose ;<br>• NOLO (le bilan des sucres) ;<br>• 8 grains ;<br>• une masse à 0 ;<br>• la saisie au clavier ;<br>• la liste ouverte qui recouvre l'avertissement ;<br>• un lactose ou un fruit créé et rangé en « Sucre » (`newCat`, l. 394-404) ;<br>• un article créé, puis la recette abandonnée (orphelin) ;<br>• hors ligne. | les deux regards |
| J12 | Hors périmètre | Les autres étapes, le moteur, le schéma, les éléments communs. Deux sujets sortent aussi : la création qui écrit dans le Stock, et un catalogue de couleurs. | Identité J12 ; Contradicteur |
| J14 | Suppositions | (1) L'ajout propose le stock, puis la création ; il n'y a pas de catalogue. L'IA de `MaltDetails` est une troisième voie, facturée.<br>(2) Le pas de la masse : voir l'hypothèse 3.<br>(3) La part se calcule.<br>(4) La couleur vient du stock ou d'une saisie, jamais d'une estimation muette. | Contradicteur (code) ; Brasseur |
| J16 | Irréversible | Rien dans le lot de maquettes. Au test sur l'app en ligne :<br>• **ne créer aucun article de stock** (la création écrit dans son vrai stock) ;<br>• **ne lancer aucune IA de couleur** (Gemini, facturé).<br>Seules les recettes se modifient, selon son accord du 31.10. | `App.tsx` l. 545-557 ; ses mots du 31.10 |

## Hypothèses du pilote (réversibles, à recopier dans chaque VOIE.md)
1. Le titre de l'en-tête reste celui du code : « Fermentescibles » dans l'en-tête, « Malts/sucres » dans le fil. C'est un élément commun,
   hors périmètre (J12). Désaccord : le Brasseur préférait « Malts/sucres » partout, son mot (« les Malts »). Signalé, non changé.
2. La masse pilote, la part se calcule (le code). « % pilote » ne vient d'aucun mot de lui ; c'est une option de l'axe A2.
3. Le pas de réglage : 0,05 kg sous 1 kg, 0,1 kg au-dessus. La saisie reste libre, au gramme près. Désaccord : le Brasseur voulait 50 g sous
   1 kg, le Contradicteur constate que tout est en kg (`category="Malt"`, même pour un sucre). Les deux se tiennent dans cette règle.
4. L'ajout en un toucher : un champ toujours prêt (taper le nom), et sous lui, en puces, les malts du stock ou des recettes passées. La
   création libre reste. Le + flottant n'est pas un deuxième ajout.
5. Les variantes se jugent sur **sa recette réelle**, dont les couleurs manquent (J18 du Contradicteur). Un deuxième état montre les couleurs
   renseignées après le geste.

## Axes de variantes (ses goûts, L24 ; les axes des séries v0)
| Axe | Options à montrer, la baseline d'abord | Ses mots |
|---|---|---|
| A1. La forme | la liste actuelle compactée · une barre de composition du grain, avec ses lignes · une carte par ingrédient · (b) et (c) greffées | SPEC l. 76 (« des le premier coup d'œil ») ; Brasseur (« le graphique beaucoup plus grand », PORTRAIT § 1.2) |
| A2. Le réglage | la masse pas à pas (actuel) · la masse en curseur tapable (r4-a) · la part en curseur, la masse calculée | ses mots sur r4 ; aucun mot pour « % pilote » |
| A3. L'ajout | la liste à ouvrir (actuel) · un champ toujours ouvert, nom puis Entrée puis masse · des puces de malts habituels sous le champ | D13 (« un toucher ajoute une ligne ») ; l. 1279 (le clavier) |
| A4. La couleur | le texte « Couleur à renseigner » (actuel) · une pastille de teinte, « ? » si inconnue · la teinte de la bière qui se compose au-dessus | PORTRAIT § 4 (pas de chimie nue) |

## Accords groupés
- Les tests sur l'app en ligne : ne modifier que des recettes, ne créer aucun article de stock et ne lancer aucune IA de couleur (J16).
- Un catalogue de couleurs de malts serait une donnée neuve : voie et accord à part. Rien n'est lancé.

## À mesurer, au conseil
- À mesurer (par la voie de port, plus tard) : le pas des sucres, l'unité d'un sucre ou d'un fruit, et le cas de l'orphelin quand une recette
  est abandonnée.
- Au conseil : rien.

## Désaccords du jury
- Le titre, « Malts/sucres » ou « Fermentescibles » (hypothèse 1).
- Le pas de la masse (hypothèse 3).
- J15 : le Brasseur lit une « composition » dans son vouloir ; le Contradicteur ne trouve aucun mot de lui pour cela. Retenu : un axe (A1),
  pas un vouloir.

Signalé hors de l'étape : le bandeau commun affiche « IBU 60 » avec son curseur sur une recette à 0 kg de grain (capture d'ajout). Le
signaler au port d'Identité.

## Coût
Deux appels : Brasseur (Fable, 43 k jetons), Contradicteur (Opus, 98 k jetons).
