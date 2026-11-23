// Proposed, reviewable knowledge. Runtime uses the saved Firestore revision by ID.
import { writeFileSync } from 'node:fs';
const source = (title, author, reference, year = null, kind = 'manufacturer', locator = 'Fiche consultée le 8 septembre 2026 ; date de publication non indiquée.') => ({ title, author, reference, year, kind, locator });
const judgment = source('Conduites Weissbier proposées par L’Affinée', 'L’Affinée', 'docs/fermentation-guide.md', 2026, 'judgment', 'Choix éditorial du 8 septembre 2026. Consignes et plages de planification à tester : ni optimum établi, ni intervalle de confiance statistique. Les durées sont communes faute de mesures comparables par souche.');
const white = source('WLP300 Hefeweizen Ale Yeast', 'White Labs', 'https://www.whitelabs.com/yeast-single?id=148&type=YEAST');
const wyeast = source('3068 Weihenstephan Weizen', 'Wyeast', 'https://wyeastlab.com/product/weihenstephan-weizen/');
const munich = source('LalBrew Munich Classic — fiche technique', 'Lallemand', 'https://admin.lallemandbrewing.com/wp-content/uploads/2023/05/TDS_LPS_BREWINGYEAST_MUNICHCLASSIC_ENG_A4-5.pdf', null, 'manufacturer', 'Fiche consultée le 8 septembre 2026, température 17–25 °C. L’ancienne fiche Oct 2020 indique 17–22 °C ; le chemin du fichier ne donne pas une date de publication fiable.');
const fermentis = source('SafAle W-68', 'Fermentis', 'https://fermentis.com/en/product/safale-w-68/');
const flavor = source('Precision Flavor Through Fermentation Control', 'Lallemand', 'https://www.lallemandbrewing.com/en/global/resources/whats-new/precision-flavor-through-fermentation-control/', 2025, 'manufacturer', 'Publié le 12 juillet 2025, mis à jour le 17 septembre 2025. Section « The wheat beer example: Balancing banana and cloves ».');
const pressure = source('CO₂ inhibition of isoamyl acetate production: MDS3', 'Souffriau et al.', 'https://doi.org/10.1128/aem.00814-22', 2022, 'research', 'Applied and Environmental Microbiology 88(18). Effet de la pression dépendant des souches ; pas de facteur de correction applicable à ces quatre levures.');
const wheat = source('Wheat Beer Solutions — Best Practices', 'Lallemand', 'https://admin.lallemandbrewing.com/wp-content/uploads/2023/10/Wheat-Beer-Solutions-BP-ENG-digital-LalBrew.pdf', null, 'manufacturer', 'Sections grist/mashing et phenolics. Année de publication non confirmée ; le chemin de stockage n’est pas une date bibliographique.');
const param = (min, max, central) => ({ range: { min, max }, central, source: judgment });
const fact = (min, max, source) => ({ range: { min, max }, source });
const notes = [
  { text: 'Piloter la température de la bière. Pour rechercher les esters, privilégier une fermentation sans contre-pression volontaire ; ne pas fermer une cuve non prévue pour la pression.', source: pressure },
  { text: 'Garder une levure saine et une nutrition adaptée. Ne pas provoquer une carence ou un sous-ensemencement extrême pour forcer la banane. La quantité doit tenir compte du moût, de la fraîcheur et de la viabilité.', source: flavor },
  { text: 'Les jours donnent un budget de temps. La densité et la dégustation décident de la fin ; prolonger si nécessaire. Le repos final ne garantit pas davantage de banane. Aucun froid ni conditionnement automatique n’est imposé.', source: judgment }
];
const plan = (goal, rationale, primary, finish, specific) => ({
  goal, name: goal === 'banana' ? 'Banane en avant' : 'Banane et girofle en équilibre', rationale, source: judgment,
  pitchTemperatureC: param(...primary),
  phases: [
    { id: 'active', name: 'Fermentation principale', kind: 'primaire', temperatureC: param(...primary), days: param(4, 7, 5), completeWhen: 'Attendre que la fermentation ralentisse et que la densité approche sa fin attendue avant de monter au palier suivant.' },
    { id: 'finish', name: 'Fin de fermentation et repos', kind: 'reposDiacetyle', temperatureC: param(...finish), days: param(2, 3, 3), completeWhen: 'Densité finale cohérente et stable sur des mesures successives, puis dégustation sans défaut résiduel avant refroidissement ou conditionnement. Prolonger au besoin.' }
  ],
  notes: [...specific, ...(goal === 'banana' ? [{ text: 'Un repos férulique à l’empâtage peut favoriser le précurseur du girofle ; ce n’est pas le levier pour accentuer la banane. Le guide ne modifie pas ton empâtage.', source: wheat }] : []), ...notes]
});
const rows = [
  { id: 'white-labs-wlp300', name: 'White Labs WLP300 Hefeweizen', form: 'liquide', aliases: ['WLP300', 'WLP 300', 'White Labs Hefeweizen'], source: white, temp: [20, 22], attenuation: [72, 76],
    banana: 'Banane en avant, explicitement décrite par le fabricant.', phenols: 'Girofle présent ; la souche ne promet pas un profil sans phénols.',
    rationale: 'Premier choix liquide pour une Weissbier orientée banane : profil documenté, sans comparaison chiffrée entre marques. Le réglage proposé reste dans la fenêtre étroite du fabricant.',
    primary: [20, 22, 21], finish: [21, 22, 22], balanced: [20, 21, 20],
    notes: [{ text: 'White Labs décrit un effet du taux d’ensemencement et de la température. Aucun nombre de flacons fiable sans connaître leur teneur en cellules et leur viabilité.', source: white }] },
  { id: 'wyeast-3068', name: 'Wyeast 3068 Weihenstephan Weizen', form: 'liquide', aliases: ['3068', 'Wyeast 3068', 'Weihenstephan Weizen'], source: wyeast, temp: [18, 24], attenuation: [73, 77],
    banana: 'Banane documentée ; équilibre modulable par la conduite.', phenols: 'Girofle documenté et susceptible de ressortir quand les esters diminuent.',
    rationale: 'Alternative liquide documentée. Wyeast décrit davantage d’esters avec une fermentation plus chaude ou un taux d’ensemencement réduit. Le programme chaud proposé n’est pas un optimum mesuré.',
    primary: [21, 23, 22], finish: [22, 24, 23], balanced: [19, 21, 20],
    notes: [{ text: 'Prévoir du volume libre pour une fermentation vigoureuse. Wyeast avertit qu’un surensemencement peut fortement réduire la banane ; ne pas réduire les cellules au hasard.', source: wyeast }] },
  { id: 'lallemand-munich-classic', name: 'LalBrew Munich Classic', form: 'sèche', aliases: ['Munich Classic', 'Lallemand Munich Classic', 'LalBrew Munich Classic'], source: munich, temp: [17, 25], attenuation: [76, 83], dose: [50, 100],
    banana: 'Banane et esters marqués dans la documentation Lallemand.', phenols: 'POF+ : le girofle demeure possible, même avec une conduite orientée banane.',
    rationale: 'Option sèche pour privilégier la banane. Lallemand conseille une dose plutôt basse et une température modérée pour éviter d’accentuer aussi le girofle. Rester dans la dose fabricant, à ajuster au moût.',
    primary: [18, 20, 20], finish: [20, 22, 21], balanced: [19, 21, 20],
    notes: [
      { text: 'Le levier documenté est le couple taux d’ensemencement × température. Une température maximale ne signifie pas un meilleur équilibre banane/girofle.', source: flavor },
      { text: 'La fiche annonce une fermentation possible en quatre jours à 20 °C dans son moût standard. Ce résultat de laboratoire ne fixe pas la durée de ta bière.', source: munich }
    ] },
  { id: 'fermentis-w68', name: 'Fermentis SafAle W-68', form: 'sèche', aliases: ['W-68', 'W68', 'SafAle W-68', 'Fermentis W-68'], source: fermentis, temp: [18, 26], dose: [50, 80],
    banana: 'Banane et fruits documentés, sans intensité comparative publiée ici.', phenols: 'POF+ : girofle et notes poivrées font partie du profil annoncé.',
    rationale: 'Autre option sèche documentée pour une bière de blé. Le choix de température est une proposition prudente : aucun optimum banane spécifique à W-68 n’est établi par la fiche.',
    primary: [20, 22, 21], finish: [21, 23, 22], balanced: [19, 21, 20],
    notes: [{ text: 'La fenêtre de fermentation et la température autorisée pour le versement direct de la levure sont deux indications différentes. Ce guide utilise la fenêtre de fermentation.', source: fermentis }] }
];
const knowledge = rows.flatMap(r => [
  // Existing 3068 is supplied by the hop solver pack; never create a competing revision.
  ...(r.id === 'wyeast-3068' ? [] : [{ id: r.id, kind: 'yeast', name: r.name, form: r.form, betaLyase: 'unknown', source: r.source }]),
  { id: `fermentation-${r.id}`, kind: 'fermentation', name: `${r.name} · conduite Weissbier`, version: '2026.09.08.1', enabled: true, source: judgment,
    yeastId: r.id, aliases: r.aliases, styles: ['Weissbier', 'Weizen', 'Hefeweizen', 'Dunkelweizen'],
    aroma: { banana: r.banana, phenols: r.phenols, pof: 'positive', source: r.source },
    temperatureC: fact(...r.temp, r.source),
    ...(r.attenuation ? { attenuationPct: fact(...r.attenuation, r.source) } : {}),
    ...(r.dose ? { dryPitchGHL: fact(...r.dose, r.source) } : {}),
    plans: [plan('banana', r.rationale, r.primary, r.finish, r.notes), plan('balanced', 'Point de départ modéré pour rechercher un équilibre banane/girofle. L’équilibre final dépend aussi du moût ; aucun ratio sensoriel n’est garanti.', r.balanced, [20, 22, 21], r.notes)] }
]);
writeFileSync(new URL('../src/data/fermentationGuideBootstrap.json', import.meta.url), JSON.stringify(knowledge, null, 2) + '\n');
console.log(`${rows.length} conduites de levure sourcées générées.`);
