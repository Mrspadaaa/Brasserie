# Passe 2 des workflows (21.11) : chaînes jouées au bout, chaînes rares, rattrapage

Pourquoi : « Mais ça semble un peu maigre ?? » (21.11, après A2 B1 C1 D2). Règle : « pas prend ces exemples à la lettre, mais bien
généralisé pour chaque cas » ; « des vrais gain et pas juste des gimmick ». Classement Moins de gestes reçu en cours de passe : v03 (1) ;
v06, v07, v11, v14 (2) ; v02, v09, v10 (3) ; v05 (4) ; « certaines sont gimmicky mais d'autres sont des vrais gain ».

**Banc.** Build de test fait depuis `git archive HEAD` de port-carnet (aaecde10f) dans `%TEMP%/wf2-src` (jamais l'arbre de travail),
config `scripts/parcours/vite.parcours.config.mjs`, `?dev-local`, 390×844 tactile, gestes `touchscreen.tap`, réseau externe coupé,
aucun Gemini, jamais `seedData.ts`. Fixture `passe2/fixture-passe2.mjs` (« ZZ TEST ») : base du parcours chaînes + un brassin démarré
en fermentation (B3 passé), un brassin en garde fini, un brassin du jour, emballage, sels, matériel à entretenir, historique d'un pro
(3 × 2 fûts) et d'un fournisseur (2 factures à lignes). Rejeu : `node passe2/pas2.mjs passe2/pas/<chaîne>.txt <nom>` (CPU ×4 par défaut).
**Temps** : toucher → réponse ; **INP** : PerformanceObserver `event`, CPU ×4 (CDP). Les tours ont tourné 5 à 9 Chrome en parallèle :
temps et INP **majorés**, à rejouer seuls avant tout correctif de lenteur (L20). Captures : `passe2/captures/r*-*/`.

## 1. Chaînes jouées (mesuré sauf mention)

| Chaîne | Gestes depuis le Bord | Temps / INP ×4 (max) | Ce qui suit seul (R1) | Frictions, bugs |
|---|---|---|---|---|
| J. Jour de brassage | Brassins, Brasser · lot, Commencer aujourd'hui, Reprendre : **4** jusqu'au compagnon | 0,5 à 2,2 s par geste ; INP 128 à 296 | statut « Brassage en cours » ; concassage 20 kg listé par malt | **WF2-1** : 1er « Terminer et continuer » → « Écran indisponible » : chaîne coupée, déstockage et OG non atteints ; eau d'empâtage proposée à 55 °C, non calculée (v09) |
| F. Densité de fermentation (1,022 → 1,014) | Brassins, Voir les mesures, Mesurer, −1 millième × 8, Enregistrer : **12** (≈ 5 par « Taper », compté) | 0,5 à 1,7 s ; INP ≤ 160 | alcool et atténuation suivent aussitôt (3,7 → 4,8 %) : R4 tenu | le curseur part de la dernière densité, pas de la prévision du jour ; **WF2-2** dry hop « jour à fixer » sans geste |
| C. Conditionnement (2 fûts) | Brassins, fiche, Conditionner, F-005, F-006, Conditionner 40 L : **6** | INP ≤ 320 | fûts « plein » + lot + bière ; « Encore en cave F-005, F-006 · Livrer › » ; reste ≈ 56 L en direct | seuls les fûts propres sont proposés (2 sur 4 utiles, 2 « lavage » muets) ; bouteilles : curseur 0–300 ou ±1 ; **WF2-9** statut resté « Garde froide » |
| S. Stock produit | 0 de plus sur la fiche ; Stocks : aucun produit fini (WFV-6, déjà connu) | — | fûts accrochés au lot | reste à vendre : choix B1 tranché, rien de neuf |
| M. Coût et marge | Brassins, Voir les mesures, Dossier, Budget : **4**, pour lire « ? CHF/L » | INP 600 (Dossier), 360 (Budget) | impôt sur la bière calculé (0,08 / 33 cl) | **WF2-8** : « Coût du brassin pas encore chiffré » alors que malt, houblon et levure ont un prix au stock (≈ 72 CHF, estimé) ; marge impossible ; **WF2-3** lenteur |
| R. Recherche « Cigogne » | loupe + frappe : **1** + saisie | INP **552** à la frappe | 4 résultats : client et ses 3 ventes | **WF2-4** lenteur ; Hotte (B10) non rejouée |
| H. Hors ligne | réseau coupé (CDP), puis Brassins | — | — | **WF2-5** : onglet non encore ouvert « Impossible de charger cet écran » ; rechargement hors ligne = page d'erreur de Chrome ; aucun précache |
| I. Inventaire (rare, annuel) | Stocks, Recompter, Compter (par rayon), « il en reste » tapé par article, Enregistrer : 12 articles en 6 rayons ≈ **38** (compté sur l'écran joué) | INP ≤ 280 | compteur « 0/4 comptés » par rayon | chaque article se tape, même juste |
| K. Clôture, TVA (rare, annuel) | Finances, Annuel, Continuer : **3** jusqu'à l'étape 1/9 | INP ≤ 112 | TVA : « non assujetti · 0,8 % » du seuil suivi seul | pas de « clôture du mois » : le mois se revoit par « Revoir le mois » ; 9 étapes non jouées au bout (REPRISE) |
| E. Entretien (étalonner) | Stocks, Matériel, Étalonner, valeur lue (2), Étalonné : **6** | INP 408 à l'ouverture | prochain rendez-vous calculé (21.12) | **WF2-6** : deux étalonnages en retard, le Bord dit « 0 à faire · Aucune tâche prévue » |
| P. Commande récurrente d'un pro | Clients, La Cigogne, Facturer : **3**, client et bière posés ; + 2 fûts + Facturer = **6** (compté ; 8 par + › Vente) | INP ≤ 88 | caisse ouverte sur le client | « Comme d'habitude » = v12, **refusée** (« Non ») : non reproposée ; **WF2-7** date ISO |
| N. Nouvelle recette depuis une ancienne | Recettes, fiche, Modifier : **3**, ouvre la recette elle-même (étape 1/7) | INP 344 | — | aucun « Copier en nouvelle recette » sur la fiche ; le « copier » du menu Plus de l'assistant non joué (REPRISE) |
| A. Réassort d'un fournisseur | Stocks, Courses : « 2 manquent · rien cette semaine » | — | — | WFA-1 (connu) ; l'historique à lignes de ZZ TEST Brouwland n'est relu nulle part ; G1 reste non jouée |

## 2. Moins de gestes : chaque version classée, mesurée ou comptée, puis fusionnée

Comptes « avant » : joués ici (fixture ZZ TEST) ou comptés le 20.11 (`2026-11-20-moins-de-gestes/MESURES.md` ; données de ce banc
écartées, comptes de gestes gardés). « Après » : estimé. Chaque suite posée seule reste dite, avec Annuler (R1).

| Version (son rang, son mot) | Avant | Après | Fréquence (estimée) | Gain | Devient |
|---|---|---|---|---|---|
| v03 (1) houblon du style, ton stock d'abord, au moment et à la dose qui tient l'IBU, α du lot | 5 touchers + 2 saisies par houblon, α vide (compté 20.11) | 1 toucher, dose réglable | chaque recette | −85 % ; α ressaisi supprimé | **N1** avec K8 |
| v02 (3) une puce « pour ce style » par étape (« Non mais les avoir en suggestions comme le caramunch 2 ») | idem, étape par étape | 1 par ingrédient proposé, jamais l'étape entière | chaque recette | idem v03, sur malts et levure | **N1** (forme : suggestion par ingrédient, pas remplissage d'étape) |
| v05 (4) levure du style en stock, dose écrite | 3 touchers + 1 saisie (compté 20.11) | 1 | chaque recette | −75 % | **N1** |
| v04, seul « une quantité qui fait sens » | malt du stock entré à 0 kg (joué, passe 1) | quantité posée | chaque recette | blocage du lancement impossible | **N1** (= P3 passe 1) |
| v06 (2) sels du profil du style sur ton eau | sels à 0 g, chaque sel tapé : ≈ 6 (compté) | 1, chaque sel réglable | chaque recette | −83 % | **N1** (eau non rejouée : REPRISE) |
| v07 (2) rebrasser : relier au stock d'un toucher, dose recalculée à l'α du lot | 4 touchers + 8 liaisons (compté 20.11) | 2 | chaque rebrassage, mensuel | −83 % ; dose fausse à α changé rendue visible | **N3** |
| v09 (3) jour J : commencer d'office, « Tout pesé », eau d'empâtage calculée pour 67 °C | 5 touchers + ≈ 3 par densité (compté 20.11) ; joué : 4 jusqu'au compagnon, eau proposée 55 °C | 3 | chaque brassin | −40 % ; température d'eau fausse évitée | **N2**, après WF2-1 |
| v10 (3) remplir les fûts qui tiennent le volume | joué : 6 pour 2 fûts ; 4 fûts utiles pour 96 L, 2 à laver muets | 3, lavage compris | chaque brassin mis en fût | −50 % ; lot à moitié tiré évité | **K7** élargie |
| v11 (2) « ses fûts sont revenus » d'un toucher | 4 pour un fût (mesuré passe 1, V4) ; 3 par fût ensuite | 3 pour tous | chaque tournée de retour, mensuel | −75 % à 3 fûts | **N4** (repêche P5 vendre) |
| v14 (2) poser le brassin pose sa suite (fermenteur libre, fin, garde, mise en fût) en « proposé » | ≈ 4 pour le brassin, puis chaque étape à part (compté 20.11) | 1 + un toucher « garder » | chaque brassin | oubli de garde ou de cuve impossible | **K2** et **K3** élargies (« Mais pas vraiment pas bone vue du calendrier ? » : la vue reste la sienne, seul le mécanisme se porte) |

Restent écartées comme il l'a dit : v01, v08, v12, v13 ; v04 hors la quantité.

## 3. Propositions nouvelles (GAIN.md, cinq points)

- **N1 — Un ingrédient proposé par le contexte se pose juste d'un toucher** (R8, R1). Houblon, malt, levure, sels : moment, dose qui
  tient la cible (IBU, OG, profil), α et prix du lot en stock, ton stock d'abord. Recette type ≈ 34 gestes → ≈ 14 (estimé, −59 %).
  Chaque recette, mensuel. Coût : une puce par ingrédient proposé ; retire la saisie d'α et de dose. Fusionne v02, v03, v04, v05, v06, K8.
- **N2 — Le jour J pose ce qu'il sait** (R1, R8) : jour du lancement, pesée d'un toucher, eau d'empâtage à la température calculée.
  Après WF2-1 seulement : la chaîne ne passe pas le 1er pas aujourd'hui.
- **N3 — Rebrasser relie la recette au stock** (R8) : 12 → 2 ; une ligne douteuse reste à lui.
- **N4 — Le retour des fûts se fait depuis le client** (R1) : tous les fûts chez lui, date du jour, un fût absent se décoche ; 3 par fût → 3.
- **N5 — Le relevé de densité part de la prévision du jour** (R3, R8). Joué : 12 gestes pour 1,022 → 1,014 (8 crans d'un millième) ;
  le curseur partant de la courbe prévue (≈ 1,013 à J+14, estimé) : ≈ 4 (−67 %). Plusieurs relevés par brassin : hebdomadaire. Coût : aucun
  élément ; la valeur de départ change, marquée « prévu ». Proposition neuve, hors de ses exemples (test de généralisation de R8).
- **N6 — Le coût du brassin se chiffre au prix du stock, la marge se lit** (R1, R8 ; élargit K3 et K8). Joué : 4 gestes pour lire « ? CHF/L »
  sur un brassin dont tous les ingrédients ont un prix. Après : coût « estimé » au déstockage, coût du litre et reste par 33 cl au même
  endroit, la facture le remplace (B5). Chaque brassin. Gain : marge vendue à perte rendue visible (impossible aujourd'hui).
- **N7 — L'inventaire confirme d'un toucher ce qui est juste** (R2, R5). Chaîne rare (clôture annuelle, étape 3) : filtre de la passe 2,
  gain sur la durée et le risque. ≈ 38 gestes pour 12 articles → ≈ 20 (−47 %) ; seul l'écart se tape ; un article non compté reste
  « non compté », jamais 0. Coût : un ✓ « comme en stock » par ligne.

**Repêchages** (des 19 gimmicks et 5 non établies) : P5 vendre → N4 (mesurée : 4 gestes pour un fût, joué). Les autres restent dehors,
avec leur raison : « Livrer un fût prépare sa vente » = v13, refusée ; « Commander chez <fournisseur> » (G1) : l'historique existe mais
la commande n'a toujours pas de geste à mesurer ; WFX-7 vue client : aucune chaîne ; gimmicks 15 et 16 : l'étalonnage fait 6 gestes et les
échéances existent au Bord (« 6 points à suivre ») ; le défaut est WF2-6, un bug, pas une proposition.

## 4. Quatre regards (sur ce qui a été joué)

1. **Brasseur** (PORTRAIT) : il garde l'alcool qui suit la densité et les fûts qui s'accrochent au lot (« Rien à saisir ») ; il bute sur
   « ? CHF/L » quand tout a un prix, sur huit crans d'un millième, et sur le compagnon qui tombe au premier pas un jour de brassage.
2. **Interaction** : le compagnon et la feuille de conditionnement suivent R3 ; la bouteille se règle à ±1 sur 300 (curseur sans saisie
   visible) ; le dry hop est écrit « à fixer » sans geste.
3. **Intégration** : fûts → lot tenu ; stock → coût du brassin rompu (WF2-8) ; matériel → Bord rompu (WF2-6) ; client → caisse tenu.
4. **Performance** (×4, majorée) : Dossier 496 à 600 ms, recherche 552 ms, Commencer le brassage 384 à 496 ms : au-dessus de 200 ms.

## 5. Non joué (voir `REPRISE-passe2.md`)
Jour de brassage après le 1er pas (WF2-1), eau et sels dans l'assistant, clôture étapes 2 à 9, copie d'une recette, réassort par
la commande, hors ligne sur le build de production. Aucun nouveau choix de goût mis en page : les axes ouverts sont listés dans la REPRISE (« à dessiner »).
