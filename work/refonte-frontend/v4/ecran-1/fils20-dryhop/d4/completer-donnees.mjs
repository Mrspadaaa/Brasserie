// Lot 20 · d4–d6 : complète fils20-dryhop/donnees-h.json sans rien retirer. Lit le fichier au moment
// de l'écriture, ajoute les sources manquantes et remplace seulement les blocs d4, d5 et d6.
// Les 29 lots de Cascade 2015 sont relus dans src/data/hopStudies/lafontaine2018.cascade2015.json et
// les certificats dans src/data/hopPublicLotBootstrap.json (lecture seule), pour éviter une recopie.
// Usage : node completer-donnees.mjs
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
const REPO = 'C:/Users/mrspa/.codex/worktrees/openai-clean-start/Brasserie';
const ici = path.dirname(fileURLToPath(import.meta.url));
const F = path.join(ici, '../donnees-h.json');
const D = JSON.parse(fs.readFileSync(F, 'utf8'));

const SOURCES = {
  17: 'Gros et al., J. Inst. Brew. 2013 (précurseurs du Cascade, relayé)',
  23: 'Lafontaine, Pereira, Vollmer, Shellhammer, BrewingScience 2018 (marqueurs, 29 lots de Cascade 2015, CC BY)',
  25: 'BarthHaas, HSI, 04.07.2024 (blog)',
  36: 'Biendl et al., MBAA TQ 2021 (NEIPA en garde)',
  41: 'Svedlund et al., Appl. Microbiol. Biotechnol. 2022 (revue, CC BY)',
  42: 'Christiaens et al., Molecules 2025 (libération des thiols)',
  49: 'Lallemand, IPA best practices',
  67: 'Takoi et al., BrewingScience 2016 (synergies en mélange modèle)',
  72: 'Lafontaine, Takoi, webinaire ASBC 2019 (assemblages)',
  81: 'Takoi et al., J. Am. Soc. Brew. Chem. 2014 (relayé)',
  82: 'Lallemand, best practices biotransformation 2020 (relayé)',
  87: 'Brülosophy 2019, leçons de Tom Shellhammer',
  88: 'Bruner et al., Fermentation 2021, 30 souches (relayé)',
  93: 'Takoi et al., géraniol et β-citronellol en fermentation (relayé)',
  'dépôt:samia2024': 'Samia et al., BrewingScience 2024 ; src/domain/hopDecision/biotransformation.ts et H §6.3 (établi, dépôt)',
  'dépôt:coa': 'Certificats YCH publiés, src/data/hopPublicLotBootstrap.json',
  'dépôt:app': 'assessHopBiotransformation, src/domain/hopDecision/biotransformation.ts (d4/statuts-app.json)',
};
for (const [k, v] of Object.entries(SOURCES)) if (!D.sources[k]) D.sources[k] = v;

