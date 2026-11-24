OK — 6 problèmes, 0 bloquants

RESULTAT critique-47 : 6 problèmes (B 0, m 2, D 4) — soldes identiques oui — BUGS OK

Version : index-BxvQ1J-z.js (curl ; l'onglet avait D_XfFyFl, passé à BxvQ1J-z par maj.mjs avant tout relevé).
Tests : sans objet (test d'écran). Registre : `bugs.log` (BUGS OK : 2214 bugs, 516 ouverts, 202 sources).
Couvert : thème clair, 390 × 844, au toucher, Chrome de débug 9222, mon onglet seulement (page.close puis disconnect, navigateur gardé). Non couvert : 1280 et sombre (consigne du DOSSIER).
Coût IA : 1 rangement, 4 lectures de lien, 1 escalade, ≈ 0,06 CHF estimé pour un plafond de 0,10 CHF ; 7 lignes au journal `2026-11-23-carnet-en-ligne/ia-journal.jsonl` (voie critique-47), plus une ligne de correction (un envoi raté, coût 0).

## Avant et après (avant.json, apres.json : 15 champs, tous identiques)
| | avant | après retrait, app rechargée |
|---|---|---|
| à dépenser | −463 (S53) | −463 (S53) |
| En caisse | 1 145,00, libre 1 145,00 | identique |
| Entré / Dépensé ; Opérations | 0,00 / 265,40 ; 265,40 / 0,00 / 265,40 | identiques |
| Solde de départ | 1 145,00 | identique |
| Mon mois (saisie) ; HABITUELS | — ; De ma poche, Vêtements…, Versement mensuel | identiques |
| période du Calendrier | 6 sem., 23 nov. 2026 – 3 janv. 2027, localStorage noté | identique à l'octet |
| Carnets | Tous 20, Local 10, Brasserie 4, Meuble 4, Papiers 2 ; texte sous chaque filtre | identiques |
Pendant le test : à dépenser −472 avec les deux ZZ. Retrait : ZZ Loyer et ZZ Salaire, au premier toucher ; carnet ZZ (3 articles) supprimé (« Rien ne le retient »).

## Joué
- E45 : ZZ TEST — Salaire 5,00 à payer d'ici le 24.12, Mois, 6 mois ; ZZ TEST — Loyer 4,00 à payer d'ici le 24.12, Trim., 6 mois. Chaque geste : titre, montant, À payer, curseur, Revient, durée, Référence. Puis HABITUELS, Calendrier (6 sem. puis 6 mois, période remise), carte du Salaire, Modifier du Salaire et du Loyer (rien enregistré).
- Liens, dans le carnet « ZZ TEST — marmite de brassage 50 L », rangé Brasserie par l'IA :
  1. brewstore.ch, casserole motorisée 50 L (magasin de brassage) : 7 étapes, « Lu · 5 s ». Nom, 520 CHF, 3 photos et 10 caractéristiques, chacune présente sur la page.
  2. galaxus.ch/fr, frigo à boissons 115 L : la page dit « Le produit n'est plus disponible », sans prix ni photo. Lu en 5 s : « plus disponible », prix, photos et caractéristiques « absent » avec Compléter. Rien d'inventé.
  3. galaxus.ch/fr KS240L, un produit en vente, ajouté parce que le 2 était retiré : « Lu · 4 s ». 302 CHF, port offert et en stock, comme la page. 4 photos, 10 caractéristiques (poids, hauteur, largeur, volume, dB, classe N…), justes.
  4. Lien mort brewstore (404) : « Lien introuvable · arrêté à 1 sur 6 · rien n'est inventé », puis Escalader. L'étape annonce « en cours · l'IA la plus fine prend 10 à 15 s ». En moins de 2 s : « Toujours introuvable · le lien ne mène toujours à rien ». Aucune fiche, rien d'inventé.
- Chaque fiche a été comparée à sa page, ouverte dans mon onglet (SRC-B-haut, SRC-G-haut, SRC-K-haut, SRC-K-spec).

## Corrigés rejoués (BUGS.md mis à jour)
- E45-1 vérifié — en ligne index-BxvQ1J-z.js. Salaire : « … 24.05.27 · 6 fois » et « → mai 2027 ». Loyer : « … 24.03.27 · 2 fois » et « → mars 2027 » (S-16, S-18-fin, L-18-fin). Calendrier 6 mois : Salaire au 24 déc., puis bande « / mois » dès le 24 janv. ; Loyer au 24 déc. et au 24 mars (C4-0, C4-1).
- E45-2 vérifié — en ligne index-BxvQ1J-z.js. HABITUELS : Salaire « échéance le 24.01 », Loyer « échéance le 24.03 », les dates du Calendrier (H1-habituels).
- E45-3 vérifié — en ligne index-BxvQ1J-z.js. Salaire : « Référence, facultatif », entier dans la saisie à 390 px (S-15-depliee). Dans Modifier, l'indication est lue dans le DOM : même texte et même champ que l'Apport vu entier au tour 45 (M5-modifier, champ rempli « ZZ-REF »).

## Combien et quels problèmes ? 6
1. m — E47-1 — brewstore 50 L marqué « rupture » sur la carte, la fiche, le comparatif et « Part dans À venir ». La page dit « Auf Bestellung », « Dieses Produkt wird in 28 Tagen versendet » (PreOrder) (B-fin, FB-0, SRC-B-haut). Le brasseur : « Rupture ? Le site dit qu'on peut la commander. »
2. m — E47-2 — Comparer : la colonne « Hauteur » met « 143,5 cm » face à « 370 mm ». La colonne était « Volume » juste avant ; elle a changé après l'ouverture des fiches, sans geste sur le tableau (K-fin, X-Efin).
3. D — E47-3 — Fiche brewstore : « Gesamtabmessungen mit Motor » reste en allemand parmi des libellés traduits (FB-1).
4. D — E47-4 — Fiche KS240L : « Réf. du fabricant 109 971 » et « Numéro d'article 49 548 562 », des identifiants écrits comme des quantités (FK-0, FK-1).
5. D — E47-5 — Choix des 10 caractéristiques. Restent un doublon (Capacité 50 L et Volume 50 L), « adaptateur secteur : Oui » et le n° d'article. Manquent « AISI 304 » et « Nicht für Induktion geeignet » pour la marmite, la classe E et les 104 kWh/an pour le frigo (FB-1, FK-1). Rien d'inventé.
6. D — déjà au registre C46-6 (voie carnet-c46), non reversé : le total d'étapes varie. « Lecture · 6 sur 6 », puis « 6 sur 7 », puis « 6 étapes sur 6 » ; sur le lien mort, « 1 sur 6 » puis « 1 sur 7 » (B-t0_5, B-t3, B-fin, X-t1_5, X-Efin).

Bloquants : 0. Aucun geste sans effet, aucun montant faux. Le n° 1 est une disponibilité fausse ; les montants sont justes.

### Doutes (non comptés)
- Escalader n'existe que sur un lien introuvable. Sur les deux liens lus (brewstore, Galaxus), aucune relecture par l'IA forte n'est possible : le geste du DOSSIER s'est joué sur un lien mort.
- La relecture Hydrogen « dès qu'un champ manque » (D449) ne se voit pas à l'écran. Sur le Galaxus retiré, « Lecture IA · en cours » a duré moins de 1,5 s ; sur le KS240L, tout était « trouvé » à 0,5 s (page gardée, probablement).
- Galaxus 115 L retiré : le nom « Kibernetik Réfrigérateur à boissons » perd le « 115 L » du lien. Les caractéristiques sont dites « absent » alors que la description cite l'éclairage LED, la porte vitrée verrouillable et 4 grilles.
- « 50 L · 10,40 CHF/L » pour une marmite : un prix au litre de capacité.
- Nom allemand de la marmite sur l'URL française : c'est le site qui l'affiche ainsi.
- Carte de fin : « chaque mois, dès le 24.11 », alors que la première date est le 24.12 (déjà en doute au tour 45). Loyer : « Référence (n° de facture) ».
- Frappe sans délai dans le champ d'un carnet qui a des articles : il n'est resté que « h ». À 500 ms par lettre (F2-abc) et au collage, le champ garde tout : artefact probable du script.

## Table (captures 390 ouvertes)
| capture | thème | largeur | état | problèmes | bloquants |
|---|---|---|---|---|---|
| S-16, S-18-fin, L-18-fin, H1-habituels (PL1) | clair | 390 | aperçu, carte de fin, HABITUELS | 0 | 0 |
| C1-0, C2-carte-S, C4-0, C4-1 (PL2) | clair | 390 | Calendrier 6 sem., carte, 6 mois | 0 | 0 |
| S-15-depliee, M5-modifier, M6-modifier, L-15-depliee (PL3) | clair | 390 | Référence en saisie et Modifier | 0 | 0 |
| B-t0_5, B-t3, B-t8, B-fin (PL4) | clair | 390 | lecture brewstore au fil, fin | 2 (n° 1, 6) | 0 |
| G-t0_5, G-t5, G-fin, SRC-G-haut (PL5) | clair | 390 | lecture Galaxus retiré, page d'origine | 0 | 0 |
| K-fin, K-carnet-0, FK-0, FB-0 (PL6) | clair | 390 | KS240L lu, comparatif, fiches | 3 (n° 1, 2, 4) | 0 |
| X-t1_5, X-E0_5, X-Efin, FB-1 (PL7) | clair | 390 | lien mort, Escalader, fiche marmite | 4 (n° 2, 3, 5, 6) | 0 |
| FK-1, SRC-B-haut, SRC-K-haut, SRC-K-spec (PL8) | clair | 390 | fiche KS240L, pages d'origine | 2 (n° 4, 5) | 0 |

LEÇON PROPOSÉE : aucune.
