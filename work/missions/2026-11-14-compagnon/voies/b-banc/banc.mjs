// Banc local du compagnon brasseur (voie b-banc, mission 2026-11-14-compagnon).
// Usage, depuis la racine du dépôt, serveur `npx vite --port 3007 --strictPort` lancé :
//   node work/missions/2026-11-14-compagnon/voies/b-banc/banc.mjs
// Réponses serveur simulées : aucun appel réel. Les callables et hôtes de fonctions sont servis ici,
// et tout ce qui n'est pas prévu est abandonné et compté dans reseau.json (nonIntercepte).
import puppeteer from 'puppeteer-core';
import { mkdir, writeFile } from 'node:fs/promises';
import { existsSync, readFileSync } from 'node:fs';
import { randomUUID } from 'node:crypto';
import { resolve } from 'node:path';

const VOIE = resolve(process.cwd(), 'work/missions/2026-11-14-compagnon/voies/b-banc');
const CAP = resolve(process.cwd(), 'work/missions/2026-11-14-compagnon/analyse/cap');
const URL_BANC = 'http://127.0.0.1:3007/?preview=brew&view=assistant';
const CHROME = 'C:/Program Files/Google/Chrome/Application/chrome.exe';
const FORMATS = {
  '390': { width: 390, height: 844, isMobile: true, hasTouch: true, deviceScaleFactor: 2 },
  '1280': { width: 1280, height: 860 }
};
const THEMES = ['clair', 'cave'];
const CALLABLES = /\/(askBrewer|retryBrewerQuestion|getBrewerConversation|getBrewerActivity|markBrewerRead|getBrewerAiBudget|setBrewerAiBudget|resetBrewerConversation)$/;
const HOTES_FONCTIONS = /cloudfunctions\.net$|run\.app$|generativelanguage\.googleapis\.com$/;
const SAISIE = '.brewer-chat-compose textarea';
const ENVOI = '.brewer-chat-compose button[type=submit]';

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const reseau = { intercepte: 0, nonIntercepte: 0, urls: new Set() };
const journal = [];

// ---------- Données simulées ----------
const budgetInitial = () => ({
  paused: false,
  day: '2026-11-14',
  usage: { calls: 4, proCalls: 1, tokens: 4200 },
  limits: { dailyCalls: 120, dailyProCalls: 40, dailyTokens: 1500000, questionCalls: 12, questionTokens: 240000 }
});
const nouveauMock = () => ({ budget: budgetInitial(), generation: 0, inputs: [], reponses: [], jobs: [], turns: [] });

const travail = (d, mock, o = {}) => ({
  id: randomUUID(),
  operationId: d.operationId,
  scope: d.scope,
  generation: mock.generation,
  question: d.question,
  label: 'New England IPA',
  status: 'running',
  stage: 'research',
  detail: 'Recherche de sources…',
  model: 'gemini-4-hydrogen',
  createdAt: Date.now(),
  updatedAt: Date.now(),
  attempt: 1,
  ...o
});

const tour = (d, o) => ({
  turn: {
    id: d.operationId,
    operationId: d.operationId,
    question: d.question,
    createdAt: Date.now(),
    model: 'gemini-4-hydrogen',
    reviewed: true,
    reviewModel: 'gemini-3.8-flash',
    reviewReason: 'research',
    mode: 'deep',
    contextLabel: 'New England IPA · brassin en cours',
    evidence: [],
    ...o
  }
});

const PRODUITS = [
  {
    name: 'Citra T90 pellets 100 g',
    supplier: 'Houblons Suisses SA',
    url: 'https://houblons-suisses.example/produits/citra-t90-100g',
    availability: 'in_stock',
    availabilityText: 'En stock',
    checkedAt: Date.now() - 3600000,
    verifiedBy: 'product-page',
    stockEvidence: 'visible-text',
    packageLabel: '100 g',
    priceText: 'CHF 9.50',
    sku: 'CIT-100'
  },
  {
    name: 'Galaxy T90 pellets 100 g',
    supplier: 'Brasserie Service Romand',
    url: 'https://brasserie-service.example/galaxy-100g',
    availability: 'out_of_stock',
    availabilityText: 'Rupture',
    checkedAt: Date.now() - 3600000,
    verifiedBy: 'product-page',
    stockEvidence: 'visible-text',
    packageLabel: '100 g',
    priceText: 'CHF 11.20',
    sku: 'GAL-100'
  }
];

