OK — 8 problèmes, 1 bloquant

# Test d'écran — Finances, FN-33, FN-35, FN-37 (voie x1)

Version : dfe9189e (sources propres, aucun fichier `src` modifié). Banc local `?dev-local&finance-demo`, port 3000 (répond 200).
Script : `work/missions/2026-11-14-finances/voies/x1/jeu.mjs` (d'après `w1/sonde.mjs` et `v1/capturer.mjs`), profil Chrome neuf par
configuration, quatre configurations (390 tactile, 1280 souris ; clair et sombre `cave`), aucune erreur de page. Chemin de l'app
seulement : + › Nouvelle écriture › Saisir sans justificatif (A « ZZ TEST — pièce A » 10,00 et B « ZZ TEST — pièce B » 15,00, À payer,
Autres frais) ; ✓ Payé sur A ; Annuler après 1,1 s ; double toucher (2 touchers à 120 ms au même point) ; fiche de B › Noter un
paiement 12,00 ; fiche de B › Modifier › 10,00 › « J'ai bien payé 12,00 » › Enregistrer ; Opérations ; Annuel. 40 captures ici,
16 ouvertes en plein format (le tableau) ; les autres couvertes par les journaux `voies/x1/log-*.txt`, identiques en nombres dans
les quatre configurations.

## Nombres relevés (identiques dans les quatre configurations)

| moment | payé | à payer | dépensé | à la main |
|---|---|---|---|---|
| avant | 296,80 | 400,00 | 696,80 | 696,80 − 400,00 = 296,80 |
| A et B saisies à payer | 296,80 | 425,00 | 721,80 | +25,00 à payer, juste |
| ✓ Payé sur A | 306,80 | 415,00 | 721,80 | juste |
| Annuler à 1,1 s | 296,80 | 425,00 | 721,80 | annulé, juste |
| double toucher | 306,80 | 415,00 | 721,80 | payé une fois, pas annulé (encore vrai à +2 s) |
| B payée 12,00 | 318,80 | 403,00 | 721,80 | juste |
| B baissée à 10,00, « J'ai bien payé » | 316,80 | 400,00 | 716,80 | 696,80 + 10 + 10 = 716,80 ; 716,80 − 400,00 = 316,80 : créance hors dépensé, juste |

En caisse (Synthèse) : 4 181,60 → 4 159,60 (−22,00 = 10,00 + 12,00 sortis : la caisse voit le trop-payé, juste).
Annuel 2026 : Autres frais 213,00 → 233,00 (+20,00) ; Dépensé + usure 1 226,40 → 1 246,40 : créance hors Annuel, juste.

| capture | thème | largeur | état | problèmes | bloquants |
|---|---|---|---|---|---|
| 01-a-payer-390-clair.png | clair | 390 | Opérations : A et B à payer sous « Autres frais 25,00 », ✓ Payé | 0 | 0 |
| 02-avis-390-clair.png | clair | 390 | avis juste après ✓ Payé : « Payé 10,00 · Annuler · Autre montant » | 0 | 0 |
| 02-avis-390-cave.png | sombre | 390 | même avis en sombre | 0 | 0 |
| 04-apres-annuler-390-clair.png | clair | 390 | après Annuler à 1,1 s : A de nouveau à payer, ✓ Payé revenu | 0 | 0 |
| 03-double-390-clair.png | clair | 390 | après double toucher : A payée, mais la fiche de A s'ouvre par-dessus | 2 | 0 |
| 03-double-1280-clair.png | clair | 1280 | même chose à la souris : fiche de A en bulle | 2 | 0 |
| 05a-payer-12-390-clair.png | clair | 390 | feuille Payer de B à 12,00 : « zz 12,00 », reste 3,00 | 1 | 0 |
| 05-modifier-question-390-clair.png | clair | 390 | Modifier B (payée 12,00 sur 15,00) à 10,00 : la question est là | 0 | 0 |
| 05-modifier-question-390-cave.png | sombre | 390 | même question en sombre | 0 | 0 |
| 06-apercu-bien-paye-390-clair.png | clair | 390 | « J'ai bien payé 12,00 » choisi : aperçu avant/après | 1 | 0 |
| 06-apercu-bien-paye-1280-clair.png | clair | 1280 | même aperçu en bulle | 1 | 0 |
| 07-ops-a-recuperer-390-clair.png | clair | 390 | Opérations : ligne « À récupérer » 2,00 sous « Autres frais 22,00 » | 2 | 1 |
| 07-ops-a-recuperer-1280-cave.png | sombre | 1280 | même liste, pile « Autres 20,00 » à côté de « Autres frais 22,00 » | 1 | 1 |
| 07b-ops-bande-390-clair.png | clair | 390 | bande : payé 316,80 · à payer 400,00 · dépensé 716,80 ; pile « Autres 20,00 » | 2 | 0 |
| 08-annuel-autres-390-clair.png | clair | 390 | Annuel : Autres frais 233,00, bandeau « Opération mise à jour » | 1 | 0 |
| 08-annuel-autres-1280-cave.png | sombre | 1280 | même Annuel en sombre | 1 | 0 |

Bloquants : 1

## Vu juste

- FN-33 : Annuler après 1 s annule (bande revenue à 296,80 / 425,00) ; le double toucher paie une seule fois et n'annule pas, dans les
  quatre configurations, encore vrai 2 s après.
- FN-35 : sur B payée en partie (12,00 sur 15,00) baissée à 10,00, la question « Le paiement déjà noté » apparaît, avec les bons
  nombres (« Erreur de saisie : j'ai payé 10,00 » / « J'ai bien payé 12,00 : 2,00 trop payé · 2,00 à récupérer du fournisseur ») et
  la phrase « Le montant passe sous ce qui est déjà payé (12,00) ». « J'ai bien payé » crée la ligne « À récupérer » de 2,00.
- FN-37 : la créance sort de « dépensé », du « payé » de la bande, de la pile (Autres 20,00) et de l'Annuel ; la caisse la garde.

## Problèmes

1. **BLOQUANT — Opérations : « Autres frais 22,00 » dans la liste, « Autres 20,00 » dans la pile, même écran** (07-ops-a-recuperer-390-clair,
   07-ops-a-recuperer-1280-cave). La ligne « À récupérer : trop payé… » est rangée sous le groupe Autres frais et son total d'en-tête la
   compte, alors que la pile et « dépensé » l'excluent (FN-37). Valeur fausse sur le sujet même du correctif. En brasseur : « mes autres
   frais, c'est 20 ou 22 ? ». Attendu : la créance hors du groupe Autres frais (son propre groupe « À récupérer », ou hors total), le
   groupe à 20,00 comme la pile.
2. **Double toucher sur ✓ Payé : le second toucher ouvre la fiche de A** (03-double-390-clair, 03-double-1280-clair, et 390 sombre,
   1280 sombre au journal). Rien n'est annulé (FN-33 tient), mais la fiche couvre l'avis « Payé 10,00 · Annuler » qu'on venait de
   faire naître : le second toucher, ignoré par l'avis, tombe sur la ligne. En brasseur : « j'ai tapé deux fois Payé, ça m'ouvre la
   fiche ». Attendu : le second toucher dans les 0,8 s n'ouvre rien.
3. **Fiche de A après Payé, Annuler, Payé : « Paiements 3 », un « 10,00 corrigé » barré et un « −10,00 » qui propose « Corriger ce
   paiement saisi par erreur »** (03-double-390-clair, 03-double-1280-clair). Un Annuler immédiat laisse deux lignes d'historique en
   plein, dont un paiement négatif qu'on invite à corriger. En brasseur : « j'ai payé une fois, pourquoi 3 paiements et un moins
   10 ? ». Attendu : le paiement annulé et sa contre-écriture repliés en une ligne « annulé », sans lien de correction sur la
   contre-écriture.
4. **Aperçu « après » sans le trop-payé** (06-apercu-bien-paye-390-clair, 06-apercu-bien-paye-1280-clair) : « J'ai bien payé 12,00 »
   choisi, l'aperçu dit seulement « 10,00 ✓ payé aujourd'hui · banque », pas la ligne « À récupérer 2,00 » qui va naître. Déjà au
   registre (FN-36), non corrigé dans cette version.
5. **Ligne de la créance coupée à 390** (07-ops-a-recuperer-390-clair) : « À récupérer : trop payé sur « ZZ TEST — piè… » et
   « à récupérer 2,00 · sorti aujourd'hui · … » : le préfixe mange le nom de la pièce ; avec un vrai nom (« Malt et houblons ») on ne
   saura pas sur quelle pièce. En brasseur : « à récupérer sur quoi ? ». Attendu : le nom de la pièce d'abord (« ZZ TEST — pièce B ·
   trop payé »), « à récupérer 2,00 » en étiquette.
