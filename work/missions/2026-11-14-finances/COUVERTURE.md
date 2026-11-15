# Couverture des vues de Finances (14.11, soir)

Demande (session parente, 14.11) : le brasseur, « J'ai l'impression que tout les écrans sous les boutons de ces Tabs ne sont pas traitées ??? ».
Lecture : chaque vue qu'ouvre un bouton des onglets de Finances a-t-elle une maquette choisie ? Sinon, 4 mini maquettes au moins.
Sources : `work/refonte-frontend/v4/choix/ecrans.json`, `ecrans-app.json` et le code (`src/components/tabs/FinancesTab.tsx`, `TransactionJournal.tsx`).

| Vue | Ouverte par | Maquette choisie | Page | Mini maquettes 14.11 |
|---|---|---|---|---|
| Synthèse | onglet | g3a | https://claude.ai/artifact/1ePJcgviBQ5SqzqJe7w2Su | — |
| Analyse | Synthèse › Analyse | a2a | https://claude.ai/artifact/1u4n7VUJskLyi4BCiYhCAY | — |
| Opérations (rangées, frise du … au …) | onglet | v6a + s2ap2 | https://claude.ai/artifact/TVUKKH2kF17shw3e44zmQm, https://claude.ai/artifact/2xGEV9qoGgzadUBHVm2dsU | — |
| Prévisions | onglet | p5b | https://claude.ai/artifact/TVUKKH2kF17shw3e44zmQm | — |
| Annuel et clôture (inventaires) | onglet | g6, avec les 9 écrans de clôture de g4a | https://claude.ai/artifact/Du3g2PfGqwka9cLuEHcWPe | — |
| Ajout d'une dépense, caisse | Mon mois, + | f2d | https://claude.ai/artifact/KrAgKX1bDreQQUxZaNZEsK | — |
| Filtres (panneau ouvert) | Opérations › Filtres | aucune (v6a dessine le bouton seul) | — | m1 |
| Doublons | Opérations › Doublons | aucune (bouton seul) | — | m1 |
| Archives et « Gérer les archives » | Opérations › Archives | aucune (bouton seul) | — | m1 |
| Apport ou prélèvement privé | Opérations › Apport… | aucune (bouton seul) | — | m1 |
| Fiche d'une opération | toucher une rangée | aucune | — | m2 |
| Payer | « à payer » d'une rangée, fiche | aucune | — | m2 |
| Modifier, « + pièce » | fiche, rangée | aucune | — | m2 |
| Ajouter une prévision | Prévisions › + | aucune | — | m3 |
| Projet matériel | Synthèse, Prévisions | aucune | — | m3 |
| Immobilisation (bien amorti) | Annuel › étape des biens | aucune | — | m3 |
| Coût d'un brassin et du litre (feuille du budget) | Synthèse, Prévisions | c3a (porté) | https://claude.ai/artifact/1ePJcgviBQ5SqzqJe7w2Su | — |
| Choix du brassin et entrée du budget (ce que c3a ne dessine pas) | Synthèse, Prévisions | aucune | — | m4 (pistes autour de c3a, qui reste) |
| Impôt bière, et de l'année | Annuel | p2b, i1a | https://claude.ai/artifact/TxmDK9GPdx61jP3UG7kTLS, https://claude.ai/artifact/Hy1x2S4oV5YM5aQ2FhDHyE | — |
| Prix et marges ; prix et impôt depuis le brassin | Prévisions, brassin | c7c, e3a | https://claude.ai/artifact/TVUKKH2kF17shw3e44zmQm | — |
| Facture de vente, caisse | Ventes | v3a | https://claude.ai/artifact/1ePJcgviBQ5SqzqJe7w2Su | — |
| Profil et paramètres | Synthèse, Prévisions, Annuel | aucune | — | m4 |
| Assistant IA | chaque onglet | aucune | — | m4 |

13 vues sans maquette, 4 mini maquettes chacune (52). Page : https://claude.ai/artifact/AgKn2qcDMyGLrKuJNmsUqX (critique Opus : `critique/sv/SYNTHESE.md`, défauts corrigés en passe 2).
