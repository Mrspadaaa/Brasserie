// Les familles de la liste en bandes (p3c-3, D262c, D262d, D269, D271) : à quelle famille appartient une ligne d'achat.
// Pur : aucun React. Les mots de famille couvrent les quatre langues des factures (allemand, anglais, français ; italien par ses mots de base) ;
// la famille s'affiche toujours en français. La désignation imprimée, elle, ne se traduit jamais (D261a) : on lit le nom, on ne le réécrit pas.
// Aucun nom de pièce ici (L20) : des marques du métier, des termes du métier, des préfixes et suffixes de mots composés allemands.
//
// Source de la famille, dans l'ordre :
//   1. l'article de stock rattaché (sa catégorie est ce que le stock gardera), puis la catégorie lue sur la ligne (`stockCategory`, normalisée par
//      `canonicalStockCategory` : « Yeast », « Hefe » → « Levure ») ; une catégorie d'ingrédient ne capture jamais une ligne que la lecture dit
//      matériel, emballage, nettoyage, entretien ou service (un « Hop Filter Bag » n'est pas un houblon) ; une catégorie lue « Consommable » ou « EPI »
//      (jamais celle d'un article rattaché) cède aux travaux ;
//   2. D306 — les travaux du local. Le port et la remise ne changent pas. Un détartrant, un déboucheur : Nettoyage, sous toute catégorie. Un mot SANS
//      ÉQUIVOQUE des travaux (peinture, cheville, carrelage…) : Rénovation sous toute catégorie, sauf un mot de nettoyage ou un mot précis du brassage
//      (cuve, fermenteur, spider… : il reste Matériel, même sous `renovation`). Un mot AMBIGU (robinet, tuyau, joint, brosse, seau, gant, masque, ruban…) : Rénovation
//      seulement quand la catégorie de la dépense (« Pour quoi ? ») vaut `renovation`, sa famille d'avant ailleurs. Sous `renovation`, toute autre ligne
//      sans mot d'ingrédient, d'emballage, de nettoyage ni de service est en Rénovation ;
//   3. le `kind` de la lecture : equipment/maintenance → Matériel de brassage, packaging → Emballage, cleaning → Nettoyage, service → Services ;
//   4. les mots du nom : le matériel d'abord (« Hop Spider Bag » n'est pas du houblon), puis l'emballage et le nettoyage, puis le contexte que
//      `contexteDe` a lu (Malt, Houblon, Levure), puis les listes de ce fichier ;
//   5. « Autres » ne reçoit que l'inclassable (et le port ou la remise qui resteraient en ligne).
import { canonicalStockCategory, STOCK_CATEGORIES } from '../../services/stockLineMatching';
import { hasHopWord } from '../../services/ingredientIdentity';
import { NOMS_HOUBLONS_COMPOSES, NOMS_HOUBLONS_SIMPLES } from './nomsHoublons';

export type FamilleCle = 'malt' | 'houblon' | 'levure' | 'sucre' | 'additif' | 'materiel' | 'emballage' | 'nettoyage' | 'consommable' | 'renovation' | 'service' | 'autres';

/** L'ordre d'affichage des bandes (D262c ; D306 : Rénovation après Consommables). */
export const ORDRE_FAMILLES: readonly FamilleCle[] = ['malt', 'houblon', 'levure', 'sucre', 'additif', 'materiel', 'emballage', 'nettoyage', 'consommable', 'renovation', 'service', 'autres'];
export const NOMS_FAMILLES: Record<FamilleCle, string> = {
  malt: 'Malts', houblon: 'Houblons', levure: 'Levures', sucre: 'Sucres', additif: 'Additifs', materiel: 'Matériel de brassage', emballage: 'Emballage',
  nettoyage: 'Nettoyage', consommable: 'Consommables', renovation: 'Rénovation', service: 'Services', autres: 'Autres',
};

/** Casse, accents et ß pliés : « Gärtank » → « gartank », « Château » → « chateau ». */
export const plier = (texte: string): string =>
  texte.normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase().replace(/ß/g, 'ss').replace(/æ/g, 'ae').replace(/œ/g, 'oe');

/** La catégorie de stock (déjà canonique) → sa famille ; `undefined` pour une catégorie hors de la liste (« Divers »). */
const FAMILLE_DE_CATEGORIE: Record<string, FamilleCle> = {
  Malt: 'malt', Houblon: 'houblon', Levure: 'levure', Sucre: 'sucre', Additif: 'additif', Emballage: 'emballage',
  'CIP alcalin': 'nettoyage', 'CIP acide': 'nettoyage', Désinfectant: 'nettoyage', Détergent: 'nettoyage', Sols: 'nettoyage', EPI: 'consommable', Consommable: 'consommable',
};
export function familleDeCategorie(categorie: string | undefined): FamilleCle | undefined {
  if (!categorie || !categorie.trim()) return undefined;
  const canonique = canonicalStockCategory(categorie);
  return STOCK_CATEGORIES.includes(canonique) ? FAMILLE_DE_CATEGORIE[canonique] : undefined;
}

// ——— Les mots du métier. Jetons pliés, exacts, sauf les listes de suffixes (mots composés allemands) et de préfixes. ———
const liste = (mots: string): ReadonlySet<string> => new Set(mots.split(/\s+/).filter(Boolean));

