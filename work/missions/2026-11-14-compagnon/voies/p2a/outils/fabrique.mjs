// Assemble p2a/etat.html : passe 2 de s3b (les représentations), 12 cadres statiques.
// Icônes reprises du sprite de s3b (préfixe changé par split/join, L26) ; aucun appel réseau.
import { readFileSync, writeFileSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
const ICI = dirname(fileURLToPath(import.meta.url));
const s3b = readFileSync(join(ICI, '../../s3/s3b/etat.html'), 'utf8');
const debut = s3b.indexOf('<svg width="0"');
const fin = s3b.indexOf('</symbol></svg>', debut) + '</symbol>'.length;
const sym = (id, d) => `<symbol id="p2a-i-${id}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">${d}</symbol>`;
const extra = [
  sym('serveur', '<path d="M7 2h13a2 2 0 0 1 2 2v4a2 2 0 0 1-2 2h-5"/><path d="M10 10 2.5 2.5C2 2 2 2.5 2 3v5a2 2 0 0 0 2 2h6z"/><path d="M22 17v-1a2 2 0 0 0-2-2h-1"/><path d="M4 14a2 2 0 0 0-2 2v4a2 2 0 0 0 2 2h16.5l1-.5.5.5-8-8H4z"/><path d="M6 18h.01"/><path d="m2 2 20 20"/>'),
  sym('flocon', '<path d="M2 12h20M12 2v20M20 16l-4-4 4-4M4 8l4 4-4 4M16 4l-4 4-4-4M8 20l4-4 4 4"/>'),
  sym('minuteur', '<path d="M10 2h4M12 14l3-3"/><circle cx="12" cy="14" r="8"/>'),
  sym('poubelle', '<path d="M3 6h18M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2"/>'),
  sym('plus3', '<circle cx="12" cy="12" r="1"/><circle cx="19" cy="12" r="1"/><circle cx="5" cy="12" r="1"/>'),
  sym('sortie', '<path d="M7 7h10v10M7 17 17 7"/>'),
  sym('portefeuille', '<path d="M19 7V4a1 1 0 0 0-1-1H5a2 2 0 0 0 0 4h15a1 1 0 0 1 1 1v4h-3a2 2 0 0 0 0 4h3a1 1 0 0 0 1-1v-2a1 1 0 0 0-1-1"/><path d="M3 5v14a2 2 0 0 0 2 2h15a1 1 0 0 0 1-1v-4"/>'),
  sym('facture', '<path d="M4 2v20l2-1 2 1 2-1 2 1 2-1 2 1 2-1 2 1V2l-2 1-2-1-2 1-2-1-2 1-2-1-2 1Z"/><path d="M16 8h-6a2 2 0 1 0 0 4h4a2 2 0 1 1 0 4H8M12 17.5v-11"/>'),
  sym('outil', '<path d="M14.7 6.3a1 1 0 0 0 0 1.4l1.6 1.6a1 1 0 0 0 1.4 0l3.77-3.77a6 6 0 0 1-7.94 7.94l-6.91 6.91a2.12 2.12 0 0 1-3-3l6.91-6.91a6 6 0 0 1 7.94-7.94l-3.76 3.76z"/>'),
  sym('calendrier', '<rect x="3" y="4" width="18" height="18" rx="2"/><path d="M16 2v4M8 2v4M3 10h18"/>'),
  sym('doublon', '<rect x="8" y="8" width="14" height="14" rx="2"/><path d="M4 16c-1.1 0-2-.9-2-2V4c0-1.1.9-2 2-2h10c1.1 0 2 .9 2 2"/>'),
  sym('trombone', '<path d="m21.44 11.05-9.19 9.19a6 6 0 0 1-8.49-8.49l8.57-8.57A4 4 0 1 1 18 8.84l-8.59 8.57a2 2 0 0 1-2.83-2.83l8.49-8.48"/>'),
  sym('graphe', '<path d="M3 3v18h18"/><path d="m19 9-5 5-4-4-3 3"/>'),
  sym('retour', '<path d="m12 19-7-7 7-7M19 12H5"/>'),
  sym('verrou', '<rect x="3" y="11" width="18" height="11" rx="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/>'),
].join('');
const sprite = s3b.slice(debut, fin).split('s3b-i-').join('p2a-i-') + extra + '</svg>';

// ---------- aides ----------
const I = (n, c = '') => `<svg class="p2a-i${c ? ' ' + c : ''}" aria-hidden="true"><use href="#p2a-i-${n}"/></svg>`;
const N = (n) => `<span class="p2a-n">${n}</span>`;
const M = (n, u) => `<span class="p2a-m">${N(n)}&nbsp;${u}</span>`;
const AV = (a, b, u) => `<span class="p2a-m"><s class="p2a-n">${a}</s>&nbsp;→&nbsp;${N(b)}${u ? '&nbsp;' + u : ''}</span>`;
const LOGO = `<img class="p2a-ap-logo" alt="" width="20" height="20" src="data:image/svg+xml,%3Csvg xmlns=%27http://www.w3.org/2000/svg%27 viewBox=%270 0 24 24%27%3E%3Ccircle cx=%2712%27 cy=%2712%27 r=%2710%27 fill=%27%23567F45%27/%3E%3C/svg%3E">`;

const DER = { 'J+1': '<span>Pression</span><span>monte doucement</span>', 'J+4': '<span>Densité</span><span>à relever</span>', 'J+8': '<span>DF relevée</span><span class="p2a-n">1,012</span>' };
const fond = (j, temp = '19 °C') => `<div class="p2a-fond" aria-hidden="true"><div class="p2a-ap-tete">${LOGO}Brassin 31 · New England IPA</div>
<div class="p2a-ap-ong"><span>Recette</span><span>Brassage</span><b>Fermentation</b><span>Journal</span></div>
<div class="p2a-ap-gros"><span class="p2a-n">${temp}</span><span>${j} · 19 L</span></div><div class="p2a-ap-barre"><i></i></div>
<div class="p2a-ap-ligne"><span>Citra · dry hop J+2</span><span class="p2a-n">85 g</span></div>
<div class="p2a-ap-ligne"><span>Galaxy · dry hop J+6</span><span class="p2a-n">43 g</span></div>
<div class="p2a-ap-ligne"><span>Mosaic · dry hop J+9</span><span class="p2a-n">43 g</span></div>
<div class="p2a-ap-ligne">${DER[j]}</div></div><div class="p2a-voile"></div>`;
const fondFin = `<div class="p2a-fond" aria-hidden="true"><div class="p2a-ap-tete p2a-ap-fin">${LOGO}Finances</div>
<div class="p2a-ap-ong"><span>Résumé</span><b>Opérations</b><span>Factures</span><span>Matériel</span></div>
<div class="p2a-ap-gros"><span class="p2a-n">Novembre</span><span>opérations</span></div>
<div class="p2a-ap-ligne"><span>Houblons Suisses SA</span><span class="p2a-n">− 47,50 CHF</span></div>
<div class="p2a-ap-ligne"><span>Malterie · Pilsner 25 kg</span><span class="p2a-n">− 62,00 CHF</span></div>
<div class="p2a-ap-ligne"><span>Vente marché</span><span class="p2a-n">+ 240,00 CHF</span></div>
<div class="p2a-ap-ligne"><span>Fermenteur 30 L</span><span class="p2a-n">− 189,00 CHF</span></div></div><div class="p2a-voile"></div>`;

const tete = (titre, sous, { retour = false, fin = false, badge = true } = {}) => `<header class="p2a-tete${fin ? ' p2a-tete-fin' : ''}">${retour ? `<button class="p2a-ic" aria-label="Retour">${I('retour')}</button>` : ''}<h2>${titre}${sous ? ` <span>· ${sous}</span>` : ''}</h2>
<button class="p2a-ic" aria-label="Mes conversations, une en cours">${I('fil')}${badge ? '<i class="p2a-badge"></i>' : ''}</button>
<button class="p2a-ic" aria-label="Repartir à zéro">${I('zero')}</button>
<button class="p2a-ic" aria-label="Fermer">${I('x')}</button></header>`;
const pied = (txt = 'Décris ce que tu observes…', avant = '', actif = false) => `<footer class="p2a-pied">${avant}<div class="p2a-saisie"><div class="p2a-champ${actif ? ' p2a-plein' : ''}">${txt}</div><button class="p2a-env${actif ? ' p2a-on' : ''}" aria-label="Envoyer">${I('envoyer')}</button></div></footer>`;
const tel = (cadre, fondHtml, contenu, cls = '') => `<div class="p2a-tel${cls}" data-cadre="${cadre}">${fondHtml}${contenu}</div>`;
const fig = (nom, leg, html) => `<figure class="p2a-cadre"><figcaption>${nom} <span>· ${leg}</span></figcaption>\n${html}</figure>\n`;
const feu = (niv, lbl) => `<span class="p2a-feu" role="img" aria-label="Niveau : ${lbl}"><i class="${niv === 'u' ? 'p2a-on-r' : ''}"></i><i class="${niv === 'a' ? 'p2a-on-a' : ''}"></i><i class="${niv === 'i' ? 'p2a-on-v' : ''}"></i></span>`;
const dur = (n) => `<i class="p2a-dur" aria-hidden="true">${[1, 2, 3].map((k) => `<u class="${k <= n ? 'p2a-v' : ''}"></u>`).join('')}</i>`;
const tag = (mode, n) => `<span class="p2a-tag">${dur(n)}${mode}</span>`;
const piste = (pc, cls = '') => `<span class="p2a-piste${cls}"><i style="width:${pc}%"></i></span>`;
const bascule = (on, lbl) => `<span class="p2a-bascule${on ? ' p2a-on' : ''}" role="switch" aria-checked="${on}" aria-label="${lbl}"><i></i></span>`;
const segModes = (sel, note = '') => `<div class="p2a-modes" role="radiogroup" aria-label="Mode" data-booster="modes-en-jauges">${[['Rapide', 1], ['Auto', 2], ['Approfondi', 3]].map(([m, n]) => `<button class="p2a-mode${m === sel ? ' p2a-sel' : ''}" role="radio" aria-checked="${m === sel}">${dur(n)}${m}</button>`).join('')}</div>`;
const segConseil = (sel, note) => `<div class="p2a-modes-w"><span class="p2a-mode-cons">${I('ok')}${sel} ${note}</span>${segModes(sel)}</div>`;
const Q1 = `La fermentation est à ${M('19', '°C')} depuis ${M('36', 'h')} et la pression monte doucement : que faire ?`;
const Q2 = `Dégustation J+8 : ça sent l'herbe coupée, que faire ?`;

// ---------- cadres ----------
const accueil = fig('accueil', 'J+1, 36 h après le brassage : la frise, des questions qui portent leur mode', tel('accueil', fond('J+1'), `<section class="p2a-feuille">${tete('Compagnon', 'Brassin 31 · J+1')}
<div class="p2a-corps">
<div class="p2a-pres"><h3>Agir, mesurer ou attendre ?</h3><p>${M('19', '°C')} depuis ${M('36', 'h')} · ${M('19', 'L')} · Citra demain</p></div>
<div class="p2a-frise" data-booster="frise-brassin" role="img" aria-label="Brassin 31 : aujourd'hui J+1, Citra J+2, Galaxy J+6, Mosaic J+9">
<span class="p2a-fr-rail"></span><span class="p2a-fr-fait" style="width:8.3%"></span>
<span class="p2a-fr-auj" style="left:8.3%"><b>auj.</b></span>
<span class="p2a-fr-pt" style="left:16.7%"><b>Citra</b><small>J+2</small></span>
<span class="p2a-fr-pt" style="left:50%"><b>Galaxy</b><small>J+6</small></span>
<span class="p2a-fr-pt" style="left:75%"><b>Mosaic</b><small>J+9</small></span>
<span class="p2a-fr-bout"><small>J+12</small></span></div>
<div class="p2a-tuiles" data-booster="tuiles-questions">
<button class="p2a-tuile">${I('pression')}<span>La pression monte : je purge ?</span>${tag('Rapide', 1)}</button>
<button class="p2a-tuile">${I('goutte')}<span>Densité : je mesure quand ?</span>${tag('Rapide', 1)}</button>
<button class="p2a-tuile">${I('feuille')}<span>Galaxy : je garde ${M('43', 'g')} ?</span>${tag('Auto', 2)}</button>
<button class="p2a-tuile">${I('calendrier')}<span>Combien de jours de garde ?</span>${tag('Rapide', 1)}</button>
</div>
<div class="p2a-duo">
<button class="p2a-mini" data-booster="fil-a-statuts" aria-label="Mes conversations : 2 prêtes, 1 en cours, 1 échec">${I('fil')}<span class="p2a-pts"><i class="p2a-pv"></i>${N('2')}<i class="p2a-pa"></i>${N('1')}<i class="p2a-pr"></i>${N('1')}</span>${I('droite', 'p2a-chev')}</button>
<button class="p2a-mini p2a-lim" data-booster="limites-en-jauges" aria-label="Limites IA, régler"><span class="p2a-lim-l"><span>${N('4')}/${N('120')}</span>${piste(3.3)}</span><span class="p2a-lim-l"><span>${N('2,10')}/${M('15', 'CHF')}</span>${piste(14)}</span>${I('droite', 'p2a-chev')}</button>
</div>
<div class="p2a-lit"><span class="p2a-lbl1">Je lis à chaque question</span><span class="p2a-puce">${I('livre')}Recette</span><span class="p2a-puce">${I('thermo')}Brassin 31</span><span class="p2a-puce">${I('journal')}Journal</span><span class="p2a-puce">${I('outil')}Matériel</span></div>
</div>
${pied('Décris ce que tu observes…', `<div class="p2a-amorces" data-booster="amorces"><button class="p2a-chip">La pression monte…</button><button class="p2a-chip">Ça sent…</button><button class="p2a-chip">La densité…</button></div>${segModes('Auto')}`)}
</section>`));

const attente = fig('attente', '2:29 en Approfondi, dans l’habituel ; la marge du brassin', tel('attente', fond('J+1'), `<section class="p2a-feuille">${tete('Compagnon', 'Brassin 31 · J+1')}
<div class="p2a-corps">
<div class="p2a-q">${Q1}</div>
<div class="p2a-carte p2a-chrono" data-booster="jauge-de-duree">
<div class="p2a-chrono-h"><span class="p2a-n">2:29</span><span>en Approfondi · dans l'habituel</span></div>
<div class="p2a-duree" role="img" aria-label="2 min 29 écoulées ; habituel 1 à 3 min ; arrêt à 3 min 40">
<span class="p2a-rail"></span><span class="p2a-hab" style="left:27.3%;width:54.5%"></span><span class="p2a-fait" style="width:67.7%"></span><span class="p2a-aig" style="left:67.7%"></span></div>
<div class="p2a-grad"><span class="p2a-n">0:00</span><span>habituel ${N('1:00–3:00')}</span><span>arrêt ${N('3:40')}</span></div>
<div class="p2a-etapes" data-booster="etapes-en-segments"><div class="p2a-f"><i></i>Lire</div><div class="p2a-f"><i></i>Calculer</div><div class="p2a-f"><i></i>Sources</div><div class="p2a-e"><i></i>Rédiger</div><div><i></i>Relire</div></div>
<p class="p2a-marge" data-booster="marge-du-brassin">${I('calendrier')}<span>Prochain geste <b>J+2</b>, le Citra : tu as le temps.</span></p>
<div class="p2a-act"><button class="p2a-btn p2a-g">Annuler</button><button class="p2a-btn p2a-p">${I('cloche')}Fermer · me notifier</button></div>
</div>
<div class="p2a-lbl"><span>Déjà lu et calculé</span><span>${M('171', 'g')} · ${M('9,0', 'g/L')}</span></div>
<div class="p2a-carte p2a-calc" data-booster="deja-calcule">
<div class="p2a-pile" role="img" aria-label="Citra 85 g demain, Galaxy 43 g et Mosaic 43 g à venir"><i style="flex:85"></i><i style="flex:43"></i><i style="flex:43"></i></div>
<div class="p2a-leg"><span><b>Citra J+2</b><span>${M('85', 'g')} · demain</span></span><span><b>Galaxy J+6</b><span>${M('43', 'g')}</span></span><span><b>Mosaic J+9</b><span>${M('43', 'g')}</span></span></div>
<div class="p2a-ligne"><span>Température</span><span>${M('19', '°C')} depuis ${M('36', 'h')}</span></div>
<div class="p2a-ligne"><span>Pression</span><span>monte doucement</span></div>
</div>
<div class="p2a-file"><span class="p2a-rang">2</span><div>Et combien de jours de garde à froid ?<small>En file · partira après la réponse</small></div><button class="p2a-ic" aria-label="Retirer de la file">${I('x')}</button></div>
</div>
${pied('Ajouter une question…')}
</section>`));

const propBlock = (nb = 2) => `<div class="p2a-carte p2a-prop" data-booster="avant-apres-barres">
<div class="p2a-lbl"><span>Proposition · rien n'est appliqué sans toi</span><span>${N(String(nb))} cochées</span></div>
<div class="p2a-br"><span class="p2a-case" role="checkbox" aria-checked="true">${I('ok')}</span><span>Contact Mosaic J+9</span><span class="p2a-jours" role="img" aria-label="3 jours, puis 2"><u></u><u></u><u class="p2a-retire"></u></span>${AV('3', '2', 'j')}</div>
<div class="p2a-br"><span class="p2a-case" role="checkbox" aria-checked="true">${I('ok')}</span><span>Temp. dry hop</span><span class="p2a-ech" role="img" aria-label="Échelle de 15 à 20 °C : 19 °C, puis 17 °C">${[0, 1, 2, 3, 4, 5].map((k) => `<u style="left:${k * 20}%"></u>`).join('')}<span class="p2a-ech-fl" style="left:40%;width:40%"></span><span class="p2a-ech-av" style="left:80%"></span><span class="p2a-ech-ap" style="left:40%"></span><small style="left:0">15</small><small style="left:100%">20</small></span>${AV('19', '17', '°C')}</div>
<div class="p2a-br p2a-facult"><span class="p2a-case p2a-off" role="checkbox" aria-checked="false"></span><span>Mosaic J+9 <small>facultatif</small></span><span class="p2a-tr"><span class="p2a-av" style="width:86%"></span><span class="p2a-ap" style="width:70%"></span></span>${AV('43', '35', 'g')}</div>
<div class="p2a-total"><span>Dose totale</span><span>${M('9,0', 'g/L')} inchangée · ${M('8,6', 'g/L')} si cochée</span></div>
<div class="p2a-act"><button class="p2a-btn p2a-g">Écarter</button><button class="p2a-btn p2a-p">${I('ok')}Valider ${nb} modifications</button></div></div>`;
const verdictQ2 = `<div class="p2a-verdict p2a-att" data-booster="feu-de-niveau">${feu('a', 'attention')}
<div><span class="p2a-niv">${I('alerte')}Attention</span><h3>Herbacé : écourte le contact du dry&nbsp;hop.</h3>
<p class="p2a-geste"><span class="p2a-quand">Ce soir</span><span>Purge les pellets du Galaxy.</span></p>
<p class="p2a-geste"><span class="p2a-quand">J+9</span><span>Mosaic : ${AV('3', '2', 'jours')} de contact.</span></p></div></div>`;
const controleQ2 = `<div class="p2a-carte p2a-ctl" data-booster="prochain-controle"><span class="p2a-jalon">${I('horloge')}J+10</span><span class="p2a-ctl-t">Goût avant la garde : l'herbacé doit reculer.</span>
<span class="p2a-ctl-act"><button class="p2a-btn p2a-s">${I('journal')}Au journal</button><span class="p2a-rap">Rappel ${N('09:00')}${bascule(true, 'Rappel J+10 à 9 h')}</span></span></div>`;
const plis = (txt = 'Pourquoi') => `<button class="p2a-plis" data-booster="sources-en-puces">${I('bas')}<b>${txt}</b><span>${I('relu')}relu deux fois</span><span>${I('calcul')}calculs refaits</span><span>${I('livre')}${N('3')} sources</span></button>`;

const verdictQ1 = `<div class="p2a-verdict p2a-inf" data-booster="feu-de-niveau">${feu('i', 'info')}
<div><span class="p2a-niv p2a-niv-i">Info</span><h3>Fermentation normale : laisse monter.</h3>
<p class="p2a-geste"><span class="p2a-quand">Auj.</span><span>Garde ${M('19', '°C')}.</span></p>
<p class="p2a-geste"><span class="p2a-quand">J+2</span><span>Le Citra se fait pendant cette activité.</span></p></div></div>`;
const reponse = fig('reponse', 'attention, J+8 : verdict, gestes datés, barres avant → après', tel('reponse', fond('J+8'), `<section class="p2a-feuille">${tete('Compagnon', 'Brassin 31 · J+8')}
<div class="p2a-corps">
<div class="p2a-q">${Q2}</div>
${verdictQ2}
${propBlock(2)}
${controleQ2}
${plis()}
</div>
${pied('Décris ce que tu observes…', `<div class="p2a-amorces"><button class="p2a-chip p2a-suite">${I('fleche')}<span>Et la garde à froid ?</span></button><button class="p2a-chip">Ça sent encore…</button></div>`)}
</section>`));

const erreur = fig('erreur', 'hors ligne : le chemin coupé ; dessous, l’erreur serveur', tel('erreur', fond('J+1'), `<section class="p2a-feuille">${tete('Compagnon', 'Brassin 31 · J+1')}
<div class="p2a-corps">
<div class="p2a-q p2a-q-garde">${Q1}<small>${I('telephone')}Gardée sur ce téléphone</small></div>
<div class="p2a-carte p2a-chemin" data-booster="chemin-coupe">
<div class="p2a-noeuds"><span class="p2a-nd"><span class="p2a-rd">${I('telephone')}</span>Gardée ici</span>
<span class="p2a-lien"></span><span class="p2a-coupure">${I('horsligne')}</span><span class="p2a-lien p2a-coupe"></span>
<span class="p2a-nd p2a-loin"><span class="p2a-rd">${I('fil')}</span>Pas encore partie</span></div>
<h3>Envoi à confirmer</h3>
<p>Pas de réseau. Elle part une seule fois, quand tu confirmes.</p>
<div class="p2a-act p2a-gauche"><button class="p2a-btn p2a-p">${I('envoyer')}Envoyer au retour du réseau</button><button class="p2a-btn p2a-s">${I('crayon')}Reformuler</button></div></div>
<div class="p2a-garde">${I('verrou')}<div>Rien n'est perdu : recette, brassin et notes restent ici.<small>Ce mois · rien de compté · ${N('2,10')}/${M('15', 'CHF')}</small></div></div>
<div class="p2a-sep"><span>autre état · réseau là, serveur en échec</span></div>
<div class="p2a-serveur" data-booster="erreur-serveur"><span class="p2a-srv-ic">${I('serveur')}</span><div><b>Réponse interrompue</b><small>À l'étape Calculer · rien compté</small>
<div class="p2a-etapes p2a-etapes-mini"><div class="p2a-f"><i></i></div><div class="p2a-x"><i></i></div><div><i></i></div><div><i></i></div><div><i></i></div></div></div>
<div class="p2a-srv-act"><button class="p2a-btn p2a-s">${I('relancer')}Relancer</button><button class="p2a-btn p2a-g">Reformuler</button></div></div>
</div>
${pied('Décris ce que tu observes…', `<p class="p2a-bandeau" data-booster="hors-ligne-avant-envoi">${I('horsligne')}Hors ligne · une nouvelle question attendra ici</p>`)}
</section>`));

const finances = fig('finances', 'depuis Finances « Vérifier mes opérations » : la question découpée en cases', tel('finances', fondFin, `<section class="p2a-feuille">${tete('Compagnon', 'Mes finances', { fin: true })}
<div class="p2a-corps">
<div class="p2a-origine">${I('facture')}Depuis Finances · <b>Vérifier mes opérations</b></div>
<div class="p2a-carte p2a-portee" data-booster="portee-en-cases"><div class="p2a-lbl"><span>Je vérifie</span><span>4 sur 4</span></div>
<div class="p2a-cases"><button class="p2a-cf p2a-on">${I('doublon')}Doublons possibles</button><button class="p2a-cf p2a-on">${I('portefeuille')}Paiements</button><button class="p2a-cf p2a-on">${I('outil')}Classement du matériel</button><button class="p2a-cf p2a-on">${I('trombone')}Pièces à compléter</button></div></div>
<div class="p2a-lbl"><span>Autres questions</span><span>finances</span></div>
<div class="p2a-tuiles p2a-tuiles-fin" data-booster="tuiles-questions">
<button class="p2a-tuile">${I('graphe')}<span>Comprendre mes dépenses</span>${tag('Auto', 2)}</button>
<button class="p2a-tuile">${I('panier')}<span>Préparer un achat de matériel</span>${tag('Approfondi', 3)}</button>
<button class="p2a-tuile">${I('calendrier')}<span>Prévoir mes prochains paiements</span>${tag('Auto', 2)}</button>
<button class="p2a-tuile">${I('livre')}<span>Préparer l'année 2026</span>${tag('Approfondi', 3)}</button>
</div>
<div class="p2a-lit"><span class="p2a-lbl1">Je lis</span><span class="p2a-puce">${I('facture')}Opérations</span><span class="p2a-puce">${I('trombone')}Pièces</span><span class="p2a-puce">${I('outil')}Matériel</span><span class="p2a-puce">${I('relu')}Relu deux fois</span></div>
</div>
<footer class="p2a-pied">${segConseil('Approfondi', 'conseillé pour cette vérification')}<div class="p2a-saisie p2a-saisie-haute"><div class="p2a-champ p2a-plein p2a-zone">Vérifie les incohérences de mes opérations enregistrées : doublons possibles, paiements, classement du matériel et pièces à compléter.</div><button class="p2a-env p2a-on" aria-label="Envoyer">${I('envoyer')}</button></div></footer>
</section>`));

const conv = (titre, q, etat, extra = '') => `<div class="p2a-conv p2a-c-${etat}">${extra ? '' : ''}<span class="p2a-etat" aria-hidden="true"></span><div class="p2a-conv-t"><b>${titre}</b><span>${q}</span></div>`;
const conversations = fig('conversations', 'Mes conversations : statuts en forme, supprimer à un toucher de plus', tel('conversations', fond('J+8'), `<section class="p2a-feuille">
<header class="p2a-tete"><button class="p2a-ic" aria-label="Retour">${I('retour')}</button><h2>Mes conversations</h2><button class="p2a-ic" aria-label="Fermer">${I('x')}</button></header>
<div class="p2a-corps">
<button class="p2a-ligne-btn">${I('zero')}<span>Repartir à zéro · nouvelle conversation</span>${I('droite')}</button>
<div class="p2a-carte p2a-resume" data-booster="fil-a-statuts"><div class="p2a-resume-b" role="img" aria-label="2 prêtes, 1 en cours, 1 en échec"><i class="p2a-pv" style="flex:2"></i><i class="p2a-pa" style="flex:1"></i><i class="p2a-pr" style="flex:1"></i></div>
<div class="p2a-resume-l"><span><i class="p2a-pt p2a-pv"></i>${N('2')} prêtes</span><span><i class="p2a-pt p2a-pa"></i>${N('1')} en cours</span><span><i class="p2a-pt p2a-pr"></i>${N('1')} à relancer</span></div></div>
<div class="p2a-conv p2a-c-pret"><span class="p2a-etat">${I('ok')}</span><div class="p2a-conv-t"><b>New England IPA</b><span>${Q2}</span><small>Réponse prête · attention</small></div><button class="p2a-ic" aria-label="Plus d'actions">${I('plus3')}</button></div>
<div class="p2a-conv p2a-c-cours"><span class="p2a-etat p2a-anneau" role="img" aria-label="En cours, 0:40"><i></i></span><div class="p2a-conv-t"><b>Brassin 30 · Blonde de garde</b><span>Quelle température de garde ?</span><small>En cours · ${N('0:40')}</small></div><button class="p2a-ic" aria-label="Plus d'actions">${I('plus3')}</button></div>
<div class="p2a-conv p2a-c-echec"><span class="p2a-etat">${I('x')}</span><div class="p2a-conv-t"><b>Brassin 29 · Stout</b><span>Le lactose ajouté est-il dosé juste ?</span><small>Échec · rien compté</small></div><button class="p2a-btn p2a-s">${I('relancer')}Relancer</button></div>
<div class="p2a-conv p2a-c-pret p2a-c-fin p2a-ouvert"><span class="p2a-etat">${I('ok')}</span><div class="p2a-conv-t"><b>Mes finances</b><span>Vérifie les incohérences de mes opérations…</span><small>Réponse prête</small></div><button class="p2a-ic p2a-sel" aria-label="Plus d'actions, ouvert">${I('plus3')}</button>
<div class="p2a-menu" data-booster="supprimer-a-un-toucher"><button class="p2a-btn p2a-g">${I('cloche')}Me notifier</button><button class="p2a-btn p2a-g p2a-suppr">${I('poubelle')}Supprimer</button></div></div>
<div class="p2a-reglage-l">${I('cloche')}<span>Me notifier à chaque réponse</span>${bascule(true, 'Me notifier à chaque réponse')}</div>
</div>
<footer class="p2a-pied p2a-pied-duo"><span class="p2a-pied-t">Tes questions continuent pendant que tu brasses.</span><button class="p2a-btn p2a-p">${I('plus')}Nouvelle question</button></footer>
</section>`));

const plafond = fig('plafond', 'budget atteint : la cuve pleine, la question gardée, le plafond à relever', tel('plafond', fond('J+1'), `<section class="p2a-feuille">${tete('Compagnon', 'Brassin 31 · J+1')}
<div class="p2a-corps">
<div class="p2a-q p2a-q-garde">${Q1}<small>${I('telephone')}Gardée · partira quand tu relèves la limite</small></div>
<div class="p2a-carte p2a-plafond" data-booster="jauge-pleine">
<div class="p2a-pl-h">${I('portefeuille')}<h3>Budget IA du mois atteint</h3></div>
<div class="p2a-pleine" role="img" aria-label="15,00 sur 15 CHF"><i></i><span>${N('15,00')}/${M('15', 'CHF')}</span></div>
<div class="p2a-ligne"><span>Aujourd'hui</span><span>${N('4')} sur ${N('120')} questions</span></div>
<div class="p2a-lbl p2a-lbl-h"><span>Plafond du mois</span><span>${AV('15', '20', 'CHF')}</span></div>
<div class="p2a-curseur" data-booster="curseur-plafond" role="slider" aria-valuenow="20" aria-valuemin="5" aria-valuemax="50" aria-label="Plafond du mois en CHF"><span class="p2a-cu-rail"></span><span class="p2a-cu-fait" style="width:33.3%"></span><span class="p2a-cu-ancien" style="left:22.2%"></span><span class="p2a-cu-bouton" style="left:33.3%"></span><span class="p2a-cu-val" style="left:33.3%">${M('20', 'CHF')}</span></div>
<div class="p2a-grad"><span>${M('5', 'CHF')}</span><span>${M('50', 'CHF')}</span></div>
<div class="p2a-act"><button class="p2a-btn p2a-g">Plus tard</button><button class="p2a-btn p2a-p">${I('ok')}Relever à ${M('20', 'CHF')}</button></div>
</div>
<button class="p2a-ligne-btn">${I('bouclier')}<span>Régler toutes les limites</span>${I('droite')}</button>
<div class="p2a-carte p2a-mois" data-booster="mois-en-jauge"><div class="p2a-lbl"><span>Le budget repart le 1er décembre</span><span>dans ${M('17', 'jours')}</span></div>${piste(46.7, ' p2a-piste-l p2a-piste-n')}<div class="p2a-grad"><span>1er nov.</span><span>auj. 14.11</span><span>30 nov.</span></div></div>
<div class="p2a-reglage-l">${I('fil')}<span>Les réponses prêtes restent lisibles</span><span class="p2a-pts"><i class="p2a-pv"></i>${N('2')}<i class="p2a-pa"></i>${N('1')}<i class="p2a-pr"></i>${N('1')}</span></div>
</div>
${pied('En pause · budget du mois atteint', `<p class="p2a-bandeau p2a-bandeau-n">${I('pause')}Une nouvelle question sera gardée ici</p>`)}
</section>`));

const urgent = fig('urgent', 'urgent : la dalle rouge lisible à 2 m, une seule action', tel('urgent', fond('J+1', '24 °C'), `<section class="p2a-feuille">${tete('Compagnon', 'Brassin 31 · J+1')}
<div class="p2a-corps">
<div class="p2a-q">La cuve est montée au-dessus de ${M('24', '°C')}, je fais quoi ?</div>
<div class="p2a-urg" data-booster="dalle-urgente" role="alert">
<span class="p2a-urg-niv">${I('alerte')}Urgent</span>
<h3>La cuve dépasse ${M('24', '°C')} : refroidis maintenant.</h3>
<div class="p2a-thermo" role="img" aria-label="Au-dessus de 24 °C ; visée 19 °C"><span class="p2a-th-rail"></span><span class="p2a-th-vise" style="left:25%"></span><span class="p2a-th-rouge" style="left:66.7%"></span><span class="p2a-th-val" style="left:70%"></span></div>
<div class="p2a-th-grad"><span style="left:25%">visée ${M('19', '°C')}</span><span style="left:66.7%">${M('24', '°C')}</span></div>
</div>
<div class="p2a-carte p2a-urg-geste"><span class="p2a-urg-ic">${I('flocon')}</span><p>Ouvre la circulation de glycol et contrôle la température toutes les ${M('30', 'min')}.</p></div>
<button class="p2a-gros" data-booster="minuteur-30">${I('minuteur')}<span>C'est ouvert · rappel dans ${M('30', 'min')}</span></button>
<div class="p2a-carte p2a-ctl"><span class="p2a-jalon p2a-jalon-r">${I('horloge')}${M('30', 'min')}</span><span class="p2a-ctl-t">Relève la température : elle doit redescendre vers ${M('19', '°C')}.</span><div class="p2a-releves" data-booster="releves-30-min"><i class="p2a-rl-on">maintenant</i><i>${M('+30', 'min')}</i><i>${M('+1', 'h')}</i><i>${M('+1,5', 'h')}</i></div></div>
${plis('Pourquoi')}
</div>
${pied()}
</section>`));

const fournisseurs = fig('fournisseurs', 'remplacer le Galaxy : stock « annoncé », jamais confirmé ; l’app n’achète rien', tel('fournisseurs', fond('J+4'), `<section class="p2a-feuille">${tete('Compagnon', 'Brassin 31 · J+4')}
<div class="p2a-corps">
<div class="p2a-q">Galaxy introuvable chez moi, je le remplace ?</div>
<div class="p2a-verdict p2a-inf">${feu('i', 'info')}<div><span class="p2a-niv p2a-niv-i">Info</span><h3>Le Citra peut remplacer le Galaxy à J+6.</h3><p class="p2a-geste"><span class="p2a-quand">J+6</span><span>Même dose, ${M('43', 'g')} : un sachet de ${M('100', 'g')} suffit.</span></p></div></div>
<div class="p2a-lbl"><span>Où acheter</span><span>vérifié le 14.11 · ${N('20:59')}</span></div>
<div class="p2a-four" data-booster="stock-annonce"><div class="p2a-four-h"><b>Citra T90 pellets</b>${M('100', 'g')}<span class="p2a-prix">${M('9,50', 'CHF')}</span></div>
<div class="p2a-four-b"><span>Houblons Suisses SA</span><span class="p2a-stock p2a-ok">${I('horloge')}annoncé en stock</span><button class="p2a-ic" aria-label="Voir la fiche du vendeur">${I('sortie')}</button></div></div>
<div class="p2a-four p2a-four-non"><div class="p2a-four-h"><b>Galaxy T90 pellets</b>${M('100', 'g')}<span class="p2a-prix">${M('11,20', 'CHF')}</span></div>
<div class="p2a-four-b"><span>Brasserie Service Romand</span><span class="p2a-stock p2a-non">${I('x')}indisponible</span><button class="p2a-ic" aria-label="Voir la fiche du vendeur">${I('sortie')}</button></div></div>
<p class="p2a-note">${I('panier')}Stock annoncé par le vendeur, à confirmer à la commande. L'app n'achète rien.</p>
<div class="p2a-carte p2a-prop"><div class="p2a-br p2a-br-simple"><span class="p2a-case" role="checkbox" aria-checked="true">${I('ok')}</span><span>Dry hop J+6</span><span class="p2a-m"><s>Galaxy</s>&nbsp;→&nbsp;Citra</span><span class="p2a-m">${M('43', 'g')}</span></div>
<div class="p2a-act"><button class="p2a-btn p2a-g">Écarter</button><button class="p2a-btn p2a-p">${I('ok')}Valider 1 modification</button></div></div>
${plis()}
</div>
${pied()}
</section>`));

const limites = fig('limites', 'limites ouvertes : jauges et curseurs, la suspension sans rouge', tel('limites', fond('J+8'), `<section class="p2a-feuille">
<header class="p2a-tete"><button class="p2a-ic" aria-label="Retour">${I('retour')}</button><h2>Limites IA</h2><button class="p2a-ic" aria-label="Fermer">${I('x')}</button></header>
<div class="p2a-corps">
<div class="p2a-carte p2a-regl" data-booster="limites-en-jauges"><div class="p2a-lbl"><span>Questions aujourd'hui</span><span>${N('4')} sur ${N('120')}</span></div>${piste(3.3, ' p2a-piste-l')}
<div class="p2a-regl-l"><span>Plafond par jour</span><span class="p2a-num"><input class="p2a-in" inputmode="numeric" value="120" aria-label="Plafond de questions par jour"><span>questions</span></span></div></div>
<div class="p2a-carte p2a-regl"><div class="p2a-lbl"><span>Budget du mois</span><span>${N('2,10')} sur ${M('15', 'CHF')}</span></div>${piste(14, ' p2a-piste-l')}
<div class="p2a-regl-l"><span>Plafond du mois</span><span class="p2a-num"><input class="p2a-in" inputmode="decimal" value="15,00" aria-label="Plafond du mois en CHF"><span>CHF</span></span></div></div>
<div class="p2a-carte p2a-regl"><div class="p2a-lbl"><span>Mode par défaut · durée et coût</span><span>relatifs</span></div>
<div class="p2a-modes-l">${[['Rapide', 1, 'quelques s'], ['Auto', 2, '15 à 30 s'], ['Approfondi', 3, '1 à 3 min']].map(([m, n, d]) => `<button class="p2a-ml${m === 'Auto' ? ' p2a-sel' : ''}"><b>${m}</b><span>${dur(n)}durée</span><span>${dur(n)}coût</span><small>${d}</small></button>`).join('')}</div></div>
<div class="p2a-reglage-l">${I('cloche')}<span>Me notifier à la réponse</span>${bascule(true, 'Me notifier à la réponse')}</div>
<div class="p2a-reglage-l">${I('pause')}<span>Suspendre l'IA<small>Tes questions restent gardées ici</small></span>${bascule(false, 'Suspendre l’IA')}</div>
<div class="p2a-carte p2a-mois" data-booster="mois-en-jauge"><div class="p2a-lbl"><span>Le budget repart le 1er décembre</span><span>dans ${M('17', 'jours')}</span></div>${piste(46.7, ' p2a-piste-l p2a-piste-n')}<div class="p2a-grad"><span>1er nov.</span><span>auj. 14.11</span><span>30 nov.</span></div></div>
<p class="p2a-note">${I('telephone')}Limite atteinte : la question reste gardée ici ; tu relèves ou tu attends.</p>
</div>
<footer class="p2a-pied p2a-pied-duo"><button class="p2a-btn p2a-g">Annuler</button><button class="p2a-btn p2a-p">${I('ok')}Enregistrer</button></footer>
</section>`));

const zero = fig('zero', 'repartir à zéro : ce qui s’efface, ce qui reste', tel('zero', fond('J+1'), `<section class="p2a-feuille p2a-feuille-dessous">${tete('Compagnon', 'Brassin 31 · J+1')}
<div class="p2a-corps"><div class="p2a-q">${Q1}</div>${verdictQ1}</div></section>
<div class="p2a-voile2"></div>
<section class="p2a-dialogue" role="dialog" aria-label="Repartir à zéro ?" data-booster="efface-reste">
<h3>${I('zero')}Repartir à zéro ?</h3>
<div class="p2a-colonnes">
<div class="p2a-col p2a-col-efface"><span class="p2a-lbl1">S'efface</span><p>${I('x')}Les échanges de ce brassin</p><p>${I('x')}La réponse en cours</p><p>${I('x')}La question en file</p></div>
<div class="p2a-col p2a-col-reste"><span class="p2a-lbl1">Reste</span><p>${I('ok')}Recette New England IPA</p><p>${I('ok')}Brassin 31 et son journal</p><p>${I('ok')}Notes déjà gardées</p></div>
</div>
<p class="p2a-note">${I('cloche')}Le contrôle de densité J+4, gardé au journal, reste aussi.</p>
<div class="p2a-act"><button class="p2a-btn p2a-s">Annuler</button><button class="p2a-btn p2a-d p2a-d-plein">${I('zero')}Effacer les échanges</button></div>
</section>`));

const bureau = fig('bureau', '1280 × 760 : la page du brassin éclairée là où la proposition agit, le compagnon en panneau', `<div class="p2a-tel p2a-large" data-cadre="bureau"><div class="p2a-bur">
<div class="p2a-bur-page"><div class="p2a-ap-tete">${LOGO}Brassin 31 · New England IPA<span class="p2a-bur-j">J+8 · ${M('19', 'L')}</span></div>
<div class="p2a-ap-ong"><span>Recette</span><span>Brassage</span><b>Fermentation</b><span>Journal</span></div>
<div class="p2a-bur-stats"><div><small>Température</small>${M('19', '°C')}</div><div><small>DF relevée</small>${N('1,012')}</div><div><small>Dry hop</small><span>${M('171', 'g')} · ${M('9,0', 'g/L')}</span></div></div>
<div class="p2a-bur-frise" data-booster="frise-contacts" role="img" aria-label="Contacts du dry hop sur la frise du brassin">
<div class="p2a-bf-ax">${Array.from({ length: 13 }, (_, k) => `<span>J+${k}</span>`).join('')}</div>
<div class="p2a-bf-l"><b>Citra</b><span class="p2a-bf-bar p2a-bf-fait" style="left:calc(84px + (100% - 84px) * 0.1538);width:calc((100% - 84px) * 0.0769)"></span></div>
<div class="p2a-bf-l p2a-vise"><b>Galaxy</b><span class="p2a-bf-bar p2a-bf-fait" style="left:calc(84px + (100% - 84px) * 0.4615);width:calc((100% - 84px) * 0.1538)"></span><span class="p2a-bf-tag" style="left:calc(84px + (100% - 84px) * 0.6269)">purge ce soir</span></div>
<div class="p2a-bf-l p2a-vise"><b>Mosaic</b><span class="p2a-bf-bar p2a-bf-ancien" style="left:calc(84px + (100% - 84px) * 0.6923);width:calc((100% - 84px) * 0.2308)"></span><span class="p2a-bf-bar" style="left:calc(84px + (100% - 84px) * 0.6923);width:calc((100% - 84px) * 0.1538)"></span><span class="p2a-bf-tag" style="left:calc(84px + (100% - 84px) * 0.9308)">${AV('3', '2', 'j')}</span></div>
<span class="p2a-bf-auj" style="left:calc(96px + (100% - 108px) * 0.6154)"><b>auj.</b></span></div>
<div class="p2a-bur-table">
<div class="p2a-ap-ligne"><span>Citra · dry hop J+2</span><span>${M('85', 'g')}</span></div>
<div class="p2a-ap-ligne p2a-vise"><span>Galaxy · dry hop J+6</span><span class="p2a-bur-prop">purger ce soir</span><span>${M('43', 'g')}</span></div>
<div class="p2a-ap-ligne p2a-vise"><span>Mosaic · dry hop J+9 · contact</span><span class="p2a-bur-prop">${AV('3', '2', 'j')}</span><span>${M('43', 'g')}</span></div>
<div class="p2a-ap-ligne p2a-vise"><span>Température du dry hop</span><span class="p2a-bur-prop">${AV('19', '17', '°C')}</span><span>${M('19', '°C')}</span></div>
</div>
<div class="p2a-bur-jour"><span class="p2a-lbl1">${I('journal')}Journal du brassin</span><div class="p2a-ap-ligne"><span>J+1 · La pression monte doucement</span><span>${M('19', '°C')}</span></div><div class="p2a-ap-ligne"><span>J+2 · Citra ajouté</span><span>${M('85', 'g')}</span></div><div class="p2a-ap-ligne"><span>J+6 · Galaxy ajouté</span><span>${M('43', 'g')}</span></div><div class="p2a-ap-ligne"><span>J+7 · DF relevée</span><span>${N('1,012')}</span></div><div class="p2a-ap-ligne"><span>J+8 · Dégustation : herbe coupée</span><span>contrôle J+10</span></div></div></div>
<section class="p2a-panneau">${tete('Compagnon', 'Brassin 31 · J+8')}
<div class="p2a-corps">
<div class="p2a-q">${Q2}</div>
${verdictQ2}
${propBlock(2)}
${controleQ2}
<div class="p2a-carte p2a-pourquoi"><span class="p2a-lbl1">${I('bas')}Pourquoi</span><p>Contact long à ${M('19', '°C')} : les pellets cèdent leur vert. ${M('9,0', 'g/L')} reste une dose usuelle de NEIPA : ce n'est pas la dose.</p>${plis('Détails').replace('<button class="p2a-plis"', '<div class="p2a-plis p2a-plis-in"').replace('</button>', '</div>')}</div>
</div>
${pied()}
</section></div></div>`);

const CSS = readFileSync(join(ICI, 'style.css'), 'utf8');
const corps = [accueil, attente, reponse, erreur, finances, conversations, plafond, urgent, fournisseurs, limites, zero, bureau].join('\n');
// espaces insécables avant ? : ; ! dans le texte (jamais dans le style)
const corpsNb = corps.replace(/ ([?:;!])(?=[\s<]|$)/g, '&nbsp;$1');
const html = `<!doctype html><html lang="fr" data-theme="clair"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<title>p2a — compagnon brasseur — passe 2 de s3b : feu, barres avant → après, jauge de durée</title><style>
${CSS}</style></head><body>${sprite}
<main class="p2a-planche">
${corpsNb}
</main></body></html>`;
writeFileSync(join(ICI, '../p2a/etat.html'), html);
console.log('etat.html', html.length, 'car.');
