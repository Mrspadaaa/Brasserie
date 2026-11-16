# Enrichissement des fiches, joué sur la vraie app (10.11)

Ses mots : « si c'est pas en silence c'est bon » (lignes perdues signalées) ; « mais ça il faut testé sur la vrai app: L'enrichissement des
fiches n'a pas été testé sur la vraie app : il se déclenche après « Confirmer » … Il n'a été vérifié qu'en lisant le code. »

## Ce qui est attendu (code : `planifierEnrichissement` après « Confirmer », file Dexie, tâche `lookupIngredient`, ne remplit que les trous
de `stockItems` ; drapeau `VITE_ENRICHISSEMENT_IA` = production ; nom français `traduireNoms` à la lecture)
Sur https://brasserie-l-affinee.web.app (tag en-ligne/2026-11-10-lecture2) :
1. Nouvelle dépense « Saisir sans justificatif », fournisseur « ZZ TEST — enrichissement 10.11 », 3 lignes NOUVEL article, chacune d'une
   variété connue mais avec un nom qui n'entre en collision avec aucun article réel (vérifier le stock avant) : un houblon (ex. « Nelson
   Sauvin ZZ »), un malt (« Maris Otter ZZ »), une levure (« US-05 ZZ ») ; petites quantités ; « Confirmer » (pièce ZZ seulement).
2. Attendre l'enrichissement (minutes) ; relire chaque fiche article : α / EBC / atténuation, origine, fiche liée, nom français ; ce qui est
   rempli, ce qui reste vide (et pourquoi), aucun chiffre inventé, aucun champ déjà saisi écrasé.
3. Retrait, dans CET ordre (leçon du 10.11 : un achat ne s'annule plus une fois son article supprimé) : annuler la dépense ZZ (« Corriger
   ce paiement erroné » puis « Annuler cette écriture », dialogues lus en entier), puis supprimer les 3 articles ZZ ; relire stock et
   finances (Dépensé, Opérations) revenus au départ.

## Garde-fous
- Avant chaque clic, le texte visé contient « ZZ » ; avant chaque confirmation, lire le dialogue entier et le noter ; libellé exact, jamais
  de regex large. Aucune donnée réelle touchée. Jamais Fable. Gemini : la tâche d'enrichissement seulement (quelques centimes), notée.
- Méthode et connexion : `work/missions/2026-11-10-parcours-complet/jouer/*.mjs` et VERDICT.md (leçons d'exécution).

## Rendre
`VERDICT.md` au fil : attendu / lu par champ et par article ; défauts (bloquant ou non) ; état du retrait.
