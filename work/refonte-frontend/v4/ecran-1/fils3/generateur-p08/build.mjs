// Construit p08 et p09 (fils de fer lot 3, variantes de p3) : données lues dans le pack au
// moment de construire (aucun chiffre du moteur n'est calculé ici ni dans la page : on
// recopie, on regroupe, on arrondit pour l'affichage).
import fs from 'node:fs';
import path from 'node:path';

const ROOT = 'C:/Users/mrspa/.codex/worktrees/openai-clean-start/Brasserie';
const HERE = path.dirname(new URL(import.meta.url).pathname.replace(/^\/([A-Za-z]:)/, '$1'));
const OUT = ROOT + '/work/refonte-frontend/v4/ecran-1/fils3';
const pack = JSON.parse(fs.readFileSync(ROOT + '/prototypes/houblons-v4/data/pack-mini-protos.json', 'utf8'));

const COURT = { floral: 'Floral', herbal: 'Herbacé', earthy: 'Terreux', citrus: 'Agrumes', tropical: 'Tropicaux', stoneFruit: 'Noyau', pomeFruit: 'Pépins', berries: 'Baies', melon: 'Melon', resin: 'Résineux', spice: 'Épicé', green: 'Végétal' };
const virgule = (s) => String(s).replace(/(\d)\.(\d)/g, '$1,$2');
const S1 = pack.scenarios.S1;
const style = pack.styles['16D'];
const ORD = style.order;
const momentDe = Object.fromEntries(pack.moments.map((m) => [m.code, m]));
// Libellé court du moment pour une puce (le pack donne « 60′ », « whirlpool », « dry hop … »).
const QUAND = { fwh: 'premier moût', b60: '60′', b30: '30′', b15: '15′', b10: '10′', b5: '5′', b0: '0′', wp: '80 °C', dryActive: 'en fermentation', dryPost: 'après fermentation' };
const TYPE = (code) => momentDe[code].type;
const fichesDe = Object.fromEntries(S1.profilFiches.map((h) => {
  const m = Object.fromEntries(h.families.map((f) => [f.family, f]));
  return [h.key, { nom: h.name, niv: ORD.map((id) => ({ n: m[id].level, s: m[id].sources, m: m[id].of })) }];
}));
const stockDe = Object.fromEntries(pack.stock.map((h) => [h.key, h]));

const sigCourt = (liste) => (liste || []).map((x) => ({ titre: x.titre.split(' : ')[0].replace(/^Libération de /, ''), statut: x.statut }));
function ibuPar(liste) {
  return Object.fromEntries((liste || []).map((x) => [x.code, x.modelled ? { ibu: x.ibu.value, g: x.ibuPerGram.value } : null]));
}

