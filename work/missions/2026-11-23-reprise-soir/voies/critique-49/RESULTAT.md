OK — 3 problèmes, 0 bloquants

RESULTAT critique-49 : 3 problèmes (B 0, m 2, D 1) — corrigés rejoués 7/9 — soldes identiques oui — BUGS OK

Version : index-Bk3VRdwH.js. Vérifiée par curl ; l'onglet avait DJIfW4-y et maj.mjs l'a passé à Bk3VRdwH avant tout relevé.
Tests : sans objet (test d'écran). Registre : `bugs.log` (BUGS OK : 2221 bugs, 519 ouverts, 202 sources).
Couvert : thème clair, 390 × 844, au toucher, Chrome de débug 9222. J'ai utilisé mon onglet seulement ; à la fin, page.close() puis disconnect, et le navigateur est resté ouvert. Non couvert : 1280 et thème sombre (consigne du DOSSIER).
Coût IA : 2 rangements et 6 lectures de lien, soit environ 0,05 CHF estimés pour un plafond de 0,10 CHF. Le journal `2026-11-23-carnet-en-ligne/ia-journal.jsonl` a 8 lignes pour la voie critique-49, plus une ligne de correction : le premier essai KS240L n'a pas été envoyé.

## Avant et après (avant.json, apres.json : 15 champs, tous identiques)
| | avant | après retrait, app rechargée |
|---|---|---|
| à dépenser | −463 (S53) | −463 (S53) |
| En caisse | 1 145,00, libre 1 145,00 | identique |
| Entré / Dépensé ; Opérations | 0,00 / 265,40 ; 265,40 / 0,00 / 265,40 | identiques |
| Solde de départ | 1 145,00 | identique |
| Mon mois ; HABITUELS | — ; De ma poche, Vêtements…, Versement mensuel | identiques |
| période du Calendrier | 6 sem., 23 nov. 2026 – 3 janv. 2027, localStorage | identique à l'octet |
| Carnets | Tous 20, Local 10, Brasserie 4, Meuble 4, Papiers 2 ; texte sous chaque filtre | identiques |
Pendant le test, l'app montrait −963 avec l'estimé à 500, puis −543 avec le choix à 79,95. Retrait : « ZZ TEST — table » est supprimé avec son plan (« Supprimer avec son plan »), « ZZ TEST — marmite » est supprimé avec ses 3 articles, et l'écriture ZZ TEST — Salaire est retirée au premier toucher.

## Joué
- **C46**, dans le carnet « ZZ TEST — table de travail en bois » (rangé Meuble par l'IA). Quand › 1 mois › 500 CHF › Au calendrier donne l'avis « achat prévu posé · −500 CHF · Annuler » (A4). J'ai ensuite collé le lien Landi Schwerlastregal (79,95 CHF), ouvert la fiche, touché Choisir · landi.ch puis Choisir chez landi.ch (K1 à K3). J'ai regardé ensuite le carnet (Q1, Q2), À venir (V2) et le Calendrier (V3, carte V4, 6 mois C4).
- **E47**, dans le carnet « ZZ TEST — marmite de brassage 50 L » (rangé Brasserie), avec les liens de critique-47 : brewstore 50 L, Galaxus KS240L et Galaxus 115 L retiré. J'ai regardé le Comparer à 3 articles (K-carnet-0, K-carnet-fin) et les fiches FB et FK.
  - Artefact de script : le premier KS240L n'est pas parti, car le focus était perdu. Le collage suivant a mis deux URL bout à bout : la page était introuvable, la lecture s'est arrêtée à 1 sur 6 et rien n'a été inventé. J'ai retiré l'article au toucher (R-avant, R-apres), puis j'ai recollé les deux liens proprement.
- **E44 et E45**, regardés seulement. J'ai saisi ZZ TEST — Salaire, 5,00 à payer d'ici le 24.12, revenant chaque mois pendant 6 mois, puis je l'ai enregistré. J'ai aussi ouvert un Apport ZZ (3,00) sans l'enregistrer. Puis j'ai regardé HABITUELS, le Calendrier sur 6 mois (période remise à l'identique) et Modifier du Salaire.

## Corrigés rejoués (BUGS.md mis à jour)
- C46-3 vérifié — en ligne index-Bk3VRdwH.js. Au retour au Calendrier après le choix, l'avis « −500 » et son Annuler ont disparu (V3).
- C46-4 vérifié — en ligne index-Bk3VRdwH.js. Le carnet dit « Quand · S52 · 79,95 CHF », sans « estimé » (Q1, Q2).
- C46-6 vérifié — en ligne index-Bk3VRdwH.js. Pendant la lecture, l'écran dit « Lecture · 6 sur 6 » ; à la fin, « 6 étapes sur 6 · lu en 7 s ». Les lectures brewstore et Galaxus disent aussi 6 sur 6 (L-t3, L-fin).
- C46-5 **rouvert** (en cours). À venir dit bien 79,95 CHF (V2). Sur la frise, la bulle Achats dit encore « −80 », juste au-dessus de la carte « −79,95 » (V3, C4-1).
- E47-1 vérifié — en ligne index-Bk3VRdwH.js. L'article est dit « sur commande · expédié sous 28 jours » sur la carte, la fiche, le Comparer et la ligne « Part dans À venir ». « Rupture » n'apparaît nulle part (B-fin, FB-1, K-carnet-0).
- E47-2 vérifié — en ligne index-Bk3VRdwH.js. La colonne Hauteur affiche « 143,5 » et « 37 », tout en cm. C'est la même colonne pendant les lectures, après les fiches et à la fin (K-t8, K-carnet-0, K-carnet-fin).
- E47-3 vérifié — en ligne index-Bk3VRdwH.js. La fiche affiche « Dimensions avec moteur ». Il ne reste aucun libellé allemand (FB-1).
- E47-4 vérifié — en ligne index-Bk3VRdwH.js. La fiche affiche « 109971 » et « 49548562 », sans espaces (FK-1).
- E47-5 **rouvert** (en cours). Le doublon Capacité/Volume est réglé, et la matière, l'induction, la classe E et les 104 kWh sont lus. Mais l'essentiel n'est toujours pas d'abord (problème n° 2 ci-dessous).
- E45-1 et E45-2 tiennent. La carte de fin dit « … 24.05.27 · 6 fois » et « → mai 2027 » (S-18-fin). Le Calendrier sur 6 mois montre le 24 déc., puis « / mois » dès le 24 janv. (C4-1). HABITUELS dit « échéance le 24.01 · à enregistrer » (H1-habituels).
- E44-3 et E45-3 tiennent. Le champ « Référence, facultatif » est entier dans l'Apport (A-15-depliee) et dans le Salaire, en saisie comme dans Modifier (M5).

## Combien et quels problèmes ? 3
1. m — C46-5 (rouvert) — Calendrier, ligne Achats. La bulle de la frise dit « ZZ TEST — table de travail en bois −80 », et la carte juste en dessous dit « −79,95 » (V3, V3-calendrier-1, C4-1). Le brasseur : « 80 ou 79,95 ? C'est le même achat ». Attendu : 79,95 aussi sur la bulle, et dans son libellé.
2. D — E47-5 (rouvert) — Fiches : l'essentiel n'est toujours pas d'abord.
   - Marmite : Volume vient 9e et Induction 11e sur 11. La carte résume l'article par « Vitesse de rotation · Épaisseur de paroi · Dimensions » (K-t1_5, FB-1).
   - KS240L : Réfrigérant vient 1er. Réf. du fabricant et Numéro d'article sont au milieu (11e et 13e sur 19). La classe E vient 12e et les 104 kWh/an 15e.
   - Restent « Couleur Argent » et « Couleur exacte Argent », ainsi que « Est probablement équipé d'un adaptateur secteur : Oui » (FK-0, FK-1).
   - Le brasseur : « pour une cuve, je veux le volume et l'inox d'abord, pas la vitesse du moteur ».
3. m — E49-1 (neuf) — Comparer. L'en-tête de la colonne dit seulement « cm ». Le nom « Hauteur » n'est que dans un title, invisible au toucher : on lit « 143,5 » et « 37 » sans savoir de quelle mesure il s'agit (K-carnet-0, K-carnet-fin). Au tour 47, l'en-tête disait « Volume ». Le défaut rejoint C48-6. Le brasseur : « 143,5 cm de quoi ? »

Bloquants : 0. Aucun geste sans effet. Aucun montant faux : 80 est l'arrondi de 79,95. Aucun libellé illisible.

### Doutes (non comptés)
- L'ordre des caractéristiques d'un article change selon les autres articles du carnet, sans geste sur cet article.
  - Fiche de la marmite, à la 1re ouverture (2 articles dans le carnet) : Dimensions, Moteur, Hauteur, Matière… À la 2e ouverture (3 articles) : Dimensions, Épaisseur du fond, Robinet, Moteur… (texte FB du journal, FB-1).
  - Résumé de la carte : trois trios différents en quelques minutes (B-fin, R-apres, K-t1_5). Pour Landi, après Choisir : « Hauteur · Charge · Matériau » au lieu de « Charge · Matériau · Hauteur » (L-fin, Q1).
- Le Comparer d'une marmite et de deux frigos classe par Hauteur. Le Volume, présent sur les trois articles, compterait davantage. Au tour 47, la colonne était Volume.
- Le prix gras de la carte d'article s'affiche « 79 , 95 » : le rendu de police espace la virgule. C'était déjà le cas au tour 46 (critique-46 L-fin) ; le texte du DOM dit « 79,95 ».
- La pastille « Lu · Kibernetik Réfrig… 3✓ 3– 5 s » reste au-dessus du champ pendant toute la consultation des fiches. Elle couvre la ligne « Veille du prix » de la fiche KS240L (FK-1) ; on peut défiler dessous.
- Le Salaire saisi sans catégorie prend « Charges fixes » et se range dans la ligne Papiers du Calendrier (C4-1). La carte de fin dit « chaque mois, dès le 24.11 », alors que la première échéance est le 24.12. Le doute vient du tour 45.
- Le premier collage du KS240L n'est pas parti : la touche Entrée n'a rien envoyé, le focus étant hors du champ. C'est probablement un artefact du script (insertText sans focus). Je ne l'ai pas reproduit.

## Table (captures 390 ouvertes)
| capture | thème | largeur | état | problèmes | bloquants |
|---|---|---|---|---|---|
| A4-au-calendrier | clair | 390 | estimé 500 posé, avis | 0 | 0 |
| L-t3, L-fin | clair | 390 | lecture Landi au fil, fin | 0 | 0 |
| Q1-carnet-choisi | clair | 390 | carnet choisi, Quand | 0 | 0 |
| V2-avenir-carte | clair | 390 | À venir après le choix | 0 | 0 |
| V3-calendrier, V3-calendrier-1 | clair | 390 | Calendrier, carte Achats ouverte | 1 (n° 1) | 0 |
| C4-1 | clair | 390 | Calendrier 6 mois, Salaire et table | 1 (n° 1) | 0 |
| B-fin | clair | 390 | brewstore lu | 1 (n° 2) | 0 |
| K-carnet-0 | clair | 390 | Comparer à 3 articles | 1 (n° 3) | 0 |
| FK-0, FK-1 | clair | 390 | fiche KS240L | 1 (n° 2) | 0 |
| FB-1 | clair | 390 | fiche brewstore | 1 (n° 2) | 0 |
| H1-habituels, S-18-fin, A-15-depliee | clair | 390 | HABITUELS, fin du Salaire, Apport déplié | 0 | 0 |

LEÇON PROPOSÉE : aucune.
