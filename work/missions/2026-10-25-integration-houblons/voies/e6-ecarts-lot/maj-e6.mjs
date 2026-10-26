#!/usr/bin/env node
// e6 (26.10) : met à jour `verif.attendu` de 13 états des classes (a) D102/D105/D106 et (b) données, suivant la convention e3/e5 :
//   - `verif.attendu` = ce que la maquette construite montre aujourd'hui ;
//   - `verif.choisie.attendu` = les anciennes valeurs, jouées sur la maquette choisie (statique) : créé s'il manque ;
//   - `verif.note` = la raison, la classe et le chemin de la paire de captures regardée.
// Usage : node maj-e6.mjs [--ecrire]   (sans --ecrire : montre seulement ce qui changerait)
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const ici = path.dirname(fileURLToPath(import.meta.url));
const dossier = path.resolve(ici, '..', '..', '..', '..', 'refonte-frontend', 'v4', 'choix', 'etats');
const ecrire = process.argv.includes('--ecrire');
const PAIRE = (id) => `work/missions/2026-10-25-integration-houblons/voies/e6-ecarts-lot/paires/${id}.png`;

const SUBST = 'e6, 26.10 : classe (a), dessin identique : D106 (3) (à 60′ l’usage « arôme » de Beer Maverick recule : Sabro, Nelson Sauvin, Idaho 7, Galaxy et Hallertau Blanc quittent le haut) et D102 J1 (l’α passe de 0,4 à 0,15 à 60′ : Trident et Yeoman à 99, Magnat à 96). '
  + 'Attribué par sonde (voies/e6-ecarts-lot/sonde-subst.ts, Nugget à 60′, stout 16D, fixtures) : les deux retirés rendent exactement le classement de fb0d14e3 ; le catalogue complet de c7 ne change pas ce haut de liste.';
const SUGG = 'e6, 26.10 : classe (a), dessin identique : D105 (B1) : le pool « à acheter » est classé par qualité (fiches lues avant le nom) et borné à 80, puis départage avant les effets de bord ; Aurum, Boadicea et Celeia (une fiche chacun) ne sont plus parmi les voies « plus floral » ni « plus agrumes » '
  + '(sonde voies/e6-ecarts-lot/sonde-voies.ts : présents aux rangs 2 à 4 sur fb0d14e3, absents sur HEAD). Mêmes lignes (usage, nom, α, stock, ♡, +), mêmes colonnes.';

