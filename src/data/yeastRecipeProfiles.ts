import type { HopSource } from '../../functions/src/hopIndexSchema';
import belgian from './yeastEnrichmentBelgian.json';
import lager from './yeastEnrichmentLager.json';

export type YeastStyleId = 'weissbier' | 'witbier' | 'american-wheat' | 'hazy-ipa' | 'clean-ale' | 'english-ale' | 'lager' | 'saison' | 'belgian-ale' | 'stout-porter' | 'kolsch-alt' | 'sour' | 'unknown';
export type YeastRecipeGoal = 'balanced' | 'banana' | 'clove' | 'fruit' | 'clean' | 'dry' | 'hops';
export const YEAST_RECIPE_GOAL_LABELS: Record<YeastRecipeGoal, string> = {
  balanced: 'Équilibre', banana: 'Banane', clove: 'Girofle · épices', fruit: 'Fruits · esters', clean: 'Profil discret', dry: 'Finale sèche', hops: 'Expression du houblon'
};
export const YEAST_STYLE_FAMILIES: { id: YeastStyleId; label: string; goals: YeastRecipeGoal[] }[] = [
  { id: 'weissbier', label: 'Weissbier · Hefeweizen', goals: ['balanced', 'banana', 'clove', 'fruit', 'dry'] },
  { id: 'witbier', label: 'Witbier · blanche belge', goals: ['balanced', 'clove', 'fruit'] },
  { id: 'american-wheat', label: 'Blé américain', goals: ['clean', 'hops'] },
  { id: 'hazy-ipa', label: 'Hazy · NEIPA', goals: ['hops', 'fruit', 'dry'] },
  { id: 'clean-ale', label: 'Ale nette · Pale / IPA', goals: ['clean', 'hops', 'dry'] },
  { id: 'english-ale', label: 'Ale anglaise', goals: ['balanced', 'fruit', 'dry'] },
  { id: 'lager', label: 'Lager', goals: ['clean', 'hops', 'dry'] },
  { id: 'saison', label: 'Saison', goals: ['balanced', 'clove', 'dry'] },
  { id: 'belgian-ale', label: 'Ale belge · abbaye', goals: ['balanced', 'fruit', 'clove'] },
  { id: 'stout-porter', label: 'Stout · Porter', goals: ['balanced', 'clean', 'fruit', 'dry', 'hops'] },
  { id: 'kolsch-alt', label: 'Kölsch · Altbier', goals: ['balanced', 'clean', 'fruit', 'dry'] },
  { id: 'sour', label: 'Bières acidulées · fermentations mixtes', goals: ['balanced', 'fruit', 'dry', 'hops'] },
  { id: 'unknown', label: 'Autre style · choix libre', goals: ['balanced', 'banana', 'clove', 'fruit', 'clean', 'dry', 'hops'] }
];

export interface YeastRecipeProfile {
  yeastId: string;
  label: string;
  styles: YeastStyleId[];
  descriptor: string;
  affinities: Partial<Record<YeastRecipeGoal, string>>;
  source: HopSource;
  /** Capacity documented by a phenotype or an explicit phenolic description, not inferred from a name. */
  phenolic?: boolean;
  diastatic?: boolean;
  traitSource?: HopSource;
  /** Only the named Wyeast sources support this direction; it is not a response curve. */
  temperatureEsters?: boolean;
  headspacePct?: number;
}
const manufacturer = (author: string, title: string, reference: string): HopSource => ({ author, title, reference, kind: 'manufacturer', year: null });
const wy = (code: string, page: string) => manufacturer('Wyeast', code, `https://wyeastlab.com/product/${page}/`);
const wl = (code: string, id: number) => manufacturer('White Labs', code, `https://www.whitelabs.com/yeast-single?id=${id}&type=YEAST`);
const lal = (name: string, page: string) => manufacturer('Lallemand Brewing', name, `https://www.lallemandbrewing.com/en/united-states/products/${page}/`);
const fer = (name: string, page: string) => manufacturer('Fermentis', name, `https://fermentis.com/en/product/${page}/`);

