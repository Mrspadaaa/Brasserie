(Sonnet)

Mon critère : ce qui entre dans `FicheHoublon.tsx` sans refaire la feuille, avec les données déjà lues en direct (`familyWords`, `sources.ts`). Du plus léger au plus lourd :
1. **fla5** : le plus léger (regroupe les `citees` par statut de style, lit `biere.profil`). Limites : sur Nelson, « 0 mots que ta stout attend · 0 déjà trop marqués » redit « ordinaire » alors que ses 7 mots sont mesurés ; sans dégustation, étagères vides : repli sur g1 nécessaire.
2. **flu2** : léger (`COULEURS`, `Picto` existent) ; mais les mots anglais (« woody ×2, resinous ») viennent de sources autres que Beer Maverick, et `fr()` ne traduit que Beer Maverick : une table de traduction est une donnée neuve. Aucun état Nelson capturé (L14).
3. **flb3** : la phrase suppose un mot partagé par toutes les fiches : Nelson en a, Nugget et Cascade non ; règle de repli à capturer. Ses onglets de houblons sont étrangers à la fiche (on l'ouvre par appui long).
4. **flc8** : moyen ; tampons par mot possibles (`sansFamille` a la source) ; mais `flc8-nelson.png` fait plus de 1 688 px, neuf cases « personne » vides ; il perd le pied g1, l'étape et le radar étiqueté (règle n° 1).
5. **fld8** : le plus cher et le plus étroit ; l'iceberg dépend du nombre de mots hors des 12 : vide sur 4 houblons sur 5 (Nugget : « gingembre » ; Cascade : aucun) ; eau bleue hors thème (D106). Ne tient que greffé au radar (flu6).

Angle mort du critique : il ne chiffre pas la table de traduction ni le repli sans dégustation. Premier geste : lecture, sans geste neuf.

Position : autre voie : garder fla5, flu2, flc8 et flb3 ; remplacer fld8 par flu6 (greffe de fld5), qui réutilise `RadarFiche` ; fld8 montré seulement comme greffe « Hors des 12 ».
