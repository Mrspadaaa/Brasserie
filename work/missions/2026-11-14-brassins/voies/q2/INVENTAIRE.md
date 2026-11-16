# q2 — inventaire : maquette → code (existe / créé / retiré)

Code : `src/ui/production/liste/` (`listeModel.ts` règles, `ListeBrassins.tsx`, `CarteBrassin.tsx`, `FeuilleFiltres.tsx`, `liste.css`), branché dans `ProductionCatalog.tsx` (brassins, vue liste).

## e6a — la liste
| Maquette | Code | État |
|---|---|---|
| Phrase de tête (« 2 en cuve / 1 à brasser »), compteur « 5 brassins » | `phraseListe`, `lst-h1` | créé |
| Phrase filtrée (« 2 en cuve / fermentation et garde », « sur 5 ») | `phraseListe` (phases lues sur les brassins) | créé (la maquette écrit « F1 et garde » : pas de nom de cuve → « fermentation ») |
| Recherche + bouton Filtrer (pastille du nombre) | `lst-search`, `lst-fbtn` | créé |
| Puces d'avancement avec comptes à facettes, posées en tête avec ×, « Tous » ensuite | `comptesAvancement`, puces | créé |
| Tri, période, icône Bilan | `SelectTri`, `libellePeriode`, bouton « Afficher les analyses » | créé (l'icône est la décision 2 du pilote) |
| Carte : barre, pastille, lot · volume, nom + style, lecture clé, bouton d'action, étoile, « … » | `carteModel`, `CarteBrassin` | créé |
| Geste : puce posée, « Tout effacer », pli « n autres hors du filtre » + rangées mini | `ListeBrassins`, `miniModel` | créé |
| Vide : « Rien pour « Galaxy » », Effacer la recherche, Chercher dans Archives, houblons à bandes, carte Archives | bloc `vide` | créé ; ligne tri/période masquée (comme la maquette) |
| Ancienne liste (CatalogToolbar, grille de cartes, bandeau « Vue filtrée », ligne « n fiches dans Archives ») | `ProductionCatalog` | retiré pour les brassins (recettes inchangées) |
| « Annulés » (puce), « Comparer » | — | retirés (absents de la maquette ; Comparer reste aux recettes) |
| Puce et tuile « Notes à compléter » | `correspondAvancement('notes')` | ACCORD : gardée (l'ancien filtre `tasting` existait) |

## e6c — la feuille « Filtrer »
| Maquette | Code | État |
|---|---|---|
| En-tête gros nombre + « Tout effacer » | `FeuilleFiltres` | créé |
| Bande des brassins (éteints hors critères) | `lst-strip` | créé |
| Résultats (≤ 6 rangées) | `lst-res` | créé |
| Repos / geste / vide / défilé | idem | créé ; vide : « Ces critères s'excluent : retire-en un », « Retirer « X » n » (`comptesSiRetire`) |
| Tuiles d'avancement, styles, houblons (bandes de familles, « + autres »), malt · levure | `comptesChamp` | créé |
| Plage d'alcool à deux pouces, points (en cuve = provisoire en pointillé) | `bornesAlcool`, deux `input range` | créé |
| Période (Ce mois / Cette année / Toutes / Dates…), « Les en cours, toujours » | `dansPeriode` | créé |
| Dossier (Courant / Archives / Tout), « + autres critères » (volume, IBU, EBC) | `inCatalogFolder`, bornes | créé |
| Pied : tri + « Voir les N » / « Tout effacer · N » | `lst-pied` | créé |
| Hauteur de la feuille (~80 %) | `.lst-sheet` | créé |

## Données absentes (ACCORD)
Nom de cuve (« F1 »), température de garde, date d'entrée en garde, « écoulée/vendue » : remplacés par ce que `Batch` porte (voir RESULTAT.md).
