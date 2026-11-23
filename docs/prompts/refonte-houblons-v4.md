# Houblons V4 — concevoir depuis la décision et le mobile

## Mandat du 29 septembre 2026

**Précision utilisateur prioritaire :** « La simplicité mobile n'est pas un vrai
critère. Ça doit être compréhensible sur mobile, pas forcément simple, ça doit
être simple dans le cas d'usage simple. » Mobile first =compréhension et maîtrise
du parcours. Le cas complexe peut être riche, dense, expliqué et en plusieurs
étapes si cela aide à décider. Aucun objectif universel de peu de champs,
d'écrans, de clics ou de texte ; aucune suppression d'information utile pour
épurer. Le bureau adapte cette expérience conçue sur mobile.

**Portée intégrale :** toutes les questions d'origine et leurs propriétés doivent
être prises en charge dans CHAQUE proposition. La première tranche est un contrôle
précoce de conception, jamais une réduction du résultat final. Le registreV4 relie
chaque illustration au résultat attendu, parcours, preuve réelle et travail
restant ; plusieurs lignes peuvent partager un parcours par propriétés, aucun
preset/écran/test par style ou nom. Reconnaissance de question, mention de famille
ou promesse de fonction future ne suffisent pas. Une limite réelle explique
pourquoi et mène à une prochaine action utile, sans prédiction impossible.

Reprendre la conception dans le même Sol `01a0e901-4b25-71c3-8a54-81fd649c9f51`.
La V3 et ses corrections05 sont conservées comme acquis bornés ; leur organisation
n'est pas une base imposée. La V2 a été réveillée explicitement et poursuit ses
quatre maquettes dans son propre fil. Ne pas l'arrêter au motif de ce relais.

Le résultat reste TROIS propositions audacieuses et réellement différentes,
chacune très pratique pour l'usage quotidien ET capable d'une exploration riche
et compréhensible sur mobile, sans règle générale de minimalisme.
La première tranche doit prouver ce double usage sur mobile avant que le travail
soit étendu aux trois propositions et au desktop. Pas de quatrième application
technique, de nouveau Sol, ni de reprise de tous les audits.

Source complète des besoins et exemples : les sections Promesse produit,
Exemples utilisateur et Besoins généraux de `refonte-houblons-v3.md`, plus le
présent mandat qui prime sur ses anciennes décisions d'organisation. Les exemples
ne sont ni des options obligatoires, ni une liste fermée, ni des règles par nom.

## Ce qui a échoué dans l'acceptation précédente

Les briefs V3 contenaient déjà mobile first et l'usage quotidien + exploratoire.
Les livraisons et revues ont ensuite privilégié la différence des grammaires,
les opérations de données et leur qualification. Modifier une dose, vider une
quantité de forme incompatible, régler une température et annuler correctement
ne prouvent pas qu'une personne comprend quelle stratégie choisir pour sa bière.
Des vues390 sans débordement ne prouvent pas une bonne expérience mobile.

Ces contrôles restent utiles, mais ne peuvent plus tenir lieu d'acceptation
produit. Le contrôleur a trop longtemps relayé la couverture des gestes et les
avis favorables. La V4 doit changer cette décision de validation, pas seulement
les titres, les espacements ou le nombre de champs.

## Expérience attendue dans CHAQUE proposition

Quand le brasseur connaît son choix, il trouve sa recette et agit directement :
choisir/remplacer un produit, doser, changer le moment, corriger. Pas de discussion,
objectif, dossier documentaire ou confirmation d'essai obligatoire pour ce geste.

Quand il cherche une solution, l'expérience l'aide à exprimer le résultat souhaité,
ce qu'il veut éviter et ce qu'il veut conserver, en utilisant les informations
déjà connues de la recette. Elle propose plusieurs stratégies compréhensibles,
pas seulement plusieurs noms de houblons. Elle montre les changements pertinents,
les gains/contreparties et leurs raisons dans CE contexte ; le brasseur compare,
ajuste, choisit, applique volontairement et retrouve sa recette sans perdre le fil.

Leviers possibles : produit/forme/lot disponible, mélange, quantité, emploi,
température/contact, levure/conduite, stade réel et contraintes matérielles.
Ces leviers ne sont pas une liste de champs à afficher simultanément. L'aide peut
être visuelle, contextuelle ou exprimée en langage naturel ; aucune entrée unique
n'est imposée. L'architecture ne se déduit pas automatiquement des objets de données.

La conception couvre les familles suivantes par propriétés : affiner ; remplacer
ou trouver une alternative disponible ; composer un profil avec exclusions ;
arbitrer produit/forme/procédé ; articuler la fermentation ; corriger selon le stade.
Les interactions entre familles comptent. Une catégorie ou un bouton par famille
ne prouve pas sa couverture. NOLO, sours, houblon maison, profils personnels et
contextes inconnus restent dans le domaine sans architecture dédiée à chaque exemple.

## Liberté et fidélité des maquettes

Le moteur futur et les composants actuels ne limitent pas les expériences à
concevoir. Des réponses et comparaisons scénarisées clairement identifiées peuvent
montrer une capacité future. Écrire assez de contenu concret pour juger le choix,
sans chiffres sensoriels inventés ni recommandations présentées comme validées.
Les faits sourcés, hypothèses de démonstration, effets connus et inconnus restent
distincts ; la qualification doit être utile à la décision, pas envahir l'écran.
Une incertitude mène à une prochaine action pertinente, pas toujours à un formulaire.