const inc = (raison, src = []) => ({ inconnu: true, raison, src });
D.d4 = {
  _: 'd4 · Levure et biotransformation (H §6.1, §6.2, §8.4). Des drapeaux, pas des chiffres, sauf l\'ordre de grandeur de [42]. Les statuts de l\'app viennent de la vraie fonction (d4/statuts-app.ts → statuts-app.json).',
  ajouts: [
    { houblon: 'citra', dose_gL: 4, jourDebut: 0, jours: 3, src: ['saisie'], note: 'cas du brasseur « 3 j citra - 5 j idao7 » ; dose de l\'exemple de H §7.4' },
    { houblon: 'idaho7', dose_gL: 4, jourDebut: 3, jours: 5, src: ['saisie'] },
  ],
  precurseurs: {
    citra: { present: true, v: 'G-3SH ≈ 23 mg/kg ; Cys 0,6 mg/kg ; 3SH libre 12 µg/kg', src: [16], niv: 'P' },
    cascade: { present: true, v: 'Cys libérables 1,64 mg/kg', src: [17], niv: 'P', note: 'relayé' },
    galaxy: inc('aucune mesure de précurseurs dans H'),
    idaho7: inc('aucune mesure de précurseurs dans H'),
  },
  voies: {
    geraniol: {
      de: 'floral', vers: 'citrus',
      mecanisme: { v: 'mesuré ; aucun taux de conversion en bière publié', src: [41], niv: 'P' },
      tot: { v: 'géraniol divisé surtout dans les 3 premiers jours', src: [93], niv: 'P', note: 'relayé' },
      actif: { v: 'fermentation active : plus de biotransformation (dit, non chiffré)', src: [82], niv: 'F' },
      levures: {
        us05: { v: 'géraniol et nérol plus hauts avec US-05 (12 souches, même moût)', src: [44], niv: 'P', sens: 'garde' },
        verdant: inc('non publié', [49, 50]),
        pomona: { v: 'medium', src: [51], niv: 'F', sens: 'convertit', note: 'mesuré comme citronellol produit depuis le géraniol' },
        diamond: inc('non publié', [50]),
      },
    },
    thiols: {
      de: 'lié', vers: 'tropical',
      conversion: { v: [0.01, 0.35], unite: '%', src: [42], niv: 'P', base: 'précurseur synthétique seulement' },
      detail: { v: 'Cys-3SHol 0,02–0,03 % ; G-3SHol 0,08–0,21 % ; γ-GluCys-3SHol 0,15–0,35 %', src: [42], niv: 'P', note: 'H §6.2 ; H §0 et §7.5 disent 0,01–0,35 %' },
      reel: inc('rendement sur houblon réel non mesuré', [41]),
      irc7: { v: 'IRC7 tronqué chez ≈ 88 % des souches', src: [41], niv: 'P', note: 'relayé' },
      levures: {
        us05: inc('β-lyase non publiée', [50]),
        verdant: { v: 'β-lyase « high » ou « medium », selon la lecture de la figure', src: [49, 50], niv: 'F' },
        pomona: inc('β-lyase non publiée', [50]),
        diamond: { v: 'le plus de thiols mesurés, pas le plus de fruité perçu', src: ['dépôt:samia2024'], niv: 'P' },
      },
    },
    creep: {
      souche: { v: 'la souche compte (30 souches)', src: [88], niv: 'P', note: 'relayé' },
      diacetyle: { v: [25, 200], unite: 'ppb', src: [87], niv: 'S', note: 'relayé' },
      levures: { us05: inc('aucune mesure par souche dans H'), verdant: inc('aucune mesure par souche dans H'), pomona: inc('aucune mesure par souche dans H'), diamond: inc('aucune mesure par souche dans H') },
    },
  },
  diamond: { v: 'le plus de 3SH mesuré, pas le plus de fruité/tropical perçu', essai: 'Cascade à l\'ébullition et au whirlpool, sans dry hop ; 5 levures ; 15, 22 et 30 °C ; panel de 22', src: ['dépôt:samia2024'], niv: 'P' },
  identite: {
    us05: { attenuation_pct: { v: [78, 82], src: [50], niv: 'F' }, temperature_C: { v: [18, 26], src: [50], niv: 'F' }, pof: { v: 'absent de la fiche ; négatif chez des tiers', src: [50, 44], niv: 'F' }, esters: { v: 'low', src: [50], niv: 'F' } },
    verdant: { attenuation_pct: { v: [72, 82], src: [50], niv: 'F', note: 'communiqué relayé ; 75–82 % dans le catalogue du dépôt' }, temperature_C: { v: [18, 23], src: [50], niv: 'F', note: 'ou 18–25 °C' }, pof: inc('non trouvé', [50]), esters: { v: 'abricot, tropical, agrumes', src: [49, 50], niv: 'F' } },
    pomona: { attenuation_pct: { v: [75, 84], src: [50], niv: 'F' }, temperature_C: { v: [18, 22], src: [50], niv: 'F' }, pof: { v: 'négatif', src: [50], niv: 'F' }, esters: { v: 'pêche, agrumes, tropical', src: [50, 51], niv: 'F' } },
    diamond: { attenuation_pct: { v: [77, 83], src: [50], niv: 'F' }, temperature_C: { v: [10, 15], src: [50], niv: 'F' }, pof: { v: 'négatif', src: [50], niv: 'F' }, esters: { v: 'neutre', src: [50], niv: 'F' } },
  },
};

