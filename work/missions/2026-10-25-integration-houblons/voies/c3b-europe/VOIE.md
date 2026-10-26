# Voie c3b-europe — collecter les fiches des fournisseurs européens (#180)

Agent : auteur (Sonnet). **Lis d'abord `voies/c3-COMMUN.md`** : les règles de collecte, de sortie et les critères communs. Ce fichier
n'ajoute que ce qui est propre à tes sources.

## Tes sources, une par fichier de sortie
1. **BarthHaas** : `barthhaas.com/en/hop-varieties/…`.
   - Le 19.10, Ariana et Aurora étaient ouvertes. Elles publient myrcène, humulène, caryophyllène, farnésène, linalol et
     géraniol, des polyphénols et des thiols.
   - Pars de la liste des variétés du site.
2. **John I. Haas** : johnihaas.com, ses pages de variétés et ses fiches PDF (« MiniSpecSheets »).
   - Pour lire un PDF, cherche d'abord une bibliothèque déjà dans `node_modules` (`pdfjs-dist`, `pdf-parse`…).
   - Si aucune n'y est, garde le PDF en cache et écris-le dans RESULTAT.md. N'installe aucun paquet.
3. **Charles Faram**, au Royaume-Uni : ses pages de variétés. Le 19.10, Ahtanum était ouverte, avec les huiles et une intensité
   d'arôme.
4. Si le temps le permet, chacune dans son fichier :
   - HVG et Hallertau (Allemagne) ;
   - le Chmelařský institut et Žatec (Tchéquie) ;
   - l'IHPS de Žalec (Slovénie) ;
   - la British Hop Association.

   Un site sans fiches chiffrées : une ligne dans le rapport, et passe au suivant.

`<source>` = `barthhaas`, `johnihaas`, `charlesfaram`, … : un script, un JSON et un test par source.

Écris RESULTAT.md tôt et complète-le. Si tu approches ta limite de tours, garde ce qui est collecté et écris ce qui reste.
