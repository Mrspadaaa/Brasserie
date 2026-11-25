# Dossier c68-releve

Pourquoi : critique-68 (voies/critique-68/RESULTAT.md) rouvre 9 C67 que c67Regles disait verts : les tests jugeaient l'IA SIMULÉE, pas les vraies réponses de Gemini (L11, L28 : « Réponse IA rejouée : copie d'une vraie »).

Où : https://brasserie-l-affinee.web.app (paquet index-BRxcNYiQ.js ou plus récent, noté), Chrome de débug : puppeteer-core connect 127.0.0.1:9222, TON onglet neuf, 390×844 ; fin page.close() puis browser.disconnect() ; JAMAIS browser.close() ; jamais Claude in Chrome.
Ses données : REGARDER SEULEMENT. Relevé avant/après (nombre de carnets, titres et updateTime de ses carnets : reprends etat.mjs de voies/critique-68 s'il existe) : identiques, sinon arrêt.

Geste : écoute chaque requête/réponse réseau de l'appel callable `aiTask` (page.on('response') sur l'URL contenant `aiTask` ; corps JSON). Depuis le champ de la LISTE des carnets (« Une idée, un problème… »), envoie une à une ces phrases, chacune préfixée « ZZ TEST — c68 » :
1. « ZZ TEST — c68 trop de vapeur pendant l'ébullition, ça coule sur les murs »
2. « ZZ TEST — c68 le fusible de la plaque saute quand je lance la pompe »
3. « ZZ TEST — c68 le sol époxy du local a bien tenu après le lavage » (mémo, fait accompli)
4. « ZZ TEST — c68 les étiquettes se décollent des bouteilles au frigo »
5. « ZZ TEST — c68 acheter un deuxième fermenteur 30 L avant mars »
6. « ZZ TEST — c68 idée : une bière de Noël à la cannelle »
Pour chacune : enregistre requête ET réponse brutes (JSON), la capture de la carte « rangé pour toi », puis ANNULE / ne valide pas si la carte le permet ; sinon note le carnet ZZ créé. À la fin, supprime chaque carnet ZZ c68 créé (titre vérifié dans le dialogue avant Supprimer ; « avec son plan » s'il en a un), puis relevé après.
Anonymise (aucun nom, email ou identifiant de ses données réelles ; remplace les titres de SES carnets listés dans la requête par « Carnet réel n ») et écris tests/fixtures/c68/rangement-<n>.json : { phrase, requete, reponse }.
Coût : ≤ 0,05 CHF, chaque appel au journal work/missions/2026-11-23-carnet-en-ligne/ia-journal.jsonl.
Ligne rendue : « RELEVE <n réponses> carnet identique <oui|non> ».

## Autorisation (pilote, 25.11)
Ce relevé est un test d app réelle du type critique-NN : carnets « ZZ TEST — c68 » créés puis retirés et appels IA journalisés sont autorisés par le brasseur (consignes de test, budget 0,10 CHF par test). SES carnets restent intouchés (relevé avant/après).
