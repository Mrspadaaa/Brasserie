/* L4, version b : le jalon « commander avant » naît dans la fiche du brassin, premier de ses jalons (comme L5).
   Mêmes chiffres que g-d1 : Porter d’hiver brassé S51 (14.12), manques Munich 4 kg et Fuggles 200 g, commander avant 7.12
   (Brouwland, souvent 6 j de délai). Dans Stocks (base « C ») : 3 à commander, la soude venant du nettoyage du 16.11 (L9). */
const porter = (o = {}) => `<div class="ix-pg">${back('Brassins')}<h1>Porter d’hiver</h1><span class="sub m">120 L</span></div>
<p style="margin:0 12px 6px;font-size:16px;color:var(--mut)">${o.plan ? 'S51 · 14.12 · Cuve 1' : '5,4 % · 8 ingrédients · dernier brassin 3.2'}</p>
${o.plan ? `${chips([['var(--prod)', 'doc', 'Recette'], ['var(--stk)', 'cuve', 'Cuve 1'], ['var(--fin)', 'four', 'Brouwland']])}
<div class="ix-jl neuf" style="border:1.5px dashed var(--fin);border-radius:12px;margin:4px 12px 6px;background:var(--finbg)"><span style="color:var(--fin)">${ico('panier')}</span><span style="color:var(--fin);font-weight:700">Commander<small style="color:var(--mut);font-weight:400">Munich 4 kg · Fuggles 200 g · Brouwland</small></span><span class="d m" style="color:var(--fin);font-weight:700">avant 7.12</span></div>
<div class="ix-jl prov"><span>${ico('beer')}</span><span>Brassage</span><span class="d m">14.12</span></div>
<div class="ix-jl prov"><span>${ico('cuve')}</span><span>Fermentation</span><span class="d m">15.12</span></div>
<div class="ix-jl prov"><span>${ico('sablier')}</span><span>Garde</span><span class="d m">28.12</span></div>
<div class="ix-jl prov"><span>${fut()}</span><span>Fûts</span><span class="d m">11.1</span></div>`
  : `
<h2 class="ix-gt">Brasser en</h2>
<div style="display:grid;grid-template-columns:repeat(3,1fr);gap:8px;padding:4px 12px">${[['S50', '7.12', 'Cuve 1 libre'], ['S51', '14.12', 'Cuve 1 libre'], ['S52', '21.12', 'Cuves 1, 2']].map(([s, d, c], k) => `<button style="min-height:76px;border:1.5px solid var(--line2);border-radius:12px;display:flex;flex-direction:column;align-items:center;justify-content:center;gap:1px"${k === 1 ? ' data-doigt="tap"' : ''}><b style="font-size:19px">${s}</b><span class="m" style="font-size:15px">${d}</span><span style="font-size:14px;color:var(--mut)">${c}</span></button>`).join('')}</div>
<h2 class="ix-gt">La recette</h2>
${[['Maris Otter', '22 kg'], ['Munich', '6 kg'], ['Malt chocolat', '1,2 kg'], ['Fuggles <em>· 4,5 % α</em>', '300 g'], ['Levure S-04', '2 sachets']].map(([n, q]) => `<div class="ix-li"><span class="n">${n}</span><span class="v m">${q}</span></div>`).join('')}`}`;