6. **Pile à 390 : « Nettoya… »** (07b-ops-bande-390-clair) : avec la colonne Autres en plus, l'étiquette Nettoyage est coupée. Lisible
   par devinette ; non bloquant.
7. **Bandeau « Opération mise à jour. Fermer » encore en haut d'Opérations et d'Annuel** (07b-ops-bande-390-clair,
   08-annuel-autres-390-clair, 08-annuel-autres-1280-cave). Déjà au registre (FN-40).
8. **Feuille Payer : « zz 12,00 » sous la barre** (05a-payer-12-390-clair) : premier mot en minuscules, alors que la pièce s'appelle
   « ZZ TEST — pièce B ». Déjà au registre (FN-32).

## Doutes (non comptés)

- Modifier : « Erreur de saisie » est pré-choisi (cadre bleu) dès que la question paraît ; le commentaire de FN-10 parle de « deux
  choix, à faire explicitement ». Choix par défaut prudent (rien ne naît), sans doute voulu.
- L'étiquette « à récupérer 2,00 » porte le cadre orange de « à payer » ; c'est de l'argent qu'on attend, pas une dette. À confronter à
  la maquette v6a, qui n'a pas ce cas.
- À 390 clair, la pastille « Compagnon hors connexion · mode local » chevauche les boutons Filtres et Doublons (07-ops-a-recuperer-390-clair) :
  mode local du banc.
- « sans échéance » sur A et B : le script n'a pas rempli l'échéance (le jeu z3 avait « aujourd'hui ») ; sans effet sur FN-33/35/37.
- Les quatre configurations ont été jouées chacune sur un profil neuf : pas de cumul entre elles ; nombres identiques au centime.
