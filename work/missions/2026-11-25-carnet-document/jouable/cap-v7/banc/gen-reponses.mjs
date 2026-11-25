// L'IA, c'est moi (concepteur, Opus) : 19 réponses + 1 cas d'essai « 4 offres », au format de la consigne v7 (m4b-v7.html).
// Base : visuel/reponses/<cas>.json (12 cas, jugés au tour 3) et jouable/reponses/<fixture>.json (7 autres) ; chaque ajout v7 est écrit à la main ici.
import fs from 'node:fs';
const M = 'C:/Users/mrspa/.codex/worktrees/openai-clean-start/Brasserie/work/missions/2026-11-25-carnet-document/';
const OUT = M + 'jouable/reponses-v7/';
fs.mkdirSync(OUT, { recursive: true });
const vis = c => JSON.parse(fs.readFileSync(M + 'visuel/reponses/' + c + '.json', 'utf8'));
const jou = f => JSON.parse(fs.readFileSync(M + 'jouable/reponses/' + f + '.json', 'utf8'));
const base = r => Object.assign({ pistes: [], options: [], tache: null, echeance: null, periode: null, chiffres: [], liste: [], retenir: [], faits: [], lectures: [], comparaison: null, resolu: null }, r);
const R = {};
function cas(slug, titre, rep, ecritPar) { R[slug] = { titre, reponse: base(rep), ecritPar }; }

// --- les 12 cas du visuel (titre, réponse) + retouches v7
for (const c of ['assurance', 'bar', 'bouteilles', 'cave', 'chaudiere', 'citra', 'co2', 'ecoulement', 'fete', 'levure', 'pilsner', 'sureau']) {
  const x = vis(c); cas(c, x.carnetTitre, x.reponse, 'visuel/reponses/' + c + '.json, retouché v7');
}
// bar : « 20 L / fût » ; la ligne « prix pro » n'est plus perdue (piste à vérifier, citée)
R.bar.reponse.chiffres[1].label = '/ fût';
R.bar.reponse.pistes.push({ emoji: '💶', texte: 'Prix pro', statut: 'a_verifier', ligne: 2, citation: 'prix pro' });
// bouteilles : le besoin (titre) et les extraits de chaque offre ; l'app calcule le total
R.bouteilles.reponse.comparaison.besoin = { quantite: 600, ligne: 0, citation: '600 bouteilles' };
const [ve, fb, oc] = R.bouteilles.reponse.comparaison.articles;
ve.offre = { prix: '0.42/bt', min: '1200 min' }; fb.offre = { prix: '0.55/bt', livraison: 'livraison 80 CHF' }; oc.offre = { prix: '0.20/bt', max: '400 seulement' };
// citra : le héros dit le geste, avec un picto de lien ; une seule icône par rangée (drapeaux du domaine sur les offres)
R.citra.reponse.tache = { emoji: '🔗', titre: 'Ouvrir les liens' };
R.citra.reponse.options[0].emoji = ''; R.citra.reponse.options[1].emoji = ''; R.citra.reponse.pistes[0].emoji = '🌐';
R.chaudiere.reponse.chiffres = [];
// co2 : « Raccord changé » est fait, pas une piste ni une option
R.co2.reponse.options = []; R.co2.reponse.retenir = [];
R.co2.reponse.chiffres[0].label = '15.11'; R.co2.reponse.chiffres[1].label = '22.11';
R.co2.reponse.faits = [{ emoji: '🔧', texte: 'Raccord changé', ligne: 4, citation: 'Raccord gaz changé' }];
// levure : pas de légende qui répète la valeur
R.levure.reponse.chiffres[0].label = 'US-05';
// pilsner : réglé, avec la ligne qui le dit
R.pilsner.reponse.resolu = { question: 'Commandé 2 sacs, brassin maintenu', ligne: 4, citation: 'Commandé 2 sacs chez l’autre, brassin maintenu' };

// --- les 7 autres exemples (jouable/reponses) + champs v7
const T = {
  frigo: ['zz-frigo-de-garde-en', 'ZZ TEST — frigo de garde en panne'], inspection: ['zz-inspection-electrique-fusible', 'ZZ TEST — inspection électrique, fusible'],
  'levure-lente': ['zz-levure-lente-a-demarrer', 'ZZ TEST — levure lente à démarrer'], odeur: ['zz-odeur-de-soufre-dans', 'ZZ TEST — odeur de soufre dans un lot'],
  pompe: ['zz-pompe-qui-chauffe', 'ZZ TEST — pompe qui chauffe'], vapeur: ['zz-trop-de-vapeur-au', 'ZZ TEST — trop de vapeur au brassage'],
  embouteillage: ['embouteillage-planning', 'ZZ TEST — Embouteillage — station complète (2027)'] };
