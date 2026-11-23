// Voie f5-ajouter-corrige (D107, P6) : la réputation des houblons, style par style, pour confronter la règle d'« Ajouter » (L14).
// SOURCE : savoir de brasseur, écrit AVANT de regarder un classement (les rangs n'ont pas servi à la choisir) : les houblons que les
// guides de style (BJCP 2021, rubriques « ingrédients caractéristiques » et « commentaires ») et la pratique des brasseurs citent pour le style.
// C'est un jugement de métier, pas une mesure : le brasseur le corrige (SPEC-BRASSEUR) ; la table ne sert qu'à voir si la règle les sort de la masse.
// Les identifiants sont ceux du catalogue plein (505) ; une variété absente du catalogue fait échouer le test (pas de phare imaginaire).
const EKG = 'beermaverick-east-kent-goldings', FUGGLE = 'beermaverick-fuggle', TARGET = 'beermaverick-target', CHALLENGER = 'beermaverick-challenger';
const NORTHDOWN = 'beermaverick-northdown', NB_GR = 'beermaverick-northern-brewer-gr', COLUMBUS = 'beermaverick-columbus';
const CASCADE = 'beermaverick-cascade', CENTENNIAL = 'beermaverick-centennial', CHINOOK = 'beermaverick-chinook', WILLAMETTE = 'beermaverick-willamette';
const SAAZ = 'beermaverick-saaz-cz', HALLERTAU = 'beermaverick-hallertau-mittelfruh', TETTNANGER = 'beermaverick-tettnanger', SPALT = 'beermaverick-spalt';
const PERLE = 'beermaverick-perle-gr', HERSBRUCKER = 'beermaverick-hersbrucker', STYRIAN = 'beermaverick-styrian-golding', PREMIANT = 'beermaverick-premiant';
const MOSAIC = 'beermaverick-mosaic', CITRA = 'beermaverick-citra', SIMCOE = 'beermaverick-simcoe', AMARILLO = 'beermaverick-amarillo', GALAXY = 'beermaverick-galaxy';
const AZACCA = 'beermaverick-azacca', EL_DORADO = 'beermaverick-el-dorado', NELSON = 'beermaverick-nelson-sauvin';

export const PHARES_PAR_STYLE: Record<string, string[]> = {
  '15B': [EKG, FUGGLE, TARGET, CHALLENGER],
  '15C': [EKG, FUGGLE, TARGET, CHALLENGER],
  '16A': [EKG, FUGGLE, TARGET, CHALLENGER],
  '16B': [EKG, FUGGLE, TARGET, CHALLENGER],
  '16C': [EKG, FUGGLE, SAAZ],
  '16D': [EKG, FUGGLE, TARGET, CHALLENGER],
  '20B': [CASCADE, CENTENNIAL, COLUMBUS, CHINOOK],
  '20C': [COLUMBUS, NB_GR, CHALLENGER, EKG, FUGGLE],
  '20A': [CASCADE, CENTENNIAL, WILLAMETTE],
  '13C': [EKG, FUGGLE, CHALLENGER, TARGET],
  '9C': [SAAZ, HALLERTAU, TETTNANGER],
  '1A': [HALLERTAU, SAAZ, CASCADE, WILLAMETTE],
  '3A': [SAAZ, PREMIANT],
  '3B': [SAAZ, PREMIANT],
  '4A': [HALLERTAU, TETTNANGER, SPALT, SAAZ, PERLE],
  '5B': [HALLERTAU, TETTNANGER, SPALT, HERSBRUCKER],
  '5D': [HALLERTAU, TETTNANGER, SPALT, SAAZ, PERLE],
  '7B': [SPALT, HALLERTAU, TETTNANGER, PERLE],
  '10A': [HALLERTAU, TETTNANGER, HERSBRUCKER, SPALT],
  '24A': [SAAZ, STYRIAN, HALLERTAU, TETTNANGER],
  '23A': [HALLERTAU, TETTNANGER, SAAZ],
  '23G': [HALLERTAU, SAAZ, TETTNANGER],
  '21A': [MOSAIC, CITRA, SIMCOE, CENTENNIAL, CASCADE, AMARILLO],
  '21C': [CITRA, MOSAIC, GALAXY, SIMCOE, AZACCA, EL_DORADO, NELSON],
  '22A': [CITRA, SIMCOE, MOSAIC, COLUMBUS, AMARILLO, CENTENNIAL, CHINOOK],
  '12C': [EKG, FUGGLE, CHALLENGER, TARGET, NORTHDOWN],
  '18B': [CASCADE, CENTENNIAL, CITRA, AMARILLO, SIMCOE, MOSAIC],
  '11B': [EKG, FUGGLE, CHALLENGER, TARGET, NORTHDOWN],
  '25B': [SAAZ, STYRIAN, EKG, HALLERTAU, TETTNANGER],
  '26C': [SAAZ, STYRIAN, HALLERTAU, TETTNANGER],
  '25A': [SAAZ, STYRIAN, HALLERTAU, EKG],
};
