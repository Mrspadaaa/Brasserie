import { AiTier } from './models.js';
import { HOP_ANALYTES, HOP_FORMS, HOP_UNITS } from './hopIndexSchema.js';

/**
 * Catalogue des tâches IA.
 *
 * Les consignes vivent CÔTÉ SERVEUR, jamais dans le navigateur : elles sont
 * versionnées avec le code, hors de portée du client, et modifiables sans
 * redéployer l'application.
 *
 * Chaque tâche impose un `responseSchema`. Gemini renvoie alors du JSON garanti
 * conforme, au lieu d'un texte libre qu'il faudrait parser à la main.
 *
 * RÈGLE TRANSVERSE : aucune tâche n'a le droit d'inventer un chiffre. Un montant
 * illisible vaut 0 et une chaîne vide, jamais une estimation plausible — c'est
 * de la comptabilité, pas une conversation.
 */

export type TaskId =
  | 'scanInvoice'
  | 'shelfInventory'
  | 'importRecipe'
  | 'generateRecipe'
  | 'diagnoseBatch'
  | 'tastingNotes'
  | 'monthlySummary'
  | 'detectAnomalies'
  | 'shoppingList'
  | 'labelText'
  | 'draftEmail'
  | 'naturalSearch'
  /** Relecture critique d'une recette complète, eau comprise. */
  | 'reviewRecipe'
  | 'lookupIngredient'
  | 'lookupHopVariety'
  | 'readHopCoa';

export interface TaskDef {
  /** Consigne système, en français : les réponses sont lues par Gaëtan. */
  system: string;
  /** Schéma imposé à la réponse. */
  schema: Record<string, unknown>;
  /** Niveau par défaut si le client n'en impose pas. */
  defaultTier: AiTier;
  /** La tâche accepte-t-elle une pièce jointe (photo, PDF) ? */
  acceptsFile: boolean;
  /**
   * Active la recherche Google ancrée.
   *
   * ⚠️ C'est ce qui sépare une donnée RETROUVÉE d'une donnée inventée. Gemini 3
   * accepte l'ancrage ET le schéma de réponse dans le même appel — la
   * restriction qui les rendait exclusifs ne concernait que les modèles 1.5 et
   * 2.0. En revanche la métadonnée d'ancrage revient vide dans ce mode : chaque
   * schéma concerné porte donc son propre champ `source`, que le modèle doit
   * remplir.
   */
  grounded?: boolean;
}

const BRASSERIE = `Tu assistes la micro-brasserie suisse « L'Affinée » (Villars-sur-Glâne, canton de Fribourg).
Tu réponds en français, dans le vocabulaire du brassage et de la comptabilité suisse.
Les montants sont en francs suisses (CHF). Les taux de TVA possibles sont 2.6 % (denrées
alimentaires, dont la bière), 8.1 % (matériel et services), ou 0 %.`;

const NE_RIEN_INVENTER = `RÈGLE ABSOLUE : n'invente jamais une valeur. Si une information n'est pas
lisible ou pas déductible, renvoie 0 pour un nombre et une chaîne vide pour un texte. Il vaut
infiniment mieux un champ vide qu'un chiffre plausible mais faux.`;

const S = (properties: Record<string, unknown>, required: string[]) => ({
  type: 'OBJECT',
  properties,
  required
});

const str = { type: 'STRING' };
const num = { type: 'NUMBER' };
const arr = (items: unknown) => ({ type: 'ARRAY', items });