const ADVICE_COURT = {
  level: 'info',
  summary: 'Densité finale dans la cible.',
  action: 'Rien à changer : passe au dry hop prévu.',
  why: 'Ta densité relevée (1,012) correspond à l’objectif de la recette.',
  watch: '',
  question: '',
  evidenceIds: []
};

const ADVICE_LONG = {
  level: 'attention',
  summary: 'Dry hop trop chargé pour ce NEIPA.',
  action: 'Réduis le dernier apport Mosaic de moitié avant J+9.',
  why:
    'Le dry hop total fait 171 g pour 19 L, soit environ 9 g/L : c’est élevé pour une NEIPA de cette densité. ' +
    'Au-delà, les apports tardifs ajoutent surtout de l’herbacé sans gain d’arôme net. ' +
    'Ton apport Citra à J+2 porte déjà l’essentiel de l’arôme tropical. ' +
    'Le dernier apport Mosaic à J+9 peut être réduit de moitié sans perte perceptible. ' +
    'Le pH de maische visé de 5,3 reste correct pour ce grist, mais contrôle-le à la prochaine brassée. ' +
    'La garde à 18 °C limite la perte d’arômes volatils pendant ces jours.',
  watch: 'Goût et odeur à la purge, à J+9 : note si l’herbacé apparaît.',
  question: 'Veux-tu que je prépare la proposition de réduction du dernier apport ?',
  evidenceIds: ['ev-dry', 'ev-ph', 'ev-garde']
};

const PREUVES_LONGUES = [
  {
    id: 'ev-dry',
    name: 'Calcul dry hop',
    label: 'Dose de dry hop par litre',
    facts: ['171 g pour 19 L, soit 9,0 g/L', 'Citra J+2 : 85 g ; Galaxy J+6 : 43 g ; Mosaic J+9 : 43 g'],
    limits: ['Calcul sur les doses saisies dans la recette.'],
    data: {},
    model: 'gemini-3.8-flash'
  },
  {
    id: 'ev-ph',
    name: 'pH de maische',
    label: 'Eau et pH de maische',
    facts: ['pH visé 5,3 à 20 °C', 'Malt pâle majoritaire : 4,1 kg US 2-row'],
    limits: ['Mesure à la cuve non disponible.'],
    data: {},
    sources: [{ title: 'Guide de maische, chimie de l’eau', url: 'https://brewing-water.example/ph-maische' }]
  },
  {
    id: 'ev-garde',
    name: 'Température de garde',
    label: 'Garde à 18 °C',
    facts: ['Garde de 10 jours à 18 °C', 'Pertes d’arômes volatils limitées sous 20 °C'],
    limits: ['Source générale, pas une mesure de cette bière.'],
    data: {},
    sources: [
      { title: 'Fiche garde houblon', url: 'https://houblon-fiche.example/garde' },
      { title: 'Revue sur les houblons à cru', url: 'https://brasserie-revue.example/cru' }
    ]
  }
];

const jobSupplementaire = (id, kind, scopeId, label, question) => {
  const now = Date.now();
  return {
    id,
    operationId: randomUUID(),
    scope: { kind, id: scopeId },
    generation: 0,
    question,
    label,
    status: 'done',
    stage: 'saving',
    createdAt: now - 86400000,
    updatedAt: now - 86000000,
    finishedAt: now - 86000000,
    readAt: now - 86000000,
    attempt: 1,
    model: 'gemini-4-hydrogen'
  };
};

// ---------- Simulation du serveur ----------
async function repondreQuestion(d, mock) {
  mock.inputs.push(d);
  const fabrique = mock.reponses.shift();
  const sortie = fabrique ? fabrique(d, mock) : { job: travail(d, mock) };
  if (sortie.delai) await sleep(sortie.delai);
  if (sortie.turn) {
    const now = Date.now();
    mock.turns.push(sortie.turn);
    mock.jobs.push({
      id: randomUUID(),
      operationId: d.operationId,
      scope: d.scope,
      generation: mock.generation,
      question: d.question,
      label: 'New England IPA',
      status: 'done',
      stage: 'saving',
      createdAt: now - 9000,
      updatedAt: now,
      finishedAt: now,
      readAt: now,
      attempt: 1,
      model: 'gemini-4-hydrogen'
    });
    return { turn: sortie.turn };
  }
  mock.jobs.push(sortie.job);
  return { job: sortie.job };
}

