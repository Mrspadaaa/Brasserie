# Sessions ouvertes : état au 16.11 (lecture seule, rien envoyé)

Sources : 15 derniers messages de chaque session (list_events) et BUGS.md « Jeu en ligne nuit 16.11 », constats 1 à 37.
Limite : Stock renvoie 0 message lisible (même à 80) ; Atelier, Simplicité, Besoins et Brassins n'ont que des appels d'outil dans les 15 derniers, d'où une fenêtre élargie à 80.

## Une ligne par session

- Finances (5ff589f3) | idle | attend : personne (tag local non poussé : le pilote pousse ou déploie) | fait : 20, 21, 33 corrigés, version b37600f5 en ligne, tag en-ligne/2026-11-16-finances-rejeu posé en local, pas poussé | reste : 5 mineurs FN-22 à FN-26 au registre (probables 22, 24, 25, 26 de BUGS : à rattacher)
- Atelier (e99ca24a) | idle | attend : le brasseur, pour la vente réelle de 5 695,00 (569,50 pour une bouteille 75 cl, constat 12) | fait : 31 (idée de tarif supprimable) et 12 (prix « à vérifier » ouvre la vente sur Tarifs), 9aded49a, en-ligne/2026-11-16-atelier-tarifs, commit 95761392 | reste : 11, 13 (coût Gemini non joué), 16 ; 7, 8, 10, 14, 15 rejoués corrigés
- Menu (e5e62b78) | idle | attend : rien de nommé ; « jouer en ligne sur ZZ TEST » est pour lui-même | fait : 32 (cas voisin, cause non prouvée) et 34, 43f0ce40, en-ligne/2026-11-16-transversaux-2 | reste : jeu en ligne de ces deux corrections ; 33 corrigé côté Finances
- Recette (a4ed6d7f) | idle | attend : le brasseur (« mise en ligne des corrections du matin, ou on attend ? ») ; elle refuse de prendre la demande d'une autre session comme son accord | fait : 36 (suppression aussi dans le « + »), 37 (manque 5 kg et non 49), volume d'en-tête, « + » de l'assistant, ab6c4327, rien en ligne | reste : fiche Stock affiche encore « manque 49 kg » (autre session) ; 17 échecs de suite dont 15 hors de ses voies ; voile coupé à 1280 ; Citra amérisant / aromatique
- Simplicité (09ea1c13) | idle | attend : le brasseur : « Choisis puis colle-moi tes ids » (16 astuces, page https://claude.ai/artifact/82HDNSfh4ADr8aigeigoH1) | fait : page refaite, 40ac818e et 1ba71596 | reste : critique non rejouée ; aucun constat BUGS (mission de choix)
- Besoins (7b923897) | idle | attend : rien ; ouvre à la passe 9 (calendrier seul, depuis nuit/p8/SYNTHESE.md), reprise au quota hebdo | fait : passe 8 publiée (https://claude.ai/artifact/XGruc3oMZKgHU1MGJ3rNbt), e3 convergé, b57516ad, rien déployé | reste : calendrier c à 8/10 (bande en haut bloque « + Chose » et Plein écran) ; aucun constat BUGS
- Brassins (8c032586) | idle | attend : rien | fait : 2, 3, 4, 5 corrigés, 1 et 6 non reproduits, en-ligne/2026-11-16-brassins-nuit, c5783fdf | reste : jeu en ligne rejoué en partie (2, 3, 4, 6 corrigés ; 5 en partie) ; échec neuf coutBrassinRenvois (fichiers Finances)
- Stock (4e8f1e9b) | idle | attend : inconnu (transcript vide) | fait : inconnu | reste : fiche Stock « manque 49 kg » (lien avec 37)
- Fûts (a10a1409) | idle | attend : rien | fait : textes de remplissage refusé et « Marqué propre » corrigés, c18530a8, en-ligne/2026-11-15-futs2 (avant la nuit) ; cas non joués à la main dans Chrome | reste : 28, 29, 30 non rejoués ; 29 (fût neuf toujours propre, pas de « À laver ») sans correction
- Matériel (a5eb4b3e) | idle | attend : le brasseur, pour /compact (contexte 528 k) | fait : za3 dans Stocks > Matériel, eb0e78e3, en-ligne/2026-11-15-materiel ; 0 bloquant, 4 mineurs | reste : Annuler non prouvé en ligne ; pas de constat BUGS nommé (7 et 8 relèvent de l'Atelier)
- Aide au brasseur (ecf2acda) | idle | attend : rien | fait : compagnon p2a, b65b418d, en-ligne/2026-11-15-compagnon, joué en ligne sur le Brassin 7 | reste : identifiants bruts (TX-…, cashComplete) dans les réponses du serveur Finances ; 13 (coût Gemini) non joué

## Constats ouverts sans propriétaire clair

Ouvert = non corrigé ou non rejoué après correction, aucune session ne s'en dit chargée.
- 11 : notes de type Tarif mêlées aux tarifs (Atelier l'a vu, n'a pas dit l'avoir pris)
- 13 : appel IA à l'enregistrement du Carnet, coût Gemini, jamais joué
- 16 : premier clic avalé après fermeture d'une feuille (non reproduit au script, à jouer au pointeur)
- 17, 18 : Finances, non reproduit ; 18 (page pleine largeur, libellé « Total TTC » collé) non rejoué
- 22 : « Rien de prévu » affiché après enregistrement d'une prévision
- 24, 25, 26 : Budget d'un brassin (« Prix de4 »), frise du solde (mois répétés), projets de matériel (ZZ coupé) ; sans doute FN-22 à FN-26 de Finances, à confirmer
- 28 : feuille « Ajouter des fûts » pleine largeur ; 29 : fût neuf toujours propre ; 30 info
- 37 : stock de malt négatif (49 kg) : corrigé dans la recette, pas dans la fiche Stock
- 19 L (assistant de recette) : critère inconnu, à reprendre
- m3im-c (Bien amorti) : jamais joué ; refus de remplissage d'un fût sale non jouable sur ZZ
- 5 : « fin non datée » toujours affichée sur tous les jours, corrigé en partie seulement
