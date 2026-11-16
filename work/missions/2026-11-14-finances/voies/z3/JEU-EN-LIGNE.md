# Jeu en ligne — Finances, 16.11.2026 (z3)

App : https://brasserie-l-affinee.web.app/ (version b658b838), Chrome du brasseur (Claude in Chrome), connecté.
Accord : « Oui autorise le à utiliser chrome » (MISSION.md, contrat réécrit 15.11) ; 16.11 : « soit autonome ».
Taille : redimensionnement à 390 accepté mais sans effet (fenêtre 2560 × 1305 CSS). Tout est vu en grand écran, aucune vue 390 tactile ni 1280.
Thème sombre (« Cave ») : vu une fois sur la Synthèse de novembre, puis remis à « Clair ».

## Nombres réels

| Nombre | Avant | Après retrait |
|---|---|---|
| Opérations, Tout : Ventes | +5 695,00 | non relu (voir plus bas) |
| Opérations, Tout : payé / à payer / dépensé | 265,40 / 0,00 / 265,40 | dernier relevé avant la fin : 265,40 / 25,00 → retour à la base après annulations, non relu en Tout |
| Opérations, novembre : Ventes / payé / à payer / dépensé | (z1 : +5 695,00 / 0,00 / 0,00 / 0,00) | +5 695,00 / 0,00 / 0,00 / 0,00 |
| en retard | non affiché | non affiché |
| En caisse (Synthèse) | 5 663,00 | 5 663,00 CHF |
| Lignes « ZZ » dans Opérations | 0 | 0 (novembre et Tout) |

Le relevé « avant » de novembre n'a pas été pris par moi : la période de départ était « Tout ». Je l'ai repris du tableau z1 (15.11). Le relevé « Tout » après retrait n'a pas pu être relu : le panneau Plus couvrait encore la page en fin de tour. Novembre, caisse et absence de lignes ZZ sont relus.

## Gestes

