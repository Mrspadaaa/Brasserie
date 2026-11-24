/**
 * Libellés des caractéristiques d'un lien, en français (T25-8, T26-1 ; 23.11 soir).
 *
 * Les boutiques suisses et allemandes publient « Nutzvolumen Gesamt », « Kühlschranktyp », « Höhe » : le brasseur lit du français, et
 * la colonne « Volume » de son carnet ne reconnaît pas « Nutzvolumen Gesamt » (liste : Volume « – » alors que la page dit 242 l).
 *
 * Méthode : une table de clés connues (normalisées : sans accents, minuscules, « ß » en « ss »), jamais une traduction automatique
 * qui inventerait un mot. Un nom absent de la table reste tel que la page l'écrit. La valeur n'est jamais touchée. Le nom garde son
 * unité (« Breite in mm » devient « Largeur en mm », « [Liter] » devient « [Litres] »).
 * La consigne de l'IA (`lienIA.ts`) demande aussi des noms français : la table rattrape ce qui reste en allemand ou en anglais.
 *
 * Une longueur de câble n'est jamais une dimension : « Kabellänge » devient « Longueur du câble », jamais « Longueur ».
 */

import { nomEtUnite, nombreSeul, valeurFrancaise } from './lienValeurs.js';

export interface Valeur { nom: string; valeur: string; unite?: string }

const cle = (t: string) => t.normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase().replace(/ß/g, 'ss')
  .replace(/[‎‏  \s]+/g, ' ').trim();

