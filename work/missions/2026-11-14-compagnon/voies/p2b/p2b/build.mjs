// Assemble etat.html de p2b (passe 2 de s2a). Page statique : aucun appel réseau, classes préfixées p2b-.
// Usage : node work/missions/2026-11-14-compagnon/voies/p2b/p2b/build.mjs
import { writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const ICI = dirname(fileURLToPath(import.meta.url));
const NB = ' ';

// Icônes au trait, une seule famille (tracés lucide).
const I = {
  etincelle: '<path d="M9.937 15.5A2 2 0 0 0 8.5 14.063l-6.135-1.582a.5.5 0 0 1 0-.962L8.5 9.936A2 2 0 0 0 9.937 8.5l1.582-6.135a.5.5 0 0 1 .963 0L14.063 8.5A2 2 0 0 0 15.5 9.937l6.135 1.581a.5.5 0 0 1 0 .964L15.5 14.063a2 2 0 0 0-1.437 1.437l-1.582 6.135a.5.5 0 0 1-.963 0z"/>',
  bulle: '<path d="M7.9 20A9 9 0 1 0 4 16.1L2 22Z"/>',
  cloche: '<path d="M10.268 21a2 2 0 0 0 3.464 0"/><path d="M3.262 15.326A1 1 0 0 0 4 17h16a1 1 0 0 0 .74-1.673C19.41 13.956 18 12.499 18 8A6 6 0 0 0 6 8c0 4.499-1.411 5.956-2.738 7.326"/>',
  plus: '<circle cx="12" cy="12" r="1"/><circle cx="19" cy="12" r="1"/><circle cx="5" cy="12" r="1"/>',
  ok: '<path d="M20 6 9 17l-5-5"/>',
  x: '<path d="M18 6 6 18"/><path d="m6 6 12 12"/>',
  loupe: '<circle cx="11" cy="11" r="8"/><path d="m21 21-4.3-4.3"/>',
  stylo: '<path d="M12 20h9"/><path d="M16.376 3.622a1 1 0 0 1 3.002 3.002L7.368 18.635a2 2 0 0 1-.855.506l-2.872.838a.5.5 0 0 1-.62-.62l.838-2.872a2 2 0 0 1 .506-.854z"/>',
  bouclier: '<path d="M20 13c0 5-3.5 7.5-7.66 8.95a1 1 0 0 1-.67-.01C7.5 20.5 4 18 4 13V6a1 1 0 0 1 1-1c2 0 4.5-1.2 6.24-2.72a1.17 1.17 0 0 1 1.52 0C14.51 3.81 17 5 19 5a1 1 0 0 1 1 1z"/><path d="m9 12 2 2 4-4"/>',
  livre: '<path d="M12 7v14"/><path d="M3 18a1 1 0 0 1-1-1V4a1 1 0 0 1 1-1h5a4 4 0 0 1 4 4 4 4 0 0 1 4-4h5a1 1 0 0 1 1 1v13a1 1 0 0 1-1 1h-6a3 3 0 0 0-3 3 3 3 0 0 0-3-3z"/>',
  calcul: '<rect width="16" height="20" x="4" y="2" rx="2"/><line x1="8" x2="16" y1="6" y2="6"/><line x1="16" x2="16" y1="14" y2="18"/><path d="M16 10h.01"/><path d="M12 10h.01"/><path d="M8 10h.01"/><path d="M12 14h.01"/><path d="M8 14h.01"/><path d="M12 18h.01"/><path d="M8 18h.01"/>',
  drapeau: '<path d="M4 22V4a1 1 0 0 1 .4-.8A6 6 0 0 1 8 2c3 0 5 2 7.333 2q2 0 3.067-.8A1 1 0 0 1 20 4v10a1 1 0 0 1-.4.8A6 6 0 0 1 16 16c-3 0-5-2-8-2a6 6 0 0 0-4 1.528"/>',
  journal: '<path d="M2 6h4"/><path d="M2 10h4"/><path d="M2 14h4"/><path d="M2 18h4"/><rect width="16" height="20" x="4" y="2" rx="2"/><path d="M16 2v20"/>',
  envoi: '<path d="M14.536 21.686a.5.5 0 0 0 .937-.024l6.5-19a.496.496 0 0 0-.635-.635l-19 6.5a.5.5 0 0 0-.024.937l7.93 3.18a2 2 0 0 1 1.112 1.11z"/><path d="m21.854 2.147-10.94 10.939"/>',
  horsligne: '<path d="M12 20h.01"/><path d="M8.5 16.429a5 5 0 0 1 7 0"/><path d="M5 12.859a10 10 0 0 1 5.17-2.69"/><path d="M19 12.859a10 10 0 0 0-2.007-1.523"/><path d="M2 8.82a15 15 0 0 1 4.177-2.643"/><path d="M22 8.82a15 15 0 0 0-11.288-3.764"/><path d="m2 2 20 20"/>',
  triangle: '<path d="m21.73 18-8-14a2 2 0 0 0-3.48 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.73-3"/><path d="M12 9v4"/><path d="M12 17h.01"/>',
  info: '<circle cx="12" cy="12" r="10"/><path d="M12 16v-4"/><path d="M12 8h.01"/>',
  octogone: '<path d="M12 16h.01"/><path d="M12 8v4"/><path d="M15.312 2a2 2 0 0 1 1.414.586l4.688 4.688A2 2 0 0 1 22 8.688v6.624a2 2 0 0 1-.586 1.414l-4.688 4.688a2 2 0 0 1-1.414.586H8.688a2 2 0 0 1-1.414-.586l-4.688-4.688A2 2 0 0 1 2 15.312V8.688a2 2 0 0 1 .586-1.414l4.688-4.688A2 2 0 0 1 8.688 2z"/>',
  horloge: '<circle cx="12" cy="12" r="10"/><path d="M12 6v6l4 2"/>',
  bas: '<path d="m6 9 6 6 6-6"/>',
  gauche: '<path d="m15 18-6-6 6-6"/>',
  droite: '<path d="m9 18 6-6-6-6"/>',
  zero: '<path d="M3 12a9 9 0 1 0 9-9 9.75 9.75 0 0 0-6.74 2.74L3 8"/><path d="M3 3v5h5"/>',
  relancer: '<path d="M3 12a9 9 0 0 1 9-9 9.75 9.75 0 0 1 6.74 2.74L21 8"/><path d="M21 3v5h-5"/><path d="M21 12a9 9 0 0 1-9 9 9.75 9.75 0 0 1-6.74-2.74L3 16"/><path d="M8 16H3v5"/>',
  thermo: '<path d="M14 4v10.54a4 4 0 1 1-4 0V4a2 2 0 0 1 4 0Z"/>',
  gouttes: '<path d="M7 16.3c2.2 0 4-1.83 4-4.05 0-1.16-.57-2.26-1.71-3.19S7.29 6.75 7 5.3c-.29 1.45-1.14 2.84-2.29 3.76S3 11.1 3 12.25c0 2.22 1.8 4.05 4 4.05z"/><path d="M12.56 6.6A10.97 10.97 0 0 0 14 3.02c.5 2.5 2 4.9 4 6.5s3 3.5 3 5.5a6.98 6.98 0 0 1-11.91 4.97"/>',
  purge: '<path d="M12 17V3"/><path d="m6 11 6 6 6-6"/><path d="M19 21H5"/>',
  feuille: '<path d="M11 20A7 7 0 0 1 9.8 6.1C15.5 5 17 4.48 19 2c1 2 2 4.18 2 8 0 5.5-4.78 10-10 10Z"/><path d="M2 21c0-3 1.85-5.36 5.08-6C9.5 14.52 12 13 13 12"/>',
  porte: '<path d="M19 7V4a1 1 0 0 0-1-1H5a2 2 0 0 0 0 4h15a1 1 0 0 1 1 1v4h-3a2 2 0 0 0 0 4h3a1 1 0 0 0 1-1v-2a1 1 0 0 0-1-1"/><path d="M3 5v14a2 2 0 0 0 2 2h15a1 1 0 0 0 1-1v-4"/>',
  liste: '<path d="m3 17 2 2 4-4"/><path d="m3 7 2 2 4-4"/><path d="M13 6h8"/><path d="M13 12h8"/><path d="M13 18h8"/>',
  camembert: '<path d="M21 12c.552 0 1.005-.449.95-.998a10 10 0 0 0-8.953-8.951c-.55-.055-.998.398-.998.95v8a1 1 0 0 0 1 1z"/><path d="M21.21 15.89A10 10 0 1 1 8 2.83"/>',
  colis: '<path d="M11 21.73a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73z"/><path d="M12 22V12"/><path d="m3.3 7 7.703 4.734a2 2 0 0 0 1.994 0L20.7 7"/>',
  calendrier: '<path d="M8 2v4"/><path d="M16 2v4"/><rect width="18" height="18" x="3" y="4" rx="2"/><path d="M3 10h18"/>',
  document: '<path d="M15 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7Z"/><path d="M14 2v4a2 2 0 0 0 2 2h4"/><path d="M16 13H8"/><path d="M16 17H8"/>',
  pause: '<circle cx="12" cy="12" r="10"/><line x1="10" x2="10" y1="15" y2="9"/><line x1="14" x2="14" y1="15" y2="9"/>',
  jauge: '<path d="m12 14 4-4"/><path d="M3.34 19a10 10 0 1 1 17.32 0"/>',
  reglages: '<line x1="21" x2="14" y1="4" y2="4"/><line x1="10" x2="3" y1="4" y2="4"/><line x1="21" x2="12" y1="12" y2="12"/><line x1="8" x2="3" y1="12" y2="12"/><line x1="21" x2="16" y1="20" y2="20"/><line x1="12" x2="3" y1="20" y2="20"/><line x1="14" x2="14" y1="2" y2="6"/><line x1="8" x2="8" y1="10" y2="14"/><line x1="16" x2="16" y1="18" y2="22"/>',
  fleche: '<path d="M7 7h10v10"/><path d="M7 17 17 7"/>',
  corbeille: '<path d="M3 6h18"/><path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6"/><path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2"/>',
  telephone: '<rect width="14" height="20" x="5" y="2" rx="2" ry="2"/><path d="M12 18h.01"/>',
  nuage: '<path d="m2 2 20 20"/><path d="M5.782 5.782A7 7 0 0 0 9 19h8.5a4.5 4.5 0 0 0 1.307-.193"/><path d="M21.532 16.5A4.5 4.5 0 0 0 17.5 10h-1.79A7.008 7.008 0 0 0 10 5.07"/>',
  panneau: '<rect width="18" height="18" x="3" y="3" rx="2"/><path d="M15 3v18"/>',
  plusrond: '<path d="M5 12h14"/><path d="M12 5v14"/>',
  moins: '<path d="M5 12h14"/>',
};
const ic = (n, s = 16, c = '') => `<svg class="p2b-ic${c ? ' ' + c : ''}" width="${s}" height="${s}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${I[n]}</svg>`;
// Une mesure : le nombre en mono, l'unité collée par une espace insécable, jamais coupée.
const m = (v, u) => `<span class="p2b-n"><span class="p2b-mono">${v}</span>${u ? NB + u : ''}</span>`;
const avap = (a, b, u) => `<span class="p2b-n"><s class="p2b-mono">${a}</s> → <span class="p2b-mono">${b}</span>${u ? NB + u : ''}</span>`;

// ——— Fond de l'écran sous la feuille ———
function fond(kind = 'brassin', temp = '19') {
  if (kind === 'finances') return `<div class="p2b-fond p2b-fond-fin" aria-hidden="true"><div class="p2b-fond-b">Finances</div><div class="p2b-fond-t"><i></i><i></i><i></i></div><div class="p2b-fond-big">${m('2 184,60', 'CHF')}</div><div class="p2b-fond-r"></div><div class="p2b-fond-r"></div><div class="p2b-fond-bt">Vérifier mes opérations</div><div class="p2b-fond-r"></div></div><div class="p2b-scrim"></div>`;
  return `<div class="p2b-fond" aria-hidden="true"><div class="p2b-fond-b">Brassin 31 · New England IPA</div><div class="p2b-fond-t"><i></i><i></i><i></i></div><div class="p2b-fond-big${temp !== '19' ? ' p2b-fond-chaud' : ''}">${m(temp, '°C')}</div><div class="p2b-fond-r"></div><div class="p2b-fond-r"></div><div class="p2b-fond-r"></div><div class="p2b-fond-r"></div></div><div class="p2b-scrim"></div>`;
}

// ——— En-tête : une rangée ———
function tete({ ctx = 'Brassin 31 · New England IPA · J+1', titre = 'Compagnon', notif = false, retour = false, fin = false, pastille = '1' } = {}) {
  const lead = retour
    ? `<button class="p2b-bt-ic" aria-label="Retour au fil">${ic('gauche', 18)}</button>`
    : `<span class="p2b-logo${fin ? ' p2b-logo-fin' : ''}">${ic(fin ? 'porte' : 'etincelle', 16)}</span>`;
  const droite = retour ? '' : `<button class="p2b-bt-ic" aria-label="Mes conversations, ${pastille} réponse prête">${ic('bulle', 18)}${pastille ? `<span class="p2b-pastille-n">${pastille}</span>` : ''}</button><button class="p2b-bt-ic${notif ? ' p2b-on' : ''}" aria-label="Me notifier à la réponse" aria-pressed="${notif}">${ic('cloche', 18)}</button><button class="p2b-bt-ic" aria-label="Plus : limites, repartir à zéro">${ic('plus', 18)}</button>`;
  return `<header class="p2b-tete">${lead}<div class="p2b-tete-tx"><b>${titre}</b><span>${ctx}</span></div>${droite}</header>`;
}

// ——— Pied : le champ, le mode dans le champ (jamais pendant la lecture d'une réponse) ———
function pied({ champ = 'Décris ce que tu observes…', plein = false, mode = 'Auto', duree = '15–30 s', sansMode = false, hors = false, actif = false, long = false, ligne = '', desactive = false } = {}) {
  const chip = sansMode ? '' : `<button class="p2b-chip" data-booster="mode-duree" aria-label="Mode ${mode}, ${duree}"><b>${mode}</b><span class="p2b-mono">${duree}</span>${ic('bas', 12)}</button>`;
  const ban = hors ? `<div class="p2b-pied-ban">${ic('horsligne', 14)}<span>Hors ligne : ce que tu écris reste sur ce téléphone.</span></div>` : '';
  return `<footer class="p2b-pied${hors ? ' p2b-hors' : ''}">${ban}${ligne}<div class="p2b-saisie"><div class="p2b-champ${plein ? ' p2b-plein' : ''}${long ? ' p2b-long' : ''}${desactive ? ' p2b-champ-off' : ''}"><span class="p2b-champ-tx" role="textbox" aria-label="Ta question">${champ}</span>${chip}</div><button class="p2b-envoi${actif ? ' p2b-envoi-on' : ''}"${actif ? '' : ' disabled'} aria-label="Envoyer">${ic('envoi', 18)}</button></div></footer>`;
}

function tel(cadre, lib, sous, inner, { fondKind = 'brassin', temp = '19', classe = '' } = {}) {
  return `<div class="p2b-pl-col"><p class="p2b-pl-lib">${lib} <span>· ${sous}</span></p>
<div class="p2b-tel" data-cadre="${cadre}">${fond(fondKind, temp)}<section class="p2b-feuille${classe ? ' ' + classe : ''}" aria-label="Compagnon brasseur"><div class="p2b-poignee"></div>${inner}</section></div></div>`;
}

// ——— Frise d'étapes : l'idée de s2a, réemployée partout où le temps ou la panne compte ———
function frise(etapes, petite = false) {
  const icone = { fait: 'ok', casse: 'x' };
  return `<ol class="p2b-frise${petite ? ' p2b-frise-p' : ''}">${etapes.map(([etat, ico, nom, sous = '', t = '']) => `<li class="p2b-${etat}"><span class="p2b-pt">${ic(icone[etat] ?? ico, 12)}</span><span>${nom}${sous ? `<small>${sous}</small>` : ''}</span><span class="p2b-t">${t && !t.includes('<') ? m(t) : t}</span></li>`).join('')}</ol>`;
}

const niveau = (k) => ({
  info: `<span class="p2b-niv p2b-niv-info">${ic('info', 12)}Info</span>`,
  att: `<span class="p2b-niv p2b-niv-att">${ic('triangle', 12)}Attention</span>`,
}[k]);
const caseC = (on) => `<span class="p2b-case${on ? '' : ' p2b-case-off'}" role="checkbox" aria-checked="${on}">${on ? ic('ok', 14) : ''}</span>`;

// ——— Cadres ———
const Q1 = 'La fermentation est à 19 °C depuis 36 h et la pression monte doucement : que faire ?';
const Q2 = 'Dégustation J+8 : ça sent l’herbe coupée, que faire ?';

const accueil = tel('accueil', 'Accueil', 'depuis le jour de brassage, fermentation J+1 (36 h)', `${tete()}
<div class="p2b-fil">
<div><p class="p2b-salut">On regarde ça ensemble.</p><p class="p2b-salut-s">Agir, mesurer ou attendre : je te le dis en un geste.</p></div>
<div class="p2b-lis" data-booster="lu-avant"><span class="p2b-lis-t">Je lis, à chaque question</span><span class="p2b-pil">${ic('livre', 12)}Recette</span><span class="p2b-pil">${ic('thermo', 12)}Brassin 31</span><span class="p2b-pil">${ic('journal', 12)}Journal</span><span class="p2b-pil">${ic('colis', 12)}Stock</span></div>
<div class="p2b-lu" data-booster="frise-brassin">
<div class="p2b-lu-h"><span>Fermentation <b>J+1</b></span><span>${m('19', '°C')} · depuis ${m('36', 'h')}</span></div>
<div class="p2b-dh">
<div class="p2b-dh-axe"><span class="p2b-dh-auj" style="left:10%"></span>
<span class="p2b-dh-pt" style="left:20%"></span><span class="p2b-dh-pt" style="left:60%"></span><span class="p2b-dh-pt" style="left:90%"></span></div>
<div class="p2b-dh-lb"><span style="left:20%"><b>Citra</b>demain · ${m('85', 'g')}</span><span style="left:60%"><b>Galaxy</b>J+6 · ${m('43', 'g')}</span><span style="left:90%"><b>Mosaic</b>J+9 · ${m('43', 'g')}</span></div>
</div>
<div class="p2b-lu-pied"><span>Dry hop prévu ${m('171', 'g')} · ${m('9,0', 'g/L')} · ${m('19', 'L')}</span><span>Densité à J+4</span></div>
</div>
<div class="p2b-sugg" data-booster="mode-conseille"><p class="p2b-sugg-t">En fermentation, on me demande souvent</p>
<button>${ic('fleche', 14)}<span>La pression monte : je purge ?</span><em>Rapide</em></button>
<button>${ic('fleche', 14)}<span>Densité à J+4 : la levure a fini ?</span><em>Auto</em></button>
<button>${ic('fleche', 14)}<span>Galaxy : je garde 43${NB}g ?</span><em>Auto</em></button>
<button>${ic('fleche', 14)}<span>Combien de jours de garde ?</span><em>Approfondi</em></button></div>
<div class="p2b-ail" data-booster="fil-statuts"><p class="p2b-sugg-t">Tourne ailleurs</p>
<button class="p2b-ail-r"><span class="p2b-ail-pt p2b-ail-cours"></span><span>Brassin 30 · Blonde de garde</span><span class="p2b-mono">0:40</span></button>
<button class="p2b-ail-r"><span class="p2b-ail-pt"></span><span>Mes finances</span><span class="p2b-ail-ok">réponse prête</span></button></div>
</div>${pied({ ligne: `<button class="p2b-lim" aria-label="Limites IA">${ic('jauge', 12)}<span>Aujourd’hui ${m('4')} sur ${m('120')} · mois ${m('2,10')} sur ${m('15', 'CHF')}</span>${ic('droite', 12)}</button>` })}`);

// Jauge de durée, échelle linéaire 0 à 3:40 (220 s) : 1:00 = 27,3 %, 3:00 = 81,8 %, 2:29 = 67,7 %.
const jauge = `<div class="p2b-duree" data-booster="jauge-duree">
<div class="p2b-piste"><span class="p2b-zone" style="left:27.3%;width:54.5%"></span><span class="p2b-rempli" style="width:67.7%"></span><span class="p2b-aig" style="left:67.7%"></span></div>
<div class="p2b-echelle"><span style="left:0">0</span><span style="left:27.3%">1:00</span><span style="left:81.8%">3:00</span><span style="left:100%">3:40</span></div>
<div class="p2b-duree-l"><span class="p2b-zone-l"></span>habituel en Approfondi : <b>1 à 3 min</b> · au plus 3:40</div></div>`;

const attente = tel('attente', 'Attente', '2:29 en Approfondi, une 2e question en file', `${tete({ notif: true })}
<div class="p2b-fil">
<div class="p2b-q">${Q1}</div>
<div class="p2b-att" data-booster="frise-etapes">
<div class="p2b-att-h"><span class="p2b-chrono">2:29</span><span class="p2b-att-tx"><b>Je prépare ta réponse</b><small>Approfondi · envoyée à 22:04</small></span></div>
<div class="p2b-frise-cap"><span>Étape</span><span>durée</span></div>
${frise([
  ['fait', 'livre', 'Lire le brassin et le journal', '', m('4', 's')],
  ['fait', 'calcul', 'Calculer', 'recette, IBU, dry hop, pH', m('37', 's')],
  ['encours', 'loupe', 'Chercher des sources', '2 lues · en cours', `${m('1', 'min')} ${m('48', 's')}`],
  ['avenir', 'stylo', 'Rédiger'],
  ['avenir', 'bouclier', 'Relire', 'calculs refaits'],
])}
${jauge}</div>
<div class="p2b-deja" data-booster="deja-calcule"><span class="p2b-deja-t">${ic('calcul', 14)}Déjà calculé</span><span>Dry hop ${m('9,0', 'g/L')} · prochain apport Citra J+2, demain</span></div>
<div class="p2b-marge">${ic('horloge', 14)}<span>Rien à faire avant le Citra de demain : la réponse a le temps.</span></div>
<div class="p2b-file">${ic('horloge', 16)}<span>Et combien de jours de garde ?<small>En file · partira après celle-ci</small></span><button class="p2b-bt-ic" aria-label="Retirer de la file">${ic('x', 16)}</button></div>
<div class="p2b-fermer"><button class="p2b-prim p2b-large">${ic('cloche', 14)}Fermer · me notifier</button><small>La réponse reste dans ce fil, tu peux continuer ailleurs.</small></div>
</div>${pied({ champ: 'Ajoute une question…', mode: 'Approfondi', duree: '1–3 min' })}`);

// La pile du dry hop : ce qui est fait reste gris, seul le dernier apport peut bouger.
const pile = (large = false) => `<div class="p2b-pile${large ? ' p2b-pile-lg' : ''}" data-booster="pile-dryhop">
<div class="p2b-pile-b"><i class="p2b-pf" style="flex:85">Citra 85</i><i class="p2b-pf" style="flex:43">Galaxy 43</i><i class="p2b-pv" style="flex:43">Mosaic 43</i></div>
<div class="p2b-pile-l"><span>${m('171', 'g')} · ${m('9,0', 'g/L')} prévus</span><span>si coché : ${m('163', 'g')} · ${m('8,6', 'g/L')}</span></div></div>`;

const reponseCorps = (large = false) => `<article class="p2b-rep">
<div class="p2b-rep-h">${niveau('att')}<span>22:07</span></div>
<h2 class="p2b-rep-t">Herbacé : écourte le contact du dry hop.</h2>
<div class="p2b-geste p2b-geste-att">
<div class="p2b-geste-r">${ic('purge', 18)}<span><b>Ce soir</b> · purge les pellets du Galaxy</span></div>
<div class="p2b-geste-r">${ic('feuille', 18)}<span><b>Mosaic J+9</b> · contact <span class="p2b-gros">${avap('3', '2', 'j')}</span></span></div></div>
<button class="p2b-pli"><span><b>Pourquoi</b> · contact long à ${m('19', '°C')} ; ${m('9,0', 'g/L')} reste une dose usuelle de NEIPA, ce n’est pas la dose</span>${ic('bas', 16)}</button>
<div class="p2b-ctrl" data-booster="controle-journal">${ic('drapeau', 16)}<span>Goût à J+10, avant la garde<small>L’herbacé doit reculer.</small></span><button class="p2b-bt2">${ic('journal', 14)}Au journal</button></div>
<div class="p2b-prop" data-booster="avant-apres">
<div class="p2b-prop-t"><span>Proposition pour le brassin 31</span><span>coche, puis valide</span></div>
<div class="p2b-mod">${caseC(true)}<span class="p2b-mod-n">Contact Mosaic J+9</span><span class="p2b-av">${avap('3', '2', 'j')}</span></div>
<div class="p2b-mod">${caseC(true)}<span class="p2b-mod-n">Température du dry hop</span><span class="p2b-av">${avap('19', '17', '°C')}</span></div>
<div class="p2b-mod p2b-mod-fac">${caseC(false)}<span class="p2b-mod-n">Mosaic J+9 <small>facultatif</small></span><span class="p2b-av">${avap('43', '35', 'g')}</span></div>
${pile(large)}
<div class="p2b-actions"><button class="p2b-bt2">Écarter</button><button class="p2b-prim">${ic('ok', 14)}Valider 2 modifications</button></div></div>
<button class="p2b-pli p2b-pli-relu">${ic('bouclier', 14)}<span>Relu deux fois · calculs refaits · ${m('3')} sources</span>${ic('bas', 16)}</button>
</article>`;

const reponse = tel('reponse', 'Réponse', 'attention, proposition à cocher, détails repliés', `${tete({ ctx: 'Brassin 31 · New England IPA · J+8' })}
<div class="p2b-fil p2b-fil-serre"><div class="p2b-q p2b-q-1">${Q2}</div>${reponseCorps()}</div>
${pied({ champ: 'Une suite ? Et la garde, combien de jours ?', sansMode: true })}`);

const erreur = tel('erreur', 'Erreur', 'hors ligne : la question part au retour du réseau ; dessous, l’erreur serveur', `${tete({ pastille: '' })}
<div class="p2b-fil">
<article class="p2b-rep p2b-rep-info"><div class="p2b-rep-h">${niveau('info')}<span>22:06 · question de 22:04</span></div>
<p class="p2b-rep-t p2b-rep-t16">Fermentation normale : laisse monter.</p>
<div class="p2b-geste p2b-geste-info"><div class="p2b-geste-r p2b-geste-14">${ic('thermo', 16)}<span>Garde ${m('19', '°C')} ; le Citra de J+2 se fait pendant cette activité.</span></div></div>
<div class="p2b-hist-c">${ic('drapeau', 12)}Densité à J+4 : vers ${m('1,020')}, puis ${m('20', '°C')} pour finir · au journal</div></article>
<div class="p2b-q">Et combien de jours de garde ?</div>
<div class="p2b-err" data-booster="frise-cause">
<div class="p2b-err-h">${ic('horsligne', 16)}Pas encore envoyée : pas de réseau</div>
${frise([
  ['fait', 'telephone', 'Garder la question', 'sur ce téléphone', '22:51'],
  ['casse', 'envoi', 'Envoyer', 'rien n’est parti, rien n’est compté'],
  ['avenir', 'calcul', 'Lire, calculer, rédiger, relire'],
])}
<label class="p2b-bascule-l"><span>Envoyer au retour du réseau<small>une seule fois, sans doublon</small></span><span class="p2b-sw p2b-sw-on" role="switch" aria-checked="true"><i></i></span></label>
<div class="p2b-actions p2b-actions-g"><button class="p2b-bt2">${ic('stylo', 14)}Reformuler</button></div>
</div>
<div class="p2b-serv" data-booster="frise-cause-serveur">
<div class="p2b-serv-h">${ic('nuage', 14)}<span><b>Brassin 29 · Stout</b> · l’analyse s’est arrêtée</span></div>
<div class="p2b-mini"><span class="p2b-mini-ok">Lire</span><i></i><span class="p2b-mini-ko">Calculer</span><i class="p2b-mini-v"></i><span>Rédiger</span></div>
<div class="p2b-serv-p"><span>Panne du serveur, pas de ta question. Rien n’est compté.</span><button class="p2b-bt2">${ic('relancer', 14)}Relancer</button></div>
</div>
</div>${pied({ champ: 'Ajoute une question…', hors: true, sansMode: true })}`);

const finances = tel('finances', 'Finances', 'ouvert depuis « Vérifier mes opérations »', `${tete({ ctx: 'Finances · Opérations', fin: true, pastille: '' })}
<div class="p2b-fil p2b-fin">
<div><p class="p2b-salut">Tes comptes, regardés ensemble.</p><p class="p2b-salut-s">Je relève, tu décides : rien n’est corrigé sans toi.</p></div>
<div class="p2b-lis p2b-lis-fin"><span class="p2b-lis-t">Je lis, à chaque question</span><span class="p2b-pil">${ic('liste', 12)}Opérations</span><span class="p2b-pil">${ic('document', 12)}Pièces</span><span class="p2b-pil">${ic('calendrier', 12)}Paiements</span><span class="p2b-pil">${ic('colis', 12)}Matériel</span></div>
<div class="p2b-src">${ic('liste', 14)}<span>Ouvert depuis <b>Vérifier mes opérations</b><small>la question est prête, modifie-la ou envoie</small></span></div>
<div class="p2b-sugg p2b-sugg-fin" data-booster="entrees-finances"><p class="p2b-sugg-t">Ou bien</p>
<button>${ic('camembert', 16)}<span>Comprendre mes dépenses<small>par poste et par mois</small></span><em>Auto</em></button>
<button>${ic('colis', 16)}<span>Préparer un achat de matériel<small>prix, paiement, classement</small></span><em>Approfondi</em></button>
<button>${ic('calendrier', 16)}<span>Prévoir mes prochains paiements<small>factures et échéances à venir</small></span><em>Auto</em></button>
<button>${ic('document', 16)}<span>Préparer l’année 2026<small>pièces, matériel, clôture</small></span><em>Approfondi</em></button></div>
<button class="p2b-ail-r p2b-fin-der"><span class="p2b-ail-pt"></span><span>Ta dernière vérification · 21:40</span><span class="p2b-ail-ok">réponse prête</span></button>
<div class="p2b-relu-fin">${ic('bouclier', 14)}<span>Finances : chaque réponse est relue deux fois, calculs refaits.</span></div>
</div>${pied({ champ: 'Vérifie les incohérences de mes opérations enregistrées : doublons possibles, paiements, classement du matériel et pièces à compléter.', plein: true, long: true, actif: true, mode: 'Approfondi', duree: '1–3 min' })}`, { fondKind: 'finances', classe: 'p2b-feuille-fin' });


const conversations = tel('conversations', 'Mes conversations', 'statuts, supprimer à un toucher de plus', `${tete({ titre: 'Mes conversations', ctx: 'Compagnon · 4 conversations', retour: true })}
<div class="p2b-fil">
<div class="p2b-stat" data-booster="statuts"><span><i class="p2b-dot"></i>${m('2')} prêtes</span><span><i class="p2b-dot p2b-dot-cours"></i>${m('1')} en cours</span><span><i class="p2b-dot p2b-dot-ko"></i>${m('1')} à relancer</span></div>
<div class="p2b-cv-tete"><button class="p2b-bt2">${ic('plusrond', 14)}Nouvelle question</button><button class="p2b-lien">${ic('zero', 14)}Repartir à zéro</button></div>
<ul class="p2b-cv">
<li><button class="p2b-cv-r"><i class="p2b-dot"></i><span><b>New England IPA</b><small>Herbacé : écourte le contact du dry hop.</small></span><span class="p2b-cv-s p2b-cv-ok">réponse prête<small>22:07</small></span></button><button class="p2b-bt-ic" aria-label="Plus pour New England IPA">${ic('plus', 16)}</button></li>
<li><button class="p2b-cv-r"><i class="p2b-dot p2b-dot-cours"></i><span><b>Brassin 30 · Blonde de garde</b><small>Quelle température de garde ?</small><span class="p2b-cv-bar"><i style="width:35%"></i></span></span><span class="p2b-cv-s">en cours<small class="p2b-mono">0:40</small></span></button><button class="p2b-bt-ic" aria-label="Plus pour Blonde de garde">${ic('plus', 16)}</button></li>
<li><button class="p2b-cv-r"><i class="p2b-dot p2b-dot-ko"></i><span><b>Brassin 29 · Stout</b><small>Arrêtée à « Calculer »</small><small class="p2b-cv-2">Rien n’est compté</small></span><span class="p2b-cv-s p2b-cv-ko">échec</span></button><button class="p2b-bt2 p2b-bt2-s">${ic('relancer', 14)}Relancer</button></li>
<li class="p2b-cv-ouv"><button class="p2b-cv-r"><i class="p2b-dot"></i><span><b>Mes finances</b><small>Vérifie les incohérences de mes opérations…</small></span><span class="p2b-cv-s p2b-cv-ok">réponse prête<small>21:40</small></span></button><button class="p2b-bt-ic p2b-on" aria-label="Plus pour Mes finances" aria-expanded="true">${ic('plus', 16)}</button>
<div class="p2b-cv-menu"><button class="p2b-bt2">Ouvrir</button><button class="p2b-bt2">Renommer</button><button class="p2b-danger">${ic('corbeille', 14)}Supprimer</button></div></li>
</ul>
<p class="p2b-cv-note">${ic('cloche', 14)}Les réponses arrivent ici même téléphone fermé.</p>
</div>${pied({ champ: 'Nouvelle question…' })}`, { classe: 'p2b-feuille-courte' });

const plafond = tel('plafond', 'Plafond', 'budget IA du mois atteint, la question est gardée', `${tete({ pastille: '' })}
<div class="p2b-fil p2b-fil-aere">
<div class="p2b-hist"><div class="p2b-rep-h">${niveau('info')}<span>22:06</span></div><b>Fermentation normale : laisse monter.</b><span>${ic('drapeau', 12)}Densité à J+4 · au journal</span></div>
<div class="p2b-q">Et combien de jours de garde ?</div>
<div class="p2b-q-m">${ic('telephone', 12)}Gardée · pas envoyée · 23:02</div>
<div class="p2b-err p2b-plaf" data-booster="jauge-budget">
<div class="p2b-err-h">${ic('jauge', 16)}Budget IA du mois atteint</div>
<div class="p2b-bud"><div class="p2b-bud-b"><i style="width:100%"></i></div><div class="p2b-bud-l"><span>${m('15,00')} sur ${m('15', 'CHF')}</span><span>repart le 1er décembre</span></div></div>
${frise([
  ['fait', 'telephone', 'Garder la question', 'sur ce téléphone', '23:02'],
  ['casse', 'envoi', 'Envoyer', 'plafond du mois atteint · rien n’est parti'],
  ['avenir', 'calcul', 'Lire, calculer, rédiger, relire'],
])}
<div class="p2b-reg-r p2b-plaf-r"><label for="p2b-pb">Plafond du mois</label><div class="p2b-pas"><button aria-label="Moins">${ic('moins', 14)}</button><input id="p2b-pb" class="p2b-in" type="text" inputmode="decimal" value="15,00"><span class="p2b-in-u">CHF</span><button aria-label="Plus">${ic('plusrond', 14)}</button></div></div>
<div class="p2b-actions p2b-actions-g"><button class="p2b-prim">${ic('reglages', 14)}Régler les limites</button><button class="p2b-bt2">Attendre décembre</button></div>
</div>
<div class="p2b-marge">${ic('livre', 14)}<span>Sans le compagnon, la recette, le brassin et le journal restent ouverts.</span></div>
</div>${pied({ champ: 'Ta question attend le budget…', desactive: true, sansMode: true })}`);

const urgent = tel('urgent', 'Urgent', 'une autre forme qu’Attention, lisible à 2 m', `${tete({ notif: true, pastille: '' })}
<div class="p2b-fil">
<div class="p2b-q p2b-q-1">L’alarme de la cuve sonne : que faire ?</div>
<article class="p2b-urg" data-booster="niveau-urgent">
<div class="p2b-urg-b"><div class="p2b-urg-h">${ic('octogone', 20)}<span>URGENT</span><span class="p2b-urg-t">22:41</span></div>
<h2>La cuve dépasse ${m('24', '°C')} : refroidis maintenant.</h2></div>
<div class="p2b-urg-a">${ic('gouttes', 22)}<span>Ouvre la circulation de glycol et contrôle la température toutes les ${m('30', 'min')}.</span></div>
<div class="p2b-thermo" data-booster="thermo-cible"><div class="p2b-thermo-b"><span class="p2b-thermo-ok" style="left:30%;width:20%"></span><span class="p2b-thermo-ko" style="left:75%"></span><i style="left:40%"></i><i class="p2b-thermo-now" style="left:80%"></i></div>
<div class="p2b-thermo-l"><span style="left:40%">visé ${m('19', '°C')}</span><span style="left:75%">${m('24', '°C')}</span><span style="left:80%" class="p2b-thermo-lk">cuve</span></div></div>
<div class="p2b-ctrl">${ic('horloge', 16)}<span>Prochain relevé à 23:10<small>Puis toutes les ${m('30', 'min')}, jusqu’à ${m('20', '°C')}.</small></span><label class="p2b-mini-sw"><span class="p2b-sw p2b-sw-on" role="switch" aria-checked="true"><i></i></span>Rappel</label></div>
<div class="p2b-coche" data-booster="gestes-coches"><span class="p2b-coche-t">Coche en faisant · noté au journal</span>
<span class="p2b-coche-r">${caseC(true)}<span>Glycol ouvert</span><span class="p2b-mono">22:43</span></span>
<span class="p2b-coche-r">${caseC(false)}<span>Relevé de ${m('23:10')}</span><span></span></span>
<span class="p2b-coche-r">${caseC(false)}<span>Relevé de ${m('23:40')}</span><span></span></span></div>
<button class="p2b-pli"><span><b>Pourquoi</b> · au-dessus de ${m('24', '°C')}, la levure fait des alcools lourds et des esters</span>${ic('bas', 16)}</button>
<button class="p2b-pli p2b-pli-relu">${ic('bouclier', 14)}<span>Relu · calculs refaits</span>${ic('bas', 16)}</button>
</article></div>${pied({ champ: 'Dis-moi la température relevée…', sansMode: true })}`, { temp: '24' });

const fournisseurs = tel('fournisseurs', 'Fournisseurs', 'prix et stock annoncés, rien acheté par l’app', `${tete({ ctx: 'Brassin 31 · New England IPA · J+4' })}
<div class="p2b-fil p2b-fil-serre">
<div class="p2b-q">Galaxy introuvable chez moi, je le remplace ?</div>
<article class="p2b-rep">
<div class="p2b-rep-h">${niveau('info')}<span>22:16</span></div>
<h2 class="p2b-rep-t">Oui : du Citra à J+6, même dose.</h2>
<div class="p2b-geste p2b-geste-info"><div class="p2b-geste-r">${ic('feuille', 18)}<span><b>J+6</b> · Citra à la place, même dose : ${m('43', 'g')}</span></div></div>
<div class="p2b-four" data-booster="offres">
<div class="p2b-four-r"><span class="p2b-four-n"><b>Citra T90 pellets ${m('100', 'g')}</b><small>Houblons Suisses SA</small></span><span class="p2b-four-p">${m('9,50', 'CHF')}<em class="p2b-stk-ok">annoncé en stock</em></span><button class="p2b-bt-ic" aria-label="Voir l’offre Citra">${ic('fleche', 16)}</button></div>
<div class="p2b-four-r p2b-four-ko"><span class="p2b-four-n"><b>Galaxy T90 pellets ${m('100', 'g')}</b><small>Brasserie Service Romand</small></span><span class="p2b-four-p">${m('11,20', 'CHF')}<em class="p2b-stk-ko">indisponible</em></span><button class="p2b-bt-ic" aria-label="Voir l’offre Galaxy">${ic('fleche', 16)}</button></div>
<p class="p2b-four-note">Stock annoncé par le vendeur le 14.11 à 20:59, jamais confirmé : vérifie à la commande. L’app n’achète rien.</p></div>
<div class="p2b-ctrl">${ic('drapeau', 16)}<span>Houblon reçu avant J+6<small>Note l’arrivée au journal, avec son lot.</small></span><button class="p2b-bt2">${ic('journal', 14)}Au journal</button></div>
<div class="p2b-prop">
<div class="p2b-prop-t"><span>Proposition pour le brassin 31</span><span>coche, puis valide</span></div>
<div class="p2b-mod">${caseC(true)}<span class="p2b-mod-n">Dry hop J+6</span><span class="p2b-av p2b-av-mot"><s>Galaxy</s> → Citra · ${m('43', 'g')}</span></div>
<div class="p2b-pile" data-booster="pile-dryhop"><div class="p2b-pile-b"><i class="p2b-pf" style="flex:85">Citra 85</i><i class="p2b-pm" style="flex:43">Citra 43</i><i class="p2b-pv" style="flex:43">Mosaic 43</i></div>
<div class="p2b-pile-l"><span>${m('171', 'g')} · ${m('9,0', 'g/L')} prévus</span><span>dose inchangée</span></div></div>
<div class="p2b-actions"><button class="p2b-bt2">Écarter</button><button class="p2b-prim">${ic('ok', 14)}Valider 1 modification</button></div></div>
<button class="p2b-pli p2b-pli-relu">${ic('bouclier', 14)}<span>Relu deux fois · prix vus le 14.11 · ${m('2')} sources</span>${ic('bas', 16)}</button>
</article></div>${pied({ champ: 'Une suite ?', sansMode: true })}`);

const limites = tel('limites', 'Limites', 'réglages ouverts depuis « ⋯ »', `${tete({ titre: 'Limites et réglages', ctx: 'Compagnon · gardé sur ce compte', retour: true })}
<div class="p2b-fil p2b-reg">
<section class="p2b-reg-g" data-booster="jauge-limites"><div class="p2b-reg-h"><b>Questions du jour</b><span>${m('4')} sur ${m('120')}</span></div><div class="p2b-bud-b p2b-bud-ok"><i style="width:3.3%"></i></div>
<div class="p2b-reg-r"><label for="p2b-q">Plafond par jour</label><div class="p2b-pas"><button aria-label="Moins">${ic('moins', 14)}</button><input id="p2b-q" class="p2b-in" type="text" inputmode="numeric" value="120"><button aria-label="Plus">${ic('plusrond', 14)}</button></div></div></section>
<section class="p2b-reg-g"><div class="p2b-reg-h"><b>Budget IA du mois</b><span>${m('2,10')} sur ${m('15', 'CHF')}</span></div><div class="p2b-bud-b p2b-bud-ok"><i style="width:14%"></i></div>
<div class="p2b-reg-r"><label for="p2b-b">Plafond par mois</label><div class="p2b-pas"><button aria-label="Moins">${ic('moins', 14)}</button><input id="p2b-b" class="p2b-in" type="text" inputmode="decimal" value="15,00"><span class="p2b-in-u">CHF</span><button aria-label="Plus">${ic('plusrond', 14)}</button></div></div>
<small class="p2b-reg-s">Au plafond, la question est gardée et rien n’est dépensé.</small></section>
<section class="p2b-reg-g"><div class="p2b-reg-h"><b>Mode par défaut</b></div>
<div class="p2b-seg" role="group" aria-label="Mode par défaut"><button aria-pressed="false">Rapide<small>court</small></button><button aria-pressed="true">Auto<small class="p2b-mono">15–30 s</small></button><button aria-pressed="false">Approfondi<small class="p2b-mono">1–3 min</small></button></div></section>
<section class="p2b-reg-g p2b-reg-sw">
<label class="p2b-bascule-l">${ic('cloche', 16)}<span>Me notifier à la réponse<small>même téléphone fermé</small></span><span class="p2b-sw p2b-sw-on" role="switch" aria-checked="true"><i></i></span></label>
<label class="p2b-bascule-l">${ic('jauge', 16)}<span>Me prévenir à 80 % du budget<small>une seule notification par mois</small></span><span class="p2b-sw p2b-sw-on" role="switch" aria-checked="true"><i></i></span></label>
<label class="p2b-bascule-l">${ic('horsligne', 16)}<span>Hors ligne, envoyer au retour du réseau<small>sinon, je te demande avant d’envoyer</small></span><span class="p2b-sw" role="switch" aria-checked="false"><i></i></span></label>
<label class="p2b-bascule-l">${ic('pause', 16)}<span>Suspendre l’IA<small>tes questions restent gardées, rien ne part</small></span><span class="p2b-sw" role="switch" aria-checked="false"><i></i></span></label></section>
<button class="p2b-lien p2b-lien-zero">${ic('zero', 14)}Repartir à zéro…</button>
</div><footer class="p2b-pied p2b-pied-reg"><span>${ic('ok', 14)}Enregistré sur ce compte</span><button class="p2b-prim">Fermer</button></footer>`);

const zero = tel('zero', 'Repartir à zéro', 'confirmé, recette et notes restent', `${tete({ pastille: '' })}
<div class="p2b-fil p2b-fil-voile" aria-hidden="true">
<div class="p2b-q">${Q1}</div>
<div class="p2b-rep-h">${niveau('info')}<span>22:06</span></div>
<p class="p2b-rep-t">Fermentation normale : laisse monter.</p>
<div class="p2b-geste p2b-geste-info"><div class="p2b-geste-r">${ic('thermo', 18)}<span>Garde ${m('19', '°C')} ; le Citra de J+2 se fait pendant cette activité.</span></div></div>
<div class="p2b-ctrl">${ic('drapeau', 16)}<span>Densité à J+4 : vers ${m('1,020')}<small>Puis ${m('20', '°C')} pour finir.</small></span></div>
<div class="p2b-q">Et combien de jours de garde ?</div>
<div class="p2b-q-m">En file · 22:12</div>
</div>
<div class="p2b-zero" role="dialog" aria-label="Repartir à zéro ?" data-booster="efface-reste">
<h2>${ic('zero', 20)}Repartir à zéro ?</h2>
<div class="p2b-zero-c">
<div class="p2b-zero-k"><b>${ic('x', 14)}S’efface</b><span>Les échanges de ce fil</span><span>La réponse en cours</span><span>La question en file</span></div>
<div class="p2b-zero-k p2b-zero-g"><b>${ic('ok', 14)}Reste</b><span>Recette New England IPA</span><span>Brassin 31 et ses mesures</span><span>Notes gardées au journal</span></div></div>
<div class="p2b-actions"><button class="p2b-bt2">Annuler</button><button class="p2b-danger p2b-danger-b">${ic('zero', 14)}Effacer les échanges</button></div>
</div>${pied({ champ: 'Décris ce que tu observes…', sansMode: true, desactive: true })}`);

// ——— Bureau : 1280 × 760, panneau latéral ; la ligne visée s'éclaire dans la page du brassin ———
const bureau = `<div class="p2b-pl-col p2b-pl-bureau"><p class="p2b-pl-lib">Bureau <span>· 1280 × 760 · la réponse attention en panneau, la ligne visée éclairée dans la page</span></p>
<div class="p2b-bur-wrap"><div class="p2b-bur" data-cadre="bureau">
<div class="p2b-bur-page">
<div class="p2b-bur-top"><b>Brassin 31 · New England IPA</b><span>${m('19', 'L')} · fermentation J+8</span><span class="p2b-bur-tabs"><i>Recette</i><i class="p2b-on">Fermentation</i><i>Journal</i><i>Eau</i></span></div>
<div class="p2b-bur-mes"><div><small>Température</small>${m('19', '°C')}</div><div><small>DF relevée à J+6</small>${m('1,012')}</div><div><small>Dry hop</small>${m('171', 'g')} · ${m('9,0', 'g/L')}</div></div>
<h3>Dry hop</h3>
<table class="p2b-bur-t"><thead><tr><th>Houblon</th><th>Jour</th><th>Dose</th><th>Contact</th><th>Température</th><th>État</th></tr></thead><tbody>
<tr><td>Citra</td><td>J+2</td><td>${m('85', 'g')}</td><td>${m('2', 'j')}</td><td>${m('19', '°C')}</td><td>fait</td></tr>
<tr><td>Galaxy</td><td>J+6</td><td>${m('43', 'g')}</td><td>${m('2', 'j')}</td><td>${m('19', '°C')}</td><td class="p2b-bur-mark">${ic('purge', 14)}purge ce soir</td></tr>
<tr class="p2b-bur-vise"><td>Mosaic</td><td>J+9</td><td>${m('43', 'g')}</td><td>${avap('3', '2', 'j')}</td><td>${avap('19', '17', '°C')}</td><td>à venir · <b>proposé</b></td></tr>
</tbody></table>
<h3>Frise du brassin</h3>
<div class="p2b-bf" data-booster="frise-brassin">
<div class="p2b-bf-row"><span class="p2b-bf-k">Dry hop</span><div class="p2b-bf-tr"><i class="p2b-bf-auj" style="left:66.67%"></i>
<span class="p2b-bf-lb" style="left:16.67%"><b>Citra ${m('85', 'g')}</b>fait · ${m('2', 'j')}</span><i class="p2b-bf-c p2b-bf-fait" style="left:16.67%;width:16.67%"></i>
<span class="p2b-bf-lb" style="left:50.00%"><b>Galaxy ${m('43', 'g')}</b>purge ce soir</span><i class="p2b-bf-c p2b-bf-purge" style="left:50.00%;width:16.67%"></i>
<span class="p2b-bf-lb" style="left:75.00%"><b>Mosaic ${m('43', 'g')}</b>contact ${avap('3', '2', 'j')} · proposé</span><i class="p2b-bf-c p2b-bf-prop" style="left:75.00%;width:16.67%"></i><i class="p2b-bf-c p2b-bf-was" style="left:91.67%;width:8.33%"></i></div></div>
<div class="p2b-bf-row"><span class="p2b-bf-k">Jour</span><div class="p2b-bf-axe"><i style="left:0.00%"></i><span style="left:0.00%">J+0</span><i style="left:16.67%"></i><span style="left:16.67%">J+2</span><i style="left:33.33%"></i><span style="left:33.33%">J+4</span><i style="left:50.00%"></i><span style="left:50.00%">J+6</span><i style="left:66.67%"></i><span class="p2b-on" style="left:66.67%">J+8 · aujourd’hui</span><i style="left:83.33%"></i><span style="left:83.33%">J+10</span><i style="left:100.00%"></i><span style="left:100.00%">J+12</span></div></div>
<div class="p2b-bf-row p2b-bf-row-j"><span class="p2b-bf-k">Mesures</span><div class="p2b-bf-tr p2b-bf-tr-j">
<span class="p2b-bf-m" style="left:8.33%">pression monte</span>
<span class="p2b-bf-m" style="left:33.33%"><b>${m('1,020')}</b></span>
<span class="p2b-bf-m" style="left:50.00%"><b>DF ${m('1,012')}</b></span>
<span class="p2b-bf-m" style="left:66.67%">herbe coupée</span>
<span class="p2b-bf-m p2b-bf-av" style="left:83.33%">goût, avant garde</span></div></div>
</div>
<h3>Journal</h3>
<div class="p2b-bur-j"><span><b>J+8 · 21:58</b> Dégustation : herbe coupée, amertume un peu sèche.</span><span><b>J+6 · 18:20</b> Galaxy ajouté, ${m('43', 'g')}.</span><span><b>J+6 · 18:05</b> DF ${m('1,012')}.</span><span><b>J+4 · 09:10</b> Densité ${m('1,020')}, passage à ${m('20', '°C')}.</span></div>
</div>
<aside class="p2b-bur-pan p2b-feuille-pan" aria-label="Compagnon brasseur">${tete({ ctx: 'Brassin 31 · New England IPA · J+8' })}
<div class="p2b-fil p2b-fil-serre"><div class="p2b-q p2b-q-1">${Q2}</div>${reponseCorps(true)}</div>
${pied({ champ: 'Une suite ? Et la garde, combien de jours ?', sansMode: true })}</aside>
</div></div></div>`;

const css = `
:root{--pg:#FFFFFF;--pn:#F5F5F5;--su:#EBEBEB;--bd:#DDDDDD;--bdm:#BFBFBF;--tf:#9E9E9E;--t2:#666666;--t1:#333333;--t0:#111111;
--act:#111111;--acttx:#FFFFFF;--hop:#567F45;--hoptx:#3F6B2E;--hopbg:#EEF4EA;--att:#9C7020;--atttx:#7F5B10;--attbg:#FBF3E2;--attbd:#E3B55D;
--al:#C8382F;--altx:#A8291F;--albg:#FBEAE8;--urg:#B42E25;--eau:#4F7E9B;--fin:#1F64A3;--finbd:#86B9E6;--finbg:#EAF2FB;
--sh-sheet:0 -12px 40px -16px rgba(0,0,0,.28);--scrim:rgba(17,17,17,.30);--planche:#7A7A7A;--planche-tx:#FFFFFF;
--sans:"Source Sans 3","Source Sans Pro",system-ui,-apple-system,"Segoe UI",Roboto,sans-serif;
--mono:"IBM Plex Mono",ui-monospace,"Cascadia Mono",Consolas,monospace}
[data-theme=cave]{--pg:#12100E;--pn:#1A1613;--su:#221D19;--bd:#2C2521;--bdm:#3D342E;--tf:#574A42;--t2:#9A8A7E;--t1:#D8CEC5;--t0:#F5F0EA;
--act:#F2C14E;--acttx:#12100E;--hop:#6E9B5B;--hoptx:#8DB87A;--hopbg:#1C2618;--att:#E3B55D;--atttx:#E3B55D;--attbg:#2A2113;--attbd:#E3B55D;
--al:#D6453D;--altx:#E06A63;--albg:#2C1614;--urg:#B23A33;--eau:#5E8CA8;--fin:#86B9E6;--finbd:#86B9E6;--finbg:#16212B;
--sh-sheet:0 -12px 40px -16px rgba(0,0,0,.8);--scrim:rgba(0,0,0,.5);--planche:#0A0908;--planche-tx:#D8CEC5}
*{box-sizing:border-box}html,body{margin:0}
body{background:var(--planche);font-family:var(--sans);color:var(--t1);-webkit-font-smoothing:antialiased;padding:20px 20px 28px}
::selection{background:var(--hop);color:#fff}
button{font:inherit;color:inherit;background:none;border:0;padding:0;cursor:pointer}
button:focus-visible,input:focus-visible{outline:2px solid var(--hop);outline-offset:2px}
s{text-decoration-thickness:1.5px}
.p2b-pl-titre{color:var(--planche-tx);font-size:18px;font-weight:700;margin:0 0 4px;display:flex;align-items:center;gap:8px}
.p2b-pl-logo{width:20px;height:20px;flex:none}
.p2b-pl-sous{color:var(--planche-tx);opacity:.85;font-size:14px;margin:0 0 16px}
.p2b-pl{display:grid;grid-template-columns:repeat(4,390px);gap:28px 24px;align-items:start}
.p2b-pl-col{width:390px}
.p2b-pl-bureau{grid-column:1/-1;width:auto}
.p2b-pl-lib{color:var(--planche-tx);font-size:14px;font-weight:600;margin:0 0 6px}
.p2b-pl-lib span{font-weight:400;opacity:.85}
.p2b-tel{width:390px;height:760px;position:relative;overflow:hidden;border-radius:14px;background:var(--pg);box-shadow:0 10px 30px -14px rgba(0,0,0,.6)}
.p2b-fond{position:absolute;inset:0;filter:blur(1.6px);opacity:.75;padding:10px 12px;color:var(--t1)}
.p2b-fond-b{display:flex;align-items:center;height:36px;font-weight:700;font-size:16px;color:var(--t0)}
.p2b-fond-t{display:flex;gap:6px;margin:4px 0 12px}
.p2b-fond-t i{flex:1;height:26px;border-radius:6px;background:var(--pn);border:1px solid var(--bd)}
.p2b-fond-t i:nth-child(2){background:var(--hopbg);border-color:var(--hop)}
.p2b-fond-fin .p2b-fond-t i:nth-child(2){background:var(--finbg);border-color:var(--finbd)}
.p2b-fond-big{font:600 28px var(--sans);color:var(--t0)}
.p2b-fond-big .p2b-mono{font-size:28px}
.p2b-fond-chaud{color:var(--al)}
.p2b-fond-r{height:30px;border-bottom:1px solid var(--bd)}
.p2b-fond-bt{margin:8px 0;height:28px;border-radius:6px;border:1px solid var(--finbd);color:var(--fin);font-size:13px;display:flex;align-items:center;padding:0 10px;width:max-content}
.p2b-scrim{position:absolute;inset:0;background:var(--scrim)}
.p2b-feuille{position:absolute;left:0;right:0;bottom:0;top:44px;background:var(--pg);border-radius:14px 14px 0 0;box-shadow:var(--sh-sheet);display:flex;flex-direction:column;overflow:hidden}
.p2b-feuille-fin{box-shadow:var(--sh-sheet),inset 0 3px 0 var(--finbd)}
.p2b-poignee{width:36px;height:4px;border-radius:2px;background:var(--bdm);margin:6px auto 0;flex:none}
.p2b-ic{flex:none;display:block}
.p2b-mono{font-family:var(--mono);font-variant-numeric:tabular-nums;font-feature-settings:"tnum";letter-spacing:-.02em}
.p2b-n{white-space:nowrap}
/* en-tête */
.p2b-tete{display:flex;align-items:center;gap:6px;padding:4px 6px 4px 12px;border-bottom:1px solid var(--bd);flex:none;min-height:44px}
.p2b-tete .p2b-bt-ic:first-child{margin-left:-6px}
.p2b-logo{color:var(--hoptx);display:grid;place-items:center}
.p2b-logo-fin{color:var(--fin)}
.p2b-tete-tx{flex:1;min-width:0;line-height:1.2}
.p2b-tete-tx b{display:block;font-size:16px;color:var(--t0)}
.p2b-tete-tx span{font-size:12px;color:var(--t2);white-space:nowrap;overflow:hidden;text-overflow:ellipsis;display:block}
.p2b-bt-ic{width:32px;height:32px;display:grid;place-items:center;border-radius:6px;color:var(--t1);position:relative;flex:none}
.p2b-bt-ic.p2b-on{color:var(--hoptx);background:var(--hopbg)}
.p2b-pastille-n{position:absolute;top:2px;right:2px;min-width:16px;height:16px;border-radius:8px;background:var(--hop);color:#fff;font:600 12px/16px var(--sans);text-align:center;padding:0 3px}
/* fil et pied */
.p2b-fil{flex:1;min-height:0;overflow:hidden;padding:10px 12px 10px;display:flex;flex-direction:column;gap:10px}
.p2b-fil-serre{gap:8px}
.p2b-fil-aere{gap:13px}
.p2b-rep-t16{font-size:16px}
.p2b-hist-c{display:flex;gap:4px;align-items:center;font-size:12px;color:var(--t2)}
.p2b-geste-14{font-size:14px;padding:4px 0;line-height:1.3}
.p2b-rep-info{gap:6px;padding-bottom:8px;border-bottom:1px solid var(--bd)}
.p2b-pied{flex:none;border-top:1px solid var(--bd);padding:6px 10px 10px;display:flex;flex-direction:column;gap:6px;background:var(--pg)}
.p2b-saisie{display:flex;gap:6px;align-items:flex-end}
.p2b-champ{flex:1;min-width:0;min-height:40px;border:1px solid var(--bdm);border-radius:8px;background:var(--pn);display:flex;align-items:center;gap:6px;padding:4px 4px 4px 10px}
.p2b-champ-tx{flex:1;min-width:0;font:16px/1.3 var(--sans);color:var(--t2);white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
.p2b-plein .p2b-champ-tx{color:var(--t0)}
.p2b-long{flex-direction:column;align-items:stretch;padding:8px 6px 6px 10px}
.p2b-long .p2b-champ-tx{white-space:normal}
.p2b-long .p2b-chip{align-self:flex-start}
.p2b-champ-off{border-style:dashed;background:var(--pg)}
.p2b-hors .p2b-champ{border-style:dashed}
.p2b-chip{display:inline-flex;align-items:center;gap:4px;height:28px;padding:0 6px 0 8px;border-radius:6px;background:var(--pg);border:1px solid var(--bd);font-size:12px;color:var(--t1);white-space:nowrap;flex:none}
.p2b-chip b{font-weight:600;color:var(--t0)}
.p2b-chip .p2b-mono{color:var(--t2)}
.p2b-envoi{width:40px;height:40px;border-radius:8px;background:var(--su);color:var(--t2);display:grid;place-items:center;flex:none}
.p2b-envoi-on{background:var(--act);color:var(--acttx)}
.p2b-pied-ban{display:flex;align-items:center;gap:6px;font-size:12px;color:var(--t1)}
.p2b-lim{display:flex;align-items:center;gap:6px;font-size:12px;color:var(--t2);min-height:24px;text-align:left}
.p2b-lim span{flex:1}
.p2b-lim .p2b-mono{color:var(--t1)}
/* accueil */
.p2b-salut{font-size:18px;font-weight:700;color:var(--t0);margin:2px 0 0;line-height:1.25}
.p2b-salut-s{font-size:14px;color:var(--t2);margin:2px 0 0}
.p2b-lis{display:flex;flex-wrap:wrap;align-items:center;gap:4px 6px}
.p2b-lis-t{font-size:12px;color:var(--t2);width:100%}
.p2b-pil{display:inline-flex;align-items:center;gap:4px;height:24px;padding:0 8px;border-radius:12px;background:var(--hopbg);color:var(--hoptx);font-size:12px;font-weight:600}
.p2b-lis-fin .p2b-pil{background:var(--finbg);color:var(--fin)}
.p2b-lu{background:var(--pn);border-radius:10px;padding:8px 10px;display:flex;flex-direction:column;gap:6px}
.p2b-lu-h,.p2b-lu-pied{display:flex;justify-content:space-between;gap:8px;font-size:14px;color:var(--t1)}
.p2b-lu-h b{color:var(--t0)}
.p2b-lu-pied{font-size:12px;color:var(--t2);border-top:1px solid var(--bd);padding-top:6px}
.p2b-lu-pied .p2b-mono{color:var(--t1)}
.p2b-dh{position:relative;padding:8px 0 0}
.p2b-dh-axe{position:relative;height:16px;margin:0 6px}
.p2b-dh-axe::before{content:"";position:absolute;left:0;right:0;top:7px;height:2px;background:var(--bdm);border-radius:1px}
.p2b-dh-axe::after{content:"";position:absolute;left:0;width:10%;top:7px;height:2px;background:var(--hop)}
.p2b-dh-pt{position:absolute;top:2px;width:12px;height:12px;margin-left:-6px;border-radius:6px;border:2px solid var(--hop);background:var(--pn);z-index:1}
.p2b-dh-fait{background:var(--hop)}
.p2b-dh-auj{position:absolute;top:-8px;bottom:-2px;width:2px;margin-left:-1px;background:var(--t0);z-index:2}
.p2b-dh-auj em{position:absolute;top:-6px;left:5px;font:600 11px/1 var(--sans);font-style:normal;color:var(--t0);white-space:nowrap;display:none}
.p2b-dh-lb{position:relative;height:34px;margin:2px 6px 0}
.p2b-dh-lb>span{position:absolute;transform:translateX(-50%);font-size:12px;color:var(--t2);text-align:center;white-space:nowrap;line-height:1.25}
.p2b-dh-lb>span:last-child{transform:translateX(-80%)}
.p2b-dh-lb b{display:block;color:var(--t0);font-weight:600}
.p2b-sugg-t{font-size:12px;color:var(--t2);margin:0 0 2px}
.p2b-sugg{display:flex;flex-direction:column}
.p2b-sugg button{display:flex;align-items:center;gap:8px;min-height:36px;text-align:left;font-size:14px;color:var(--hoptx);border-bottom:1px solid var(--bd);padding:0 2px}
.p2b-sugg button span{flex:1}
.p2b-sugg em{font-style:normal;font-size:12px;color:var(--t2);border:1px solid var(--bd);border-radius:10px;padding:1px 7px}
.p2b-sugg-fin button{color:var(--t0);min-height:40px}
.p2b-sugg-fin button .p2b-ic{color:var(--fin)}
.p2b-ail{display:flex;flex-direction:column}
.p2b-ail-r{display:flex;align-items:center;gap:8px;min-height:32px;font-size:14px;color:var(--t1);text-align:left}
.p2b-ail-r span:nth-child(2){flex:1}
.p2b-ail-r .p2b-mono{font-size:13px;color:var(--t2)}
.p2b-ail-pt{width:8px;height:8px;border-radius:4px;background:var(--hop)}
.p2b-ail-cours{background:none;border:2px solid var(--hop)}
.p2b-ail-ok{font-size:12px;color:var(--hoptx);font-weight:600}
/* question */
.p2b-q{align-self:flex-end;max-width:86%;background:var(--su);color:var(--t0);border-radius:10px 10px 2px 10px;padding:7px 10px;font-size:14px;line-height:1.35}
.p2b-q-1{}
.p2b-q-m{align-self:flex-end;font-size:12px;color:var(--t2);margin-top:-6px;display:flex;align-items:center;gap:4px}
/* attente */
.p2b-att{border:1px solid var(--bd);border-radius:10px;padding:8px 10px;display:flex;flex-direction:column;gap:4px}
.p2b-att-h{display:flex;align-items:center;gap:10px;padding-bottom:4px}
.p2b-chrono{font:600 32px/1 var(--mono);color:var(--t0);font-variant-numeric:tabular-nums;letter-spacing:-.03em}
.p2b-att-tx{display:flex;flex-direction:column;line-height:1.25}
.p2b-att-tx b{font-size:14px;color:var(--t0)}
.p2b-att-tx small{font-size:12px;color:var(--t2)}
.p2b-frise{list-style:none;margin:0;padding:0}
.p2b-frise li{display:grid;grid-template-columns:22px 1fr auto;gap:8px;align-items:center;min-height:34px;position:relative;font-size:14px;color:var(--t1);line-height:1.2}
.p2b-frise li::before{content:"";position:absolute;left:10px;top:50%;height:100%;width:2px;background:var(--bd)}
.p2b-frise li:last-child::before{display:none}
.p2b-frise li.p2b-fait::before{background:var(--hop)}
.p2b-pt{width:22px;height:22px;border-radius:11px;display:grid;place-items:center;border:2px solid var(--bdm);background:var(--pg);position:relative;z-index:1;color:var(--t2)}
.p2b-fait .p2b-pt{background:var(--hop);border-color:var(--hop);color:#fff}
.p2b-encours .p2b-pt{border-color:var(--hop);color:var(--hoptx);box-shadow:0 0 0 3px var(--hopbg)}
.p2b-encours{font-weight:600;color:var(--t0)}
.p2b-avenir{color:var(--t2)}
.p2b-frise small{display:block;font-size:12px;color:var(--t2);font-weight:400}
.p2b-frise .p2b-mono{font-size:12px;color:var(--t2)}
.p2b-casse .p2b-pt{border-color:var(--al);color:var(--altx)}
.p2b-casse{color:var(--altx);font-weight:600}
.p2b-casse small{color:var(--t2)}
.p2b-duree{margin-top:4px}
.p2b-piste{position:relative;height:8px;border-radius:4px;background:var(--su)}
.p2b-zone{position:absolute;top:0;bottom:0;background:var(--hopbg);border:1px solid var(--hop);border-radius:4px}
.p2b-rempli{position:absolute;left:0;top:2px;bottom:2px;border-radius:3px;background:var(--hop);opacity:.55}
.p2b-aig{position:absolute;top:-4px;width:2px;height:16px;margin-left:-1px;background:var(--t0);border-radius:1px}
.p2b-echelle{position:relative;height:16px;margin-top:3px;font:12px var(--mono);color:var(--t2)}
.p2b-echelle span{position:absolute;transform:translateX(-50%)}
.p2b-echelle span:first-child{transform:none}
.p2b-echelle span:last-child{transform:translateX(-100%)}
.p2b-duree-l{font-size:12px;color:var(--t2);display:flex;align-items:center;gap:6px}
.p2b-duree-l b{color:var(--t0);font-weight:600}
.p2b-zone-l{width:14px;height:8px;border-radius:3px;background:var(--hopbg);border:1px solid var(--hop)}
.p2b-deja{display:flex;flex-direction:column;gap:2px;background:var(--pn);border-radius:8px;padding:6px 10px;font-size:14px;color:var(--t1)}
.p2b-deja-t{display:flex;align-items:center;gap:6px;font-size:12px;color:var(--hoptx);font-weight:600}
.p2b-marge{display:flex;align-items:center;gap:8px;font-size:14px;color:var(--t1)}
.p2b-marge .p2b-ic{color:var(--hoptx)}
.p2b-file{display:flex;align-items:center;gap:8px;border:1px dashed var(--bdm);border-radius:8px;padding:4px 4px 4px 10px;font-size:14px;color:var(--t1)}
.p2b-file span{flex:1}
.p2b-file small{display:block;font-size:12px;color:var(--t2)}
.p2b-fermer{margin-top:auto;display:flex;flex-direction:column;gap:4px;align-items:stretch}
.p2b-fermer small{font-size:12px;color:var(--t2);text-align:center}
/* réponse */
.p2b-rep{display:flex;flex-direction:column;gap:8px}
.p2b-rep-h{display:flex;align-items:center;gap:8px;font-size:12px;color:var(--t2)}
.p2b-niv{display:inline-flex;align-items:center;gap:4px;height:22px;padding:0 8px;border-radius:11px;font-weight:700;font-size:12px}
.p2b-niv-att{background:var(--attbg);color:var(--atttx);box-shadow:inset 0 0 0 1px var(--attbd)}
.p2b-niv-info{background:var(--hopbg);color:var(--hoptx)}
.p2b-rep-t{font-size:18px;font-weight:700;color:var(--t0);line-height:1.25;margin:0}
.p2b-geste{border-radius:8px;padding:4px 10px;display:flex;flex-direction:column}
.p2b-geste-att{background:var(--attbg)}
.p2b-geste-info{background:var(--hopbg)}
.p2b-geste-r{display:flex;align-items:center;gap:8px;min-height:34px;font-size:16px;color:var(--t0)}
.p2b-geste-r+.p2b-geste-r{border-top:1px solid var(--bd)}
.p2b-geste-att .p2b-ic{color:var(--atttx)}
.p2b-geste-info .p2b-ic{color:var(--hoptx)}
.p2b-geste-r b{font-weight:700}
.p2b-gros{font-size:18px;font-weight:700}
.p2b-gros s{color:var(--t2);font-weight:400}
.p2b-pli{text-align:left;display:flex;align-items:center;gap:6px;min-height:30px;font-size:14px;color:var(--t1);border-bottom:1px solid var(--bd);line-height:1.3;padding:2px 0}
.p2b-pli span{flex:1;min-width:0}
.p2b-pli b{color:var(--t0)}
.p2b-pli .p2b-ic:last-child{color:var(--t2)}
.p2b-pli-relu{font-size:13px;color:var(--t2);border-bottom:0}
.p2b-pli-relu .p2b-ic:first-child{color:var(--hoptx)}
.p2b-ctrl{display:flex;align-items:center;gap:8px;font-size:14px;color:var(--t0);font-weight:600}
.p2b-ctrl>.p2b-ic{color:var(--hoptx)}
.p2b-ctrl>span{flex:1;line-height:1.25}
.p2b-ctrl small{display:block;font-size:12px;color:var(--t2);font-weight:400}
.p2b-bt2{height:28px;padding:0 10px;border:1px solid var(--bdm);border-radius:6px;font-size:13px;color:var(--t1);display:inline-flex;align-items:center;gap:5px;white-space:nowrap;background:var(--pg);flex:none}
.p2b-bt2-s{height:28px}
.p2b-prop{border:1px solid var(--bd);border-radius:10px;padding:6px 10px 8px}
.p2b-prop-t{font-size:12px;color:var(--t2);display:flex;justify-content:space-between;margin-bottom:2px}
.p2b-mod{display:grid;grid-template-columns:24px 1fr auto;gap:8px;align-items:center;min-height:34px;border-bottom:1px solid var(--bd)}
.p2b-mod-n{font-size:14px;color:var(--t0);line-height:1.2}
.p2b-mod-n small{font-size:12px;color:var(--t2);border:1px solid var(--bd);border-radius:9px;padding:0 6px;margin-left:4px}
.p2b-mod-fac .p2b-mod-n,.p2b-mod-fac .p2b-av{color:var(--t2)}
.p2b-case{width:20px;height:20px;border-radius:4px;background:var(--act);color:var(--acttx);display:grid;place-items:center}
.p2b-case-off{background:var(--pg);border:2px solid var(--bdm)}
.p2b-av{font-size:14px;color:var(--t0);text-align:right}
.p2b-av s{color:var(--t2)}
.p2b-av-mot s{text-decoration-thickness:1.5px}
.p2b-pile{padding:8px 0 2px}
.p2b-pile-b{display:flex;height:18px;gap:2px;border-radius:4px;overflow:hidden}
.p2b-pile-b i{display:flex;align-items:center;padding-left:6px;font:600 12px var(--sans);font-style:normal;white-space:nowrap;overflow:hidden}
.p2b-pf{background:var(--su);color:var(--t2)}
.p2b-pm{background:var(--hop);color:#fff}
.p2b-pm-x{background:repeating-linear-gradient(135deg,var(--hop) 0 2px,transparent 2px 5px);opacity:.6;padding:0!important}
.p2b-pile-l{display:flex;justify-content:space-between;gap:8px;font-size:12px;color:var(--t2);margin-top:4px}
.p2b-pile-l .p2b-mono{color:var(--t1)}
.p2b-actions{display:flex;justify-content:flex-end;gap:6px;margin-top:8px}
.p2b-actions-g{justify-content:flex-start}
.p2b-prim{height:32px;padding:0 12px;border-radius:8px;background:var(--act);color:var(--acttx);font-weight:600;font-size:14px;display:inline-flex;align-items:center;justify-content:center;gap:6px;white-space:nowrap}
.p2b-large{height:36px;width:100%}
/* erreur, plafond */
.p2b-err{border:1px solid var(--bdm);border-radius:10px;padding:8px 10px;display:flex;flex-direction:column;gap:6px}
.p2b-err-h{display:flex;align-items:center;gap:6px;font-size:16px;font-weight:700;color:var(--t0)}
.p2b-bascule-l{display:flex;align-items:center;gap:8px;min-height:40px;font-size:14px;color:var(--t0);border-top:1px solid var(--bd);padding-top:4px}
.p2b-bascule-l>span:first-child,.p2b-bascule-l>span:nth-child(2):not(.p2b-sw){flex:1;line-height:1.25}
.p2b-bascule-l small{display:block;font-size:12px;color:var(--t2)}
.p2b-sw{width:40px;height:24px;border-radius:12px;background:var(--bdm);position:relative;flex:none}
.p2b-sw i{position:absolute;top:3px;left:3px;width:18px;height:18px;border-radius:9px;background:#fff;box-shadow:0 1px 2px rgba(0,0,0,.3)}
.p2b-sw-on{background:var(--hop)}
.p2b-sw-on i{left:19px}
.p2b-serv{border:1px solid var(--bd);border-radius:10px;padding:8px 10px;background:var(--pn);display:flex;flex-direction:column;gap:6px}
.p2b-serv-h{display:flex;align-items:center;gap:6px;font-size:14px;color:var(--t1)}
.p2b-serv-h .p2b-ic{color:var(--altx)}
.p2b-serv-h b{color:var(--t0)}
.p2b-mini{display:flex;align-items:center;gap:6px;font-size:12px;color:var(--t2)}
.p2b-mini i{flex:1;height:2px;background:var(--bdm)}
.p2b-mini i:first-of-type{background:var(--hop)}
.p2b-mini-ok{color:var(--hoptx);font-weight:600}
.p2b-mini-ko{color:var(--altx);font-weight:700;border:1px solid var(--al);border-radius:9px;padding:0 6px}
.p2b-mini-v{background:var(--bd)!important}
.p2b-serv-p{display:flex;align-items:center;gap:8px;font-size:13px;color:var(--t1)}
.p2b-serv-p span{flex:1}
.p2b-bud{display:flex;flex-direction:column;gap:4px}
.p2b-bud-b{height:10px;border-radius:5px;background:var(--su);overflow:hidden}
.p2b-bud-b i{display:block;height:100%;background:var(--al);border-radius:5px}
.p2b-bud-ok i{background:var(--hop)}
.p2b-bud-l{display:flex;justify-content:space-between;font-size:14px;color:var(--t0)}
.p2b-bud-l span:last-child{font-size:12px;color:var(--t2)}
/* urgent : un bloc plein, l'octogone, le texte à 2 m */
.p2b-urg{display:flex;flex-direction:column;gap:8px}
.p2b-urg-b{background:var(--urg);color:#fff;border-radius:10px;padding:10px 12px 12px}
.p2b-urg-h{display:flex;align-items:center;gap:6px;font-size:14px;font-weight:800;letter-spacing:.08em}
.p2b-urg-t{margin-left:auto;font-weight:400;letter-spacing:0;font-size:12px;opacity:.9}
.p2b-urg-b h2{margin:6px 0 0;font-size:26px;line-height:1.15;font-weight:800}
.p2b-urg-b h2 .p2b-mono{letter-spacing:-.04em}
.p2b-urg-a{display:flex;gap:10px;align-items:flex-start;background:var(--albg);border-radius:10px;padding:10px 12px;font-size:18px;line-height:1.3;font-weight:600;color:var(--t0)}
.p2b-urg-a .p2b-ic{color:var(--altx);margin-top:2px}
.p2b-thermo{padding:4px 2px 0}
.p2b-thermo-b{position:relative;height:10px;border-radius:5px;background:var(--su)}
.p2b-thermo-ok{position:absolute;top:0;bottom:0;background:var(--hopbg);border:1px solid var(--hop);border-radius:5px}
.p2b-thermo-ko{position:absolute;top:0;bottom:0;right:0;background:var(--al);opacity:.8;border-radius:0 5px 5px 0}
.p2b-thermo-b i{position:absolute;top:-3px;width:2px;height:16px;margin-left:-1px;background:var(--hop)}
.p2b-thermo-b i.p2b-thermo-now{width:4px;margin-left:-2px;background:var(--t0)}
.p2b-thermo-l{position:relative;height:16px;font-size:12px;color:var(--t2);margin-top:3px}
.p2b-thermo-l>span{position:absolute;transform:translateX(-50%);white-space:nowrap}
.p2b-thermo-lk{color:var(--t0)!important;font-weight:700;transform:translateX(0)!important;margin-left:8px}
.p2b-mini-sw{display:flex;flex-direction:column;align-items:center;gap:2px;font-size:12px;color:var(--t2);font-weight:400}
/* fournisseurs */
.p2b-four{display:flex;flex-direction:column}
.p2b-four-r{display:flex;align-items:center;gap:8px;min-height:44px;border-bottom:1px solid var(--bd)}
.p2b-four-n{flex:1;min-width:0;font-size:14px;color:var(--t0);line-height:1.25}
.p2b-four-n small{display:block;font-size:12px;color:var(--t2)}
.p2b-four-p{display:flex;flex-direction:column;align-items:flex-end;font-size:14px;color:var(--t0);gap:2px}
.p2b-four-p em{font-style:normal;font-size:12px;font-weight:600;border-radius:9px;padding:0 7px}
.p2b-stk-ok{color:var(--hoptx);border:1px dashed var(--hop)}
.p2b-stk-ko{color:var(--altx);border:1px solid var(--al)}
.p2b-four-ko .p2b-four-n b,.p2b-four-ko .p2b-four-p>.p2b-n{color:var(--t2)}
.p2b-four-note{font-size:12px;color:var(--t2);margin:6px 0 0;line-height:1.35}
/* finances */
.p2b-src{display:flex;gap:8px;align-items:center;background:var(--finbg);border-radius:8px;padding:6px 10px;font-size:14px;color:var(--t0)}
.p2b-src .p2b-ic{color:var(--fin)}
.p2b-src small{display:block;font-size:12px;color:var(--t2)}
.p2b-relu-fin{display:flex;gap:6px;align-items:center;font-size:12px;color:var(--t2)}
.p2b-sugg button small{display:block;font-size:12px;color:var(--t2)}
.p2b-feuille-courte{top:250px}
.p2b-cv-note{margin:0!important}
.p2b-relu-fin .p2b-ic{color:var(--fin)}
.p2b-feuille-fin .p2b-envoi-on{background:var(--act)}
/* conversations */
.p2b-stat{display:flex;gap:14px;font-size:14px;color:var(--t1)}
.p2b-stat span{display:flex;align-items:center;gap:6px}
.p2b-dot{width:10px;height:10px;border-radius:5px;background:var(--hop);flex:none;display:inline-block}
.p2b-dot-cours{background:none;border:2px solid var(--hop);box-shadow:0 0 0 2px var(--hopbg)}
.p2b-dot-ko{background:none;border:2px solid var(--al)}
.p2b-cv-tete{display:flex;align-items:center;justify-content:space-between}
.p2b-lien{display:inline-flex;align-items:center;gap:6px;min-height:28px;font-size:13px;color:var(--t2)}
.p2b-cv{list-style:none;margin:0;padding:0;display:flex;flex-direction:column}
.p2b-cv li{display:flex;align-items:center;gap:4px;border-bottom:1px solid var(--bd);flex-wrap:wrap}
.p2b-cv-r{flex:1;min-width:0;display:flex;align-items:center;gap:10px;min-height:56px;text-align:left}
.p2b-cv-r>span:nth-child(2){flex:1;min-width:0;line-height:1.25}
.p2b-cv-r b{display:block;font-size:14px;color:var(--t0)}
.p2b-cv-r small{display:block;font-size:12px;color:var(--t2);white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
.p2b-cv-s{font-size:12px;color:var(--t2);text-align:right;line-height:1.25;white-space:nowrap}
.p2b-cv-s small{color:var(--t2)}
.p2b-cv-ok{color:var(--hoptx);font-weight:600}
.p2b-cv-ko{color:var(--altx);font-weight:600}
.p2b-cv-bar{display:block;height:3px;border-radius:2px;background:var(--su);margin-top:4px;width:120px;overflow:hidden}
.p2b-cv-bar i{display:block;height:100%;background:var(--hop)}
.p2b-cv-ouv{background:var(--pn);margin:0 -12px;padding:0 12px}
.p2b-cv-menu{width:100%;display:flex;gap:6px;justify-content:flex-end;padding:0 0 8px}
.p2b-danger{height:28px;padding:0 10px;border-radius:6px;font-size:13px;color:var(--altx);display:inline-flex;align-items:center;gap:5px;border:1px solid transparent}
.p2b-danger-b{border-color:var(--al);height:32px;font-weight:600;font-size:14px}
.p2b-cv-note{margin:auto 0 0;display:flex;gap:6px;align-items:center;font-size:12px;color:var(--t2)}
/* limites */
.p2b-reg{gap:12px}
.p2b-reg-g{display:flex;flex-direction:column;gap:6px;padding-bottom:10px;border-bottom:1px solid var(--bd)}
.p2b-reg-h{display:flex;justify-content:space-between;align-items:baseline;font-size:14px;color:var(--t1)}
.p2b-reg-h b{font-size:14px;color:var(--t0)}
.p2b-reg-r{display:flex;align-items:center;justify-content:space-between;font-size:14px;color:var(--t1)}
.p2b-pas{display:flex;align-items:center;gap:4px}
.p2b-pas button{width:32px;height:32px;border:1px solid var(--bdm);border-radius:6px;display:grid;place-items:center;color:var(--t1)}
.p2b-in{width:64px;height:32px;border:1px solid var(--bdm);border-radius:6px;background:var(--pn);font:16px var(--mono);text-align:right;padding:0 6px;color:var(--t0)}
.p2b-in-u{font-size:12px;color:var(--t2)}
.p2b-reg-s{font-size:12px;color:var(--t2)}
.p2b-reg-sw{gap:0}
.p2b-reg-sw .p2b-bascule-l:first-child{border-top:0}
.p2b-reg-sw .p2b-ic{color:var(--t2)}
.p2b-seg{display:flex;height:36px;border:1px solid var(--bd);border-radius:8px;overflow:hidden}
.p2b-seg button{flex:1;font-size:13px;color:var(--t1);display:flex;flex-direction:column;align-items:center;justify-content:center;line-height:1.1;border-right:1px solid var(--bd)}
.p2b-seg button:last-child{border-right:0}
.p2b-seg small{font-size:12px;color:var(--t2)}
.p2b-seg button[aria-pressed=true]{background:var(--act);color:var(--acttx);font-weight:600}
.p2b-seg button[aria-pressed=true] small{color:var(--acttx);opacity:.85}
.p2b-lien-zero{color:var(--altx);align-self:flex-start}
.p2b-pied-reg{flex-direction:row;align-items:center;justify-content:space-between;font-size:12px;color:var(--t2)}
.p2b-pied-reg span{display:flex;gap:6px;align-items:center}
/* zéro */
.p2b-fil-voile{opacity:.35;filter:blur(.5px)}
.p2b-zero{flex:none;margin:0 8px 8px;border:1px solid var(--bdm);border-radius:14px;background:var(--pg);box-shadow:0 -10px 30px -10px rgba(0,0,0,.35);padding:12px;display:flex;flex-direction:column;gap:10px}
.p2b-zero h2{margin:0;font-size:18px;color:var(--t0);display:flex;align-items:center;gap:8px}
.p2b-zero h2 .p2b-ic{color:var(--altx)}
.p2b-zero-c{display:grid;grid-template-columns:1fr 1fr;gap:8px}
.p2b-zero-k{display:flex;flex-direction:column;gap:4px;font-size:14px;color:var(--t1);background:var(--albg);border-radius:8px;padding:8px 10px}
.p2b-zero-k b{display:flex;align-items:center;gap:4px;font-size:12px;color:var(--altx);text-transform:none}
.p2b-zero-g{background:var(--hopbg)}
.p2b-zero-g b{color:var(--hoptx)}
.p2b-zero .p2b-actions{margin-top:0}
.p2b-zero .p2b-bt2{height:32px;font-size:14px}
.p2b-hist{display:flex;flex-direction:column;gap:4px;font-size:12px;color:var(--t2);border-bottom:1px solid var(--bd);padding-bottom:8px}.p2b-hist b{font-size:14px;color:var(--t0)}.p2b-hist>span{display:flex;gap:4px;align-items:center}
.p2b-plaf-r{border-top:1px solid var(--bd);padding-top:6px}
.p2b-coche{display:flex;flex-direction:column;border:1px solid var(--bd);border-radius:10px;padding:4px 10px}.p2b-coche-t{font-size:12px;color:var(--t2);padding:2px 0}.p2b-coche-r{display:grid;grid-template-columns:24px 1fr auto;gap:8px;align-items:center;min-height:32px;font-size:14px;color:var(--t0);border-top:1px solid var(--bd)}.p2b-coche-r .p2b-mono{font-size:12px;color:var(--t2)}
/* bureau */
.p2b-bur-wrap{max-width:100%;overflow-x:auto}
.p2b-bur{width:1280px;height:760px;border-radius:14px;overflow:hidden;background:var(--pg);display:flex;box-shadow:0 10px 30px -14px rgba(0,0,0,.6)}
.p2b-bur-page{flex:1;min-width:0;padding:16px 24px;display:flex;flex-direction:column;gap:12px;background:var(--pg)}
.p2b-bur-top{display:flex;align-items:center;gap:16px;font-size:14px;color:var(--t2);border-bottom:1px solid var(--bd);padding-bottom:10px}
.p2b-bur-top b{font-size:20px;color:var(--t0)}
.p2b-bur-tabs{margin-left:auto;display:flex;gap:4px}
.p2b-bur-tabs i{font-style:normal;height:28px;padding:0 10px;display:flex;align-items:center;border-radius:6px;color:var(--t1)}
.p2b-bur-tabs i.p2b-on{background:var(--act);color:var(--acttx)}
.p2b-bur-mes{display:flex;gap:10px}
.p2b-bur-mes div{flex:1;background:var(--pn);border-radius:10px;padding:8px 12px;font-size:20px;color:var(--t0);font-weight:600}
.p2b-bur-mes small{display:block;font-size:12px;color:var(--t2);font-weight:400}
.p2b-bur-page h3{margin:6px 0 0;font-size:16px;color:var(--t0)}
.p2b-bur-t{width:100%;border-collapse:collapse;font-size:14px;color:var(--t1)}
.p2b-bur-t th{text-align:left;font-size:12px;font-weight:400;color:var(--t2);padding:6px 8px;border-bottom:1px solid var(--bd)}
.p2b-bur-t td{padding:9px 8px;border-bottom:1px solid var(--bd)}
.p2b-bur-mark{color:var(--atttx)}
.p2b-bur-mark .p2b-ic{display:inline-block;vertical-align:-2px;margin-right:4px}
.p2b-bur-vise td{background:var(--attbg);color:var(--t0);font-weight:600}
.p2b-bur-vise td:first-child{box-shadow:inset 3px 0 0 var(--attbd)}
.p2b-bur-vise s{color:var(--t2);font-weight:400}
.p2b-bur-j{display:flex;flex-direction:column;gap:6px;font-size:14px;color:var(--t1)}
.p2b-bur-j b{color:var(--t0);margin-right:8px;font-weight:600}
.p2b-bur-pan{width:440px;flex:none;border-left:1px solid var(--bd);display:flex;flex-direction:column;background:var(--pg);box-shadow:-12px 0 30px -20px rgba(0,0,0,.35)}
.p2b-pile-lg .p2b-pile-b{height:22px}
.p2b-pv{background:var(--hopbg);color:var(--hoptx);box-shadow:inset 0 0 0 1.5px var(--hop)}
.p2b-frise-cap{display:flex;justify-content:space-between;font-size:12px;line-height:1.1;color:var(--t2);padding:0 2px 0 30px;margin-bottom:-6px}
.p2b-t{font-size:12px;color:var(--t2);white-space:nowrap}
.p2b-t .p2b-mono{color:var(--t1)}
.p2b-cv-r small.p2b-cv-2{margin-top:1px}
.p2b-bf{display:flex;flex-direction:column;gap:6px;background:var(--pn);border-radius:10px;padding:12px 20px 10px 14px}
.p2b-bf-row{display:grid;grid-template-columns:64px 1fr;align-items:end}
.p2b-bf-k{font-size:12px;color:var(--t2)}
.p2b-bf-tr{position:relative;height:48px}
.p2b-bf-c{position:absolute;bottom:0;height:10px;border-radius:5px}
.p2b-bf-fait{background:var(--bdm)}
.p2b-bf-purge{background:var(--attbd)}
.p2b-bf-prop{background:var(--hop)}
.p2b-bf-was{background:repeating-linear-gradient(135deg,var(--bdm) 0 2px,transparent 2px 5px);border-radius:0 5px 5px 0}
.p2b-bf-lb{position:absolute;top:0;font-size:12px;color:var(--t2);line-height:1.25;white-space:nowrap}
.p2b-bf-lb b{display:block;color:var(--t0);font-weight:600;font-size:14px}
.p2b-bf-auj{position:absolute;top:-4px;bottom:-6px;width:2px;margin-left:-1px;background:var(--t0);z-index:1}
.p2b-bf-axe{position:relative;height:24px;border-top:2px solid var(--bdm)}
.p2b-bf-axe>span{position:absolute;top:5px;transform:translateX(-50%);font-size:12px;color:var(--t2);white-space:nowrap}
.p2b-bf-axe>span:first-of-type{transform:none}
.p2b-bf-axe>span.p2b-on{color:var(--t0);font-weight:600}
.p2b-bf-axe>i{position:absolute;top:-5px;width:2px;height:8px;margin-left:-1px;background:var(--bdm)}
.p2b-bf-tr-j{height:42px;align-self:start}
.p2b-bf-row-j{align-items:start}
.p2b-bf-m{position:absolute;top:0;transform:translateX(-50%);display:flex;flex-direction:column;align-items:center;font-size:12px;color:var(--t2);white-space:nowrap;line-height:1.3}
.p2b-bf-m::before{content:"";width:8px;height:8px;border-radius:4px;background:var(--t1);margin-bottom:3px}
.p2b-bf-m b{color:var(--t0);font-weight:600}
.p2b-bf-m.p2b-bf-av::before{background:transparent;box-shadow:inset 0 0 0 1.5px var(--t2)}
@media (max-width:500px){body{padding:0 0 16px}.p2b-pl{grid-template-columns:minmax(0,1fr);gap:16px}.p2b-pl-bureau{min-width:0}.p2b-pl-col{width:auto}.p2b-pl-titre,.p2b-pl-sous,.p2b-pl-lib{padding:0 8px}.p2b-pl-titre{padding-top:8px}.p2b-tel{border-radius:0;width:100%}}
`;

const logo = 'data:image/svg+xml,' + encodeURIComponent(`<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="#6E9B5B" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">${I.etincelle}</svg>`);

const html = `<!doctype html><html lang="fr"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<title>p2b — la base, l’attente en frise d’étapes (passe 2, 14.11)</title><style>${css}</style></head><body>
<h1 class="p2b-pl-titre"><img class="p2b-pl-logo" src="${logo}" alt="" width="20" height="20">p2b — la base, l’attente en frise d’étapes · passe 2</h1>
<p class="p2b-pl-sous">Compagnon brasseur · New England IPA, brassin 31, ${m('19', 'L')} · 11 cadres de 390 × 760 et un cadre bureau 1280 × 760 · cadres statiques</p>
<div class="p2b-pl">
${accueil}
${attente}
${reponse}
${erreur}
${finances}
${conversations}
${plafond}
${urgent}
${fournisseurs}
${limites}
${zero}
${bureau}
</div></body></html>`;

writeFileSync(join(ICI, 'etat.html'), html);
console.log('etat.html', html.length, 'octets');
