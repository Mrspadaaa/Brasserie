// Verse les 46 faits de faits-proposes.json dans src/data/levure/faitsSources.json (une fois).
// Ajoute : l'auteur et un libellé court à chaque source, une « lecture » structurée (niveau, POF, g/L, mots), et deux faits
// de TROUS-COMBLES.md qui nourrissent les doutes du critique (Diamond, Samia 2026).
import { readFileSync, writeFileSync, mkdirSync } from 'node:fs';

const entree = 'work/missions/2026-11-09-ecran-levure/savoir/faits-proposes.json';
const sortie = 'src/data/levure/faitsSources.json';
const faits = JSON.parse(readFileSync(entree, 'utf8'));

// Même ordre que faits-proposes.json (id, clé) ; vérifié plus bas.
const lectures = [
  ['fermentis-us05', 'esters', { niveau: 'faible', ppm: 40 }],
  ['fermentis-us05', 'pof', { pof: 'non-declare' }],
  ['fermentis-us05', 'residualSugar', { gL: 11, maltotrioseGL: 3 }],
  ['yeast-fermentis-safale-s-e2-80-9104', 'esters', { niveau: 'faible', ppm: 37, mots: ['fruité', 'floral'] }],
  ['yeast-fermentis-safale-s-e2-80-9104', 'pof', { pof: 'negatif' }],
  ['yeast-fermentis-safale-s-e2-80-9104', 'residualSugar', { gL: 18, maltotrioseGL: 10 }],
  ['yeast-fermentis-safale-be-e2-80-91256', 'esters', { niveau: 'eleve', mots: ['acétate d’isoamyle', 'banane', 'fruité'] }],
  ['yeast-fermentis-safale-be-e2-80-91256', 'esters', { niveau: 'faible', ppm: 20, mots: ['arômes subtils'], ancien: true }],
  ['yeast-fermentis-safale-be-e2-80-91256', 'pof', { pof: 'negatif' }],
  ['yeast-fermentis-safale-be-e2-80-91256', 'residualSugar', { gL: 0, maltotrioseGL: 0 }],
  ['yeast-fermentis-safale-t-e2-80-9158', 'pof', { pof: 'positif', mots: ['girofle', 'poivré'] }],
  ['yeast-fermentis-safale-t-e2-80-9158', 'esters', { niveau: 'eleve', ppm: 37, mots: ['banane'] }],
  ['yeast-fermentis-safale-t-e2-80-9158', 'residualSugar', { gL: 22, maltotrioseGL: 11 }],
  ['yeast-fermentis-saflager-w-34-70', 'esters', { niveau: 'faible', mots: ['floral', 'fruité'] }],
  ['yeast-fermentis-saflager-w-34-70', 'pof', { pof: 'negatif', parAnalogie: true }],
  ['yeast-fermentis-saflager-w-34-70', 'residualSugar', { gL: 5, maltotrioseGL: 2 }],
  ['yeast-fermentis-safale-wb-06', 'pof', { pof: 'positif', mots: ['girofle'] }],
  ['yeast-fermentis-safale-wb-06', 'esters', { niveau: 'moyen', ppm: 78 }],
  ['yeast-fermentis-safale-wb-06', 'residualSugar', { gL: 0 }],
  ['yeast-fermentis-safale-be-134', 'pof', { pof: 'positif', mots: ['girofle'] }],
  ['yeast-fermentis-safale-be-134', 'esters', { niveau: 'moyen', ppm: 45 }],
  ['yeast-fermentis-safale-be-134', 'body', { mots: ['sec', 'très buvable'] }],
  ['yeast-fermentis-safale-be-134', 'residualSugar', { gL: 0 }],
  ['lalbrew-verdant-ipa', 'pof', { pof: 'negatif' }],
  ['lalbrew-verdant-ipa', 'betaLyase', { betaLyase: 'positif' }],
  ['lalbrew-verdant-ipa', 'biotransformation', { thiols: 'eleve', terpenes: 'moyen', tableau: true }],
  ['lalbrew-verdant-ipa', 'body', { mots: ['un peu plus de corps'] }],
  ['lalbrew-nottingham', 'pof', { pof: 'negatif' }],
  ['lalbrew-nottingham', 'esters', { mots: ['neutre', 'légèrement fruité'] }],
  ['lalbrew-nottingham', 'betaLyase', { betaLyase: 'positif', mots: ['expression modérée'] }],
  ['lalbrew-nottingham', 'biotransformation', { thiols: 'eleve', terpenes: 'moyen', tableau: true }],
  ['lalbrew-nottingham', 'biotransformation', { mots: ['le plus de thiols parmi les ales testées'] }],
  ['lalbrew-pomona', 'pof', { pof: 'negatif' }],
  ['lalbrew-pomona', 'biotransformation', { thiols: 'moyen', terpenes: 'eleve', tableau: true }],
  ['lalbrew-belle-saison', 'pof', { pof: 'positif' }],
  ['lalbrew-belle-saison', 'biotransformation', { thiols: 'faible', terpenes: 'eleve', tableau: true }],
  ['lalbrew-belle-saison', 'residualSugar', { mots: ['utilise certaines dextrines'] }],
  ['lalbrew-belle-saison', 'esters', { mots: ['agrumes', 'poivre'] }],
  ['lalbrew-abbaye', 'pof', { pof: 'positif' }],
  ['lalbrew-abbaye', 'esters', { mots: ['tropical', 'épicé', 'banane'] }],
  ['lalbrew-abbaye', 'biotransformation', { thiols: 'faible', terpenes: 'moyen', tableau: true }],
  ['yeast-mangrove-jacks-132015569', 'body', { mots: ['sec', 'net'] }],
  ['yeast-mangrove-jacks-132015569', 'esters', { mots: ['très neutre'] }],
  ['yeast-mangrove-jacks-132040951', 'esters', { mots: ['banane'] }],
  ['yeast-mangrove-jacks-132040951', 'pof', { pof: 'positif', mots: ['girofle'] }],
  ['yeast-mangrove-jacks-132040951', 'body', { mots: ['crémeux', 'soyeux', 'corps plein'] }]
];
if (lectures.length !== faits.length) throw Error(`lectures ${lectures.length} / faits ${faits.length}`);

