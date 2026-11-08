OK partiel — voie a1 : bornes des moments de houblon, sélecteur, saisies Malts/sucres ; une partie des G visuels et du récap reste.

Commits sur worktree-agent-a5442832ce12139c9 : 97a4c6cd (houblons, récap, domaine), 32de3a47 (étape Malts/sucres). Tests ajoutés : `tests/unit/a1defauts/houblons-bornes.test.ts` (16), `tests/unit/fermentescibles/a1-defauts.test.tsx` (14). Base testée : 48a3fee3.
Format : `id | statut (preuve / commit)`. « corrigé » = test qui passe + commit.

## B
M-3 | déjà corrigé (4f063301 : un grain hors empâtage compte 0 ; test M-3 ajouté, DI d'ébullition et IBU identiques avec ou sans grain à J+3)
MV-9 | goût (« Mangue » créée dans la famille Sucre de lait = la famille que le brasseur a choisie à la bascule ; options : A deviner la famille d'après le nom, B garder la bascule seule. Non tranché)
MV-11 | corrigé 32de3a47 (PPG « 99 » ne laisse plus « 9 » ; la valeur d'avant revient)
MV-18 | corrigé 97a4c6cd (négatif non retenu dans patchHop ; validation α)
MV-22 | corrigé 97a4c6cd (la recherche lit le nom et les alias, pas le détail : Citra premier, Altus absent)

## G
M-4 | reste (EBC 267 sans alerte de plausibilité : une borne de couleur n'a pas de source arrêtée ; à décider avec l'audit AM)
TL-10 | reste (aucune table de couleurs de malts sourcée : décision)
TE-18 | non reproduit (test : « Annuler » rend le malt, à sa place, avec sa masse ; déjà corrigé par B1-6)
TE-21 | corrigé 97a4c6cd (négatifs non retenus, max sur les champs, validation)
TE-22 | corrigé 97a4c6cd (contact ≤ 720 h, T −2 à 40 °C, jour ≤ 60 et ≤ fin du programme)
TE-24 | corrigé 97a4c6cd (Annuler du retrait de houblon, pile, 6 s)
TE-27 | reste (l'étape Houblons V5.5 sans le drapeau v4 : retirer l'atelier est un choix de forme)
AM-4 | corrigé 32de3a47 pour l'extrait (ébullition seule) ; sucre/lactose à l'empâtage déjà exclus (table) ; fruit bouilli gardé (purée pasteurisée en fin d'ébullition existe)
AM-6 | corrigé 32de3a47 (plus de PPG inventé pour fruit et extrait ; fiche PPG pour tout ingrédient). Sucre 46 et lactose 35 gardés : constantes physiques. Couleur 0 des sucres : choix CF-1/CF-3, non touché
AM-7 | corrigé 32de3a47 (rapport L/kg : grain empâté seul ; le reste était déjà filtré)
AM-8 | corrigé 97a4c6cd (message à l'étape ; « à corriger » avant de brasser, la recette s'enregistre)
AM-14 | corrigé 97a4c6cd
AM-15 | corrigé 97a4c6cd
AM-16 | corrigé 97a4c6cd
AM-17 | corrigé 97a4c6cd (whirlpool ≤ 180 min ; l'IBU attend)
AM-19 | corrigé 97a4c6cd (ébullition ≤ 240 min ; 0 min : « sans ébullition » pour premier moût et ébullition)
AM-33 | reste (import collé : lecteur d'import hors de mes fichiers)
MV-5 | déjà corrigé (4f063301 : bornes-mv.test, kg/L ; note de saisie à l'étape)
MV-7 | goût (famille par défaut d'un nom neuf comme « Miel » : même question que MV-9)
PI-2 | reste (barre de composition : non traité)
PI-NOTE-2 | reste (survie de alphaConfirme à l'enregistrement : à vérifier sur recette enregistrée)
TE-30 | reste (Eau et sels : autre voie)
TE-38 | reste (accents perdus dans Brassins › Volumes : autre voie)
PD-1 | corrigé 97a4c6cd (« IBU — » sans houblon à chaud ; OG hors bornes : IBU null, test bornesV4)
PD-8 | reste (FG/ABV « — » avec US-05 : levure, autre voie)
BR-2 | corrigé 97a4c6cd (= TE-24)
BR-3 | corrigé 97a4c6cd (changer de moment pose durée, °C, jour du nouveau moment)
BR-4 | reste (carte et fiche : IBU de deux sources ; non traité)
BR-9 | déjà corrigé (OG > 1,130 : note « erreur de saisie » ; test AM 3)
BR-10 | non reproduit (test : deux retraits, un « Annuler » rend les deux)
BR-11 | goût (« dext » en Grain : Carapils avant Dextrose voulu par la règle « la famille du champ d'abord » ; option : promouvoir l'autre rayon à rang égal)
BR-12 | corrigé 32de3a47 (le focus dans une ligne la choisit)
BR-20 | reste (récap, valeurs absurdes au bandeau : étape Récapitulatif)
BR-21 | corrigé 97a4c6cd pour la masse (même règle que l'étape : négatif refusé, vide = 0, 10 t) ; NaN du monkey graine 3 réglé par la même ligne
BR-22 | reste (« Grain 0 kg · OG 1,066 » : bandeau du récap)
BR-31 | reste (retrait du seul palier : étape Paliers)
BR-36 | corrigé 97a4c6cd (= MV-22)
BR-37 | corrigé 97a4c6cd (α et arômes dans la liste ; « α non publié » sinon)
BR-38 | reste (workspace houblon invalide : atelier V5.5)
BR-81 | reste (Eau : autre voie) ; BE-5 idem
BE-78 | reste (référentiels : atelier houblons)

## Sans gravité
B1-NOTE-1 | corrigé 97a4c6cd
B1-NOTE-3, B1-NOTE-5, N-NOTE-1, N-NOTE-4, N-NOTE-5, BA-NOTE-1, GE-NOTE-2, TE-NOTE-6, SU-NOTE-1, SU-NOTE-2, SU-NOTE-5, AM-NOTE-2 | reste (non traité : aucun test ne les reproduit encore)
N-NOTE-5 | voir BR-12 (cause probable : ligne touchée sans effet ; corrigé par le focus)
TR-NOTE-3 | reste (fiche écrit « 0 » pour un dry hop seul ; la liste du recette)

## D
TL-25, TL-31, TE-13, TE-33, RJ-10, RJ-12, PD-4, PD-10, PD-9, BR-13, BR-14, BR-17, BR-19, BR-39, BR-44, BR-45, BR-46, BR-62, BE-16, BR-84, BE-8, BR-98, BR-99, BE-52, BR-101, BE-54, BE-79, BE-81, RO-4, PI-NOTE-3 | reste (non traité : visuel, mot ou autre écran)
TE-19 | non reproduit (l'ajout par pastille place le focus dans la masse, versMasse D230)
TE-25, BR-41 | reste (écriture « g/L exacts » : affichage de l'étape V5.5)
TE-26 | corrigé 97a4c6cd (= BR-3)
AM-9 | reste (rendement 75 % par défaut : décision produit)
AM-10 | déjà corrigé (4f063301 : la part compte le grain empâté, A10)
AM-11 | reste
AM-18 | corrigé 97a4c6cd (whirlpool 40 à 100 °C)
MV-8 | goût (coriandre : aucune famille d'épice ; même question que MV-9)
MV-10 | corrigé 32de3a47 (« Mangue 20 » = Mangue, 20 kg, hors grain)
MV-50 | reste
PI-1 | reste
BR-6 | reste (0,1 kg tapé en g)
BR-15 | corrigé 32de3a47
BR-16 | corrigé 32de3a47 (« -1 » en couleur refusé, plus lu « 1 ») ; message de borne gardé
BR-18 | corrigé 32de3a47 (`lit` refuse le texte : « Crystal 60 » n'est plus J+60)
BR-42 | corrigé 97a4c6cd (−1 g non retenu)

## Tests
Rejoués : `tests/unit/fermentescibles`, `tests/unit/a1defauts`, `tests/integration/monkey.test.tsx` : verts. Rejoué avant les derniers ajouts : `tests/integration/recipeEditing.test.tsx` (30 verts, les 2 échecs connus ne se produisent pas sur cette copie), fuzzSaisie, retraitAnnulable, dataEntry, brewWizardHopV55, recipeWizardSafety, brewingMath, hopBitterness, hopRecipeDesign, recipeReadiness, yeastHandoff. Modules manquants dans cette copie (non maquillés) : `cheerio` (collecteBrewersfriend, collecteHopslist, collecteUsda) et `firebase-functions` (hopReclasserIA) : 4 fichiers de hopIndexV4 ne se chargent pas, avant comme après.
Le stash : j'ai utilisé une fois `git stash push` étiqueté (apply puis drop de ma seule entrée) pour comparer le monkey à la base. Ne plus le faire.

CONNAISSANCE : le monkey (graine 3) a révélé que le récap pouvait écrire `weightKg = undefined` (champ vidé) : NaN à l'étape Malts/sucres. Une seule règle `masseLigneRetenue` (bornesMetier.ts).
LEÇON PROPOSÉE : un test monkey qui suit des gestes au hasard change de chemin dès qu'un élément du DOM s'ajoute ; un échec « nouveau » peut être un défaut latent d'un autre écran : lire la pile (instrumenter le setter) avant de conclure.
