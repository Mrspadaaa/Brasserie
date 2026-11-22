/**
 * Corpus et vérités du banc d'embeddings (15.11). Tout est écrit à la main, rien de personnel :
 *  - T1 : les lignes sont celles de fixtures déjà dans Git (fournisseurs et pièces fictifs) ; les besoins « À venir » sont des projets
 *    d'équipement d'une micro-brasserie type, inventés (forme : titre + à quoi ça sert, comme `CreativeItem` / `FinancialPlan.upgrade`) ;
 *  - T2 : notes inventées, au ton d'un brasseur pressé, rangées dans les 5 rubriques de l'Atelier (`CreativeItem['type']`) ;
 *  - T3 : fiches de houblons publiques (`src/data/hopBeerMaverickFiches.json`), requêtes écrites à la main.
 * Une ligne ambiguë (qui pourrait servir deux besoins) est laissée de côté, jamais tranchée au hasard.
 */

export interface Doc { id: string; title: string; text: string; cls?: string }
export interface Query { id: string; text: string; truth: string[] | null; src: string; exclude?: string }

// ---------------------------------------------------------------------------------------------------------------------
// T1 : lignes de devis ou de facture -> besoin « À venir »
// ---------------------------------------------------------------------------------------------------------------------
export const BESOINS: Doc[] = [
  { id: 'B01', title: 'Fermenteur inox 30 L avec couvercle et robinet', text: 'Un deuxième fermenteur pour brasser deux fois par semaine sans attendre que le premier se libère.' },
  { id: 'B02', title: 'Réparer la pompe de transfert', text: 'La pompe de circulation fuit à l\'arbre et chauffe : garniture mécanique, joints, main-d\'œuvre du mécanicien.' },
  { id: 'B03', title: 'Hotte d\'aspiration inox', text: 'Évacuer la vapeur de l\'ébullition de la salle de brassage, condensation sur les murs.' },
  { id: 'B04', title: 'Thermomètre numérique à sonde', text: 'Mesurer la température de l\'empâtage et de la fermentation avec précision, remplacer le thermomètre à alcool.' },
  { id: 'B05', title: 'Fûts inox 20 L supplémentaires', text: 'Six fûts de plus pour livrer les restaurants sans manquer de contenants, avec leurs joints.' },
  { id: 'B07', title: 'Capsuleuse et capsules couronne', text: 'Passer à la mise en bouteilles : capsuleuse à levier, capsules couronne 26 mm.' },
  { id: 'B08', title: 'Siphon de soutirage', text: 'Soutirer en bouteilles sans oxygène ni éclaboussures, avec pompe d\'amorçage.' },
  { id: 'B09', title: 'Raccords Tri-Clamp pour la tuyauterie inox', text: 'Raccords, joints et colliers 1,5 pouce pour relier cuves, pompe et refroidisseur.' },
  { id: 'B10', title: 'Bouteilles brunes 33 cl', text: 'Un premier tirage en bouteilles de 33 cl pour la vente au caveau et à l\'épicerie.' },
  { id: 'B11', title: 'Densimètre et éprouvette', text: 'Mesurer la densité initiale et finale de chaque brassin, aujourd\'hui à l\'œil.' },
  { id: 'B13', title: 'Tuyaux silicone et pinces', text: 'Tuyaux alimentaires de 10 mm et pinces pour les transferts entre fermenteurs.' },
  { id: 'B14', title: 'Brosses et rince-bouteilles', text: 'Nettoyer les bouteilles et les fûts avant le remplissage.' },
  { id: 'B15', title: 'Sacs à houblon fins', text: 'Pour le dry hop et le whirlpool, éviter les particules dans le fermenteur.' },
  { id: 'B16', title: 'Barboteurs et bouchons percés', text: 'Laisser sortir le CO2 des fermenteurs sans laisser entrer l\'air : barboteurs et bouchons en silicone.' },
  { id: 'B17', title: 'Bouteille de CO2 et détendeur', text: 'Gazéifier et pousser les fûts, avec manomètre et raccords.' },
  { id: 'B18', title: 'Cuve de brassage 100 L', text: 'Passer de 50 à 100 L de moût, chauffage électrique et fond filtrant.' },
  { id: 'B19', title: 'Refroidisseur à plaques', text: 'Descendre le moût à la température de levurage en quelques minutes.' },
  { id: 'B20', title: 'Régulateur de température de fermentation', text: 'Contrôler la fermentation dans la cave, sonde et résistance chauffante.' },
  { id: 'B21', title: 'Étiqueteuse', text: 'Coller les étiquettes droites sur les bouteilles au lieu de le faire à la main.' },
  { id: 'B22', title: 'Moulin à malt', text: 'Concasser le grain soi-même, deux rouleaux réglables.' },
  { id: 'B23', title: 'Balance de précision 0,01 g', text: 'Peser les houblons et les additifs avec exactitude.' },
  { id: 'B24', title: 'pH-mètre étalonnable', text: 'Mesurer le pH de l\'empâtage et du moût, solutions d\'étalonnage comprises.' },
  { id: 'B25', title: 'Bacs plastique 40 L', text: 'Stocker le grain et le matériel propre, bacs avec couvercle.' },
  { id: 'B26', title: 'Chambre froide', text: 'Garder les fûts, les bouteilles et les houblons au frais toute l\'année.' }
];

