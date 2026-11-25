OK — jouable M4 b : vraie note, Organisé par Claude (sample), 12 gestes sur 12

## Fichiers écrits
- `jouable/m4b.html` : un seul fichier, HTML, styles et script en ligne, 89 Ko. Thème sombre de M4 b et thème clair (`prefers-color-scheme: light`).
- `jouable/cap-m4b/01…19.png` : 19 captures, 390 × 844, DPR 2.
- Script de capture (hors livrable) : scratchpad `cap-m4b.cjs`. Résultat brut : `cap-m4b-resultat.json`.

## À déclarer à la publication (pilote)
`capabilities: { sample: {}, dictation: {}, db: { rules: [ { path: "journal", read: "admin", write: "interact" } ] } }`.
Le même bloc est écrit en commentaire en tête du fichier.

## Gestes joués (puppeteer, Chrome 9222, `window.claude` simulé) : 12 / 12
| Geste | Sortie décisive | Capture |
|---|---|---|
| Liste au premier lancement | « ZZ TEST — Écoulement qui fuit · mar. 24 nov. 21:26 · Je cherche ». Les 6 lignes sont identiques à celles du fixture c79 (contrôle `includes`, 6/6). | 01-liste |
| Ouvrir et taper | Focus sur `doc` dès l'ouverture, sans geste. Le texte est gardé dans `localStorage` à la frappe. | 02-ouvert-frappe |
| Coller un lien | `https://www.entreprise-x.ch/sanitaire` est inséré au curseur. Un presse-papiers `javascript:` est ignoré, sans message. | 03-lien |
| Ajouter une photo | Insérée sous la ligne 1, à l'endroit du curseur. Réduite à 1024 × 768, 20 Ko en data URL. Elle survit au rechargement, comme le lien et la frappe. | 04-photo |
| Ranger (attente) | « L’IA lit ta note… » s'affiche dans l'outil IA, avec Arrêter. Le point s'allume sur Organisé. | 05-ia-menu, 06-ia-lit |
| Lecture | 6 soulignés violets (CSS Highlight, sans aucune balise dans le texte). Les 6 lignes restent intactes. Toucher « pas trouvée » ouvre la bulle « lu : pas trouvé · Organisé ↩ ». | 07-lecture, 08-bulle-lu |
| Organisé | « 2 à garder · Tout garder », frise, pistes, conseil, 3 options, tâche proposée. | 09-organise |
| Toucher un bloc → sa ligne | « Sous la dalle » ouvre Mes notes et surligne « fuite sous la dalle, pas trouvée. ». La pastille « Revenir à « Sous la dalle » » ramène dans Organisé. | 10-bloc-vers-ligne |
| Garder | La case des options affiche « Retenir », et le compteur passe à « 1 à garder ». | 11-garder-options |
| Refuser | Dans la feuille « Changé par l’IA », la tâche et la lecture « 150 CHF » sont coupées. Le bouton dit « Garder 6 sur 8 ». refus = [« Tâche : Relancer le devis », « lecture : 150 CHF »]. Il reste 5 soulignés. | 12-refuser-feuille, 13-refuse |
| Retenir une option | « Retenu : changer le joint toi-même ». La frise passe à Décidé, « posé par toi ». Les deux autres options vont en réserve. | 14-retenir |
| Nouveau carnet | Vide, avec « Titre » et « Écris ici… ». Le curseur est dans le texte. La liste compte 2 carnets. | 15-nouveau-carnet, 16-liste-deux |
| IA indisponible (`sample` null) | « L’IA n’a pas pu lire · pas disponible ici ». La note est gardée. Ce que l'app lit seule : « pas trouvé », « 150 CHF ». Réessayer est le seul plein. Le journal note l'erreur `indisponible`. | 17-ia-indisponible |

Vérifications en plus :
- **Journal** (`db` simulée) : 1 appel (2 501 ms, 9 lignes, `citationsFausses` 1), puis 5 gestes : toucher un bloc, garder, refuser, couper une lecture, retenir.
- **Contrôle des citations, sur le vrai chemin** (sans `?demo`, `sample.json` simulé, thème clair) :
  - « dalle fissurée » est retirée et comptée fausse ; la piste passe « à vérifier » ;
  - `l'entreprise` (apostrophe droite) est rétabli en `l’entreprise` ;
  - la date « lundi » est retirée, car absente des notes.