// d5 · le lot avant la variété
const LOTS = JSON.parse(fs.readFileSync(REPO + '/src/data/hopPublicLotBootstrap.json', 'utf8')).hopLots;
const val = (l, a) => { const m = l.analysis.find((x) => x.analyte === a); return m && m.kind === 'point' ? m.value : null; };
const lotCOA = (id) => { const l = LOTS.find((x) => x.id === id); const an = l.harvestYear || Number((l.analysis[0].source.year)); return { id, lot: l.lotNumber, annee: an, alpha_pct: val(l, 'alpha'), huile_mL100g: val(l, 'totalOil'), linalol_pct: val(l, 'linalool'), geraniol_pct: val(l, 'geraniol'), hsi: val(l, 'hsi'), src: ['dépôt:coa'], niv: 'F', url: l.analysis[0].source.reference }; };
const C15 = JSON.parse(fs.readFileSync(REPO + '/src/data/hopStudies/lafontaine2018.cascade2015.json', 'utf8'));
D.d5 = {
  _: 'd5 · Le lot avant la variété (H §2.5, §7, §8.5 ; certificats et lots du dépôt). Charges à 4 g/L calculées par le générateur (niv H) avec les formules de H §7.4.',
  dose_gL: 4,
  cascadeCOA: ['public-coa-cas-2400', 'public-coa-cas-2401', 'public-coa-cas-2519', 'public-coa-cas-2520'].map(lotCOA),
  idaho7COA: [lotCOA('public-coa-id7-2573')],
  cascade2015: { fichier: 'src/data/hopStudies/lafontaine2018.cascade2015.json', geraniol_mg100g: C15.rows.map((r) => r[1]), agrumes_panel: C15.rows.map((r) => r[2]), src: [23], niv: 'P', note: '29 lots, récolte 2015 ; géraniol 0,32–4,07 mg/100 g, facteur 13' },
  etalonnage: { v: 'agrumes = 4,153 + 0,548 × géraniol (mg/100 g), R² 0,50 ; résidu −0,95 à +1,32 sur 15', src: [23], niv: 'P', note: 'établi (docs/index-houblon-etalonnage.md)' },
  intensite: { v: [6, 9.5], sur: 15, dose_gL: 3.8, lots: 29, fermes: 19, src: [21], niv: 'S' },
  huileLots: { v: [0.5, 2.6], unite: 'mL/100 g', src: [21], niv: 'S', note: '29 lots 2015' },
  recolte: { v: 'Cascade récolté tard : plus d\'huile et de thiols libres, plus d\'intensité et d\'agrumes en dry hop', src: [20], niv: 'P' },
  simcoe: { v: '4MMP de Simcoe : récolte 2006 = 1/5 de 2005', facteur: 5, src: [12], niv: 'P' },
  biere4mmp: { v2014: { v: [5.8, 10.4], unite: 'ng/L', src: [20], niv: 'P' }, v2016: { nd: true, src: [20], niv: 'P' }, dose_gL: 3.86 },
  pays: { v: 'thiols du Cascade nettement influencés par le pays ; 4MMP non détecté (Allemagne, Argentine)', src: [11], niv: 'P' },
  contradiction: { v: 'linalol du Cascade : certificats 2024 0,02–0,03 % de l\'huile, fiche Hopsteiner 0,4–0,6 %', src: ['dépôt:coa', 10], niv: 'H' },
  coaThiols: inc('le certificat ne donne pas les thiols : le 4MMP reste celui de la variété', ['dépôt:coa']),
  hsiClasses: { bornes: [0.25, 0.31, 0.40, 0.50, 0.60], perteAlpha: ['0', '≤ 10', '10–21', '21–31', '31–39', '> 39'], src: [25], niv: 'F', note: 'transformation des α selon la classe de HSI (BarthHaas)' },
  hsiPoints: {
    citra: { points: [{ hsi: 0.43, perteAlpha: 15 }, { hsi: 0.61, perteAlpha: 38 }], huile: [2.0, 1.2], src: [25], niv: 'F' },
    galaxy: { points: [{ hsi: 0.42, perteAlpha: 16 }, { hsi: 0.63, perteAlpha: 47 }], huile: [2.3, 1.15], src: [25], niv: 'F' },
  },
  hsiArome: { v: 'perte d\'arôme : un sens seulement (huile −40 à −50 % entre frais et vieilli)', src: [25], niv: 'F' },
};

