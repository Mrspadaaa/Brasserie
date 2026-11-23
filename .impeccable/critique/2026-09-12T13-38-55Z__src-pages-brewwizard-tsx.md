---
target: Création de recette
total_score: 24
max_score: 40
na_heuristics:
p0_count: 0
p1_count: 3
target_identity: "file:C:\\Users\\mrspa\\Documents\\Brasserie\\src\\pages\\BrewWizard.tsx"
target_fingerprint: "sha256:2405a6362578d50702f4e6fa326454416009b6e3a10cc462dceda396e3672821"
target_path: "C:\\Users\\mrspa\\Documents\\Brasserie\\src\\pages\\BrewWizard.tsx"
timestamp: 2026-09-12T13-38-55Z
slug: src-pages-brewwizard-tsx
closed: true
---
# Revue frontend — création de recette

**Statut après correction — 12 septembre 2026 : tous les constats ci-dessous sont traités et revérifiés.** Voir le [compte rendu des corrections et les captures finales](C:/Users/mrspa/Documents/Brasserie/docs/review-creation-recette-2026-09-12.md). Les notes, priorités et preuves ci-dessous décrivent l’état initial ; elles restent conservées comme historique de la revue. La commande Impeccable de clôture échoue sans diagnostic dans cette installation Windows ; cette clôture documentaire ne prétend pas modifier son état interne.

12 septembre 2026 · L’Affinée · état courant du dépôt · revue sans modification du code applicatif.

La création couvre bien les décisions du brasseur et possède une base compacte cohérente. Trois défauts sont prioritaires : une recette invalide peut être enregistrée, une fermeture perd le brouillon et les manques de stock disparaissent lorsque leur section est fermée. La hiérarchie de l’étape Houblons, la navigation mobile et le focus clavier demandent ensuite une correction ciblée.

Référentiel : [PRODUCT.md](C:/Users/mrspa/Documents/Brasserie/PRODUCT.md), [DESIGN.md](C:/Users/mrspa/Documents/Brasserie/DESIGN.md), [docs/ui-compacte.md](C:/Users/mrspa/Documents/Brasserie/docs/ui-compacte.md). La priorité est la densité utile sur téléphone, avec valeurs, unités, erreurs et accès clavier conservés. Les commandes compactes du projet sont le critère ; aucun minimum générique de 44/48 px n’a été appliqué.

Méthode : revue indépendante de design et revue technique, puis synthèse contradictoire et parcours d’intégration. Skills utilisés : impeccable/critique, ui-design-system, senior-frontend, a11y-audit, frontend-testing-debugging et Unlazy. Outils : application réellement ouverte, interactions cua_repl, captures examinées, arbre d’accessibilité, mesures du rendu et détecteur Impeccable. Les composants applicatifs courants ont été construits avec les adaptateurs QA existants et des données locales isolées ; aucune écriture de production.

**Priorités à corriger**

**R1 · P1 — L’enregistrement accepte un nom absent et un volume effacé devenu 0 L.** Deux cas ont été menés jusqu’à la persistance dans le catalogue local. Nouvelle recette sans nom → rail Récapitulatif → Enregistrer : notification « Recette « » enregistrée. » et carte sans nom. Autre recette : sélectionner tout le volume, Backspace, Tab → le champ affiche 0 sans erreur → Récapitulatif → Enregistrer : carte « Revue volume effacé », 0 L. Le contrôle possède pourtant `min={1}`. La revue indépendante a aussi reproduit un palier à 0 °C après effacement et le passage par Ctrl+Entrée malgré le bouton de poursuite désactivé.

Sources : [BrewWizard.tsx:1207](C:/Users/mrspa/Documents/Brasserie/src/pages/BrewWizard.tsx:1207), [enregistrement:1274](C:/Users/mrspa/Documents/Brasserie/src/pages/BrewWizard.tsx:1274), [FormNav:1373](C:/Users/mrspa/Documents/Brasserie/src/pages/BrewWizard.tsx:1373), [numericInput.ts:86](C:/Users/mrspa/Documents/Brasserie/src/ui/numericInput.ts:86), [sauvegarde App.tsx:423](C:/Users/mrspa/Documents/Brasserie/src/App.tsx:423). L’effacement émet la valeur vide par défaut, zéro ; le retour sur une saisie vide précède le bornage. Les règles du bouton Suivant ne protègent pas les autres chemins. Correction : distinguer absence et zéro, valider au point d’enregistrement/lancement, afficher une erreur liée au champ et rendre ce champ visible avec le focus. Préserver la navigation libre entre étapes si elle reste utile. [Preuve : recettes réellement enregistrées](C:/Users/mrspa/AppData/Local/Temp/laffinee-recipe-review-evidence/12-recette-zero-litre-enregistree.png).

