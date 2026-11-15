# Voie ui — port de i1a (Impôt bière de l'année) — PLAN

Ses mots (10.11) : « Le total et la liste / i1a / Le total découpé par bande ; chaque brassin sur sa bande ; ta feuille p2b en annexe. Très bien ».
Maquette : `p5/i1a/etat.html` (ouverte, avec `i1a-page.png`). Règle n° 1 : elle est l'écran ; « remplacer, jamais fusionner ».
Pas de VOIE.md ni de GATES.md : le message du pilote en tient lieu (critères = § 6). Étape neuve : `État de l'art` — aucun algorithme non trivial
(barres proportionnelles, somme au centime, deux dates par addition de jours) ; pas de nouvelle ligne à écrire.
Portée : l'onglet Clients › Impôt bière (section `ofdf`), l'année entière. Rien d'écrit en données.

## 1. Défauts visés
Aujourd'hui (HEAD) : un bloc « Impôt bière » : titre, `<select>` Année, total en texte (« ~ 6,74 CHF »), liste de boutons-texte
(`ImpotBiereLien`, « Nom · 6,74 CHF · 0,08 par 33 cl ›»), phrase de réduction, détails « Comprendre le calcul et les démarches »,
« Copier cette estimation », « Ouvrir Taxas », « Directives OFDF ». Problèmes de l'inventaire : 12 (quand / à qui absents), 13 (total « minimum » en phrase),
14 (barème dessiné seulement dans la feuille). La maquette i1a remplace tout cela.

## 2. Inventaire de i1a, élément par élément (mobile 390, écran 1)
| # | Élément de la maquette | Port |
|---|---|---|
| 1 | Titre « Cette année, je dois » + pilule année « 2026 ⌄ » (28 px, bord, mono) | titre (année courante) ; autre année : « En 2025, je devais ». Pilule = `<select>` natif habillé (menu natif tactile), `aria-label="Année de réserve OFDF"` (nom conservé), 6 ans comme avant |
| 2 | Carte réponse (fond panneau, rayon 16) : ligne « 1 026,6 L · 6 brassins » + pastille « taux plein » (attention) | idem ; pastille « taux plein » ou « réduction 20 % confirmée » (vient de `fiscal`, comme p2b) |
| 3 | Total 30 px mono « 256,00 – 260,49 CHF » | somme **au centime** des lignes ; fourchette seulement s'il reste une densité inconnue ; « ~ » si une ligne est sur la visée de la recette ; « ≥ » si des litres manquent ; « — » hachuré si aucun nombre |
| 4 | Barre empilée 22 px, largeurs = litres, trois bandes + hachures | idem, segments des litres connus ; un segment « exonéré » neutre seulement si le cas existe |
| 5 | Légende : pastille + nom + CHF par bande, « densité à noter 4,49 – 8,98 » | idem, seules les entrées non vides ; CHF de la bande = somme de ses lignes |
| 6 | « Par brassin » + 6 lignes de 44 px : pastille de bande, nom, « °P · L », impôt mono, › | une ligne par brassin non planifié et non annulé de l'année, dans l'ordre des dates ; ligne = bouton qui ouvre `ImpotBiereSheet` (p2b, déjà portée) |
| 7 | Ligne inconnue : pastille hachurée, « densité à noter · 26,6 L » en attention, « 4,49 – 8,98 » gris | idem ; sans litres : « litres à noter » et montant hachuré vide, jamais 0 |
| 8 | « janv. – août : exemple » | **non porté** : c'est le marquage des données fictives de la maquette ; les données de l'app portent leur propre marque (compromis listé) |
| 9 | Deux cases : « Quand · si régime annuel : déclarer 20 janv. 2027 / payer 30 janv. 2027 » ; « À qui : OFDF, par Taxas · réduction petit brasseur : à confirmer › » | dates = fin d'année + 20 j / + 30 j (directive OFDF, lue par d1) ; « si régime annuel » tant que `fiscal.beerTaxPeriod` n'est pas réglé ; trimestriel : « chaque trimestre : sous 20 j / 30 j » ; le › ouvre Réglages (événement existant de p2b) |
| 10 | « Comprendre le barème ⌄ » (pli, 40 px) | `<details>` : phrase du barème (dérivée de `BAREME_IMPOT_BIERE`), réduction, régime, TVA = le texte actuel, déplacé |
| 11 | Pied : liens « Taxas », « Directives OFDF » ; primaire bleu finances « Copier pour Taxas » 32 px | idem ; le texte copié garde son contenu (année, brassins, total, réduction) ; échec de copie dit |
| 12 | Annexe : ligne touchée → feuille p2b, fil « ‹ Impôt bière 2026 » | `ImpotBiereSheet` telle quelle (titre « Impôt bière », sous-titre = brassin). Le fil « ‹ Impôt bière 2026 » et « Noter la densité » sont dans le fichier de la feuille (hors Possède) : compromis listé |
| 13 | Cadre : barre d'app, onglets Carnet/Prix/Impôt bière, nav, FAB | déjà ceux de l'app, non touchés |

