# Constats de la passe 2 par principes (21.11)

Banc : `scripts/parcours/principes.mjs` de port-carnet (build de test d'une copie de HEAD cf945eaec et du tag
en-ligne/2026-11-21-tour7 dans os.tmpdir(), fixture « ZZ TEST » chaines.mjs, 390×844 tactile, gestes au doigt). Les deux
builds donnent les mêmes KO (`diff` des lignes KO : identiques). Captures ouvertes : celles citées. Règles : `REGLES.md`.

| Id | Règle | Écran | Constat (mesuré) | Fichier |
|---|---|---|---|---|
| WX2-1 | R9 | Calendrier | 8 actions sur 11 font bouger le calendrier : semaine S48 et S49 (CLS 0,024 et 0,029), Cacher la courbe (0,047), toucher un achat puis Fermer (0,036 chacun), période ‹ › (0,030). Session : CLS 0,248, douze fois le plafond. Sources : étiquettes de barres (`cal-lbl`), rangées vides (`cal-vides`), groupe déplié (`cal-g-deplie`). Le premier bloc ne bouge pas : c'est l'intérieur de la frise qui saute. | `src/ui/calendrier/frise/` |
| WX2-2 | R9 | Stocks › Articles | Étagère (0,031), Autres stocks (0,071), Ingrédients (0,063), retour à Articles (0,032) ; Épingler un malt déplace la tuile sous le doigt de 38 px (le mur se retrie). Session : 0,264. | `src/ui/stock/` |
| WX2-3 | R9 | Assistant recette | « Suivant » n'a pas de place fixe : il suit la fin du contenu et saute de 490 px puis 655 px d'une étape à l'autre (capture `vue-assistant-recette-2-saut` : au milieu de l'écran à l'étape Malts). Ajouter un malt décale la page (CLS 0,047 et 0,043) ; passer aux Houblons, 0,144. Session : 0,318. | `src/pages/BrewWizard.tsx` |
| WX2-4 | R9 | Assistant recette › Identité | « Changer de fermenteur » ouvre le panneau Matériel et décale le bouton touché de 17 px (CLS 0,043). | idem |
| WX2-5 | R9 | Brassins | Filtre « Tous » : la liste se recompose, CLS 0,032 ; session 0,039. | `src/components/tabs/ProductionTab.tsx` |
| WX2-6 | R12 | Calendrier › Ajouter (Travaux, Activités, Papiers) | Sans nom tapé : « Choisis un nom. », alors que la rangée et la semaine donnent un nom sensé. Entrée (enterkeyhint « done ») ferme le clavier sans ajouter. | `src/ui/calendrier/frise/FeuilleAjout.tsx:333-340` |
| WX2-7 | R12 | Assistant recette › Identité | Le nom est exigé pour passer ; le texte d'exemple (« Milk Stout #2, NEI… ») n'est qu'un placeholder, non repris. Entrée passe au style : acceptable. | `src/pages/BrewWizard.tsx` (`recipe_title_label`) |
| WX2-8 | R12 | Stocks › Matériel › Achat | « Pour quoi ? » exigé (« À corriger : Décris cette dépense »), aucun nom tiré de la catégorie ou d'un projet ; Entrée ferme le clavier seulement. | `src/ui/equipment/NewEquipment.tsx` |
| WX2-9 | R12 | Toute l'app (lecture du code) | 74 champs texte d'une ligne qui portent un nom : 70 sans `enterKeyHint`, 68 sans Entrée qui confirme ; 29 boutons ou fonctions bloqués tant que le nom est vide. Liste à trier : une partie est du code non atteint (`hopV55`). | relevé `statique.mjs`, § 2 de l'analyse |
| WX2-10 | R12 | Calendrier, Recettes | Renommer : un événement demande 7 gestes (toucher, Modifier, champ, taper, fermer le clavier, Enregistrer) ; une recette passe par l'assistant (Modifier, 7 étapes). Seuls les carnets se renomment sur place (crayon à côté du titre). | `FeuilleAjout.tsx`, `CarnetsVue.tsx:980` |
| WX2-11 | R5, R6 | Finances | La même phrase est écrite deux fois au premier écran : « Revoir le mois Caisse jour par jour, sources, budgets, 12 mois » (y 523 et 541) et « 1 paiement à confirmer depuis le 1 janv. ; sans eux, le solde n'est pas connu » (y 612 et 628). | `src/ui/finance/` |
| WX2-12 | R6 | Stocks › Articles | L'épicerie (son modèle) est accompagnée de trois phrases qui décrivent ce que l'ordre des tuiles montre déjà : « Trié par couleur (malts), amertume (houblons), date (levures) », « par couleur, du plus clair au plus foncé », « à l'échelle, resserrée au-delà de 5 kg ». | `src/ui/stock/` |

Non joués (limite du banc, pas des défauts) : création d'un fournisseur (bouton d'ajout non trouvé sous « Plus › Fournisseurs ») ;
houblon ajouté à l'étape Houblons (tuile Citra non trouvée après « Suivant — Houblons »).
Tenus (mesurés) : Bord, Finances (CLS de session 0,014), Clients (0), Fûts, Matériel, Courses ; idée de l'Atelier (Entrée crée le
carnet, avec « Annuler ») ; nouveau client (Entrée confirme) ; tarif (nom de bière proposé par défaut).
