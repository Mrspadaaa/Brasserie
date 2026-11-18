/* L9 « chaque geste décompte ce qu'il use » : trois gestes (fût, brassin, cuve) et la table réglée une fois.
   Chaîne du 16.11 (mêmes chiffres dans les trois versions) :
   Soude caustique 1,20 → 1,15 (fût) → 1,05 (brassin) → 0,85 L (cuve, sous le seuil de 1 L : aux Courses)
   Star San 950 → 945 → 930 → 920 ml ; Pilsner 42 → 30 kg ; Saaz 400 → 250 g ; US-05 4 → 3 sachets ; eau 40 L par cuve. */
const V = window.VERSION;
const pct = (v, rep) => Math.round(v / rep * 100);

/* ---------- Stocks › Fûts ---------- */
const futs = (o = {}) => `${tabs('Fûts')}
<h2 class="ix-gt" style="--c:var(--prod)"><i></i>Pleins<span class="r m">8</span></h2>
<div class="ix-li">${fut()}<span class="n"><b>Ambrée</b><small>F-03 → F-08 · 16.11</small></span><span class="v m">6</span></div>
<div class="ix-li">${fut()}<span class="n"><b>F-12</b><em>Blonde</em></span><button class="ix-ib" aria-label="Livrer F-12">${ico('camion')}</button></div>
<div class="ix-li">${fut()}<span class="n"><b>F-07</b><em>Porter</em></span><button class="ix-ib" aria-label="Livrer F-07">${ico('camion')}</button></div>
<h2 class="ix-gt" style="--c:var(--cli)"><i></i>Chez clients</h2>
<div class="ix-li">${fut('var(--cli)')}<span class="n"><b>F-02</b><em>Café du Pont</em></span><span class="v m" style="color:var(--mut)">reprise 30.11</span></div>
${o.lave ? '' : `<h2 class="ix-gt" style="--c:var(--att)"><i></i>À laver</h2>
<div class="ix-li">${fut('var(--att)', false)}<span class="n"><b>F-09</b><small>rentré 14.11</small></span><button class="ix-sec"${D(o.doigt)}>${ico('goutte')}Lavé</button></div>`}
<h2 class="ix-gt" style="--c:var(--stk)"><i></i>Propres<span class="r m">${o.lave ? 9 : 8}</span></h2>
<div class="ix-kegs">${Array.from({ length: 8 }, () => fut('var(--stk)', false)).join('')}${o.lave ? fut('var(--stk)', false, 'neuf') : ''}</div>`;

/* ---------- Brassins › Blonde d'automne ---------- */
const brassin = (o = {}) => `<div class="ix-pg">${back('Brassins')}<h1>Blonde d’automne</h1></div>
<p style="margin:0 12px;font-size:16px;color:var(--mut)">Lot 43 · 120 L · Cuve 2 · J0 / 28</p>
${chips([['var(--prod)', 'doc', 'Recette'], ['var(--stk)', 'cuve', 'Cuve 2'], ['var(--fin)', 'four', 'Brouwland']])}
<div class="ix-jl${o.fait ? ' neuf' : ''}"><span>${ico('cuve')}</span><span>Brassage<small>aujourd’hui</small></span>${o.fait ? `<span class="d m">16.11 ${ico('check', 'ix-ok')}</span>` : `<button class="ix-sec"${D(o.doigt)}>${ico('check')}Brassé</button>`}</div>
<div class="ix-jl prov"><span>${ico('feuille')}</span><span>Dry hop</span><span class="d m">23.11</span></div>
<div class="ix-jl prov"><span>${ico('sablier')}</span><span>Garde</span><span class="d m">30.11</span></div>
<div class="ix-jl prov"><span>${fut()}</span><span>Fûts</span><span class="d m">14.12</span></div>
<h2 class="ix-gt">Pour ce brassin</h2>
<div class="ix-li"><span class="n">Malt Pilsner</span><span class="v m">12 kg</span></div>
<div class="ix-li"><span class="n">Saaz <em>· 3,2 % α</em></span><span class="v m">150 g</span></div>
<div class="ix-li"><span class="n">Levure US-05</span><span class="v m">1 sachet</span></div>`;

