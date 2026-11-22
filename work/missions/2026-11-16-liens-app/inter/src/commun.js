/* Aides communes aux mini maquettes (statiques : ?s=<état>&theme=cave). */
const P = new URLSearchParams(location.search);
if (P.get('theme') === 'cave') document.documentElement.dataset.theme = 'cave';
const ico = (id, c = '') => `<svg class="ico ${c}" aria-hidden="true"><use href="#i-${id}"/></svg>`;
const fut = (c = 'var(--prod)', plein = true, cls = '') => `<svg class="ix-keg ${cls}" viewBox="0 0 22 26" style="--c:${c};--kf:${plein ? 'color-mix(in srgb,' + c + ' 55%,transparent)' : 'none'}" aria-hidden="true"><use href="#i-fut"/></svg>`;
const NAV = [['bord', 'bord', 'Bord', ''], ['fin', 'wallet', 'Finances', ''], ['cal', 'cal', 'Calendrier', 'br'], ['brs', 'beer', 'Brassins', 'br'], ['stk', 'boxes', 'Stocks', 'st'], ['cli', 'users', 'Clients', '']];
const nav = (on, pas = 0, pasNeuf = false) => `<nav class="ix-nav" aria-label="Barre du bas">${NAV.map(([k, i, l, c]) => `<a class="${k === on ? 'on ' : ''}${c}"${k === on ? ' aria-current="page"' : ''}>${ico(i)}${k === 'stk' && pas ? `<span class="ix-pas${pasNeuf ? ' neuf' : ''}">${pas}</span>` : ''}<span>${l}</span></a>`).join('')}</nav>`;
const fab = () => `<button class="ix-fab" aria-label="Ajouter">${ico('plus')}</button>`;
const tabs = on => `<nav class="ix-tabs" aria-label="Stocks">${['Articles', 'Courses', 'Fûts', 'Houblons', 'Matériel'].map(t => `<span class="${t === on ? 'on' : ''}">${t}</span>`).join('')}</nav>`;
const back = t => `<button class="ix-back">${ico('g')}${t}</button>`;
const chips = l => `<div class="ix-chips" aria-label="Lié à">${l.map(([c, i, t]) => `<span class="ix-chip" style="--c:${c}">${ico(i)}${t}</span>`).join('')}</div>`;
const D = (d) => d ? ` data-doigt="${d}"` : '';
/* bandeau pe1 : lignes { nm, dl, av, ap, pa, pb, sous } ; options { titre, al, q, regler } */
const bandeau = o => `<div class="ix-voile"></div><div class="ix-be" role="status" data-bandeau-effets>
<p class="t">${ico('check')}${o.titre}</p>
<ul>${o.lignes.map(l => l.grp ? `<li class="grp">${l.grp}</li>` : `<li class="${l.sous ? 'sous' : ''}"><span class="nm">${l.nm}</span><span class="dl m">${l.dl}</span><span class="aa m">${l.av} → <b>${l.ap}</b></span>${l.pa != null ? `<span class="br"><i style="width:${l.pa}%"></i><i class="ap" style="width:${l.pb}%"></i></span>` : ''}</li>`).join('')}</ul>
${o.al ? `<p class="al">${ico('panier')}${o.al}</p>` : ''}
${o.q || ''}
<div class="ft">${o.regler ? `<button class="reg"${D(o.reglerDoigt)}>${ico('regle')}Régler</button>` : ''}<span class="sp"></span><button class="ann">Annuler</button><button class="okb">OK</button></div></div>`;
const toast = (tx, sous, go) => `<div class="ix-toast" role="status"><span class="tx">${tx}${sous ? `<small>${sous}</small>` : ''}</span><button class="an">Annuler</button>${go ? `<button class="go">${go}${ico('d')}</button>` : ''}</div>`;
const SPRITE_PLUS = `<svg width="0" height="0" style="position:absolute" aria-hidden="true">
<symbol id="i-regle" viewBox="0 0 24 24"><path d="M4 6h10M18 6h2M4 12h4M12 12h8M4 18h12M20 18h0"/><circle cx="16" cy="6" r="2"/><circle cx="10" cy="12" r="2"/><circle cx="18" cy="18" r="2"/></symbol>
<symbol id="i-four" viewBox="0 0 24 24"><path d="M3 21V10l5 3V10l5 3V7l8 4v10zM3 21h18M7 17h2M12 17h2M17 17h1"/></symbol>
<symbol id="i-plein" viewBox="0 0 24 24"><path d="M4 9V4h5M20 9V4h-5M4 15v5h5M20 15v5h-5"/></symbol>
<symbol id="i-eau" viewBox="0 0 24 24"><path d="M7 16.3c2.2 0 4-1.8 4-4.1 0-1.2-.6-2.3-1.8-3.3S7.2 6.6 7 5.3c-.3 1.3-1 2.6-2.2 3.6S3 11 3 12.2c0 2.3 1.8 4.1 4 4.1z"/><path d="M12.6 6.6A11 11 0 0 0 14 3.6c.5 2.5 2 4.9 4 6.5s3 3.5 3 5.5a6.98 6.98 0 0 1-11.9 4.98"/></symbol>
</svg>`;
/* rendu, puis doigt posé au centre de chaque [data-doigt] (tap / long), décalable par data-dx, data-dy */
function rendre(ETATS) {
  const s = P.get('s') || Object.keys(ETATS)[0];
  document.body.insertAdjacentHTML('afterbegin', SPRITE_PLUS);
  const app = document.getElementById('app');
  app.innerHTML = ETATS[s]();
  document.body.dataset.etat = s;
  requestAnimationFrame(() => {
    document.querySelectorAll('[data-doigt]').forEach(el => {
      const r = el.getBoundingClientRect();
      const d = document.createElement('i');
      d.className = 'ix-doigt' + (el.dataset.doigt === 'long' ? ' long' : '');
      const lg = el.dataset.doigt === 'long'; const dx = el.dataset.dx != null ? +el.dataset.dx : lg ? 0 : Math.max(0, r.width / 2 - 8); const dy = el.dataset.dy != null ? +el.dataset.dy : lg ? 0 : Math.max(0, r.height / 2 - 6);
      d.style.left = (r.left + r.width / 2 + dx + scrollX) + 'px';
      d.style.top = (r.top + r.height / 2 + dy + scrollY) + 'px';
      document.body.appendChild(d);
    });
    document.body.dataset.pret = '1';
  });
}