### 1. Deux dépenses à payer, « ✓ Payé », avis : fait
- A « ZZ TEST — pièce A » 10,00 et B « ZZ TEST — pièce B » 15,00 (+ › Nouvelle écriture › Saisir sans justificatif, catégorie Autre, fournisseur « ZZ TEST — Fournisseur », règlement À payer, échéance aujourd'hui). Opérations Tout : payé 265,40, à payer 25,00, dépensé 290,40. Juste.
- « ✓ Payé » sur A : l'avis apparaît en place (« Payé 10,00 · Annuler · Autre montant ») et reste plus de 20 s. « Annuler » remet A à payer (265,40 / 25,00). Juste.
- « Autre montant : ouvrir la feuille Payer » : ouvre la FICHE de A, déjà payée 10,00, pas la feuille Payer.
- Feuille Payer atteinte par la fiche › Noter un paiement : « 2 pièces à payer au même fournisseur », virement 25,00 par défaut, étiquettes « pièce B 15,00 | pièce A 10,00 ». À 12,00 : B 12,00 « reste 3,00 », A « pas touchée ». Payé 12,00 : payé 277,40, à payer 13,00. Juste.
- Problèmes :
  1. « Autre montant » ouvre la fiche (et laisse le paiement de 10,00 fait) au lieu de la feuille Payer.
  2. « Le plus ancien d'abord » met B (saisie après A, même date) en premier ; A n'est pas touchée.
  3. À 12,00, l'étiquette de la barre redevient « zz 12,00 » (premier mot en minuscules), alors qu'à 25,00 elle dit « pièce B 15,00 | pièce A 10,00 ».
  4. Le bouton « ✓ Payé » et le « Annuler » de l'avis sont le même élément à la même place : un double toucher paie puis annule. Un premier clic à la place de l'avis a ouvert la fiche réelle « Vêtements… » (fermée sans rien toucher) : l'avis avait déjà bougé.
  5. En saisie, Échap dans le champ fournisseur ouvre « Abandonner cette saisie ? », et le fournisseur tapé alors que la section était repliée est perdu sans signe.

### 2. Modifier une pièce payée sous le payé : fait (sur A soldée), défaut sur B partielle
- B (payée 12,00 sur 15,00) › Modifier › 10,00 : aucune question. L'aperçu « après » dit « 10,00 ✓ payé ». Enregistré : payé 275,40 (265,40 + 10,00). Le virement de 12,00 n'est plus compté que 10,00, aucun trop-payé.
- A soldée (✓ Payé 10,00) › Modifier › 8,00 : la question apparaît (« Erreur de saisie : j'ai payé 8,00 » / « J'ai bien payé 10,00 : 2,00 trop payé · 2,00 à récupérer du fournisseur · la sortie reste comptée »). Choisi « J'ai bien payé 10,00 ». Opérations : ligne « À récupérer : trop payé sur « ZZ TEST — pièce A » · à récupérer 2,00 · sorti aujourd'hui · banque », payé 285,40 (sorties gardées). Juste.
- Problèmes :
  6. Sur une pièce payée en partie (B 12,00 sur 15,00) baissée sous le payé, la question n'apparaît pas : 2,00 CHF sortis disparaissent (le défaut z1 n° 10 reste sur ce cas).
  7. Avec « J'ai bien payé », l'aperçu « après » montre encore « 8,00 ✓ payé » sans le trop-payé de 2,00.
  8. Le trop-payé de 2,00 compte dans « dépensé » (285,40) et dans « Autres frais » (152,00), alors que c'est une somme à récupérer.
  9. La fiche du doublon A2 (8,00, à payer) affiche « 2,00 CHF à récupérer : voir la créance », qui appartient à A.

### 3. Doublons : pas joué jusqu'au bout
- Un doublon de A (8,00, même fournisseur, même date) déclenche dès la saisie « Achat peut-être déjà enregistré » avec « Même achat » / « Autre achat ». J'ai pris « Autre achat » pour l'enregistrer.
- Le bouton « Doublons » d'Opérations reste désactivé (disabled), avant comme après ce doublon. « Annuler celle-ci » et le bandeau recompté n'ont pas pu être vus.
- Problème :
  10. Aucun moyen de produire un doublon visible dans « Doublons » depuis la saisie : la garde de saisie l'arrête ou l'exempte. Le bouton désactivé ne dit pas pourquoi.

### 4. Archives et période : fait
- Archives : « Aucune année archivée », frise vide hachurée, « Choisir une année à archiver ». Rien rangé.
- Période (avatar › Plus) : « Novembre 2026 », « Ce mois », « Mois dernier », « Exercice 2026 », « Tout », « Du … au ». Novembre : Ventes +5 695,00, payé 0,00 ; Tout : payé 265,40 avant le jeu. Cohérent.
- Problème :
  11. Le bandeau « Opération mise à jour. Fermer » reste en haut d'Opérations plusieurs minutes, sur Archives compris.

### 5 à 7. Prévisions, budget d'un brassin, Compagnon, apport : non joués
- Arrêtés faute de place : le contexte de l'agent arrivait à sa limite après le retrait. Rien n'a été créé dans Prévisions ni en apport.

### 8. Retrait : fait
- Par les gestes de l'app : « Corriger ce paiement saisi par erreur » › « Confirmer la correction » sur chaque paiement, puis « Corriger une erreur de saisie » › « Annuler cette écriture » › « Confirmer ». Message « Écriture annulée. Justificatif et historique conservés. »
- Annulées : A2 (doublon), « À récupérer : trop payé sur ZZ TEST — pièce A », B, A.
- Après : 0 ligne ZZ dans Opérations (novembre et Tout), novembre 0,00 / 0,00 / 0,00, en caisse 5 663,00.

## Ce qui reste de ZZ TEST
- Quatre écritures annulées dans Firestore avec leurs paiements et contre-écritures (A, A2, B, créance de 2,00). Les règles ne permettent pas de les supprimer ; elles ne comptent nulle part.
- Le nom « ZZ TEST — Fournisseur » peut rester dans les suggestions de fournisseurs (non vérifié).

## Non joué
- 390 tactile et 1280 : fenêtre non redimensionnable.
- Doublons « Annuler celle-ci » : bouton désactivé.
- Prévisions (prévision 7,00, projet de matériel), budget d'un brassin (« Prix d'1 ingrédient », Détail du litre), Compagnon (pastilles), apport 1,00 et recherche « ZZ » : limite de contexte de l'agent.
- Relecture finale des totaux « Tout » d'Opérations : panneau Plus encore ouvert.
- Rien envoyé au Compagnon, aucun fichier déposé, aucun réglage enregistré (thème remis à Clair, période remise à Tout).
