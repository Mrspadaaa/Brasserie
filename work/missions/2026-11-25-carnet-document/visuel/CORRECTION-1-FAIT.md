# Correction 1 : problèmes des juges → fait / non fait (nuit du 25.11)

Sources : juge-critique-1.md (JC), juge-action-1.md (JA), juge-produit-1.md (JP). Les preuves sont dans `cap12/<v>-<cas>.png` et `cap/`. Le rendu jugé est le générique (`&gen=1`) ; les dessins à la main de `cap/` (tour 0) ne sont pas repris.

## Communs (enrichi.js, lu par v1, v2, v3, v6, v7)
| Problème | État |
|---|---|
| Réglé invisible : pilsner (JC C1, JA C1, JP N-2) | Fait. Un héros ou une carte verte « ✓ Réglé : Commandé 2 sacs, brassin maintenu », avec J-8 (3 déc.) en calme, et le reste replié derrière « ▸ Détail 3 ». |
| Échéance et événement sans jours restants (JC C2, JA C4) | Fait. Le compte J-n est calculé depuis le 25 nov. 2026 et accompagné de ses mots : J-36 31 déc., J-96 avant mars, J-1 demain 7h, J-20 avant le 15, J-7. |
| Option sans titre, « emoji + ? » (JC C3, JA C2, JP IA-2) | Fait. L'option garde son titre ; le coût est un attribut. Coût inconnu : hachuré violet si une autre option a un coût, sinon rien ; jamais un « ? » seul. |
| Date de la tâche perdue : lundi, samedi 6 déc., dans une semaine (JC C4, JA C3) | Fait. La date est dans le héros, ou dans la carte « maintenant » pour la v1. |
| Bouteilles, occasion couronnée à 400/600 (JC C5) | Fait. Ligne 🧾 du coût total pour 600 : Verallia ≥504, B 410 👑, Occasion ≥80 avec ⚠ 400/600 en rouge. L'occasion n'est plus couronnée nulle part. |
| Bar, « prix pro » perdu (JC C6) | Fait. La ligne 2 est citée, ☐ 💶 Prix pro. C'est une correction de la réponse écrite à la main, faite dans enrichi.js. |
| Doublons : 150 CHF, 10 fûts, 4 CHF (JC C7) | Fait. Un chiffre déjà dit dans un coût, la liste, un article ou le réglé n'est pas répété. |
| Picto faux : 📈 sur une pression qui chute (JC C8) | Fait. La paire 1,2 bar ↘ 0,4 bar est en rouge ; 📈 est remplacé par 🫧. Le 🔢 de la v6 est retiré. |
| Citra, α couronné contre 10–15 (JC C9) | Non fait. Ce défaut est dans le dessin à la main de `cap/`, hors du rendu générique. Le générique n'a aucun gagnant pour le citra. |
| Mot « IA » absent, ★ conseillé confondu avec ☆ Retenir (JP IA-1) | Fait. La marque « ✦ IA » est en pointillé violet ; « ✦ conseillé » est en pointillé violet ; Retenir reste ☆ blanc plein. |
| Pas de ✕ au repos sur une proposition de l'IA (JP IA-3) | Fait. Un ✕ est au repos sur chaque option de l'IA. Dans la ligne ou la bulle : « ✕ Retirer » et « ＋ Garder ». Le refus affiche un toast « Proposition retirée · ↶ Annuler ». |
| État IA absente (JP IA-4) | Fait (`&ia=0`) : la bannière « ✦ IA absente ⟳ Réessayer » ; chaque ligne avec son n°, le genre lu par l'app (🛒 ☐ ❓ 💡 📝), son objet, et les prix et quantités lus ; l'Aide est grisée. Captures : `cap/<v>-ecoulement-sansia.png`, `cap/v7-*-sansia.png`. |
| Règles dures : ≤ 30 mots et ≤ 120 px | Tenues au repos sur les 60 cas : 30 mots au plus et 118 px au plus. Il n'y a de frise fixe nulle part. |