**R2 · P1 — Fermer ou Échap perd le brouillon sans reprise.** Un nom renseigné puis un passage à Fermentescibles, Fermer et Nouvelle recette suffisent à perdre la saisie. La revue indépendante a reproduit Échap depuis le champ PPG avec un volume de 30,5 L et 5,25 kg de malt : fermeture immédiate ; à la réouverture, volume par défaut et liste vide. L’article de stock créé demeure, mais la recette est perdue.

Sources : [PageShell.tsx:111](C:/Users/mrspa/Documents/Brasserie/src/pages/PageShell.tsx:111), [BrewWizard.tsx:1221](C:/Users/mrspa/Documents/Brasserie/src/pages/BrewWizard.tsx:1221), [App.tsx:836](C:/Users/mrspa/Documents/Brasserie/src/App.tsx:836). Correction : conserver un brouillon local récupérable ; réserver l’abandon à une action explicite. Vérifier ensuite fermeture, Échap, retour et rechargement avec une recette remplie. Le geste retour d’un téléphone physique n’a pas été testé pendant cette revue.

**R3 · P1 — Le récapitulatif cache les manques de stock.** La section fermée indique uniquement « Stock ». À son ouverture, trois ingrédients sont indisponibles ; aucun compte ni état d’attention ne les annonçait, alors que « Lancer le brassin » est visible. Le constat concerne l’information disponible avant lancement ; le lancement lui-même n’a pas été testé.

Source : [BrewSheet.tsx:803](C:/Users/mrspa/Documents/Brasserie/src/ui/BrewSheet.tsx:803), qui ne fournit pas de résumé au bloc Stock. Correction : conserver le détail repliable et afficher, dès l’état fermé, « 3 ingrédients à commander », avec une pastille d’attention. Le détail garde les quantités disponibles/nécessaires. [Stock fermé](C:/Users/mrspa/AppData/Local/Temp/laffinee-recipe-review-evidence/11-recap-direct-1280.png) · [Stock ouvert](C:/Users/mrspa/AppData/Local/Temp/laffinee-recipe-review-evidence/A-stock-1280.png).

**R4 · P2 — Le clavier atteint la navigation masquée derrière l’assistant.** Après ouverture, le focus peut rester sur Nouvelle recette dans le catalogue. Dans l’assistant, focaliser Fermer puis Maj+Tab place le focus sur Clients, derrière la page plein écran. Reproduction indépendante et confirmation pendant l’intégration.

Source : [PageShell.tsx:125](C:/Users/mrspa/Documents/Brasserie/src/pages/PageShell.tsx:125) et [montage du wizard](C:/Users/mrspa/Documents/Brasserie/src/App.tsx:831). Correction : rendre l’arrière-plan inerte, transférer le focus à une destination visible à l’ouverture et aux changements d’étape, puis le restituer au déclencheur à la fermeture. Le focus du curseur d’eau, lui, est visible : il n’est pas à corriger sur la seule lecture de ses classes.

**R5 · P2 — La hiérarchie mobile éloigne le geste courant et augmente la mémoire nécessaire.** Trois éléments liés, avec des corrections distinctes :

| Observation rendue | Emplacement | Contrôle ou représentation proposé et bénéfice attendu |
|---|---|---|
| À 375 × 667, le champ d’ajout de houblon commence à y ≈ 586 px ; à 320 × 568, il est sous le premier écran. Le bilan détaillé et les simulateurs le précèdent. | [BrewWizard.tsx:1593](C:/Users/mrspa/Documents/Brasserie/src/pages/BrewWizard.tsx:1593) | Mettre la combobox et les ajouts en premier, avec un bilan IBU compact. Ouvrir l’exploration depuis ce bilan. Le brasseur peut transcrire immédiatement une recette connue tout en conservant les simulations. |
| Le rail mobile présente sept traits sans noms visibles ; le bureau présente les destinations nommées. Les noms accessibles ne résolvent pas leur lecture tactile. | [BrewWizard.tsx:1242](C:/Users/mrspa/Documents/Brasserie/src/pages/BrewWizard.tsx:1242), [WizardStepBar.tsx:90](C:/Users/mrspa/Documents/Brasserie/src/ui/WizardStepBar.tsx:90) | Noms courts dans une bande compacte, défilement local au besoin. Conserver le saut en un geste demandé par le projet. |
| Une section fermée simple du récapitulatif occupe 50 px : résumé de 32 px, padding de panneau et bordures. Les cartes s’empilent ; Stock et Eau sont bas sur petit téléphone. | [recipe-wizard.css:10](C:/Users/mrspa/Documents/Brasserie/src/pages/recipe-wizard.css:10), [résumés:68](C:/Users/mrspa/Documents/Brasserie/src/pages/recipe-wizard.css:68), [RecipeDisclosure.tsx:13](C:/Users/mrspa/Documents/Brasserie/src/ui/RecipeDisclosure.tsx:13) | Traiter les résumés fermés comme des lignes compactes avec séparateurs. Retirer le padding empilé autour des résumés, tout en laissant les informations longues revenir à la ligne. |

