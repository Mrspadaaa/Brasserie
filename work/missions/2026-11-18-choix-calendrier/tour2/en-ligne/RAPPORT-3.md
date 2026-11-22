# Test en ligne, passe 3 : 19.11, https://brasserie-l-affinee.web.app/ (tag en-ligne/2026-11-19-tour2)

Méthode : Claude in Chrome (session du brasseur, connectée à Google, rien saisi). La fenêtre Chrome reste à 2560 × 1305 (`resize_window` sans effet) : tailles émulées par une iframe `srcdoc` de même origine (base `https://brasserie-l-affinee.web.app/`), servie depuis l'onglet `/brew-alerts-sw.js` pour ne pas faire tourner une deuxième app. La taille se change en redimensionnant l'iframe (sans recharger) ; le thème par `localStorage['laffinee.theme']` (clair / cave), relu par l'app à l'événement `storage`. Clics réels par coordonnées (souris, pas de toucher émulé : l'iframe ne permet pas l'émulation tactile). Captures regardées en zoom.

Limites du banc (doutes, non comptés) :
- Le premier clic réel après le chargement de l'iframe est perdu (pointerdown sur le bouton, pointerup sur la barre de titre, aucun `click`) ; le deuxième passe. Vu 3 fois (barre Ttt, Plein écran ×2). À rejouer sur un vrai téléphone avant d'en faire un défaut.
- Le plein écran est refusé par Chrome dans l'iframe pilotée (même avec `allow="fullscreen"`, activé au clavier) : « plein écran puis retour » n'est pas jouable ici.
- Après plusieurs ouvertures de l'app dans le même onglet, le moteur de rendu s'est figé (> 2 min, onglet fermé) ; dans le second onglet, Finances › Opérations a eu des tâches longues de 11 à 15 s environ 1 min après l'ouverture (« Préparation du registre comptable… »). Banc chargé (plusieurs instances successives) : à mesurer sur téléphone.

## Tableau