## v6
| Problème | État |
|---|---|
| B : héros « Autre fournisseur » sur le pilsner réglé | Fait, héros vert « ✓ Réglé ». |
| B : héros « Livraison ? » ou « Prix ? », une question de l'IA | Fait. Le héros est « Choisir l'offre », avec J-20 avant le 15 ; les questions passent dans l'Aide. |
| B : héros sans date : bar, cave, chaudière, assurance | Fait, compte à rebours dans le héros. |
| B : bouteilles, « 400 seulement » absent, le bas sous le champ | Fait. Les rangées 👑 et 🧾 portent ⚠ 400/600 ; plus rien ne passe sous le champ. |
| m : icône de rangée répétée (⏳ ⏳, ☐ ☐) | Fait. La pastille n'a plus d'icône, la liste est sous 📋, et les chiffres n'ont pas de repère. |
| m : la cave répète le titre | Non fait. La tâche du héros est le titre du carnet ; J-11 samedi 6 déc. l'enrichit. |
| m : l'Aide en pile cache le héros | Fait. La pile se place sous le héros, qui reste visible. |
| m : héros à 41 % de l'écran | Fait en partie. L'icône passe de 96 à 48 px et le verbe à 32 px ; le héros occupe environ 30 à 36 %. |
| m : ⏭ ambigu | Fait en partie. ⏭ porte « plus tard » en titre ; le libellé visible n'est que dans la v7. |

## v1
| Problème | État |
|---|---|
| B : chevauchements au-delà de 8 branches (fête, bouteilles) | Fait. 8 branches au plus ; une liste de plus de 2 éléments devient un nœud 📋 n ; une comparaison donne un nœud par article. |
| B : « Chiffre d'affaires 2026 » coupé au bord | Fait. Les nœuds sont bornés en x (68 à 322) et les étiquettes à 120 px. |
| B : aucune prochaine action dominante | Fait. Une carte « maintenant » hors de la carte, au-dessus du pouce : ☐, la tâche, J-n. |
| B : pilsner ✓0 ?0 gris | Fait. Le cœur est vert « Réglé » et la carte réglée est en haut. |
| m : cœur « ✓0 ?0 » ou vide | Fait. L'anneau n'apparaît que s'il y a des pistes ; sinon le cœur montre J-n. |
| m : « +4 CHF/sac » cassé | Fait, les pastilles sont en `nowrap`. |
| Défaut neuf vu : le trait pointillé reste après le refus | Non fait. C'est un mineur noté dans RESULTAT.md. |

## v2
| Problème | État |
|---|---|
| B : 53 mots aux bouteilles | Fait : 22 mots. Une jauge du coût total par offre (barre, hachuré pour la livraison inconnue, ⚠ en rouge), une tuile par critère gagné, sans sous-lignes. |
| B : « ? » avec une barre bleue pleine | Fait. Plus de tuile « ? » ; l'inconnu est un petit hachuré. |
| B : tâche urgente en bas, coupée | Fait. La tâche est la première tuile, large, avec J-n. |
| B : pilsner réglé en tuiles « ? » | Fait. Une tuile verte « Réglé », puis « ▸ Détail ». |
| m : « +4 CHF/sac » et « 3e générat » coupés ; « 2 fûts par mois » sur 3 lignes | Fait. La taille du chiffre suit sa longueur (44, 32, 24 ou 20 px), sur une ligne. |
| m : bandeau 👑0 👑0 | Fait. Les couronnes n'apparaissent que si un article gagne. |
| m : la fête passe sous l'écran | Fait. La liste tient en tuiles compactes de 2 colonnes. |
| Nouveau venu : « 1/2 Joint » | Fait : « 1/2 trouvé ». |

## v3
| Problème | État |
|---|---|
| B : chemin 🔎 → 📞 → 🛠️ imposé à tout carnet (FRISE-GENERIQUE) | Fait. Le chemin dépend du genre : problème 🔎 → tâche → 🛠️ ; achat ⚖️ → ✋ → 📦 ; échéance tâche → 📋 → 🗓️ J-n ; idée et mémo sans date : pas de rail (sureau, levure). |
| B : station toujours 📞 | Fait. La station porte l'icône de la tâche (🧹, ✉️, 🎟️, 🔁). |
| B : halo lumineux | Fait. Le halo est retiré, remplacé par un bord plein de 4 px. |
| B : grille à 2 colonnes pour 3 offres | Fait. N colonnes, unité dans la colonne du critère, ≥1200, ⚠ 400/600, ligne 🧾, inconnu hachuré. |
| B : « 3 déc. » dans « maintenant » sur le pilsner réglé | Fait. Station ✅ « Réglé » ; le brassin J-8 est en information. |
| m : grands vides entre les stations | Fait. Les sections s'empilent sans espace forcé. |
| m : case de 20 px | Fait : 28 px. |
| m : titre centré loin de sa case | Fait. Le titre est aligné à gauche. |
| IA : la bulle n'offre ni « faux » ni « retirer » | Fait. La bulle d'une proposition de l'IA porte ✕ et ＋. |