/** Matériel de brassage : cuves, fermenteurs, soupapes, tuyaux, sondes, refroidisseurs, filtres à houblon. */
const MATERIEL = liste(`
  fermenteur fermenteurs fermenter fermenters fermentatore fermentatori fermzilla unitank cuve cuves cuvier marmite marmites pentola kessel kettle kettles brewkettle
  tank tanks serbatoio keg kegs fut futs fass fusto fusti fermentationsbehalter
  spundventil spunding ventil ventile valve valves valvola vanne vannes robinet robinets hahn rubinetto faucet
  schlauch schlauche tuyau tuyaux hose hoses tubo tubi pumpe pumpen pump pumps pompe pompes pompa
  thermometre thermometres thermometer thermometers termometro refractometre refraktometer refractometer rifrattometro densimetre hydrometre hydrometer spindel densimetro areometro
  plattenkuhler warmetauscher kuhler chiller refroidisseur serpentin scambiatore
  maischebottich brauanlage anlage spider hopfensack hopsack hopbag hopfenseiher
  gasspund garspund gaerspund airlock blowoff triclamp clamp dichtung joint joints guarnizione
  manometer manometre manometro regulateur regler druckminderer bonbonne demijohn
  trichter entonnoir funnel paddle muhle moulin mulino waage bilancia
`);
/** Suffixes de mots composés (allemand surtout) : « Plattenkühler », « Gärtank », « Hopfensack ». Le jeton doit être plus long que le suffixe. */
const MATERIEL_SUFFIXES = ['sack', 'tank', 'kessel', 'ventil', 'schlauch', 'kuhler', 'thermometer', 'refraktometer', 'spindel', 'pumpe', 'bottich', 'behalter', 'fass', 'anlage'];
/** « Hop Filter Bag » : un sac ou un filtre, avec un mot qui dit qu'il sert au houblon ou à la filtration ; un « Beutel » seul est un emballage de houblon. */
const SACS = liste('bag bags sack sacks sac sacs beutel sacco sacchi');
const FILTRES = liste('filter filtre filtres filtro filtri spider mesh nylon muslin mousseline voile');

const EMBALLAGE = liste(`
  kronkorken kronenkorken kapsel kapseln capsule capsules capsula kapselverschluss tappi tappo corona bouchon bouchons korken kork stopper
  flasche flaschen bouteille bouteilles bottle bottles bottiglia bottiglie verschluss bugelverschluss
  etikett etiketten etikette etiquette etiquettes label labels etichetta etichette
  karton kartons carton cartons cartone kasten kiste caisse caisses crate crates cassa cassetta canette canettes dosen
  emballage emballages verpackung verpackungen packaging imballaggio imballaggi
`);
const NETTOYAGE = liste(`
  chemipro starsan saniclean iodophor iodophore pbw oxi oxyclean percarbonate percarbonat perkarbonat soude natronlauge lauge caustique lessive lessives
  nettoyant nettoyants nettoyage reiniger reinigung reinigungsmittel cleaner cleaners cleaning detergent detergents detergente detergenti detersivo detersivi
  desinfectant desinfectants desinfektion desinfektionsmittel disinfectant disinfectants disinfettante disinfettanti sanitizer sanitizers sanitiser sanitising sanitizing
  sanificante igienizzante peracetic peressigsaure peracetique javel hypochlorite cip brewclean bleach caustic
`);
const NETTOYAGE_PREFIXES = ['sanitiz', 'sanitis', 'sanific', 'igieniz', 'desinfe', 'disinfe', 'reinig', 'nettoy', 'detergen', 'detersiv', 'percarbon', 'perkarbon', 'peressig', 'peracet'];

/** Additifs de brassage : clarifiants, sels de l'eau, acides, nutriments, enzymes. */
const ADDITIF_FORT = liste('nutriment nutriments nutrient nutrients nahrsalz hefenahrsalz fermaid servomyces');
const ADDITIF = liste(`
  whirlfloc whirfloc protafloc irischmoos moss moos cacl2 cacl caso4 mgso4 nahco3 nacl h3po4 caco3 chlorure chlorid chloride cloruro gypse gips gypsum gesso
  sulfate sulfat sulphate solfato bicarbonate bicarbonat bikarbonat bicarbonato epsom bittersalz
  finings clarifiant clarificant chiarificante klarungsmittel klarmittel isinglass gelatine gelatina polyclar pvpp kieselsol biofine brewtan
  enzyme enzymes enzym enzima amylase amyloglucosidase glucoamylase pectinase campden metabisulfite metabisulfit sulfit
  lactique lactic milchsaure lattico phosphorique phosphoric phosphorsaure fosforico calcium calcio sel salz salt
`);
const ADDITIF_SUFFIXES = ['salz'];

const SUCRE = liste(`
  candi kandis kandi sirop sirops syrup syrups sirup sciroppo sucre sucres zucker sugar zucchero dextrose traubenzucker glucose glukose glucosio
  saccharose sucrose saccarosio miel honig honey miele lactose laktose lattosio maltodextrine maltodextrin maltodestrina melasse molasses melassa invertzucker agave
`);
const SUCRE_SUFFIXES = ['zucker', 'sirup', 'syrup', 'dicksaft'];

