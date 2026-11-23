import { R } from './r.mjs';

/* T30-9 : « 8 caractéristiques », jamais « 8 mesures : 8 ailleurs dans la page » */
R('functions/src/lienProduit.ts', [
  ["/** « 20 mesures » ; « 8 mesures : 5 du tableau de la page, 2 ailleurs dans la page, 1 du nom » (T28-9 : ni « HTML » ni « données embarquées »). */\nfunction detailCaract(total: number, tableau: number, duNom: number): string {\n  const ailleurs = total - tableau - duNom;\n  const d = total === tableau ? [] : [tableau ? `${tableau} du tableau de la page` : '', ailleurs ? `${ailleurs} ailleurs dans la page` : '', duNom ? `${duNom} du nom` : ''].filter(Boolean);\n  return `${total} mesure${total > 1 ? 's' : ''}${d.length ? ` : ${d.join(', ')}` : ''}`;\n}",
   "/**\n * « 20 caractéristiques » ; « 8 caractéristiques : 5 du tableau de la page, 1 du nom » (T28-9 : ni « HTML » ni « données embarquées » ; T30-9 : en mots\n * du brasseur, jamais « 8 mesures : 8 ailleurs dans la page »). La provenance ne se détaille que si elle varie : tout au même endroit ne se redit pas.\n */\nfunction detailCaract(total: number, tableau: number, duNom: number): string {\n  const ailleurs = total - tableau - duNom;\n  const sources = [tableau, ailleurs, duNom].filter((n) => n > 0).length;\n  const d = sources < 2 ? [] : [tableau ? `${tableau} du tableau de la page` : '', ailleurs ? `${ailleurs} ailleurs dans la page` : '', duNom ? `${duNom} du nom` : ''].filter(Boolean);\n  return `${total} caractéristique${total > 1 ? 's' : ''}${d.length ? ` : ${d.join(', ')}` : ''}`;\n}"],
]);
R('functions/src/lireLien.ts', [
  ["detail: `${fusion.valeurs.length} mesures : ${fusion.ajoutees} de plus lues sur la fiche de la boutique` });", "detail: `${fusion.valeurs.length} caractéristiques : ${fusion.ajoutees} de plus lues sur la fiche de la boutique` });"],
]);

