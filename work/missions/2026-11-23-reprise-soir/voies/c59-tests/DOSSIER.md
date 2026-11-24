# Dossier c59-tests — règles tirées du test en ligne du tour 59 (voies/critique-59/RESULTAT.md)

Lignes complètes : `grep -n "^| C59-\|^| C58-3 \|^| C58-4 \|^| C50-5 " work/missions/BUGS.md`. Sa plainte du 24.11 16:46 (work/refonte-frontend/v4/SPEC-BRASSEUR.md, DEFAUTS-RECURRENTS § LIEN-PRIX-JUSTE, COMPARER-QUI-GAGNE).
- R35 (C59-1, BLOQUANT) : « Relire » (et toute écriture d'une lecture) n'écrit QUE dans le carnet et l'article d'où il est touché ; jamais d'article déplacé d'un carnet à un autre.
- R36 (C59-4, C55-2 revenu) : un critère de carnet (« Marmite de brassage 50 L ») classe les articles par leur proximité au critère ; un article hors genre ou loin du critère ne passe jamais 1er.
- R37 (C59-6, LIEN-PRIX-JUSTE) : un prix lu sans quantité (« dès 0,10 », prix par gramme ou variante minimale) n'est jamais comparé comme un prix d'article : soit le prix du conditionnement (50 g, 100 g…) avec sa quantité, soit prix au kilo dit comme tel ; sinon « prix ? » et pas de rang. Pages réelles : https://www.motlerhops.fr/collections/tous-nos-houblons/products/citra-us , https://www.brauundrauchshop.ch/citra-136-2 (relevés dans work/missions/2026-11-24-carnet-personas/brasseur/RESULTAT.md).
- R38 : C58-3, C58-4, C50-5 rouverts et les autres C59 (voir lignes), chacun en règle générale.
Code : src/ui/carnets/, src/domain/carnets/, functions/src/lien*, carnetIA.ts.
