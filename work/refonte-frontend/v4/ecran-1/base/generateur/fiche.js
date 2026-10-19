/* La fiche du houblon (D25), sur toute la base : appui long de 500 ms au doigt, survol de 750 ms à
   la souris, sur tout nom de houblon (data-houblon) ; un toucher court garde son action.
   La fiche p08 du lot 4 avec les greffes du jury : α et rôle au premier plan ; la table des
   moments de p11 (l'IBU de CE houblon à chaque moment, lu dans les tables du pack à la durée
   d'ébullition courante ; un toucher y place l'ajout, le résumé IBU bouge au-dessus) ; la roue
   chiffrée « N/M » et sa légende (p01, p02) à la place des puces d'arômes ; une feuille à
   mi-hauteur qui laisse voir la ligne et le résumé IBU (p01, p11) ; les actions Ajouter et
   Comparer (p02) ; Styles, Huiles, Sources, Substituts repliés.
   La fiche décrit le houblon (ce que ses fiches citent), pas le problème de ma bière : aucune
   couleur d'alerte (D40). Aucun chiffre calculé : tables et fiches du pack, dose × table. */
const APPUI_MS = 500, SURVOL_MS = 750;
const FICHE = { cle: null, mode: null, source: null, epingle: false, racine: null, sec: null, moment: {}, tFerme: null };
const NR = 'non renseigné';
const nbF = (v) => String(v).replace('.', ',');
const plageF = (s) => (s.min === s.max ? nbF(s.min) : nbF(s.min) + '–' + nbF(s.max));
const recente = (arr) => (arr || []).reduce((a, s) => (!a || (s.an || 0) > (a.an || 0) ? s : a), null);
const ROLE_MOT = { 'amérisant': 'amérisant', aromatique: 'aromatique', double: 'double usage' };
function vibrer() { try { if (navigator.vibrate) navigator.vibrate(8); } catch (e) { /* rien */ } }

/* Ce que la page sait de ce houblon : sa ligne dans la recette, sinon l'ajout proposé. */
const ligneDe = (cle) => ETAT.lignes.find((l) => l.cle === cle) || null;
const rapideDe = (cle) => [...D.rapides.stock, ...D.rapides.epuises, ...D.rapides.catalogue, ...(D.rapides.construction || [])].find((r) => r.cle === cle) || null;
/* Stock : la même icône discrète que l'étape (D23 ter), seulement l'exception. */
function stockFiche(cle, nom) {
  const i = ETAT.lignes.findIndex((l) => l.cle === cle);
  if (i >= 0) { const st = etatsStock()[i]; return stockIcone(st.code, st.txt); }
  const r = rapideDe(cle);
  if (r) return statutRapide(r);
  const g = D.groupes[nom];
  return g === 'epuise' ? stockIcone('a-racheter', 'à racheter') : g === 'catalogue' ? stockIcone('a-acheter', 'à acheter') : null;
}

/* ---------- Premier plan ---------- */
function tete(F, cle) {
  return h('header', { class: 'f-tete' },
    h('h2', { class: 'f-nom' }, F.nom), stockFiche(cle, F.nom),
    h('button', { class: 'f-fermer', 'data-role': 'fermer-fiche', 'data-k': 'f-fermer', 'aria-label': 'Fermer la fiche de ' + F.nom, onclick: (e) => { e.stopPropagation(); fermerFiche(); } }));
}
/* Les acides alpha d'abord (« pas d'info sur les AA ») : la plage de la source la plus récente, mon
   lot, la réglette de toutes les sources (0 à 25 %) ; puis le rôle (pointillé : déduit d'une règle
   sur l'alpha, à valider ; plein : dit par un fournisseur). */
