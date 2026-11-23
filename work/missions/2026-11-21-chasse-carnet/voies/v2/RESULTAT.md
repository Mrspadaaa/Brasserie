OK partiel — CRP-1 (maillons 2 et 3), CRP-2 (lecture), CRB-9, CRB-10, CRW-3, CRN-ONGLET-RETOUR corrigés ; CRW-4 écarté (non reproduit) ; CRU-3a NON corrigé (conflit avec D383, décision demandée)

Code : port-carnet, commit 5be8fe00a (branche claude/port-carnet-1711). Contrôles : `tests/unit/carnetsChasseV2.test.tsx` (7 tests, 6 rouges sur en-ligne/2026-11-21-tour8, verts sur l'arbre ; les 2 verts des deux côtés sont les gardes « nom inchangé » et « prix connu inchangé ») ; banc `V2-CRU-3a-creation` et `V2-CRN-ONGLET-RETOUR` (le second KO sur tour8, OK sur l'arbre). 55 fichiers `tests/unit/carnets*` verts, tsc propre.

## État de l'art
- Décodage des entités (CRP-2, à la lecture) : DOMParser du navigateur (jsdom en test), `<` protégé ; aucun paquet ni regex d'entités ; côté serveur V1 a déjà décidé cheerio.
- Prix : règle V1 `prixLocalise` côté serveur ; côté client `prixLus` (modele.ts) existant ; le prix d'une ligne ne vient que de la page de CETTE ligne (lue, devise présente, > 0), jamais 0.
- Date du plan (CRW-3) : arithmétique de dates UTC native (1er du mois + 3 mois), sans bibliothèque.

## Faits
- `Article.prixDes?: true` ajouté (optionnel, additif). firestore.rules.template : les carnets sont des `creativeItems` dans la règle générique `/{collection}/{docId}` sans liste de champs : aucun refus de champ inconnu. `lireArticle` le garde seulement avec un prix.
- CRP-2 et CRB-9 normalisés à la lecture (`lireCarnet`) : rien n'est réécrit ; nom sans « <titre du carnet> - », entités décodées, « Couleur : » sans deux-points.
- CRW-3 : plan sans prix daté `AAAA-MM-01` (+3 mois), `budgetKnown:false`, `stage:'research'`, montant 0 en stockage (règle d'À venir inchangée). Le plan reste `draft` : pas au calendrier avant d'être posé (`active`).
- CRW-4 : aucun geste n'édite le prix d'un article (D6) ; non reproduit.
- CRB-10 : la carte dit déjà « dès » du plus bas prix d'article ; elle le montre dès que les prix arrivent ; la fourchette « 2 400 à 3 100 » reste D3.
- CRN-ONGLET-RETOUR : prop `racine` de CarnetsVue, posée par l'onglet actif « Carnet » (AtelierPorte) et le segment actif « Carnets » (StocksTab). Le texte du champ reste. Une note en modification n'est pas défaite : le toucher ne fait alors rien.
- Le correctif serveur de CRP-1 (lireLien) reste soumis à l'accord A1 (déploiement).

## DÉCISION À PRENDRE : CRU-3a contre D383
Cause trouvée : `CarnetsVue.ecrireIA`, branche `cree` : quand l'IA range TOUTES ses lignes dans un carnet connu, l'idée n'est pas reprise et le carnet créé (resté vide) est retiré : compteur 17 → 16, titre « Test eauds » remplacé par « Eau ». Le garder (idée toujours reprise quand la fiche est déjà ouverte) était le correctif voulu par CRN-CREATION-VUE. Je l'ai écrit, puis retiré : il fait échouer deux tests qui encodent un choix validé au test en ligne 2 (D383, bloquants 3 et 4) : `carnetsEnLigne2` n° 3 (« doit tenir 80 °C » depuis la liste va dans Pompe, aucun carnet neuf) et `carnetsCorrection3Fil` P8 (même phrase : l'article va dans Ventilation, aucun carnet neuf). Les deux concernent le même chemin (création depuis la liste, IA qui range ailleurs). À trancher : (a) D383 prime, la plainte est une proposition de titre ; (b) le carnet créé reste toujours ; (c) il reste seulement si la phrase est un objet neuf (pas de discriminateur sûr trouvé). Patch prêt : dans la branche `cree`, `tenu = attente.current?.messageId === messageId && attente.current.montre` puis `[ ...(tenu || ici.length || …) ]`. Le banc simulé ne range pas ailleurs : il ne reproduit pas le symptôme (la fiche s'ouvre aussitôt, +1, stable 8 s : vert des deux côtés).
