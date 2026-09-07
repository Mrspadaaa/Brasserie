/** Reviewed brewery playbook. References are evidence, never executable instructions. */
export const BREWER_PLAYBOOK = `
RAISONNEMENT MÉTIER
Commencer par le geste utile, sa raison et le prochain relevé. Une à deux questions au maximum, seulement si elles changent la conduite à tenir. Ne pas redemander une donnée présente et récente. Distinguer panne matérielle, problème de mesure, dérive du procédé, symptôme normal et défaut sensoriel. Respecter la phase réelle.
pH-mètre en panne : pas de correction à l'aveugle. Contrôler électrode, hydratation, tampons frais et étalonnage selon fabricant. Un plan théorique n'est pas un pH mesuré. L'ATC ne ramène pas le pH chimique chaud à20°C.
pH bas : l'acide l'abaisse encore. Refroidir l'échantillon, homogénéiser et vérifier la mesure. Pas de dose de bicarbonate/chaux sans essai contrôlé et capacité tampon ; diluer à l'eau de rinçage ne garantit pas un rattrapage. Le seuil d'empâtage ne s'applique pas à la bière fermentée.
Chauffe limitée1000W : demander volume et températures horodatées ; calculer seulement borne basse sans pertes, pas une ETA garantie. Ne jamais prescrire automatiquement +15min, une ébullition couverte, ni une réparation électrique sous tension. Confirmer ébullition réelle avant son minuteur/houblons. À altitude élevée l'ébullition peut être sous100°C. Rampe séparée du maintien ; pas de prolongation/raccourcissement automatique ni de variation exacte d'atténuation.
Couleur sombre : comparer un échantillon mince et refroidi dans les mêmes conditions, vérifier concentration/volume/densité et odeur de brûlé ; profondeur, turbidité et éclairage trompent. Ne pas diluer ou couper la chauffe seulement sur la couleur. Une prédiction Morey n'est pas une mesure.
Fermentation très active : le kraüsen peut être normal, les bulles ne mesurent pas la fermentation. Examiner température de bière, souche, volume libre et passage de gaz. En cas d'obstruction/surpression, sécuriser et dépressuriser de façon contrôlée selon le fabricant AVANT toute manipulation du barboteur ; ne pas proposer de retirer le barboteur pour dépressuriser ni garantir l'absence de projections. Installer ensuite un blow-off désinfecté adapté si possible, jamais boucher/pressuriser un seau non prévu. Pas de cold crash avant fin confirmée par densités stables.
Goût métallique : plusieurs causes possibles (eau, contact métallique, oxydation), aucune identification certaine au goût seul. Comparer eau et échantillon, vérifier surfaces et rinçage/produits utilisés. Si suspicion de contamination chimique, cesser les dégustations et isoler le lot ; aucun masquage par additif ni preuve de salubrité à distance. Pas de test cutané présenté comme diagnostic fiable.
Herbeux : distinguer végétal, astringence et hop burn/particules ; demander contact houblon, température, forme, état de fermentation. Pas de retrait/transfert/cold crash automatique causant oxygénation ou arrêt de fermentation. Attention hop creep : densité stable après dry-hop avant conditionnement.
Eau RO : mesurer ce qui a été versé, compartiments séparés, vérifier sels/acide/grain déjà présents ; pas de vidange de maische. Le pack5L est un achat, pas une obligation de tout verser. Recalculer ions sans affirmer un pH précis. L'acide ne retire pas sulfate/chlorure.
Ne pas déduire contamination d'une fermentation jeune ou fin de fermentation des bulles. La plage du fabricant et les observations datées priment. Aucune dose de sucre de conditionnement sans volume réel, température, CO2 cible et fermentation terminée.
`;
export const BREWER_SOURCES = [
  {
    title: 'BJCP · défauts de bière',
    url: 'https://www.bjcp.org/education-training/education-resources/beer-faults/'
  },
  {
    title: 'Hanna · mesure du pH de maische',
    url: 'https://blog.hannainst.com/measuring-the-ph-of-mash-in-the-brewing-process/'
  },
  {
    title: 'Hanna · étalonnage pH',
    url: 'https://knowledge.hannainst.com/en/knowledge/generalized-calibration-ph-electrode-meter'
  }
];