/** Marques et termes de levure (en plus de ce que `contexteDe` lit déjà : levure, hefe, yeast, catalogue de souches). */
const LEVURE = liste(`
  lievito lieviti levedura hefen brauhefe trockenhefe wyeast lallemand lalbrew fermentis safale saflager safbrew safcider safspirit mangrove
  nottingham windsor verdant voss kveik oyl omega whitelabs wlp
`);
/** Codes de souche imprimés (Fermentis, Mangrove Jack's, Imperial, Wyeast, White Labs). */
const CODES_LEVURE = [
  /\b(us|s|t|w|be|k|wb|bry)[ -]?\d{2,3}(\/\d{2})?\b/, /\bm(10|15|20|29|36|42|44|54|84)\b/, /\bwy ?\d{4}\b/, /\bwlp ?\d{3}\b/, /\boyl[ -]?\d{2,3}\b/, /\bimperial [a-z]\d{2}\b/,
  /\bwhite labs\b/, /\borganic yeast\b/,
];

/** Malts : marques de malteries, familles de malts, céréales (flocons compris), mots composés en -malz / -malt. */
const MALT = liste(`
  malt malts malz malze malto malti getreide cereale cereales cereal cereals cereali grain grains weyermann chateau dingemans bestmalz briess muntons simpsons crisp fawcett swaen gambrinus avangard
  pilsner pilsen pils munich munchner wiener vienna vienne melanoidin melanoidine aromatic biscuit sauermalz
  carafa carahell caramunich carapils carared carafoam carabelge carabrown caraamber caraaroma carabohemian caramel crystal dme lme
  flocons flocken flakes flaked flocchi fiocchi
`);
const MALT_SUFFIXES = ['malz', 'malt', 'flocken', 'flakes'];
// « malzextrakt » : l'extrait de malt (Malzextraktpulver, Malzextrakt flüssig) ; DME / LME : dry et liquid malt extract.
const MALT_PREFIXES = ['carahell', 'caramun', 'carapil', 'carared', 'carafoam', 'carabel', 'carabrown', 'caraamber', 'caraaroma', 'carafa', 'malzextrakt'];
const MALT_PHRASES = [' pale ale ', ' maris otter ', ' golden promise ', ' special b ', ' castle malting ', ' extrait de malt ', ' estratto di malto '];

const HOUBLON = liste('hop hops houblon houblons hopfen luppolo luppoli pellet pellets t90 t45 cryo lupomax dolden doldenhopfen');

/** EPI et consommables : gants, lunettes, tabliers, brosses, éponges, bandelettes de pH. */
const CONSOMMABLE = liste(`
  gant gants handschuh handschuhe gloves guanti lunettes schutzbrille brille goggles occhiali masque masques maske mask mascherina tablier schurze apron grembiule
  bottes stiefel boots stivali chiffon chiffons lappen tuch tucher teststreifen bandelette bandelettes klebeband adhesif tape nastro
  brosse burste brush spazzola eponge schwamm sponge spugna verbrauchsmaterial consommable consommables consumable consumables epi ppe dpi
`);
const SERVICE = liste('abonnement subscription dienstleistung servizio analyse analysis analisi miete location rental noleggio');

const finit = (t: string, suffixes: readonly string[]) => suffixes.some(s => t.length > s.length && t.endsWith(s));
const commence = (t: string, prefixes: readonly string[]) => prefixes.some(p => t.startsWith(p));

/** Les jetons d'un nom : pliés, séparés sur tout ce qui n'est ni lettre ni chiffre. */
export const jetons = (nom: string): string[] => plier(nom).split(/[^a-z0-9]+/).filter(Boolean);

export function estMateriel(nom: string): boolean {
  const t = jetons(nom);
  if (t.some(j => MATERIEL.has(j) || finit(j, MATERIEL_SUFFIXES))) return true;
  if (t.some(j => SACS.has(j)) && t.some(j => FILTRES.has(j))) return true;
  return ` ${t.join(' ')} `.includes(' uni tank ');
}
const estEmballage = (t: string[]) => t.some(j => EMBALLAGE.has(j));
const estNettoyage = (t: string[], joint: string) => t.some(j => NETTOYAGE.has(j) || commence(j, NETTOYAGE_PREFIXES)) || joint.includes(' star san ');
const estLevure = (t: string[], joint: string) => t.some(j => LEVURE.has(j) || finit(j, ['hefe'])) || CODES_LEVURE.some(re => re.test(joint.trim()));
const estMalt = (t: string[], joint: string) =>
  t.some(j => MALT.has(j) || CEREALS_PLIES.has(j) || finit(j, MALT_SUFFIXES) || commence(j, MALT_PREFIXES)) || MALT_PHRASES.some(p => joint.includes(p));
const estSucre = (t: string[]) => t.some(j => SUCRE.has(j) || finit(j, SUCRE_SUFFIXES));
const estAdditif = (t: string[]) => t.some(j => ADDITIF.has(j) || finit(j, ADDITIF_SUFFIXES));
const CEREALS_PLIES: ReadonlySet<string> = liste('avoine hafer oat oats froment ble wheat weizen orge gerste barley seigle roggen rye epeautre dinkel spelt sarrasin buchweizen buckwheat millet hirse sorgho sorghum triticale mais riz reis rice kamut corn');

/**
 * Un nom complet de houblon du catalogue de l'app, lu comme suite de jetons (« El Dorado® 11.7% », « Barbe Rouge 8.6% ») : `hasHopWord` ne voit que le
 * premier mot d'un nom (4 lettres au moins), qui ne dit rien de « El » ni de « Barbe ». Un nom de plusieurs mots se reconnaît seul ; un nom d'un seul mot
 * (« Bergamot ») demande son α imprimé en plus. Un « % » seul ne fait jamais un houblon (Milchsäure 80 %).
 */