/* T30-11 : jamais un nom de modèle sous les yeux du brasseur */
R('functions/src/lienIA.ts', [
  ["  const modeles: string[] = [direct ? 'modèle fort' : 'lite'];", "  /* T30-11 : ce que l'étape dit est pour le brasseur : jamais « lite », « fort » ni un nom de modèle */\n  const modeles: string[] = [direct ? 'IA plus forte' : ''];"],
  ["    modeles.push('fort');", "    modeles.push('relu par une IA plus forte');"],
  ["detail: [modeles.join(' puis '), ajouts.length ? `ajouté : ${ajouts.join(', ')}` : 'rien de plus',", "detail: [modeles.filter(Boolean).join(' puis '), ajouts.length ? `ajouté : ${ajouts.join(', ')}` : 'rien de plus à lire',"],
]);
R('src/domain/carnets/lecture.ts', [
  ["const fort = o.escalade && !ia?.detail?.includes('modèle fort') ? 'modèle fort' : '';", "const fort = o.escalade && !ia?.detail?.includes('IA plus forte') ? 'IA plus forte' : '';"],
  ["export type CleEtape = 'page' | 'donnees' | 'prix' | 'photos' | 'caract' | 'controle' | 'ia';", "export type CleEtape = 'page' | 'donnees' | 'prix' | 'photos' | 'caract' | 'controle' | 'ia' | 'rangement';"],
  ["caract: 'Caractéristiques', controle: 'Contrôle', ia: 'Lecture IA'\n};", "caract: 'Caractéristiques', controle: 'Contrôle', ia: 'Lecture IA', rangement: 'Rangement'\n};"],
  ["export function lignesEtapes(etapes: readonly EtapeLien[] = [], o: { fini?: boolean; enCours?: 'ia' | 'bloquee'; escalade?: boolean } = {}): LigneEtape[] {",
   "export function lignesEtapes(etapes: readonly EtapeLien[] = [], o: { fini?: boolean; enCours?: 'ia' | 'bloquee'; escalade?: boolean; rangement?: boolean } = {}): LigneEtape[] {"],
  ["  if (o.fini) return lignes.map(l => (l.statut === 'a-faire' || l.statut === 'en-cours' ? { ...l, statut: 'absent' as const } : l));\n  return lignes;",
   "  if (o.fini) return lignes.map(l => (l.statut === 'a-faire' || l.statut === 'en-cours' ? { ...l, statut: 'absent' as const } : l));\n  /* T30-10 : la page est lue, l'IA range l'article dans le carnet (5 s et plus) : l'étape en cours se voit jusqu'au rangement, pas « 6 sur 6 » muet */\n  if (o.rangement && !pageMorte) lignes.push({ cle: 'rangement', libelle: LIBELLE_ETAPE.rangement, statut: 'en-cours', detail: 'l’IA range l’article dans le carnet' });\n  return lignes;"],
]);
R('src/ui/carnets/rangement.ts', [
  ["  jeton?: string; debut?: number; fin?: number; reouverture?: true; escalade?: true;\n", "  jeton?: string; debut?: number; fin?: number; reouverture?: true; escalade?: true;\n  /** T30-10 : la page est lue, l'IA range l'article : l'étape « Rangement » tourne jusqu'à la fin. */\n  rangement?: true;\n"],
  ["      const contexte = contexteModele(texte, deps.maintenant?.() ?? new Date(), depuis, carnets, pages);\n", "      if (lecture) { lecture = { ...lecture, rangement: true }; poser({ etape: 'en-cours', messageId, texte, lecture }); }\n      const contexte = contexteModele(texte, deps.maintenant?.() ?? new Date(), depuis, carnets, pages);\n"],
  ["      if (lecture) lecture = { ...lecture, fin: Date.now() };\n", "      if (lecture) { const { rangement: _r, ...reste } = lecture; lecture = { ...reste, fin: Date.now() }; }\n"],
  ["      return fin({ etape: 'echec', messageId, texte, avis, ...(lecture ? { lecture } : {}) });\n    };", "      if (lecture) { const { rangement: _r, ...reste } = lecture; lecture = reste; }\n      return fin({ etape: 'echec', messageId, texte, avis, ...(lecture ? { lecture } : {}) });\n    };"],
]);
R('src/ui/carnets/LectureLien.tsx', [
  ["  const lignes = lignesEtapes(l.etapes, { fini: !enCours, enCours: l.enCours, escalade: !!l.escalade });\n  const c = compterEtapes(lignes);\n  const ecoule = duree((enCours ? maintenant : l.fin ?? maintenant)", "  const lignes = lignesEtapes(l.etapes, { fini: !enCours, enCours: l.enCours, escalade: !!l.escalade, rangement: !!l.rangement });\n  const c = compterEtapes(lignes);\n  const ecoule = duree((enCours ? maintenant : l.fin ?? maintenant)"],
  ["  const lignes = lignesEtapes(p.lecture.etapes, { fini: !enCours, enCours: p.lecture.enCours, escalade: !!p.lecture.escalade });", "  const lignes = lignesEtapes(p.lecture.etapes, { fini: !enCours, enCours: p.lecture.enCours, escalade: !!p.lecture.escalade, rangement: !!p.lecture.rangement });"],
]);

/* T30-13, T30-14 : libellé et valeur manquants dans les tables */
R('functions/src/lienLibelles.ts', [
  ["  [['height with extension legs', 'height with legs extended'], 'Hauteur avec pieds d’extension'],", "  [['height with extension legs', 'height with legs extended'], 'Hauteur avec pieds d’extension'],\n  [['height without extension legs', 'height without legs extended', 'height without legs'], 'Hauteur sans pieds d’extension'],"],
]);
R('functions/src/lienValeurs.ts', [
  ["  ['mehrzweckhopfen', 'houblon mixte'],", "  ['mehrzweckhopfen', 'houblon mixte'],\n  ['hopfenpellets', 'pellets'],\n  ['typ', 'type'],"],
]);

/* tests de l'ancien texte */
R('tests/unit/carnetsEtapesLecture.test.ts', [["{ detail: 'modèle fort' }", "{ detail: 'IA plus forte' }"]]);
R('tests/unit/carnetsLiensReprise.test.ts', [["expect(etape?.detail).toMatch(/modèle fort/);", "expect(etape?.detail).toMatch(/IA plus forte/);"]]);