for (const k in T) { const r = jou(T[k][0]); cas(k, T[k][1], r, 'jouable/reponses/' + T[k][0] + '.json, complété v7'); }
R.frigo.reponse.faits = [{ emoji: '🛢️', texte: 'Fûts déplacés', ligne: 2, citation: 'Fûts déplacés' }];
R.frigo.reponse.chiffres = [Object.assign(R.frigo.reponse.chiffres[0], { label: 'visé 2 °C' })];
R.frigo.reponse.conseil = '❄️ Demande combien de temps tient le compresseur réparé.';
R['levure-lente'].reponse.resolu = { question: 'Monté à 19 °C', ligne: 3, citation: 'Monté à 19 °C, la fermentation démarre le lendemain' };
R.pompe.reponse.resolu = { question: 'Débit réglé à la sortie', ligne: 3, citation: 'on règle le débit à la sortie maintenant. Résolu' };
R.pompe.reponse.retenir = [{ emoji: '🚰', texte: 'Vanne d’entrée ouverte', ligne: 3, citation: 'La vanne d’entrée était à moitié fermée' }];
R.embouteillage.reponse.tache = { emoji: '🍾', titre: 'Faire la station', quand: '01.05.2027', ligne: 2, citation: 'À faire du 01.05.2027' };
R.embouteillage.reponse.resume = 'Faire la station';

// --- cas d'essai : 4 offres (repli en barres horizontales) ; carnet écrit au doigt par le banc
cas('malt4', 'ZZ TEST — 50 kg de malt, 4 offres', {
  emoji: '🌾', categorie: { nom: 'Brasserie', sous: 'Matières premières' }, priorite: 'normale', resume: 'Choisir une offre', etatPropose: 'cherche', genre: 'achat',
  options: [
    { emoji: '🏭', titre: 'Malterie A', cout: '1.90/kg', source: 'notes', ligne: 1, citation: 'Malterie A', conseille: false },
    { emoji: '🌀', titre: 'Moulin B', cout: '1.75/kg', source: 'notes', ligne: 2, citation: 'Moulin B', conseille: false },
    { emoji: '🏪', titre: 'Brouwland', cout: '2.10/kg', source: 'notes', ligne: 3, citation: 'Brouwland', conseille: false },
    { emoji: '🍺', titre: 'Voisin brasseur', cout: '1.50/kg', source: 'notes', ligne: 4, citation: 'Voisin brasseur', conseille: true }],
  comparaison: { criteres: ['💰 Prix/kg', '📦 Quantité', '🚚 Livraison'], besoin: { quantite: 50, ligne: 0, citation: '50 kg' },
    articles: [
      { nom: 'Malterie A', ligne: 1, citation: 'Malterie A', valeurs: [{ texte: '1.90/kg', source: 'notes' }, { texte: 'sac de 25 kg', source: 'notes' }, { texte: '30 CHF', source: 'notes' }], offre: { prix: '1.90/kg', livraison: 'livraison 30 CHF' } },
      { nom: 'Moulin B', ligne: 2, citation: 'Moulin B', valeurs: [{ texte: '1.75/kg', source: 'notes' }, { texte: '100 kg min', source: 'notes' }, { texte: 'offerte', source: 'notes' }], offre: { prix: '1.75/kg', min: '100 kg min', livraison: 'livraison offerte' } },
      { nom: 'Brouwland', ligne: 3, citation: 'Brouwland', valeurs: [{ texte: '2.10/kg', source: 'notes' }, { texte: '?', source: 'notes' }, { texte: '15 CHF', source: 'notes' }], offre: { prix: '2.10/kg', livraison: 'livraison 15 CHF' } },
      { nom: 'Voisin brasseur', ligne: 4, citation: 'Voisin brasseur', valeurs: [{ texte: '1.50/kg', source: 'notes' }, { texte: '40 kg seulement', source: 'notes' }, { texte: '?', source: 'notes' }], offre: { prix: '1.50/kg', max: '40 kg seulement' } }],
    gagnant: [3, null, 1], compromis: 'Brouwland : 50 kg pile, livraison comprise au plus bas.' },
  conseil: '🌾 Le voisin n’a que 40 kg : il en manque 10.',
  lectures: [{ ligne: 1, mot: '30 CHF', type: 'montant' }, { ligne: 3, mot: '15 CHF', type: 'montant' }]
}, 'écrit pour le banc (4 offres)');

// --- Aide (bouton) : les 4 réponses déjà écrites pour m4b, même consigne
const AIDE = { ecoulement: 'zz-ecoulement-qui-fuit', fete: 'zz-fete-de-la-biere', frigo: 'zz-frigo-de-garde-en', vapeur: 'zz-trop-de-vapeur-au' };
const index = {};
for (const k in R) {
  const r = R[k]; const f = k + '.json';
  fs.writeFileSync(OUT + f, JSON.stringify({ titre: r.titre, ecritPar: 'concepteur (Opus), à la main ; aucun appel IA. Source : ' + r.ecritPar, reponse: r.reponse }, null, 1));
  index[r.titre] = { rep: f };
  if (AIDE[k]) { fs.copyFileSync(M + 'jouable/reponses/' + AIDE[k] + '.aide.json', OUT + k + '.aide.json'); index[r.titre].aide = k + '.aide.json'; }
}
fs.writeFileSync(OUT + 'index.json', JSON.stringify(index, null, 1));
console.log(Object.keys(R).length, 'réponses', Object.keys(AIDE).length, 'aides');
