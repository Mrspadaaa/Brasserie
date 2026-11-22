# CHASSE-carnet (CRP) — prix absent et « &apos; » (tour8, 21.11)

Portée : diagnostic par le code du tag `en-ligne/2026-11-21-tour8` (lu par `git show`) et ses captures 01 à 04. Pas de banc Chrome ni de passe complète du Carnet : un seul sujet, la cause. Rien de rejoué à 1280 ni en cave. Un test à blanc de `lirePage` (HTML synthétique, `exemple.invalid`, aucun réseau) a été joué dans os.tmpdir().

## CRP-1 (bloquant) — le prix lu sur la page n'arrive jamais à l'article

Constaté (02, 03, 04) : Chambre froide, 2 articles « en stock », ni prix dans la liste ni colonne prix dans Comparer.

**Cause : donnée lue côté serveur, jetée côté client.** Trois maillons :

1. `functions/src/lireLien.ts:136-141` : le prix n'est rendu que si toutes les offres sont simples et du même prix. Une `AggregateOffer`, deux offres de prix différents, une devise absente, ou un prix `"4 890.00"` / `"4,890.00"` (`nombre`, l.106-108 : `^\d+(?:[.,]\d+)?$`, refuse les séparateurs de milliers) donnent `prix` absent. Voir aussi le repli `og:price`, l.148-149. Mesuré (banc à blanc) : offre simple → 4890 CHF ; AggregateOffer, deux offres, sans devise, « 4,890.00 » → aucun prix. Détail : « en stock » (captures) est lu sur les mêmes offres simples (l.136-143), donc des offres existent ; le prix manque ensuite pour un des motifs ci-dessus **ou** au maillon 2. Je n'ai pas la page réelle : lequel, non établi.
2. `src/domain/carnets/ia.ts:278-286` : `ligne.prixCentimes` n'est posé que si le **modèle** renvoie `r.prix` et que ce nombre est dans le texte ou égal à `p.prix`. Si l'IA ne le renvoie pas (hors ligne, échec, repli `analyseLocale`, `rangement.ts:338-348`), la ligne n'a pas de prix, même si la page en avait un. Aucun `p.prix` n'est lu ailleurs que dans ce test de contrôle (grep sur `src/domain/carnets` et `src/ui/carnets`).
3. `src/ui/carnets/CarnetsVue.tsx:438` : `prixCentimes` de l'article vient de `l.prixCentimes` seulement ; `p?.prix` / `p?.devise` de la page (l.427-433, qui copie pourtant nom, photo, dispo, valeurs) ne sont pas repris. Écart avec CarnetsVue.tsx:431-432 qui copie les valeurs sans passer par l'IA.

Affichage : sain. `Comparer.tsx:34` n'ajoute la colonne `prix` que si une ligne a `prixCentimes !== undefined` ; `CarteArticle.tsx:116,239`, `FicheArticle.tsx:87`, `ListeCarnets.tsx:93` lisent `prixCentimes`. Pas stocké car jamais posé : `operations.ts:156` accepte `prixCentimes` s'il arrive.

Attendu : le prix lu sur la page figure sur l'article, sinon « prix non lu » dit sur la ligne (jamais 0). Remède suggéré (sans code ici) : maillon 3 reprend `p.prix`/`p.devise` quand l'IA n'en donne pas ; maillon 1 accepte les milliers suisses (`'`, espace, virgule) ; un test sur une page à prix `4'890.00`.
Gravité : bloquant (le prix est le premier critère d'achat ; CRN-PRIX, déjà ouvert, le confirme sans en donner la cause).

## CRP-2 (gênant) — « l&apos;isolation » rendu brut

Constaté (04) : ligne « Épaisseur de l&apos;isolation » dans Comparer.

**Cause : `lireLien.ts:99-100` lit le JSON-LD par `$(el).text()` puis `JSON.parse` ; le contenu d'un `<script>` n'est pas décodé par cheerio**, et `chaine` (l.27) ne décode pas. Un « &apos; » écrit littéralement par le vendeur dans son JSON-LD (courant chez les boutiques qui échappent leur JSON comme du HTML) traverse `additionalProperty` (l.158-165, nom limité à 60 car.) jusqu'à `valeurs[v.nom]` (`CarnetsVue.tsx:432`) et `Comparer.tsx` colonne `c.nom`. Mesuré (banc à blanc) : `name: "Epaisseur de l&apos;isolation"` ressort à l'identique de `lirePage`. Hypothèse sur la page réelle (non lue) : le même mécanisme ; le texte HTML ordinaire, lui, serait décodé par cheerio.
Attendu : « l'isolation ». Le correctif unique : décoder les entités des chaînes `name`/`value` de `additionalProperty` (et nom, vendeur) dans `lireLien.ts`, côté serveur ; les articles déjà stockés gardent l'entité (à nettoyer à la lecture ou à la relecture).
Mêmes chaînes touchées : tout nom ou valeur de caractéristique, d'où aussi l'ID de colonne de comparaison (deux articles à noms échappés différemment ne se rangeraient pas dans la même colonne).

## Non élucidé (à rejouer en banc, pas de défaut chiffré)

- Comparer, capture 04 : libellés de caractéristiques sans aucune valeur visible dans la colonne montrée (« Dimensions du produit », « Couleur : », « Performance » …). `comparer.ts:96-101` rend `undefined` si le nom ne correspond pas ou si l'unité diffère ; ou la colonne de l'article 1 est hors vue (défilement latéral, `Comparer.tsx:147-159`). Je ne peux pas trancher sur la capture seule.
- Lignes vides « Ce qui compte · rien encore », « Façons · aucune », « Notes · aucune » au premier plan : déjà CRN-PRIX (DEFAUTS-RECURRENTS l.475), non recopié.

Rien d'autre n'a été joué (liste, renommage, « Coller un lien », ajout, notes, 1280) : les lignes CRN-1 à CRN-21 de BUGS.md ne sont pas recopiées.