const hopSourceSchema = S({ title: str, author: str, reference: str, locator: str,
  year: { type: 'INTEGER', nullable: true },
  kind: { type: 'STRING', enum: ['coa', 'manufacturer', 'research', 'review', 'observation', 'community', 'judgment'] }
}, ['title', 'author', 'reference', 'year', 'kind']);
const hopMeasurementSchema = S({
  analyte: { type: 'STRING', enum: [...HOP_ANALYTES] }, unit: { type: 'STRING', enum: [...HOP_UNITS] },
  basis: { type: 'STRING', enum: ['asIs', 'dryMatter', 'oil', 'beer', 'unknown'] },
  kind: { type: 'STRING', enum: ['point', 'range', 'below', 'unknown'] },
  value: num, range: S({ min: num, max: num }, ['min', 'max']), limit: num,
  limitKind: { type: 'STRING', enum: ['lod', 'loq'] }, source: hopSourceSchema,
  confidence: { type: 'STRING', enum: ['low'] }, method: str, note: str
}, ['analyte', 'unit', 'basis', 'kind', 'source', 'confidence']);
const hopEvidenceInstructions = `RÈGLE ABSOLUE : transcris uniquement des informations explicitement publiées ou visibles.
N'invente aucune valeur, plage, marge, rendement, année ou source. Un champ absent reste absent, jamais zéro.
Une valeur ponctuelle est kind=point (value), une plage publiée kind=range (range), une non-détection kind=below
(limit et limitKind seulement si publiés). Ne calcule aucune marge autour d'un point.
Chaque mesure porte sa propre source : auteur/organisme, titre, référence vérifiable, année ou null si inconnue,
et page/table dans locator. La date de consultation ne remplace pas l'année. Confidence=low : proposition à relire.
Garde les unités et la base exactes, sans conversion supposée. Distingue thiol libre, cystéinylé et glutathionylé.
4MSP est synonyme de 4MMP, 3SH/3SHol de 3MH. Ne déduis jamais des concentrations de leurs descripteurs d'arôme.
3S4MP (3M4MP) est un autre composé : analyte=3s4mpFree, jamais 3mhFree ni 4mmpFree.
3SHA et 3MHA désignent l'acétate de 3-sulfanylhexyle : analyte=3mhaFree, distinct de 3SH/3MH.
Le 2-methylbutyl isobutyrate (CAS 2445-69-4) utilise 2methylbutylIsobutyrate. L'abréviation 2MIB seule
est ambiguë avec le 2-méthylisobornéol (CAS 2371-42-8) : n'attribue pas de mesure sans identité explicite.
gammaNonalactone désigne la γ-nonalactone, pas les autres lactones gamma/delta.
Une dose ajoutée pour un kit sensoriel ou un essai, un seuil olfactif et un rendement ne sont pas des
analyses du lot : conserve leur contexte en description, sans les transcrire dans analysis.
Les µg/kg en équivalents thiol libre utilisent ugKgThiolEquivalent, pas ugKg (masse du composé).
Les µg/L en équivalents d'étalon interne utilisent ugLInternalStandardEquivalent, pas une concentration absolue.
Une concentration absolue explicitement mesurée en µg/L de bière utilise ugL ; ne convertis pas ngL en ugL.
Si la source ne distingue pas matière sèche et produit tel quel, basis=unknown. Les pourcentages de profil GC restent percentOil, sans conversion en mg/100g.
Aucune prédiction sensorielle, aucun score, aucun enrichissement de la mesure à partir de la mémoire du modèle.`;

