# Test en ligne, passe 5 : 20.11, https://brasserie-l-affinee.web.app/ (tag en-ligne/2026-11-20-tour4, assets/index-Cau4r--m.js)

Méthode : Claude in Chrome (session du brasseur, connectée à Google, rien saisi). Banc : iframe `srcdoc` de même origine servie depuis `/brew-alerts-sw.js`, tailles 390×844, 844×340 et 1280×800 (iframe mise à l'échelle), thème par `localStorage['laffinee.theme']` (clair / cave). Gestes par clics réels (coordonnées) quand le clic JS ne suffit pas (feuilles, fiches, menu +), sinon par le DOM.

Rejeu : les 222 lignes passées « corrigé » ou « déployé » au registre depuis la passe 4 (c3d2ed733), toutes avec un commit présent dans le tag tour4 ; plus la carte Ma levure et la règle « chaque geste décompte ce qu'il use ».

Limites du banc (doutes, non comptés) :
- **Aucune capture possible** : dès le 3e appel, `Page.captureScreenshot` expire (30 s) sur deux onglets neufs, même iframe masquée et fenêtre redimensionnée. Le JS de la page répond. Les constats de cette passe viennent donc du DOM (textes, boîtes, recouvrements mesurés), sans regard sur les couleurs : contraste, police, teinte (BK2-1, BK2-6, BR-100, BE-53) non jugés. Contrôle de contraste automatique essayé puis écarté (mesures incohérentes pendant les transitions de thème).
- Le premier clic réel après un chargement est encore perdu de temps en temps (vu sur Ttt et Nelson Sauvin) ; le second passe.
- La fenêtre Chrome reste à 628 px de large ; 844 et 1280 sont des iframes réduites (0,74 et 0,49).

## Tableau

| Écran | 390 clair | 390 sombre | 844×340 clair | 844×340 sombre | 1280 clair | 1280 sombre |
|---|---|---|---|---|---|---|
| Calendrier : axe, frise, détail d'un brassin | OK T2-1, T2B-2 (une seule rangée S47…S52) ; Ttt s'ouvre au toucher (T2-2) ; retard « pas brassée » sur la frise (PC-151) ; Papiers « −600 » (PC-153) | non vu (pas de capture) | OK détail sous l'en-tête collant (PC-149 : en-tête 83 px, détail à 205) ; menu + entier et défilant (T3B-1 : 8 → 288 sur 340) ; T2-5 non jouable (plein écran) | menu + OK | non joué | non joué |
| Calendrier : Liste | OK : + ne couvre rien (T3B-2, PC-62, PC-154) ; « En retard » sans redite (PC-160) | OK | OK + ; 2 à 3 lignes au repos, 6 en défilant, en-tête non collant (PC-152) | OK + | — | — |
| Calendrier : échelle | « Échelle Mois : période 3 mois → 6 mois, Finances aussi » (PC-159 OK) | — | — | — | — | — |
| Finances › Opérations | KO T4-1 (+ sur « À confirmer », « 4 000,00 ») ; oct. « 0 opération » = liste vide (T2-3) ; Tout : Apports +8 290,00 = section (T3-8) | KO T4-1 (« 1 500,00 ») | KO T4-1 (« Vêtements… vertbaudet ») ; opérations visibles sans défiler (T3-9) | idem | OK | OK |
| Finances › Synthèse, Prévisions, Annuel | KO T4-1 (Synthèse : « 5 paiements historiques à confirmer ») | idem | OK ; Annuel KO T4-1 (« 4 000,00 ») | idem | OK | OK |
| Finances › dépense ZZ TEST à payer 1,00 | OK : « Mon mois −1,00 » (T3-7) ; la feuille se ferme, « Achat enregistré. » (T3-6) ; fiche « Confirmer le paiement » (T2-4) ; payé ; « Modifier » sans date ISO (BE-67) ; retiré | — | barre Annuler / Enregistrer sous le contenu (BE-68) | — | BE-68 OK (Drive 605, barre 635) | — |
| Stocks › Courses, Articles, Fûts, Houblons | Courses : recettes sans doublon (T3-5), « Rien à commander » absent, défilement par la fenêtre (T2-6, T2-7) | OK | OK | OK | KO T4-1 (Courses : + sur « 2 L », « à définir ») | OK |
| Stocks › Fûts : marquer propre puis Annuler (ZZ) | OK : 500 g → 490 g, puis « Annulé : le stock est rendu et le fût est remis à laver » ; KO T4-7 (5 questions de dose à la suite) | — | — | — | — | — |
| Stocks › Houblons › Sources | OK : 8 boutons, « Gérer » sous repli, aucun jargon (T3B-4, TE-52, BK2-4) | — | — | — | — | — |
| Recette Milk Stout (feuille, fiche, Simuler) | OK : IBU 31, houblons Target et EKG seuls, « Brassins 1 » (T3B-11) ; Simuler ne demande que la cible (T3B-6, TL-27) ; « minutes avant la fin » (BK2-3) ; KO T4-4, T4-5 | — | — | — | — | — |
| Éditeur (brouillon ZZ) : Identité NOLO, Malts/sucres | OK : NOLO sans dépliant, sans « SG », un objectif (T3B-7, TE-15, TL-7) ; famille en mots (T3B-9, BR-19) ; « coriandre » → épice, hors grain (T3B-8, MV-8) ; section Additifs (BK2-5) ; « Brouillon repris… Repartir d'une recette vierge » (TL-19) | — | — | — | — | — |
| Éditeur › Ma levure | repos, − / + (1, 2, 3, 2 g), changer (Voss, LalBrew Windsor), hors catalogue (« ZZ TEST — levure passe 5 · Hors catalogue · saisie libre ») : OK ; KO T4-2, T4-6 | — | — | — | — | — |
| Vendre | 75 cl : « tarif à corriger · 759,33 CHF le litre » (T3B-13, LR3-NOTE-1) | — | — | — | — | — |
| Carnet (Matériel) | Carnets vides : phrase sans « on le surveille », carte exemple (PCN-57, PCN-125, PCN-166) ; À venir : un seul +, pas de « Ouvrir le carnet » répété (PCN-39) ; KO T4-3 | — | — | — | — | — |

## Combien et quels problèmes ? 7 (3 rouverts, 4 neufs)

1. T4-1 : le + flottant cache des montants au repos hors du calendrier et des Courses : Finances › Opérations 390 (« À confirmer », « 4 000,00 », « 1 500,00 »), 844×340 (« Vêtements et sous-vêtements… · vertbaudet ») ; Synthèse 390 (« 5 paiements historiques à confirmer ») ; Annuel 844 (« 4 000,00 ») ; Stocks › Courses 1280 (« 2 L », « à définir », la gouttière de T3-10 ne vaut que sous 1024 px). En fin de défilement, rien n'est caché.
2. T4-2 : Ma levure : « pas de conseil · fiche absente » pour LalBrew Windsor choisie au catalogue (et pour le Windsor du stock), alors que la même carte affiche « fiche · conduite 15–25 · 19 °C » ; aucune dose proposée pour une levure dont le fabricant publie la dose (suite de LEV-6).
3. T4-3 : Matériel › À venir, « Les suivants » : « 2 achats · 1 550 », « 350 », « 1 200 » sans CHF, sous « 3 200 CHF TTC, au moins » (PCN-40 sur un autre écran).
4. T4-4 (rouvre T3B-12) : Milk Stout : « Rstgerste (orge torrfie) » reste sans accents sur la feuille et la fiche ; « Caramnch Typ 2 » sur la feuille, « Caramünch Typ 2 » sur la fiche (deux noms pour un malt).
5. T4-5 (rouvre TL-10) : un malt Weyermann reste sans couleur : fiche Milk Stout « EBC — · Couleur EBC manquante sur … Caramünch Typ 2 — elle figure sur la fiche technique du malteur » ; à l'ajout, « Carahell », « Munich », « Melanoidin » ne proposent que « Créer … (stock à zéro) », sans couleur ni potentiel.
6. T4-6 (rouvre T2B-3) : retour sur Levure : Paliers → Levure 8,0 s, Houblons → Levure 5,3 s, Eau → Levure 0,76 s (390, iframe, PC ; même ordre qu'en passe 3).
7. T4-7 : Fûts › Marquer propre enchaîne cinq questions de dose, une par produit (Soude, Acide phosphorique, Désinfectant, Star San, PBW), et les repose à chaque lavage tant qu'on répond « Pas maintenant » ; sans dose, rien n'est décompté et aucun Annuler n'est offert. Une fois la dose retenue, le décompte et l'Annuler marchent (500 → 490 g, rendu).

Vérifiés justes (47) : PC-4, PC-62, PC-149, PC-151, PC-152, PC-153, PC-154, PC-159, PC-160, T3B-1, T3B-2, T2-1, T2-2, T2B-2, T2-3, T2-4, T2-6, T2-7, T3-5, T3-6, T3-7, T3-8, T3-9, BE-67, BE-68, T3B-4, TE-52, BK2-4, T3B-6, TL-27, BK2-3, T3B-7, TE-15, TL-7, T3B-8, MV-8, T3B-9, BR-19, BK2-5, TL-19, T3B-11, T3B-13, LR3-NOTE-1, PCN-39, PCN-57, PCN-125, PCN-166.

## Non rejoués (motif)

- Sans capture (banc) : BK2-1, BK2-2, BK2-6, BR-100, BE-53 (police, teinte, contraste).
- Gestes de glisser au calendrier sur données ZZ (PC-126, PC-145, PC-146, PC-155, PC-161) ; ventes absentes en ligne (PC-150, PC-157, PC-158) ; chevauchement des rangées (PC-147 : 2 barres seulement repérées, preuve trop faible) ; PC-156 (le détail d'un brassin n'a pas « Libre de la semaine ») ; T2-5 (plein écran refusé par le banc).
- Carnet : 0 carnet en ligne ; en créer un fait ranger par l'IA (Gemini facturé, interdit) : PCN-1 à PCN-189 hors PCN-39, 57, 125, 166.
- Dépense, lecture IA (LR1-*, LR2-*, LR3-3, LR3-4, M9-3, B2-NOTE-7) : envoi IA interdit.
- Fiche Nelson Sauvin (T3B-5, TE-49) : liste virtualisée, fiche non ouverte au banc.
- Atelier R&D et budget (TE-35, BR-27, BE-27), Houblons de l'éditeur (TE-27), alerte d'eau (TL-16), planifier depuis la feuille (T2B-1), conduite d'un brassin réel (RJ-14), DDM (AM-56 : aucune levure datée), T2-8 (calcul interne) : non joués.

## Données ZZ TEST

- Écriture « ZZ TEST — passe 5 dépense » (1,00 CHF à payer, Brassage, sans pièce) : créée, payée (« ✓ Payer 1,00 », banque), retirée (« Retirer cette écriture » › « Confirmer le retrait ») : payé revenu à 265,40, à payer 0,00.
- Fût « F-005 · ZZ TEST — passe 5 fût » (20 L) : ajouté, remis à laver, marqué propre deux fois (doses réelles : « Pas maintenant » à chaque fois), Annuler, puis retiré du parc.
- Article « ZZ TEST — passe 5 nettoyant » (Désinfectant, g) : créé, compté 500 g, dose 10 g retenue, décompté puis rendu, supprimé (« Supprimer l'article »).
- Brouillon « ZZ TEST — Nuage Banane — Hefeweisse passe 4 » (resté sur l'appareil depuis la passe 4) : levure hors catalogue « ZZ TEST — levure passe 5 », puis « Abandonner » › « Supprimer ce brouillon ? » › Abandonner ; plus aucun brouillon ZZ dans le stockage local.
- Ouverts puis fermés sans geste : feuilles « test nolo2 », « Milk Stout », Vendre (panier vide). Échelle du calendrier essayée (« Mois »), revenue à 6 sem. Thème laissé à « clair ».
- Aucune donnée réelle modifiée, aucun envoi à l'IA, aucune suppression hors ZZ.