export const LIGNES: Query[] = [
  { id: 'L01', text: 'Hotte aspirante inox', truth: ['B03'], src: 'tests/fixtures/gemini-usage-bench/cases.json' },
  { id: 'L02', text: 'Reparation de la pompe', truth: ['B02'], src: 'cases.json' },
  { id: 'L03', text: 'Frais de livraison', truth: null, src: 'cases.json' },
  { id: 'L04', text: 'Remise commerciale', truth: null, src: 'cases.json' },
  { id: 'L05', text: 'Malt Pilsner 25 kg', truth: null, src: 'cases.json' },
  { id: 'L06', text: 'Detergent alcalin CIP 10 L', truth: null, src: 'cases.json' },
  { id: 'L07', text: 'Capsules couronne 26 mm', truth: ['B07'], src: 'cases.json' },
  { id: 'L08', text: 'Bouteilles 33 cl brunes', truth: ['B10'], src: 'cases.json' },
  { id: 'L09', text: 'Main d\'oeuvre reparation pompe', truth: ['B02'], src: 'vision-2/facture-a4-photo.truth.json' },
  { id: 'L10', text: 'Garniture mecanique 25 mm', truth: ['B02'], src: 'vision-2/facture-a4-photo.truth.json' },
  { id: 'L11', text: 'Raccord Tri-Clamp 1.5 pouce', truth: ['B09'], src: 'vision-2/facture-a4-photo.truth.json' },
  { id: 'L12', text: 'Frais de deplacement', truth: null, src: 'vision-2/facture-a4-photo.truth.json' },
  { id: 'L13', text: 'Reparation pompe circulation', truth: ['B02'], src: 'vision-2/quittance-manuscrite.truth.json' },
  { id: 'L14', text: 'Bac plastique 40 L', truth: ['B25'], src: 'vision-2/ticket-coupe.truth.json' },
  { id: 'L15', text: 'Fut inox 20 L', truth: ['B05'], src: 'vision-2/ticket-froisse-ombre.truth.json' },
  { id: 'L16', text: 'Joints de fut (5)', truth: ['B05'], src: 'vision-2/ticket-froisse-ombre.truth.json' },
  { id: 'L17', text: 'Houblon Saaz 500 g', truth: null, src: 'vision-2/ticket-froisse-ombre.truth.json' },
  { id: 'L18', text: 'Levure W-34/70 11.5 g', truth: null, src: 'vision-2/ticket-froisse-ombre.truth.json' },
  { id: 'L19', text: 'Bicchieri degustazione', truth: null, src: 'vision-2/ticket-italien-eur.truth.json' },
  { id: 'L20', text: 'Sucre de canne 1 kg', truth: null, src: 'vision-2/ticket-thermique-pali.truth.json' },
  { id: 'L21', text: 'Pince Hoffmann', truth: ['B13'], src: 'vision/ticket-net.truth.json' },
  { id: 'L22', text: 'Tuyau silicone 10 mm', truth: ['B13'], src: 'vision/ticket-net.truth.json' },
  { id: 'L23', text: 'Thermometre digital', truth: ['B04'], src: 'vision/ticket-net.truth.json' },
  { id: 'L24', text: 'Brosse a bouteilles', truth: ['B14'], src: 'vision/ticket-net.truth.json' },
  { id: 'L25', text: 'Flaschenbuerste', truth: ['B14'], src: 'vision/ticket-etranger.truth.json' },
  { id: 'L26', text: 'Gärtank 30 Liter rund mit Deckel', truth: ['B01'], src: 'tests/unit/depense/h13-0811/doc8.json' },
  { id: 'L27', text: 'Auslaufhahn zu Gärfass 10 mm', truth: ['B01'], src: 'doc8.json' },
  { id: 'L28', text: 'Gärglocke Duplex zu Gärfass', truth: ['B16'], src: 'doc8.json' },
  { id: 'L29', text: 'Silikonstopfen gebohrt zu Gärfass', truth: ['B16'], src: 'doc8.json' },
  { id: 'L30', text: 'Gaerroehrchen', truth: ['B16'], src: 'vision/ticket-etranger.truth.json' },
  { id: 'L31', text: 'Kronkorken 100 Kapseln Kupfer', truth: ['B07'], src: 'doc8.json' },
  { id: 'L32', text: 'Kronkorken 26 mm 200 St.', truth: ['B07'], src: 'vision/ticket-etranger.truth.json' },
  { id: 'L33', text: 'Hopfensack fein', truth: ['B15'], src: 'doc8.json' },
  { id: 'L34', text: 'Hopfensack für Dolden', truth: ['B15'], src: 'doc8.json' },
  { id: 'L35', text: 'Siphon mit Ansaugpumpe', truth: ['B08'], src: 'doc8.json' },
  { id: 'L36', text: 'Malzextraktpulver hell 1 Kg', truth: null, src: 'doc8.json' },
  { id: 'L37', text: 'Weizenmalz 5 kg', truth: null, src: 'vision/ticket-etranger.truth.json' },
  { id: 'L38', text: 'Hefe WB-06', truth: null, src: 'vision/ticket-etranger.truth.json' },
  { id: 'L39', text: 'Acide citrique 1 kg', truth: null, src: 'vision/illisible.truth.json' },
  { id: 'L40', text: 'Gants nitrile (100)', truth: null, src: 'vision/ticket-sombre-pli.truth.json' },
  { id: 'L41', text: 'Capsules 26 mm (200)', truth: ['B07'], src: 'vision/ticket-long-tva.truth.json' },
  { id: 'L42', text: 'Irish Moss 50 g', truth: null, src: 'vision/ticket-long-tva.truth.json' },
  { id: 'L43', text: 'Safale US-05 11,5g', truth: null, src: 'tests/unit/depense/h13-0811/doc12.json' },
  { id: 'L44', text: 'Houblon Perle pellets 1 kg', truth: null, src: 'vision/bulletin-photo.truth.json' }
];