export const TASKS: Record<TaskId, TaskDef> = {
  lookupHopVariety: {
    defaultTier: 'fast', acceptsFile: false, grounded: true,
    system: `${BRASSERIE}\nRecherche la fiche officielle de la variété demandée chez son producteur ou un organisme de recherche.
${hopEvidenceInstructions}
La référence doit être l'URL de la page qui contient la donnée. Si rien n'est trouvé, found=false, analysis=[] et descriptions=[].
Les descriptions indiquent leur contexte (rawHop, infusion, beer, unspecified) ; une fiche commerciale sans protocole est unspecified.
Ne fournis pas de contexte de bière ou de forme de produit non documenté ; utilise unknown pour la forme.`,
    schema: S({ found: { type: 'BOOLEAN' }, name: str, aliases: arr(str), origin: str,
      form: { type: 'STRING', enum: [...HOP_FORMS] }, analysis: arr(hopMeasurementSchema),
      descriptions: arr(S({ text: str, context: { type: 'STRING', enum: ['rawHop', 'infusion', 'beer', 'unspecified'] }, source: hopSourceSchema }, ['text', 'context', 'source'])), note: str
    }, ['found', 'name', 'aliases', 'form', 'analysis', 'descriptions'])
  },
  readHopCoa: {
    defaultTier: 'fast', acceptsFile: true,
    system: `${BRASSERIE}\nTranscris uniquement le certificat d'analyse de houblon joint.
${hopEvidenceInstructions}
La référence est le numéro du COA ou le nom du fichier fourni ; cite la page dans locator.
Ne complète aucun champ à partir d'une moyenne variétale. Récolte et date du certificat sont deux informations distinctes.
Région de culture, producteur et conditions de stockage ne sont transcrits que s'ils figurent dans le document ; le pays d'origine d'une variété ne donne pas la région de ce lot.
Si le document n'est pas exploitable, found=false, analysis=[] et explique dans note.`,
    schema: S({ found: { type: 'BOOLEAN' }, lotNumber: str, harvestYear: { type: 'INTEGER' }, growingRegion: str, grower: str, storageNotes: str,
      form: { type: 'STRING', enum: [...HOP_FORMS] }, analysis: arr(hopMeasurementSchema), note: str
    }, ['found', 'analysis'])
  },
  // --- 1. Lecture de facture (existant, rebranché) -------------------------
  scanInvoice: {
    defaultTier: 'fast',
    acceptsFile: true,
    system: `${BRASSERIE}

Analyse ce document (facture, reçu ou ticket de caisse) et extrais les informations comptables.

- "items" : uniquement les articles physiquement livrés. N'y mets PAS les frais de port,
  l'emballage, les remises ni les arrondis.
- "tvaRate" : 0.026 pour les denrées, 0.081 pour matériel et services, 0 si aucune TVA
  n'apparaît sur le document.

${NE_RIEN_INVENTER}`,
    schema: S(
      {
        vendor: str,
        date: { ...str, description: 'Format JJ.MM.AAAA' },
        amountHT: num,
        tvaRate: num,
        tvaAmount: num,
        amountTTC: num,
        category: {
          type: 'STRING',
          enum: ['brassage', 'materiel', 'nettoyage', 'chargesFixes', 'renovation', 'divers']
        },
        subcategory: str,
        description: str,
        items: arr(
          S(
            {
              name: str,
              quantity: num,
              unit: str,
              price: num,
              stockCategory: str
            },
            ['name', 'quantity', 'unit']
          )
        )
      },
      ['vendor', 'date', 'amountHT', 'tvaRate', 'amountTTC', 'category', 'description', 'items']
    )
  },

  // --- 2. Photo d'étagère → inventaire ------------------------------------
  shelfInventory: {
    defaultTier: 'fast',
    acceptsFile: true,
    system: `${BRASSERIE}

Sur cette photo d'étagère ou de zone de stockage, identifie et compte ce que tu vois :
sacs de malt, paquets de houblon, sachets de levure, bouteilles, capsules, fûts.

Pour chaque article : le libellé lisible sur l'emballage, la quantité comptée, et un indice
de confiance entre 0 et 1. Un sac partiellement caché se compte comme un sac, mais la
confiance baisse.

${NE_RIEN_INVENTER} Ne devine pas ce qui est hors champ.`,
    schema: S(
      {
        items: arr(
          S(
            { name: str, quantity: num, unit: str, confidence: num, note: str },
            ['name', 'quantity', 'unit', 'confidence']
          )
        ),
        overallNote: str
      },
      ['items']
    )
  },

  // --- 3. Import de recette (remplace le parseur regex) --------------------
  importRecipe: {
    defaultTier: 'fast',
    acceptsFile: true,
    // Ancrée : une recette cite souvent un malt ou une levure sans en donner
    // les caractéristiques. Le modèle va les chercher plutôt que de laisser
    // Gaëtan bloqué à la fin de la saisie.
    grounded: true,
    system: `${BRASSERIE}

Transforme cette recette de bière — texte collé depuis un site, photo d'un carnet, ou PDF —
en fiche structurée.

UNITÉS. Convertis tout en métrique : malts en kilogrammes, houblons en grammes, volumes en
litres, températures en degrés Celsius. Les recettes américaines donnent souvent les deux
(« 9 lbs. (4.1 kg) ») : retiens alors la valeur métrique entre parenthèses, qui est la mesure
d'origine, plutôt que de reconvertir la valeur impériale.
Repères : 1 lb = 453.6 g · 1 oz = 28.35 g · 1 gallon US = 3.785 L · °C = (°F − 32) × 5/9.

FERMENTESCIBLES. Chaque ingrédient qui apporte du sucre porte une famille « kind » :
  • "grain"    — malts et céréales, qui passent par la maische
  • "sucre"    — saccharose, candi, miel, sirop : 100 % fermentescible
  • "lactose"  — **0 % fermentescible**, la levure n'y touche pas
  • "fruit"    — purée, jus : environ 90 %, et il apporte du volume
  • "extrait"  — moût concentré, déjà empâté
et un moment « use » : "empatage", "ebullition", ou "fermentation" (avec
« dayOffset » pour le sucre candi belge ajouté en cours de fermentation).
Le lactose et le sucre candi ne sont PAS des malts : les ranger dans le grain
fausse à la fois la facture de grain et la densité finale annoncée.

PALIERS ET FERMENTATION. Si la recette donne des paliers d'empâtage ou un
programme de fermentation, remplis « mashSteps » et « fermentation ». Un repos
diacétyle et une garde à froid sont des phases à part entière, pas de la
fermentation primaire qui durerait longtemps. Si elle donne un traitement d'eau
(sels, acide, eau osmosée), structure les quantités explicites dans « waterPlan »
et garde les consignes non chiffrées dans « waterNote ».

TRAITEMENT D’EAU. « waterPlan.mash » et « waterPlan.sparge » portent les grammes
réellement ajoutés, eau par eau. Identifiants : gypse (CaSO4·2H2O), cacl2
(CaCl2·2H2O), epsom (MgSO4·7H2O), mgcl2 (MgCl2·6H2O), nacl, nahco3,
caco3, chaux (Ca(OH)2), kcl. Ne convertis jamais des ppm en grammes sans volume.
« acid » porte le produit et ses deux doses : lactique = acide lactique 80 % en mL,
phosphorique = acide phosphorique 75 % en mL, maltAcidule = grammes de malt acidulé.
Si la concentration, l’hydratation d’un sel ou l’étape d’ajout est inconnue ou différente,
conserve la prescription dans waterNote et ne transforme pas sa dose en un autre produit.
Les doses écrites deviennent les doses manuelles « acidOverride » de la même eau.
Osmosée : diRatioPct pour l’empâtage, spargeDiRatioPct uniquement si le rinçage est
réglé séparément. Zéro est une vraie valeur. Aucune estimation d’ions après traitement.
Analyse de source complète uniquement si les SIX ions sont explicitement connus :
sourceSnapshot inclut nom, id descriptif, ions en ppm et pH si donné ; sourceId reprend
cet id. Une analyse partielle reste dans waterNote. Ne confonds pas source et cible.

TOUS LES CHAMPS. Garde la date de brassage, le rendement annoncé, les volumes,
les notes, les ajouts autres que malts/houblons, les températures de mash-out/rinçage,
le type de rinçage, la souche/laboratoire et les notes de levure, chaque note de phase.
Les propriétés non écrites restent ABSENTES, jamais nulles ou remplacées par zéro.
« mash » reprend le programme complet ; « mashSteps » est le même programme si présent.

CIBLE D'EAU. Beaucoup de recettes ne nomment pas un style d'eau : elles donnent le
PROFIL VISÉ en ppm — « Target water profile: Ca 110, Mg 5, Na 12, SO4 200, Cl 55,
HCO3 0 », ou la même chose en tableau. Remplis alors « waterTarget ».
  • Ne remplis que ce qui est ÉCRIT. Un ion absent reste absent — surtout pas zéro,
    qui est une valeur, et que le brasseur viserait.
  • Ne confonds pas la cible avec l'ANALYSE de l'eau du robinet de l'auteur, ni avec
    la liste des sels à peser. Une cible se reconnaît à « target », « profil visé »,
    « water profile », « eau de brassage visée ».
  • L'alcalinité s'écrit tantôt en bicarbonate (HCO₃), tantôt en CaCO₃. Convertis en
    BICARBONATE : ppm HCO₃ = ppm CaCO₃ × 1.22. Dis dans « waterNote » laquelle des
    deux la recette donnait.
  • « waterTargetName » reçoit le nom que la recette donne à cette eau, s'il y en a
    un (« Burton », « eau de la brasserie »).

MOMENT DES HOUBLONS. C'est l'information la plus importante de la recette, et la plus souvent
perdue. Chaque ajout porte un champ « stage » parmi exactement :
  • "firstWort"  — first wort hop, premier moût, FWH
  • "boil"       — ébullition, avec « timeMin » = minutes AVANT la fin (« 0 min. » vaut 0)
  • "whirlpool"  — whirlpool, hop stand, flameout, avec « timeMin » et « tempC » si donnés
  • "dryHop"     — dry hop, houblonnage à cru, avec « dayOffset » = jour depuis la mise en cuve
Un même houblon apparaissant à plusieurs moments donne PLUSIEURS entrées : « Citra 28 g en
hop stand » et « Citra 85 g en dry hop » sont deux lignes, jamais une seule de 113 g.

SOURCES. Quand tu COMPLÈTES une valeur absente de la recette — l'alpha d'un
houblon, la couleur ou le potentiel d'un malt, l'atténuation d'une levure — va
la chercher sur la fiche du producteur et nomme cette source dans « source ».
Une valeur que tu n'as pas trouvée reste ABSENTE : ne la devine jamais.

LE PROCÉDÉ, qui n'est JAMAIS dans la liste d'ingrédients. Relis le déroulé et remplis :
  • « mashWaterL »   — l'eau d'empâtage (« mash in … in 5 gallons (19 L) of water »)
  • « preBoilL »     — le moût collecté AVANT ébullition (« until 6.5 gallons (25 L) collected »)
  • « carboVolumes » — la carbonatation visée (« force carbonate to 2.5 volumes »)
  • « dryHopNote »   — le calendrier du houblonnage à cru quand il est décrit en prose
Ce sont trois volumes DIFFÉRENTS : le brassin, l'eau d'empâtage et le moût d'avant-ébullition.
Les confondre fausse le rendement.

DOSES EN CUILLÈRES. Une recette américaine dose les sels et le sucre de réamorçage en
« tsp. » et en « cup ». Ne les convertis PAS en grammes : la masse dépend du sel et du
tassement. Garde la mesure dans son unité d'origine, ou recopie-la dans « waterNote ».

DÉROULÉ. Recopie le texte des instructions mot pour mot dans \`instructions\`. Ne le résume
pas : c'est le mode opératoire que le brasseur suivra en cuverie.

${NE_RIEN_INVENTER}
En particulier : n'invente JAMAIS un taux d'alpha. La plupart des recettes n'en donnent que
pour le houblon d'amérisation. Laisse le champ absent pour les autres — un alpha inventé se
propage jusque dans l'amertume calculée.`,
    schema: S(
      {
        name: str,
        style: str,
        volumeL: num,
        brewDate: str,
        efficiencyPct: num,
        carboTarget: str,
        notesCreation: str,
        boilMin: num,
        ogTarget: num,
        fgTarget: num,
        abvTarget: num,
        ibuTarget: num,
        colorEbc: num,
        /*
         * Un malt n'est pas un sucre. `kind` sépare ce qui passe par la maische
         * de ce qui se dissout ; `fermentabilityPct` dit ce que la levure peut
         * en manger. Sans cette distinction, 500 g de lactose sont comptés comme
         * du sucre fermentescible et la densité finale annoncée est fausse.
         */
        fermentables: arr(
          S(
            {
              name: str,
              weightKg: num,
              kind: {
                type: 'STRING',
                enum: ['grain', 'sucre', 'lactose', 'fruit', 'extrait']
              },
              use: { type: 'STRING', enum: ['empatage', 'ebullition', 'fermentation'] },
              fermentabilityPct: num,
              dayOffset: num,
              colorEbc: num,
              potentialPpg: num
            },
            ['name', 'weightKg', 'kind', 'use']
          )
        ),
        hops: arr(
          S(
            {
              name: str,
              alpha: num,
              weightG: num,
              stage: { type: 'STRING', enum: ['firstWort', 'boil', 'whirlpool', 'dryHop'] },
              timeMin: num,
              tempC: num,
              dayOffset: num
            },
            ['name', 'weightG', 'stage']
          )
        ),
        adjuncts: arr(S({ name: str, amount: num, unit: str, step: str, notes: str }, ['name', 'amount', 'unit'])),
        yeast: S(
          {
            name: str,
            lab: str,
            strain: str,
            form: { type: 'STRING', enum: ['sèche', 'liquide', 'levain'] },
            qty: num,
            unit: str,
            pitchTempC: num,
            fermTempMinC: num,
            fermTempMaxC: num,
            attenuationPct: num,
            fermentDays: num,
            notes: str
          },
          ['name', 'form', 'qty', 'unit']
        ),
        mashSteps: arr(
          S({ name: str, tempC: num, durationMin: num }, ['name', 'tempC', 'durationMin'])
        ),
        fermentation: arr(
          S(
            {
              kind: {
                type: 'STRING',
                enum: ['primaire', 'reposDiacetyle', 'garde', 'refermentation', 'ajout']
              },
              name: str,
              tempC: num,
              days: num,
              note: str
            },
            ['kind', 'name', 'tempC']
          )
        ),
        mash: S({
          steps: arr(S({ name: str, tempC: num, durationMin: num }, ['name', 'tempC', 'durationMin'])),
          ratioLPerKg: num, mashoutTempC: num, spargeTempC: num,
          spargeType: { type: 'STRING', enum: ['fly', 'batch', 'none'] }
        }, []),
        steps: arr(S({ step: str, tempC: num, durationMin: num, notes: str }, ['step', 'tempC', 'durationMin', 'notes'])),
        waterPlan: S({
          sourceId: str,
          sourceSnapshot: S({ id: str, name: str, ca: num, mg: num, na: num, so4: num, cl: num, hco3: num, ph: num, note: str, updatedAt: str }, ['id', 'name', 'ca', 'mg', 'na', 'so4', 'cl', 'hco3']),
          diRatioPct: num, spargeDiRatioPct: num, targetProfileId: str,
          targetName: str, targetIons: S({ ca: num, mg: num, na: num, so4: num, cl: num, hco3: num }, []),
          mashWaterL: num, spargeWaterL: num, allSaltsInMash: { type: 'BOOLEAN' },
          mash: S({ gypse: num, cacl2: num, epsom: num, mgcl2: num, nacl: num, nahco3: num, caco3: num, chaux: num, kcl: num }, []),
          sparge: S({ gypse: num, cacl2: num, epsom: num, mgcl2: num, nacl: num, nahco3: num, caco3: num, chaux: num, kcl: num }, []),
          acid: S({ id: { type: 'STRING', enum: ['lactique', 'phosphorique', 'maltAcidule'] }, mash: num, sparge: num }, ['id']),
          acidOverride: S({ mash: num, sparge: num }, []),
          disabled: arr({ type: 'STRING', enum: ['gypse', 'cacl2', 'epsom', 'mgcl2', 'nacl', 'nahco3', 'caco3', 'chaux', 'kcl'] }),
          targetPh: num, measuredPh: num, measuredSpargePh: num
        }, []),
        waterNote: str,
        /*
         * La cible d'eau CHIFFRÉE, quand la recette en donne une. Aucun ion
         * n'est requis : une recette qui ne donne que le sulfate et le chlorure
         * doit pouvoir le dire sans que les quatre autres soient inventés à
         * zéro — et zéro est une cible que le solveur viserait.
         */
        waterTarget: S({ ca: num, mg: num, na: num, so4: num, cl: num, hco3: num }, []),
        waterTargetName: str,
        /*
         * Le procédé, que la lecture perdait entièrement. Ces quatre valeurs
         * sont écrites en toutes lettres dans le déroulé, jamais dans la liste
         * d'ingrédients — c'est pour ça qu'elles passaient à travers.
         */
        mashWaterL: num,
        spargeWaterL: num,
        preBoilL: num,
        carboVolumes: num,
        dryHopNote: str,
        instructions: str,
        notes: str,
        /*
         * Ce que le modèle a COMPLÉTÉ hors de la recette, et d'où ça vient.
         * Une recette ne donne presque jamais l'alpha de tous ses houblons ni
         * la couleur de ses malts : le modèle va les chercher, et Gaëtan doit
         * pouvoir remonter à la fiche du fabricant pour vérifier.
         */
        source: str
      },
      // ⚠️ Chaque nom listé ici DOIT exister dans `properties` : Gemini rejette
      // la requête entière avec « required[n]: property is not defined ». Ce
      // tableau référençait encore `malts`, renommé en `fermentables`.
      ['name', 'style', 'volumeL', 'fermentables', 'hops']
    )
  },

  // --- 4. Génération de recette -------------------------------------------
  generateRecipe: {
    defaultTier: 'max',
    acceptsFile: false,
    system: `${BRASSERIE}

À partir du style et des contraintes décrits, compose une recette complète et brassable sur
l'installation indiquée. Reste dans les fourchettes reconnues du style (BJCP) pour l'OG, la
FG, l'amertume et la couleur.

Explique brièvement chaque choix de malt et de houblon : Gaëtan veut comprendre la recette,
pas seulement l'exécuter. Signale les ingrédients absents du stock fourni.`,
    schema: S(
      {
        name: str,
        style: str,
        volumeL: num,
        ogTarget: num,
        fgTarget: num,
        abvTarget: num,
        ibuTarget: num,
        malts: arr(S({ name: str, weightKg: num, why: str }, ['name', 'weightKg'])),
        hops: arr(
          S({ name: str, alpha: num, weightG: num, timeMin: num, step: str, why: str }, ['name', 'weightG'])
        ),
        adjuncts: arr(S({ name: str, amount: num, unit: str, step: str }, ['name', 'amount', 'unit'])),
        yeastName: str,
        mashTempC: num,
        rationale: str,
        missingFromStock: arr(str)
      },
      ['name', 'style', 'volumeL', 'malts', 'hops', 'yeastName', 'rationale']
    )
  },

  // --- 5. Diagnostic de brassin -------------------------------------------
  diagnoseBatch: {
    defaultTier: 'max',
    acceptsFile: false,
    system: `${BRASSERIE}

Tu reçois les mesures réelles d'un brassin en cours : densités relevées, températures, dates,
levure, notes du brasseur. Diagnostique ce qui se passe.

Raisonne sur les CHIFFRES fournis, pas sur des généralités. Si l'atténuation est normale pour
cette levure et ce moût, dis-le franchement plutôt que d'inventer un problème. Classe chaque
cause par probabilité et donne une action concrète et vérifiable pour chacune.`,
    schema: S(
      {
        verdict: str,
        severity: { type: 'STRING', enum: ['normal', 'surveiller', 'agir', 'urgent'] },
        apparentAttenuationPct: num,
        causes: arr(
          S({ cause: str, probability: num, action: str }, ['cause', 'probability', 'action'])
        ),
        immediateAction: str
      },
      ['verdict', 'severity', 'causes']
    )
  },

  // --- 6. Notes de dégustation --------------------------------------------
  tastingNotes: {
    defaultTier: 'fast',
    acceptsFile: false,
    system: `${BRASSERIE}

Structure ces notes de dégustation en profil sensoriel. Note chaque axe de 1 à 5.
Si un défaut est décrit, nomme-le avec son terme technique (diacétyle, acétaldéhyde,
DMS, phénolique, oxydation) et indique sa cause probable au brassage.`,
    schema: S(
      {
        aroma: str,
        appearance: str,
        flavour: str,
        mouthfeel: str,
        scores: S(
          { maltiness: num, bitterness: num, body: num, carbonation: num, balance: num },
          []
        ),
        faults: arr(S({ name: str, cause: str, fix: str }, ['name'])),
        summary: str
      },
      ['summary']
    )
  },

  // --- 7. Résumé comptable mensuel ----------------------------------------
  monthlySummary: {
    defaultTier: 'max',
    acceptsFile: false,
    system: `${BRASSERIE}

Voici les écritures comptables d'une période. Produis une synthèse utilisable pour la
déclaration : totaux par catégorie, ventilation de la TVA si la brasserie est assujettie,
et les points qui méritent l'attention de Gaëtan.

N'additionne que ce qui t'est donné. Ne complète aucun montant manquant.`,
    schema: S(
      {
        period: str,
        totalCharges: num,
        totalRecettes: num,
        solde: num,
        byCategory: arr(S({ category: str, total: num, count: num }, ['category', 'total'])),
        tvaCollected: num,
        tvaDeductible: num,
        highlights: arr(str),
        attentionPoints: arr(str)
      },
      ['period', 'totalCharges', 'totalRecettes', 'solde', 'byCategory']
    )
  },

  // --- 8. Détection d'anomalies -------------------------------------------
  detectAnomalies: {
    defaultTier: 'max',
    acceptsFile: false,
    system: `${BRASSERIE}

Passe ces écritures au crible et signale ce qui cloche : doublons probables (même
fournisseur, même montant, dates proches), montants aberrants par rapport à l'historique de
la catégorie, taux de TVA incohérent avec la nature de l'achat, justificatif manquant sur un
montant élevé, date improbable.

Ne signale que ce qui est réellement suspect. Une longue liste de faux positifs est pire que
rien : elle apprend à ignorer l'outil.`,
    schema: S(
      {
        anomalies: arr(
          S(
            {
              transactionIds: arr(str),
              type: {
                type: 'STRING',
                enum: ['doublon', 'montant', 'tva', 'justificatif', 'date', 'autre']
              },
              severity: { type: 'STRING', enum: ['info', 'attention', 'grave'] },
              explanation: str,
              suggestion: str
            },
            ['transactionIds', 'type', 'severity', 'explanation']
          )
        ),
        checkedCount: num
      },
      ['anomalies', 'checkedCount']
    )
  },

  // --- 9. Liste de courses intelligente ------------------------------------
  shoppingList: {
    defaultTier: 'fast',
    acceptsFile: false,
    system: `${BRASSERIE}

À partir du stock actuel, des seuils minimaux et des brassins planifiés, établis la liste de
ce qu'il faut commander. Groupe par fournisseur habituel.

Additionne les besoins de TOUS les brassins planifiés avant de comparer au stock. Arrondis
aux conditionnements de vente courants (sacs de malt en 5 ou 25 kg, houblons en 100 g ou
1 kg) et dis-le dans la note.`,
    schema: S(
      {
        bySupplier: arr(
          S(
            {
              supplier: str,
              items: arr(
                S(
                  { name: str, toOrder: num, unit: str, currentStock: num, reason: str },
                  ['name', 'toOrder', 'unit']
                )
              )
            },
            ['supplier', 'items']
          )
        ),
        totalItems: num,
        note: str
      },
      ['bySupplier', 'totalItems']
    )
  },

  // --- 10. Texte d'étiquette ----------------------------------------------
  labelText: {
    defaultTier: 'fast',
    acceptsFile: false,
    system: `${BRASSERIE}

Rédige le texte d'étiquette de cette bière : un nom court, une accroche d'une ligne, une
description de deux à trois phrases, et les mentions obligatoires suisses (degré d'alcool,
contenance, ingrédients, allergènes gluten, « à consommer de préférence avant », coordonnées
du producteur).

Ton chaleureux et concret, sans jargon marketing. Cette bière est brassée à trente litres
dans une cave de Villars-sur-Glâne, pas dans une usine.`,
    schema: S(
      {
        name: str,
        tagline: str,
        description: str,
        mandatoryMentions: arr(str),
        ingredientsList: str,
        allergens: str
      },
      ['name', 'tagline', 'description', 'mandatoryMentions']
    )
  },

  // --- 11. Rédaction client -----------------------------------------------
  draftEmail: {
    defaultTier: 'fast',
    acceptsFile: false,
    system: `${BRASSERIE}

Rédige le message demandé à ce client. Vouvoiement, ton direct et cordial, phrases courtes.
Pas de formule ampoulée ni de superlatif commercial.

Si des prix sont fournis, reprends-les exactement. N'en invente aucun.`,
    schema: S({ subject: str, body: str }, ['subject', 'body'])
  },

  // --- 12. Recherche en langage naturel ------------------------------------
  naturalSearch: {
    defaultTier: 'fast',
    acceptsFile: false,
    system: `${BRASSERIE}

Réponds à la question posée en t'appuyant UNIQUEMENT sur les données fournies.

Donne le chiffre, puis la façon dont tu l'as obtenu, puis les écritures ou articles
concernés. Si la réponse n'est pas dans les données, dis-le : "answer" vide et
"explanation" qui indique ce qui manque.`,
    schema: S(
      {
        answer: str,
        explanation: str,
        matchedIds: arr(str),
        total: num
      },
      ['answer', 'explanation']
    )
  },

  // --- 13. Relecture critique d'une recette entière -----------------------
  /**
   * ⚠️ Demandé ainsi : « je veux aussi une IA qui analyse tout le truc ».
   *
   * Ce que ça fait, et ce que ça ne fait PAS. La tâche reçoit la recette
   * complète en texte — grain, houblons, levure, paliers ET traitement d'eau,
   * exactement ce que produit l'export — et rend une relecture d'expert. Elle
   * ne réécrit rien : l'application ne modifie aucune valeur à partir de sa
   * réponse. C'est un AVIS, que Gaëtan suit ou non.
   *
   * ⚠️ Trois garde-fous dans la consigne, chacun contre une dérive constatée
   * des modèles sur ce genre de tâche :
   *
   *   1. **Interdiction de complimenter à vide.** Sans ça, la moitié de la
   *      réponse est « excellente recette, bien équilibrée » — du bruit qui
   *      dilue les deux remarques utiles.
   *   2. **Chaque remarque porte un CHIFFRE de la recette.** Une critique qui
   *      ne cite pas la valeur qu'elle vise n'est pas vérifiable, donc pas
   *      actionnable.
   *   3. **Le doute se dit.** Sur une recette incomplète — pas d'EBC, pas
   *      d'alpha — le modèle doit signaler ce qui manque plutôt que de
   *      raisonner sur des valeurs qu'il aurait supposées.
   */
  reviewRecipe: {
    defaultTier: 'max',
    acceptsFile: false,
    system: `${BRASSERIE}

Tu relis une recette de brassage complète, comme le ferait un brasseur expérimenté à qui l'on
demande un avis avant de lancer le brassin. Le traitement de l'eau fait partie de la recette :
analyse-le au même titre que le grain et le houblon.

Cherche, dans cet ordre :
- ce qui EMPÊCHERAIT de brasser (volume, quantités, paliers incohérents) ;
- ce qui sortirait la bière de son style annoncé (densité, amertume, couleur, profil d'eau) ;
- ce qui se goûtera mal (rapport sulfate/chlorure à contresens du houblonnage, alcalinité
  qui remontera le pH, acide en excès, sous-ensemencement, palier trop haut ou trop bas).

RÈGLES DE RÉDACTION, à tenir strictement :
- Ne complimente pas pour meubler. Si tout est correct, dis-le en une phrase et arrête-toi.
- Chaque remarque cite la donnée de la recette qu'elle vise. Ne chiffre une correction que si les données permettent de la calculer.
- La fiche structurée et le texte décrivent le même état actuel : vérifie notamment waterPlan (sels par eau, acide retenu) et waterTreatment (source, cible, ions après traitement). Ne substitue pas des doses suggérées aux doses retenues.
- Les concentrations fournies sont celles des eaux de traitement avant extraction/ébullition, pas des mesures dans la bière finie. Ne compare pas la maische concentrée à une cible définie sur toute l'eau.
- La cible HCO3 d'un style est indicative. N'impose pas un ajout de bicarbonate pour la seule couleur EBC. Le pH dépend de la facture et se vérifie sur un échantillon refroidi le jour du brassage ; ne prescris pas une hausse d'acide sur une estimation incertaine.
- Si une donnée manque (couleur d'un malt, acides alpha d'un houblon, analyse d'eau), signale-le
  comme un manque À COMBLER — ne raisonne jamais sur une valeur que tu aurais supposée.
- "severity" : "bloquant" si le brassin échouera, "gout" si la bière sera buvable mais hors
  cible, "detail" pour un réglage fin.

${NE_RIEN_INVENTER}`,
    schema: S(
      {
        verdict: { ...str, description: 'Une phrase : la recette est-elle prête à brasser ?' },
        styleFit: {
          ...str,
          description: 'Ce que cette recette donnera par rapport au style annoncé.'
        },
        findings: arr(
          S(
            {
              severity: { type: 'STRING', enum: ['bloquant', 'gout', 'detail'] },
              topic: { ...str, description: 'Grain, Houblons, Levure, Eau, Paliers…' },
              observation: { ...str, description: 'Le constat, avec le chiffre visé.' },
              suggestion: { ...str, description: 'La correction, chiffrée.' }
            },
            ['severity', 'topic', 'observation']
          )
        ),
        missing: arr({ ...str, description: 'Données à compléter avant de conclure.' })
      },
      ['verdict', 'findings']
    )
  },

  // --- 14. Caractéristiques d'un ingrédient -------------------------------
  /**
   * ⚠️ La tâche qui règle le reproche de Gaëtan : « j'ai une SafAle US-05,
   * toutes les infos sont trouvables, donc Gemini doit trouver sans me bloquer
   * à la fin puis remplir ».
   *
   * Elle est **ancrée sur la recherche Google** : les valeurs viennent de la
   * fiche technique du fabricant, pas de la mémoire du modèle. Le champ
   * `source` est obligatoire — c'est lui qui permet à Gaëtan de vérifier, et
   * c'est la seule façon de tenir la règle « ne rien inventer » tout en
   * remplissant les champs.
   */
  lookupIngredient: {
    defaultTier: 'fast',
    acceptsFile: false,
    grounded: true,
    system: `${BRASSERIE}

On te donne le NOM d'un ingrédient de brassage et son type. Retrouve ses
caractéristiques techniques PUBLIÉES par son fabricant ou son malteur, et
remplis la fiche.

Cherche la fiche officielle : Fermentis, Lallemand, White Labs, Wyeast, Omega,
Imperial pour les levures ; Weyermann, Castle, Bestmalz, Simpsons, Crisp,
Muntons pour les malts ; Yakima Chief, BarthHaas, Hopsteiner pour les houblons.

CONVERSIONS. Les malteurs européens donnent l'EBC, les américains le degré
Lovibond : EBC ≈ °L × 1.97. Le potentiel se donne parfois en rendement fin
(« fine grind, dry basis, 80 % ») : PPG ≈ rendement × 46.

RÈGLE ABSOLUE. Le champ "source" est obligatoire et doit nommer d'où vient la
donnée (« Fermentis — fiche technique SafAle US-05 »). Un champ dont tu n'as
pas trouvé la valeur publiée doit rester ABSENT : mieux vaut une case vide que
Gaëtan qui brasse sur un chiffre que tu as supposé. Si tu ne trouves rien du
tout, renvoie "found": false et explique dans "note".`,
    schema: S(
      {
        found: { type: 'BOOLEAN' },
        name: str,
        source: str,
        note: str,

        // Levure
        lab: str,
        strain: str,
        form: { type: 'STRING', enum: ['sèche', 'liquide', 'levain'] },
        attenuationPct: num,
        tempMinC: num,
        tempMaxC: num,
        flocculation: str,
        alcoholTolerancePct: num,

        // Malt
        colorEbc: num,
        potentialPpg: num,
        grainType: str,
        diastaticPower: num,

        // Houblon
        alphaPct: num,
        betaPct: num,
        usage: str,
        aroma: str,
        substitutes: arr(str)
      },
      ['found', 'name', 'source']
    )
  }
};
