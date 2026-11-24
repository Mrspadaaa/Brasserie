cd "$(dirname "$0")"
j() { timeout 290 node jouer.mjs "$@" 2>&1 | grep -v "^    at" | grep -v "boutons\|champs\|tiers \[" | cut -c1-500; }
j A1 Achat 0 '{"nom":"Achat","montant":"3,50","dx":-50,"compte":"Espèces","cat":"Nettoyage","mois":true}'
j A2 Loyer 0 '{"nom":"Loyer","montant":"4","aPayer":true,"dx":60,"revient":"Trim.","duree":"6 mois"}'
j A3 Abonnement 0 '{"nom":"Abonnement","montant":"2","dx":-20,"revient":"Mois","duree":"6 mois","case":"Sans justificatif","compte":"TWINT"}'
j A4 Salaire 0 '{"nom":"Salaire","montant":"5","aPayer":true,"dx":40,"revient":"Mois","duree":"6 mois"}'
j A5 Impôts 0 '{"nom":"Impôts","montant":"1,20","aPayer":true,"dx":80,"cat":"Impôt sur la bière","case":"Sans justificatif"}'
echo LOT1 FINI