[Houblons 375 px](C:/Users/mrspa/AppData/Local/Temp/laffinee-recipe-review-evidence/10-houblons-entree-direct-375.png) · [Récapitulatif 320 px](C:/Users/mrspa/AppData/Local/Temp/laffinee-recipe-review-evidence/09-recap-direct-320.png). Ces directions n’ont pas été implémentées dans cette revue ; leurs bénéfices devront être vérifiés après correction.

**Autres défauts établis**

- **P2 — Statut de levure contradictoire après la première application.** « Scénario repris dans la recette » est suivi de « Des réglages ont changé depuis l’application », sans nouvelle saisie. La comparaison annonce 0 changement. Réappliquer le même scénario fait disparaître l’alerte. Observé dans deux parcours ; cause précise non établie. Examiner [YeastRecipeWorkbench.tsx:274](C:/Users/mrspa/Documents/Brasserie/src/ui/YeastRecipeWorkbench.tsx:274), [yeastRecipeDesign.ts:391](C:/Users/mrspa/Documents/Brasserie/src/domain/yeastRecipeDesign.ts:391) et [reprise du scénario](C:/Users/mrspa/Documents/Brasserie/src/pages/BrewWizard.tsx:1163). Le statut doit correspondre au résultat effectivement appliqué et nommer une divergence réelle.
- **P2 — Onglets Eau traitée : sélection et focus divergent.** Flèche droite sélectionne Rinçage mais conserve le focus sur Empâtage. Les relations onglet/panneau manquent également. Déplacer le focus vers l’onglet sélectionné et relier les panneaux. [WaterAcidity.tsx:53](C:/Users/mrspa/Documents/Brasserie/src/ui/water/WaterAcidity.tsx:53).
- **P2 — Badge Garde : contraste 4,30:1.** Petit texte bleu sur son fond bleu à 10 %, composé sur le fond réel ; sous le seuil projet de 4,5:1. Éclaircir le texte en conservant le repère bleu. [brewPrograms.ts:113](C:/Users/mrspa/Documents/Brasserie/src/domain/brewPrograms.ts:113). Le même bleu sur le fond sombre sans teinte atteint 4,82:1 ; ne pas généraliser ce défaut à tous les textes bleus.
- **P3 — Décimales inégales.** La saisie française fonctionne, mais le grain, la couleur et certains conseils affichent 4.2, 5.7 ou 3.1 à côté de valeurs à virgule. Uniformiser le formatage d’affichage sans changer la précision des calculs. [BrewWizard.tsx:1196](C:/Users/mrspa/Documents/Brasserie/src/pages/BrewWizard.tsx:1196), [métriques:1311](C:/Users/mrspa/Documents/Brasserie/src/pages/BrewWizard.tsx:1311).

Une hypothèse de code reste à vérifier : l’erreur asynchrone de RecipeReview ne possède pas d’annonce explicite comme l’erreur d’export voisine. Aucun échec réseau ni lecteur d’écran testé ; ce point n’est pas classé parmi les défauts reproduits.

**Ce qui fonctionne et doit être conservé**

- La base visuelle est spécifique au brassage : unités proches des valeurs, couleur EBC, étapes d’ajout, fourchettes et limites explicites. Identité tient dans le premier écran à 375 × 667. Les champs mesurés font 32 px avec une saisie à 16 px.
- Les contrôles montrent leurs conséquences. Une simulation sur Cascade a affiché 20,8 → 40 IBU et 30 → 57,7 g ; l’application explicite a modifié la recette. Les tableaux de levures exposent des candidats comparables, les températures et les limites. Garder ces représentations ; déplacer leur priorité visuelle si nécessaire.
- Le récapitulatif conserve osmosée, réseau et eau totale hors des détails. L’en-tête mobile occupe 65 px et le pied final 37 px, soit 102 px de barres visibles et 466 px de contenu à 320 × 568. Les barres de l’application recouvertes ne sont pas additionnées. Aucun débordement horizontal constaté dans les états vérifiés.

**Appréciation heuristique — 24/40**

Cette note de revue concerne les parcours observés, pas une certification. La synthèse abaisse la note indépendante de design (28/40) après confirmation de la sauvegarde invalide et de la perte du brouillon.