- **Consigne** : elle contient les lignes numérotées 1 à 6, les règles (extraits EXACTS, aucune date inventée) et « Refusé par lui ». Voir 19-organise-reel-clair.
- **Hors ligne** : l'outil affiche « Lecture : attend le réseau · Annuler l’envoi » et la méta « hors ligne, gardé ici ». Au retour du réseau, la lecture part seule (18-hors-ligne-clair).
- **Sans `window.claude`** (copie hors claude.ai) : la page s'affiche, l'outil voix est caché et Ranger mène à « IA indisponible ».
- 0 erreur de page ou de console sur les 4 onglets.

## Captures (toutes ouvertes)
`jouable/cap-m4b/` : 01-liste, 02-ouvert-frappe, 03-lien, 04-photo, 05-ia-menu, 06-ia-lit, 07-lecture, 08-bulle-lu,
09-organise, 10-bloc-vers-ligne, 11-garder-options, 12-refuser-feuille, 13-refuse, 14-retenir, 15-nouveau-carnet,
16-liste-deux, 17-ia-indisponible, 18-hors-ligne-clair, 19-organise-reel-clair.

## Ce qui n'a pas pu être testé hors claude.ai
- **Vrai Claude** (`sample.json`) : sa vraie latence, la fenêtre de consentement, ses vraies fautes de citation. C'est le but du jeu : le journal les gardera.
- **Le clavier du téléphone** : la barre collée au clavier repose sur `visualViewport`, qui reste inerte en Chrome de bureau. Dans le cadre d'un artefact sur iOS, rien n'est prouvé.
- Le focus à l'ouverture n'ouvre le clavier que si le système l'accepte ; iOS peut demander un toucher.
- **Dictée** : la capacité est simulée (outil visible). Aucun texte dicté n'a été joué.
- **Presse-papiers réel** : `readText` peut être refusé dans l'iframe. Le contrat est tenu dans ce cas : rien ne se passe, sans message.
- **Photo de l'appareil photo** : testée avec une image de synthèse (1600 × 1200), pas avec une vraie photo du téléphone.
- **Règle `db`** (`read: admin`) : non vérifiable hors de la plateforme.

## Écarts assumés
- **Titre et état** : « ZZ TEST — Écoulement qui fuit » vient du contrat. L'état « Je cherche » (posé le 25 nov. à 13:22) vient du fixture, c'est donc une vraie donnée. La maquette montrait « Noté » au 24 nov.
- **Les 6 lignes** : ce sont les notes 2 à 6 du fixture, plus le message « Estimation 150 CHF (exemple). ». La note 1 sert de titre, comme dans la maquette.
- **Réponse `?demo`** : elle est fixe, mais ses numéros de ligne suivent la citation, pour qu'une photo insérée ne décale pas tout. Elle porte une lecture fausse exprès (« devis signé »), qui prouve le contrôle. Le lien de test `entreprise-x.ch` est imaginé, comme dans la maquette.
- **Statut « pas trouvé »** : il s'affiche « à vérifier », comme dans la maquette.
- **États de M4 b non portés** : la suite imaginée (tâche datée, résoudre, résolu, relire) n'est pas portée, faute de données réelles. Le rendu `resolu` existe : carte « Résolu ? » et frise verte.

Prédiction : il ouvre, tape et colle sans chercher. Il dira qu'Organisé reste dense, mais c'est sa vue IA ; le vrai test sera la justesse des citations de Claude sur ses propres carnets.

DÉCISION À PRENDRE : aucune.
CONNAISSANCE : la capacité `sample` de l'artefact remplace la clé Gemini pour un jouable : aucune clé, journal `db` lisible par le pilote. CSS Custom Highlight (`::highlight`) souligne les lectures de l'IA sans toucher au texte d'un `contenteditable`.
LEÇON PROPOSÉE : aucune.