// id → { fichier, attendu, detail }
const CHANGES = {
  'etat-subst-repos': { f: 'substituer', attendu: ['Nugget', 'remplaçants', 'à 60′', 'Trident et Yeoman, 99 sans inconnue.'], detail: 'La réponse en gras devient « Trident et Yeoman, 99 sans inconnue. » (Yeoman 100 avant).', c: SUBST },
  'etat-subst-echelle': { f: 'substituer', attendu: ['partiel', 'proche', 'très proche', 'Trident', 'Yeoman', 'Helios', 'Centennial', 'Magnat', 'Citra cryo', 'Motueka', 'Galaxy', '50', '65', '80', '100', 'À acheter', 'En stock, suffisant', 'En stock, insuffisant'], detail: 'Les huit candidats sont Trident, Yeoman, Helios, Centennial, Magnat (à acheter), Citra cryo, Motueka, Galaxy (du stock) ; Sabro, Nelson Sauvin et Altus n’y sont plus. Même échelle 50–100, mêmes trois paliers, mêmes icônes de stock.', c: SUBST },
  'etat-subst-plage': { f: 'substituer', attendu: ['tout connu', '100', '99', '97', '96', '95', '80', '77'], detail: 'Points « tout connu » à 99, 99, 97, 96, 96, 95, 80 et 77 ; toujours aucune plage hachurée (voir DÉCISION de e3 : la fixture ne l’exerce plus).', c: SUBST },
  'etat-subst-face': { f: 'substituer', attendu: ['Face à face, même IBU', 'Nugget', '46 g', 'Trident', '43–54 g', 'Citra cryo', '24 g', 'double usage', 'aromatique', 'Épuisé'], detail: 'Les trois bandes : Nugget (épuisé, 46 g), Trident (premier sûr à acheter, 43–54 g), Citra cryo (premier du stock qui suffit, 24 g, aromatique) ; Nelson Sauvin (62 g) n’est plus le premier du stock.', c: SUBST },
  'etat-subst-alpha': { f: 'substituer', attendu: ['9–16', '11–14', '10–15', 'lot 13', 'article 24,8'], detail: 'Les trois rangées α sont Nugget 9–16 (lot 13), Trident 11–14, Citra cryo 10–15 (article 24,8) ; le repère « article » passe de Nelson Sauvin (9,6) à Citra cryo (24,8).', c: SUBST },
  'etat-subst-aromes': { f: 'substituer', attendu: ['Arômes', '16D', 'Floral', 'Herbacé', 'Terreux', 'Hors 16D', 'Agrumes', 'Tropicaux', 'Résineux', 'Épicé', 'Fiches lues', 'Nugget 10', 'Trident 2', 'Citra cryo 7', 'Pointillé', 'Noyau', 'Pépins', 'Baies', 'Melon', 'Végétal', 'sans famille'], detail: 'Fiches lues : Nugget 10, Trident 2, Citra cryo 7 (avant Yeoman 1, Nelson Sauvin 9) ; mêmes colonnes et mêmes groupes.', c: SUBST },
  'etat-subst-radar': { f: 'substituer', attendu: ['Radar des citations : Nugget, Trident, Citra cryo', 'Nugget (l’original, contour seul)', 'gras : attendu en 16D', 'Du centre vers le bord', 'non décrit, cité, marqué'], detail: 'Le radar compare Nugget, Trident et Citra cryo ; mêmes anneaux, même contour seul pour l’original.', c: SUBST },
  'etat-subst-beta': { f: 'substituer', attendu: ['3–8', '4–5', '2,7–4,5', 'un par plage qui diffère', 'milieu moyen des sources'], detail: 'Rangées β : Nugget 3–8, Trident 4–5, Citra cryo 2,7–4,5 ; même légende.', c: SUBST },
  'etat-subst-style': { f: 'substituer', attendu: ['16D Foreign Extra Stout', 'attend floral, herbacé, terreux', 'IBU 50–70', 'la recette est à 59,7 et chaque dose la garde', 'cite les trois', 'ne cite aucune des trois', 'fruité, agrumes, fruits tropicaux, fruit de la passion', 'garde floral (marqué), perd herbacé et terreux', 'Employé en Hazy IPA, IPA', 'aucune stout citée'], detail: 'Les quatre lignes sont la 16D, Nugget, Trident (« ne cite aucune des trois ») et Citra cryo (« garde floral (marqué), perd herbacé et terreux ») ; les trois houblons ont maintenant un style d’emploi : « Aucun style d’emploi dans le dépôt » n’est plus lu par cette fixture (à rejouer avec un houblon sans style d’emploi : DÉCISION de e6).', c: SUBST },
  'etat-subst-actions': { f: 'substituer', attendu: ['Ajouter Trident aux achats', 'Remplacer', 'Citra cryo'], detail: 'Le bouton nomme Trident (premier remplaçant sûr à acheter) et le pied propose « 46 g de Nugget → 24 g de Citra cryo » (premier du stock qui suffit) ; même bouton « Remplacer ›».', c: SUBST },
  'etat-fiche-substituts': { f: 'fiche', attendu: ['Magnat', 'Yeoman', 'Trident'], detail: 'Le bouton ouvre toujours les remplaçants à 60′ : la tête dit « Trident et Yeoman, 99 sans inconnue. » et l’échelle nomme Trident, Yeoman, Helios, Centennial, Magnat, Citra cryo, Motueka, Galaxy (Sabro n’y est plus).', c: SUBST },
  'etat-acquis-q2b-suite-s5': { f: 'acquis', attendu: ['East Kent Goldings', 'Hallertau Tradition', 'Huell Melon', 'Motueka + Hallertau Blanc'], detail: 'Les lignes « plus floral » deviennent Motueka, Motueka + Hallertau Blanc, Hallertau Blanc, East Kent Goldings, Hallertau Tradition, Huell Melon, Saphir (Boadicea et Celeia retirés).', c: SUGG },
  'etat-acquis-stock-icone': { f: 'acquis', attendu: ['Motueka', 'en stock', 'à acheter'], detail: 'L’icône boîte (en stock) est sur Motueka et Hallertau Blanc, le panier (à acheter) sur East Kent Goldings, Hallertau Tradition, Huell Melon, Saphir ; les libellés « en stock » et « à acheter » sont lus. Aurum n’est plus proposé.', c: SUGG },
};

const lus = {};
const vers = (f) => (lus[f] ??= { chemin: path.join(dossier, `${f}.json`), j: JSON.parse(fs.readFileSync(path.join(dossier, `${f}.json`), 'utf8')) });
const vu = new Set();
for (const [id, ch] of Object.entries(CHANGES)) {
  const { j } = vers(ch.f);
  const e = j.etats.find((x) => x.id === id);
  if (!e) throw new Error(`état absent : ${id}`);
  const v = e.verif;
  const ancien = v.attendu;
  if (!v.choisie) v.choisie = { attendu: ancien };
  else if (!v.choisie.attendu) v.choisie.attendu = ancien;
  v.attendu = ch.attendu;
  v.note = `${v.note ? v.note + ' — ' : ''}${ch.c} ${ch.detail} (captures avant (deeb4d23, ETATS OK 138/138) et après (HEAD) regardées côte à côte : ${PAIRE(id)}.)`;
  vu.add(id);
  console.log(`${id} : ${JSON.stringify(ancien)} → ${JSON.stringify(ch.attendu)}`);
}
if (ecrire) for (const { chemin, j } of Object.values(lus)) fs.writeFileSync(chemin, JSON.stringify(j, null, 1) + '\n');
console.log(`${vu.size} états ${ecrire ? 'écrits' : '(à blanc : rien écrit)'}`);