async function servir(req, mock) {
  const url = new URL(req.url());
  if (!HOTES_FONCTIONS.test(url.hostname)) return req.continue();
  const headers = {
    'Access-Control-Allow-Origin': 'http://127.0.0.1:3007',
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
    'Access-Control-Allow-Headers': req.headers()['access-control-request-headers'] ?? 'content-type, authorization',
    'Content-Type': 'application/json'
  };
  if (req.method() === 'OPTIONS') return req.respond({ status: 204, headers });
  const nom = CALLABLES.exec(url.pathname)?.[1];
  if (!nom) {
    reseau.nonIntercepte++;
    reseau.urls.add(`non prévu : ${url.host}${url.pathname}`);
    return req.abort();
  }
  reseau.intercepte++;
  reseau.urls.add(nom);
  if (mock.horsLigne && (nom === 'askBrewer' || nom === 'retryBrewerQuestion')) return req.abort('internetdisconnected');
  const data = JSON.parse(req.postData() || '{}').data ?? {};
  let result = {};
  switch (nom) {
    case 'getBrewerAiBudget':
      result = mock.budget;
      break;
    case 'setBrewerAiBudget':
      if (data.paused != null) mock.budget.paused = data.paused;
      Object.assign(mock.budget.limits, data.limits);
      result = mock.budget;
      break;
    case 'resetBrewerConversation':
      mock.jobs.splice(0);
      mock.turns.splice(0);
      mock.generation++;
      result = { generation: mock.generation };
      break;
    case 'getBrewerActivity':
      result = { jobs: mock.jobs };
      break;
    case 'markBrewerRead': {
      const j = mock.jobs.find((x) => x.id === data.jobId);
      if (j) j.readAt = Date.now();
      result = { ok: true };
      break;
    }
    case 'askBrewer':
    case 'retryBrewerQuestion':
      result = await repondreQuestion(data, mock);
      break;
    case 'getBrewerConversation':
      if (data.operationId) {
        const t = mock.turns.find((x) => x.operationId === data.operationId);
        result = t ? { turn: t } : { job: mock.jobs.find((j) => j.operationId === data.operationId) };
      } else result = { turns: mock.turns, generation: mock.generation };
      break;
    default:
      result = {};
  }
  try {
    await req.respond({ status: 200, headers, body: JSON.stringify({ data: result }) });
  } catch {
    /* page fermée pendant un envoi retardé : rien à rendre */
  }
}

// ---------- Gestes ----------
const Q_RECETTE = 'La fermentation est à 19 °C depuis 36 h et la pression monte doucement : que faire ?';
const Q_FINANCE = 'Pourquoi le paiement du malt de mars dépasse-t-il le budget de ce brassin ?';
const Q_DRY = 'Le dry hop de ce NEIPA est-il trop chargé ?';
const Q_DENSITE = 'La densité finale est-elle bonne ?';
const Q_URGENT = 'La cuve est à 24,5 °C et ça monte vite : je fais quoi ?';
const Q_PROPOSITION = 'Propose-moi de réduire le dry hop.';
const Q_FOURNISSEURS = 'Où acheter du Citra en pellets en Suisse ?';
const Q_ERREUR = 'Le pH de maische visé est-il bon pour cette grist ?';
const Q_DEUX = 'Et combien de jours de garde à 18 °C ?';

const saisir = async (page, texte) => {
  await page.click(SAISIE);
  await page.type(SAISIE, texte);
};
const envoyer = async (page, texte) => {
  await saisir(page, texte);
  await page.click(ENVOI);
};
const cliquer = (page, sel) => page.$eval(sel, (e) => e.click());
const attendreTexte = (page, texte, timeout = 30000) =>
  page.waitForFunction((t) => document.body.innerText.includes(t), { timeout }, texte);

