// Composants et outils communs aux écrans (contrat d'un écran : ARCHITECTURE.md). Depuis T11 (#168), BarreStyle, JetonHoublon,
// Pictos, familyTokens, Marques, LigneContexte, Legende, Pont, gestes et nombres vivent dans src/ui/hopIndex/ (une seule copie) ;
// ce fichier garde ce qui tient à la coquille de la maquette (Cadres, Onglets, PiedAnnuler) et réexporte le tout.
export { BarreStyle, type Echelle } from '@app/ui/hopIndex/BarreStyle';
export { CadreOutil, CadreRecette, Feuille } from './Cadres';
export { COULEURS, COURT, ROUE, FAMILIES } from '@app/ui/hopIndex/familyTokens';
export { useAppuiLong, DUREE_APPUI_LONG } from '@app/ui/hopIndex/gestes';
export { Alpha, JetonHoublon } from '@app/ui/hopIndex/JetonHoublon';
export { Legende } from '@app/ui/hopIndex/Legende';
export { LigneContexte } from '@app/ui/hopIndex/LigneContexte';
export { Onglets, type Onglet } from './Onglets';
export { Inconnu, Simule } from '@app/ui/hopIndex/Marques';
export { nombre, plage, signe } from '@app/ui/hopIndex/nombres';
export { JeuPictos, Picto } from '@app/ui/hopIndex/Pictos';
export { Dock, Pont } from '@app/ui/hopIndex/Pont';
export { PiedAnnuler } from './PiedAnnuler';
// Composants de l'app, à employer quand ils conviennent (importés, jamais recopiés).
export { SegmentedControl } from '@app/ui/SegmentedControl';
export { RecipeDisclosure } from '@app/ui/RecipeDisclosure';
export { RadarBase, chiffreRadar, ORANGE_HORS, type RadarBaseProps, type SerieRadar as SerieRadarBase, type RoleSerie } from './RadarBase';
