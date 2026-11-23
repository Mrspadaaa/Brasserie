# Lecture des liens — contrat (une page)

Base : banc-liens/ (RAPPORT, defauts BL-4 à BL-15, verite/). Copie : lecture-liens. Décisions D446 (cascade schema.org → HTML →
Flash-Lite → 3.8 Flash + url_context ; désaccord signalé, rien inventé ; banc permanent rejouable sans l'app), D447 (prix hors CHF
converti + frais : douane, TVA d'import, port, envoi ; lus sur la page si donnés, sinon « + douane et port non comptés »).

Ajout 23.11 (ses mots : « Tu peux même en ajouter et être un peu plus difficile ») : porter le banc à 50 liens au moins, avec
des cas plus durs : variantes de produit (taille, couleur) avec prix différents, prix barré et promo, prix « dès », lot ou
pack, prix au kg/litre, rupture de stock, page multilingue, pages JS lourdes (rendu client), marketplaces (Amazon.de, Ricardo,
eBay), sites suisses de brasserie (Hopfen und Malz, Brauwelt, Maltomat…), liens raccourcis et partagés depuis une appli,
EUR sans TVA suisse, livraison vers la Suisse payante ou refusée. Vérité écrite pour chacun (page ouverte, champ par champ).
Mesure avant/après chaque changement ; objectif prix et photo affichés ≥ 90 %, caractéristiques ≥ 70 %, zéro invention.
Cycle inchangé : PRÊT → EN LIGNE → rejeu en ligne dans des carnets ZZ ouverts, retirés ensuite ; budget IA 1,5 CHF au total.

Ajout 23.11 (« C'est vraiment les bon outil Ia, tu es sûr ? ») : le choix d'outil se MESURE sur le banc (L20), pas par défaut :
comparer sur les mêmes 50 liens (a) la cascade avec Flash-Lite, (b) Gemini 3.8 Flash avec url_context ET ancrage Google Search
(retrouve prix/caractéristiques ailleurs quand la page bloque), (c) une API d'extraction produit dédiée (Zyte, Diffbot) —
(c) demande un compte externe : préparer seulement la comparaison sur leur offre d'essai SANS créer de compte, le pilote
demandera l'accord. Tableau : justesse par champ, temps, coût par lien. Choix écrit dans « ## État de l'art ».

Ajout 23.11 (« Regarde les autres IA, outils Google... ») : élargir la comparaison, d'abord sur dossier (doc officielle, prix,
compte nécessaire, ce qu'on peut tester sans compte), puis mesurer ce qui est testable sans nouveau compte :
- Google : Custom Search JSON API / Programmable Search (pagemap schema.org Product de l'index Google, contourne les blocages),
  Gemini grounding Google Search, url_context, Vertex AI Search, Merchant/Shopping (probablement hors cas : marchand requis).
- Autres IA : Claude (Haiku/Sonnet, API Anthropic), Mistral, modèles ouverts ; GPT seulement pour la comparaison écrite.
- Outils d'extraction : Zyte, Diffbot, Firecrawl, Jina Reader (r.jina.ai : lecture de page en texte, gratuit sans clé),
  navigateur sans tête (Puppeteer en fonction serveur).
Tableau final : justesse par champ sur les 50 liens (mesurée, ou « non testé : compte requis »), temps, coût par lien, compte
requis oui/non, risque. Recommandation ; tout nouveau compte ou service payant attend l'accord du brasseur (pilote).

## Ajout du 23.11 : outils Google à mesurer (RECHERCHE.md, commit 86ede5202)
- « Carbone » = Gemini 4 Carbon (10.11, 2/10 $ par M jusqu'au 30.11) ; « Oxygen » = rumeur, ignorer.
- Ajouter au comparatif mesuré, sur les 50 liens, dans le budget de 1,5 CHF : Gemini 4 Hydrogen (1,50/7,50 $) et Carbon, chacun avec url_context (+ google_search en repli) ; vérifier d'abord que leurs identifiants sont listés par notre clé (models.list), sinon le noter.
- Computer use de Gemini (navigateur Playwright local) : mesurer sur les seuls liens en JavaScript ou bloqués que la cascade rate ; jamais de CAPTCHA contourné.
- Écarter : Custom Search JSON API (fermée), Merchant API (son propre catalogue seulement).
- Chaque appel réel au journal ia-journal.jsonl.