// ---------------------------------------------------------------------------------------------------------------------
// T2 : notes en vrac -> rubrique de l'Atelier (`CreativeItem['type']`)
// ---------------------------------------------------------------------------------------------------------------------
export const RUBRIQUES: Array<{ id: string; label: string; description: string; exemples: string[] }> = [
  { id: 'equipment', label: 'Projets de matériel', description: 'Un achat ou un projet d\'équipement : machine, cuve, pompe, outil, devis fournisseur.',
    exemples: ['Il faudrait un deuxième fermenteur de 60 L avant l\'été', 'Demander un devis pour une chambre froide de 6 m²', 'Remplacer la vieille pompe qui chauffe pendant les transferts'] },
  { id: 'recipe-idea', label: 'Idées de recettes', description: 'Une idée de bière ou de style : recette à tester, ingrédients, arômes visés.',
    exemples: ['Une saison au poivre rose et zestes de pomelo', 'Tester une stout au café froid et à la vanille', 'Une pils non filtrée avec du Saaz tardif en dry hop'] },
  { id: 'event', label: 'Événements', description: 'Une date, un marché, une dégustation, une fête, un salon, et ce qu\'il faut préparer.',
    exemples: ['Marché de Noël du village le 12 décembre, prévoir 3 fûts', 'Portes ouvertes de la brasserie en mai, dégustation et visite', 'Salon des artisans à Fribourg, stand à réserver avant mars'] },
  { id: 'pricing-test', label: 'Tests de prix', description: 'Un essai de prix de vente : combien facturer, comparaison, tarif à tester.',
    exemples: ['Tester la blonde à 4,50 CHF le 33 cl au caveau contre 4 CHF', 'Fût de 20 L à 150 CHF aux restaurants : trop cher ?', 'Pack de 6 bouteilles à 24 CHF au lieu de 26'] },
  { id: 'prospect', label: 'Contacts et prospects', description: 'Une personne ou un lieu à contacter : restaurant, bistrot, magasin, rendez-vous, rappel.',
    exemples: ['Bistrot de la gare intéressé par la blonde en fût, rappeler jeudi', 'Épicerie du village cherche des bières locales, passer avec un échantillon', 'Le gérant de l\'hôtel du lac veut goûter l\'ambrée'] }
];