function reglette(F, a) {
  const W = 60, s = sv('svg', { width: W, height: 12, 'aria-hidden': 'true', class: 'f-reglette' });
  const x = (v) => 2 + Math.max(0, Math.min(1, v / 25)) * (W - 4);
  sv('rect', { x: 2, y: 4, width: W - 4, height: 4, rx: 2, fill: '#e4e4e4' }, s);
  for (const src of F.alpha) sv('rect', { x: x(src.min) - 1, y: 2, width: Math.max(3, x(src.max) - x(src.min) + 2), height: 8, rx: 2, fill: src === a ? '#3d3d3d' : '#bdbdbd' }, s);
  if (F.lot != null) sv('rect', { x: x(F.lot) - 1.5, y: 0, width: 3, height: 12, rx: 1, fill: '#111', stroke: '#fff', 'stroke-width': 1 }, s);
  return s;
}
function blocAlpha(F) {
  const a = recente(F.alpha);
  const role = F.role ? ROLE_MOT[F.role.v] || F.role.v : null;
  const txt = a ? plageF(a) + ' %' : F.lot != null ? nbF(F.lot) + ' %' : NR;
  return h('div', { class: 'f-ab' },
    h('span', { class: 'f-alpha', 'data-role': 'fiche-alpha', 'aria-label': 'Acides alpha ' + txt + (a ? ' (' + a.src + (a.an ? ' ' + a.an : '') + ')' : '') + (F.lot != null && a ? ', mon lot ' + nbF(F.lot) + ' %' : '') },
      h('span', { class: 'f-grec' }, 'α'), h('b', { class: 'f-aa' }, txt), a && F.lot != null ? h('span', { class: 'f-lot' }, 'lot ' + nbF(F.lot) + ' %') : null),
    a ? reglette(F, a) : null,
    role ? h('span', { class: 'f-role' + (/^règle/.test(F.role.src || '') ? ' regle' : ''), title: F.role.src || '', 'aria-label': 'Rôle : ' + role + (F.role.src ? ', ' + F.role.src : '') }, role) : null);
}
/* La table des moments (p11) : début de l'ébullition (durée courante), 10′, whirlpool, à froid, et
   le moment de l'ajout s'il est ailleurs. IBU de cette dose, lu dans les tables du pack (dose ×
   table) ; un houblon ni dans la recette ni proposé n'a que son IBU par gramme (fiche). */