| Écran | 390 clair | 390 sombre | 844×340 clair | 844×340 sombre | 1280 clair | 1280 sombre |
|---|---|---|---|---|---|---|
| Calendrier : axe | KO T2-1 / T2B-2 (« déc. » seul en haut, semaines dessous) | KO idem | KO idem (« déc. », « janv. » en haut) | KO idem | KO idem | KO idem |
| Calendrier : toucher un brassin | OK : Ttt (2e clic) et ZZ TEST (1er clic) ouvrent leur détail ; T2-2 infirmé ; détail KO T3-1, T3-2 (Ttt) ; détail ZZ TEST OK | OK (même détail, lisible) | non rejoué | OK : détail ZZ TEST ouvert, mais l'en-tête collant en cache le haut (voir T2-5) | OK (ouvre la page du brassin) | non rejoué |
| Calendrier : frise | KO T3-3 (Emballage · Jhhh ×2) | KO T3-3 | KO T2-5 : frise à 164 px sur 340 (48 %) | KO T2-5 | KO T3-3 | KO T3-3 |
| Calendrier : plein écran + retour | Invitation « Tourne le téléphone : 13 semaines » OK ; plein écran refusé par le banc | non joué (même code) | KO T3-4 : aucun effet ni message | KO T3-4 | KO T3-4 (aucun effet, banc) | non joué |
| Finances › Opérations : période, « 0 opération », du/au | KO T2-3 (2560 px) ; « Tout » : KO T3-8 ; pas de du/au à 390 (T2-9 écarté) | KO T3-8 (idem, lisible) | KO T3-9 (le graphe remplit l'écran) | KO T3-9 | OK à 2560 : du/au présents | non joué |
| Finances › fiche à payer, paiement, retrait (2560 px, clair) | KO T2-4 : « Noter un paiement » (pas « Confirmer le paiement ») ; la feuille « Payer … ✓ Payer 1,00 » marche, nov. passe à « 1 opération, payé 1,00 » ; « Retirer cette écriture » (dans « Corriger une erreur de saisie ») demande confirmation, inverse le paiement, nov. revient à 0 | — | — | — | — | — |
| Carnet : Nouvelle dépense, justificatifs | OK (Documents, Saisir sans justificatif, formulaire) ; KO T3-6, T3-7 (2560 px) | OK | OK (4 champs au-dessus de la barre, défile) | OK | OK (2560 px) | OK |
| Stocks › Courses | KO T3-5, T3-10 (le + cache les quantités) ; T2-6 non reproduit | KO T3-5, T3-10 | KO T3-10 (133,7 g caché) | KO T3-10 | OK sauf T3-5 | non joué |
| Recette : Identité, Malts, Houblons, Levure, Eau | OK à l'œil (Identité, Houblons, Eau) ; KO T3-10 (le + sur « Suivant ») ; KO T2B-3 : Levure 7,9 / 5,6 / 3,7 s (Houblons 0,1 s, Eau 0,3 s, Malts 0,6 s, page directe) ; T2-8 non vérifiable à l'écran | OK (Identité, Levure) ; KO T3-10 | OK (Identité, peu de place sous la barre) | OK (Levure) | OK (Malts, Levure, Eau, Récap.) | non joué |
| Brassins › planifier depuis une recette | KO T2B-1, T3-11 : recette ZZ TEST neuve (5 kg Maris Otter, Windsor 1 sachet) : « Enregistrer et préparer un brassin » puis « Planifier quand même » refusés (« matériel pas figé ») ; après « Modifier la recette › Matériel › Adapter à mon matériel actuel », « Planifier quand même » crée le brassin (Brassins 17) ; KO T3-12 (suppression sans confirmation) | — | — | — | joué à 1280 clair | — |

## Combien et quels problèmes ? 12 neufs

1. T3-1 : Calendrier 390, détail d'un brassin (barre Ttt) : la phrase « pas brassée · brassage prévu le 8 sept. · prête le 4 déc. au plus tôt » est hachée en quatre colonnes (« pas brassée · brassage prévu » / « le 8 sept. · » / « prête » / « le 4 déc. au plus tôt »), illisible d'un coup d'œil.
2. T3-2 : même détail : « Brassage 8 sept. · pas brassée », puis « Fermentation 20 nov. », « Dry hop 22 nov. », « Garde 29 nov. », « Conditionnement 4 déc. » : un brassage passé non fait et des étapes recalées sur aujourd'hui, sans dire que le brassage est en retard ni le proposer à aujourd'hui.
3. T3-3 : Calendrier (390, 1280, clair et sombre) : la ligne « Emballage · Jhhh » paraît deux fois de suite dans la rangée Brassins.
4. T3-4 : Calendrier 844×340 : « Plein écran » quand le navigateur refuse le plein écran (iPhone Safari, iframe) : aucun effet, aucun message (l'invitation n'existe que téléphone droit, `EnTete.tsx` `telephoneDroit`). Le geste paraît mort.

5. T3-5 : Stocks › Courses : la ligne des recettes d'un article répète la même recette (Lotus et Flocons d'avoine : « neipa v3 prévu » sept fois, date sur deux seulement ; Malt Maris Otter : « Jhhh prévu le 05.09.2026 » deux fois), illisible.
6. T3-6 : Nouvelle dépense : après « Enregistrer », la feuille reste ouverte : « Confirmation de cette écriture en attente… vérifie la synchronisation sans la recréer », bouton « Vérifier la synchronisation », alors que l'écriture est déjà dans la liste (une fois, page figée pendant le clic).
7. T3-7 : Nouvelle dépense à payer de 1,00 : la pastille « Mon mois » dit « +1,00 » (signe d'un gain pour une dépense).
8. T3-8 : Finances › Opérations, période « Tout » (390, deux thèmes) : la barre « Apports » dit +800,00 alors que la section « Apports et prélèvements » totalise +8 290,00 (800 + 3 890 + 3 600, tous « Paiement à confirmer »).
9. T3-9 : Finances › Opérations 844×340 (deux thèmes) : le graphe des catégories occupe tout l'écran utile ; aucune opération visible sans défiler.
10. T3-10 : le bouton + flottant cache du contenu : Courses (quantités « 2 L », « à définir », « 133,7 g » à 390 et 844), éditeur de recette (bout de « Suivant — Paliers » à 390 sombre, à côté de « Suivant » à 844).
11. T3-11 : une recette neuve, créée dans l'éditeur, naît sur un matériel « cuve de 30 L / fermenteur 30 L » qui n'est pas le matériel actuel (Royal Catering · cuve 45 L, « à adopter ») ; elle ne peut pas être planifiée sans « Modifier la recette › Adapter à mon matériel actuel » (cause de T2B-1).
12. T3-12 : Brassin › « Plus » › « Supprimer ce brassin » supprime tout de suite, sans confirmation ni retour visible après 1,2 s (la recette, elle, demande « Supprimer cette recette ? »).

Défauts du registre : T2-1 et T2B-2 confirmés (toutes tailles, deux thèmes) ; T2-5 confirmé (48 %) ; T2-2 infirmé sur une barre normale (pas de barre minuscule à 6 sem.) ; T2-3 confirmé ; T2-4 confirmé (libellé) ; T2B-3 confirmé, plus lent (3,7 à 7,9 s) ; T2-6 non reproduit ; T2B-1 confirmé (cause T3-11) ; T2-2 infirmé (barre ZZ TEST, 1er clic) ; T2-7 (dette de code) et T2-8 (calcul interne) non vérifiables à l'écran. Le banc a figé l'onglet à trois reprises (deux dans l'iframe, une en page directe pendant Enregistrer) : à mesurer sur téléphone (T3-NOTE-1).

## Données ZZ TEST

- Écriture « ZZ TEST — opération à payer » (1,00 CHF, Brassage, autre, sans pièce) : créée, payée (« ✓ Payer 1,00 », banque), puis retirée (« Retirer cette écriture » › « Confirmer le retrait ») : paiement inversé, novembre revenu à 0 opération. Elle reste dans « Écritures annulées » (une écriture ne se supprime jamais).
- Recette « ZZ TEST — recette » (5 kg Maris Otter, Windsor) : enregistrée, adaptée au matériel actuel, planifiée (brassin LOT-020, 20.11), puis brassin supprimé (« Supprimer ce brassin ») et recette supprimée (« Supprimer cette recette ? » › « Supprimer la recette », journalisée) : Brassins 16, Recettes 23, aucun « ZZ TEST » au calendrier ni aux courses. Brouillon « ZZ TEST — brouillon » abandonné (« Supprimer ce brouillon ? » › Abandonner).
- Par erreur de clic, sans aucune action : la feuille « Brasser Jhhh » ouverte puis « Annuler » ; la fiche « stout amère » ouverte puis fermée.
- Aucune donnée réelle modifiée (Ttt, Jhhh, stout amère lus seulement), aucun envoi à l'IA, aucune suppression définitive. Thème de l'appareil laissé à « clair » (valeur d'origine).

## Non joués (à reprendre)

Plein écran puis retour (Chrome refuse le plein écran à la page pilotée : à jouer sur un vrai téléphone) ; toucher réel (souris seulement) ; 1280 sombre de Finances, Courses, Recette ; fiche d'opération à 390 et 844 (aucune pièce ZZ à payer gardée).