const n = (id: string, text: string, truth: string[]): Query => ({ id, text, truth, src: 'écrit à la main (15.11)' });
export const NOTES: Query[] = [
  n('N01', 'Le joint de la cuve d\'empâtage fuit, voir si on change la cuve entière ou juste le joint', ['equipment']),
  n('N02', 'Refroidisseur à plaques 20 plaques chez le fournisseur d\'Allemagne, ~900 CHF livré', ['equipment']),
  n('N03', 'Acheter un pH-mètre étalonnable, le papier ne suffit plus', ['equipment']),
  n('N04', 'Moulin à malt à deux rouleaux, motorisé, pour arrêter de passer le grain chez le voisin', ['equipment']),
  n('N05', 'Tireuse à fûts 4 robinets pour le caveau, comparer deux modèles', ['equipment']),
  n('N06', 'Besoin d\'une balance au 0,01 g pour les doses de houblon en dry hop', ['equipment']),
  n('N07', 'Passer le chauffage de la cuve du gaz à l\'électrique, devis en cours', ['equipment']),
  n('N08', 'Tuyauterie inox pour le circuit de refroidissement, raccords tri-clamp à commander', ['equipment']),
  n('N09', 'Et si on faisait une IPA brumeuse avec de l\'avoine et du Citra/Mosaic, 6 % max ?', ['recipe-idea']),
  n('N10', 'Blanche au sureau de la région, coriandre en moins, un peu de lactose', ['recipe-idea']),
  n('N11', 'Une brune d\'hiver avec du miel de sapin ajouté en fin d\'ébullition', ['recipe-idea']),
  n('N12', 'Faire une lager ambrée avec du malt Vienne et du Hallertau, 4,8 %', ['recipe-idea']),
  n('N13', 'Essayer la levure kveik pour une pale ale rapide en 5 jours à 35 degrés', ['recipe-idea']),
  n('N14', 'Bière de blé au houblon Hallertau Blanc, notes de vin blanc', ['recipe-idea']),
  n('N15', 'Sour rapide à la framboise, kettle sour puis fruits au fermenteur', ['recipe-idea']),
  n('N16', 'Une session IPA à 3,5 % sans trop perdre de corps, avec du flocon d\'avoine', ['recipe-idea']),
  n('N17', 'Fête du 1er août à la commune, ils demandent deux fûts de blonde et un stand', ['event']),
  n('N18', 'Soirée dégustation accords bières et fromages le samedi 8 mars au caveau', ['event']),
  n('N19', 'Brassage collectif avec les amis le dernier week-end d\'avril, prévoir 3 brassins', ['event']),
  n('N20', 'Concours de bières artisanales en septembre, inscription ouverte jusqu\'au 15 juillet', ['event']),
  n('N21', 'Marché du terroir, dimanche matin, apporter la tireuse et les verres', ['event']),
  n('N22', 'Visite de classe de l\'école hôtelière jeudi après-midi', ['event']),
  n('N23', 'Vide-grenier du quartier, location de l\'emplacement 20 CHF', ['event']),
  n('N24', 'Fête de la bière de la ville voisine, arriver la veille pour monter le stand', ['event']),
  n('N25', 'Vendre l\'IPA 5 CHF la bouteille de 33 cl pendant le marché, voir si les ventes baissent', ['pricing-test']),
  n('N26', 'Prix du litre à emporter avec consigne, essayer 7 CHF le litre', ['pricing-test']),
  n('N27', 'Comparer le prix de la stout avec ceux des deux concurrents de la région', ['pricing-test']),
  n('N28', 'Offrir 10 % de rabais à partir de 3 packs, mesurer si les packs augmentent', ['pricing-test']),
  n('N29', 'Tester un tarif de gros à 1,90 CHF la bouteille pour les épiceries', ['pricing-test']),
  n('N30', 'Marge trop faible sur la blanche, essayer +0,50 CHF et suivre le mois', ['pricing-test']),
  // Deux lectures admises : un prix d'essai donné pendant une fête relève des deux rubriques.
  n('N31', 'Prix d\'un verre à la pression à 4 CHF ou 4,50 CHF lors de la fête', ['pricing-test', 'event']),
  n('N32', 'Abonnement caisse mensuelle de 12 bouteilles à 59 CHF, à tester avec 5 clients', ['pricing-test']),
  n('N33', 'Restaurant du port : le chef veut une bière pour accompagner ses poissons, lui apporter la blanche', ['prospect']),
  n('N34', 'Caviste du centre-ville a demandé le tarif pro, rappeler lundi matin', ['prospect']),
  n('N35', 'Un camping-car boutique à Bulle cherche 3 références, contact par téléphone', ['prospect']),
  n('N36', 'Gérante de la coop locale, rendez-vous mardi à 14 h pour présenter la gamme', ['prospect']),
  n('N37', 'Bar à tapas à Neuchâtel, ils ont goûté l\'IPA au marché et veulent commander', ['prospect']),
  n('N38', 'Le traiteur du village organise un mariage en juin, il lui faut 50 L', ['prospect']),
  // Deux lectures admises : une bière au pain est une idée de recette autant qu'un contact.
  n('N39', 'Boulangerie qui voudrait une bière au pain pour Noël, demander si elle fournit les restes', ['prospect', 'recipe-idea']),
  n('N40', 'Épicier bio de la vallée : envoyer le catalogue et la liste de prix par courriel', ['prospect'])
];