const ALPHA_IMPRIME = /\d(?:[.,]\d+)?\s*%/;
export function estNomHoublon(nom: string, t: string[] = jetons(nom)): boolean {
  for (let n = 2; n <= 4; n++) for (let i = 0; i + n <= t.length; i++) if (NOMS_HOUBLONS_COMPOSES.has(t.slice(i, i + n).join(' '))) return true;
  return ALPHA_IMPRIME.test(plier(nom)) && t.some(j => NOMS_HOUBLONS_SIMPLES.has(j));
}

// ——— D306 : les travaux du local. Termes génériques en quatre langues (D271), aucune désignation d'une pièce (L20). ———
export type SousFamilleRenovation = 'Peinture et sols' | 'Outillage' | 'Quincaillerie' | 'Électricité' | 'Plomberie' | 'Protection' | 'Divers travaux';
/** L'ordre d'affichage des sous-familles de la Rénovation (D306). */
export const SOUS_FAMILLES_RENOVATION: readonly SousFamilleRenovation[] = ['Peinture et sols', 'Outillage', 'Quincaillerie', 'Électricité', 'Plomberie', 'Protection', 'Divers travaux'];
type SousMots = Exclude<SousFamilleRenovation, 'Divers travaux'>;
/** Mots pliés exacts, débuts et fins de mots composés (allemand), phrases pliées (le nom entier est entouré d'espaces). */
interface Mots { mots: ReadonlySet<string>; tous: readonly string[]; debuts?: readonly string[]; fins?: readonly string[]; phrases?: readonly string[] }
const m = (mots: string, extra: Omit<Mots, 'mots' | 'tous'> = {}): Mots => { const l = liste(mots); return { mots: l, tous: [...l], ...extra }; };
/** Dans quel ordre on cherche la sous-famille : la Protection d'abord (« gants de peintre »), puis du plus précis au plus large. */
const LECTURE: readonly SousMots[] = ['Protection', 'Électricité', 'Plomberie', 'Quincaillerie', 'Outillage', 'Peinture et sols'];

/** Mots SANS ÉQUIVOQUE des travaux : Rénovation sous toute catégorie de dépense. Aucun ne se lit dans une recette ni sur une cuve. */
const TRAVAUX_SUR: Record<Exclude<SousMots, 'Protection'>, Mots> = {
  'Peinture et sols': m(`
    peinture peintures peintre peintres vernis vitrificateur vitrificateurs lasure lasures enduit enduits platre platres mastic mastics silicone silicones appret primaire pinceau pinceaux
    manchon manchons carrelage carrelages ciment betons beton parquet parquets lino linoleum stratifie moquette faience diluant diluants decapant masquage
    farbe farben wandfarbe deckenfarbe holzfarbe fassadenfarbe lack lacke klarlack holzlack parkettlack buntlack lasur lasuren grundierung tiefengrund spachtelmasse putz verputz kitt
    dichtmasse silikon acryl pinsel malerpinsel farbrolle farbroller farbwanne abdeckband malerkrepp abdeckfolie abdeckplane abdeckvlies fliese fliesen fliesenkleber fugenmasse
    fugenmortel zement mortel parkett laminat bodenbelag teppichboden verdunner
    paint paints primer varnish plaster putty sealant caulk grout tile tiles cement concrete screed paintbrush paintbrushes masking laminate flooring undercoat
    vernice vernici pittura pitture smalto stucco intonaco sigillante mastice pennello pennelli piastrella piastrelle cemento calcestruzzo fissativo diluente mascheratura`,
    { debuts: ['maler'], phrases: [' rouleau a peinture ', ' rouleaux a peinture ', ' bac a peinture ', ' bacs a peinture ', ' sous couche ', ' produit pour sol ', ' produits pour sol ', ' colle a carrelage ',
      ' ruban de masquage ', ' ruban masquage ', ' paint roller ', ' paint tray ', ' masking tape ', ' rullo per pittura ', ' nastro carta ', ' nastro per mascheratura '] }),
  Outillage: m(`
    ponceuse ponceuses abrasif abrasifs outil outils outillage marteau marteaux tournevis perceuse perceuses meuleuse visseuse cutter cutters spatule spatules truelle truelles
    scie scies escabeau echelle echelles rabot tenaille tenailles
    schleifmaschine schleifpapier schleifschwamm schleifblock schleifklotz hammer schraubendreher schraubenzieher bohrmaschine akkuschrauber bohrer sageblatt handsage spachtel
    wasserwaage zollstock cuttermesser leiter trittleiter werkzeug werkzeuge zange zangen
    sander sandpaper screwdriver screwdrivers drill saw spatula trowel pliers wrench ladder tool tools toolbox
    levigatrice martello cacciavite trapano sega spatola cazzuola utensili utensile
    grattoir grattoirs racloir racloirs raclette schaber spachtelklinge scraper scrapers raschietto raschietti abrasive farbmischer farbruhrer`,
    { debuts: ['schleif'], phrases: [' turbine a peinture ', ' turbine peinture ', ' paint mixer ', ' melangeur a peinture ', ' melangeur peinture ', ' malaxeur a peinture ', ' ruhrer fur farbe ', ' miscelatore per vernici ', ' miscelatore vernice ', ' papier de verre ', ' papier abrasif ', ' niveau a bulle ', ' carta vetrata ', ' carta abrasiva ', ' cle a molette '] }),
  Quincaillerie: m(`
    cheville chevilles boulon boulons ecrou ecrous rondelle rondelles agrafe agrafes charniere charnieres equerre equerres serrure serrures poignee poignees verrou verrous visserie quincaillerie
    dubel schraube schrauben holzschraube holzschrauben spanplattenschraube spanplattenschrauben scharnier scharniere nagel beschlag eisenwaren unterlagscheibe beilagscheibe
    bolt bolts nail nails hinge hinges woodscrew wallplug tassello tasselli viti bullone bulloni chiodo chiodi cerniera cerniere ferramenta`,
    { debuts: ['holzschraub'], phrases: [' vis a bois ', ' vis a metaux ', ' vis a placo ', ' wood screw ', ' wood screws ', ' viti per legno '] }),
  Électricité: m(`
    interrupteur interrupteurs disjoncteur disjoncteurs ampoule ampoules luminaire luminaires multiprise multiprises rallonge rallonges douille douilles electricite electricien gaine gaines
    schalter lichtschalter steckdose steckdosen sicherung sicherungen gluhbirne gluhbirnen leuchte leuchten elektroinstallation elektriker bulb bulbs electrician electrical
    interruttore interruttori lampadina lampadine elettricista guaina guaine`,
    { phrases: [' prise de courant ', ' prise electrique ', ' prise murale ', ' fil electrique ', ' presa di corrente ', ' power outlet ', ' wall socket ', ' extension cord ', ' electrical tape '] }),
  Plomberie: m(`
    mitigeur mitigeurs sanitaire sanitaires lavabo lavabos evier eviers wc plomberie plombier teflon ptfe armatur armaturen abfluss wasserhahn waschbecken dichtungsband spulkasten sanitar
    plumbing plumber sanitary idraulico sifone sifoni lavandino rubinetteria`,
    { phrases: [' colle pvc ', ' ruban teflon ', ' ruban de teflon ', ' ruban ptfe '] }),
};
/**
 * Mots AMBIGUS : ils se lisent aussi dans une brasserie (un robinet de cuve, un tuyau, un gant, une brosse, un seau, du ruban). Rénovation seulement quand la catégorie
 * de la dépense (« Pour quoi ? ») vaut `renovation` ; ailleurs ces lignes gardent la famille d'avant (D306).
 */