| Heuristique | /4 | Motif |
|---|---:|---|
| Visibilité de l’état | 2 | Bons résultats chiffrés ; stock caché et statut levure contradictoire. |
| Correspondance avec le métier | 4 | Unités, moments et comparaisons adaptés au brasseur. |
| Contrôle et liberté | 1 | Navigation libre, mais fermeture qui perd le travail. |
| Cohérence | 3 | Contrôles communs ; rail et décimales inégaux. |
| Prévention des erreurs | 1 | Valeurs effacées devenues zéro et sauvegarde sans validation centrale. |
| Reconnaissance plutôt que mémoire | 2 | Destinations mobiles anonymes. |
| Efficacité | 3 | Saisies exactes et préréglages utiles ; ajout de houblon trop bas. |
| Minimalisme | 3 | Barres compactes, mais padding et conseils avant le geste courant. |
| Correction des erreurs | 2 | Import vide et fiches incomplètes explicites ; données invalides finales non signalées. |
| Aide | 3 | Aides locales et hypothèses accessibles à la demande. |

Charge cognitive modérée sur le parcours nominal : groupe d’informations cohérent par étape, mais destination à mémoriser sur le rail et priorité de saisie brouillée dans Houblons. La transcription d’une recette connue souffre surtout du défilement ; une interruption souffre surtout de l’absence de brouillon ; le parcours clavier souffre du focus masqué. L’expérience commence clairement, devient utile lors des simulations, puis perd en confiance avec l’alerte de levure et le stock caché.

**Vérifications réellement exécutées**

| Parcours / état | Résultat observé |
|---|---|
| Catalogue vide → identité → malt → houblon → levure → paliers → eau → récapitulatif | Parcours complet joué ; erreurs de fiche malt corrigées ; champs, recherches et détails manipulés. |
| Simulation IBU, scénario levure, préréglage d’empâtage modifié | Résultats observés et application vérifiée ; anomalie de première application levure isolée. |
| Coupe à l’osmosée, volumes et sels | Valeurs recalculées ; avertissement sous le minimum proposé visible ; détails ouverts et fermés. |
| Enregistrer → catalogue → ouvrir → modifier | Recette locale conservée avec ingrédients et paliers ; cases invalides R1 enregistrées séparément. |
| Import texte | Import vide refusé avec message explicite ; texte simple lu localement, prévisualisé puis repris dans l’assistant ; limites de lecture visibles. |
| Fermer / Échap / rail / clavier | Perte de brouillon, contournement et focus masqué reproduits. |
| Téléphone | 320 × 568, 375 × 667 et 430 × 812 ; captures des étapes et états concernés effectivement examinées. |
| Ordinateur | Récapitulatif à 1280 × 800 en viewport direct, et 1280 × 900 dans le banc ; Stock fermé/ouvert et paliers inspectés. |
| Texte agrandi | Racine du texte à 200 % dans le banc ; aucun débordement horizontal constaté sur les vues examinées. Ce n’est pas un zoom natif. |
| Console | Aucune erreur ou alerte retournée dans les journaux des parcours observés. |
| Détecteur Impeccable | 10 fichiers de markup ; 3 alertes brutes de taille 13 px, toutes écartées car DESIGN.md autorise cette taille. Aucun autre défaut retenu de ce scan. |
| Build | Construction QA des composants courants réussie. Aucun nouveau test automatisé ajouté ; pas de relance de toute la suite pour cette revue sans changement applicatif. |

Limites : données et stockage de test locaux ; pas de validation de la synchronisation distante, d’un échec réseau, du lancement d’un brassin, de l’IA ou des scénarios NOLO avancés. Pas de téléphone physique, clavier virtuel, lecteur d’écran ni zoom navigateur natif. L’overlay Impeccable n’était pas disponible avec les API de navigateur autorisées ; la revue utilise captures examinées, mesures DOM en lecture seule, accessibilité et détecteur. Les commandes compactes n’ont pas été évaluées avec un pointeur tactile physique. La conformité d’accessibilité globale n’est pas revendiquée.

Les captures et les mesures sont conservées dans [le dossier de preuves](C:/Users/mrspa/AppData/Local/Temp/laffinee-recipe-review-evidence/). Les évaluations indépendantes sont archivées dans [design-review.md](C:/Users/mrspa/Documents/Brasserie/.unlazy/recipe-frontend-review/design-review.md) et [technical-review.md](C:/Users/mrspa/Documents/Brasserie/.unlazy/recipe-frontend-review/technical-review.md).

Questions skipped: la demande porte sur une revue ; aucune décision utilisateur n’est nécessaire pour livrer les constats. L’ordre proposé est validation et brouillon, stock et focus, puis hiérarchie mobile et finitions. Le questionnaire et l’ordre de publication du playbook sont adaptés aux instructions de session : livrer la réponse finale complète sans la bloquer par une demande de confirmation.