export const YEAST_RECIPE_SOURCES = {
  ferulic: manufacturer('Lallemand Brewing', 'Best Practices — Wheat Beer Solutions', 'https://admin.lallemandbrewing.com/wp-content/uploads/2023/10/Wheat-Beer-Solutions-BP-ENG-digital-LalBrew.pdf'),
  pressure: { author: 'Souffriau et al.', title: 'CO₂ inhibition of isoamyl acetate production', year: 2022, kind: 'research', reference: 'https://journals.asm.org/doi/10.1128/aem.00814-22' } as HopSource,
  hopCreep: { author: 'Stokholm et Shellhammer', title: 'Hop Creep — Technical Brief', year: 2020, kind: 'research', reference: 'https://cdn.brewersassociation.org/wp-content/uploads/2020/05/Hop-Creep-%E2%80%93-Technical-Brief.pdf' } as HopSource,
  hopContact: { author: 'Haslbeck et al.', title: 'On the fate of β-myrcene during fermentation', year: 2017, kind: 'research', reference: 'https://brewingscience.de/index.php/brewingscience/article/download/329/235/585' } as HopSource,
  sensoryLimit: { author: 'Samia, Shayevitz, Fischborn et Shellhammer', title: 'Fermentation temperature impacts polyfunctional thiol biotransformation in beer', year: 2024, kind: 'research', reference: 'https://brewingscience.de/index.php/brewingscience/article/download/241/150/416' } as HopSource,
  weissbier: { author: 'BJCP', title: '2021 — Weissbier', year: 2021, kind: 'judgment', reference: 'https://www.bjcp.org/style/2021/10/10A/weissbier/' } as HopSource,
  cells: manufacturer('Wyeast', 'Yeast harvesting and repitching', 'https://wyeastlab.com/resource/professional-yeast-harvesting-repitching/'),
  farmhouse: manufacturer('Lallemand Brewing', 'LalBrew Farmhouse — Technical Data Sheet', 'https://files.scottlab.com/uploads/FARMHOUSE%20TDS%20.pdf'),
  belle: manufacturer('Lallemand Brewing', 'LalBrew Belle Saison — Technical Data Sheet', 'https://files.scottlab.com/uploads/BELLE%20SAISON%20TDS.pdf')
};