// L'α de chaque houblon : le lot en stock (STOCK et hopAlpha de prototypes/houblons-v4) et la plage des
// fiches (catalogue du moteur, Beer Maverick). Citra n'est en stock qu'en cryo : sa plage des fiches est
// celle du Citra en pellets.
const PROTO = JSON.parse(fs.readFileSync(REPO + '/prototypes/houblons-v4/data/proto-data.json', 'utf8'));
const alphaDe = (cle, varId) => {
  const s = PROTO.stock.find((x) => x.key === cle), v = PROTO.varieties.find((x) => x.id === varId);
  return {
    lot: s ? { v: s.alpha, de: s.alphaFrom, grammes: s.grams, forme: s.form, src: ['prototypes/houblons-v4 STOCK'], niv: 'F' } : inc('pas de lot de cette forme en stock', ['prototypes/houblons-v4 STOCK']),
    fiches: v && Array.isArray(v.alpha) ? { v: v.alpha, de: 'Beer Maverick ' + (v.bmYear || ''), src: ['prototypes/houblons-v4 catalogue'], niv: 'S' } : inc('aucune plage au catalogue'),
  };
};
D.d5.alpha = {
  citra: { ...alphaDe('beermaverick-citra', 'beermaverick-citra'), stockAutreForme: { cle: 'beermaverick-citra:cryo', v: 24.8, forme: 'cryo', de: 'lu sur l’article' } },
  citraCryo: { ...alphaDe('beermaverick-citra:cryo', 'beermaverick-citra'), note: 'plage des fiches : celle du Citra en pellets' },
  cascade: alphaDe('beermaverick-cascade', 'beermaverick-cascade'),
  galaxy: alphaDe('beermaverick-galaxy', 'beermaverick-galaxy'),
  idaho7: alphaDe('beermaverick-idaho-7', 'beermaverick-idaho-7'),
};

