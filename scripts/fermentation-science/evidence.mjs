import { sources as s } from './sources.mjs';
import { phenolStudy } from './cui-2015.mjs';
const range=(min,max)=>({min,max});
const all=['banana','balanced','fruit','clean','phenolic','thiols'];
const lever=(id,goals,yeastIds,control,phase,effect,title,explanation,action,limitation,source,confidence='medium')=>({id,goals,yeastIds,control,phase,effect,title,explanation,action,limitation,source,confidence});
const compound=(id,name,family,aromas,formation,caution,source)=>({id,name,family,aromas,formation,caution,source});
export const science={
 id:'fermentation-science',kind:'fermentationScience',name:'Fermentation : arômes, conduite et preuves',version:'2026.09.08.1',enabled:true,source:s.editorial,
 goals:[
  {id:'banana',aliases:['banane','weissbier banane','banana','acétate d’isoamyle'],description:'Choisir une souche productrice d’ester banane ; distinguer la banane avec ou sans girofle.'},
  {id:'balanced',aliases:['weissbier','weizen','équilibre','banane girofle'],description:'Travailler l’équilibre perçu entre esters et phénols dans une bière de blé.'},
  {id:'fruit',aliases:['fruité','pêche','abricot','poire','esters','belge','orange'],description:'Partir du fruit décrit pour la souche ; plus chaud ne fait pas monter tous les esters ensemble.'},
  {id:'clean',aliases:['propre','net','neutre','lager','pils','discret'],description:'Rechercher une fermentation discrète et suivre la maturation.'},
  {id:'phenolic',aliases:['girofle','phénol','4vg','4-vinylgaïacol','épicé','poivre','saison'],description:'Relier potentiel POF, précurseurs du moût et perception du mélange.'},
  {id:'thiols',aliases:['thiol','thiols','tropical','3sh','3sha','biotransformation','passion','tyol'],description:'Conserver houblon × levure × moment ; libération chimique et fruité perçu restent distincts.'}
 ],
 compounds:[
  compound('isoamyl-acetate','Acétate d’isoamyle','Ester acétate',['banane','poire'],'Les acétyltransférases, dont Atf1, participent à la formation de cet ester.','Alcool isoamylique, ester, expression du gène et intensité banane sont différents.',s.atf),
  compound('ethyl-esters','Esters éthyliques','Esters',['fruité','pomme','fruits tropicaux'],'Plusieurs produits du métabolisme fermentaire répondent différemment à la température et aux acides gras.','Aucune correction commune par degré Celsius.',s.esters),
  compound('4vg','4-vinylgaïacol (4VG)','Phénol volatil',['girofle','épices'],'La voie PAD1/FDC1 permet la conversion de l’acide férulique chez les souches capables.','POF− ne constitue pas une analyse de tous les phénols de la bière.',s.pof),
  compound('4vp','4-vinylphénol (4VP)','Phénol volatil',['phénolique','médicinal'],'Formation liée aux précurseurs hydroxycinnamiques du moût et à la fermentation.','Ne pas fusionner 4VP et 4VG en une concentration de girofle.',s.cui),
  compound('diacetyl','Diacétyle et α-acétolactate','Dicétone vicinale (VDK)',['beurre','caramel au beurre'],'Le précurseur peut former du diacétyle dans la bière ; la levure active le réduit ensuite.','Densité finale atteinte ne signifie pas maturation achevée.',s.vdk),
  compound('acetaldehyde','Acétaldéhyde','Aldéhyde',['pomme verte'],'Intermédiaire du métabolisme fermentaire, dépendant du procédé et de la maturation.','Les modèles industriels consultés ne s’appliquent pas à toute souche.',s.aldehydes),
  compound('h2s','Sulfure d’hydrogène (H₂S)','Soufré volatil',['œuf','soufre'],'Production et rétention dépendent de la souche et de la conduite.','Chauffer ne garantit pas le même effet entre levures.',s.h2s),
  compound('dms','Sulfure de diméthyle (DMS)','Soufré volatil',['maïs cuit','légume'],'Le malt et les étapes chaudes contribuent aux précurseurs ; la fermentation intervient aussi.','Ne pas attribuer tout le DMS à la levure.',s.lagering),
  compound('fusel','Alcools supérieurs','Alcools',['chaleur alcoolique','solvant'],'Produits du métabolisme carboné et azoté, avec des réponses différentes selon l’alcool et la souche.','Davantage de stress ne garantit pas davantage d’esters fruités.',s.erten),
  compound('3sh','3SH (ancien 3MH)','Thiol',['pamplemousse','passion'],'Transfert libre et libération depuis plusieurs précurseurs conjugués, selon les étapes du brassage.','Cys, CysGly, γGluCys et GSH restent séparés ; aucun rendement générique déduit.',s.thiol2026),
  compound('3sha','3SHA (ancien 3MHA)','Thiol estérifié',['passion','goyave'],'Le 3SH peut être acétylé par la levure ; les profils alcool/acetate diffèrent entre souches.','Ni ATF1 ni le 3SH disponible ne donnent une fraction convertie universelle.',s.acetate),
  compound('lactones','γ- et δ-lactones','Esters cycliques',['pêche','abricot','coco'],'Présentes dans la bière ; leur combinaison avec d’autres composés peut modifier le fruité.','Le descripteur pêche ne mesure pas une lactone ; un seuil dans l’eau ne vaut pas pour la bière.',s.lactone)
 ],
 levers:[
  lever('banana-3068',['banana','balanced'],['wyeast-3068'],'temperature','growth','promote','3068 : agir pendant la fermentation active','Wyeast décrit davantage d’esters à température plus élevée ; le girofle peut ressortir lorsque les esters diminuent.','Choisir le compromis dès l’ensemencement dans la fenêtre de la souche.','Le repos chaud final ne garantit pas davantage de banane ; aucun gain par degré établi.',s.wyeast),
  lever('banana-munich',['banana','balanced'],['lallemand-munich-classic'],'pitch','growth','mixed','Munich Classic : dose et température ensemble','Lallemand propose une dose plutôt basse et une température modérée pour privilégier la banane sans pousser aussi le girofle.','Rester dans la dose fabricant ; vérifier densité, fraîcheur et viabilité avant de réduire le pitch.','Ne pas généraliser cette conduite à toutes les levures de blé.',s.flavor),
  lever('banana-no-clove',['banana'],['yeast-omega-9188919542014'],'strain','preparation','promote','Bananza : banane documentée avec POF−','Omega a retiré l’expression phénolique de sa souche de type Hefeweizen.','Comparer cette option si le girofle est indésirable.','Fiche fabricant et souche modifiée ; aucun classement sensoriel indépendant entre marques ici.',s.bananza),
  lever('esters-heat',['fruit','banana','clean'],[],'temperature','growth','mixed','Les esters ne montent pas tous ensemble','L’essai SS01 donne des réponses thermiques différentes selon l’ester éthylique.','Partir des observations propres à la souche et au fruit recherché.','SS01 n’est pas ta souche par défaut ; aucune pente universelle température → fruité.',s.esters),
  lever('pressure-banana',['banana'],[],'pressure','growth','reduce','La contre-pression peut freiner la banane','Le CO₂ agit sur le rapport ester/alcool de manière dépendante de la souche.','Pour explorer la banane, privilégier une fermentation sans contre-pression volontaire si le procédé le permet.','Aucun coefficient par levure disponible ; pression relative et absolue distinctes.',s.pressure),
  lever('oxygen-esters',['banana','fruit','clean'],[],'oxygen','preparation','mixed','Oxygène : santé de la levure et esters','L’aération et les acides gras insaturés interviennent dans la régulation d’ATF1.','Adapter l’oxygénation initiale au produit et au réensemencement selon la fiche fabricant.','Le mécanisme ne justifie ni carence volontaire ni oxygénation tardive généralisée.',s.atf),
  lever('pitch-context',all,[],'pitch','preparation','mixed','Le pitch n’a pas un effet aromatique universel','Les études de lager ne donnent pas toutes le même sens d’effet sur l’acétate d’isoamyle.','Utiliser la dose documentée puis comparer des essais sur le même moût.','NCYC 1056 de l’étude est une lager, sans équivalence supposée avec Wyeast 1056.',s.erten),
  lever('ferulic',['phenolic','balanced','banana'],[],'mash','preparation','mixed','Le girofle commence aussi à l’empâtage','La disponibilité d’acide férulique et la capacité de la levure sont deux conditions distinctes.','Pour le girofle, vérifier POF+ et l’empâtage ; pour la banane, ne pas renforcer ce précurseur par défaut.','Le pourcentage de blé seul ne prédit pas le 4VG final.',s.ferulic),
  lever('pof-capacity',['phenolic','balanced'],[],'strain','preparation','monitor','Vérifier POF avant de viser le girofle','POF− n’est pas une bonne piste pour développer la voie levurienne du 4VG.','Choisir une souche documentée POF+ pour cette voie.','POF, caractère diastatique et libération des thiols sont trois propriétés distinctes.',s.pof),
  lever('voss-speed',['fruit','clean'],['lalbrew-voss'],'temperature','active','mixed','Voss : surtout un changement de vitesse','Le fabricant décrit un profil relativement constant orange/agrumes sur sa fenêtre thermique.','Choisir selon le matériel et le délai, puis suivre la densité.','Les trois repères de durée ne forment pas une loi cinétique validée.',s.voss),
  lever('abbaye-fruit',['fruit','phenolic'],['lalbrew-abbaye'],'temperature','growth','mixed','Abbaye : fruits secs ou registre tropical','La fiche relie bas de fenêtre aux fruits secs et haut aux notes tropicales et épicées.','Comparer des températures dans la fenêtre sur un moût constant.','Aucune frontière thermique ni amplitude sensorielle publiée ; sous-plages proposées par le guide.',s.abbaye),
  lever('saison-finish',['phenolic','fruit'],['lalbrew-belle-saison'],'maturation','finish','monitor','Belle Saison : laisser finir les dextrines','L’activité diastatique peut prolonger la fermentation après la phase principale rapide.','Attendre une densité cohérente et stable avant le conditionnement.','La durée principale fabricant ne fixe pas le jour d’emballage.',s.saison),
  lever('sta1-not-pof',all,[],'strain','preparation','monitor','STA1 : le gène ne suffit pas','Le promoteur peut modifier fortement l’activité diastatique.','Séparer résultat génétique, phénotype déclaré et atténuation mesurée.','Ne déduire ni atténuation maximale ni durée de sécurité du seul gène.',s.sta1),
  lever('lager-rest',['clean'],['yeast-fermentis-saflager-w-34-70'],'maturation','finish','monitor','Préparer le repos à partir de la densité','Le repère est une fraction du chemin vers la DF attendue, pas un pourcentage absolu d’atténuation.','Préparer la hausse pendant que la levure est active puis vérifier les VDK.','La DF du catalogue est incertaine ; les jours seuls ne déclenchent rien.',s.lagering),
  lever('vdk-test',all,[],'maturation','finish','monitor','Densité et diacétyle : deux contrôles','Le précurseur peut former du diacétyle après l’atteinte de la DF.','Contrôler les VDK avec un test forcé ou analytique et prolonger si positif ou incertain.','Une dégustation négative avant conversion du précurseur ne suffit pas.',s.forced),
  lever('dry-hop-reset',['thiols','fruit','clean'],[],'hops','finish','monitor','Recontrôler après un houblonnage à cru','Le hop creep peut relancer atténuation et production de précurseurs du diacétyle.','Reprendre les contrôles densité et VDK après le dernier ajout.','La stabilité précédente ne certifie pas la suite ; ALDC ne bloque pas la refermentation.',s.creep),
  lever('thiol-temp',['thiols'],[],'temperature','active','mixed','Plus de thiols n’est pas toujours plus tropical','L’essai Cascade montre une interaction souche × température et une discordance chimie/perception.','Comparer les combinaisons publiées et rester dans la fenêtre fabricant.','Ne pas conseiller une lager hors fenêtre pour copier un maximum chimique.',s.thiolTemp),
  lever('thiol-nutrition',['thiols','fruit'],[],'nutrition','preparation','mixed','La carence azotée n’est pas un raccourci aromatique','Moins de FAN peut favoriser certains thiols sans plus de tropical et avec une fermentation dégradée.','Établir une nutrition adaptée au moût et à la souche.','Aucune cible FAN unique pour maximiser thiols ou esters.',s.fan),
  lever('thiol-timing',['thiols'],[],'hops','active','mixed','Le moment modifie la libération','Les profils temporels changent avec la souche et le dry hop ; une libération ultérieure reste possible.','Conserver jour, densité et température de chaque ajout.','Ne pas imposer zéro conversion après fermentation ; données brutes non acquises.',s.timecourse,'low'),
  lever('lactones-mixture',['fruit'],[],'strain','preparation','mixed','Pêche et coco : examiner le mélange','Les lactones peuvent modifier le fruité avec des esters et terpènes à faibles teneurs.','Choisir une souche au profil documenté puis comparer la bière dégustée.','Ne convertir ni pêche en lactone ni lipides du grist en gain aromatique supposé.',s.lactone),
  lever('sulfur-context',all,[],'maturation','conditioning','monitor','Soufre : suivre le défaut réel','La réponse du H₂S à la température peut changer entre souches.','Documenter le soufre résiduel et les conditions de maturation.','Pas de délai ni de pente universels à partir du résumé consulté.',s.h2s,'low')
 ],
 benchmarks:[
  ['lalbrew-voss',40,2,2,'Moût standard fabricant ; valeur ponctuelle, dispersion non publiée.',s.voss],
  ['lalbrew-voss',30,3,4,'Moût standard fabricant ; plage déclarée, pas intervalle statistique.',s.voss],
  ['lalbrew-voss',25,5,7,'Moût standard fabricant ; ne pas interpoler une loi universelle.',s.voss],
  ['lalbrew-abbaye',20,4,4,'Moût standard fabricant ; dispersion et maturation non publiées.',s.abbaye],
  ['lalbrew-belle-saison',20,4,10,'Principale environ 4 j puis consommation lente jusqu’à 10 j dans le protocole fabricant ; phases différentes, pas une distribution.',s.saison],
  ['lalbrew-verdant-ipa',20,5,5,'Moût standard fabricant ; pas une garantie de fin de maturation.',s.verdant],
  ['lalbrew-pomona',20,4,5,'Moût standard fabricant à 12 °P ; durée non transférable à une bière forte.',s.pomona]
 ].map(([yeastId,temperatureC,min,max,conditions,source])=>({yeastId,temperatureC,days:range(min,max),conditions,source})),
 lagerRest:{yeastIds:['yeast-fermentis-saflager-w-34-70'],progressPct:range(65,75),riseC:range(2,4),source:s.lagering},
 studies:[
  ['esters',s.esters,'Les esters répondent différemment à la température.','Aucun multiplicateur universel.'],
  ['pitch-conflict',s.pitchConflict,'Des modèles industriels existent dans leur domaine.','Incohérences d’unités et de validation : équation d’acétate d’isoamyle non activée.'],
  ['pof',s.pof,'POF relie précurseur et voie génétique.','Pas de concentration ni de profil total.'],
  ['sta1',s.sta1,'Gène et phénotype diastatique séparés.','Aucune atténuation déduite du seul STA1.'],
  ['thiols-temperature',s.thiolTemp,'Souche × température modifie thiols et perception.','Maximum chimique ≠ meilleur tropical.'],
  ['thiols-nitrogen',s.fan,'Nutrition et souche influencent libération et performance.','Carence non recommandée comme optimisation.'],
  ['thiols-transfer-2026',s.thiol2026,'Précurseurs et étapes de houblonnage distincts.','Contexte incomplet pour transférer les rendements.'],
  ['thiols-timecourse-2026',s.timecourse,'Libération variable dans le temps et avec le dry hop.','Résumé uniquement ; aucune courbe importée depuis une figure.'],
  ['lactones',s.lactone,'De faibles teneurs peuvent participer à l’arôme de mélange.','Un descripteur fabricant n’est pas une concentration.'],
  ['kinetic',s.kinetic,'Modèles dynamiques ajustés sur fermentations mesurées.','Quatre fermentations ne couvrent pas toutes les souches.'],
  ['mpc-2026',s.mpc,'Pilotage prédictif à partir de densité et CO₂ en ligne.','Résumé seulement ; capteurs et identification propres au procédé requis.'],
  ['phenol-local',s.cui,'29 essais permettent un ajustement local avec interactions.','DM303 et protocole d’empâtage couplé ; aucun transfert à 3068 ou WLP300.']
 ].map(([id,source,finding,limitation])=>({id,title:source.title,source,finding,limitation})),
 phenolStudy
};
