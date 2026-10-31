// p7 (D220, D221) : ce que les trois variantes de la recherche partagent, posé sur une copie de v6/p6-b2/etat.html (sa maquette
// choisie, lue telle quelle, jamais réécrite). Assemblage par split/join ou par indices (L26) : chaque ancre doit se trouver une fois.
// D221 : « Concentre toi sur la recherche et l'ouverture de la recherche avec les stocks. Celles de la vrai app était pas trop mal ».
// Le plancher est la recherche de l'app (src/ui/IngredientPicker.tsx, src/ui/Combobox.tsx) : le champ touché ouvre le stock de la
// famille, épinglés en tête ; chaque rangée dit « 12,5 kg en stock » ou « stock épuisé », l'EBC et le fournisseur ; la recherche ignore
// les accents et tolère une faute ; « Créer « … » (stock à zéro) » en dernier.
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
const ICI = path.dirname(fileURLToPath(import.meta.url));
export const BASE = path.resolve(ICI, '../../v6/p6-b2/etat.html');
export function remplacer(src, avant, apres, nom) {
  const n = src.split(avant).length - 1;
  if (n !== 1) throw new Error(`ancre « ${nom} » trouvée ${n} fois`);
  return src.split(avant).join(apres);
}
// Le stock de la maquette (fixture) : la base n'avait que des noms. Deux caramels proches (Carahell, Caramünch II) le rejoignent pour
// que la teinte serve à choisir ; ils ne sont pas dans les sacs habituels (le repos reste celui de la base).
export const STOCK_AV = "var STOCK={grain:['Pale Ale Malz','Münchner Malz','Carapils','Pilsner Malz','Weizenmalz hell','Haferflocken'],";
export const STOCK_AP = "var STOCK={grain:['Pale Ale Malz','Münchner Malz','Carapils','Pilsner Malz','Weizenmalz hell','Haferflocken','Carahell','Caramünch II'],";
export const DONNEES = `
// p7 (D221) : le stock de la maquette, une fixture. Par article : quantité, unité, EBC (fiche malterie, valeur typique), fournisseur,
// épinglé. Münchner Malz est épuisé ; Pilsner Malz et Pale Ale Malz sont épinglés ; l'extrait sec est épuisé.
var FIX={'Pilsner Malz':{q:18,u:'kg',fo:'Weyermann',ep:1},'Pale Ale Malz':{q:12.5,u:'kg',ebc:6.5,fo:'Weyermann',ep:1},
  'Münchner Malz':{q:0,u:'kg',ebc:15,fo:'Weyermann'},'Carapils':{q:1.2,u:'kg',ebc:4,fo:'Weyermann'},'Weizenmalz hell':{q:6,u:'kg',fo:'Weyermann'},
  'Haferflocken':{q:2.5,u:'kg',fo:'Bio-Familia'},'Carahell':{q:3,u:'kg',ebc:25,fo:'Weyermann'},'Caramünch II':{q:0.8,u:'kg',ebc:120,fo:'Weyermann'},
  'Dextrose':{q:5,u:'kg',fo:'Brouwland'},'Sucre candi':{q:1,u:'kg',fo:'Brouwland'},'Lactose':{q:2,u:'kg',fo:'Brouwland'},'Extrait sec clair':{q:0,u:'kg',ebc:8,fo:'Brouwland'}};
var RARE={'Carahell':1,'Caramünch II':1};
function habituels(){return candidats('').filter(function(n){return !RARE[n]});}
// L'ouverture : le stock de la famille, épinglés en tête (l'app) ; « sans » écarte les articles déjà dans la recette.
function ouverture(sans){var dans=st.r.filter(function(f){return f.fam===st.fam}).map(function(f){return f.nom});
  var l=STOCK[st.fam].filter(function(n){return !sans||dans.indexOf(n)<0});
  return l.map(function(n,k){return {n:n,k:k}}).sort(function(a,b){return ((FIX[b.n]||{}).ep?1:0)-((FIX[a.n]||{}).ep?1:0)||a.k-b.k}).map(function(o){return o.n});}
function qteTxt(x){return String(Math.round(x*100)/100).replace('.',',');}
// Ce que l'app écrit sous le nom : « 12,5 kg en stock » ou « stock épuisé », puis l'EBC et le fournisseur s'ils sont connus.
function stockTxt(n){var F=FIX[n];if(!F)return 'stock à zéro';return F.q>0?qteTxt(F.q)+' '+F.u+' en stock':'stock épuisé';}
function epuise(n){var F=FIX[n];return !F||!(F.q>0);}
function ebcDe(n){var F=FIX[n];return F&&F.ebc!=null&&st.fam==='grain'?qteTxt(F.ebc):'';}
function detailTxt(n){var F=FIX[n]||{},e=ebcDe(n);return [stockTxt(n),e?e+' EBC':'',F.fo||''].filter(Boolean).join(' · ');}
function epingle(n){return !!(FIX[n]&&FIX[n].ep);}
// Le nom courant d'un malt le trouve : « Munich » → Münchner Malz (D220 : aujourd'hui, Entrée crée une ligne « Munich »).
var ALIAS={munich:'Münchner Malz',pils:'Pilsner Malz',pale:'Pale Ale Malz',weizen:'Weizenmalz hell',wheat:'Weizenmalz hell',ble:'Weizenmalz hell',cara:'Carapils',avoine:'Haferflocken'};`;
// Le sac de la base, à la teinte du malt (blanc tant qu'elle n'est pas connue, acquis de la base).
export const SAC_AV = "function sac(fam,ebc){if(fam!=='grain')";
export const SAC_FIN = "<path d=\"M7.4 6.2h7.2\" stroke=\"#666\" stroke-width=\"1.2\" stroke-linecap=\"round\"/></svg>';}";
export const SAC = `function sac(fam,ebc){if(fam!=='grain')return '<span class="r4b-sac" style="display:flex;align-items:center;justify-content:center;color:#666">'+IC.cube+'</span>';
  return '<svg class="r4b-sac" viewBox="0 0 22 24" aria-hidden="true"><path d="M6 3h10l-1.5 3.2c3.3 1.8 5 5.6 5 9.6 0 4-2.6 5.7-8.5 5.7S2.5 19.8 2.5 15.8c0-4 1.7-7.8 5-9.6Z" fill="'+(ebc==null?'#fff':teinte(ebc))+'" stroke="#666" stroke-width="1.2" stroke-linejoin="round"/><path d="M7.4 6.2h7.2" stroke="#666" stroke-width="1.2" stroke-linecap="round"/></svg>';}
function sacDe(n){var F=FIX[n];return sac(st.fam,F&&F.ebc!=null?F.ebc:null);}
var ETOILE='<svg class="p7-et" viewBox="0 0 24 24" width="14" height="14" aria-label="épinglé" role="img"><path d="m12 2.8 2.8 5.8 6.3.9-4.6 4.4 1.1 6.3L12 17.2l-5.6 3 1.1-6.3-4.6-4.4 6.3-.9Z" fill="#E0A02E" stroke="#9C7020" stroke-width="1.2" stroke-linejoin="round"/></svg>';`;
// La recherche : sans accents (nu, de la base), et tolérante à une faute. Le rang d'un nom pour ce qui est tapé : 0 son nom courant ;
// 1 le début du nom ; 2 le début d'un mot ; 3 ailleurs dans le nom ; 4 une lettre près (un seul mot tapé, 4 lettres au moins).
// La pertinence prime (l'app) ; à rang égal, la ligne déjà dans la recette passe devant, puis l'ordre du stock.
export const CHERCHER = `
function lev(a,b){var m=a.length,n=b.length,d=[],i,j;for(i=0;i<=m;i++)d[i]=[i];for(j=0;j<=n;j++)d[0][j]=j;
  for(i=1;i<=m;i++)for(j=1;j<=n;j++)d[i][j]=Math.min(d[i-1][j]+1,d[i][j-1]+1,d[i-1][j-1]+(a[i-1]===b[j-1]?0:1));return d[m][n];}
function rang(n,t){var a=nu(n),ws=a.split(/[\\s-]+/);if(t.length>=2)for(var k in ALIAS)if(ALIAS[k]===n&&k.indexOf(t)===0)return 0;
  if(a.indexOf(t)===0)return 1;if(ws.some(function(w){return w.indexOf(t)===0}))return 2;if(a.indexOf(t)>=0)return 3;
  if(t.length>=4&&!/\\s/.test(t)&&ws.some(function(w){return lev(t,w.slice(0,t.length))<=1||lev(t,w)<=1}))return 4;return -1;}
function chercher(t){t=nu(String(t).trim());var o=[];if(!t)return o;
  st.r.forEach(function(f,i){if(f.fam!==st.fam)return;var r=rang(f.nom,t);if(r>=0)o.push({nom:f.nom,r:r,deja:i});});
  STOCK[st.fam].forEach(function(n){if(o.some(function(x){return x.nom===n}))return;var r=rang(n,t);if(r>=0)o.push({nom:n,r:r,deja:-1});});
  o.forEach(function(x,k){x.k=k;});
  return o.sort(function(a,b){return a.r-b.r||((b.deja>=0)-(a.deja>=0))||a.k-b.k;});}
// Les lettres tapées, en gras dans le nom (rien en gras si c'est le nom courant ou une faute qui l'a trouvé).
function marque(n,t){t=nu(String(t).trim());var i=nu(n).indexOf(t);if(!t||i<0)return n;return n.slice(0,i)+'<b>'+n.slice(i,i+t.length)+'</b>'+n.slice(i+t.length);}
// L'ouverture suit le champ : il s'ouvre au toucher, se ferme quand il perd le doigt. Un toucher dans les résultats garde le champ
// (et le clavier) : le résultat reçoit son toucher.
var OUVERT=false;
document.addEventListener('focusin',function(e){if(e.target.dataset&&e.target.dataset.role==='ajout'&&!OUVERT){OUVERT=true;recherche();}});
document.addEventListener('focusout',function(e){if(e.target.dataset&&e.target.dataset.role==='ajout'){setTimeout(function(){var a=document.activeElement;if(a&&a.dataset&&a.dataset.role==='ajout')return;OUVERT=false;recherche();},0);}});
function garde(e){if(e.target.closest&&e.target.closest('[data-p7garde]'))e.preventDefault();}
document.addEventListener('pointerdown',garde);document.addEventListener('mousedown',garde);`;
// L'ajout d'un malt du stock prend sa teinte : une couleur de moins à renseigner.
export const AJ_AV = "st.r.push(L(nom,st.fam,kg==null?0:kg));st.sel=st.r.length-1;rendre(st.sel);";
export const AJ_AP = "st.r.push(L(nom,st.fam,kg==null?0:kg));var F7=FIX[nom];if(F7&&F7.ebc!=null&&st.fam==='grain')st.r[st.r.length-1].ebc=F7.ebc;st.sel=st.r.length-1;rendre(st.sel);";
export const ENTREE_AV = "if(e.key==='Enter'){e.preventDefault();var s=lire();if(!s.nom)return;var dj=deja(s.nom.toLowerCase());if(dj>=0){ajouter(st.r[dj].nom,s.kg);return;}var p=q('[data-pu]');ajouter(p&&s.nom.length>=2?p.dataset.pu:s.nom,s.kg);}\n    else if(e.key==='Escape'){t.value='';puces();}";
export const INPUT_AV = "if(t.dataset.role==='ajout')puces();";
export function ecrire(fichier, src) { fs.writeFileSync(fichier, src); console.log('écrit ' + fichier + ' (' + src.length + ' octets)'); }
export function lireBase() { return fs.readFileSync(BASE, 'utf8'); }
// Les parties communes, posées dans l'ordre.
export function socle(src, titre, concept) {
  src = remplacer(src, /<title>[^<]*<\/title>/.exec(src)[0], '<title>' + titre + '</title>', 'titre');
  src = remplacer(src, '<body data-concept="p6-b2">', '<body data-concept="' + concept + '">', 'concept');
  src = remplacer(src, STOCK_AV, STOCK_AP, 'stock');
  src = remplacer(src, "function L(nom,fam,kg,mom){", DONNEES.trim() + "\nfunction L(nom,fam,kg,mom){", 'données');
  const i = src.indexOf(SAC_AV), j = src.indexOf(SAC_FIN, i);
  if (i < 0 || j < 0) throw new Error('ancre « sac » absente');
  src = src.slice(0, i) + SAC + src.slice(j + SAC_FIN.length);
  src = remplacer(src, "function candidats(t){", CHERCHER.trim() + "\nfunction candidats(t){", 'chercher');
  src = remplacer(src, AJ_AV, AJ_AP, 'ajout');
  return src;
}
// Remplace une fonction entière, de « function nom( » jusqu'à l'ancre de fin donnée (incluse).
export function fonction(src, debut, fin, neuf, nom) {
  const i = src.indexOf(debut), j = src.indexOf(fin, i);
  if (i < 0 || j < 0 || src.indexOf(debut, i + 1) >= 0) throw new Error('fonction « ' + nom + ' » introuvable ou double');
  return src.slice(0, i) + neuf + src.slice(j + fin.length);
}
export const CSS_COMMUN = `.p7-et{flex-shrink:0;vertical-align:-2px}
`;
