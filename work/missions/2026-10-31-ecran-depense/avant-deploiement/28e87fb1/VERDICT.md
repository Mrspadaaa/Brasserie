OK — 9 problèmes, 3 bloquants

# Test d'écran — Finances, 8 vues portées (m1do-a, m1ar-c, m3pr-c, m3pm-d, m3im-c, m4bb-a, m4pf-c, m4ia-c) et FN-2 à FN-12

Version : 28e87fb1 (arbre propre). Banc local `?dev-local&finance-demo` (profil : `=reel` et démo), profil Chrome neuf par scénario,
requêtes hors localhost coupées (Gemini jamais joint). 390 tactile et 1280, clair et sombre (`cave`). Scripts `capturer.mjs`
(9 scénarios × 4 réglages) et `apport.mjs` ; textes et champs dans `textes.json` et `apport.json`. Aucune erreur de page.
Rien d'enregistré hors du navigateur de test. Captures comparées à `work/missions/2026-11-14-finances/voies/<m1|m3|m4>/<id>/<id>.png`.

| capture | thème | largeur | état | problèmes | bloquants |
|---|---|---|---|---|---|
| dbl-repos-390-clair.png | clair | 390 | Doublons, la paire au repos | 1 | 0 |
| dbl-annule-1280-clair.png | clair | 1280 | après « Annuler celle-ci » | 0 | 0 |
| arc-repos-390-clair.png | clair | 390 | Les archives, rien rangé | 1 | 0 |
| arc-consulte-1280-clair.png | clair | 1280 | après Ranger 2024 à 2025, Consulter 2024 | 0 | 0 |
| fn2-avis-390-clair.png | clair | 390 | rangée après « ✓ Payé » (avis Annuler · Autre montant) | 0 | 0 |
| fn2-autre-390-clair.png | clair | 390 | « Autre montant » → Payer l'Atelier | 0 | 0 |
| fn2-autre-1280-clair.png | clair | 1280 | Payer ouvert depuis l'avis | 0 | 0 |
| pr-rempli-390-clair.png | clair | 390 | Prévoir une dépense, Loyer 500,50, Chaque mois | 1 | 0 |
| pr-rempli-1280-clair.png | clair | 1280 | même état | 1 | 0 |
| pm-pret-390-sombre.png | sombre | 390 | Projet Fermenteur, « Prêt à acheter » touché | 0 | 0 |
| im-ouvert-390-clair.png | clair | 390 | Cuve de fermentation (Annuel › 4) | 1 | 0 |
| pfd-ouvert-390-sombre.png | sombre | 390 | Solde et paramètres (démo) | 2 | 1 |
| bb-repos-390-clair.png | clair | 390 | Budget du brassin Pale Ale | 1 | 1 |
| bb-c3a-390-sombre.png | sombre | 390 | c3a « ton litre » à un toucher | 0 | 0 |
| bb-repos-1280-clair.png | clair | 1280 | Budget du brassin | 2 | 2 |
| ia-feuille-390-clair.png | clair | 390 | Compagnon, feuille m4ia-c | 0 | 0 |
| ia-chat-390-clair.png | clair | 390 | après « Envoyer » | 1 | 0 |
| apport-apres-390-clair.png | clair | 390 | Apport 500, Enregistrer sans motif | 1 | 0 |
| fiche-apport-390-clair.png | clair | 390 | fiche de l'apport enregistré (FN-11, FN-12) | 0 | 0 |

Bloquants : 3

## Problèmes

1. **Budget d'un brassin à 1280 : illisible** (bb-repos-1280). Tout le contenu de la feuille tient dans une colonne d'environ 140 px
   collée à droite, le reste de la feuille est vide ; libellés coupés (« É. », « N », « I.. », « C.. », « U. », « stock + … », « h… »),
   « 30 L brassés · 27 L nets » sur quatre lignes, chiffres du graphique qui se chevauchent (« 64 », « 26= », « 116,10 » coupé).
   Bloquant (texte illisible).
2. **Budget : le bouton « Enregistrer » de m4bb-a manque** (bb-repos 390 et 1280) : il ne reste que « Expliquer » et « Prévoir 64,26 ».
   Bloquant (élément de sa maquette absent).