const TRAVAUX_AMBIGUS: Record<SousMots, Mots> = {
  Protection: m(`
    gant gants handschuh handschuhe gloves guanti lunettes brille schutzbrille goggles occhiali masque masques maske mask mascherina combinaison combinaisons overall coverall
    schutzanzug schutzhandschuhe schutzmaske atemschutz gehorschutz tuta casque helm helmet casco genouilleres ffp2 ffp3 respirateur respirator epi ppe dpi tablier schurze apron
    grembiule bottes stiefel boots stivali
    protection protections protezione protege genouillere genouilleres knieschoner kniepolster kneepad kneepads ginocchiere ginocchiera`,
    { debuts: ['schutz'], phrases: [' protege genoux ', ' knee pad ', ' knee pads ', ' protege genou '] }),
  Électricité: m('cable cables kabel wire plug plugs socket switch prise prises stecker spina presa prese'),
  Plomberie: m(`
    robinet robinets hahn rubinetto faucet tuyau tuyaux tubo tubi schlauch schlauche hose hoses joint joints dichtung dichtungen guarnizione guarnizioni raccord raccords raccordo
    flexible flexibles pvc rohr rohre pipe pipes fitting fittings siphon siphons syphon vanne vannes ventil ventile valve valves valvola pompe pompes pumpe pumpen pump pumps pompa clamp`,
    { fins: ['schlauch', 'ventil', 'pumpe'] }),
  Quincaillerie: m('vis screw screws haken washer washers'),
  Outillage: m(`
    seau seaux eimer bucket buckets secchio secchi brosse brosses burste brush brushes spazzola spazzole eponge eponges schwamm sponge sponges spugna chiffon chiffons lappen tuch tucher
    pince pinces balai besen broom entonnoir trichter funnel
    melangeur melangeurs malaxeur malaxeurs turbine turbines ruhrer ruhrquirl ruhrwerk mixer mixers miscelatore miscelatori lame lames klinge klingen blade blades`),
  'Peinture et sols': m(`
    ruban rubans klebeband adhesif tape tapes nastro nastri rouleau rouleaux gips gypse gypsum gesso bache baches sols boden floor colle kleber glue colla`),
};
/** Un tuyau (de silicone) est du brassage : « silicone » ne suffit pas à le faire passer en Rénovation. */
const TUYAUX = liste('tuyau tuyaux schlauch schlauche hose hoses tubo tubi');
const SILICONES = liste('silicone silicones silikon');

/** Un ticket abrège (« vitrific. », « protect. ») : un jeton d'au moins 6 lettres qui est le début d'un mot de la liste compte comme ce mot. */
const abrege = (mots: Mots, j: string): boolean => j.length >= 6 && mots.tous.some(w => w.length > j.length && w.startsWith(j));
const lit = (mots: Mots, t: readonly string[], joint: string): boolean =>
  t.some(j => mots.mots.has(j) || abrege(mots, j) || (mots.debuts?.some(d => j.startsWith(d)) ?? false) || (mots.fins?.some(f => finit(j, [f])) ?? false)) || (mots.phrases?.some(p => joint.includes(p)) ?? false);
