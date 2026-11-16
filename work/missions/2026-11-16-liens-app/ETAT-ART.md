# État de l'art : tout lié à tout sans alourdir (2026-11-16)

Recherche web du 2026-11-16, aucune donnée du brasseur. Sources consultées ce jour (dates de pages non fournies).
Légende : [S] source web ; [C] connaissance générale, non revérifiée ici (Linear, Things, Craft, Shopify).

## 1. Problème type
Modèle relationnel + navigation : une entité canonique, des relations, des vues dérivées. Problème d'école : intégrité référentielle, relations bidirectionnelles, workflow à états.

## 2. Motifs retenus
1. **Relation unique, deux sens** [S] Notion : la relation est à sens unique par défaut, le sens inverse s'active à part ; one-way ensuite upgradable en two-way sans perte. Auto-relation en two-way = deux propriétés (Suivant/Précédent), à éviter ou masquer.
   -> Pour nous : stocker le lien une seule fois (id), calculer l'inverse à la lecture ; ne jamais écrire deux copies.
2. **Rollup = chiffre dérivé, jamais saisi** [S] Notion : agrégat sur les liés, nécessite une relation, triable seulement si numérique.
   -> Totaux (coût du brassin, dépenses d'un lot) calculés, pas stockés.
3. **Création en contexte (+)** [C] Linear/Things/Notion : le « + » d'une vue liée crée l'élément avec le lien et le contexte déjà remplis (date du calendrier, lot, projet). Ensuite seulement on édite.
   -> Le « + » du calendrier crée une idée liée à la date ; le « + » d'un lot crée tâche, dépense, mesure liée au lot.
4. **Rétroliens « lié à »** [S] Obsidian : volet rétroliens + mentions non liées (suggestions). [S] limites : faux positifs sur gros fonds, mentions non actionnables en lot.
   -> Afficher « lié à » en pastilles sur la fiche ; proposer (jamais imposer) un lien suggéré, un geste pour accepter.
5. **Une chose, plusieurs vues** [C] Notion/Airtable/Linear : même enregistrement vu en liste, calendrier, tableau ; la vue filtre, ne copie pas.
   -> Idée = un enregistrement ; le calendrier, le carnet et la fiche du lot sont des filtres.
6. **Transition d'état qui crée la suite** [S] Odoo : devis confirmé -> commande ; boutons intelligents vers factures et livraisons (compteur + lien) ; le bouton Livraison n'apparaît que si le picking existe (services : pas de livraison). Modules tiers : « traitement rapide » livraison + facture + paiement en un clic.
   -> Devis accepté -> facture + besoin matériel proposés (pré-remplis, à valider, un toucher). Bouton conditionnel : n'apparaît que si la suite existe.
7. **Comptabilité en sortie, source unique** [S] Breww : factures finalisées + avoirs synchronisés vers Xero ; réconciliation de paiement dans les deux sens ; journaux de stock (matières, encours, produits finis, coût des ventes) ; balance de bilan désactivée par défaut, on démarre par les factures seules. [S] Ekos : QuickBooks/Xero, sync de réceptions, tiers, factures, avoirs, écritures ; règle du vendeur : toujours modifier dans Ekos, jamais côté compta.
   -> Un seul lieu d'édition ; compta = vue/export de cette source ; activation progressive.
8. **Calendrier comme tâches liées** [S] Breww : chaque tournée de vente est une tâche au calendrier ; calendrier des commandes attendues alimente le plan de production. Aucune source trouvée liant tâche calendrier à un lot précis : c'est un manque que le motif 3 comble.

## 3. Pièges (sourcés ou observés)
- **Liens morts / orphelins** [S] Airtable : pas de contrôle de réciprocité natif, scripts de rattrapage, comparaison ids liés vs liens réels ; Obsidian : plugins dédiés aux liens cassés et orphelins.
  -> Suppression = lien nettoyé ou pastille « supprimé » ; contrôle de lecture des ids inconnus.
- **Faux liens de fiabilité** [S] Ekos (avis) : le lien entre articles et compta se casse par mauvais mappage, souvent erreur humaine.
  -> Choisir dans une liste (id), jamais par nom saisi ; une correspondance, une fois.
- **Doublons** [S] Obsidian : rétroliens dupliqués signalés ; Notion : copier au lieu de lier.
  -> Un lien par paire ; dédoublonner à l'écriture.
- **Surcharge** [S] Obsidian : mentions non liées bruyantes ; [S] Notion tiers : cellules à beaucoup de liés (plafond de 100 non vérifié chez Notion).
  -> Max 3 pastilles « lié à » visibles, « +n » au toucher ; suggestions repliées.
- **Boutons toujours là** [S] Odoo : bouton absent sans cause visible, source de questions.
  -> Montrer pourquoi (grisé + raison) plutôt que cacher.
- **Compta modifiée à deux endroits** [S] Ekos : sync cassée si on édite hors source.

## 4. Décision proposée
Registre de liens typés `{de, vers, type}` stocké une fois, inverse calculé ; « + » en contexte pré-remplissant le lien ; pastilles « lié à » repliées ; transitions d'état qui proposent la suite à valider ; compta et calendrier en vues/exports. Pas de bibliothèque nécessaire (relations Dexie/Firestore par id) : à confirmer contre le code avant tout lot.

## 5. Limites de cette recherche
Recherches standard, pages d'aide Notion en miroirs ; Linear, Things, Craft, Shopify, BrewMan non couverts par une source (marqués [C]). Odoo : peu de doc officielle trouvée, détails de modules tiers. Aucun chiffre Breww/Ekos indépendant.

Sources : notion.com/help/relations-and-rollups ; notion.vip/insights/notion-explained-relations-rollups ; breww.com/features/integrations/xero/ ; breww.com/features/sales/ ; goekos.com (QuickBooks/Xero) ; capterra.com/p/151906/Ekos-Brewmaster/reviews ; forum.obsidian.md (backlinks, unlinked mentions) ; community.airtable.com (same-table backlinks) ; hibou.io (Odoo ventes) ; odoo.com/forum (bouton Livraison) ; apps.odoo.com (sale_order_workflow_automation, sale_quick_operation).