/* ---------- Stocks › Matériel (cuves) ---------- */
const cuves = (o = {}) => `${tabs('Matériel')}
<h2 class="ix-gt" style="--c:var(--prod)"><i></i>Cuves</h2>
<div class="ix-li${o.fait ? ' neuf' : ''}">${ico('cuve')}<span class="n"><b>Cuve 1 <em>· 120 L</em></b><small>${o.fait ? 'propre · 16.11' : 'à nettoyer · Ambrée en fûts 16.11'}</small></span>${o.fait ? ico('check', 'ix-ok') : `<button class="ix-sec"${D(o.doigt)}>${ico('goutte')}Nettoyée</button>`}</div>
<div class="ix-li">${ico('cuve')}<span class="n"><b>Cuve 2 <em>· 120 L</em></b><small>Blonde d’automne · J0 / 28</small></span></div>
<div class="ix-li">${ico('cuve')}<span class="n"><b>Cuve 3 <em>· 60 L</em></b><small>propre · 2.11</small></span>${ico('check', 'ix-ok')}</div>
<h2 class="ix-gt" style="--c:var(--mut)"><i></i>Salle de brassage</h2>
<div class="ix-li">${ico('cuve')}<span class="n"><b>Brasseur 120 L</b><small>Blonde d’automne · 16.11</small></span></div>
<div class="ix-li">${ico('regle')}<span class="n"><b>Moulin à malt</b><small>2 cylindres</small></span></div>
<div class="ix-li">${ico('eau')}<span class="n"><b>Pompe de transfert</b><small>inox, 230 V</small></span></div>`;

/* ---------- bandeaux ---------- */
const bFut = (x = {}) => bandeau({ titre: 'Fût F-09 lavé', regler: V === 'b', reglerDoigt: x.doigt, lignes: [
  { nm: 'Soude caustique', dl: '−0,05 L', av: '1,20', ap: '1,15 L', pa: pct(1.2, 5), pb: pct(1.15, 5) },
  { nm: 'Star San', dl: '−5 ml', av: '950', ap: '945 ml', pa: pct(950, 1000), pb: pct(945, 1000) }] });
const bBrassin = () => bandeau({ titre: 'Blonde d’automne brassée', regler: V === 'b', lignes: [
  { grp: 'La recette' },
  { nm: 'Malt Pilsner', dl: '−12 kg', av: '42', ap: '30 kg', pa: pct(42, 50), pb: pct(30, 50) },
  { nm: 'Saaz', dl: '−150 g', av: '400', ap: '250 g', pa: pct(400, 500), pb: pct(250, 500) },
  { nm: 'Levure US-05', dl: '−1', av: '4', ap: '3 sachets' },
  { grp: 'Le nettoyage' },
  { nm: 'Star San', dl: '−15 ml', av: '945', ap: '930 ml', pa: pct(945, 1000), pb: pct(930, 1000) },
  { nm: 'Soude caustique', dl: '−0,10 L', av: '1,15', ap: '1,05 L', pa: pct(1.15, 5), pb: pct(1.05, 5) }] });
const qEau = `<div class="ix-q"><p><b>Eau</b> : combien par cuve, d’habitude ?</p>
<div class="ix-rail"><s style="width:0"></s><i style="left:0"></i></div>
<div class="rq"><span class="val m">— L</span><button class="ghost">Pas maintenant</button><button class="ret">Retenir</button></div>
<small>Une seule fois. Ensuite, décompté seul.</small></div>`;
const bCuve = () => bandeau({ titre: 'Cuve 1 nettoyée', regler: V === 'b', lignes: [
  { nm: 'Soude caustique', dl: '−0,20 L', av: '1,05', ap: '0,85 L', pa: pct(1.05, 5), pb: pct(0.85, 5), sous: true },
  { nm: 'Star San', dl: '−10 ml', av: '930', ap: '920 ml', pa: pct(930, 1000), pb: pct(920, 1000) },
  ...(V === 'b' ? [] : [{ nm: 'Eau', dl: '+40 L', av: 'ce mois 1 240', ap: '1 280 L' }])],
  al: 'Soude sous 1 L : ajoutée aux Courses', q: V === 'b' ? qEau : '' });

/* ---------- la table, une fois ---------- */
const GESTES = [
  ['goutte', 'Laver un fût', 'par fût', [['Soude caustique', '0,05 L'], ['Star San', '5 ml']], '9 ce mois'],
  ['beer', 'Brasser', 'par brassin, en plus de la recette', [['Soude caustique', '0,10 L'], ['Star San', '15 ml']], '2 ce mois'],
  ['cuve', 'Nettoyer une cuve', 'par cuve', [['Soude caustique', '0,20 L'], ['Star San', '10 ml'], ['Eau', '40 L']], '3 ce mois'],
  ['fut', 'Mettre en fût', 'par fût', [['Star San', '5 ml'], ['CO₂', '0,1 kg']], '6 ce mois'],
  ['bout', 'Embouteiller', 'par bouteille', [['Capsules', '1'], ['Étiquettes', '1'], ['Star San', null]], 'pas encore']];