const auteurDe = (titre) => {
  const m = /^([^,]+),/.exec(titre);
  return m ? m[1].trim() : titre;
};
const typeDe = (titre) => {
  if (/TDS/.test(titre)) return 'TDS';
  if (/tableau|table/i.test(titre)) return 'tableau';
  if (/questions|Q&A/i.test(titre)) return 'Q&R';
  if (/Make our|Make a choice/i.test(titre)) return 'présentation';
  if (/livret|Craft Series/i.test(titre)) return 'livret';
  if (/Samia|OSU/i.test(titre)) return 'Samia 2026';
  return 'fiche';
};
const sourceDe = (f) => {
  const auteur = auteurDe(f.source.title);
  const libelle = /Samia|OSU/i.test(f.source.title) || f.sourceKind === 'study' ? 'Samia 2026' : `${auteur} · ${typeDe(f.source.title)}`;
  return { title: f.source.title, auteur: f.sourceKind === 'study' ? 'Samia et al.' : auteur, reference: f.source.reference, checkedAt: f.source.checkedAt, libelle };
};

const sortieFaits = faits.map((f, i) => {
  const [id, cle, lecture] = lectures[i];
  if (id !== f.yeastId || cle !== f.key) throw Error(`ordre : ${i} ${f.yeastId}/${f.key} contre ${id}/${cle}`);
  return { yeastId: f.yeastId, key: f.key, reported: f.reported, fr: f.fr, sourceKind: f.sourceKind, source: sourceDe(f), lecture };
});

// Hors des 46 : le fait de TROUS-COMBLES.md (§ Biotransformation, source [23]) qui lève le doute « Diamond ».
const samia = sortieFaits.find((f) => f.sourceKind === 'study').source;
const complements = [
  {
    yeastId: 'lalbrew-diamond', key: 'biotransformation',
    reported: 'Lager Diamond : le plus de thiols (2 à 3 fois les ales) ; 3SH de +33 à +72 % entre 15 et 30 °C',
    fr: 'Étude OSU (Samia et al. 2026) : la lager Diamond donne le plus de thiols, 2 à 3 fois les ales testées ; le 3SH monte de 33 à 72 % entre 15 et 30 °C. Résumé Lallemand : l’article n’est pas lu.',
    sourceKind: 'study', source: samia,
    lecture: { thiols: 'eleve', mots: ['le plus de thiols mesurés', '3SH +33 à +72 % de 15 à 30 °C'], etude: true },
    origine: 'work/missions/2026-11-09-ecran-levure/savoir/TROUS-COMBLES.md, § Biotransformation, source 23'
  }
];

mkdirSync('src/data/levure', { recursive: true });
writeFileSync(sortie, JSON.stringify({
  version: 1, verse: '2026-11-09',
  origine: 'work/missions/2026-11-09-ecran-levure/savoir/faits-proposes.json (46 faits) + complements (TROUS-COMBLES.md)',
  note: 'Faits sourcés lus par valeurAxe en plus du catalogue. En cas de conflit, les deux restent : la valeur la mieux sourcée est montrée, l’autre est notée.',
  faits: sortieFaits, complements
}, null, 1) + '\n');
console.log('écrit', sortie, sortieFaits.length, 'faits +', complements.length, 'complément');
