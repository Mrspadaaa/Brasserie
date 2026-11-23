OK — controle-coherence-ibu.mjs : échoue sur sbz7 (6/12 lignes), passe sur le témoin juste

## Fichiers écrits
- `work/refonte-frontend/v4/tournoi/outils/controle-coherence-ibu.mjs`
- `work/refonte-frontend/v4/tournoi/outils/temoins/coherence-ibu-ok/etat.html` (trois lignes justes : Galaxy et Nelson Sauvin par marqueurs, Magnat en plage lu par le texte)
- `work/refonte-frontend/v4/tournoi/outils/temoins/coherence-ibu-ko/etat.html` (Galaxy à 51 au lieu de 79 : doit échouer)
- ce fichier. sbz7 non modifié.

## Contrôle
- Vérifie, par ligne : `IBU46 × dose / 46 = 60 ± 2` (en plage, bas de l'IBU avec haut de la dose), et, si un α est affiché, IBU46 = 60 × α / α de Nugget (lu dans le contexte de la page, sinon `--alpha-ref`, 13) à ± 10 %.
- Contrat de marqueurs `data-ibu46`, `data-dose`, `data-alpha` documenté dans l'en-tête ; sans marqueurs, lecture du texte de la ligne (« ~46 », « ~51–74 » ou « 46 IBU » ; premier « N g » = dose ; « α … »).
- Aucune ligne lisible = ECHEC (jamais « OK 0 ligne »). Page absente = ECHEC.

## Critères
- G1 : `ECHOUE OK (COHERENCE-IBU ECHEC, code 1)`. Sortie sur sbz7 : Galaxy 51 × 35 / 46 = 38,8 ; Sabro 53,8 ; Idaho 7 45 ; Citra cryo 24 ; Target 44,9 ; Cascade 42 ; chacune aussi avec l'écart d'α (Galaxy ~79 attendu contre 51) ; `COHERENCE-IBU ECHEC (6/12)`.
- G2 : `COHERENCE-IBU OK (3 lignes)`.
- G3 : `CABLAGE OK`. Aucun caractère de contrôle dans le script (grep).
- Essais : 1 par critère.

## Doutes et limites
- Le conseil comptait 7 lignes fausses sur 12 ; le contrôle en relève 6. Nelson Sauvin affiche ~46 pour un α de 9,6 (vrai ~44) : 4 % d'écart et 62 g au lieu de 62,3 — dans les tolérances demandées (± 2, ± 10 %). Sabro est relevée sur l'α à 11 % (55 contre 61,8) et sur le produit (53,8).
- `systeme.mjs appels controle-coherence-ibu.mjs --rejouer` donne ECHEC : le GATES de `sb-passe2` rejoue le contrôle sur sbc1b, sbz7b, sbb7b, sbz6b, sbb5b, qui n'existent pas encore (« page absente »). Attendu avant cette voie ; pas un défaut du contrôle.
- Le contrôle lit le rendu à l'état initial. Un IBU qui change au toucher (puce 60′ / whirlpool) n'est lu que pour l'état affiché ; pour l'autre moment, passer `--page=` vers une page ou une requête qui l'affiche, ou rejouer après le toucher.
- Un lot suivant dont l'IBU ou la dose est dans un attribut autre que ceux du contrat, sans « ~ » ni « IBU » dans le texte, sera déclaré illisible (ECHEC) : il faut alors poser les marqueurs.

DÉCISION À PRENDRE : aucune
CONNAISSANCE : aucune
LEÇON PROPOSÉE : un contrôle de cohérence doit recouper deux affichages issus d'un même calcul (IBU à grammes égaux et dose pour 60) ; ni le critique ni COMMUN ne recomptent, d'où sbz7 faux passé inaperçu. Piste : à chaque page affichant deux dérivés d'un même nombre, exiger un contrôle qui les relie.
