# Dossier liste (voie 3)

Maquette base : maquettes3/src/v01.mjs écrans `liste` (l. 28-51), `saisie` (l. 53-67), `epreuve` (l. 191-201) ; atomes.mjs
(`ecranListe`, `AUTRES` : sous-domaines repliés « ▸ Froid 2 · Chambre froide · Frigo + congel · Dans À venir », `g-dn`
en-tête de domaine, `g-sd` sous-domaine, `CHAMP`). Greffe 1 : maquettes2/v01 écran `liste` (sous-domaines dépliés :
« ▾ Matières premières 2 · Houblons citra · à comparer · ≈41 /kg », « Récolte houblon du jardin · 0,52 kg »).

Liste (VERDICT § 4 n° 1) : coup d'œil en 4 cases colorées (je cherche, décidés, notés, résolus <année>) ; filtres « Arbre ·
À faire n · 🔔 n » ; arbre Domaine › sous-domaine : chaque problème avec picto de catégorie, titre, jauge, état, dernier
pas ; autres carnets repliés par sous-domaine avec leur valeur utile (≈ 41 /kg, budget, « Dans À venir », dernier pas) ;
« Résolus 2026 n » replié ; champ « Une idée, un problème… » avec photo et micro (CR-VOIX : jamais un écran voix) ; + volant.
Ses mots : arbre « J'aime quand même bien soit une petite icône, soit photos, soit les deux » (CLASSEMENT-1, B6) ;
« on perd le chat facile d'accès » (B4).

Saisie rapide (n° 2) : feuille ; la note ou la photo en bulle ; carte « rangé pour toi » : picto + titre, « Domaine › … »,
jetons « nouveau problème » ou « rattaché : « citation » », état ; « Tâche proposée : … » ; boutons OK, Changer,
Rattacher à… ; champ « Ajouter à <court>… » dessous. Appliqué + Annuler pour le rangement ; la tâche reste proposée.

Imprévus (n° 8) : l'arbre porte « Brasserie › Événements », « Papiers › Assurances », « À ranger n » (fond ambre) ; la carte
« Rattacher à … ? » est `CarteARanger` de la voie afaire.

Disparaît : groupes par état et puces Tous / Local / Brasserie (ListeCarnets l. 315-391, Domaines.tsx) ; « dès » et prix à
droite (l. 112-140, 296), remplacés par la valeur utile ; « votre lien » (Bandeau l. 217-218, LigneRangee l. 46-47) ;
groupe « Faits » si la maquette ne l'a pas (les résolus le remplacent).
Gardé : barre de lecture d'un lien et ses 5 états, bandeau « en lecture », Annuler, recherche (loupe), hors ligne.

Branchement : `RelectureResolus`, `ResoluProbleme` (voie probleme), `AFaire`, `CarteARanger` (voie afaire) ; intentions et
projections de la voie domaine ; propositions de la voie ia (`deplacer`, `tache`, `retenir`…) rendues en cartes OK · Non.
`?carnet=v0` : l'ancienne liste, pour défaire le port sans revert (D451).

Tests (Vitest, `listeRegles.ts`) : valeur utile d'un carnet replié (houblons, matériel, mémo, idée sans prix : rien, jamais
0) ; filtres À faire et 🔔 ; ordre des domaines et des sous-domaines ; coup d'œil sur une liste sans problème (4 cases
toujours, comme la maquette ; un compte nul s'écrit 0 : c'est un compte, pas une valeur inconnue) ; cas neufs (fête, assurance, photo seule).