/** [clés normalisées, libellé français]. Ordre sans importance : la clé est cherchée en entier. */
const TABLE: ReadonlyArray<readonly [readonly string[], string]> = [
  // Volumes : « Volume » seul quand la page donne LE volume de l'appareil ; le reste garde sa précision.
  [['nutzvolumen gesamt', 'nutzvolumen', 'nutzinhalt', 'volumen', 'volume utile total', 'volume utile', 'usable volume', 'total usable volume', 'volume'], 'Volume'],
  [['kuhlvolumen', 'volume de refrigeration'], 'Volume de réfrigération'],
  [['nutzvolumen kuhlteil', 'nutzinhalt kuhlen', 'volume utile du refrigerateur'], 'Volume utile réfrigérateur'],
  [['nutzvolumen gefrierteil', 'nutzinhalt gefrieren', 'volume utile du congelateur'], 'Volume utile congélateur'],
  [['nettovolumen', 'net volume'], 'Volume net'],
  [['bruttovolumen', 'gross volume'], 'Volume brut'],
  [['nenninhalt', 'nennvolumen'], 'Volume nominal'],
  [['fassungsvermogen', 'kapazitat', 'capacity'], 'Capacité'],
  [['inhalt'], 'Contenu'],
  // Dimensions
  [['breite', 'width'], 'Largeur'],
  [['hohe', 'height'], 'Hauteur'],
  [['tiefe', 'depth'], 'Profondeur'],
  [['lange', 'length'], 'Longueur'],
  [['durchmesser', 'diameter'], 'Diamètre'],
  [['innendurchmesser'], 'Diamètre intérieur'],
  [['innenhohe'], 'Hauteur intérieure'],
  [['turbreite'], 'Largeur de porte'],
  [['turhohe'], 'Hauteur de porte'],
  [['aussenmasse', 'aussenmasse (bxtxh)', 'produktmasse (bxtxh)', 'produktmasse', 'produktabmessungen'], 'Dimensions extérieures'],
  [['masse innenraum (bxtxh)', 'innenmasse'], 'Dimensions intérieures'],
  [['abmessungen', 'masse', 'dimensions'], 'Dimensions'],
  [['l x h x t', 'lxhxt', 'l×h×t'], 'L × H × P'],
  [['kabellange', 'kabellaenge', 'cable length'], 'Longueur du câble'],
  [['wandstarke'], 'Épaisseur de paroi'],
  [['materialstarke'], 'Épaisseur du matériau'],
  [['isolierungsdicke', 'isolierstarke', 'isolierungsdichte'], 'Épaisseur d\'isolation'],
  [['bodenstarke'], 'Épaisseur du fond'],
  // Poids
  [['gewicht', 'weight', 'produktgewicht'], 'Poids'],
  [['netto gewicht', 'nettogewicht', 'net weight'], 'Poids net'],
  [['bruttogewicht', 'gross weight'], 'Poids brut'],
  [['artikelgewicht'], 'Poids de l\'article'],
  [['versandgewicht', 'shipping weight'], 'Poids d\'expédition'],
  // Électricité, énergie
  [['leistung', 'power', 'wattage'], 'Puissance'],
  [['spannung', 'eingangsspannung', 'netzspannung', 'anschluss', 'stromanschluss', 'voltage'], 'Tension'],
  [['leistung / anschluss'], 'Puissance / raccordement'],
  [['energieeffizienzklasse'], 'Classe d\'efficacité énergétique'],
  [['jahrlicher energieverbrauch (kwh/a)', 'stromverbrauch pro jahr'], 'Consommation annuelle'],
  [['energieverbrauch'], 'Consommation d\'énergie'],
  [['geruschpegel (max.)', 'gerauschpegel (max.)', 'geruschpegel', 'gerauschpegel'], 'Niveau sonore (max.)'],
  [['gerauschentwicklung in betrieb', 'geruschentwicklung in betrieb'], 'Niveau sonore en fonctionnement'],
  [['motor'], 'Moteur'],
  [['drehzahl'], 'Vitesse de rotation'],
  [['heizspirale'], 'Résistance chauffante'],
  [['pumpe'], 'Pompe'],
  // Froid
  [['kuhlschranktyp'], 'Type de réfrigérateur'],
  [['kuhlschrank merkmale'], 'Caractéristiques du réfrigérateur'],
  [['klimaklasse'], 'Classe climatique'],
  [['anzahl turen'], 'Nombre de portes'],
  [['turart'], 'Type de porte'],
  [['abschliessbar'], 'Verrouillable'],
  [['hohenverstellbar'], 'Réglable en hauteur'],
  [['zwischenboden hohenverstellbar'], 'Clayettes réglables en hauteur'],
  [['tragkraft pro regalboden'], 'Charge par clayette'],
  [['temperaturbereich'], 'Plage de température'],
  [['temperaturzonen'], 'Zones de température'],
  [['kuhlbereich'], 'Plage de réfrigération'],
  [['kuhlung', 'kuhlart'], 'Réfrigération'],
  [['kaltemittel-typ'], 'Type de réfrigérant'],
  [['kaltemittelmenge'], 'Quantité de réfrigérant'],
  [['nofrost-funktion'], 'NoFrost'],
  [['abtauverfahren kuhlung'], 'Dégivrage réfrigération'],
  [['temperatur von'], 'Température de'],
  [['temperatur bis'], 'Température jusqu\'à'],
  [['maximale umgebungstemperatur'], 'Température ambiante maximale'],
  [['betriebsart'], 'Mode de fonctionnement'],
  [['qualitatsstufe'], 'Niveau de qualité'],
  // Identité de l'article
  [['marke', 'brand'], 'Marque'],
  [['hersteller', 'manufacturer'], 'Fabricant'],
  [['kategorie', 'category'], 'Catégorie'],
  [['artikelnummer', 'artikel-nr.', 'art.nr.', 'artikel-nr', 'art.-nr.'], 'Numéro d\'article'],
  [['modellnummer'], 'Numéro de modèle'],
  [['farbe', 'color', 'colour'], 'Couleur'],
  [['farbe (ebc)'], 'Couleur (EBC)'],
  [['material', 'produktmaterial'], 'Matériau'],
  [['ausfuhrung/ausstattung'], 'Finition / équipement'],
  [['lieferzustand', 'delivered as'], 'État à la livraison'],
  [['versandart', 'shipping method'], 'Mode d\'expédition'],
  [['lieferzeit'], 'Délai de livraison'],
  [['verpackungsgrosse'], 'Taille de l\'emballage'],
  [['verpackungsabmessungen'], 'Dimensions de l\'emballage'],
  [['besonderheiten'], 'Particularités'],
  [['verwendung', 'einsatzbereich'], 'Usage'],
  [['bauart'], 'Construction'],
  [['ablasshahn unten'], 'Robinet de vidange en bas'],
  [['edelstahlhahn'], 'Robinet inox'],
  // Houblons, malts
  [['land der ernte'], 'Pays de récolte'],
  [['erntejahr'], 'Récolte'],
  [['hopfentyp'], 'Type de houblon'],
  [['hopfenform'], 'Forme'],
  [['alphasaure', 'alpha', 'alpha acid', 'alpha acids', 'alpha-acid'], 'Alpha'],
  [['betasaure', 'beta', 'beta acid', 'beta acids', 'beta-acid', 'bêta'], 'Bêta'],
  [['gesamtol', 'total oil', 'total oils', 'huiles totales', 'huile totale'], 'Huiles totales'],
  [['farnesene', 'farnesen'], 'Farnésène'],
  [['caryophyllene', 'caryophyllen'], 'Caryophyllène'],
  [['myrcene', 'myrcen'], 'Myrcène'],
  [['humulene', 'humulen'], 'Humulène'],
  [['linalool'], 'Linalol'],
  [['geraniol'], 'Géraniol'],
  [['cohumulone', 'cohumulon'], 'Cohumulone'],
  // Fermenteurs et cuves (fiches en anglais : Brouwland, Brewtools)
  [['full volume', 'total volume', 'gesamtvolumen', 'volume total'], 'Volume total'],
  [['fermentable volume', 'working volume', 'workable volume', 'volume de fermentation'], 'Volume de fermentation'],
  [['height with extension legs', 'height with legs extended'], 'Hauteur avec pieds d’extension'],
  [['height without extension legs', 'height without legs extended', 'height without legs'], 'Hauteur sans pieds d’extension'],
  [['top opening', 'opening at the top'], 'Ouverture supérieure'],
  [['dump valve size', 'size of dump valve', 'dump valve'], 'Taille de la vanne de vidange'],
  [['size of valve', 'valve size', 'size of the valve'], 'Taille de la vanne'],
  [['diameter at the top', 'top diameter'], 'Diamètre en haut'],
  [['wall thickness'], 'Épaisseur de paroi'],
  [['thread', 'gewinde'], 'Filetage'],
  [['connection', 'anschluss-typ'], 'Raccordement'],
  [['consommation energetique annuelle', 'energieverbrauch pro jahr', 'annual energy consumption'], 'Consommation annuelle'],
  [['herkunft', 'herkunft hopfen'], 'Origine'],
  [['pelletstyp'], 'Type de pellets'],
  [['malztyp', 'malzsorte'], 'Type de malt'],
  [['mindestbestellmenge'], 'Quantité minimale'],
  [['lagerbestand'], 'Stock du vendeur']
];