const ETATS = [
  {
    id: 'e01',
    titre: 'Accueil recette',
    geste: 'ouvrir le compagnon ; budget déplié ; champ vide ; aucun envoi',
    cible: '.brewer-chat-welcome',
    jouer: async (page) => {
      await page.waitForSelector('.brewer-chat-welcome');
      await cliquer(page, '.brewer-budget > summary');
    }
  },
  {
    id: 'e02',
    titre: 'Accueil finances (question pré-remplie)',
    geste: 'question de Finances tapée, non envoyée',
    cible: '.brewer-chat-compose',
    jouer: async (page) => {
      await saisir(page, Q_FINANCE);
      return 'Repli : le banc preview ne monte pas Finances ; même question tapée dans l’accueil recette.';
    }
  },
  {
    id: 'e03',
    titre: 'Question tapée, Approfondi choisi',
    geste: 'mode Approfondi coché ; question tapée ; avant envoi',
    cible: '.brewer-chat-compose',
    jouer: async (page) => {
      await cliquer(page, '.brewer-chat-mode input[value="deep"]');
      await saisir(page, Q_DRY);
    }
  },
  {
    id: 'e04',
    titre: 'Envoi en cours',
    geste: 'envoi ; accusé de réception retardé de 20 s',
    cible: '.brewer-work-card',
    jouer: async (page, mock) => {
      mock.reponses.push((d, m) => ({ delai: 20000, job: travail(d, m) }));
      await envoyer(page, Q_RECETTE);
      await attendreTexte(page, 'Envoi de ta question');
    }
  },
  {
    id: 'e05',
    titre: 'Attente courte (recherche, 0:12)',
    geste: 'job running, stage research, « Recherche de sources… », créé il y a 12 s',
    cible: '.brewer-work-card',
    jouer: async (page, mock) => {
      mock.reponses.push((d, m) => ({ job: travail(d, m, { createdAt: Date.now() - 12000 }) }));
      await envoyer(page, Q_RECETTE);
      await attendreTexte(page, 'Recherche de sources');
    }
  },
  {
    id: 'e06',
    titre: 'Attente longue (« Cette étape prend du temps »)',
    geste: 'job running, créé et mis à jour il y a 2 min',
    cible: '.brewer-work-card',
    jouer: async (page, mock) => {
      mock.reponses.push((d, m) =>
        ({ job: travail(d, m, { createdAt: Date.now() - 150000, updatedAt: Date.now() - 120000, detail: 'Vérification des données de brassin' }) }));
      await envoyer(page, Q_RECETTE);
      await attendreTexte(page, 'Cette étape prend du temps');
    }
  },
  {
    id: 'e07',
    titre: 'Deux questions : une en cours, une en attente',
    geste: 'envoi de deux questions ; la 2e reste queued',
    cible: '.brewer-chat-history > article:last-child',
    jouer: async (page, mock) => {
      mock.reponses.push((d, m) => ({ job: travail(d, m, { createdAt: Date.now() - 12000 }) }));
      mock.reponses.push((d, m) => ({
        job: travail(d, m, { status: 'queued', stage: 'queued', detail: '', model: '', attempt: 0, createdAt: Date.now() - 3000, updatedAt: Date.now() - 3000 })
      }));
      await envoyer(page, Q_RECETTE);
      await attendreTexte(page, 'Recherche de sources');
      await envoyer(page, Q_DEUX);
      await page.waitForFunction(() => document.querySelectorAll('.brewer-chat-question').length === 2);
    }
  },
  {
    id: 'e08',
    titre: 'Réponse courte, info, détails repliés',
    geste: 'réponse niveau info ; détails « Conseil » repliés',
    cible: '.brewer-chat-answer',
    jouer: async (page, mock) => {
      mock.reponses.push((d) => tour(d, { mode: 'fast', reviewed: false, reviewReason: 'fast', advice: ADVICE_COURT }));
      await envoyer(page, Q_DENSITE);
      await page.waitForSelector('.brewer-chat-answer');
    }
  },
  {
    id: 'e09',
    titre: 'Réponse longue, attention, détails ouverts',
    geste: 'réponse attention ; 6 phrases ; 3 preuves ; 3 sources https ; détails ouverts',
    cible: '.brewer-chat-answer',
    jouer: async (page, mock) => {
      mock.reponses.push((d) => tour(d, { advice: ADVICE_LONG, evidence: PREUVES_LONGUES }));
      await envoyer(page, Q_DRY);
      await page.waitForSelector('.brewer-chat-answer');
      await cliquer(page, '.brewer-chat-answer details.brewer-chat-proof > summary');
      await page.waitForSelector('.brewer-chat-answer details.brewer-chat-proof[open]');
    }
  },
  {
    id: 'e10',
    titre: 'Réponse urgente',
    geste: 'réponse niveau urgent : température de fermentation qui s’emballe',
    cible: '.brewer-chat-answer.is-urgent',
    jouer: async (page, mock) => {
      mock.reponses.push((d) =>
        tour(d, {
          advice: {
            level: 'urgent',
            summary: 'La cuve dépasse 24 °C : refroidis maintenant.',
            action: 'Ouvre la circulation de glycol et contrôle la température toutes les 30 min.',
            why: 'À 24,5 °C, la levure stresse et peut produire des arômes de solvant.',
            watch: 'Température et pression toutes les 30 min pendant 2 h.',
            question: 'Le glycol est-il branché sur la cuve ?',
            evidenceIds: []
          }
        }));
      await envoyer(page, Q_URGENT);
      await page.waitForSelector('.brewer-chat-answer.is-urgent');
    }
  },
  {
    id: 'e11',
    titre: 'Proposition applicable (avant / après)',
    geste: 'réponse avec proposition à 3 champs ; boutons de décision visibles',
    cible: '.brewer-proposal',
    jouer: async (page, mock) => {
      mock.reponses.push((d) =>
        tour(d, {
          advice: { ...ADVICE_LONG, why: 'Réduire les derniers apports garde l’arôme et enlève l’herbacé.', watch: '', question: '' },
          proposal: {
            target: 'recipe',
            title: 'Réduire le dry hop du NEIPA',
            basis: 'Dose par litre : 9 g/L, au-dessus de la cible de 7 g/L.',
            changes: [
              { id: 'dry-citra', path: 'hops.5.weightG', label: 'Citra · dry hop J+2', before: 85, value: 70, unit: 'g', reason: 'Dose ramenée à 7 g/L pour limiter l’herbacé en fin de garde.' },
              { id: 'dry-mosaic', path: 'hops.7.weightG', label: 'Mosaic · dry hop J+9', before: 43, value: 21, unit: 'g', reason: 'Dernier apport réduit de moitié.' },
              { id: 'dry-jour', path: 'hops.5.dayOffset', label: 'Citra · jour du dry hop', before: 2, value: 3, unit: 'j', reason: 'Un jour de contact en plus à 18 °C.' }
            ]
          }
        }));
      await envoyer(page, Q_PROPOSITION);
      await page.waitForSelector('.brewer-proposal');
    }
  },
  {
    id: 'e12',
    titre: 'Fournisseurs (2 produits, stock et prix)',
    geste: 'réponse avec evidence.products (2 produits) ; bloc « Où acheter »',
    cible: '.brewer-chat-suppliers',
    jouer: async (page, mock) => {
      mock.reponses.push((d) =>
        tour(d, {
          advice: {
            level: 'info',
            summary: 'Citra disponible en Suisse, Galaxy en rupture.',
            action: 'Commande le Citra pour la prochaine brassée.',
            why: 'Le Citra en 100 g est annoncé en stock chez un fournisseur suisse.',
            watch: '',
            question: '',
            evidenceIds: ['ev-achats'],
            productUrls: PRODUITS.map((p) => p.url)
          },
          evidence: [
            {
              id: 'ev-achats',
              name: 'Achats',
              label: 'Houblons disponibles en Suisse',
              facts: ['Citra pellets 100 g annoncé en stock', 'Galaxy pellets 100 g en rupture'],
              limits: ['Prix annoncés sur la page produit, à confirmer au panier.'],
              data: {},
              products: PRODUITS,
              model: 'gemini-3.8-flash'
            }
          ]
        }));
      await envoyer(page, Q_FOURNISSEURS);
      await page.waitForSelector('.brewer-chat-suppliers');
    }
  },
  {
    id: 'e13',
    titre: 'Erreur relançable',
    geste: 'job status error, error.retryable true ; bouton Relancer',
    cible: '.brewer-work-card.is-error',
    jouer: async (page, mock) => {
      mock.reponses.push((d, m) =>
        ({
          job: travail(d, m, {
            status: 'error',
            stage: 'analysis',
            detail: '',
            finishedAt: Date.now(),
            error: {
              code: 'analysis-failed',
              message: 'Le serveur n’a pas pu terminer l’analyse. Rien n’a été modifié ; relance quand tu veux.',
              retryable: true
            }
          })
        }));
      await envoyer(page, Q_ERREUR);
      await page.waitForSelector('.brewer-work-card.is-error');
    }
  },
  {
    id: 'e14',
    titre: 'Plafond de dépense',
    geste: 'job error gemini-spend-cap ; lien Ouvrir les dépenses Google',
    cible: '.brewer-work-card.is-error',
    jouer: async (page, mock) => {
      mock.reponses.push((d, m) =>
        ({
          job: travail(d, m, {
            status: 'error',
            stage: 'analysis',
            detail: '',
            finishedAt: Date.now(),
            error: {
              code: 'gemini-spend-cap',
              message: 'Google bloque les appels : le plafond de dépenses Gemini du projet est atteint. Vérifie le plafond mensuel dans Google AI Studio → Dépenses. Les limites « Limites IA » de cette application sont distinctes. Après régularisation, relance cette question.',
              retryable: true
            }
          })
        }));
      await envoyer(page, Q_ERREUR);
      await page.waitForSelector('.brewer-work-card.is-error a');
    }
  },
  {
    id: 'e15',
    titre: 'Hors ligne : envoi échoué',
    geste: 'mode hors ligne coupé avant envoi ; bandeau de connexion si présent',
    cible: '.brewer-chat-compose',
    jouer: async (page, mock) => {
      mock.horsLigne = true;
      await envoyer(page, Q_RECETTE);
      const vu = await attendreTexte(page, 'Envoi à confirmer', 40000).then(() => true, () => false);
      return vu ? 'Envoi à confirmer affiché hors ligne.' : 'Envoi à confirmer non affiché dans 40 s ; capture faite telle quelle.';
    }
  },
  {
    id: 'e16',
    titre: 'Confirmation « Repartir à zéro ? »',
    geste: 'conversation existante ; bouton Réinitialiser ouvert, confirmation non cliquée',
    cible: '.brewer-reset-confirm',
    jouer: async (page, mock) => {
      mock.reponses.push((d) => tour(d, { advice: ADVICE_COURT }));
      await envoyer(page, Q_DENSITE);
      await page.waitForSelector('.brewer-chat-answer');
      await cliquer(page, 'button[aria-label="Réinitialiser la conversation"]');
      await page.waitForSelector('.brewer-reset-confirm');
    }
  },
  {
    id: 'e17',
    titre: 'Mes conversations',
    geste: 'trois conversations ; boîte « Mes conversations » ouverte depuis le compagnon',
    cible: '.brewer-activity-list',
    graine: (mock) => {
      mock.jobs.push(jobSupplementaire('ext-1', 'batch', 'BR-2026-031', 'Brassin 31 · Blonde de garde', 'Quelle température de garde ?'));
      mock.jobs.push(jobSupplementaire('ext-2', 'batch', 'BR-2026-029', 'Brassin 29 · Stout', 'Le lactose ajouté est-il dosé juste ?'));
    },
    jouer: async (page, mock) => {
      mock.reponses.push((d) => tour(d, { advice: ADVICE_COURT }));
      await envoyer(page, Q_DENSITE);
      await page.waitForSelector('.brewer-chat-answer');
      await cliquer(page, 'button[aria-label="Mes conversations"]');
      await page.waitForSelector('.brewer-conversation');
      await sleep(800);
    }
  }
];