D.d6 = {
  _: 'd6 · Ce que l\'outil sait vraiment : la table « faisable / pas faisable » de H §7.5, ligne par ligne, avec la forme de chaque réponse et une preuve chiffrée tirée de H.',
  types: ['plage', 'sens', 'drapeau', 'inconnu'],
  lignes: [
    { id: 'citra', q: 'Dry hop de Citra ?', houblons: ['citra'], forme: { plage: 'plein' }, dit: 'charge d\'huile, de linalol, de géraniol et de 4MMP ; part retrouvée ; rapport au seuil',
      preuve: [{ t: 'huile à 4 g/L', v: [4, 12], u: 'mL/hL', src: [1], niv: 'H' }, { t: 'linalol introduit', v: [170, 1030], u: 'µg/L', src: [1], niv: 'H' }, { t: '4MMP ÷ seuil', v: [4, 70], inf: '>', u: '×', src: [11, 12, 34], niv: 'H' }] },
    { id: 'galaxy-idaho7', q: 'Et Galaxy ? Idaho 7 ?', houblons: ['galaxy', 'idaho7'], forme: { plage: 'plein', drapeau: 'plein' }, dit: 'huile et linalol en plage ; thiols en classes seulement ; aucun panel entraîné',
      preuve: [{ t: 'Galaxy, huile à 4 g/L', v: [10.4, 13.2], u: 'mL/hL', src: [26], niv: 'H' }, { t: 'Idaho 7, linalol introduit', v: [70, 620], u: 'µg/L', src: [3], niv: 'H' }, { t: 'thiols', v: 'classe « high »', src: [11], niv: 'P' }] },
    { id: 'citra-cascade', q: 'Citra plus fort que Cascade ?', houblons: ['citra', 'cascade'], forme: { plage: 'plein', sens: 'plein' }, dit: 'oui à dose égale (panel OSU à 4 g/L) ; écart chimique chiffré',
      preuve: [{ t: '4MMP libre, Citra ÷ Cascade', v: [3, 15], u: '×', src: [11], niv: 'H' }, { t: 'panel à 4 g/L', v: 'Citra à l\'extrême « intensité, agrumes, tropical »', src: [21], niv: 'S' }] },
    { id: 'citra3-galaxy7', q: 'Citra 3 j puis Galaxy 7 j ?', houblons: ['citra', 'galaxy'], forme: { plage: 'plein', sens: 'plein', inconnu: 'plein' }, dit: 'charges cumulées ; extraction surtout dans les premières 24 h ; ordre et synergie inconnus',
      preuve: [{ t: 'extraction', v: 'l\'essentiel en 24 h', src: [73], niv: 'S' }, { t: 'ordre des ajouts', inconnu: true, raison: 'aucune étude', src: [] }] },
    { id: 'citra3-idaho5', q: 'Citra 3 j puis Idaho 7 5 j ?', houblons: ['citra', 'idaho7'], forme: { plage: 'plein', sens: 'plein', inconnu: 'plein', drapeau: 'plein' }, dit: 'idem ; Idaho 7 riche en géraniol : glissement vers le citronellol si la levure est active',
      preuve: [{ t: 'Idaho 7, géraniol', v: [0.5, 1], u: '% de l\'huile', src: [3], niv: 'F' }, { t: 'Pomona, géraniol → citronellol', v: 'medium', src: [51], niv: 'F' }] },
    { id: 'duree', q: '3 j, 5 j ou 7 j ?', houblons: [], forme: { sens: 'plein', drapeau: 'plein' }, dit: '3 j suffisent ; 5–7 j n\'ajoutent pas d\'arôme mesuré, mais plus de hop creep si la levure est vivante',
      preuve: [{ t: 'linalol extrait en 6 h', v: [43, 89], u: '%', note: 'sans pompe, avec pompe', src: [73], niv: 'S' }, { t: 'hop creep, 7 j à 10 g/L', v: [0.92, 0.92], u: '% vol.', src: [68], niv: 'P' }] },
    { id: '16d', q: 'Pouvoir aromatique sur la 16D ?', houblons: [], forme: { plage: 'plein', inconnu: 'plein', drapeau: 'plein' }, dit: 'charge et rapport au seuil calculables ; perception en stout non documentée ; arôme de houblon faible et facultatif',
      preuve: [{ t: 'seuil du linalol, 5 → 10 % vol.', v: [2.5, 2.5], u: '×', src: [34], niv: 'S' }, { t: 'seuil en stout', inconnu: true, raison: 'aucun mesuré', src: [34] }] },
    { id: 'ic', q: 'Avec un intervalle de confiance ?', houblons: [], forme: { plage: 'plein', inconnu: 'plein' }, dit: 'plages de sources, oui ; intervalle de confiance statistique, non (aucune validation hors Cascade 2015)',
      preuve: [{ t: 'seul intervalle de prédiction, Cascade 2015', v: [-0.95, 1.32], u: 'sur 15', src: [23], niv: 'P' }] },
    { id: 'synergie', q: 'Synergie entre deux houblons ?', houblons: [], forme: { inconnu: 'plein' }, dit: 'mécanismes cités ; aucune pondération',
      preuve: [{ t: 'linalol + géraniol + citronellol', v: 'additifs ou synergiques en mélange modèle', src: [67], niv: 'P' }, { t: 'pondération', inconnu: true, raison: 'aucune transposable', src: [67, 72] }] },
    { id: 'levure', q: 'Ma levure libère des thiols ?', houblons: [], forme: { drapeau: 'plein', plage: 'ordre' }, dit: 'IRC7 et β-lyase quand la fiche les donne ; rendement 0,01–0,35 % sur précurseur synthétique',
      preuve: [{ t: 'conversion, précurseur synthétique', v: [0.01, 0.35], u: '%', src: [42], niv: 'P' }, { t: 'IRC7 tronqué', v: [88, 88], u: '% des souches', inf: '≈', src: [41], niv: 'P' }] },
    { id: 'creep', q: 'Risque de hop creep ?', houblons: [], forme: { drapeau: 'plein' }, dit: 'facteurs connus',
      preuve: [{ t: 'en 2 j', v: [0.39, 0.39], u: '% vol.', src: [35], niv: 'P' }, { t: 'en 7 j à 10 g/L', v: [0.92, 0.92], u: '% vol.', src: [68], niv: 'P' }, { t: 'sans levure vivante', v: 'aucun', src: [68], niv: 'P' }] },
    { id: 'semaines', q: 'Combien de semaines tient l\'arôme ?', houblons: [], forme: { plage: 'plein' }, dit: 'pertes par famille selon la température',
      preuve: [{ t: 'monoterpènes à 20 °C, 470 j', v: [25, 25], u: '% perdus', inf: '≈', src: [30], niv: 'P' }, { t: 'thiols, 6 mois à 5 °C', v: [50, 50], u: '% perdus', inf: '≥', src: [36], niv: 'P' }] },
  ],
  src: ['H §7.5'], niv: 'H',
};

