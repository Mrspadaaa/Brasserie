# v1 — rejeu local, port 5181 (port-carnet HEAD 8982b959b, f2 inclus), banc `?preview=carnets` IA simulée

Script : `rejeu.mjs` ; journaux : `captures/journal-*.txt` ; captures : `captures/`. Aucun fichier de code modifié.

| id | verdict | observé (≤ 25 mots) | capture | taille |
|---|---|---|---|---|
| TE-NOTE-3 | non-joué (accord) | PDF « Enregistrer et télécharger » : accord du brasseur requis par la ligne même ; rien joué. | — | — |
| LL-8 | non-local | Relecture en ligne de 13 pièces et 5 tickets : hors local, aucune pièce réelle au banc. | — | — |
| SU-NOTE-6 | non-local | Délais sur une longue pièce en ligne : se mesure en ligne seulement (lecture réelle, Gemini). | — | — |
| PCN-NOTE-4 | non-local | Demandé en ligne ; en local, liste, carnet, Comparer joués aux deux tailles (voir lignes PCN). | — | — |
| PCN-4 | corrige | « Ce qui compte · Débit : 150 kg/h au moins · de votre phrase » ; titre non recopié. Mais « 2 cylindres » perdu du critère (défaut neuf 1). | creer-apres-plein-390, creer-apres-1280-sombre | 390, 1280 |
| PCN-7 | corrige / ouvert-gemini | « ✓ Rangé ici, à l'instant · Annuler » ; roue puis bandeau, jamais ensemble. Mais « doit tenir 80 °C » rangé en note (IA simulée) : typage = vraie IA. | vent-80-apres-390, vent-80-apres-1280 | 390, 1280 |
| PCN-14 | corrige | 390 : vignettes en tête, « Compromis : la 1re, la seule à tenir 80 °C… », « Valeurs annoncées par les vendeurs », 4e colonne en fondu, « → 2 de plus ». | comparer-390, comparer-plein-390 | 390 |
| PCN-25 | corrige | Depuis la liste : « Carnet créé » seul, aucune roue « L'IA range… » relevée (8 créations, relevé toutes les 120 ms). | creer-pendant-*, journal-liste-creer | 390, 1280 |
| PCN-28 | corrige | Champ touché, liste peuplée : « Collez le lien d'un objet ou notez un besoin… », « Évier inox, 2 bacs · exemple · arrive ici », puces d'exemples. | liste-focus-390-clair, liste-focus-1280-clair | 390, 1280 |
| PCN-29 | corrige | 1280 : champ 612 px, « Ajouter à Moulin à malt 2 cylindres, 150 kg/h… » entier ; liste : champ (y 743) ne recouvre pas « En veille » (y 802). | creer-pendant-1280-clair, liste-1280-clair | 1280 |
| PCN-30 | corrige | Carnet et Comparer : « Ajouter à ZZ TEST — Ventilation… » ; jamais « Une idée, un besoin… » hors liste. | comparer-1280, vent-ouvert-1280 | 390, 1280 |
| PCN-38 | corrige | 390 : noms sur 1 ou 2 lignes ; « tient 80 °C » sur une ligne (pastille et critère). | vent-ouvert-390 | 390 |
| PCN-43 | corrige | 390 : « 2 façons · 6 articles · 1 en veille » sur une ligne ; aucun « 0 façon » ; rubrique « À comparer » vert pâle. | liste-390-clair, liste-390-sombre | 390 |
| PCN-46 | corrige | 1280 : Comparer 736 px, comme le carnet (736). | comparer-1280 | 1280 |
| PCN-47 | corrige | « Critère : tient 80 °C, puis le débit · proposé par l'IA » sur une ligne ; tableau à y 280 sur 844. | vent-ouvert-390 | 390, 1280 |
| PCN-13 | corrige / ouvert-gemini | « 1re sur 4 », héros « le débit 1 800 m³/h », « la plus haute des 4 », « Choisir · Inox Broye » vert (6,1:1). Photo de page : aucune au banc. | article-390, article-1280 | 390, 1280 |
| PCN-20 | present | g35=1, Ventilation › Supprimer le carnet : « Il part avec… La veille du prix… s'arrête » ; aucune offre « déplacer dans… · Déplacer ». | g35-supprimer-390 | 390, 1280 |