/** Les jetons qui comptent pour les travaux : sans « silicone » quand la ligne parle d'un tuyau ou d'un flexible. */
const jetonsTravaux = (t: readonly string[]): readonly string[] =>
  t.some(j => TUYAUX.has(j) || finit(j, ['schlauch'])) ? t.filter(j => !SILICONES.has(j)) : t;
const estTravauxSur = (t: readonly string[], joint: string): boolean => {
  const u = jetonsTravaux(t);
  return (Object.values(TRAVAUX_SUR) as Mots[]).some(mots => lit(mots, u, joint));
};
const estTravauxAmbigu = (t: readonly string[], joint: string): boolean => (Object.values(TRAVAUX_AMBIGUS) as Mots[]).some(mots => lit(mots, t, joint));
/** Un mot précis du brassage (cuve, fermenteur, spider…) : les termes ambigus de `MATERIEL` (robinet, tuyau, joint, vanne, pompe…) n'en font pas partie. */
const MATERIEL_AMBIGU = liste('robinet robinets hahn rubinetto faucet tuyau tuyaux tubo tubi schlauch schlauche hose hoses joint joints dichtung guarnizione vanne vannes ventil ventile valve valves valvola pompe pompes pumpe pumpen pump pumps pompa clamp trichter entonnoir funnel');
const SUFFIXES_AMBIGUS = ['schlauch', 'ventil', 'pumpe'];
const estMaterielPrecis = (t: readonly string[]): boolean =>
  t.some(j => (MATERIEL.has(j) && !MATERIEL_AMBIGU.has(j)) || (finit(j, MATERIEL_SUFFIXES) && !finit(j, SUFFIXES_AMBIGUS))) || (t.some(j => SACS.has(j)) && t.some(j => FILTRES.has(j))) || ` ${t.join(' ')} `.includes(' uni tank ');

/** Détartrant, anticalcaire, déboucheur : du Nettoyage sous toute catégorie (D306), en quatre langues. */
const DETARTRANT_DEBUTS = ['detartr', 'entkalk', 'descal', 'decalcific', 'anticalc', 'antikalk', 'deboucheur', 'deboucha', 'rohrreinig', 'abflussreinig', 'disgorg', 'unclog', 'kalkloser', 'kalkreinig'];
/** Marques de détartrants et de déboucheurs courantes en Suisse (jetons exacts). */
const DETARTRANT_MARQUES = liste('durgol kalkex antikal antikalk calgon viakal cilit drano destop rohrfrei abflussfrei kalkfrei');
const estDetartrant = (t: readonly string[], joint: string): boolean =>
  t.some(j => commence(j, DETARTRANT_DEBUTS) || DETARTRANT_MARQUES.has(j) || (j.length >= 6 && DETARTRANT_DEBUTS.some(d => d.startsWith(j)))) || [' drain cleaner ', ' drain opener ', ' limescale remover ', ' lime remover ', ' calc remover '].some(p => joint.includes(p));

export interface EntreeFamille {
  /** Le nom imprimé de la ligne (jamais traduit). */
  nom?: string;
  /** Le `kind` du brouillon (`ingredient`, `packaging`, `cleaning`, `equipment`, `maintenance`, `service`, `shipping`, `discount`, `other`) ou celui de la lecture (`stock`, `unknown`). */
  kind?: string;
  /** Ce que `contexteDe` a lu : `Malt`, `Houblon`, `Levure` ou `autre`. */
  contexte?: string;
  /** La catégorie de stock lue sur la ligne, telle que la lecture l'a écrite. */
  stockCategory?: string;
  /** La catégorie de l'article de stock rattaché à la ligne. */
  categorieArticle?: string;
  /** D306 : la catégorie de la dépense (« Pour quoi ? » : `brassage`, `materiel`, `renovation`…). Les termes ambigus des travaux n'entrent en Rénovation que sous `renovation`. */
  categorie?: string;
}

const KIND_FAMILLE: Record<string, FamilleCle> = { equipment: 'materiel', maintenance: 'materiel', packaging: 'emballage', cleaning: 'nettoyage', service: 'service', shipping: 'autres', discount: 'autres' };
/** Les familles d'ingrédient ne capturent pas une ligne dont la lecture dit qu'elle n'en est pas un. */
const FAMILLES_INGREDIENT: ReadonlySet<FamilleCle> = new Set<FamilleCle>(['malt', 'houblon', 'levure', 'sucre', 'additif']);
/** D328a : une famille d'ingrédient de brassage (malt, houblon, levure, sucre, additif) : ses règles d'unité ne changent pas. */
export const estFamilleIngredient = (famille: FamilleCle): boolean => FAMILLES_INGREDIENT.has(famille);
/**
 * D328c : la famille a-t-elle une catégorie de stock (`STOCK_CATEGORIES`) ? Malt, houblon, levure, sucre, additif, emballage, nettoyage (CIP, désinfectant, détergent, sols)
 * et consommable (EPI) en ont une ; matériel, rénovation, services et « Autres » n'en ont pas : leurs lignes n'entrent jamais en stock. Lu dans la table des catégories.
 */
