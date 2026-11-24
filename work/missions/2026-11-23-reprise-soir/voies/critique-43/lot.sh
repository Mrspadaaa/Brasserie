cd "$(dirname "$0")"
j() { timeout 290 node jouer.mjs "$@" 2>&1 | grep -v "^    at" | cut -c1-700; }
j A2 Loyer 0 '{"nom":"Loyer","montant":"4","aPayer":true,"dx":60,"revient":"Trim.","duree":"6 mois"}'
j A3 Abonnement 0 '{"nom":"Abonnement","montant":"2","dx":-20,"revient":"Mois","duree":"6 mois","case":"Sans justificatif","compte":"Espèces"}'
j A4 Salaire 0 '{"nom":"Salaire","montant":"5","aPayer":true,"dx":40,"revient":"Mois","duree":"6 mois"}'
j A5 Impôts 0 '{"nom":"Impôts","montant":"1,20","aPayer":true,"dx":80,"cat":"Impôt sur la bière","case":"Sans justificatif"}'
j A6 "Pour moi" 0 '{"nom":"Pour moi","montant":"2,50","dx":-20,"revient":"Mois","duree":"6 mois","mois":true,"case":"Sans justificatif"}'
j A7 Autre 0 '{"nom":"Autre sortie","montant":"1","dx":-30,"compte":"TWINT"}'
j R1 Vente 0 '{"nom":"Vente","montant":"4,80","aPayer":true,"sens":"in","dx":60,"case":"Sans justificatif","mois":true}'
j R2 Apport 0 '{"nom":"Apport","montant":"5","dx":-20,"revient":"Mois","duree":"6 mois","case":"Sans justificatif","mois":true}'
j R3 Autre 1 '{"nom":"Autre entrée","montant":"1,10","dx":-10,"compte":"TWINT","mois":true}'
echo LOT FINI
