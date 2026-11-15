OK — e9na corrigé : style, rappeler, fiche de l'idée complète, format du prix, date en colonne, Convertir en client ; n° 1 attend l'accord.

## Défauts [B] de e9na (kq/VERDICT.md)
- [x] e9na n° 1 : « L'IA range » : formule honnête gardée (« Le rangement se propose, tu valides ») tant que la tâche `rangerNote` n'existe pas côté serveur. ATTEND L'ACCORD du brasseur (déploiement des fonctions) ; la lecture locale reste le repli prévu. Rien d'IA n'est affiché ni appelé.
- [x] e9na n° 2 : pastille de style sans champ neuf. `styleDe` lit le mot de style du texte (« Ambrée forte », « Lager »…) ou « Style : … » dans `notes` quand le brasseur corrige ; pastille sur la carte, la fiche et la ligne de rangement (là, toucher en mode Corriger la fait défiler, puis « aucun »). « rappeler » : pastille de la carte contact quand la note demande de rappeler ou relancer (`rappelDe`).
- [x] e9na n° 3 : fiche de l'idée : pastille de style, Degré visé, Arômes, Pour (+ date de l'idée si saisie), Tarif, Recette, « N notes du carnet en parlent » avec leur liste (marge de couleur, date). « non saisi » quand vide. Tout se lit dans les mots de l'idée (`lireIdee`) ; « Recette » dit « écrite : <nom> » si une recette de même nom existe, sinon « pas encore écrite ». Les notes citées (`notesQuiCitent`) : l'idée, deux mots marquants communs (titre, arômes) ou une note de tarif au même prix ; une lecture du texte, pas un lien enregistré.
- [x] e9na n° 4 : « Tarif 6,00 la 33 cl · marge 3,90 » : le format vient du texte de l'idée ou d'une note de tarif au même prix ; sinon « 6,00 CHF, format non noté ».
- [x] e9na n° 5 : « Garder ce tarif dans le carnet ».
- [x] e9na n° 6 : vide : « Essayer un prix de vente » prend la forme du lien Matériel (icône portefeuille, même gabarit). Le quatrième exemple (« Commander 300 bouteilles… ») que la maquette n'a pas est retiré : trois, comme sa PNG.
- [x] e9na n° 7 : la date a sa colonne (flex : texte `flex-1`, date `shrink-0`) sur chaque carte ; plus de « 2,10.06.11 » collé (capture repos 390 cave ouverte).
- [x] e9na n° 8 : « Convertir en client » : nouvelle `FicheContact` (feuille du prospect : texte, Contact, Téléphone, Modifier, **Convertir en client** en pied ; « Déjà client » désactivé si converti). Même règle BE-22 (verrou synchrone, déjà-converti refusé), contact et numéro absents laissés vides (jamais de faux numéro). Un toucher sur un contact ouvre cette fiche ; « Modifier » ouvre l'ancienne feuille d'édition.

## Fichiers écrits
- `src/components/CreativeLabTab.tsx` (fiche contact, conversion, recettes, 3 exemples du vide, icône).
- `src/ui/atelier/` : `atelierModel.ts` (styleDe, rappelDe, lireIdee, formatVendu, notesQuiCitent, enClient, STYLES), `FicheIdee.tsx` (refaite), `FicheContact.tsx` (neuve), `NoteCarte.tsx`, `Ecrire.tsx`, `EssaiPrix.tsx`.
- `tests/unit/port-q7-atelier.test.tsx` (13 tests : les règles pures, la ligne de rangement, la carte, la fiche, « non saisi », la conversion, la colonne de la date).
- Voie : `banc.mjs` (copie de q4, port 3117, états corrigés), `journal.json` (0 geste sans effet, 0 erreur console, 0 erreur de page), `tests.txt`, `captures/` (18 PNG `e9na-<état>-app-<390|1280>-<clair|cave>.png`).

## Critères
- G1 : COCHE OK 8/8 (voir plus haut).
- G2 : `TSC KO 1`, mais l'unique erreur est `src/ui/BatchDetailSheet.tsx(344)` (voie q5, en cours) ; aucun fichier de ma voie. Mes fichiers : 0 erreur.
- G3 : `npx vitest run port-` : 189 passés, 3 rouges, tous dans `port-p7-phrase-rebrasser.test.tsx` (fiche des brassins, voies q5/q6) ; `port-q4` (18) et `port-q7` (13) verts. `tests.txt` écrit. `TESTS OK` non obtenu pour une cause hors de ma voie.
- Essais : 1 par critère. Une correction de test (le format du tarif vient aussi d'une note au même prix) et une de règle (`notesQuiCitent` écartait à tort les autres idées).

## Captures ouvertes (390, à côté de la PNG de la maquette ; 1280 repos clair non rouvert)
Ouvertes : repos cave, geste clair, idée clair, contact fiche cave, vide clair. Combien et quels problèmes ? 3, non bloquants :
1. Idée : « Pour » n'a pas de date dans le banc (la fixture n'en a pas), et la liste ne montre que 2 notes (la note « Écorce d'orange » n'est pas dans la fixture) : la maquette en montre 3 parce que son carnet les contient.
2. Repos cave : avec le préfixe « ZZ » des fixtures, le bouton « Appeler » passe à la ligne du dessous (la maquette le tient à droite des pastilles, titre plus court).
3. Ligne « À faire » du rangement : « Demander au Café du Midi son prix pour un fût » (lecture locale) contre « Demander le prix d'un fût · Café du Midi » dans la maquette : reformuler demande l'IA (n° 1).
Non rouvertes : idée cave, contact converti, tarifs-garde, vide cave (captures prises, sans geste sans effet).

## DÉCISION À PRENDRE
1. Tests d'intégration rouges, hors de ma voie (tests/integration, à adapter par le pilote) : `contactConversionUnique` : ouvrir d'abord « Ouvrir : <contact> » (fiche), puis cliquer « Convertir en client » ; `dashboardNavigation` ×2 et `equipmentProjects`, `liveDataViews`, `bDiversContraste` : déjà listés par q4.
2. Style et arômes ne sont pas des champs : le style se corrige dans la ligne de rangement ou dans les notes de l'entrée (« Style : IPA »). Un vrai champ `style` demanderait le schéma Firestore (interdit ici). Recommandation : garder.

CONNAISSANCE : un `CreativeItem` n'a que `notes` de libre ; la convention « Style : X » y porte le style corrigé à la main sans champ neuf. `\b` et `[^…]` en JS ne conviennent pas aux lettres accentuées : `(?<!\p{L})` avec le drapeau `u`.
LEÇON PROPOSÉE : aucune