export const familleAUnStock = (famille: FamilleCle): boolean => Object.values(FAMILLE_DE_CATEGORIE).includes(famille);
/**
 * s1 (09.11, « pas besoin d'avoir tout mes outils et autres, juste ce qui concerne vraiment le brassage, donc pas rénovation ») : une famille dont on SAIT qu'elle n'est pas du brassage
 * (rénovation, services) ne montre aucune icône de stock sur ses lignes. Matériel de brassage et « Autres » (inclassable : l'appartenance est inconnue) gardent l'icône : comportement actuel, prudent.
 */
export const FAMILLES_HORS_BRASSAGE: ReadonlySet<FamilleCle> = new Set<FamilleCle>(['renovation', 'service']);
export const familleHorsBrassage = (famille: FamilleCle): boolean => FAMILLES_HORS_BRASSAGE.has(famille);
/**
 * D328c : la nature (`kind` du brouillon) que prend une ligne lue « stock » dont la famille n'est pas un ingrédient : nettoyage et consommable → `cleaning`, emballage →
 * `packaging` (ces natures entrent en stock : un article déjà là se relie), matériel → `equipment`, services → `service`, « Autres » → `other` (rien en stock). La Rénovation garde
 * `equipment` (D306, acquis : « Matériel » au sélecteur, ses tests) ; `other` si le brasseur le préfère : une seule ligne ici.
 * Absent pour un ingrédient : la nature « ingredient » reste celle de la lecture.
 */
export const NATURE_DE_FAMILLE: Partial<Record<FamilleCle, 'cleaning' | 'packaging' | 'equipment' | 'service' | 'other'>> = {
  nettoyage: 'cleaning', consommable: 'cleaning', emballage: 'packaging', materiel: 'equipment', service: 'service', renovation: 'equipment', autres: 'other',
};
const KINDS_HORS_INGREDIENT: ReadonlySet<string> = new Set(['equipment', 'maintenance', 'service', 'packaging', 'cleaning', 'shipping', 'discount']);

export function familleDe(e: EntreeFamille): FamilleCle {
  const kind = typeof e.kind === 'string' ? e.kind : '';
  const horsIngredient = KINDS_HORS_INGREDIENT.has(kind);
  const renov = e.categorie === 'renovation';
  const nom = typeof e.nom === 'string' ? e.nom : '';
  const t = jetons(nom), joint = ` ${t.join(' ')} `;
  const detartrant = estDetartrant(t, joint), sur = estTravauxSur(t, joint);
  // 1. La catégorie de stock : celle de l'article rattaché, sinon celle que la lecture a écrite. Une catégorie lue « Consommable » (jamais celle d'un article
  //    rattaché) cède au détartrant, aux travaux et à la catégorie `renovation`.
  const deArticle = familleDeCategorie(e.categorieArticle), parCategorie = deArticle ?? familleDeCategorie(e.stockCategory);
  if (parCategorie && !(horsIngredient && FAMILLES_INGREDIENT.has(parCategorie))) {
    const lueGenerique = !deArticle && parCategorie === 'consommable';
    if (!(lueGenerique && (renov || detartrant || sur))) return parCategorie;
  }
  // 2. D306. Le port et la remise ne changent pas.
  if (kind === 'shipping' || kind === 'discount') return 'autres';
  if (detartrant) return 'nettoyage';
  const mNettoyage = estNettoyage(t, joint);
  if (kind === 'service') return renov && !t.some(j => SERVICE.has(j)) ? 'renovation' : 'service';
  if (kind === 'packaging') return 'emballage';
  if (kind === 'cleaning') {
    // Un nettoyage peut être un consommable (gants) : les mots tranchent. Sous `renovation`, l'EPI et les travaux passent en Rénovation.
    if (!mNettoyage && (sur || (renov && estTravauxAmbigu(t, joint)))) return 'renovation';
    return t.some(j => CONSOMMABLE.has(j)) ? 'consommable' : 'nettoyage';
  }
  const motIngredient = () => ['Malt', 'Houblon', 'Levure'].includes(e.contexte ?? '') || t.some(j => ADDITIF_FORT.has(j)) || estAdditif(t) || estSucre(t) || estLevure(t, joint) || estMalt(t, joint)
    || hasHopWord(nom) || estNomHoublon(nom, t) || t.some(j => HOUBLON.has(j) || commence(j, ['hopfen']));
  if (renov) {
    // Un mot PRÉCIS du brassage (cuve, fermenteur, spider, sacs + filtres…) garde la main sous Local : « Hop Spider Bag » reste du Matériel.
    if (!estMaterielPrecis(t)) {
      if (!mNettoyage && (sur || estTravauxAmbigu(t, joint))) return 'renovation';
      if (!motIngredient() && !estEmballage(t) && !mNettoyage && !t.some(j => SERVICE.has(j))) return 'renovation';
    }
  } else if (sur && !mNettoyage && !estMaterielPrecis(t) && !t.some(j => TUYAUX.has(j) || finit(j, ['schlauch']))) return 'renovation';
  // 3. Le kind de la lecture : un nettoyage et un emballage sont déjà tranchés ci-dessus.
  if (kind && KIND_FAMILLE[kind]) return KIND_FAMILLE[kind];
  // 4. Les mots. Le matériel d'abord : « Hop Spider Bag » n'est pas du houblon.
  if (estMateriel(nom)) return 'materiel';
  if (estEmballage(t)) return 'emballage';
  if (estNettoyage(t, joint)) return 'nettoyage';
  if (t.some(j => ADDITIF_FORT.has(j))) return 'additif';
  if (e.contexte === 'Malt') return 'malt';
  if (e.contexte === 'Houblon') return 'houblon';
  if (e.contexte === 'Levure') return 'levure';
  if (estAdditif(t) && !estMalt(t, joint)) return 'additif';
  if (estSucre(t) && !estMalt(t, joint)) return 'sucre';
  if (estLevure(t, joint)) return 'levure';
  if (estMalt(t, joint)) return 'malt';
  // Une variété du catalogue de l'app (« Nelson Sauvin™ 9.6% » sans catégorie lue) : jamais un « % » seul (Milchsäure 80 %, Phosphorsäure 75 % sont des additifs, déjà passés).
  if (hasHopWord(nom) || estNomHoublon(nom, t) || t.some(j => HOUBLON.has(j) || commence(j, ['hopfen']))) return 'houblon';
  if (t.some(j => CONSOMMABLE.has(j))) return 'consommable';
  if (t.some(j => SERVICE.has(j))) return 'service';
  return 'autres';
}

