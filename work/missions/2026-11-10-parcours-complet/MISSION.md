# Parcours complet sur la vraie app (10.11)

Ses mots : « Le workflow au total a été testé ? Création de recette, met à jour les stock et besoin. Achat du matériel, met à jour le
stock, brassage, met à jour les stock. Vente, met à jour les finances de même que tout les autres steps » ; « Sur la vrai app ».

Réponse honnête au 10.11 : non. Les jeux en ligne précédents ont testé écran par écran (`2026-11-08-test-en-ligne-ecrans/RAPPORT.md`) et
la Dépense, jamais la chaîne entière avec ses effets d'un module sur l'autre.

## Ce qu'on joue (https://brasserie-l-affinee.web.app, tag en-ligne/2026-11-10-compta9, bundle index-DP0sAjrq.js)
Toutes les données créées portent « ZZ TEST — parcours 10.11 » ; aucune donnée réelle n'est modifiée ; à la fin, chacune est retirée,
et le retrait est vérifié (stock, besoins, finances revenus à l'état de départ).
1. **État de départ** : relever le stock, les besoins (achats à prévoir) et les finances du mois (Synthèse, Opérations) qui seront touchés.
2. **Recette** : créer « ZZ TEST — parcours 10.11 » avec des articles ZZ TEST (malt, houblon, levure) créés pour l'occasion, ou des
   quantités assez petites pour ne pas fausser le stock réel s'il faut des articles existants. Vérifier : les besoins se mettent à jour
   (ce qui manque pour brasser).
3. **Achat** : une dépense ZZ TEST (saisie sans justificatif) des articles manquants, Confirmer. Vérifier : le stock monte de ces
   quantités, les besoins baissent, les finances (Opérations, Synthèse, Prévisions) montrent la dépense.
4. **Brassage** : préparer un brassin de la recette ZZ TEST, le conduire jusqu'à la fin (ou la consommation des ingrédients). Vérifier :
   le stock baisse exactement des quantités de la recette ; le lot existe.
5. **Vente** : encaisser une vente ZZ TEST (client ZZ TEST) de ce lot. Vérifier : finances (Opérations, Synthèse, Annuel, impôt bière si
   concerné), stock de produit fini s'il existe.
6. **Retrait** : supprimer chaque donnée ZZ TEST (vente, brassin, dépense, recette, articles, client) par les gestes de l'app ; vérifier le
   retour à l'état de départ relevé en 1. Un effet qui ne revient pas est un défaut.

À chaque étape : capture, chiffres attendus contre chiffres lus, champ par champ (L28). Un effet manquant, un chiffre faux, un renvoi
mort : défaut, bloquant ou non.

## Méthode et garde-fous
- Méthode, scripts et connexion des jeux en ligne de la Dépense : `work/missions/2026-11-09-depense-totaux/critique/VERDICT-EN-LIGNE-9.md`
  et `critique/en-ligne/jouer10*.mjs` (navigateur connecté). 390 tactile d'abord, 1280 pour vérifier ce qui le demande.
- Jamais « Confirmer » ni « Enregistrer » sur une donnée réelle ; seulement sur ZZ TEST. Aucune lecture Gemini (saisie sans justificatif).
- Aucune donnée réelle dans Git ; captures dans `work/missions/2026-11-10-parcours-complet/captures/` (montrent des données ZZ TEST).

## Rendre
`work/missions/2026-11-10-parcours-complet/VERDICT.md` : pour chaque étape, attendu / lu / OK ou défaut ; puis « combien et quels
problèmes », liste numérotée, bloquant ou non ; l'état du retrait (tout retiré, ou ce qui reste, avec son identifiant).