/** Editorial shortlist by brewing family. Affinity is a reason to compare, never a sensory ranking or equivalence. */
const BASE_YEAST_RECIPE_PROFILES: YeastRecipeProfile[] = [
  { yeastId: 'wyeast-3068', label: '3068 · Weihenstephan', styles: ['weissbier'], descriptor: 'Banane et girofle ; équilibre modulable.', affinities: { balanced: 'Équilibre banane–girofle décrit par Wyeast.', banana: 'Wyeast documente des leviers favorisant les esters de cette souche.', clove: 'Limiter les esters peut rendre le girofle plus perceptible, sans prédire davantage de 4-VG.' }, source: wy('3068 Weihenstephan Weizen', 'weihenstephan-weizen'), phenolic: true, temperatureEsters: true, headspacePct: 33 },
  { yeastId: 'white-labs-wlp300', label: 'WLP300 · Hefeweizen', styles: ['weissbier'], descriptor: 'Orientation banane ; girofle en soutien.', affinities: { banana: 'Banane dominante dans la description White Labs ; ce n’est pas une concentration garantie.' }, source: wl('WLP300 Hefeweizen', 148), phenolic: true, diastatic: false },
  { yeastId: 'white-labs-wlp380', label: 'WLP380 · Hefeweizen IV', styles: ['weissbier'], descriptor: 'Muscade, girofle et épices devant la banane.', affinities: { clove: 'Une alternative WLP à comparer pour son orientation épicée déclarée ; aucun classement universel de banane ou de girofle.' }, source: wl('WLP380 Hefeweizen IV', 151), phenolic: true, diastatic: false },
  { yeastId: 'wyeast-3638', label: '3638 · Bavarian Wheat', styles: ['weissbier'], descriptor: 'Banane, pomme, poire et prune ; girofle et vanille.', affinities: { fruit: 'Un répertoire fruité plus varié est décrit, pas un simple gain de banane.', banana: 'Banane dominante avec des esters de fruits du verger.' }, source: wy('3638 Bavarian Wheat', 'bavarian-wheat'), phenolic: true, temperatureEsters: true, headspacePct: 33 },
  { yeastId: 'lallemand-munich-classic', label: 'Munich Classic', styles: ['weissbier'], descriptor: 'Profil allemand expressif, banane et girofle.', affinities: { balanced: 'Alternative sèche destinée aux Weizen, différente d’une équivalence de souche.', banana: 'Caractère fruité et épicé affirmé, destiné aux bières de blé allemandes.' }, source: manufacturer('Lallemand Brewing', 'Munich Classic', 'https://www.lallemandbrewing.com/en/canada/products/munich-classic-wheat-beer-yeast/'), phenolic: true, diastatic: false },
  { yeastId: 'fermentis-w68', label: 'SafAle W-68', styles: ['weissbier'], descriptor: 'Blé allemand : banane, fruité et girofle.', affinities: { balanced: 'Alternative sèche destinée au profil allemand banane–girofle.', banana: 'Banane et esters décrits ; pas de courbe de température validée pour ta recette.' }, source: fer('SafAle W-68', 'safale-w-68'), phenolic: true },
  { yeastId: 'yeast-mangrove-jacks-132040951', label: 'M20 · Bavarian Wheat', styles: ['weissbier'], descriptor: 'Banane–girofle ; caractère levure pouvant dominer le houblon.', affinities: { balanced: 'Hefeweizen, Kristallweizen et Dunkelweizen cités par le fabricant.' }, source: manufacturer('Mangrove Jack’s', 'M20 — Craft Series Brewer’s Yeasts', 'https://help.mangrovejacks.com/hc/en-us/article_attachments/13551379984785'), phenolic: true },
  { yeastId: 'yeast-fermentis-safale-wb-06', label: 'SafAle WB-06', styles: ['weissbier', 'witbier'], descriptor: 'Alternative très sèche, fruitée et phénolique ; diastatique.', affinities: { dry: 'Weizen et Wit sont des usages fabricant ; sa forte atténuation change le compromis de corps.' }, source: fer('SafAle WB-06', 'safale-wb-06'), phenolic: true, diastatic: true },
  { yeastId: 'wyeast-3944', label: '3944 · Belgian Witbier', styles: ['witbier'], descriptor: 'Épices dominantes, esters faibles à modérés.', affinities: { clove: 'Phénols épicés et girofle délicat, avec une contribution fruitée modérée.', balanced: 'Profil Wit prévu pour s’accorder aux ingrédients de la blanche belge.' }, source: wy('3944 Belgian Witbier', 'belgian-witbier'), phenolic: true, headspacePct: 33 },
  { yeastId: 'white-labs-wlp400', label: 'WLP400 · Belgian Wit', styles: ['witbier'], descriptor: 'Phénols herbacés, compatibles avec fruits et épices.', affinities: { clove: 'Profil phénolique pour une Wit : tenir compte des épices déjà ajoutées.' }, source: wl('WLP400 Belgian Wit', 152), phenolic: true, diastatic: false },
  { yeastId: 'lalbrew-wit', label: 'LalBrew Wit', styles: ['witbier'], descriptor: 'Esters et phénols moins intenses que Munich Classic.', affinities: { balanced: 'Laisse davantage de place aux autres ingrédients qu’une Weizen expressive, selon Lallemand.' }, source: lal('LalBrew Wit', 'belgian-wit-style-ale-yeast'), phenolic: true },
  { yeastId: 'wyeast-1010', label: '1010 · American Wheat', styles: ['american-wheat'], descriptor: 'Peu d’esters, finale sèche et vive.', affinities: { clean: 'Souche destinée au blé américain lorsque les esters doivent rester discrets.', hops: 'Profil pauvre en esters pour conserver une lecture plus directe des autres ingrédients.' }, source: wy('1010 American Wheat', 'american-wheat') },
  { yeastId: 'lalbrew-verdant-ipa', label: 'Verdant IPA', styles: ['hazy-ipa', 'english-ale'], descriptor: 'Abricot, fruits tropicaux et agrumes.', affinities: { fruit: 'Contribution fruitée propre à la levure, complémentaire aux houblons.', hops: 'Décrite pour les IPA ; potentiel de biotransformation distinct d’un gain de goût garanti.' }, source: lal('LalBrew Verdant IPA', 'lalbrew-verdant-ipa') },
  { yeastId: 'wyeast-1318', label: '1318 · London Ale III', styles: ['hazy-ipa', 'english-ale'], descriptor: 'Fruité, finale légèrement douce ; floculation haute.', affinities: { balanced: 'Profil fruité avec une finale légèrement douce décrite.', fruit: 'Autre équilibre esters–finale que Verdant ; comparer les plages d’atténuation.' }, source: wy('1318 London Ale III', 'london-ale-iii') },
  { yeastId: 'white-labs-wlp066', label: 'WLP066 · London Fog', styles: ['hazy-ipa'], descriptor: 'Ananas et pamplemousse ; Hazy IPA.', affinities: { fruit: 'Ananas/pamplemousse décrits : une alternative aromatique, sans rendement prédit.', hops: 'Souche destinée aux Hazy ; vérifier la forme choisie, liquide ou sèche.' }, source: wl('WLP066 London Fog', 134), diastatic: false },
  { yeastId: 'fermentis-us05', label: 'SafAle US-05', styles: ['clean-ale', 'american-wheat'], descriptor: 'Profil neutre pour lire malt et houblon.', affinities: { clean: 'La neutralité décrite sert un profil net.', hops: 'Conserve un profil de fermentation discret ; aucun bonus de thiols supposé.' }, source: fer('SafAle US-05', 'safale-us-05') },
  { yeastId: 'lalbrew-bry97', label: 'BRY-97 · West Coast', styles: ['clean-ale'], descriptor: 'Ale américaine nette, destinée aux bières houblonnées.', affinities: { clean: 'Alternative sèche de profil net.', hops: 'Comparer son comportement avec US-05, sans les traiter comme la même souche.' }, source: lal('LalBrew BRY-97', 'bry-97-west-coast-ale-yeast') },
  { yeastId: 'lalbrew-nottingham', label: 'Nottingham', styles: ['english-ale', 'clean-ale'], descriptor: 'Ale polyvalente, esters discrets et forte atténuation.', affinities: { clean: 'Profil relativement neutre décrit.', dry: 'Atténuation documentaire élevée : vérifier la fermentescibilité réelle du moût.' }, source: lal('LalBrew Nottingham', 'nottingham-high-performance-ale-yeast') },
  { yeastId: 'yeast-fermentis-safale-s-e2-80-9104', label: 'SafAle S-04', styles: ['english-ale'], descriptor: 'Ale anglaise, fruitée et florale ; bonne floculation.', affinities: { balanced: 'Une alternative anglaise pour un fruité contenu et une bonne sédimentation.' }, source: fer('SafAle S-04', 'safale-s%E2%80%9104') },
  { yeastId: 'lalbrew-diamond', label: 'Diamond Lager', styles: ['lager'], descriptor: 'Profil lager net.', affinities: { clean: 'Une fenêtre de lager distincte des ales.', hops: 'Profil de fermentation net pour une lager houblonnée ; pas de gain aromatique garanti.' }, source: manufacturer('Lallemand Brewing', 'LalBrew Diamond', 'https://www.lallemandbrewing.com/en/global/products/diamond-lager-yeast') },
  { yeastId: 'yeast-fermentis-saflager-w-34-70', label: 'SafLager W-34/70', styles: ['lager'], descriptor: 'Lager nette ; besoin de dose propre à sa fiche.', affinities: { clean: 'Souche de lager avec dosage fabricant distinct de celui des ales sèches.' }, source: fer('SafLager W-34/70', 'saflager-w-34-70') },
  { yeastId: 'lalbrew-belle-saison', label: 'Belle Saison', styles: ['saison'], descriptor: 'Agrumes et poivre ; diastatique, forte atténuation.', affinities: { dry: '86–94 % documentaires ; la finition peut continuer après l’activité principale.', clove: 'POF positif, épices et poivre : aucun pourcentage sensoriel calculé.' }, source: YEAST_RECIPE_SOURCES.belle, phenolic: true, diastatic: true },
  { yeastId: 'lalbrew-farmhouse', label: 'Farmhouse', styles: ['saison'], descriptor: 'Girofle, poivre et fruits ; sans STA1.', affinities: { balanced: 'Alternative non diastatique ; elle ne conserve pas automatiquement la même sécheresse.', clove: 'Phénols documentés sans STA1 ; l’empâtage reste déterminant pour la finale.' }, source: YEAST_RECIPE_SOURCES.farmhouse, phenolic: true, diastatic: false },
  { yeastId: 'lalbrew-abbaye', label: 'Abbaye', styles: ['belgian-ale'], descriptor: 'Fruits et épices pour les ales belges.', affinities: { fruit: 'Profil belge fruité documenté ; à distinguer d’une Weizen malgré certaines notes communes.', balanced: 'Alternative sèche pour les bières belges.' }, source: manufacturer('Lallemand Brewing', 'LalBrew Abbaye', 'https://www.lallemandbrewing.com/en/united-kingdom/products/abbaye-belgian-ale-yeast/'), phenolic: true, diastatic: false, traitSource: manufacturer('Lallemand Brewing', 'Saison Solutions — Comparaison STA1', 'https://admin.lallemandbrewing.com/wp-content/uploads/2021/06/LAL-bestpractices-Saison_solutions-ENG-A4.pdf') }
];

export const YEAST_RECIPE_PROFILES: YeastRecipeProfile[] = [...BASE_YEAST_RECIPE_PROFILES, ...(belgian.profiles as YeastRecipeProfile[]), ...(lager.profiles as YeastRecipeProfile[])];