// ---------- Exécution ----------
async function ouvrirCompagnon(page) {
  await page.click(".floating-actions button[aria-haspopup='menu']");
  const item = await page.waitForFunction(() =>
    [...document.querySelectorAll('[role="menuitem"]')].find((b) => b.textContent.startsWith('Compagnon'))
  );
  await item.asElement().click();
  await item.dispose();
}

async function capturer(browser, formatId, theme, etat) {
  const contexte = browser.createBrowserContext
    ? await browser.createBrowserContext()
    : await browser.createIncognitoBrowserContext();
  const page = await contexte.newPage();
  const mock = nouveauMock();
  const entree = { etat: etat.id, format: formatId, theme, capture: false, cible: false, note: '', erreur: '' };
  try {
    await page.setViewport(FORMATS[formatId]);
    page.setDefaultTimeout(30000);
    await page.evaluateOnNewDocument((t) => localStorage.setItem('laffinee.theme', t), theme);
    await page.setRequestInterception(true);
    page.on('request', (req) => {
      servir(req, mock).catch(() => {});
    });
    etat.graine?.(mock);
    await page.goto(URL_BANC, { waitUntil: 'networkidle0', timeout: 90000 });
    await page.waitForSelector(".floating-actions button[aria-haspopup='menu']", { visible: true });
    await ouvrirCompagnon(page);
    await page.waitForSelector(SAISIE);
    const note = await etat.jouer(page, mock);
    if (note) entree.note = note;
    await sleep(500);
    entree.cible = await page.evaluate((sel) => {
      const el = document.querySelector(sel);
      if (!el) return false;
      el.scrollIntoView({ block: 'center' });
      return true;
    }, etat.cible);
    await sleep(300);
    await page.screenshot({ path: resolve(CAP, `${etat.id}-${formatId}-${theme}.png`) });
    entree.capture = true;
  } catch (e) {
    entree.erreur = e.message.split('\n')[0];
    await page.screenshot({ path: resolve(VOIE, 'erreurs', `${etat.id}-${formatId}-${theme}.png`) }).catch(() => {});
  } finally {
    journal.push(entree);
    console.log(`${etat.id} ${formatId} ${theme} capture=${entree.capture} cible=${entree.cible}${entree.erreur ? ' erreur=' + entree.erreur : ''}`);
    await contexte.close().catch(() => {});
  }
}