function scenario(id) {
  const S = pack.scenarios[id];
  const achatsL = Object.fromEntries((S.achats?.lignes || []).map((l) => [l.additionId, l]));
  const trop = S.ajoutsRapides?.tastingTrop || [];
  const signaux = Object.fromEntries((Array.isArray(S.signauxLevure) ? S.signauxLevure : []).map((x) => [x.additionId, sigCourt(x.signaux)]));
  const lignes = (S.recetteHoublons || []).map((r) => {
    const a = achatsL[r.additionId];
    const manque = r.stock?.missing ?? a?.manque ?? 0;
    const par = ibuPar(r.ibuParMoment);
    const f = fichesDe[r.hopKey];
    const cite = f ? trop.map((fam) => ({ fam, x: f.niv[ORD.indexOf(fam)] })).filter((c) => c.x.n > 0).map((c) => COURT[c.fam].toLowerCase().replace('résineux', 'résine') + ' ' + c.x.s + '/' + c.x.m) : [];
    return {
      id: r.additionId, nom: r.name, cle: r.hopKey, moment: r.moment, g: r.grams, jour: r.dayLabel || null,
      par, signaux: signaux[r.additionId] || null, stock: manque > 0 ? { statut: 'manque', manque: virgule(manque) } : { statut: 'en stock' }, cite,
    };
  });
  const voieDeLabel = Object.fromEntries((S1.voies || []).map((v) => [v.label, v.rank]));
  const statutR = (s) => (s === 'suffisant' ? 'en stock' : s === 'épuisé' ? 'à racheter' : s);
  const rapide = (x) => ({
    nom: x.name, cle: x.key, moment: x.moment, quand: x.momentLabel, g: x.dose.grams, ibu: x.ibuAdded?.value ?? null,
    statut: statutR(x.stock.status), libre: Math.max(0, x.stock.free ?? 0), conflit: (x.tastingConflicts || []).map((f) => COURT[f].toLowerCase()),
    fiche: fichesDe[x.key] ? fichesDe[x.key].niv.map((c) => c.n) : null,
    par: ibuPar(x.ibuParMoment),
    voie: id === 'S1' ? voieDeLabel[`Ajouter ${x.name} · ${x.momentLabel} · ${String(x.dose.grams)} g`] ?? null : null,
  });
  const AR = S.ajoutsRapides || {};
  const rapides = { stock: (AR.disponibles || []).map(rapide), racheter: (AR.epuises || []).map(rapide), acheter: (AR.catalogue || []).map(rapide) };
  const profil = ORD.map((f) => {
    const p = (S.profilBiereCrans || []).find((x) => x.family === f);
    return p ? { crans: p.crans, display: p.display, source: p.source, approx: !!p.approx } : { crans: null, display: 'non situé', source: 'non situé', approx: false };
  });
  const cible = ORD.map((f) => {
    const c = (S.cibleStyleCrans || []).find((x) => x.family === f) || {};
    return { statut: c.status || style.families[f].status, bande: c.bande ? [c.bande.min, c.bande.max] : [0, 3], visee: c.visee ?? null };
  });
  const rs = S.readingSummary || {};
  const counts = rs.counts || {};
  const tasting = S.tasting && S.tasting.date ? S.tasting.date.slice(8, 10) + '.' + S.tasting.date.slice(5, 7) : null;
  const levure = S.yeast ? { nom: S.yeast.name.replace(/\s*\(.*\)\s*$/, ''), statut: S.yeast.status } : null;
  const D = {
    scen: id, nom: S.recipe.name, og: virgule(S.recipe.og.toFixed(3)), ebc: S.recipe.ebc, volume: S.recipe.volumeL,
    style: { code: style.code, ibu: style.ibu }, ibuNote: S.ibuNote ? S.ibuNote.split(' : ').pop().replace(/\.$/, '') : null,
    familles: ORD.map((f) => ({ id: f, nom: COURT[f], long: pack.families.find((x) => x.id === f).name, attendue: style.families[f].status === 'attendue' })),
    lignes, rapides,
    achats: { liste: (S.achats?.aAcheter || []).map((a) => ({ nom: a.name, g: virgule(a.manque) })) },
    profil, cible, degustation: tasting,
    resume: { trop: counts.trop || 0, auStyle: counts['au style'] || 0, nonSitue: counts['non situé'] || 0, phrase: rs.sentence || '' },
    levure, signaux,
    notes: { voies: S.voiesNote || null, profil: S.profilNote || null },
    moments: pack.moments.map((m) => ({ code: m.code, type: m.type, quand: QUAND[m.code] })),
    gouts: { aime: S.gouts?.aime || [], exclut: S.gouts?.exclut || [] },
  };
  if (id === 'S1') {
    const seuil = Object.fromEntries(rs.voies.map((v) => [v.family, v.threshold]));
    D.directions = S.direction.map((d) => {
      const r = rs.voies.find((v) => v.family === d.family);
      return { id: d.family, signe: Math.sign(d.crans), nom: COURT[d.family].toLowerCase(), label: r.label, compte: r.text.split(' : ')[1] };
    });
    D.voies = S.voies.map((v) => {
      const lev = v.type === 'levure';
      const parts = lev ? [v.label.split(' : ')[0], v.actions[0] ? QUAND[v.actions[0].moment] : null, v.actions[0] ? v.actions.map((a) => a.grams).join(' + ') + ' g' : null] : v.label.split(' · ');
      const sert = Object.entries(v.directedEffect).filter(([, x]) => x != null && Math.abs(x) > 0.3).map(([f, x]) => ({ f, x }));
      return {
        rang: v.rank, verbe: lev ? (v.yeastChange ? 'Changer de levure' : 'Houblonner à froid') : parts[0].split(' ')[0], type: v.type,
        levure: v.yeastChange ? v.yeastChange.toName : null, estimee: !!v.estimated, signaux: v.signauxLevure ? sigCourt(v.signauxLevure.signaux) : null, levier: lev,
        houblons: v.actions.map((a) => a.hop), cles: v.actions.map((a) => a.hopKey),
        quand: parts[1], dose: parts[2] ? virgule(parts[2].replace(/\s*\(.*\)$/, '')) : null,
        stock: v.stock.status === 'suffisant' ? 'en stock' : v.stock.status === 'manque' ? 'manque ' + virgule(v.stock.missing.reduce((s, m) => s + m.grams, 0)) + ' g' : v.stock.status,
        ibu: v.ibu.after, derive: v.ibu.drift,
        floral: (v.directedEffect.floral ?? 0) > 0, resine: (v.directedEffect.resin ?? 0) < 0,
        faible: sert.every(({ f, x }) => Math.abs(x) < (seuil[f] ?? 99)),
        apres: ORD.map((f) => { const a = v.profilApresCrans.find((x) => x.family === f); return { crans: a.crans, delta: a.deltaCrans }; }),
        label: v.label,
      };
    });
    D.sansHoublon = Object.fromEntries(S.voiesSansHoublon.parVariete.map((p) => [p.name, {
      retirees: (p.retirees || []).map((l) => voieDeLabel[l]).filter((x) => x != null),
      nouvelles: (p.nouvelles || []).map((x) => ({ rang: x.rank, label: virgule(x.label) })),
    }]));
    D.horsModele = S.horsModele[0].leads.map((l) => l.title);
  }
  // Fiches des houblons (objet 3) : identiques d'un scénario à l'autre.
  D.fiches = Object.values(fichesDe).map((f) => ({ ...f, cle: Object.keys(fichesDe).find((k) => fichesDe[k] === f) }));
  D.stockG = Object.fromEntries(pack.stock.map((h) => [h.name, h.grams]));
  return D;
}