const froidF = (c) => /^dry/.test(c);
const libMoment = (c) => (c === 'fwh' ? 'premier moût' : c === 'wp' ? 'whirlpool' : froidF(c) ? 'à froid' : c.slice(1) + '′');
function tableMoments(F, cle) {
  const l = ligneDe(cle), r = l ? null : rapideDe(cle);
  const base = l || (r ? { ...r, ibu0: { moment: r.moment, g: r.g, v: r.ibu }, wpT: 80, wpMin: 20, jour: 3 } : null);
  const courant = l ? l.moment : r ? FICHE.moment[cle] || momentBorne(r.moment) : null;
  const codes = ['b' + EBU, EBU > 10 ? 'b10' : null, 'wp', 'dryActive'].filter(Boolean);
  if (courant && !froidF(courant) && !codes.includes(courant)) codes.push(courant);
  const rang = (c) => { const k = MOMENTS.findIndex((m) => m.code === c); return k < 0 ? 99 : k; };
  codes.sort((a, b) => rang(a) - rang(b));
  const titre = l ? 'IBU, ' + grammes(l.g) : r ? 'IBU ajoutés, ' + grammes(r.g) : 'IBU par gramme';
  return h('div', { class: 'f-table', role: 'group', 'aria-label': 'Moments de ' + F.nom + ' : ' + titre },
    h('div', { class: 'f-titre' }, titre),
    codes.map((c, n) => {
      const code = froidF(c) && courant && froidF(courant) ? courant : c;
      const ici = courant === code;
      let txt;
      if (base) { const v = ibuLigne({ ...base, moment: code }); txt = v === undefined ? 'à recalculer' : v == null ? 'aucun' : (r ? '+' : '') + ibuTexte(v); }
      else { const pg = F.ibuPG[code]; txt = pg == null ? (froidF(code) ? 'aucun' : NR) : nbF(pg) + '/g'; }
      return h('button', {
        class: 'f-m' + (ici ? ' ici' : '') + (froidF(code) ? ' froid' : code === 'wp' ? ' wp' : ''), 'aria-pressed': String(ici), 'data-k': 'fm' + c, disabled: base ? null : true,
        'data-booster': n === 1 && base ? 'moment de la fiche' : null,
        'aria-label': (l ? 'Placer ' + F.nom + ' : ' : r ? 'Proposer ' + F.nom + ' : ' : '') + quandLong({ moment: code, jour: (l && l.jour) || 3, wpT: (l && l.wpT) || 80, wpMin: (l && l.wpMin) || 20 }) + ', ' + (txt === 'aucun' ? 'aucun IBU' : txt + ' IBU'),
        onclick: (e) => {
          e.stopPropagation();
          if (l) { ETAT.focusK = null; placer(l, code); } else if (r) { FICHE.moment[cle] = code; construireFiche(); }
        },
      }, h('i', { class: 'f-pt', 'aria-hidden': 'true' }), h('span', { class: 'f-ml' }, libMoment(code)), h('span', { class: 'f-mi' }, txt));
    }));
}
/* La roue chiffrée : ce que disent ses fiches (citations 0–2, « N/M » sous la famille). */
function blocArome(F) {
  const z = h('div', { class: 'f-arome', 'data-role': 'fiche-arome' });
  RADAR.roue(z, F, { W: FICHE.mode === 'bulle' ? 326 : 358, H: 246 });
  // h4 : sans légende (19.10) ; sous la roue, la réponse de ses fiches à ma demande, une famille visée
  // par puce (le signe de la flèche, la famille, ce que disent ses fiches).
  const lv = Object.fromEntries(F.aromes.map((a) => [a.f, a]));
  const NIV = ['non décrit', 'cité', 'marqué'];
  if ((D.direction || []).length) z.append(h('p', { class: 'f-dem', 'data-role': 'demande' }, D.direction.map((d) => {
    const a = lv[d.f];
    return h('span', { class: 'f-dem-i' }, h('b', {}, (d.sens > 0 ? '+ ' : '− ') + D.court[d.f]), ' ' + (a && a.lv ? NIV[a.lv] + ' ' + a.n + '/' + a.of : 'inconnu'));
  })));
  return z;
}
/* Mon goût (aimer, exclure ; retoucher revient à neutre) et les actions d'un toucher (p02). */
function blocActions(F, cle) {
  const etat = goutDe(F.nom), l = ligneDe(cle), r = l ? null : rapideDe(cle);
  const gout = (c, t) => h('button', {
    class: 'f-g f-g-' + c, 'aria-pressed': String(etat === c), 'data-k': 'fg' + c,
    'aria-label': (etat === c ? 'Remettre neutre : ' : '') + t + ' ' + F.nom, onclick: (e) => { e.stopPropagation(); noterGout(F.nom, etat === c ? 'neutre' : c); },
  });
  const moment = r ? FICHE.moment[cle] || momentBorne(r.moment) : null;
  const dansComparer = ETAT.vue === 'panneau' && ETAT.partie === 'comparer' && ETAT.comp.includes(F.nom);
  return h('div', { class: 'f-actions' },
    h('span', { class: 'f-gout', role: 'group', 'data-role': 'gout', 'aria-label': 'Mon goût pour ' + F.nom + ' : ' + etat }, gout('aimer', 'Aimer'), gout('exclure', 'Exclure')),
    r ? h('button', { class: 'f-act f-ajouter', 'data-k': 'fa', 'aria-label': 'Ajouter ' + F.nom + ', ' + grammes(r.g) + ' à ' + libMoment(moment), onclick: (e) => { e.stopPropagation(); ajouter(r, moment); } },
      h('span', { class: 'plus-i', 'aria-hidden': 'true' }), 'Ajouter à ' + libMoment(moment)) : null,
    D.fiches[F.nom] && !dansComparer ? h('button', { class: 'f-act', 'data-k': 'fc', 'aria-label': 'Comparer ' + F.nom + ' à d\'autres houblons', onclick: (e) => {
      e.stopPropagation();
      if (!ETAT.comp.includes(F.nom)) { if (ETAT.comp.length >= 4) ETAT.comp.pop(); ETAT.comp.push(F.nom); }
      fermerFiche(); ouvrir('comparer');
    } }, 'Comparer') : null);
}