// Ce que le moteur sort désormais (d4/moteur-lot20.ts → moteur-lot20.json) ne reste pas ici : doses et
// jours du cas, fiches de levure, drapeaux géraniol → citronellol, hop creep par souche, preuves de d6.
delete D.d4.ajouts; delete D.d4.identite; delete D.d4.voies.geraniol; delete D.d4.voies.creep; delete D.d4.voies.thiols.levures;
D.d4._moteur = 'doses, jours, fiches de levure et drapeaux : d4/moteur-lot20.json (moteur pouvoir.ts)';
delete D.d5.pays; delete D.d5.biere4mmp; delete D.d5.coaThiols; delete D.d5.idaho7COA;
D.d5._moteur = 'charges, rapports au seuil, lecture face à la 16D, HSI des certificats : d4/moteur-lot20.json';
for (const l of D.d6.lignes) delete l.preuve;
D.d6._moteur = 'preuves chiffrées : fils19-choix/donnees/cas-*.json et verifications.json';
// Écriture : on garde le texte de l'autre auteur tel quel (sa mise en forme compacte) et l'on ajoute
// nos blocs à la fin. Une relance coupe nos blocs précédents (toujours en dernier) ; si une clé de
// l'autre auteur était perdue, on réécrit tout le JSON plutôt que de la perdre.
const MES = ['d4', 'd5', 'd6', 'sources_d4d6'];
const avant = Object.keys(JSON.parse(fs.readFileSync(F, 'utf8')));
let texte = fs.readFileSync(F, 'utf8').replace(/\s*$/, '');
const i = texte.indexOf('\n "d4": ');
if (i >= 0) texte = texte.slice(0, i).replace(/,\s*$/, '') + '\n}';
const bloc = (k, v) => ' ' + JSON.stringify(k) + ': ' + JSON.stringify(v, null, 1).replace(/\n/g, '\n ');
const ajout = [bloc('d4', D.d4), bloc('d5', D.d5), bloc('d6', D.d6), bloc('sources_d4d6', SOURCES)].join(',\n');
let sortie = texte.replace(/\n}$/, ',\n' + ajout + '\n}\n');
const apres = Object.keys(JSON.parse(sortie));
const perdues = avant.filter((k) => !MES.includes(k) && !apres.includes(k));
if (perdues.length) { D.sources_d4d6 = SOURCES; sortie = JSON.stringify(D, null, 1) + '\n'; console.log('réécriture complète (clés après les nôtres : ' + perdues.join(', ') + ')'); }
fs.writeFileSync(F, sortie);
console.log('donnees-h.json complété :', Object.keys(JSON.parse(sortie)).join(', '));