| PCN-10 | corrige | Pompes inox puis magnétique : « 1 Pompe magnétique 12 V · 100 °C · 245 », « 2 Pompe de transfert inox · 90 °C · 690 » : classé par max °C. | pompe2-plein-390, pompe2-1280 | 390, 1280 |
| PCN-23 | corrige (défaut neuf 2) | Puce « ✻ Comparer sur le débit (L/min) · Ajouter » touchée : « ✓ Rangé ici · Annuler ». Mais critère écrit « puis Comparer sur débit ». | pompe-puce-390, pompe-puce-1280 | 390, 1280 |
| PCN-40 | corrige | Lien déposé « 245 CHF », article « 2 600 CHF », Pourquoi « 4 900 CHF » ; tableaux : colonne « CHF » en tête. | pompe2-plein-390, article-390, pourquoi-390 | 390, 1280 |
| PCN-41 | corrige | Comparer : rubrique « écarté », « Ventilateur de plafond 130 cm » une fois, accord masculin ; Retenir la hotte : aucun écarté. | comparer-plein-390, choisir-390 | 390, 1280 |
| PCN-19 | present | « moins de 60 dB » envoyé : « ✓ Rangé ici » ; feuille « Ressemble à un critère · Passer » jamais vue (aides du banc allumées). | vent-60db-390, vent-60db-1280 | 390, 1280 |
| PCN-20 | present | g35=1, Ventilation › Supprimer le carnet : « Il part avec… La veille du prix… s'arrête » ; aucune offre « déplacer dans… · Déplacer ». | g35-supprimer-390 | 390, 1280 |
| PCN-21 | corrige / ouvert-gemini | 📷, image, Ajouter : « ✓ Photo rangée ici · Annuler ». « non lue » jamais vu (IA simulée). | photo-apres-390, photo-apres-1280 | 390, 1280 |
| PCN-22 | present (moitié) | « IA éteinte : rangé sur l'appareil, tel quel · Annuler » (et « Hors ligne : … ») ; mais « filtre à air G4, 2 pièces » rangé en Notes, pas à acheter. | iaeteinte-apres-390, horsligne-apres-390 | 390, 1280 |
| PCN-24 | corrige / ouvert-gemini | De zéro : 5 phrases → 5 carnets (frigo, hotte, évier, tuyau, résine) ; le sol n'est critère d'aucun. 3 attendus : regroupement = vraie IA. | zero-liste-390, zero-liste-1280 | 390, 1280 |
| PCN-27 | present (choix) | 1280 : « Idée · 19 nov. » en pastille, « Façons · aucune », « Photos · aucune » ; encadré R11 réduit : conformité à g5:v04-4 au brasseur. | creer-pendant-1280-clair | 1280 |
| PCN-31 | corrige | 1280 défilé : champ 743–787 sur 800, collé en bas ; segments en tête. | vent-bas-1280, vent-bas-1280-sombre | 1280 |
| PCN-33 | corrige | ··· d'une note › Modifier : « Se modifie ici » à y 577/844 sans défiler, texte de la note dans le champ. | note-modifier-390, note-modifier-1280 | 390, 1280 |
| PCN-35 | corrige | Supprimer le carnet lié (Frigo) : page sans « votre phrase en titre ». | lie-supprimer-390-clair | 390, 1280 |
| PCN-42 | present (moitié) | Lien « … · plan dans À venir » sur 2 lignes ; mais la puce « À venir · ZZ TEST — Frigo… » reste sous la carte. | lie-supprimer-390-clair | 390 |
| PCN-45 | corrige (estimé) | Supprimer grisé, bord pointillé : #666 sur rose 7 % ≈ 5:1 clair ; sombre ≈ 6:1 (calcul alpha fait à la main). | lie-supprimer-1280-clair, -sombre | 1280 |
| PCN-37 | non tranché | 390×660 : bulle G8 et champ à y 563–607 ; aucun clavier en sans écran : vrai téléphone requis. | clavier-390x660 | 390×660 |
| PCN-39 | corrige | À venir : « Ouvrir le carnet » ×1, aucun « + » de page (seul le bouton flottant), titre entier. | avenir-390, avenir-1280 | 390, 1280 |

| M9-3 | non tranché | Feuille Dépense non atteinte par le script : ni « Somme », ni pied « Lignes », ni « Retirer la ligne 3 » trouvés (ouverture à revoir). | m93-avant-390 | 390, 1280 |
| LR1-9 | non tranché | Sonde de 6 états (3, deux-taux, s6, commande, vaccins, renovation) : aucun « Voir le désaccord » ; serveur tombé ensuite (ERR_CONNECTION_REFUSED). | — | 390 |
| LR1-14 | non joué | Clôture Finances › Annuel en local non jouée (contexte de la voie épuisé). | — | — |

## REPRISE (contexte de l'agent à 185 k)

- Serveur Vite 5181 arrêté (plus rien n'écoute sur 5181) ; à relancer pour la suite.
- M9-3 : la feuille ne s'est pas ouverte par « Actions rapides › Entrer une facture » ; ouvrir `m93-avant-390.png`, corriger l'ouverture, rejouer.
- LR1-9 : aucun état du banc n'a de désaccord parmi 6 sondés ; il reste familles, lenteur-lue, port, sinon besoin d'une fixture (hors voie, lecture seule).
- L11 parcours réel non abouti : en `?dev-local`, Stocks › Matériel ouvert, mais le segment « Carnets 0 » non touché (sélecteur exact) ; patch tenté
  dans `S.app` (vérifier qu'il a pris), puis `node rejeu.mjs 5181 app`.
- LR1-14 : Finances › Annuel « n / 9 prêtes » avant et après Confirmer d'une dépense `depense=3`, en local.
- Défaut neuf 6 à confirmer sur capture (Frigo, `lie-ouvert-390-clair`, défiler).

## Défauts neufs (question « combien et quels problèmes ? »)

1. Créer « Moulin à malt 2 cylindres, 150 kg/h » : le critère garde « Débit : 150 kg/h au moins », « 2 cylindres » disparaît de « Ce qui compte » (creer-apres-plein-390).
2. Puce D-35 acceptée : le critère devient « Supporter le moût chaud, puis Comparer sur débit » : le libellé de la puce est recopié (journal pompes).
3. Pompe : la puce « ✻ Comparer sur… » colle à « 2 articles à comparer » sans marge (pompe2-plein-390).
4. 1 fois sur 9 (creer 1280 clair), le carnet créé s'est refermé en ~5 s, liste sans le nouveau carnet visible en tête ; non reproduit en 4 essais (creer-apres-1280-clair).
5. Comparer 390 : la pastille de statut « À comparer » est beige, la rubrique de la liste vert pâle : deux couleurs pour le même statut (comparer-390, liste-390-clair).
6. Frigo : « votre phrase en titre » paraît seul sous les articles, sans la phrase (journal lie, extrait) : à confirmer sur capture.