/* ---------- Replié : Styles, Huiles, Sources, Substituts ---------- */
const srcTxt = (s) => s.src + (s.an ? ' ' + s.an : '');
function rangee(nom, val) { return h('div', { class: 'f-rg' }, h('span', { class: 'f-rg-n' }, nom), h('span', { class: 'f-rg-v' }, val)); }
const SECTIONS = [
  ['styles', 'Styles', (F) => [
    F.styles.length ? h('div', { class: 'tags' }, F.styles.map((t) => h('span', { class: 'tag-f' }, t))) : h('p', { class: 'f-txt gris' }, F.stylesRaison || NR),
    F.stylesSrc.length ? h('p', { class: 'f-txt gris' }, F.stylesSrc.join(' ; ')) : null]],
  ['huiles', 'Huiles', (F) => [
    ...(F.huiles.length ? F.huiles.map((s) => rangee('totale, ' + srcTxt(s), plageF(s) + ' mL/100 g')) : [rangee('totale', NR)]),
    ...F.composants.map((c) => rangee(c.nom, c.min != null ? plageF(c) + ' %' + (c.src ? ', ' + c.src : '') : c.raison || NR))]],
  ['sources', 'Sources', (F) => [
    ...F.alpha.map((s) => rangee('α ' + srcTxt(s), plageF(s) + ' %')),
    ...(F.lot != null ? [rangee('α mon lot', nbF(F.lot) + ' %')] : []),
    ...(F.beta.length ? F.beta.map((s) => rangee('β ' + srcTxt(s), plageF(s) + ' %')) : [rangee('β', NR)]),
    h('p', { class: 'f-txt' }, 'Origine : ' + (F.origine || NR) + (F.base ? ' ; IBU : ' + F.base : '')),
    ...F.aromes.filter((a) => a.lv > 0).map((a) => h('p', { class: 'f-txt' }, h('b', {}, D.court[a.f] + ' ' + a.n + '/' + a.of), ' ' + (a.auteurs.join(', ') || NR))),
    F.desc.length ? h('div', { class: 'tags' }, F.desc.map((t) => h('span', { class: 'tag-f' }, t))) : null]],
  ['subs', 'Substituts', (F) => [F.subs.length ? h('div', { class: 'tags' }, F.subs.map((t) => h('span', { class: 'tag-f' }, t))) : h('p', { class: 'f-txt gris' }, F.subsRaison || NR)]],
];
function blocReplis(F) {
  const sec = SECTIONS.find((s) => s[0] === FICHE.sec);
  return [
    h('div', { class: 'f-replis', role: 'group', 'aria-label': 'Détail de la fiche' }, SECTIONS.map(([id, titre], n) => h('button', {
      class: 'f-repli', 'aria-expanded': String(FICHE.sec === id), 'data-k': 'fr' + id, 'data-booster': n === 0 ? 'repli de la fiche' : null,
      'aria-label': (FICHE.sec === id ? 'Replier ' : 'Déplier ') + titre.toLowerCase(), onclick: (e) => { e.stopPropagation(); FICHE.sec = FICHE.sec === id ? null : id; construireFiche(true); },
    }, titre))),
    sec ? h('section', { class: 'f-sec', 'aria-label': sec[1] }, ...sec[2](F).filter(Boolean)) : null,
  ];
}

/* ---------- Contenant : feuille du bas au téléphone, bulle à côté de la colonne à l'ordinateur ---------- */
function construireFiche(versSection) {
  const cle = FICHE.cle, F = D.fichesH[cle];
  if (!F) return;
  const ancien = FICHE.racine.querySelector('.f-fiche');
  const defil = ancien ? ancien.scrollTop : 0;
  const fe = h('section', { class: 'f-fiche f-' + FICHE.mode, 'data-role': 'fiche', role: 'dialog', tabindex: '-1', 'aria-modal': FICHE.mode === 'feuille' ? 'true' : null, 'aria-label': 'Fiche de ' + F.nom },
    FICHE.mode === 'feuille' ? h('div', { class: 'f-poignee', 'aria-hidden': 'true' }) : null,
    h('div', { class: 'f-corps' }, tete(F, cle), blocAlpha(F), tableMoments(F, cle), blocArome(F), blocActions(F, cle), ...blocReplis(F)));
  const voile = FICHE.mode === 'feuille' ? h('div', { class: 'f-voile', 'aria-hidden': 'true', onclick: () => fermerFiche() }) : null;
  FICHE.racine.replaceChildren(...[voile, fe].filter(Boolean));
  if (FICHE.mode === 'feuille') { placerFeuille(fe); poigneeFeuille(fe); } else placerBulle(fe);
  fe.scrollTop = defil;
  if (versSection) { const s = fe.querySelector('.f-sec'); if (s) s.scrollIntoView({ block: 'nearest' }); }
  marquerSource();
}
/* La feuille prend la hauteur de son contenu, sous le résumé au plus haut : au-dessus, l'étape reste
   lisible (en-tête, résumé IBU, la ligne du houblon). Ce qu'elle couvre est masqué. */