// ---------------------------------------------------------------------------------------------------------------------
// T3 : houblons. (a) « proche de X » : vérité = substituts publiés par la source, présents dans le corpus ;
//      (b) description libre : vérité écrite à la main (savoir du brasseur), vérifiée contre les noms du corpus.
// ---------------------------------------------------------------------------------------------------------------------
const q = (id: string, text: string, truth: string[]): Query => ({ id, text, truth, src: 'écrit à la main (15.11), savoir du brasseur' });
export const HOUBLONS_LIBRES: Query[] = [
  q('H01', 'Un houblon pour une IPA brumeuse très tropicale, mangue et ananas, peu amère', ['Mosaic', 'Citra', 'Galaxy', 'El Dorado', 'Azacca', 'Nectaron', 'Vic Secret', 'Strata']),
  q('H02', 'Houblon noble floral et épicé léger pour une pilsner tchèque', ['Saaz (CZ)', 'Saaz Late', 'Hallertau Mittelfrüh', 'Tettnanger', 'Spalter Select', 'Sládek', 'Saphir', 'Hersbrucker', 'Lubelska']),
  q('H03', 'Vin blanc, groseille à maquereau, style Nouvelle-Zélande', ['Nelson Sauvin', 'Hallertau Blanc', 'Enigma']),
  q('H04', 'Houblon d\'amérisation propre et neutre pour une lager, beaucoup d\'alpha', ['Magnum (US)', 'Magnum (GR)', 'Warrior', 'Herkules', 'Nugget', 'Columbus', 'Hallertau Taurus', 'Target']),
  q('H05', 'Houblon anglais terreux pour un bitter, bois et épices douces', ['East Kent Goldings', 'Fuggle', 'Golding', 'Whitbread Golding Variety (WGV)', 'Challenger', 'Target', 'First Gold', 'Progress', 'Bramling Cross', 'Sovereign', 'Pilgrim']),
  q('H06', 'Pamplemousse, agrumes et résine pour une West Coast IPA', ['Centennial', 'Cascade', 'Amarillo', 'Simcoe', 'Chinook', 'Columbus', 'Citra', 'Summit', 'Ahtanum']),
  q('H07', 'Noix de coco et notes inhabituelles, aneth et citron', ['Sorachi Ace', 'Sabro']),
  q('H08', 'Melon, fruits blancs et pêche pour un blond sec et léger', ['Huell Melon', 'Hallertau Blanc', 'Mandarina Bavaria', 'Melba', 'Callista', 'Ariana']),
  q('H09', 'Orange et mandarine douces, agrumes sucrés', ['Mandarina Bavaria', 'Amarillo', 'Citra', 'Cascade']),
  q('H10', 'Très citronné, zeste de citron vert', ['Lemondrop', 'Sorachi Ace', 'Citra', 'Cascade', 'Centennial']),
  q('H11', 'Double usage australien, fruits à noyau, pêche et abricot, fruit de la passion', ['Vic Secret', 'Galaxy', 'Ella', 'Topaz', 'Eclipse', 'Melba', 'Enigma']),
  q('H12', 'Houblon allemand pour une weizen, floral doux sans dominer', ['Hallertau Mittelfrüh', 'Tettnanger', 'Perle (GR)', 'Spalter Select', 'Hersbrucker', 'Saphir', 'Hallertau Tradition']),
  q('H13', 'Sapin, pin, résine, forte note de conifère', ['Chinook', 'Simcoe', 'Columbus', 'CTZ', 'Tomahawk', 'Zeus', 'Apollo'])
];