async function planche(browser, formatId, theme) {
  const cellules = ETATS.map((e) => {
    const f = resolve(CAP, `${e.id}-${formatId}-${theme}.png`);
    const img = existsSync(f)
      ? `<img src="data:image/png;base64,${readFileSync(f).toString('base64')}">`
      : '<div class="manque">capture absente</div>';
    return `<figure><figcaption><b>${e.id}</b> ${e.titre}</figcaption>${img}</figure>`;
  }).join('');
  const html = `<!doctype html><html lang="fr"><meta charset="utf-8"><style>
body{margin:0;padding:16px;background:#777;font:14px Arial,sans-serif;color:#fff}
h1{font-size:18px;margin:0 0 12px}
main{display:grid;grid-template-columns:repeat(6,1fr);gap:12px}
figure{margin:0;background:#333;padding:6px;border-radius:6px}
figcaption{margin-bottom:4px}
img{width:100%;display:block}
.manque{height:120px;display:flex;align-items:center;justify-content:center;background:#a33}
</style><h1>Compagnon brasseur · ${formatId} · ${theme}</h1><main>${cellules}</main></html>`;
  const page = await browser.newPage();
  await page.setViewport({ width: 1900, height: 1000, deviceScaleFactor: 1 });
  await page.setContent(html, { waitUntil: 'load' });
  await page.screenshot({ path: resolve(CAP, `planche-${formatId}-${theme}.png`), fullPage: true });
  await page.close();
}