Employer des représentations qui rendent visibles les relations et compromis,
au-delà de mentions documentaires ou de longs paragraphes. Aucun graphique ni outil
n'est obligatoire. Bibliothèques, solutions tierces et méthodes UX sont ouvertes
si elles aident réellement ; leur nombre n'est pas un objectif.

Préserver valeurs, unités, sources, informations utiles, hors ligne et possibilités.
Ne pas confondre g/L, IBU, caractères documentés et effet sensoriel dans la bière.
Simulation, recette enregistrée et brassin lancé restent distincts au moment où
ces distinctions changent l'action ; pas d'inventaire permanent de tous les états.

## Preuve avant extension et polissage

1. Concevoir d'abord sur téléphone. Explorer brièvement trois partis différents
   par hiérarchie et gestes, sans développer trois applications complètes.
2. Éprouver une tranche mobile complète sur le même projet de recette : modification
   courante connue, puis besoin composé (objectif + exclusion + contrainte réelle +
   dépendance pertinente), options, compréhension des compromis, choix, application,
   retour et correction. Ne pas ajouter de friction au chemin courant pour servir
   le chemin avancé. La démonstration doit contenir de vraies raisons de choisir.
3. Confronter les premiers rendus et ce parcours à la demande AVANT extension.
   Vérifier une variation hors des noms initiaux et une information décisive absente,
   sans matrice exhaustive. Garder la compréhension humaine explicitement ouverte
   tant qu'elle n'a pas été confrontée à l'utilisateur ; ne pas la déduire des tests.
4. Développer les autres propositions et le desktop à partir de ce résultat,
   en conservant leurs différences. Rien n'impose Comptoir, Partition ou Équilibre.

Refuser le jalon si l'on sait seulement modifier des champs ; si les options
n'expliquent pas les choix dans la recette ; si l'usage quotidien est noyé dans
l'expertise ; si le mobile est une grille desktop comprimée ; ou si le modèle
absent sert d'excuse à l'absence du parcours dans la maquette. Rendre les essais
de saisie/clavier, retour et correction observables ; distinguer émulation et
téléphone physique. Réutiliser les preuves techniques qui restent applicables.

## Organisation, reprise et périmètre

Sol reste pilote. Réutiliser la même consultation Astra pour la question
structurante : pourquoi la preuve de décision manque, quels choix de conception
peuvent la fournir et quels résultats les réfuteraient. Récupérer l'avis ciblé déjà
demandé plutôt que relancer un audit. Un avis écrit n'est pas la preuve du rendu.

Claude reste contributeur créatif en amont, avec le mandat complet et liberté
de remettre en cause les propositions. Lot cohérent, premières sorties récupérables,
puis correction motivée ; pas de régénération de trois apps. Luna reçoit seulement
des livrables indépendants utiles. Un seul Claude Pro à la fois, coordonné avec V2.

**Responsabilité créative renforcée, préférence utilisateur29/09 :** Claude
explore les TROIS propositions avec liberté, construit la première tranche
mobile complète, puis réalise les autres et les reprises de conception utiles
issues des retours. Davantage d'usage signifie cette responsabilité, pas un
nombre d'appels. Astra cadre décisions métier/invariants et examine les résultats,
sans figer des interfaces à transcrire. Sol prépare, intègre, vérifie et raccorde
ce qui est déterminé ; il ne reprend pas seul l'essentiel créatif pour éviter
un tour Claude.

**Suivi Astra sur preuves :** dans le registre existant, relier chaque avis
matériel à question/exigence, décision Sol, modification ou motif d'écartement,
rendu/parcours actuel et réserve restante. Réutiliser le même Astra au premier
vrai parcours mobile AVANT extension et sur correction matérielle qui change la
décision, jamais après chaque détail. Demande et artefacts avant récit/ancien
verdict ; reçu/retenu/tests verts ne clôturent pas. Requalifier les anciens avis
trop favorables, éviter un verdict globalOK qui masque les limites.
Les deux fils ont partagé une session native : contextualiser chaque mandat et
séparer les copies. Si Claude nécessaire est bloqué, conserver et attendre une
reprise unique au reset fiable ; aucun remplacement caché ou API agent facturée.

Propriété Sol : ce brief, `docs/validation/houblons-v4-2026-09-29.md` et
`work/houblons-v4-2026-09-29/`. Conserver les V3/05 avant arrêt de leur polissage.
Les données, sources, invariants, undo/save et conclusions utiles sont réutilisables,
sans recopier leur architecture visuelle. Les fichiers V2 restent à son propriétaire.
Le contrôleur garde son unique état `work/houblons-v3-2026-09-28/agent-checks.json`,
mis à jour pour cette phaseV4, et sa cadence3h ; ne créer aucun suivi parallèle.

Aucun changement de branche, fichier produit partagé, donnée réelle, IAM/Auth
ou déploiement implicite. Conserver les décisions et limites d'accès distant.
La réalisation scientifique et l'intégration de production viennent après la
convergence visuelle, sur la vraie version combinée Levure + Performance.