const INDEX = new Map<string, string>();
for (const [cles, libelle] of TABLE) for (const c of cles) if (!INDEX.has(c)) INDEX.set(c, libelle);

const UNITES_CROCHETS: Record<string, string> = { liter: 'Litres', litre: 'Litres', litres: 'Litres', l: 'l', mm: 'mm', cm: 'cm', kg: 'kg', g: 'g', kw: 'kW', w: 'W', volt: 'volts', 'kwh/a': 'kWh/an' };
const UNITES_EN: Record<string, string> = { mm: 'mm', cm: 'cm', m: 'm', kg: 'kg', g: 'g', volt: 'volt', kw: 'kW', w: 'W', 'c': '°C', '°c': '°C', l: 'l', liter: 'litres' };

/** Une clé technique de la page (« account_menu.signed_out_state.sheet_title », « openai_export ») n'est pas un libellé. */
export function cleTechnique(nom: string): boolean {
  return /^[a-z][a-z0-9]*(?:[._][a-z0-9]+)+$/.test(nom.trim());
}

/** Le libellé français d'une caractéristique ; un nom que la table ne connaît pas est rendu tel quel. */
export function libelleFrancais(nom: string): string {
  const brut = nom.replace(/[‎‏]/g, '').trim();
  const direct = INDEX.get(cle(brut));
  if (direct) return direct;
  // « Breite in mm », « Anschluss in Volt », « Nutzvolumen [Liter] » : le nom, puis son unité.
  const crochets = brut.match(/^(.*?)\s*\[([^\]]+)\]$/);
  if (crochets) {
    const base = INDEX.get(cle(crochets[1]));
    if (base) return `${base} [${UNITES_CROCHETS[cle(crochets[2])] ?? crochets[2]}]`;
  }
  const enUnite = brut.match(/^(.*?)\s+in\s+(mm|cm|m|kg|g|volt|kw|w|l|liter|°\s?c)$/i);
  if (enUnite) {
    const base = INDEX.get(cle(enUnite[1]));
    if (base) return `${base === 'Tension' ? 'Raccordement' : base} en ${UNITES_EN[cle(enUnite[2]).replace(/\s/g, '')] ?? enUnite[2]}`;
  }
  // « Temperatur von », « Kühlvolumen (Liter) » : une unité entre parenthèses
  const parentheses = brut.match(/^(.*?)\s*\(([^)]+)\)$/);
  if (parentheses) {
    const base = INDEX.get(cle(parentheses[1]));
    if (base && /^(?:liter|litres?|l)$/i.test(parentheses[2].trim())) return `${base} (litres)`;
  }
  return brut;
}

