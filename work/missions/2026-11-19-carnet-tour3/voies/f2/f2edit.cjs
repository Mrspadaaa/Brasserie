// Voie f2 : correctifs appliqués en une passe (lancer depuis port-carnet). Chaque remplacement exige une occurrence unique.
const fs = require('fs');
let ko = 0;
function ed(f, a, b) { const s = fs.readFileSync(f, 'utf8'); const i = s.split(a).length - 1; if (i !== 1) { console.log('KO', f, i, a.slice(0, 60)); ko++; return; } fs.writeFileSync(f, s.split(a).join(b)); }
const A = 'src/domain/carnets/analyseLocale.ts', C = 'src/domain/carnets/comparer.ts', M = 'src/domain/carnets/modele.ts', O = 'src/domain/carnets/operations.ts';
const VU = 'src/ui/carnets/CarnetsVue.tsx', B = 'src/ui/carnets/Bandeau.tsx', CO = 'src/ui/carnets/CarnetOuvert.tsx', CP = 'src/ui/carnets/Comparer.tsx', L = 'src/ui/carnets/ListeCarnets.tsx', U = 'src/ui/finance/UpgradeWorkspace.tsx';
// 159
ed(A, "  if (o.length > 40) o = o.slice(0, 40).replace(/\\s+\\S*$/, '');",
"  /* tour 3, PCN-159 : « …pour le moût chaud » (48 car.) gardait « pour le » ; 60 car. au plus, jamais fini sur un mot-outil */\n  if (o.length > 60) o = o.slice(0, 60).replace(/\\s+\\S*$/, '');\n  o = o.replace(/(?:\\s+(?:pour|le|la|les|de|du|des|à|au|aux|en|et|avec|sur|par))+$/i, '');");
// 155
ed(M, "  return carnet.articles.length > 0 ? 'research' : 'idea';", "  /* tour 3, PCN-155 : « À comparer » demande au moins un article lu ; un lien à lire ou illisible laisse l'idée en Idée */\n  return carnet.articles.some(a => a.lecture === 'lue') ? 'research' : 'idea';");
// 167
ed(O, "  for (const m of b.messages()) {\n    if (!m.carnetMessage.effets.some(e => e.carnetId === c.id)) continue;\n    b.ecrire(",
"  /* tour 3, PCN-167 : ses messages partent avec lui (même écriture, même Annuler) ; un message qui a aussi rangé ailleurs reste, marqué */\n  for (const m of b.messages()) {\n    const effets = m.carnetMessage.effets;\n    if (!effets.some(e => e.carnetId === c.id) && m.carnetMessage.depuis !== c.id) continue;\n    if (effets.every(e => e.carnetId === c.id)) { b.retirer(m.id); continue; }\n    b.ecrire(");
// 136
ed(C, "      if (s.sens === 'plus' ? v < s.valeur : v > s.valeur) hors[s.colonne] = s.sens === 'plus' ? 'sous votre minimum' : 'au-dessus de votre maximum';",
"      /* tour 3, PCN-136 : le seuil s'écrit (« sous votre minimum de 1 500 m³/h ») */\n      const u = colonnes.find(k => k.nom === s.colonne)?.unite;\n      if (s.sens === 'plus' ? v < s.valeur : v > s.valeur) hors[s.colonne] = `${s.sens === 'plus' ? 'sous votre minimum' : 'au-dessus de votre maximum'} de ${nombreTexte(s.valeur)}${u ? ` ${u}` : ''}`;");
// 106
ed(C, "    const candidats = L.slice(1).filter(x => x.prixCentimes !== undefined && memeDevise(x) && x.prixCentimes < p1\n",
"    /* tour 3, PCN-106 : jamais une proposition sous son minimum (ou au-dessus de son maximum) */\n    const candidats = L.slice(1).filter(x => !x.horsSeuil && x.prixCentimes !== undefined && memeDevise(x) && x.prixCentimes < p1\n");
ed(C, "  /* aucun moins cher qui tienne les mêmes critères : la 1re, avec ce qui la met devant */\n",
"  /* tour 3, PCN-106 (g01-8) : la 1re seule à tenir un critère oui-non dit sa raison et son écart, sans aligner les valeurs */\n  const seuls = ouiNon.filter(k => nombreCellule(premier, k) === 1 && L.slice(1).every(x => !!x.horsSeuil || nombreCellule(x, k) !== 1));\n  if (seuls.length) {\n    const d2 = L[1];\n    const ecart = p1 !== undefined && d2.prixCentimes !== undefined && memeDevise(d2) ? d2.prixCentimes - p1 : null;\n    const tx = ecart === null || ecart === 0 ? '' : ecart < 0 ? `, pour ${prixTexte(-ecart, premier.devise)} de plus que la 2e` : `, et ${prixTexte(ecart, premier.devise)} de moins que la 2e`;\n    return `la 1re, la seule ${seuls.map(k => aFaire(k.nom)).join(' et ')}${tx}`;\n  }\n  /* aucun moins cher qui tienne les mêmes critères : la 1re, avec ce qui la met devant */\n");
// 164
ed(C, "/** Statut après un dépôt :", "/**\n * Tour 3, PCN-164 : d'où viennent les valeurs comparées. Un article sans lien vient de sa phrase ; un lien lu, de la page du vendeur.\n */\nexport function mentionValeurs(articles: readonly Pick<Article, 'url' | 'lecture'>[]): string {\n  const vous = articles.some(a => !a.url), vendeurs = articles.some(a => !!a.url && a.lecture === 'lue');\n  return vous && vendeurs ? 'Valeurs annoncées par les vendeurs ou écrites par vous' : vous ? 'Valeurs écrites par vous' : 'Valeurs annoncées par les vendeurs';\n}\n\n/** Statut après un dépôt :");
ed(CP, "  onChoisir?: () => void;\n}", "  onChoisir?: () => void;\n  /** Tour 3, PCN-164 : d'où viennent les valeurs (`mentionValeurs`) ; absent : les vendeurs. */\n  mention?: string;\n}");
ed(CP, "<p className=\"cn-mut cn-annonce\">Valeurs annoncées par les vendeurs{", "<p className=\"cn-mut cn-annonce\">{p.mention ?? 'Valeurs annoncées par les vendeurs'}{");
ed(VU, "      nonLus={nonLusDe(ouvert.carnet.articles as never)} pictos={pictosDe(ouvert)}", "      nonLus={nonLusDe(ouvert.carnet.articles as never)} pictos={pictosDe(ouvert)} mention={mentionValeurs(ouvert.carnet.articles)}");
ed(VU, "import { consequenceApercu, critereQuiTranche, passe,", "import { consequenceApercu, critereQuiTranche, mentionValeurs, passe,");
// 118
ed(CP, "        <p className=\"cn-mut cn-cmp-critere\">Ce qui compte <b className=\"cn-encre\">{classe.texte}</b>{classe.source === 'ia' ? ' · proposé par l\\'IA' : ''}</p>",
"        <p className=\"cn-mut cn-cmp-critere\">Ce qui compte {criteresQuiClassent(t, p.critere).map((x, i) => <React.Fragment key={i}>{i ? ', puis ' : ''}<b className=\"cn-encre\">{x.texte}</b>{x.source === 'ia' ? ' · proposé par l\\'IA' : ''}</React.Fragment>)}</p>");
ed(CP, "/**\n * Critique 5, n° 22 :", "/** Tour 3, PCN-118 : tous les critères qui classent, dans l'ordre des colonnes ; le 1er comme `critereQuiClasse`. */\nexport function criteresQuiClassent(t: Tableau | null, critere?: CritereV): Array<{ texte: string; source?: 'phrase' | 'ia' }> {\n  return (t?.colonnes ?? []).filter(c => c.critereId && c.sens !== 'texte').map(col => (critere && critere.id === col.critereId\n    ? { texte: critere.texte, source: sourceDuCritere(critere) }\n    : { texte: col.critereTexte ?? col.nom, ...(col.critereSource ? { source: col.critereSource } : {}) }));\n}\n\n/**\n * Critique 5, n° 22 :");
// 100
ed(B, "  | { sorte: 'ailleurs'; carnet: string; raison?: string;", "  | { sorte: 'ailleurs'; carnet: string; rang?: string; raison?: string;");
ed(B, "    case 'ailleurs': return `Rangé dans ${b.carnet}, à l'instant`;", "    case 'ailleurs': return `Rangé dans ${b.carnet}, à l'instant${b.rang ? ` · ${b.rang}` : ''}`;");
ed(VU, "      sorte: 'ailleurs', carnet: c?.title ?? 'un autre carnet', cite: txt, ...(raison ? { raison } : {}),",
"      sorte: 'ailleurs', carnet: c?.title ?? 'un autre carnet', cite: txt, ...(raison ? { raison } : {}), ...(rangA ? { rang: rangA } : {}),");
ed(VU, "    const raison = lignesIA?.find(l => l.carnetId === rr.carnetId && l.raisonCarnet)?.raisonCarnet;\n",
"    const raison = lignesIA?.find(l => l.carnetId === rr.carnetId && l.raisonCarnet)?.raisonCarnet;\n    /* tour 3, PCN-100 : déposé depuis la liste, le retour dit aussi la place de l'article dans le carnet d'arrivée */\n    const tA = c && a ? tableauDe(c) : null;\n    const rangA = tA && a && c ? rangDuLien(tA, a.id, c.carnet.articles) : null;\n");
// 133
ed(VU, "    ? messages.flatMap(m => (m.carnetMessage.propositions ?? []).map((pp, index) => ({ cle: `${m.id}:${index}:${pp.texte}`, messageId: m.id, index, carnetId: pp.carnetId, ligne: pp })))\n      .filter(x => x.carnetId === ouvert.id && !ecartees.has(x.cle))\n    : [];",
"    ? pucesDuCarnet(messages, ouvert, ecartees)\n    : [];");
ed(VU, "type RetourNeuf = Omit<Retour, 'id'>;", "/**\n * Tour 3, PCN-133 : les puces proposées du carnet ouvert, une par caractéristique (libellé normalisé), sans celles qui sont déjà un\n * critère du carnet, 3 au plus (la plus ancienne d'abord).\n */\nexport function pucesDuCarnet(messages: ReturnType<typeof lireMessages>, carnet: ReturnType<typeof lireCarnets>[number], ecartees: ReadonlySet<string>): Proposee[] {\n  const cle = (k: { nom?: string } | undefined, texte: string) => normaliser(k?.nom ?? texte);\n  const deja = new Set(carnet.carnet.criteres.map(k => cle(k.caracteristique, k.texte)));\n  const vus = new Set<string>();\n  const sortie: Proposee[] = [];\n  for (const m of messages) (m.carnetMessage.propositions ?? []).forEach((pp, index) => {\n    const c = `${m.id}:${index}:${pp.texte}`;\n    const n = cle(pp.caracteristique, pp.texte);\n    if (pp.carnetId !== carnet.id || ecartees.has(c) || deja.has(n) || vus.has(n)) return;\n    vus.add(n);\n    sortie.push({ cle: c, messageId: m.id, index, carnetId: pp.carnetId, ligne: pp });\n  });\n  return sortie.slice(0, 3);\n}\ntype RetourNeuf = Omit<Retour, 'id'>;");
// 151
ed(CO, "  if (c.status === 'validated') { const d = dateCourte(c.carnet.choix?.le); return d ? `Choisi le ${d}` : 'Choisi'; }",
"  /* tour 3, PCN-151 : réalisé (plan payé), la pastille le dit comme la ligne de sortie */\n  if (c.status === 'validated' && c.carnet.sortie?.etat === 'realise') { const d = dateCourte(c.carnet.sortie.realiseLe); return d ? `Réalisé le ${d}` : 'Réalisé'; }\n  if (c.status === 'validated') { const d = dateCourte(c.carnet.choix?.le); return d ? `Choisi le ${d}` : 'Choisi'; }");
// 109
ed(CO, "      {p.liens.length > 0 && (\n        <div className=\"cn-liens\">\n          {p.liens.slice(0, 3).map(",
"      {/* tour 3, PCN-109 : le plan que la ligne de sortie dit déjà (« Dans À venir depuis le … ») n'a pas de pastille en plus */}\n      {liensVus.length > 0 && (\n        <div className=\"cn-liens\">\n          {liensVus.slice(0, 3).map(");
ed(CO, "          {p.liens.length > 3 && <span className=\"cn-pastille\">+{p.liens.length - 3}</span>}", "          {liensVus.length > 3 && <span className=\"cn-pastille\">+{liensVus.length - 3}</span>}");
ed(CO, "  const c = p.carnet, k = c.carnet;", "  const c = p.carnet, k = c.carnet;\n  const liensVus = p.liens.filter(l => !(c.status === 'validated' && k.choix && k.sortie?.planId && l.id === k.sortie.planId));");
// 154
{
  const s = fs.readFileSync(CO, 'utf8'); const deb = s.indexOf('      {menu && (\n        <div ref={refMenu}');
  if (deb < 0) { console.log('KO menu'); ko++; } else {
    const fin = s.indexOf('      )}\n', deb) + '      )}\n'.length; const bloc = s.slice(deb, fin); let t = s.slice(0, deb) + s.slice(fin);
    const ancre = "onClick={() => setMenu(m => !m)}><Ellipsis size={22} aria-hidden /></button>\n";
    if (t.split(ancre).length !== 2) { console.log('KO ancre menu'); ko++; } else { t = t.replace(ancre, ancre + "        {/* tour 3, PCN-154 : le menu flotte sous ···, hors du flux (le titre ne descend plus) */}\n" + bloc.replace(/^      /gm, '        ')); fs.writeFileSync(CO, t); }
  }
}
fs.appendFileSync('src/ui/carnets/carnets.css', "\n/* Tour 3, PCN-154 : le menu ··· flotte sous son bouton, hors du flux */\n.cn-tete { position: relative; }\n.cn-tete > .cn-menu { position: absolute; top: 100%; right: 0; z-index: 30; }\n/* Tour 3, PCN-120 : à 390, une carte Idée au titre long prend toute la largeur ; « Coller un lien » passe dessous, à droite (court : g05-1 tel quel) */\n@media (max-width: 599px) {\n  .cn-carnet-long.cn-carnet-coller { display: grid; grid-template-columns: 1fr; grid-template-areas: \"corps\" \"lien\"; padding-right: 12px; }\n  .cn-carnet-long.cn-carnet-coller > .cn-carnet-corps { grid-area: corps; padding-right: 0; }\n  .cn-carnet-long.cn-carnet-coller > .cn-coller-lien { grid-area: lien; justify-self: end; margin: -4px 0 10px; }\n}\n");
ed('src/ui/carnets/carnets-fil.css', ".cn-champ-zone .cn-vadans { flex-wrap: nowrap; overflow-x: auto; scrollbar-width: none; gap: 6px; }",
"/* Tour 3, PCN-121 : un fondu à droite dit que le rang défile ; la dernière puce n'est jamais coupée sans indice */\n.cn-champ-zone .cn-vadans { flex-wrap: nowrap; overflow-x: auto; scrollbar-width: none; gap: 6px; padding-right: 24px; -webkit-mask-image: linear-gradient(to right, #000 calc(100% - 28px), transparent); mask-image: linear-gradient(to right, #000 calc(100% - 28px), transparent); }");
ed(L, "      <div className={`cn-carnet${vide && onCollerLien ? ' cn-carnet-coller' : ''}`}>", "      <div className={`cn-carnet${vide && onCollerLien ? ` cn-carnet-coller${c.title.length > 24 ? ' cn-carnet-long' : ''}` : ''}`}>");
// 124
ed(U, "      <button className=\"upgrade-project\" onClick={() => open(plan)}>\n        <span className=\"finance-row-main\">",
"      <button className=\"upgrade-project\" onClick={() => open(plan)}>\n        {/* tour 3, PCN-124 : dans Stocks › Matériel, Réalisés porte la vignette de l'objet comme les rangées de g05-1 */}\n        {vue && scope === 'completed' && <span data-vignette-realise className=\"shrink-0\"><VignetteObjet mots={[plan.title]} classe=\"!m-0 grid !h-11 !w-11 shrink-0 place-items-center overflow-hidden rounded-lg !bg-cave-850 object-cover\" taille={30}/></span>}\n        <span className=\"finance-row-main\">");
console.log('ko', ko);
