// NOTE.md de sbb7b et sbb5b : idée, retouches du conseil appliquées, nombres recomptés sur le moteur (donnees-sbb.json),
// sorties des contrôles (fichier donné). Usage : node notes-b.mjs <sorties.txt>
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import * as S from './socle-b.mjs';
const ici = path.dirname(fileURLToPath(import.meta.url)), lot = path.resolve(ici, '..');
const sortie = fs.readFileSync(process.argv[2], 'utf8').split('\n').filter((l) => /^(COMMUN|UNE-QUESTION|MOTS|COHERENCE|SANS-FAMILLE)|^sbb[57]b/.test(l)).map((l) => '  - ' + l.trim().slice(0, 200)).join('\n');
const fr = S.fr;
const ligne = (E, c) => `${c.nom} : ${c.score}${c.plage ? ' (plage ' + c.plage.join('–') + ', huiles inconnues)' : ''} ${c.palier} · dose ${c.dose.min !== c.dose.max ? c.dose.min + '–' + c.dose.max : c.dose.grams} g · α ${c.lot ? fr(c.alpha.valeur, 1) + ' (' + c.alpha.source + ')' : c.alphaPl.map((x) => fr(x, Number.isInteger(x) ? 0 : 1)).join('–') + ' (plage des fiches)'} · 46 g = ${c.ibu46.map((x) => fr(x, 1)).filter((x, i, t) => t.indexOf(x) === i).join('–')} IBU · stock ${c.stock.etat === 'à acheter' ? 'à acheter' : fr(c.stock.libre) + ' g' + (c.manque != null ? ', manque ' + c.manque : ', reste ' + c.reste)} · IBU de l’ajout ${c.ibuAjout != null ? fr(c.ibuAjout, 1) : '?'}`;
const recompte = (ids) => ['b60', 'wp'].map((m) => { const E = S.ETATS[m]; return `- ${E.mo.mot} (Nugget 46 g = ${fr(E.nug.ibu, 2)} IBU ; ${E.E.candidats} candidats ; réponse « sans rien acheter » : ${E.rep.nom} ; « si tu achètes » : ${E.achatSur.nom}) :\n` + ids(E).map((c) => '  - ' + ligne(E, c)).join('\n'); }).join('\n');
const COMMUN = `Retouches du conseil (conseil-sb/verdict.md) appliquées : la paire 60′ / whirlpool par la puce de contexte (bouton \`data-edite="moment"\` qui ouvre une feuille « à 60′ / au whirlpool », un toucher) ; « Annuler » à côté de « Remplacer » (D120), recette inchangée ; « ~ » sur chaque score et chaque dose, plage hachurée « ~79–99 » quand une composante manque (Altus, Trident ; calcul de la page comme u4, poids du moteur du moment) ; dose en plage pour un houblon sans lot (Magnat ~37–54 g), jamais « 44 g » sec ; α du lot, sinon la plage des fiches (Magnat α 11–16, pas « 13,5 % ») ; stock et manque sur chaque ligne (« 30 g · −15 ») ; « Si tu achètes : … » ; « autres 83 % » de Nelson Sauvin dans les deux états ; aucun poids (« ×0,6 ») à l'écran : la méthode est derrière « ? » ; à 60′ la composante d'arôme s'appelle « rien d'étranger », au whirlpool « arôme » (contexte du moteur). Chaque ligne porte \`data-ibu46\`, \`data-dose\`, \`data-alpha\` (D124).
Baseline suivie, aucun écart (pictos au trait, épicé p-spice, couleurs des familles, usage en mot, stock en badge, au style par défaut, croix, légende « ? », fiche à l'appui long, thème blanc).
Données : \`sbb7b/moteur-sbb.ts\` → \`sbb7b/donnees-sbb.json\` (moteur du parcours en direct : \`remplacants\` style 16D en stock d'abord, \`substitutes\` pour la fiabilité et le rangement « cher pour amériser », \`lireBiere\` après \`remplacer\`). Générateur \`sbb7b/generer-b.mjs\`, socle \`sbb7b/socle-b.mjs\`, captures \`sbb7b/capturer-b.mjs\`.`;
const CAP = (id) => `\`captures/${id}-60.png\`, \`captures/${id}-whirlpool.png\` (toucher sur la puce, puis « au whirlpool »), \`captures/${id}-feuille-moment.png\`, \`captures/${id}-page.png\`, \`captures/${id}-whirlpool-page.png\`, \`captures/${id}-geste.png\` (toucher sur Galaxy : réponse, ma bière et pied changent), \`captures/${id}-fiche.png\`.`;
const notes = {
  sbb7b: { titre: 'la cible (chaude, la réponse en figure)', idee: 'Nugget au centre, chaque remplaçant à la distance de son score ; à gauche ton stock, à droite l’achat ; la réponse est le point cerclé. Les points sont des éléments du DOM ; les boîtes, en colonnes et reliées à leur point, sont les boutons ; chacune dit α, dose « ~ », score « ~ », stock et manque.',
    plus: 'Mesure au DOM (capturer-b.mjs) : 16 éléments à 60′ (8 points, 8 boîtes), 18 au whirlpool (9 et 9), aucun chevauchement ; Magnat, Trident et Yeoman ne se touchent plus (angles −60° à 60°, rayon plancher hors du disque de Nugget). Ton stock montré : les trois premiers du moteur, la réponse et Nelson Sauvin.',
    casse: 'L’échelle de distance se resserre sous 80 (l’ordre est gardé, les cercles 80, 65, 50 donnent l’échelle) ; les traits de liaison se croisent un peu au whirlpool ; bas de page vide sous « Si tu achètes ».',
    ids: (E) => { const g = [...new Set([...E.cands.filter((c) => c.stock.etat === 'en stock').slice(0, 3), E.rep, E.C['nelson-sauvin'], ...E.cands.filter((c) => c.stock.etat === 'en stock')])]; return [...g.slice(0, Math.max(4, new Set([...g.slice(0, 3), E.rep, E.C['nelson-sauvin']]).size)), ...E.achat.slice(0, 4)]; } },
  sbb5b: { titre: 'trois raisons (tiède)', idee: 'Trois cartes qui répondent chacune à une contrainte : « Sans rien acheter » (le premier du moteur dont le stock suffit), « Le moins de matière » (sinon « Le plus proche, stock court » quand c’est le même houblon), « Si tu achètes » (le plus proche, tout connu). Au whirlpool, Nelson Sauvin a sa ligne, avec « autres 83 % ».',
    plus: 'À 60′ : Nelson Sauvin ~62 g, Galaxy ~35 g, Magnat ~37–54 g (α 11–16). Au whirlpool la réponse change : Citra cryo ~24 g (~63 partiel) est à la fois sans achat et le moins de matière ; Target ~86 est le plus proche mais 5 g (−48) ; Falconer’s Flight ~50–63 g si tu achètes. Les houblons que le moteur range « cher pour amériser » à 60′ (Citra cryo, Target) ne sont pas proposés comme « moins de matière ».',
    casse: 'Trois cartes au même gabarit ; les deux tris (« moins de matière », « plus proche du stock ») sont faits par la page sur les données du moteur ; le composé du score (amertume, huiles, arôme) n’est plus à l’écran, seulement dans la fiche et la légende.',
    ids: (E) => { const d = E.cands.filter((c) => c.stock.etat === 'en stock' && c.stock.suffisant && !c.deconseille).sort((a, b) => a.dose.grams - b.dose.grams); const l = [E.rep, d[0] && d[0].id !== E.rep.id ? d[0] : E.cands.find((c) => c.stock.etat === 'en stock'), E.achatSur]; if (!l.includes(E.C['nelson-sauvin'])) l.push(E.C['nelson-sauvin']); return l; } },
};
for (const [id, n] of Object.entries(notes)) {
  const md = `# ${id} · Substituer, passe 2 de ${id.slice(0, -1)} : ${n.titre}

Chaleur : ${id === 'sbb7b' ? 'chaude' : 'tiède'} (passe 2). Question : « Lequel à la place de Nugget ? » ; facteur libre : le remplaçant ; contexte : la stout 16D, Nugget 46 g à 60′ ou au whirlpool (la puce, un toucher), la règle « même IBU ».

- **Idée** : ${n.idee}
- **Ce qui tient** : ${n.plus}
- **Ce qui casse** : ${n.casse}

${COMMUN}

## Nombres recomptés sur le moteur (lignes montrées)
${recompte(n.ids)}

## Captures
${CAP(id)}

## Contrôles (G2 à G5 de sb-passe2, plus D100)
${sortie}
`;
  fs.writeFileSync(path.join(lot, id, 'NOTE.md'), md);
  console.log(id, md.length);
}