Desktop (1280) : la maquette est mobile seule ; la colonne se centre (max 640 px) comme les autres écrans de Clients.

## 3. Changements
- `src/ui/production/impotAnnee/calculAnnee.ts` (neuf, pur) : `lignesImpot(batches, donnees, annee)` → lignes {état note | visée | inconnue | exonéré, bande, litres, montant, min, max} ; `totalAnnee(lignes)` → centimes lo/hi, litres par segment, CHF par bande, compte « sans litres » ; `echeances(annee, période)`. Réutilise `baseImpot` / `anneeDuBrassin` (exportés de la feuille) → `beerTaxForVolume` : aucune règle neuve, aucun taux écrit.
- `src/ui/production/impotAnnee/ImpotAnnee.tsx` (neuf) + `impotAnnee.css` (classes `iaa-`, L26) : l'écran.
- `src/components/tabs/ClientsTab.tsx` : la section `ofdf` devient `<ImpotAnnee batches config />` ; supprimés : `lireImpot`, `PHRASE_BAREME`, états `taxYear`, `copiedTax`, `impotBatch`, `totalImpot`, `handleCopyOfdfValues` et les imports devenus inutiles. Les lignes-tâches ne sont pas dans cet onglet (rien à garder).
- Tests : `tests/integration/impotAnneeCalcul.test.tsx` (neuf), `impotAnneeEcran.test.tsx` (neuf), mise à jour de `impotBiereClients` (18b : « Comprendre le barème », 18c : aucun taux littéral dans `impotAnnee/**`) et `bDiversImpot` (virgule, liste).

## 4. Tests rouges d'abord
Calcul : fixture de la maquette (5 brassins notés + Pale Ale 26,6 L sans densité) → total 256,00 – 260,49 ; bandes 33,76 / 156,98 / 60,77 ; fourchette 4,49 – 8,98 ; jamais 0 pour l'inconnu ; sans litres → `≥` ; visée → « ~ » ; planifié et annulé exclus ; années ; échéances 20 et 30 janv. de l'année suivante ; réduction confirmée → pastille. Écran : barre à 4 segments aux proportions des litres, 6 lignes, ligne hachurée, clic → feuille p2b, année → liste vide « Aucun brassin en … » et total « — », pli du barème, copie (ok et refusée), › Réglages.
Rouge attendu avant le code : modules introuvables.

## 5. Appelants (grep `src/`, `tests/`, `scripts/` sur HEAD)
- `ImpotBiereSheet`, `ImpotBiereLien`, `baseImpot`, `anneeDuBrassin` : `ClientsTab.tsx` (ma section), `BrewBudgetSheet.tsx:284`, `ChaineArgent.tsx`, `donneesPrix.ts` (autres voies : non touchés ; `ImpotBiereSheet.tsx` n'est pas dans mon Possède, je ne le modifie pas).
- Textes de la section lus par des tests : `impotBiereClients`, `bDiversImpot` (Possède), **`tests/integration/compactClients.test.tsx:181-197` (hors Possède)** : lit « Comprendre le calcul et les démarches », « Copier cette estimation », « Ouvrir Taxas », « Aucun brassin en », « — », « réduction annuelle à confirmer ». Je garde « Aucun brassin en », « — » et le nom accessible « Ouvrir Taxas » ; les autres changent avec la maquette → à mettre à jour par le pilote (lignes listées dans RESULTAT).
- `f3ReelCoutImpotClient` : ne lit pas la section (feuille seule).

## 6. Critères
Tests verts (`voies/ui/tests.txt`) ; `npx tsc --noEmit` sans nouvelle erreur (hors firebase-admin, react-zoom-pan-pinch) ; `npx vite build` ; captures ouvertes : 390 tactile et 1280, clair et cave, sur `finance-demo` et `finance-demo=reel`, côte à côte avec `i1a-page.png`, états : liste, pli ouvert, feuille p2b ouverte depuis une ligne, année vide.

## 7. Risques
- Données existantes : lecture seule ; aucun champ écrit. Hors ligne : tout vient du stockage local. Arrondis : somme des centimes de chaque ligne (la maquette : 256,00 = somme des lignes arrondies).
- Brassin conditionné sans `volumePackagedL` : litres inconnus → « litres à noter », jamais 0.
- Changement de comportement : un brassin « annulé » ne figure plus dans le total (comme `estimateSwissBeerTax`) ; à signaler.
- Hors périmètre : feuille p2b, `Réglages`, lignes-tâches, `compactClients.test.tsx`.