function placerFeuille(fe) {
  fe.style.top = 'auto';
  const hC = fe.getBoundingClientRect().height;
  const res = document.querySelector('#app .resume');
  const min = res ? Math.round(res.getBoundingClientRect().bottom) + 6 : 80;
  const top = FICHE.sec ? min : Math.max(min, Math.round(innerHeight - hC));
  fe.style.top = top + 'px';
  masquerSous(top);
}
function masquerSous(top) {
  demasquer();
  const rangs = [...document.querySelectorAll('#app > *')].flatMap((e) => (e.matches('.frise, .partie, .ajouts') ? [...e.children].flatMap((c) => (c.matches('ul') ? [...c.children] : [c])) : [e]));
  for (const r of rangs) { if (r.matches('.axe')) continue; const b = r.getBoundingClientRect(); if (b.height && b.bottom > top - 4) r.classList.add('sous-fiche'); }
}
function demasquer() { for (const e of document.querySelectorAll('.sous-fiche')) e.classList.remove('sous-fiche'); }
/* Tirer la poignée vers le bas ferme la feuille. */
function poigneeFeuille(fe) {
  const p = fe.querySelector('.f-poignee');
  let y0 = null;
  p.addEventListener('pointerdown', (e) => { y0 = e.clientY; try { p.setPointerCapture(e.pointerId); } catch (x) { /* rien */ } });
  p.addEventListener('pointermove', (e) => { if (y0 != null) fe.style.transform = 'translateY(' + Math.max(0, e.clientY - y0) + 'px)'; });
  p.addEventListener('pointerup', (e) => { if (y0 == null) return; const d = e.clientY - y0; y0 = null; fe.style.transform = ''; if (d > 80) fermerFiche(); });
  p.addEventListener('pointercancel', () => { y0 = null; fe.style.transform = ''; });
}
/* À l'ordinateur : à droite de la colonne de l'étape (elle reste lisible), sinon à gauche. */
function placerBulle(fe) {
  const col = document.getElementById('app').getBoundingClientRect();
  const r = FICHE.source && FICHE.source.isConnected ? FICHE.source.getBoundingClientRect() : { top: 80 };
  const w = fe.offsetWidth, hh = fe.offsetHeight;
  let x = col.right + 16;
  if (x + w > innerWidth - 8) x = col.left - w - 16;
  if (x < 8) x = Math.max(8, innerWidth - w - 8);
  fe.style.left = x + 'px';
  fe.style.top = Math.max(8, Math.min(innerHeight - hh - 8, r.top - 60)) + 'px';
}
/* La ligne d'où vient la fiche reste repérée au-dessus de la feuille. */
function marquerSource() {
  for (const e of document.querySelectorAll('.f-source')) e.classList.remove('f-source');
  const n = [...document.querySelectorAll('#app [data-houblon="' + FICHE.cle + '"]')].find((e) => e.getClientRects().length && !e.closest('.sous-fiche'));
  const c = n && n.closest('.corps-b, .rapide, .voie, .col, .pm, .chip');
  if (c) c.classList.add('f-source');
}
function ouvrirFiche(cle, o) {
  if (!D.fichesH[cle]) return;
  const deja = FICHE.cle != null;
  if (FICHE.cle !== cle) FICHE.sec = null;
  FICHE.cle = cle; FICHE.source = o.source || null; FICHE.mode = o.mode;
  if (!deja) FICHE.epingle = !!o.epingle;
  clearTimeout(FICHE.tFerme);
  construireFiche();
  const fe = FICHE.racine.querySelector('.f-fiche');
  if (!deja && o.anim !== false && !REDUIT) fe.animate(FICHE.mode === 'feuille' ? [{ transform: 'translateY(40%)' }, { transform: 'none' }] : [{ opacity: 0, transform: 'scale(.97)' }, { opacity: 1, transform: 'none' }], { duration: 200, easing: 'cubic-bezier(.2,.8,.2,1)' });
  // Au clavier, le focus va au bouton Fermer ; au doigt, rien ne prend le focus (D33).
  if (ETAT.clavier) { const b = fe.querySelector('[data-role="fermer-fiche"]'); if (b) b.focus({ preventScroll: true }); }
}
function fermerFiche() {
  if (FICHE.cle == null) return;
  const src = FICHE.source;
  FICHE.cle = null; FICHE.epingle = false; FICHE.sec = null;
  clearTimeout(FICHE.tFerme);
  FICHE.racine.replaceChildren();
  demasquer();
  for (const e of document.querySelectorAll('.f-source')) e.classList.remove('f-source');
  if (ETAT.clavier && src && src.isConnected) { const f = src.closest('button, [tabindex]'); if (f) f.focus({ preventScroll: true }); }
}
/* Après un rendu de l'écran (un moment touché, un ajout, un goût) : la fiche suit l'état. */
function ficheApresRendu() { if (FICHE.cle != null && FICHE.racine) construireFiche(); }
function planifierFermeture(ms) { clearTimeout(FICHE.tFerme); FICHE.tFerme = setTimeout(() => { if (!FICHE.epingle) fermerFiche(); }, ms); }