async function principal() {
  await mkdir(CAP, { recursive: true });
  await mkdir(resolve(VOIE, 'erreurs'), { recursive: true });
  await writeFile(
    resolve(CAP, 'etats.json'),
    JSON.stringify(ETATS.map(({ id, titre, geste }) => ({ id, titre, geste })), null, 2)
  );
  const browser = await puppeteer.launch({ executablePath: CHROME, headless: true, args: ['--mute-audio'] });
  try {
    for (const formatId of Object.keys(FORMATS))
      for (const theme of THEMES) for (const etat of ETATS) await capturer(browser, formatId, theme, etat);
    for (const formatId of Object.keys(FORMATS)) for (const theme of THEMES) await planche(browser, formatId, theme);
  } finally {
    await browser.close();
  }
  await writeFile(resolve(VOIE, 'journal-banc.json'), JSON.stringify(journal, null, 2));
  await writeFile(
    resolve(CAP, 'reseau.json'),
    JSON.stringify({ intercepte: reseau.intercepte, nonIntercepte: reseau.nonIntercepte, urls: [...reseau.urls] }, null, 2)
  );
  const ok = journal.filter((j) => j.capture).length;
  console.log(`captures ${ok}/${journal.length} ; intercepte ${reseau.intercepte} ; nonIntercepte ${reseau.nonIntercepte}`);
}

principal().then(() => process.exit(0), (e) => {
  console.error(e);
  process.exit(1);
});