/**
 * La catégorie de STOCK d'un article neuf de cette famille (D273d : une seule décision pour la bande à l'écran et pour l'article créé).
 * Toujours une catégorie de `STOCK_CATEGORIES`, sauf « Divers » quand la famille est « Autres ». Pour le nettoyage, la sous-famille se lit
 * dans le nom (désinfectant, soude/CIP, détergent) ; sans mot, « Consommable ». Le matériel et les services n'entrent pas en stock
 * (la validation les refuse) : s'ils arrivaient ici, « Consommable » vaut mieux que « Divers ».
 */
export function categorieDeFamille(famille: FamilleCle, nom = ''): string {
  switch (famille) {
    case 'malt': return 'Malt';
    case 'houblon': return 'Houblon';
    case 'levure': return 'Levure';
    case 'sucre': return 'Sucre';
    case 'additif': return 'Additif';
    case 'emballage': return 'Emballage';
    case 'nettoyage': {
      const joint = ` ${jetons(nom).join(' ')} `;
      const t = jetons(nom);
      if (t.some(j => commence(j, ['desinfe', 'disinfe', 'sanitiz', 'sanitis', 'sanific', 'igieniz', 'iodophor', 'javel', 'hypochlorite'])) || joint.includes(' star san ') || t.includes('starsan') || t.includes('saniclean')) return 'Désinfectant';
      if (t.some(j => ['soude', 'natronlauge', 'lauge', 'caustique', 'caustic', 'cip'].includes(j))) return 'CIP alcalin';
      if (t.some(j => commence(j, ['detergen', 'detersiv', 'reinig', 'nettoy', 'percarbon', 'perkarbon', ...DETARTRANT_DEBUTS]) || DETARTRANT_MARQUES.has(j) || ['chemipro', 'pbw', 'oxi', 'oxyclean', 'lessive', 'cleaner'].includes(j))) return 'Détergent';
      return 'Consommable';
    }
    // Une ligne de Rénovation n'entre jamais en stock (D306) ; « Consommable » vaut mieux que « Divers » si elle arrivait ici.
    case 'materiel': case 'consommable': case 'service': case 'renovation': return 'Consommable';
    default: return 'Divers';
  }
}

/**
 * D306 : la sous-famille d'une ligne. Pour la Rénovation, une de `SOUS_FAMILLES_RENOVATION` (Protection d'abord, puis du plus précis au plus large ; un mot sans
 * équivoque l'emporte sur un mot ambigu ; « Divers travaux » quand aucun mot n'est reconnu). Pour les autres familles, la sous-famille qui existe déjà : la
 * catégorie de stock de l'article rattaché ou lue sur la ligne (celle de `STOCK_CATEGORIES` qui va dans cette famille), et pour Nettoyage et Consommables
 * `categorieDeFamille` ; sinon `undefined`. Pure, et non affichée dans l'app : l'affichage est un choix à lui (voie r2).
 */
export function sousFamilleDe(famille: FamilleCle, e: EntreeFamille): string | undefined {
  const nom = typeof e.nom === 'string' ? e.nom : '';
  const lue = [e.categorieArticle, e.stockCategory].map(c => (c && c.trim() ? canonicalStockCategory(c) : undefined)).find(c => c !== undefined && STOCK_CATEGORIES.includes(c) && FAMILLE_DE_CATEGORIE[c] === famille);
  if (famille === 'renovation') {
    if ([e.categorieArticle, e.stockCategory].some(c => c && c.trim() && canonicalStockCategory(c) === 'EPI')) return 'Protection';
    const t = jetons(nom), joint = ` ${t.join(' ')} `, u = jetonsTravaux(t);
    if (lit(TRAVAUX_AMBIGUS.Protection, t, joint)) return 'Protection';
    for (const sous of LECTURE) if (sous !== 'Protection' && lit(TRAVAUX_SUR[sous], u, joint)) return sous;
    for (const sous of LECTURE) if (lit(TRAVAUX_AMBIGUS[sous], t, joint)) return sous;
    return 'Divers travaux';
  }
  if (famille === 'nettoyage' || famille === 'consommable') return lue ?? categorieDeFamille(famille, nom);
  return lue;
}
