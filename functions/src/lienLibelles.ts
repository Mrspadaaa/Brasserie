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
  [['alphasaure'], 'Alpha'],
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

/**
 * Les caractéristiques d'une page avec des noms français. Une clé technique est retirée ; deux lignes qui deviennent le même nom
 * (« Volumen 60 l » et « Volume 60 L ») : la seconde disparaît si elle dit la même chose, sinon elle garde son nom d'origine
 * (jamais deux valeurs sous un même nom). Idempotent : repasser sur du français ne change rien.
 */
export function traduireValeurs<T extends Valeur>(valeurs: T[] | undefined): T[] | undefined {
  if (!valeurs) return valeurs;
  const sortie: T[] = [];
  const pris = new Map<string, T>();
  for (const v of valeurs) {
    if (cleTechnique(v.nom)) continue;
    const libelle = libelleFrancais(v.nom);
    const k = cle(libelle);
    const deja = pris.get(k);
    if (deja) {
      if (memeValeur(deja, v)) continue;
      const brut = v.nom.replace(/[‎‏]/g, '').trim();
      if (pris.has(cle(brut))) continue;
      const tel = { ...v, nom: brut };
      pris.set(cle(brut), tel); sortie.push(tel);
      continue;
    }
    const traduite = libelle === v.nom ? v : { ...v, nom: libelle };
    pris.set(k, traduite); sortie.push(traduite);
  }
  return sortie;
}
