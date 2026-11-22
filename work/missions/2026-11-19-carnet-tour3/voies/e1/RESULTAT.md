# Voie e1 — rejeu en ligne (19.11)

App https://brasserie-l-affinee.web.app, Chrome du brasseur, onglet propre (fermé à la fin). Fenêtre telle quelle :
viewport 2560×1249 px CSS (capture 1568×765), donc ni 1280 ni 390 exacts ; fenêtre non redimensionnée.
Contraintes constatées :
- **390 impossible** : l'iframe de même origine est refusée par l'app (cadre gris, icône de page bloquée,
  `contentDocument` nul) : en-tête anti-cadre. Toute vérification « 390 » est non jouable par cette méthode.
- **Carnets en ligne vides** : « Carnets 0 », « Réalisés 0 » ; toute création de carnet ou de ligne passe par l'IA
  (`VITE_CARNET_IA=production` au tag) : exige Gemini.
- Premier chargement : la synchronisation a figé l'onglet plusieurs minutes (« Synchronisation des données… », rendu sans réponse 45 s).

| id | verdict | observé (≤ 25 mots) | taille |
|---|---|---|---|
| TL-NOTE-6 | present (en partie) | Joué : Fermer n'enregistre pas (« Abandonner cette saisie ? Rien n'est enregistré »), Détail ≠ Total en direct, épingle et retrait OK. Copier : « Copie refusée ». Défaut neuf, voir plus bas. Non joué : TVA, Préparer un brassin, Budget, Suivre au stock, Associer un lot ; Faire relire exige Gemini. | 2560 |
| TE-NOTE-3 | non-jouable | Télécharger le PDF demande l'accord du brasseur (non donné) ; rien créé. | — |
| LL-8 | non-jouable | Exige Gemini : relire les 13 pièces et 5 tickets veut dire relancer leur lecture ; aucune n'est dans les opérations en ligne. | — |
| SU-NOTE-6 | non-jouable | Exige Gemini (lecture d'une pièce de plus de 4 pages, chronométrée). | — |
| BE-61 | obsolete | Plus de feuille « Préparer les impôts » : Annuel = « Clôture 2026 », 9 étapes en pages (« Préparer le dossier »), sans barre Annuler/Enregistrer. | 2560 |
| BE-62 | obsolete | Étape 7 « Vérifications » en tuiles, sans barre : « Situations particulières examinées · pertes passées, personnel… » entière et visible. | 2560 |
| BE-68 | corrige | Modifier (Brau- und Rauchshop) : « Drive · Avril › Brassage » en puce, bas 821 px, pied Annuler/Enregistrer dès 851 px ; rien dessous. Annulé. | 2560 |
| M9-3 | non-jouable | « Somme = imprimé » ne vient que d'une pièce lue (Gemini). Saisie à la main : « Détail : 84,10 CHF / 86,50 CHF · manque 2,40 CHF », recalculé à chaque ligne. | 2560 |
| LR1-9 | non-jouable | Pièce doc2/BAUHAUS absente en ligne (la créer exige Gemini) ; et 390 impossible (iframe refusée). | — |
| LR1-14 | non-jouable | Confirmer une dépense ZZ TEST toucherait la clôture réelle. Avant et après : « Les comptes ont changé… vérifications sont à refaire », « Clôture 2026 · 1 / 9 prêtes ». | 2560 |
| PCN-NOTE-4 | non-jouable | Aucun carnet en ligne ; créer passe par Gemini ; 390 impossible. Liste vide vue à 2560 : cadre « Évier inox, 2 bacs · exemple… arrive ici », puces d'exemples. | 2560 |
| PCN-4 | non-jouable | Exige Gemini : créer un carnet envoie la phrase à l'IA. | — |
| PCN-7 | non-jouable | Exige Gemini, et aucun carnet Ventilation en ligne. | — |
| PCN-10 | non-jouable | Exige Gemini (lire les liens déposés). | — |
| PCN-13 | non-jouable | Exige Gemini : aucun article lu en ligne. | — |
| PCN-14 | non-jouable | Exige Gemini (4 articles lus), et 390 impossible. | — |
| PCN-19 | non-jouable | Banc dev seulement (`?preview=carnets&aides=1`) ; aide éteinte en ligne. | — |
| PCN-20 | non-jouable | Exige deux carnets proches (création par Gemini). | — |
| PCN-21 | non-jouable | Exige Gemini (photo rangée, puis lue) et un carnet ouvert. | — |
| PCN-22 | non-jouable | Couper le réseau ou l'IA n'est pas faisable sans DevTools ; 390 impossible ; aucun carnet Frigo. | — |
| PCN-23 | non-jouable | Exige Gemini : aucun article lu. | — |
| PCN-24 | non-jouable | Exige Gemini (5 phrases rangées par l'IA). | — |
| PCN-25 | non-jouable | Exige Gemini (phrase envoyée depuis la liste). | — |
| PCN-27 | non-jouable | Exige Gemini (créer un carnet). | — |
| PCN-28 | non-jouable | Il faut une liste peuplée, or elle est vide en ligne (0 carnet). | — |
| PCN-29 | non-jouable | Aucun carnet « Moulin à malt » en ligne ; création par Gemini. | — |
| PCN-30 | non-jouable | Aucun carnet en ligne (Comparer, Choisir et Pourquoi inatteignables). | — |
| PCN-31 | non-jouable | Aucun carnet ouvert possible en ligne. | — |
| PCN-33 | non-jouable | Aucun carnet ni note en ligne. | — |
| PCN-35 | non-jouable | Aucun carnet lié en ligne, et 390 impossible. | — |
| PCN-37 | non-jouable | Vrai téléphone 390×660 requis. | — |
| PCN-38 | non-jouable | Aucun tableau en ligne, et 390 impossible. | — |
| PCN-39 | non-jouable | 390 impossible. À 2560, À venir (3) : « Sans date · 1 », « Les suivants · 2 achats », aucun « Ouvrir le carnet » ; pas de « + » dans la page. | 2560 |
| PCN-40 | non-jouable | Écrans 18, 26b et 28b introuvables : aucun article lu. À venir montre « 3 200 CHF TTC, au moins », mais « 350 » et « 1 200 » sans CHF. | 2560 |
| PCN-41 | non-jouable | Aucun article écarté en ligne. | — |
| PCN-42 | non-jouable | Aucun carnet lié, et 390 impossible. | — |
| PCN-43 | non-jouable | Liste vide en ligne, et 390 impossible. | — |
| PCN-45 | non-jouable | Aucun carnet lié en ligne. | — |
| PCN-46 | non-jouable | Comparer inatteignable (aucun carnet). | — |
| PCN-47 | non-jouable | Aucun carnet en ligne, et 390 impossible. | — |

## Défaut neuf (à verser à BUGS.md par le pilote)

- **Stocks › Ajouter un article** : un article neuf « ZZ TEST — e1 article » (Malt, kg, stock 0) montre dès sa
  création « Ce qui a bougé » : « LOT-017 · neipa v3 · mar. 10.11 · 5 → 0 kg −5 », « Achat · mar. 10.11 · 0 → 5 kg +5 »,
  « Achat · mar. 10.11 · −5 → 0 kg +5 », « −5 kg avant le 10.11 », « 3 mouvements depuis novembre ». Il hérite les
  mouvements d'un autre article. Piste : référence attribuée automatiquement et réemployée. Vu à 2560.
- Dépense saisie à la main (TL-NOTE-6, « unité changée ») : « pièce » choisie sur les 3 lignes ; après Enregistrer, la fiche
  affiche « ZZ TEST — e1 dépense · 1 » et « ZZ TEST — l2 · 1 », sans unité, mais « ZZ TEST — l3 · 1 pièce ». Les lignes 1 et 2
  ont perdu leur unité, ou ne l'affichent plus.

## Données ZZ TEST créées et retirées

- Dépense « ZZ TEST — e1 dépense » (86,50 CHF, 3 lignes 50,00 + 34,10 + 2,40, Brassage, 19.11.2026, payée banque)
  → retirée par « Corriger une erreur de saisie › Retirer cette écriture › Confirmer le retrait ». L'app répond
  « Écriture annulée. Justificatif et historique conservés. » Absente de la liste ensuite, « dépensé 265,40 » inchangé.
- Saisie « ZZ TEST — e1 fermer » (1,00) : abandonnée par Fermer, jamais enregistrée (absente de la liste).
- Article « ZZ TEST — e1 article » (Malt, kg) : épinglé puis retiré des favoris, puis « Supprimer l'article ». Après coup,
  « Recherche « ZZ TEST » : 0 article ».
- Rien n'a été modifié sur une donnée réelle. Recette « Jj » : éditeur ouvert, puis quitté sans enregistrer, toujours en v1.
  Écriture Brau-Rauchshop : Modifier, puis Annuler.
