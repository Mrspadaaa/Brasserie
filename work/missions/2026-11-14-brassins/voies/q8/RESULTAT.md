OK — 8 tests anciens adaptés aux maquettes choisies, aucun code touché ; 26 fichiers, 236 tests verts, tsc propre.

## Fichiers écrits
Les 8 tests de `echecs.txt` ; `voies/q8/tests.txt` (sortie de la ligne « Tests ») ; ce RESULTAT.md. Aucun fichier `src/` modifié : aucune régression de code trouvée.

## Une ligne par fichier
- `batchAm4Am5.test.tsx` : test adapté. Le sélecteur « Étape du brassin » n'existe plus en fermentation (e3gb : « Passer en garde froide », « Revenir · abandon »). La règle « jamais Planifié ni Terminé » se vérifie sur `statusOptions` (domaine) et sur les boutons. AM 5 (bornes OG/FG, garder cette valeur, annuler la saisie) : mêmes règles, champs ouverts par « Corriger les mesures (OG, FG, volumes) », rangés sous le Dossier (gfc n° 10).
- `batchFollowUp.test.tsx` : test adapté. L'abandon passe par « Revenir · abandon » puis « Annulé (abandon) ». Le relevé décimal se fait par « Mesurer » → « Taper » → « Enregistrer le relevé » (gfc) ; mêmes écritures vérifiées (OG, FG et relevés conservés, aucune température inventée). Le message « Relevé ajouté au suivi. » n'existe plus dans cette fiche : le test vérifie que le geste se referme.
- `contactConversionUnique.test.tsx` : test adapté. « Convertir en client » est au pied de la fiche du contact : on l'ouvre depuis la carte du carnet (« Ouvrir : … »). Le verrou du double toucher est toujours vérifié (une seule fiche client, un seul message).
- `dashboardNavigation.test.tsx` : test adapté. Tiroirs « À faire 2 » (compteur dans le nom), notes = cartes « Ouvrir : <titre> » au lieu d'en-têtes ; l'entrée générique de l'Atelier ouvre « Tout » (plus Matériel). Demande de rubrique consommée une fois : inchangé.
- `equipmentProjects.test.tsx` : test adapté. L'ajout rapide R&D donne la main à « Ta note » (e9na) au lieu d'ouvrir « Prévoir du matériel » d'office ; il se consomme une fois, et passer au tiroir Matériel ne le rouvre pas.
- `liveDataViews.test.tsx` : 2 tests adaptés. (1) La lecture de densité en cours est le geste « Mesurer » → « Taper » ; elle survit à la mise à jour serveur, le nom confirmé arrive dans le titre, et l'enregistrement écrit le relevé. (2) Une idée de matériel vit dans le tiroir Matériel (lien du carnet vide), plus dans « Tout » ; actualisation et « Réalisés » vérifiés.
- `productionCatalog.test.tsx` : 4 tests adaptés. Dossier (Courant/Archives) et analyses des brassins se choisissent dans la feuille Filtrer (e6c : groupe « Dossier », lien « Voir les analyses des brassins ») ; la période de départ de la liste est « Ce mois + en cours » (e6a), le test l'élargit à « Toutes » avant d'attendre un lot conditionné de septembre ; le bouton d'un lot sans note s'appelle « Déguster · DONE » (ouvre toujours la dégustation). Les recettes gardent leur barre : tests inchangés.
- `bDiversContraste.test.ts` : test adapté, couleur intacte. La ligne « 🎨 Visuel : … » (or italique) n'existe plus (notes libres de la fiche idée en texte normal). La règle BE-24 est gardée sur les six fichiers de l'Atelier : aucun `text-ebc-gold/NN`, et le jeton `--ebc-gold-texte` tient 4,5:1 sur #dedede et sur le blanc du thème clair.

## Critères
- G1 : `TESTS OK` : 26 fichiers, 236 tests (`tests.txt`).
- G2 : `TSC OK`.
- Essais : 1 à 3 par fichier, aucun épuisé. Piège rencontré : un script Bash a perdu des barres inverses (`\d`, `\n`) deux fois ; corrigées à l'Edit, puis rejeu complet.

## Doutes et limites
DÉCISION À PRENDRE : en fermentation, le Dossier (e3gb) n'offre que « Passer en garde froide » et « Revenir · abandon ». Le passage direct fermentation → Conditionné, que l'ancien sélecteur offrait (et que `statusOptions` autorise toujours), n'a plus de geste visible. Options : (a) le laisser (la maquette gagne ; on passe par la garde) ; (b) ajouter un lien « Conditionner directement » dans « Revenir · abandon ». Recommandation : (a) tant que le brasseur ne le réclame pas ; à lui de le dire (règle n° 1).
Aussi : « Relevé ajouté au suivi. » n'a plus de confirmation écrite dans la fiche gfc (le graphe la porte) : à juger en capture, pas ici.
CONNAISSANCE : la liste des brassins (e6a) part sur « Ce mois + en cours » même si l'en-tête dit « Toutes » ; un test de liste qui vise un lot ancien doit élargir la période dans la feuille Filtrer.
LEÇON PROPOSÉE : aucune