/* ---------- Gestes : appui long (doigt), survol long (souris), clavier ---------- */
/* D49 : « La zone de trigger est que le nom alors que ça devrait être la fiche entière... » : tout nom
   de houblon, et toute la carte d'un houblon (ligne de la recette, ajout proposé) hors de ses
   commandes (−/+, type, ×, cœur, poignée de glissement), qui gardent leur toucher court. */
const CARTE_H = '[data-role="ligne-houblon"], [data-role="ajout-rapide"]';
const COMMANDE_H = 'button, input, select, textarea, a, [role="button"], [data-action], [data-role="glisser-moment"], [data-role="type-ajout"], [data-role="gout"]';
function zoneHoublon(t) {
  if (!t || !t.closest || (FICHE.racine && FICHE.racine.contains(t))) return null;
  const e = t.closest('[data-houblon]');
  if (e) {
    if (!D.fichesH[e.getAttribute('data-houblon')]) return null;
    const c = e.closest(CARTE_H);
    return { el: e, zone: c && !c.closest('[data-glisse]') ? c : e };
  }
  const c = t.closest(CARTE_H);
  if (!c || c.closest('[data-glisse]')) return null;
  const cmd = t.closest(COMMANDE_H);
  if (cmd && cmd !== c && c.contains(cmd)) return null;
  const n = c.querySelector('[data-houblon]');
  return n && D.fichesH[n.getAttribute('data-houblon')] ? { el: n, zone: c } : null;
}
function houblonSous(t) { const z = zoneHoublon(t); return z ? z.el : null; }
let APPUI = null, AVALE = 0;
// Après un appui long, le clic qui suit le lâcher n'agit pas (ajout, case à cocher, ni le voile de
// la fiche qui vient de s'ouvrir sous le doigt) ; un nouveau toucher remet AVALE à zéro.
document.addEventListener('click', (e) => { if (performance.now() < AVALE) { e.stopPropagation(); e.preventDefault(); } }, true);
document.addEventListener('contextmenu', (e) => { if ((APPUI && APPUI.type !== 'mouse') || performance.now() < AVALE) e.preventDefault(); });
function annulerAppui() { const a = APPUI; APPUI = null; if (a) { clearTimeout(a.timer); a.el.classList.remove('appui'); } }
document.addEventListener('pointerdown', (e) => {
  if (e.pointerType === 'mouse' && e.button !== 0) return;
  AVALE = 0;
  if (FICHE.racine && FICHE.racine.contains(e.target)) { if (FICHE.mode === 'bulle') FICHE.epingle = true; return; }
  if (FICHE.cle != null && FICHE.mode === 'bulle') fermerFiche();
  if (APPUI) annulerAppui();
  const el = houblonSous(e.target);
  if (!el) return;
  const a = { el, cle: el.getAttribute('data-houblon'), x: e.clientX, y: e.clientY, id: e.pointerId, type: e.pointerType, actif: false };
  APPUI = a;
  el.classList.add('appui');
  a.timer = setTimeout(() => {
    if (APPUI !== a) return;
    a.actif = true; AVALE = performance.now() + 15000; vibrer();
    el.classList.remove('appui');
    ouvrirFiche(a.cle, { source: el, mode: a.type === 'mouse' || innerWidth >= 700 ? 'bulle' : 'feuille' });
  }, APPUI_MS);
}, true);
document.addEventListener('pointermove', (e) => { if (APPUI && e.pointerId === APPUI.id && !APPUI.actif && Math.hypot(e.clientX - APPUI.x, e.clientY - APPUI.y) > 10) annulerAppui(); }, true);
function relacher() { const a = APPUI; if (!a) return; if (!a.actif) { annulerAppui(); return; } APPUI = null; AVALE = performance.now() + 400; }
document.addEventListener('pointerup', (e) => { if (APPUI && e.pointerId === APPUI.id) relacher(); }, true);
document.addEventListener('pointercancel', (e) => { if (APPUI && e.pointerId === APPUI.id && !APPUI.actif) annulerAppui(); }, true);
document.addEventListener('touchend', () => { if (APPUI && APPUI.actif) relacher(); }, true);
// Une fois la fiche ouverte sous le doigt, le doigt ne fait pas défiler l'étape.
document.addEventListener('touchmove', (e) => { if (APPUI && APPUI.actif) e.preventDefault(); }, { passive: false });

