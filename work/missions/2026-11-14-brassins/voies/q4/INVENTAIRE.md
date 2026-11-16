# Inventaire e9na — l'Atelier R&D, « le carnet que l'IA range » (voie q4)

Source : `voies/e9n/e9na/etat.html`, ses 6 PNG, `NOTE.md`. Code : `src/components/CreativeLabTab.tsx` (assemblage, stockage) et `src/ui/atelier/`.
Colonnes : élément ou geste de la maquette · où il vit · statut (repris / adapté / retiré, et pourquoi).

## Écran au repos
| Élément ou geste | Où | Statut |
|---|---|---|
| Sous-onglets Brassins / Recettes / Atelier / Volumes, en-tête, barre du bas | `ProductionTab.tsx`, coque (hors voie) | existe, inchangé |
| Panneau « Noter en vrac » : titre, lien « Réfléchir » | `ui/atelier/Ecrire.tsx` | repris ; « Réfléchir » ouvre `BrewerChat` (ancien « Réfléchir à mes projets ») |
| Champ « Ta note » (2 lignes), Ctrl+Entrée note | `Ecrire.tsx` | repris |
| Micro « Dicter » | `ui/atelier/dictee.ts` | repris, **seulement si le navigateur sait dicter** (sinon pas de micro mort) |
| Phrase « L'IA range, tu valides » | `Ecrire.tsx` | **adaptée** : « Le rangement se propose, tu valides » (aucune tâche IA « ranger » côté serveur : voir ACCORD 1) |
| Bouton « Noter » (primaire ; secondaire dans Tarifs) | `Ecrire.tsx` | repris |
| Puces de tiroirs Tout / Bières / Tarifs / Contacts / À faire + compteurs, fondu de défilement | `CreativeLabTab.tsx`, `atelierModel.compteurs` | repris ; compteurs calculés (Tout = sans le matériel) |
| Puce « Matériel » avec icône de renvoi | `CreativeLabTab.tsx` | repris ; ouvre la section existante `UpgradeWorkspace` (mission Rénovation), gardée telle quelle |
| Note Bière : marge ambre, texte, date, tiroir (nom), « En recette → » | `ui/atelier/NoteCarte.tsx` | repris ; « En recette » = `onDraftRecipe` (rien d'inventé) |
| Pastille de style (« Ambrée forte », « NEIPA ») sur la note | — | **retirée** : `CreativeItem` n'a pas de style (ACCORD 2) |
| Note Contact : tiroir « Lieu · Prénom », « Appeler » | `NoteCarte.tsx` | repris ; « Appeler » = lien `tel:` seulement si un numéro est noté, sinon « pas de numéro noté » |
| Tiroir « rappeler » (2e pastille d'un contact) | — | **retiré** : pas de champ (ACCORD 2) |
| Note À faire : case 24 px (cible 44 px), tiroir échéance « lun. 16.11 » | `NoteCarte.tsx`, `atelierModel.dateEcheance` | repris ; cocher = `todo` ⇄ `done`, texte barré ; « sans date » quand il n'y en a pas |
| Note Tarif : tiroir « 33 cl · 6,00 », « marge 3,90 » ou « coût non saisi » | `NoteCarte.tsx`, `atelierModel.marge` | repris ; la marge n'existe que si prix ET coût sont notés |
| Date de saisie à droite (« 12.11 ») | `atelierModel.instantNote` | repris : lue dans l'identifiant `CR-<ms>` ; **aucune date** pour les anciens identifiants (`CR-001`) |
| Toucher une note | `CreativeLabTab.ouvrir` | idée de bière → fiche ; autres notes → feuille d'édition existante (`CreativeItemSheet`, crayon d'avant) |

## État geste (après « Noter »)
| Élément ou geste | Où | Statut |
|---|---|---|
| Carte de rangement (cadre doré) : « … propose de ranger ta note en deux », citation de la note | `Ecrire.tsx` | repris ; titre « Rangement proposé : ta note en N lignes » |
| Une ligne par rangement : tiroir (Bière / À faire…) + texte + « Retirer » | `Ecrire.tsx`, `atelierModel.ranger` | repris ; lecture locale à indices (pas une IA) |
| « Corriger » | `Ecrire.tsx` | repris : le tiroir se change au toucher, le texte se réécrit |
| « Ranger ainsi » | `CreativeLabTab.rangerLignes` | repris : une entrée `CreativeItem` par ligne, mêmes champs |
| Toast « Note gardée dans le carnet » + « Annuler » | `CreativeLabTab.tsx` | repris ; texte « gardée dans l'Atelier » (« carnet » nomme déjà le carnet du brassin : k9) ; « Annuler » retire les entrées créées |
| Pastille de style « Lager » dans la ligne rangée | — | **retirée** (ACCORD 2) |

## État tarifs
| Élément ou geste | Où | Statut |
|---|---|---|
| Panneau « Essayer un prix », « sans TVA, selon tes réglages » | `ui/atelier/EssaiPrix.tsx` | repris ; la phrase suit le réglage TVA réel (`config.fiscal`) |
| Formats 33 cl / Carton 24 / Fût 20 L | `EssaiPrix.tsx`, `FORMATS_PRIX` | repris ; étendues propres à chaque format |
| Curseur m2 « Prix de vente » (0 à 12, repères, pouce 24 px) | `ui/atelier/CurseurPrix.tsx` | repris ; **part de « non saisi »**, pas de 6,00 inventé |
| Curseur m2 « Coût de revient » | `CurseurPrix.tsx` | repris ; idem, « non saisi » au départ |
| Barre coût / marge | `EssaiPrix.tsx` | repris ; seulement quand marge connue |
| Cadre « Marge par bouteille 3,90 CHF » | `EssaiPrix.tsx` | repris ; « saisis le prix et le coût » tant qu'elle est inconnue |
| « Garder ce tarif dans le carnet » | `EssaiPrix.tsx` → `CreativeLabTab.garderTarif` | repris ; libellé « dans l'Atelier » ; désactivé sans prix ; coût facultatif |
| « Tarifs gardés » + notes tarif | `CreativeLabTab.tsx` | repris |

## État idée (fiche d'une idée de bière)
| Élément ou geste | Où | Statut |
|---|---|---|
| Feuille : titre, « Idée de bière · notée le 12.11 » | `ui/atelier/FicheIdee.tsx` (`Sheet`) | repris |
| Pastille d'étape (Validée…) + « Changer l'étape » | `FicheIdee.tsx` | repris ; étapes de l'app : idée, recherche, devis, validée |
| Faits : Degré visé, Arômes, Pour | — | **retirés** : pas de champ (ACCORD 2) |
| Faits : Tarif (prix visé, marge), coût estimé, idée, notes | `FicheIdee.tsx` | adaptés : seulement ce que `CreativeItem` porte |
| « Recette : pas encore écrite » | — | **retiré** : aucune liaison idée ↔ recette ne le prouve |
| « 3 notes du carnet en parlent » | — | **retiré** : aucune liaison note ↔ idée (ACCORD 2) |
| Pied : corbeille, « Modifier », « Passer dans mes recettes » | `FicheIdee.tsx` | repris ; corbeille avec confirmation nommée (`ConfirmSheet`) ; « Modifier » ouvre `CreativeItemSheet` |

## État vide
| Élément ou geste | Où | Statut |
|---|---|---|
| « Ton carnet est vide », phrase d'explication | `CreativeLabTab.tsx` | repris |
| Trois exemples tapables (remplissent le champ) | idem | repris ; un 4e (À faire), k9 |
| Lien « Projets de matériel : dans Rénovation » | idem | repris, remonté |
| (puces absentes du vide) | idem | repris |
| « Essayer un prix de vente » | idem | **ajouté** : sans lui, l'essai de prix serait inatteignable carnet vide |

## Ce que l'ancien Atelier avait et que la maquette n'a pas
| Ancien | Sort |
|---|---|
| 5 boutons de section, « Bières / Tarifs / Contacts / À faire / Matériel » | remplacés par les puces |
| Boutons « + Noter une idée de bière », « + Noter un contact », « + Ajouter un événement » et la feuille « Nouvelle note / piste » (titre, détails, budget, date, téléphone) | **retirés** : « Noter en vrac » les remplace ; le bouton + de l'app met le curseur dans le champ (ou ouvre « Prévoir du matériel » dans Matériel) |
| « Convertir en client » (prospect → fiche client, verrou BE-22) | **retiré de l'écran** (ACCORD 3) |
| « Visuel : … » (champ notes d'une idée, BE-24) | plus dans la liste ; lisible dans la fiche, rubrique « Notes » |
| Simulateur `CreativePricing` (TTC, TVA retirée) | remplacé par `EssaiPrix` (même calcul : TVA retirée selon `config.fiscal`) |
| Étapes cycliques sur le crayon d'une carte | « Changer l'étape » dans la fiche d'une idée |

## Gestes joués au banc (390 clair, ids dans `captures/`)
Noter (champ → carte) · Retirer une ligne · Corriger · Ranger ainsi · Annuler · puces · Essayer un prix (3 formats, 2 curseurs, Garder, Annuler) · fiche d'idée (ouvrir, Changer l'étape, Supprimer) · cocher · feuille d'édition d'un contact · Matériel.
