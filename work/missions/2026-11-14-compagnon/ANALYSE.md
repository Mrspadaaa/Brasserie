# Analyse du compagnon au banc local (14.11)

Banc : `voies/b-banc/banc.mjs`, 17 états × 4 formats, 360 appels simulés, 0 réel (`analyse/cap/reseau.json`). Planches : `analyse/cap/planche-<390|1280>-<clair|cave>.png`. Vu par le pilote : planche 390 clair, planche 1280 cave, e09 1280 clair en plein format.

## Défauts (numérotés)
1. **Noms de modèle et de fournisseur à l'écran** (DESIGN.md : « Le nom du fournisseur du modèle ne s'affiche pas ») : détails « New England IPA · brassin en cours · gemini-4-hydrogen », « Relecture : gemini-3.8-flash », « Recherche : gemini-3.8-flash » (e09) ; carte d'attente « Gemini Flash » alors que l'analyse tourne sur Hydrogen (e05 à e07, faux en plus d'interdit, `BrewerChat.tsx:1887`) ; modes « vérifié avec Flash », « Flash adapte ses recherches » (`BrewerChat.tsx:228`) ; Finances « Gemini reçoit un résumé… » (`:961`) ; plafond « le plafond de dépenses Gemini… Google AI Studio », « Ouvrir les dépenses Google » (e14).
2. **Chrome envahissant** : à 390, avant la conversation, 5 rangées fixes (titre, ligne de contexte + 2 icônes, « Me notifier à la réponse », « Limites IA », segment Rapide/Auto/Approfondi pleine largeur de 44 px + sa phrase d'explication). La réponse n'a qu'environ 55 % de la feuille ; le choix de mode reste affiché pendant la lecture d'une réponse (e08 à e12).
3. **e01 s'ouvre sur le panneau des limites déplié** (« Suspendre l'IA », tarifs en USD, paragraphe de prudence) : la première chose vue est la comptabilité de l'IA, pas l'aide.
4. **Attente longue muette** (e05, e06) : un chrono (2:29), une étape en mots, « Tu peux continuer ailleurs », puis « Cette étape prend du temps. Le serveur poursuit… ». Ni étapes faites/à faire, ni durée attendue (le serveur borne à 220 s), ni geste utile pendant l'attente.
5. **Réponse sans hiérarchie de décision** (e08, e09) : le niveau (info / attention / urgent) ne se lit qu'à une teinte ; le titre, l'action, le pourquoi (6 phrases), « Prochain contrôle », la question de suivi et les détails s'empilent en texte de même poids. Réponse longue = mur de texte ; « Prochain contrôle » ne peut pas devenir un rappel ou une note du journal en un geste.
6. **Détails « Conseil relu · calculs et sources »** : liste plate de libellés gris ; la relecture se dit par le nom des modèles au lieu de ce qu'elle a contrôlé ; « Seconde relecture IA. Les estimations restent à confirmer à la cuve. » répété sur chaque réponse.
7. **Proposition applicable** (e11) : bonne base (avant/après, cases, « Valider 3 modifications ») mais 3 blocs hauts, l'écart ne se voit pas (85 g → 70 g en deux colonnes de texte), phrase d'avertissement longue.
8. **Fournisseurs** (e12) : cartes correctes ; « Annoncé en stock » / « Indisponible » en petites pastilles, prix noyé dans « 100 g · CHF 9.50 · prix annoncé » (point décimal, DESIGN.md exige la virgule : 9,50).
9. **Erreurs** (e13 à e15) : trois cartes rouges identiques pour trois situations différentes (serveur, plafond, réseau) ; « Envoi à confirmer » (hors ligne) ne dit pas que la question est gardée sur l'appareil.
10. **Hors ligne non annoncé avant l'envoi** : le bouton Envoyer reste actif, rien ne prévient que le réseau manque (e15).
11. **« Mes conversations »** (e17) : liste correcte mais sans état (en cours, erreur, non lue), corbeilles rouges au premier plan sur chaque ligne, aucune entrée vers le compagnon général.
12. **Entrée Finances** : la question préremplie (« Vérifier mes opérations » : 4 lignes) occupe le champ ; l'accueil reste celui de la recette dans le banc (repli : le banc ne monte pas Finances).
13. **1280** : feuille du bas de 760 px centrée, segment de mode pleine largeur ; rien n'exploite la largeur (le détail pourrait s'ouvrir à côté).
14. **Cave** : contrastes corrects aux planches ; cartes d'attente vert sombre et cartes d'erreur brunes proches en luminance (à vérifier en plein format au port).

## Trous (états non couverts par l'app)
- Aucune durée attendue ni étapes pendant l'attente ; aucune annulation d'une question en cours.
- Pas d'état « réponse prête » visible depuis un autre écran autre que la notification ; « Mes conversations » ne distingue pas en cours / prête / échouée.
- Une réponse ne propose pas de garder « Prochain contrôle » au journal en un geste (« Garder dans les notes du journal » n'existe que pour un brassin et garde tout le texte).