/* a : sur l'article. La liste des articles porte la trace pe3 ; la fiche d'un consommable dit quels gestes l'usent. */
const articlesA = () => `${tabs('Articles')}
<h2 class="ix-gt" style="--c:var(--att)"><i></i>Nettoyage</h2>
<div class="ix-li" data-doigt="tap" data-dx="92" data-dy="6"><span class="n"><b>Soude caustique</b><span class="ix-tr"><b>−0,20 L</b> · Cuve 1 nettoyée<span class="u">↺</span></span></span><span class="v m" style="color:var(--att)">0,85 L</span></div>
<div class="ix-li"><span class="n"><b>Star San</b><span class="ix-tr"><b>−10 ml</b> · Cuve 1 nettoyée<span class="u">↺</span></span></span><span class="v m">920 ml</span></div>
<h2 class="ix-gt" style="--c:var(--prod)"><i></i>Malts</h2>
<div class="ix-li"><span class="n"><b>Malt Pilsner</b><span class="ix-tr"><b>−12 kg</b> · Blonde d’automne<span class="u">↺</span></span></span><span class="v m">30 kg</span></div>
<div class="ix-li"><span class="n"><b>Munich</b></span><span class="v m">2 kg</span></div>
<h2 class="ix-gt" style="--c:var(--stk)"><i></i>Houblons</h2>
<div class="ix-li"><span class="n"><b>Saaz <em style="font-weight:400">· 3,2 % α</em></b><span class="ix-tr"><b>−150 g</b> · Blonde d’automne<span class="u">↺</span></span></span><span class="v m">250 g</span></div>`;
const ficheSoude = () => `<div class="ix-pg">${back('Articles')}<h1>Soude caustique</h1></div>
<div style="display:flex;align-items:baseline;gap:10px;padding:2px 12px 6px"><b class="m" style="font-size:44px;line-height:1;color:var(--att);letter-spacing:-1.5px">0,85</b><span style="font-size:18px;font-weight:700">L</span><span style="font-size:16px;color:var(--mut)">sous 1 L · aux Courses</span></div>
<h2 class="ix-gt">Chaque geste en use</h2>
<div style="padding:0 12px">${[['goutte', 'Laver un fût', 'par fût', '0,05 L'], ['beer', 'Brasser', 'par brassin', '0,10 L'], ['cuve', 'Nettoyer une cuve', 'par cuve', '0,20 L']].map(([i, n, p, v], k) => `<div class="ix-dose"><span class="nm" style="display:flex;gap:10px;align-items:center">${i === 'beer' ? ico('beer') : ico(i)}<span>${n}<small>${p}</small></span></span><span class="ix-step"><button aria-label="Moins">−</button><span class="m">${v}</span><button aria-label="Plus"${k === 2 ? ' data-doigt="tap"' : ''}>+</button></span></div>`).join('')}</div>
<p class="ix-note" style="margin:8px 12px 0">Réglé une fois ; chaque geste décompte seul. Un geste qui n’use pas de soude n’est pas listé.</p>
<h2 class="ix-gt">Derniers mouvements</h2>
${[['−0,20 L', 'Cuve 1 nettoyée', '16.11'], ['−0,10 L', 'Blonde d’automne brassée', '16.11'], ['−0,05 L', 'Fût F-09 lavé', '16.11']].map(([d, n, j]) => `<div class="ix-li"><span class="n">${n}<small>${j}</small></span><span class="v m"><b>${d}</b></span><button class="ix-ib" aria-label="Annuler ce mouvement" style="font-size:20px">↺</button></div>`).join('')}`;

/* b : au geste. Le bandeau porte « Régler » ; la feuille règle ce que ce geste use (appui long sur Lavé : la même). */
const feuilleFut = () => `<div class="ix-dim"></div><div class="ix-sheet">
<div class="ix-sh"><h2>Laver un fût, à chaque fois</h2><button class="ix-ib" aria-label="Fermer">${ico('x')}</button></div>
${[['Soude caustique', 'stock 1,15 L', '0,05 L'], ['Star San', 'stock 945 ml', '5 ml']].map(([n, st, v]) => `<div class="ix-dose"><span class="nm">${n}<small>${st}</small></span><span class="ix-step"><button aria-label="Moins">−</button><span class="m">${v}</span><button aria-label="Plus">+</button></span></div>`).join('')}
<div class="ix-dose"><span class="nm">Eau<small>pas comptée pour ce geste</small></span><span class="ix-step"><button aria-label="Moins" disabled style="color:var(--line2)">−</button><span class="m" style="color:var(--mut)">0 L</span><button aria-label="Plus">+</button></span></div>
<div style="display:flex;gap:8px;flex-wrap:wrap;margin-top:12px"><span class="ix-lie">${ico('plus')}PBW</span><span class="ix-lie">${ico('plus')}Acide peracétique</span></div>
<div class="ix-shf"><button class="ix-tous">Tous les gestes${ico('d')}</button><button class="ix-pri">${ico('check')}Retenir</button></div></div>`;