/* Stocks › Articles, base « C » (seuil v3) tel quel, chiffres de la chaîne */
const stocksC = () => `<style>
.c-head{display:flex;align-items:flex-start;gap:10px;padding:10px 12px 0}.c-h{flex:1;display:flex;align-items:center;gap:12px}
.c-big{font-size:56px;line-height:1;font-weight:800;color:var(--fin);letter-spacing:-1.5px;font-variant-numeric:tabular-nums}
.c-t{font-size:15px;color:var(--mut);line-height:1.25}.c-t b{display:block;color:var(--ink);font-size:17px}
.c-hz{margin:12px 12px 0;padding:8px;border:1.5px solid var(--line2);border-radius:14px}
.c-lab{display:flex;align-items:center;gap:8px;font-size:15px;color:var(--mut);padding:0 4px 8px}
.c-lab .mp{min-width:28px;height:26px;padding:0 6px;border-radius:13px;background:var(--fin);color:#fff;font-weight:800;font-size:15px;line-height:26px;text-align:center}
html[data-theme=cave] .c-lab .mp{color:#12100e}
.c-seg{display:grid;grid-template-columns:1fr 1fr 1fr;border:1.5px solid var(--line2);border-radius:12px;overflow:hidden}
.c-seg span{min-height:52px;font-size:15px;line-height:1.15;border-left:1px solid var(--line);display:flex;flex-direction:column;align-items:center;justify-content:center;text-align:center}.c-seg span:first-child{border-left:0}
.c-seg span b{display:block;font-size:19px}.c-seg span.on{background:var(--act);color:var(--onact)}
.c-his{position:relative;display:grid;grid-template-columns:repeat(7,1fr);gap:6px;align-items:end;height:100px;margin:12px 12px 0;padding:0 2px;border-bottom:1.5px solid var(--line2)}
.c-his div{display:flex;flex-direction:column;align-items:center;justify-content:flex-end;height:100%;gap:2px}
.c-his div i{width:100%;max-width:34px;border-radius:5px 5px 0 0;background:var(--c)}
.c-his div span{font-size:14px;font-weight:700;color:var(--c)}
.c-wk{display:grid;grid-template-columns:repeat(7,1fr);gap:6px;margin:4px 12px 0;padding:0 2px;font-size:14px;color:var(--mut);text-align:center}
.c-br{position:absolute;top:-4px;bottom:-4px;left:-2px;border:2.5px solid var(--fin);border-radius:10px}
.c-sec{display:flex;align-items:baseline;justify-content:space-between;padding:14px 12px 4px;font-size:15px;color:var(--mut)}.c-sec b{color:var(--ink);font-size:17px}
.c-ex{display:inline-block;border:1.5px solid var(--fin);color:var(--fin);border-radius:999px;font-size:14px;line-height:20px;padding:0 8px;font-weight:600}
.c-rows{margin:0 12px;border:1.5px solid var(--line);border-radius:14px;overflow:hidden}
.c-row{display:flex;align-items:center;gap:10px;min-height:54px;padding:6px 12px;border-top:1px solid var(--line)}.c-row:first-child{border-top:0}
.c-row .dot{width:12px;height:12px;border-radius:50%;flex:none;background:var(--fin)}.c-row .tx{flex:1;min-width:0}
.c-row .nm{font-size:16px;font-weight:600;display:block}.c-row .sb{font-size:14px;color:var(--mut);display:block}.c-row .sb em{font-style:normal;color:var(--fin);font-weight:700}
.c-row .q{font-size:15px;white-space:nowrap}.c-row.neuf{background:var(--finbg)}
.c-cta{display:flex;align-items:center;justify-content:center;gap:8px;margin:12px 82px 0 12px;height:48px;border-radius:12px;background:var(--act);color:var(--onact);font-size:17px;font-weight:700;width:calc(100% - 94px)}
</style>
${tabs('Articles')}
<div class="c-head"><div class="c-h"><span class="c-big">3</span><span class="c-t">à commander<b>avant S51 · Porter d’hiver</b></span></div><button class="ix-ib" aria-label="Plein écran">${ico('plein')}</button></div>
<div class="c-hz"><div class="c-lab"><span class="mp">3</span>pastille et chiffre comptent jusqu’à</div>
<div class="c-seg"><span class="on"><b>S51</b>prochain brassin</span><span><b>6 sem.</b>jusqu’à S52</span><span><b>Tout</b>au seuil compris</span></div></div>
<div class="c-his" aria-hidden="true"><span class="c-br" style="width:calc(5 * (100% - 4px - 36px) / 7 + 4 * 6px + 6px)"></span>${[[0, 'S47'], [1, 'S48'], [0, 'S49'], [0, 'S50'], [2, 'S51'], [1, 'S52'], [13, 'seuil']].map(([n], k) => `<div style="--c:${k < 5 ? 'var(--fin)' : 'var(--trait)'}">${n ? `<span>${n}</span><i style="height:${Math.round(n / 13 * 70) + 8}px"></i>` : ''}</div>`).join('')}</div>
<div class="c-wk"><span>S47</span><span>S48</span><span>S49</span><span>S50</span><span>S51</span><span>S52</span><span>seuil</span></div>
<div class="c-sec"><b>Avant S51, par semaine</b><span class="c-ex">exemple</span></div>
<div class="c-rows">
<div class="c-row"><span class="dot"></span><span class="tx"><span class="nm">Soude caustique</span><span class="sb"><em>S48</em> · nettoyage · Droguerie du Bourg</span></span><span class="q m">1 bidon</span></div>
<div class="c-row neuf"><span class="dot"></span><span class="tx"><span class="nm">Munich</span><span class="sb"><em>S51</em> · Porter d’hiver · Brouwland</span></span><span class="q m">4 kg</span></div>
<div class="c-row neuf"><span class="dot"></span><span class="tx"><span class="nm">Fuggles</span><span class="sb"><em>S51</em> · Porter d’hiver · Brouwland</span></span><span class="q m">200 g</span></div>
</div>
<button class="c-cta">${ico('panier')}Commander ces 3</button>`;

window.ETATS = {
  'avant': () => `${porter()}${fab()}${nav('brs', 1)}`,
  'apres': () => `${porter({ plan: true })}${fab()}${toast('Porter d’hiver · 14.12', '2 manques · avant 7.12', 'Courses')}${nav('brs', 3, true)}`,
  'stocks': () => `${stocksC()}${fab()}${nav('stk', 3)}`
};