3. **Profil : valeur fausse** (pfd-ouvert-390-sombre). Avec 1 200 L/an saisis : « soit — aucun brassin planifié » et « Prochain brassin
   — coût à compléter », alors que m4pf-c montre « ≈ 67 brassins de 27 L » et « Pale Ale ≥ 7,51/L », et que Prévisions (« brassin
   −64,26, 20.11 ») et le budget (« brassage 20 nov. », 7,51 CHF/L) ont bien un brassin. Bloquant (valeur fausse).
4. Profil et Bien amorti : montants sans séparateur ni format de la maquette : « 4000,00 CHF » (m4pf-c : « 3 250,00 »), « 1800 » et
   « 1440 » dans Prix d'achat et Valeur 1er janv. (m3im-c : « 1 800,00 », « 1 440,00 »).
5. Compagnon : « Envoyer » n'envoie pas (ia-chat). Il ouvre le chat et remplit le champ, qui commence par la consigne technique
   « Contexte choisi par le brasseur : tout l'historique. N'utilise pas : les archives, les projets de matériel… » ; la question
   « Pourquoi les charges fixes… » est sous le pli du champ ; il faut retoucher un second « Envoyer ». Pas pratique.
6. Apport : sans motif, « Enregistrer l'apport » ne fait rien dans l'app ; seule la bulle native du navigateur « Veuillez renseigner
   ce champ » s'affiche, posée sur le justificatif (apport-apres-390-clair). Ni le message ni l'obligation ne sont dans m5ap-a.
7. Prévoir une dépense : l'étiquette « −500,50 » du premier paiement est posée sur la marche de départ, collée à l'axe « 4 000 », se lit
   mal (390 et 1280).
8. Archives : le titre « Les archives » a perdu l'icône de boîte de m1ar-c (arc-repos).
9. Doublons à 390 : le statut est coupé « ✓ payé aujourd'hui · ba… » ; m1do-a l'affiche entier (« ✓ payé 16 oct. · banque »).

## Doutes (non comptés)

- Budget : la Pale Ale de démo n'a « aucun houblon ni levure » ; l'écran le dit honnêtement, mais une Pale Ale sans houblon ni levure
  n'existe pas : vérifier la recette de démo. « Pale Ale de septembre » brassée le 20 nov. ; Pilsner 6 kg à 44,83 (7,47 CHF/kg) cher.
- Projet matériel : après le toucher « Prêt à acheter », le rond courant reste sur « À étudier » ; mon clic a pu viser un autre
  élément du même texte.
- Payer : la barre dit « loyer 400,00 » (premier mot en minuscules, ce que FN-4 visait) ; une seule pièce cochée ici, donc FN-3 et
  FN-4 non départagés.
- Archives : 2024 (1 pièce) et 2025 (2 pièces) ont des barres quasi plates face aux 12 de 2026 ; juste, mais la frise se lit mal.
- Après l'apport, Opérations ajoute une barre « Apports +500,00 » à côté des Ventes.

## FN rejoués

- FN-2 corrigé : « ✓ Payé » laisse l'avis « Payé 400,00 · Annuler · Autre montant » ; « Autre montant » ouvre Payer l'Atelier (deux
  pièces, l'ancienne décochée « pas dans ce virement »), « ✓ Payer 400,00 » ferme la feuille.
- FN-8 corrigé : Modifier du Malt et houblons montre « Comptoir du brasseur » dans Fournisseur.
- FN-11 et FN-12 corrigés : fiche de l'apport « Apports privés · 500,00 · ✓ encaissé », sans « Échéance et prévision » ni
  « À encaisser », avec « Corriger une erreur de saisie ».

## Non vus

- 1280 sombre : capturé (`*-1280-sombre.png`, textes dans `textes.json`), non ouvert en image.
- FN-5 (pastille « Autres frais ») : la catégorie n'a pas été touchée par le script. FN-6, FN-7, FN-9, FN-10 : ni annulation de
  paiement, ni virement sur plusieurs pièces enregistré, ni second Modifier joués.
