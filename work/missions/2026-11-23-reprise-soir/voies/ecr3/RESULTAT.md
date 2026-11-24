OK — E40-1 à E40-7 corrigés en local (tests verts, tsc sans erreur neuve), registre à jour, prêt à mettre en ligne 6d3412bed

PRÊT À METTRE EN LIGNE 6d3412bed (code : 18425742c ; registre : 6d3412bed)

## Plan (cause, fichier:ligne, correctif)
| constat | cause | correctif |
|---|---|---|
| E40-1 occurrence fantôme « à payer » | `forecast.ts` (`linked`, ~l.197) ne reliait à une prévision que les écritures `expense` (sortie) ou `income` (entrée) : un apport est `contribution`, un Pour moi `withdrawal`. Aucune écriture liée, donc l'occurrence du 21.11 restait prévue (aujourd'hui 23.11), puis comptée dans « à dépenser » | `linked` accepte `expense`+`withdrawal` pour une sortie, `income`+`contribution` pour une entrée. Même chemin que l'Abonnement : 1re prévision le 21.12. Libellés « à payer » rendus selon le sens (Marque.tsx `nomAccessible`, VueListe.tsx `marqueProposee`) : « à recevoir » pour une rentrée, « prévu » pour le privé |
| E40-2 apport compté dans « +15 prévu » (la décision « hors ventes » n'avait pas tenu) | Deux chemins mènent à une chose d'argent. La pièce (`facture`) était marquée `horsVentes` par `marquerHorsVentes` ; l'échéance d'une écriture qui revient (`plan`) ne l'était pas, donc comptée comme vente | `calendrierPaiements.ts` `marquerHorsVentes` : marque aussi la source `plan`, par l'écriture qu'elle a créée (`finance.planId`) |
| E40-3 Pour moi compté dans Papiers | Aucun marquage du privé sur la chose du Calendrier | Champ `prive` (`calendrier.ts`), posé par `marquerHorsVentes` (plan, pièce) et `chosesPayees` ; `Rangee.tsx` `pastille` : hors du solde de la rangée, dit à part « −2,50 privé, hors total » |
| E40-4 Modifier ≠ saisie | `EditTransactionModal.tsx` : Nom et catégorie/précision en champs, « Montant sans TVA » | Bande « Ça sort / Ça rentre · sorte » (même `sai-sel`), carte (nom, étiquette, pastille de date et sa frise au curseur) et grand montant (`sai-amt`, « CHF », « CHF HT » si assujetti, « avant » barré), catégories en pastilles pour un achat, précision repliée (achat seul). Classes et jetons de la saisie (`sai`), `Ic` et `teinteGenre` exportés de `SaisieMain.tsx` |
| E40-5 toucher la bande ouvre Finances | `CalendrierTab.tsx` `surToucher` : toute `proposition === 'echeance'` allait à `onOpenFinances()` | Retiré : la bande ouvre la fiche (Ouvrir, Lier…) comme la Vente ; « Ouvrir » mène aux Prévisions |
| E40-6 pièces à payer proposées | `piecesRemboursables` sans filtre de règlement | `modele.ts` : exclut `unpaid`, `partial`, `unknown` ; une ancienne pièce sans statut reste proposée. Paramètre `payeesSeulement` (faux pour relire la pièce déjà choisie) |
| E40-7 chariot partout, sous-ligne répétée | `SaisieMain.tsx` : chariot si sort, étiquette si rentre ; sous-ligne `date · description` = nom | `genre` par pièce (`genreDe`), picto `Ic` de la sorte ; sous-ligne « Sorte · jour · libellé si différent du nom » (« Autre entrée », « Autre sortie ») |

## Fichiers écrits
src/domain/finance/forecast.ts ; src/domain/calendrier.ts ; src/domain/calendrierPaiements.ts ; src/ui/calendrier/frise/Rangee.tsx, Marque.tsx, VueListe.tsx (classement et lecture des choses ; hors cadre et entête) ; src/components/tabs/CalendrierTab.tsx (`surToucher`, une ligne) ; src/components/EditTransactionModal.tsx ; src/ui/saisie/SaisieMain.tsx, modele.ts ; src/ui/finance/modifier/modifier.css ; tests/unit/ecr3Recurrence.test.ts, ecr3Calendrier.test.ts (neufs), saisieEcritures38.test.tsx (assertions de E38-4 mises au nouveau dessin) ; work/missions/BUGS.md (13 lignes : E40-1..7 « corrigé » `18425742c`, E38-2/3/5/7/8 et E35-13 « vérifié — en ligne index-CRA3EhuZ.js (tour 40), 24.11 »).

## Critères
- Rouge avant correction, vert après : `ecr3Recurrence.test.ts` (apport et Pour moi : 1re prévision le 21.12, rien au 23.11 ; l'Abonnement comme témoin ; pièces remboursables), `ecr3Calendrier.test.ts` (apport `horsVentes` et Pour moi `prive` sur les deux chemins, pastilles Ventes et Papiers) — 2 + 2 échecs initiaux relevés.
- tsc : 2 erreurs connues seulement (`GanttTask` dans seedData.ts, `virtual:pwa-register`).
- Tests touchés : 63 fichiers (filtres calendrier, saisie, ecritures, caisse, forecast, prevision, finance, Rangee, Marque, VueListe, modifier, operations) : 837 verts. `tests/unit/proprietes` : 8 fichiers, 76 verts.
- BUGS : `BUGS OK : 2186 bugs, 516 ouverts, 202 sources`.
- Essais : un par critère, aucun repris.

## Décisions et limites
- **Pas de capture** (consigne : preuve en ligne par le pilote). Le dessin de Modifier (bande, carte, grand montant, thèmes clair/cave via `.sai`) n'est vérifié que par DOM : à ouvrir en ligne, 390 px, Achat, Vente, Apport, Pour moi, un loyer, un remboursement ; regarder en particulier le grand montant (`.sai-amt input`, `field-sizing`) dans la feuille `mod`.
- **« changer » absent de la bande de Modifier** : le critique l'attendait (« Ça sort / Ça rentre · sorte · changer »). Changer la sorte d'une pièce existante change son sens, sa TVA, son rythme et son grand livre ; je ne l'ai pas câblé. La sorte s'affiche, sans bouton.
- **E40-2 : apport dessiné dans la rangée Ventes, hors du total.** Le constat dit « hors de la rangée et du total », C38-3 dit « visible mais hors du total ». Sa plainte « l'apport s'affiche pas sur le calendrier » demande qu'il se voie : je l'ai gardé dans la rangée (tirelire), hors du total, comme pour Pour moi dans Papiers. Pas de rangée neuve inventée.
- La pastille d'un Pour moi seul dit « n choses » (ou « −2,50 privé, hors total » dans la lecture) : pas de solde.
- Le Calendrier arrondit toujours à l'entier (3,50 → −4) : doute du critique, non traité, hors voie.
- « Mon mois » en pied de saisie sans effet au toucher (G3) : non traité.
- Un apport ou un Pour moi qui revient dans les Habituels dit désormais la même date que les Prévisions (21.12).

DÉCISION À PRENDRE : faut-il une rangée ou un filet à part pour les apports et les prélèvements au Calendrier (plutôt que les loger dans Ventes et Papiers hors total) ? Options : A) garder (tirelire dans Ventes, privé dans Papiers, hors total, dit « hors ventes » / « privé, hors total ») ; B) une rangée « Privé » neuve. Recommandation : A, à montrer en mini maquettes au brasseur seulement s'il le demande (L24).

CONNAISSANCE : une écriture qui revient est reliée à sa prévision par `finance.planId` + `occurrenceId`, et seules les sortes du bon sens comptent (`expense`/`withdrawal` en sortie, `income`/`contribution` en entrée) ; un autre filtre de sorte dans `forecast.ts` refait le défaut E40-1. Les choses d'argent du Calendrier ont deux sources (pièce `facture`, plan `plan`) : tout marquage (`horsVentes`, `prive`) se pose sur les deux dans `marquerHorsVentes`.

LEÇON PROPOSÉE : un contrôle (« hors ventes », « hors total ») posé sur un seul chemin d'une donnée à deux sources revient en bug (E35-2, E38-1, E40-2) ; tester chaque décision de totaux sur chacune de ses sources (pièce payée, pièce attendue, plan qui revient), comme `ecr3Calendrier.test.ts`.