const DATA = { S1: scenario('S1'), S4: scenario('S4'), S5: scenario('S5') };
const PAGES = {
  'index.html': { scen: 'S1', vue: 'etape' },
  'biere.html': { scen: 'S1', vue: 'panneau', partie: 'biere', lentille: 'barres' },
  'biere-radar.html': { scen: 'S1', vue: 'panneau', partie: 'biere', lentille: 'radar' },
  'etat-b.html': { scen: 'S1', vue: 'panneau', partie: 'suggestions', lentille: 'barres', direction: true },
  'suggestions-radar.html': { scen: 'S1', vue: 'panneau', partie: 'suggestions', lentille: 'radar', direction: true },
  'comparer.html': { scen: 'S1', vue: 'panneau', partie: 'comparer', lentille: 'barres' },
  'comparer-radar.html': { scen: 'S1', vue: 'panneau', partie: 'comparer', lentille: 'radar' },
  'cas-k2.html': { scen: 'S4', vue: 'etape' },
  'cas-k3.html': { scen: 'S5', vue: 'etape' },
};
const commun = fs.readFileSync(path.join(HERE, 'commun.js'), 'utf8');
const ids = process.argv.slice(2).length ? process.argv.slice(2) : ['p08', 'p09'];
for (const id of ids) {
  if (!fs.existsSync(path.join(HERE, id + '.html'))) { console.log(id, 'gabarit absent'); continue; }
  const tpl = fs.readFileSync(path.join(HERE, id + '.html'), 'utf8');
  fs.mkdirSync(path.join(OUT, id), { recursive: true });
  for (const [f, P] of Object.entries(PAGES)) {
    const html = tpl
      .replace('/*@DATA@*/', () => 'const D = ' + JSON.stringify(DATA[P.scen]) + ';\nconst PAGE = ' + JSON.stringify({ ...P, fichier: f }) + ';')
      .replace('/*@COMMUN@*/', () => commun);
    fs.writeFileSync(path.join(OUT, id, f), html);
  }
  console.log(id, 'écrit');
}
if (process.env.DUMP) fs.writeFileSync(path.join(HERE, 'data-dump.json'), JSON.stringify(DATA, null, 1));
