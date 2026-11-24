import { R } from './r.mjs';

/* T28-6 (restes) : le rang « 1er pour le prix », la réglette de Choisir et la liste lisent le prix qui classe (CHF, par kg si les quantités sont dites) */
R('src/domain/carnets/comparer.ts', [
  ["import { dimensionDuClassement, ecartDePrix, prixDeClassement, prixEnChf, type Dimension } from './prixUnitaire';", "import { dimensionDuClassement, ecartDePrix, prixDeClassement, prixEnChf, quantiteArticle, texteParUnite, type Dimension } from './prixUnitaire';"],
  ["  /** D447 : la taxe dite par la page,", "  /** T28-6, T30-4 : le prix qui classe (centimes de franc, par kg ou par L quand les quantités sont dites) ; absent : inconnu en francs. */\n  prixClasse?: number;\n  /** T28-6 : la quantité que le nom de l'article dit (« 100 g », « 1 kg ») et le prix ramené à l'unité (« 72,50 CHF/kg »). */\n  quantite?: string;\n  parUnite?: string;\n  /** D447 : la taxe dite par la page,"],
  ["  colonnes: Colonne[]; lignes: LigneTableau[]; rangePar: string | null; aRelire: Article[];\n", "  colonnes: Colonne[]; lignes: LigneTableau[]; rangePar: string | null; aRelire: Article[];\n  /** T28-6 : le prix classe au kilo (masse) ou au litre (volume) quand au moins deux offres disent leur quantité. */\n  prixParUnite?: Dimension;\n"],
  ["  const ligne = (a: Article, rang: number | null): LigneTableau => {\n", "  const clePrix = cles.find(k => k.sorte === 'prix');\n  const dimPrix = clePrix && clePrix.sorte === 'prix' ? clePrix.parUnite ?? null : null;\n  const ligne = (a: Article, rang: number | null): LigneTableau => {\n    const chf = prixEnChf(a);\n    const classe = clePrix ? prixDeClassement(a, dimPrix) : null;\n    const quantite = quantiteArticle(a);\n    const parUnite = quantite && chf !== null ? texteParUnite(a, chf, 'CHF') : null;\n"],
  ["      ...(a.prixCentimes !== undefined ? { prixCentimes: a.prixCentimes } : {}), ...(a.prixDes ? { prixDes: true as const } : {}),\n", "      ...(a.prixCentimes !== undefined ? { prixCentimes: a.prixCentimes } : {}), ...(a.prixDes ? { prixDes: true as const } : {}),\n      ...(classe !== null ? { prixClasse: classe } : {}), ...(quantite ? { quantite: quantite.texte } : {}), ...(parUnite ? { parUnite } : {}),\n"],
  ["rangePar: rangeParCles(cles), aRelire, rangeParNoms };", "rangePar: rangeParCles(cles), aRelire, rangeParNoms, ...(dimPrix ? { prixParUnite: dimPrix } : {}) };"],
  ["  const prix = placeSur(lignes, tous, l, 'prix', devise, 'moins', x => x.prixCentimes ?? null, prixTexte(l.prixCentimes, l.devise), false);\n  if (prix) sortie.push(prix);",
   "  /* T28-6, T30-4 : le rang du prix se calcule sur le prix qui classe (en francs, au kilo si les quantités sont dites), jamais sur le prix affiché */\n  const unitePrix = t.prixParUnite ? (t.prixParUnite === 'volume' ? 'CHF/L' : 'CHF/kg') : l.prixClasse !== undefined && (l.devise ?? 'CHF') !== devise ? 'CHF' : devise;\n  const texteDuPrix = prixTexte(l.prixCentimes, l.devise);\n  const prix = placeSur(lignes, tous, l, 'prix', unitePrix, 'moins', x => x.prixClasse ?? null, texteDuPrix === null ? null : l.parUnite && t.prixParUnite ? `${texteDuPrix} · ${l.parUnite}` : texteDuPrix, false);\n  if (prix) {\n    if (prix.rangColonne && t.prixParUnite) prix.rangColonne = prix.rangColonne.replace(/pour le prix$/, t.prixParUnite === 'volume' ? 'pour le prix au litre' : 'pour le prix au kilo');\n    sortie.push(prix);\n  }"],
]);

/* la liste et Comparer disent la quantité à côté du prix */
R('src/ui/carnets/TableauCarnet.tsx', [
  ["{v ? <span className=\"cn-mono\">{v}</span> : <span className=\"cn-inconnu\" aria-label=\"inconnu\">–</span>}</span>;", "{v ? <span className=\"cn-mono\">{v}</span> : <span className=\"cn-inconnu\" aria-label=\"inconnu\">–</span>}{c.cle === '__prix' && v && l.quantite ? <small className=\"cn-mut cn-tab-q\">{l.quantite}</small> : null}</span>;"],
]);
R('src/ui/carnets/Comparer.tsx', [
  ["<Mesure txt={montant(l.prixCentimes) ?? ''} />{l.taxe ? <small className=\"cn-mut\">{mentionTaxe(l.taxe).trim()}</small> : null}</>;", "<Mesure txt={montant(l.prixCentimes) ?? ''} />{l.quantite ? <small className=\"cn-mut\">{l.quantite}{l.parUnite ? ` · ${l.parUnite}` : ''}</small> : null}{l.taxe ? <small className=\"cn-mut\">{mentionTaxe(l.taxe).trim()}</small> : null}</>;"],
]);
R('src/ui/carnets/carnets.css', [
  [".cn-tab-num { text-align: right; white-space: nowrap; }", ".cn-tab-num { text-align: right; white-space: nowrap; }\n.cn-tab-q { display: block; font-size: 12px; line-height: 14px; }"],
]);