/* c : une page pour tous les gestes, depuis Stocks › Articles. */
const articlesC = () => `${tabs('Articles')}
<h2 class="ix-gt" style="--c:var(--att)"><i></i>Nettoyage<button class="lnk" data-doigt="tap" data-dx="36" data-dy="14">${ico('regle')}Par geste${ico('d')}</button></h2>
<div class="ix-li"><span class="n"><b>Soude caustique</b><span class="ix-tr"><b>−0,20 L</b> · Cuve 1 nettoyée<span class="u">↺</span></span></span><span class="v m" style="color:var(--att)">0,85 L</span></div>
<div class="ix-li"><span class="n"><b>Star San</b><span class="ix-tr"><b>−10 ml</b> · Cuve 1 nettoyée<span class="u">↺</span></span></span><span class="v m">920 ml</span></div>
<h2 class="ix-gt" style="--c:var(--prod)"><i></i>Malts</h2>
<div class="ix-li"><span class="n"><b>Malt Pilsner</b><span class="ix-tr"><b>−12 kg</b> · Blonde d’automne<span class="u">↺</span></span></span><span class="v m">30 kg</span></div>
<div class="ix-li"><span class="n"><b>Munich</b></span><span class="v m">2 kg</span></div>`;
const pageGestes = () => `<div class="ix-pg">${back('Articles')}<h1 style="font-size:22px">Ce que chaque geste use</h1></div>
${GESTES.map(([i, n, p, arts, f]) => `<div style="padding:8px 12px 10px;border-bottom:1px solid var(--line)">
<div style="display:flex;align-items:center;gap:10px">${i === 'fut' ? fut() : ico(i)}<b style="font-size:17px">${n}</b><span style="margin-left:auto;font-size:14px;color:var(--mut)">${f}</span></div>
<div style="display:flex;flex-wrap:wrap;gap:6px;margin-top:6px;padding-left:32px">${arts.map(([a, d]) => d ? `<span class="ix-lie" style="height:36px;font-size:15px">${a} <b class="m">${d}</b></span>` : `<span class="ix-lie" style="height:36px;font-size:15px;border-style:dashed;color:var(--att);border-color:var(--att)"${n === 'Embouteiller' ? ' data-doigt="tap"' : ''}>${a} · à donner</span>`).join('')}</div>
<p style="margin:4px 0 0 32px;font-size:14px;color:var(--mut)">${p}</p></div>`).join('')}
<p class="ix-note" style="margin:8px 84px 8px 12px">Toucher une dose pour la changer ; elle vaut dès le geste suivant.</p>`;

window.ETATS = {
  'fut-avant': () => `${futs({ doigt: 'tap' })}${fab()}${nav('stk')}`,
  'fut-apres': () => `${futs({ lave: true })}${fab()}${bFut()}${nav('stk')}`,
  'brassin-avant': () => `${brassin({ doigt: 'tap' })}${fab()}${nav('brs')}`,
  'brassin-apres': () => `${brassin({ fait: true })}${fab()}${bBrassin()}${nav('brs')}`,
  'cuve-avant': () => `${cuves({ doigt: 'tap' })}${fab()}${nav('stk')}`,
  'cuve-apres': () => `${cuves({ fait: true })}${fab()}${bCuve()}${nav('stk', 1, true)}`,
  ...(V === 'a' ? {
    'table-avant': () => `${articlesA()}${fab()}${nav('stk', 1)}`,
    'table-apres': () => `${ficheSoude()}${fab()}${nav('stk', 1)}`
  } : V === 'b' ? {
    'table-avant': () => `${futs({ lave: true })}${fab()}${bFut({ doigt: 'tap' })}${nav('stk')}`,
    'table-apres': () => `${futs({ lave: true })}${fab()}${feuilleFut()}${nav('stk')}`
  } : {
    'table-avant': () => `${articlesC()}${fab()}${nav('stk', 1)}`,
    'table-apres': () => `${pageGestes()}${fab()}${nav('stk', 1)}`
  })
};