/** Même valeur écrite deux fois (« Volumen 60 l », « Volume 60 L ») : chiffres et unité identiques. */
const memeValeur = (a: Valeur, b: Valeur) => cle(`${a.valeur} ${a.unite ?? ''}`) === cle(`${b.valeur} ${b.unite ?? ''}`);


/** Les huiles totales d'un houblon se disent pour 100 g de cônes (« 0.8ml » sur la page, « ml/100 g » dans le métier : T28-14). */
const HUILES = /^\s*(\d+(?:[.,]\d+)?)\s*ml(?:\s*\/\s*100\s*g)?\s*$/i;

/** Un seul nom, un seul sens : « Poids net » est le poids de l'article quand la page n'en donne pas d'autre (T28-7). */
const POIDS_NET = 'Poids net';

/** Une caractéristique en français : nom de la table, unité sortie du nom vers `unite`, valeur à la suisse. */
function enFrancais<T extends Valeur>(v: T): T {
  const brut = v.nom.replace(/[‎‏]/g, '').trim();
  let nom = libelleFrancais(brut);
  let unite = v.unite;
  const porte = nomEtUnite(nom);
  if (porte) {
    if (nombreSeul(v.valeur) && !unite) { nom = libelleFrancais(porte.base); unite = porte.unite; }
    else if (/\d/.test(v.valeur)) nom = libelleFrancais(porte.base);
  }
  let valeur = valeurFrancaise(v.valeur, unite);
  if (nom === 'Huiles totales') {
    const h = (unite ? `${v.valeur} ${unite}` : v.valeur).match(HUILES);
    if (h) { valeur = h[1].replace('.', ','); unite = 'ml/100 g'; }
  }
  const sortie: T = { ...v, nom, valeur };
  if (unite) sortie.unite = unite; else delete sortie.unite;
  return sortie;
}

/**
 * Les caractéristiques d'une page avec des noms et des valeurs français (T25-8, T26-1, T28-7, T28-12, T28-13). Une clé technique est
 * retirée ; une unité écrite dans le nom (« Poids net en kg » 82) passe dans `unite` (« Poids » 82 kg : la colonne du carnet s'y
 * rattache par le nom) ; deux lignes qui deviennent le même nom (« Volumen 60 l » et « Volume 60 L ») : la seconde disparaît si elle dit
 * la même chose, sinon elle garde son nom d'origine (jamais deux valeurs sous un même nom). Idempotent : repasser sur du français ne
 * change rien.
 */
export function traduireValeurs<T extends Valeur>(valeurs: T[] | undefined): T[] | undefined {
  if (!valeurs) return valeurs;
  const sortie: T[] = [];
  const pris = new Map<string, T>();
  for (const v of valeurs) {
    if (cleTechnique(v.nom)) continue;
    const cand = enFrancais(v);
    const k = cle(cand.nom);
    const deja = pris.get(k);
    if (deja) {
      if (memeValeur(deja, cand)) continue;
      const brut = v.nom.replace(/[‎‏]/g, '').trim();
      if (pris.has(cle(brut))) continue;
      const tel = { ...cand, nom: brut };
      pris.set(cle(brut), tel); sortie.push(tel);
      continue;
    }
    pris.set(k, cand); sortie.push(cand);
  }
  if (!pris.has(cle('Poids'))) {
    const i = sortie.findIndex((v) => v.nom === POIDS_NET);
    if (i >= 0) sortie[i] = { ...sortie[i], nom: 'Poids' };
  }
  return sortie;
}