let SURVOL = null;
function finSurvol() { if (SURVOL) { clearTimeout(SURVOL.timer); SURVOL.el.classList.remove('survol'); SURVOL = null; } }
document.addEventListener('pointerover', (e) => {
  if (e.pointerType !== 'mouse') return;
  if (FICHE.racine && FICHE.racine.contains(e.target)) { clearTimeout(FICHE.tFerme); return; }
  const z = zoneHoublon(e.target);
  // Sur une commande de la carte (−/+, type, ×, cœur, poignée), le survol long s'arrête.
  if (!z) { if (SURVOL && SURVOL.zone.contains(e.target)) finSurvol(); return; }
  if (SURVOL && SURVOL.el === z.el && SURVOL.zone === z.zone) return;
  finSurvol();
  const el = z.el, cle = el.getAttribute('data-houblon');
  if (FICHE.cle === cle) { clearTimeout(FICHE.tFerme); SURVOL = { el, zone: z.zone }; return; }
  el.classList.add('survol');
  SURVOL = { el, zone: z.zone, timer: setTimeout(() => { el.classList.remove('survol'); if (FICHE.mode === 'feuille' && FICHE.cle != null) return; ouvrirFiche(cle, { source: el, mode: 'bulle' }); }, SURVOL_MS) };
});
document.addEventListener('pointerout', (e) => {
  if (e.pointerType !== 'mouse') return;
  const vers = e.relatedTarget;
  if (SURVOL && SURVOL.zone.contains(e.target) && !(vers && SURVOL.zone.contains(vers))) finSurvol();
  if (FICHE.cle != null && FICHE.mode === 'bulle' && !FICHE.epingle) {
    const hv = vers && houblonSous(vers);
    if (!(vers && FICHE.racine.contains(vers)) && !(hv && hv.getAttribute('data-houblon') === FICHE.cle)) planifierFermeture(650);
  }
});
document.addEventListener('keydown', (e) => {
  if (e.key === 'Escape' && FICHE.cle != null) { e.preventDefault(); fermerFiche(); return; }
  // Clavier : la touche Menu (ou Maj+F10) sur un élément qui nomme un houblon ouvre sa fiche.
  if (e.key === 'ContextMenu' || (e.shiftKey && e.key === 'F10')) {
    const a = document.activeElement, el = a && (houblonSous(a) || (a.querySelector && a.querySelector('[data-houblon]')));
    if (el && D.fichesH[el.getAttribute('data-houblon')]) { e.preventDefault(); ouvrirFiche(el.getAttribute('data-houblon'), { source: el, mode: innerWidth >= 700 ? 'bulle' : 'feuille', epingle: true }); }
  }
});
addEventListener('resize', () => { if (FICHE.cle != null) construireFiche(); });

/* Démarrage : la racine de la fiche, puis la fiche demandée par la page (fiche.html : Nugget). */
const demarrerSansFiche = demarrer;
demarrer = function () {
  FICHE.racine = h('div', { id: 'fiche-racine' });
  document.body.append(FICHE.racine);
  demarrerSansFiche();
  const init = document.body.dataset.ficheInit;
  if (init && D.fichesH[init]) ouvrirFiche(init, { source: document.querySelector('#app [data-houblon="' + init + '"]'), mode: innerWidth >= 700 ? 'bulle' : 'feuille', anim: false, epingle: true });
};
