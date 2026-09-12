// Real, opt-in vision integration. No unit-test import, business writes or credential files.
import { readFile, writeFile, mkdir, open, unlink, stat, rename } from 'node:fs/promises';
import { createHash, randomUUID } from 'node:crypto';
import { fileURLToPath } from 'node:url';
import { resolve } from 'node:path';
import { createRequire } from 'node:module';
import { isDeepStrictEqual } from 'node:util';
import { jsPDF } from 'jspdf';
import { requirePaidAiTestOptIn } from './paid-ai-test-guard.mjs';

const ROOT = fileURLToPath(new URL('../', import.meta.url));
const args = new Set(process.argv.slice(2));
for (const arg of args) if (!['--confirm-paid-ai', '--preflight', '--describe', '--image'].includes(arg)) throw new Error('Argument inconnu. Aucun appel IA.');
const imageMode = args.has('--image');
const MODEL = 'gemini-3.8-flash', MAX_CALLS = 3, MAX_OUTPUT = 2048;
const UID = imageMode ? 'synthetic-expense-vision-image-evaluation-v1' : 'synthetic-expense-vision-evaluation-v1';
const FIXTURE = imageMode ? 'flash-vision-hotte-reparation-image-v1' : 'flash-vision-hotte-reparation-v1';
const IMAGE_SHA256 = 'cf4a07f22830b721c35478a76b9ba3fe4900df6cc6ef2db2d019eba7bcaacad2';
const INVOICE_NUMBER = 'TEST-VISION-MATERIEL-001', VENDOR = 'Fournisseur fictif de materiel de brasserie';
const fixtureLines = [
  'TEST SYNTHETIQUE - SANS VALEUR COMMERCIALE', VENDOR,
  `Facture ${INVOICE_NUMBER} - Date : 09.09.2026 - Devise : CHF`, '',
  'Hotte aspirante inox pour cuves de brassage - bien durable neuf',
  'Quantite : 1 piece. Prix unitaire TTC : 500.00 CHF.',
  'Montant de la ligne TTC : 500.00 CHF.', '',
  'Reparation de la pompe existante - prestation, aucun materiel livre',
  'Quantite, unite et prix unitaire non indiques.',
  'Montant de la ligne TTC : 50.00 CHF.', '',
  'Frais de livraison - montant TTC : 12.00 CHF.',
  'Remise commerciale - montant TTC : -12.00 CHF.', '',
  'Total HT : 508.79 CHF. TVA 8.1 % : 41.21 CHF.',
  'TOTAL TTC A PAYER : 550.00 CHF.'
];
async function makeSyntheticDocument() {
  if (imageMode) {
    const bytes = await readFile(resolve(ROOT, 'tests/fixtures/expense-vision.png'));
    if (createHash('sha256').update(bytes).digest('hex') !== IMAGE_SHA256)
      throw Object.assign(new Error('L’image synthétique ne correspond pas à l’empreinte autorisée. Aucun appel IA.'), { code: 'eval-image-fixture-changed' });
    return { mimeType: 'image/png', data: bytes.toString('base64') };
  }
  const document = new jsPDF({ compress: false });
  document.setCreationDate("D:20260909000000+00'00'");
  document.setFileId(createHash('sha256').update(FIXTURE).digest('hex').slice(0, 32));
  document.setProperties({ title: FIXTURE, author: 'Synthetic evaluation', creator: 'Brasserie synthetic vision evaluation' });
  document.setFont('helvetica'); document.setFontSize(11); document.text(fixtureLines, 15, 20, { lineHeightFactor: 1.5 });
  return { mimeType: 'application/pdf', data: Buffer.from(document.output('arraybuffer')).toString('base64') };
}
const plan = {
  schemaVersion: 1, fixture: FIXTURE, syntheticOnly: true, fixtureFormat: imageMode ? 'PNG image' : 'PDF', expectedModel: MODEL,
  maximumProviderRequests: MAX_CALLS, maxOutputTokensPerGeneration: MAX_OUTPUT, scenarios: 1,
  expectedPipeline: 'Two complete independent readings in parallel; one further reading only if required.',
  retries: 0, modelFallbacks: false, webSearch: false,
  pathway: 'local scanInvoiceSafely -> runBudgetedInvoiceScan -> real Firestore monthly reservations -> real Gemini',
  scope: `Compiled application pipeline with one synthetic ${imageMode ? 'raster image' : 'PDF'}, independent vision, bounded calls, shared controls, reservations and cache. Published HTTPS transport, Firebase token verification, browser upload and real photographs are not tested.`,
  credentials: ['GEMINI_API_KEY', 'EVAL_GOOGLE_ACCESS_TOKEN', 'EVAL_FIREBASE_PROJECT_ID', 'AUTHORIZED_ACCOUNTS (or VITE_AUTHORIZED_ACCOUNTS)'],
  writes: ['invoiceScans/<fixed synthetic document hash>', 'brewerAiUsage/<Zurich day>', 'brewerAiCosts/<Zurich month>', 'brewerAiCosts/<Zurich month>/calls/<generated id>'],
  sharedControlsAreReadOnly: true, businessAndDriveWritesBlocked: true,
  output: imageMode ? 'docs/expense-vision-image-evaluation.json' : 'docs/expense-vision-evaluation.json'
};

if (args.has('--describe')) {
  const file = await makeSyntheticDocument(), bytes = Buffer.from(file.data, 'base64');
  console.log(JSON.stringify({ ...plan, document: { bytes: bytes.length, sha256: createHash('sha256').update(bytes).digest('hex'), mimeType: file.mimeType,
    ...(imageMode ? { width: 1400, height: 1300, fixedImageHashVerified: true } : { pages: 1 }) } }, null, 2));
} else {
  const preflightOnly = args.has('--preflight');
  if (!preflightOnly) requirePaidAiTestOptIn({ label: `1 ${imageMode ? 'image PNG' : 'PDF'} synthétique, 3 appels Flash maximum, 2048 jetons de sortie par appel, cache sans appel`, command: `node scripts/eval-expense-vision.mjs ${imageMode ? '--image ' : ''}--confirm-paid-ai` });
  const reportPath = resolve(ROOT, preflightOnly ? imageMode ? 'docs/expense-vision-image-preflight.json' : 'docs/expense-vision-preflight.json' : plan.output);
  const lockPath = resolve(ROOT, '.expense-vision-evaluation.lock');
  const report = { ...plan, timestamp: new Date().toISOString(), runId: randomUUID(), status: 'preflight', attemptedGenerations: 0, generations: 0, requests: [], cases: [] };
  const secrets = [process.env.GEMINI_API_KEY, process.env.EVAL_GOOGLE_ACCESS_TOKEN].filter(Boolean);
  const safeError = error => {
    let message = String(error?.message ?? 'Échec du contrôle.');
    for (const secret of secrets) message = message.replaceAll(secret, '[secret]');
    return { code: String(error?.code ?? error?.name ?? 'error').slice(0, 80), message: message.replace(/(?:Bearer\s+|key=)[^\s&]+/gi, '[secret]').replace(/[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}/gi, '[account]').slice(0, 450) };
  };
  // Serialize concurrent readers and atomically replace the report after each complete write.
  let pendingPersist = Promise.resolve();
  const persist = () => {
    const snapshot = JSON.stringify(report, null, 2) + '\n';
    pendingPersist = pendingPersist.then(async () => { await mkdir(resolve(ROOT, 'docs'), { recursive: true }); await writeFile(`${reportPath}.next`, snapshot); await rename(`${reportPath}.next`, reportPath); });
    return pendingPersist;
  };
  const summarizeScan = data => data ? { status: data.status, calls: data.calls, reservedTokens: data.reservedTokens,
    reservations: Object.values(data.reservations ?? {}).map(value => ({ status: value.status, reserved: value.reserved, charged: value.charged })) } : null;
  let app, deleteApp, db, scanRef, lock, originalFetch, originalDoc, originalRunTransaction;
  let beforeUsage, beforeMonthly, phase = 'preflight', inFlight = 0, maximumInFlight = 0;
  const writePaths = new Set(), monthlyClaims = new Set(), originalReferenceMethods = [];
  const zurichDate = () => new Intl.DateTimeFormat('en-CA', { timeZone: 'Europe/Zurich', year: 'numeric', month: '2-digit', day: '2-digit' }).format(Date.now());
  const readUsage = async () => {
    const day = zurichDate(), data = (await db.doc(`brewerAiUsage/${day}`).get()).data();
    return { day, calls: data?.usage?.calls ?? 0, tokens: data?.usage?.tokens ?? 0, proCalls: data?.usage?.proCalls ?? 0 };
  };
  const readMonthly = async () => {
    const month = zurichDate().slice(0, 7), data = (await db.doc(`brewerAiCosts/${month}`).get()).data();
    return { month, usedMicroChf: data?.usedMicroChf ?? 0, reservedMicroChf: data?.reservedMicroChf ?? 0 };
  };
  const assertWrite = reference => {
    const path = reference?.path;
    if (preflightOnly || !(path === scanRef?.path || /^brewerAiUsage\/\d{4}-\d{2}-\d{2}$/.test(path) || /^brewerAiCosts\/\d{4}-\d{2}(\/calls\/[^/]+)?$/.test(path)))
      throw Object.assign(new Error('Garde indépendante : écriture hors registre synthétique ou budget interdite.'), { code: 'eval-write-scope' });
    writePaths.add(path);
  };
  try {
    const configuredProject = JSON.parse(await readFile(resolve(ROOT, '.firebaserc'), 'utf8')).projects?.default;
    const projectId = process.env.EVAL_FIREBASE_PROJECT_ID;
    const authorized = process.env.AUTHORIZED_ACCOUNTS || process.env.VITE_AUTHORIZED_ACCOUNTS || '';
    const missing = [];
    if (!process.env.GEMINI_API_KEY) missing.push('GEMINI_API_KEY absent de la mémoire du processus.');
    if (!process.env.EVAL_GOOGLE_ACCESS_TOKEN) missing.push('EVAL_GOOGLE_ACCESS_TOKEN absent de la mémoire du processus.');
    if (!projectId || projectId !== configuredProject) missing.push('EVAL_FIREBASE_PROJECT_ID doit correspondre au projet configuré.');
    if (!authorized.split(',').some(value => value.trim())) missing.push('Liste des comptes autorisés absente de la mémoire du processus.');
    if (process.env.FIRESTORE_EMULATOR_HOST) missing.push('Cette évaluation exige le budget réel partagé, pas un émulateur.');
    if (missing.length) { report.reason = missing; throw Object.assign(new Error('Préconditions indisponibles : aucune génération.'), { code: 'eval-preconditions' }); }
    process.env.AUTHORIZED_ACCOUNTS = authorized;
    for (const name of ['ai', 'invoiceScanBudget', 'invoiceScanCore', 'invoiceVisionReview', 'models', 'prompts', 'geminiCosts', 'monthlyAiBudget']) {
      const [source, compiled] = await Promise.all([stat(resolve(ROOT, `functions/src/${name}.ts`)), stat(resolve(ROOT, `functions/lib/${name}.js`))]);
      if (compiled.mtimeMs < source.mtimeMs) throw Object.assign(new Error('Functions compilées périmées : compiler avant le test.'), { code: 'eval-stale-build' });
    }
    const admin = await import('../functions/node_modules/firebase-admin/lib/esm/app/index.js'); deleteApp = admin.deleteApp;
    const { getFirestore } = await import('../functions/node_modules/firebase-admin/lib/esm/firestore/index.js');
    const requireGax = createRequire(new URL('../functions/node_modules/google-gax/build/src/grpc.js', import.meta.url));
    const { GoogleAuth, OAuth2Client } = requireGax('google-auth-library');
    const tokenClient = new OAuth2Client();
    tokenClient.setCredentials({ access_token: process.env.EVAL_GOOGLE_ACCESS_TOKEN, expiry_date: Date.now() + 900_000 });
    report.transport = { authLibraryVersion: requireGax('google-auth-library/package.json').version, explicitTokenHeaderVerified: false, authenticatedRequests: 0 };
    const getHeaders = tokenClient.getRequestHeaders.bind(tokenClient);
    tokenClient.getRequestHeaders = async (...parameters) => {
      const headers = await getHeaders(...parameters);
      if ((headers.get?.('authorization') ?? headers.Authorization ?? headers.authorization) !== `Bearer ${process.env.EVAL_GOOGLE_ACCESS_TOKEN}`)
        throw new Error('Jeton explicite absent des en-têtes Firestore.');
      report.transport.explicitTokenHeaderVerified = true; report.transport.authenticatedRequests++;
      return headers;
    };
    const inMemoryAuth = new GoogleAuth({ projectId, authClient: tokenClient });
    inMemoryAuth.toJSON = () => ({ inMemoryCredential: true });
    app = admin.initializeApp({ projectId, credential: admin.applicationDefault() });
    db = getFirestore(app); db.settings({ auth: inMemoryAuth, preferRest: true });
    const [{ scanInvoiceSafely }, core, { DEFAULT_BREWER_LIMITS }, costs, { reconcileInvoiceVision }] = await Promise.all([
      import('../functions/lib/ai.js'), import('../functions/lib/invoiceScanCore.js'), import('../functions/lib/brewerLimits.js'), import('../functions/lib/geminiCosts.js'), import('../functions/lib/invoiceVisionReview.js')
    ]);
    if (core.SCAN_MAX_CALLS !== MAX_CALLS || core.INVOICE_SCAN_VERSION !== 'invoice-v4')
      throw Object.assign(new Error('La version compilée ne correspond pas à la vision à trois lectures attendue.'), { code: 'eval-pipeline-version' });
    report.scanVersion = core.INVOICE_SCAN_VERSION;
    const file = await makeSyntheticDocument(), documentHash = core.invoiceDocumentHash(file);
    core.validateInvoiceFile(file);
    report.document = { sha256: documentHash, bytes: Buffer.from(file.data, 'base64').length, mimeType: file.mimeType,
      ...(imageMode ? { width: 1400, height: 1300, fixedImageHashVerified: true } : { pages: 1 }) };
    scanRef = db.doc(`invoiceScans/${core.invoiceScanId(UID, file)}`);
    // Independent write guards cover direct and transactional writes by the imported application.
    originalDoc = db.doc; originalRunTransaction = db.runTransaction;
    db.doc = function (...parameters) {
      const reference = originalDoc.apply(this, parameters);
      for (const method of ['set', 'create', 'update', 'delete']) {
        const original = reference[method]; originalReferenceMethods.push([reference, method, original]);
        reference[method] = function (...values) { assertWrite(reference); return original.apply(this, values); };
      }
      return reference;
    };
    db.runTransaction = function (work, ...options) {
      return originalRunTransaction.call(this, transaction => work(new Proxy(transaction, { get(target, key) {
        const value = Reflect.get(target, key);
        if (typeof value !== 'function') return value;
        if (['set', 'create', 'update', 'delete'].includes(key)) return (reference, ...parameters) => { assertWrite(reference); return value.call(target, reference, ...parameters); };
        return value.bind(target);
      } })), ...options);
    };
    const [control, prior] = await Promise.all([db.doc('brewerAiControls/current').get(), scanRef.get()]);
    const raw = control.data(), limits = { ...DEFAULT_BREWER_LIMITS, ...raw?.limits };
    if ((raw?.paused != null && typeof raw.paused !== 'boolean') || Object.values(limits).some(value => !Number.isSafeInteger(value) || value < 0)) throw new Error('Contrôle partagé illisible.');
    [beforeUsage, beforeMonthly] = await Promise.all([readUsage(), readMonthly()]);
    report.sharedBudget = { dailyBefore: beforeUsage, monthlyBefore: beforeMonthly, monthlyLimitMicroChf: raw?.monthlyLimitMicroChf ?? null,
      paused: raw?.paused === true, limits, controlsModified: false, beforeAfterDeltasMayIncludeConcurrentUse: true };
    report.scanLedgerBefore = summarizeScan(prior.data());
    if (raw?.paused === true && prior.data()?.status !== 'completed') throw Object.assign(new Error('IA suspendue : aucun changement de ce réglage.'), { code: 'eval-paused' });
    if (prior.exists && prior.data()?.status !== 'completed') throw Object.assign(new Error('Une tentative existe déjà sans résultat terminé. Aucun nouvel identifiant ni nouvel essai automatique.'), { code: 'eval-existing-attempt' });
    if (preflightOnly) report.status = prior.data()?.status === 'completed' ? 'ready-cached-only' : 'ready-no-generation';
    else {
      lock = await open(lockPath, 'wx'); await lock.writeFile(report.runId);
      report.status = 'running'; phase = 'scan'; const scanStartedAt = Date.now(); await persist();
      const independentReadings = new Map();
      originalFetch = globalThis.fetch;
      globalThis.fetch = async (input, options = {}) => {
        const url = new URL(typeof input === 'string' ? input : input instanceof URL ? input : input.url);
        if (url.hostname !== 'generativelanguage.googleapis.com') {
          if (/^(?:www\.)?googleapis\.com$/.test(url.hostname) && url.pathname.startsWith('/upload/drive/') || /drive\.google/.test(url.hostname) || url.pathname.startsWith('/drive/'))
            throw Object.assign(new Error('Aucun accès Drive autorisé pendant cette évaluation.'), { code: 'eval-drive-forbidden' });
          return originalFetch(input, options);
        }
        if (phase !== 'scan' || report.attemptedGenerations >= MAX_CALLS || options.method !== 'POST' || url.pathname !== `/v1beta/models/${MODEL}:generateContent`)
          throw Object.assign(new Error('Garde indépendante : génération supplémentaire, recherche ou autre modèle interdits.'), { code: 'eval-call-limit' });
        const number = ++report.attemptedGenerations;
        const body = JSON.parse(options.body), config = body.generationConfig;
        if (!Number.isSafeInteger(config?.maxOutputTokens) || config.maxOutputTokens < 1 || config.maxOutputTokens > MAX_OUTPUT || (body.tools != null && (!Array.isArray(body.tools) || body.tools.length > 0)) || body.cachedContent || body.serviceTier)
          throw new Error('Configuration du scan inattendue : sortie ou outils hors plafond.');
        if (number === 3) {
          const first = independentReadings.get(1), second = independentReadings.get(2);
          if (!first || !second || !reconcileInvoiceVision([first, second]).needsCorrection)
            throw new Error('Troisième génération refusée : aucun désaccord ou écart vérifiable des deux lectures initiales.');
        }
        if (config.mediaResolution !== 'MEDIA_RESOLUTION_HIGH') throw new Error('Le scan n’utilise pas la résolution visuelle HIGH attendue.');
        if (url.search || new Headers(options.headers).get('x-goog-api-key') !== process.env.GEMINI_API_KEY) throw new Error('La clé du fournisseur doit rester dans un en-tête.');
        const inline = body.contents?.flatMap(value => value.parts ?? []).filter(part => part.inlineData).map(part => part.inlineData) ?? [];
        if (inline.length !== 1 || inline[0].mimeType !== file.mimeType || core.invoiceDocumentHash(inline[0]) !== documentHash) throw new Error('Le document transmis diffère du document synthétique autorisé.');
        const quote = costs.quoteGeminiCost(MODEL, body);
        const month = zurichDate().slice(0, 7);
        const [scan, monthly, calls] = await Promise.all([
          scanRef.get(), db.doc(`brewerAiCosts/${month}`).get(),
          db.collection(`brewerAiCosts/${month}/calls`).where('createdAt', '>=', scanStartedAt).get()
        ]);
        const stored = scan.data(), currentMonthly = monthly.data();
        if (stored?.status !== 'running' || stored.calls < number || stored.calls > MAX_CALLS || !Object.values(stored.reservations ?? {}).some(value => value.status === 'reserved'))
          throw new Error('Réservation du justificatif absente : aucune génération.');
        const candidates = calls.docs.filter(doc => {
          const value = doc.data();
          return !monthlyClaims.has(doc.id) && value.status === 'reserved' && value.model === MODEL && value.outputTokens === config.maxOutputTokens && value.reservedMicroChf === quote.reservedMicroChf;
        });
        const claimed = candidates.sort((a, b) => a.data().createdAt - b.data().createdAt)[0];
        if (!claimed || currentMonthly?.reservedMicroChf < quote.reservedMicroChf) throw new Error('Réservation mensuelle préalable absente : aucune génération.');
        monthlyClaims.add(claimed.id);
        const userText = body.contents?.flatMap(value => value.parts ?? []).filter(part => typeof part.text === 'string').map(part => part.text).join('\n') || '';
        const independent = !/"(?:amountTTC|amountHT|tvaAmount|tvaRate|quantity|price|kind|currency|vendor)"\s*:/.test(userText);
        if (!independent) throw new Error('Une lecture reçoit les valeurs proposées par un autre lecteur.');
        const request = { number, model: MODEL, stage: number <= 2 ? 'parallel-independent-reading' : 'independent-correction',
          maxOutputTokens: config.maxOutputTokens, mediaResolution: config.mediaResolution, noTools: !body.tools?.length,
          reservationVerifiedBeforeProvider: true, monthlyReservationVerifiedBeforeProvider: true,
          reservedMicroChf: quote.reservedMicroChf, monthlyCallId: claimed.id, sameOriginalDocument: true,
          independentPromptContainsNoOtherReadingValues: independent, requestSha256: createHash('sha256').update(JSON.stringify(body)).digest('hex'),
          status: 'reserved', startedAt: new Date().toISOString() };
        report.requests.push(request); await persist();
        const began = Date.now(); inFlight++; maximumInFlight = Math.max(maximumInFlight, inFlight); report.generations++; request.status = 'sent'; await persist();
        try {
          const response = await originalFetch(input, options);
          request.httpStatus = response.status; request.elapsedMs = Date.now() - began;
          const payload = await response.clone().json().catch(() => ({}));
          request.status = response.ok ? 'returned' : 'rejected'; request.finishReason = payload.candidates?.[0]?.finishReason ?? null;
          request.responseModel = typeof payload.modelVersion === 'string' ? payload.modelVersion.slice(0, 100) : null;
          request.usage = Object.fromEntries(['promptTokenCount', 'candidatesTokenCount', 'thoughtsTokenCount', 'cachedContentTokenCount', 'totalTokenCount'].map(key => [key, Number.isSafeInteger(payload.usageMetadata?.[key]) ? payload.usageMetadata[key] : null]));
          request.estimatedCostMicroChf = costs.observedGeminiCost(quote, payload);
          if (number <= 2 && payload.candidates?.[0]?.finishReason === 'STOP') {
            try {
              const json = payload.candidates[0].content?.parts?.filter(part => !part.thought && typeof part.text === 'string').map(part => part.text).join('');
              independentReadings.set(number, core.normalizeInvoiceScan(JSON.parse(json)));
            } catch { /* The real application decides how to expose an incomplete reading. */ }
          }
          await persist(); return response;
        } catch (error) { request.status = 'uncertain'; request.error = safeError(error); request.elapsedMs = Date.now() - began; await persist(); throw error; }
        finally { inFlight--; }
      };
      const began = Date.now();
      const response = await scanInvoiceSafely(UID, file, process.env.GEMINI_API_KEY, { maxOutputTokens: MAX_OUTPUT });
      if (!response.ok || !response.data) throw Object.assign(new Error(response.error || 'Aucun résultat de scan.'), { code: 'eval-scan-failed' });
      const result = response.data, items = result.items ?? [], equipment = items.find(item => item.kind === 'equipment'), maintenance = items.find(item => item.kind === 'maintenance');
      const canonical = value => String(value ?? '').normalize('NFD').replace(/[\u0300-\u036f]/g, '').trim().toLowerCase();
      const checks = {
        fixedFlashModel: response.model === MODEL && report.requests.every(value => value.model === MODEL && (!value.responseModel || value.responseModel.startsWith(MODEL))),
        totalSourcePreserved: result.amountTTC === 550,
        netAndVatSourcePreserved: result.amountHT === 508.79 && result.tvaRate === 0.081 && result.tvaAmount === 41.21,
        currencyAndDatePreserved: result.currency === 'CHF' && result.date === '09.09.2026',
        invoiceIdentityPreserved: result.invoiceNumber === INVOICE_NUMBER && canonical(result.vendor) === canonical(VENDOR),
        allFourLinesPreserved: items.length === 4,
        durableEquipmentSeparated: equipment?.amountTTC === 500 && equipment?.quantity === 1 && equipment?.price === 500 && /^(piece|pce|pcs|unite)s?\.?$/i.test(canonical(equipment?.unit)),
        repairSeparatedFromEquipment: maintenance?.amountTTC === 50,
        missingRepairValuesNotInvented: maintenance?.quantity === null && maintenance?.unit === '' && maintenance?.price === null,
        shippingAndDiscountPreserved: items.some(item => item.kind === 'shipping' && item.amountTTC === 12) && items.some(item => item.kind === 'discount' && item.amountTTC === -12),
        independentReviewCompleted: ['checked', 'corrected'].includes(result.review?.status) && result.review?.readers >= 2 && result.review?.readers <= 3,
        noUnresolvedDisputes: result.review?.status !== 'disputed' && (result.review?.findings ?? []).length === 0,
        allReadingsUseIndependentPrompts: report.requests.every(value => value.independentPromptContainsNoOtherReadingValues),
        firstTwoReadingsOverlap: response.cached === true || maximumInFlight >= 2,
        budgetReservedBeforeEveryProviderCall: report.requests.every(value => value.reservationVerifiedBeforeProvider && value.monthlyReservationVerifiedBeforeProvider),
        boundedCallsOutputAndNoWeb: report.generations <= MAX_CALLS && report.requests.every(value => value.maxOutputTokens <= MAX_OUTPUT && value.noTools),
        thirdReadingOnlyForVerifiedDisagreement: report.generations < 3 || independentReadings.size === 2 && reconcileInvoiceVision([independentReadings.get(1), independentReadings.get(2)]).needsCorrection,
        onlyAllowedWriteScopes: [...writePaths].every(path => path === scanRef.path || /^brewerAi(?:Usage|Costs)\//.test(path))
      };
      const caseReport = { id: FIXTURE, cachedBeforeRun: response.cached === true, checks, elapsedMs: Date.now() - began,
        extracted: { vendor: result.vendor, currency: result.currency, date: result.date, invoiceNumber: result.invoiceNumber, amountHT: result.amountHT, tvaRate: result.tvaRate, tvaAmount: result.tvaAmount, amountTTC: result.amountTTC,
          lines: items.map(item => ({ name: String(item.name).slice(0, 150), kind: item.kind, quantity: item.quantity, unit: item.unit, price: item.price, amountTTC: item.amountTTC })) },
        review: result.review, issues: result.issues, ok: false };
      report.cases.push(caseReport); phase = 'cache-verification';
      const beforeCache = report.generations, cached = await scanInvoiceSafely(UID, file, process.env.GEMINI_API_KEY, { maxOutputTokens: MAX_OUTPUT });
      checks.cacheReturnsSameResultWithoutProvider = cached.ok === true && cached.cached === true && isDeepStrictEqual(cached.data, result) && beforeCache === report.generations;
      const ledger = (await scanRef.get()).data();
      checks.serverLedgerCallsBounded = ledger?.calls >= 2 && ledger?.calls <= MAX_CALLS;
      checks.expectedReaderCount = response.cached === true || report.generations === result.review?.readers;
      caseReport.ok = Object.values(checks).every(Boolean);
      report.status = caseReport.ok ? response.cached ? 'passed-from-existing-cache' : 'passed' : 'failed';
      if (!caseReport.ok) process.exitCode = 1;
    }
  } catch (error) {
    report.status = report.generations ? 'failed-no-retry' : 'blocked-before-generation'; report.error = safeError(error); process.exitCode = 2;
  } finally {
    if (originalFetch) globalThis.fetch = originalFetch;
    if (db && beforeUsage) { try { [report.sharedBudget.dailyAfter, report.sharedBudget.monthlyAfter] = await Promise.all([readUsage(), readMonthly()]); } catch { report.sharedBudget.afterReadUnavailable = true; } }
    if (scanRef) { try { report.scanLedgerAfter = summarizeScan((await scanRef.get()).data()); } catch { report.scanLedgerReadUnavailable = true; } }
    if (db && monthlyClaims.size) {
      try {
        const month = beforeMonthly.month;
        report.monthlyCallLedgers = await Promise.all([...monthlyClaims].map(async id => {
          const data = (await db.doc(`brewerAiCosts/${month}/calls/${id}`).get()).data();
          return { id, status: data?.status, reservedMicroChf: data?.reservedMicroChf, chargedMicroChf: data?.chargedMicroChf ?? null, model: data?.model };
        }));
      } catch { report.monthlyCallLedgerReadUnavailable = true; }
    }
    report.finishedAt = new Date().toISOString(); report.maximumConcurrentProviderCalls = maximumInFlight;
    report.writePaths = [...writePaths].sort(); report.reportedTotalTokens = report.requests.reduce((total, request) => total + (request.usage?.totalTokenCount ?? 0), 0);
    report.tokenUsageComplete = report.requests.every(request => Number.isSafeInteger(request.usage?.totalTokenCount));
    report.estimatedCostMicroChf = report.requests.every(request => Number.isSafeInteger(request.estimatedCostMicroChf)) ? report.requests.reduce((sum, request) => sum + request.estimatedCostMicroChf, 0) : null;
    report.costIsConservativeApplicationEstimateNotGoogleInvoice = true;
    await persist();
    if (originalDoc) db.doc = originalDoc;
    if (originalRunTransaction) db.runTransaction = originalRunTransaction;
    for (const [reference, method, original] of originalReferenceMethods) reference[method] = original;
    if (lock) { await lock.close(); if (await readFile(lockPath, 'utf8').catch(() => '') === report.runId) await unlink(lockPath); }
    if (app && deleteApp) await deleteApp(app);
    console.log(JSON.stringify({ status: report.status, generations: report.generations, reportedTotalTokens: report.reportedTotalTokens,
      estimatedCostChf: report.estimatedCostMicroChf === null ? null : report.estimatedCostMicroChf / 1_000_000,
      report: reportPath, ...(report.error ? { error: report.error } : {}) }, null, 2));
  }
}
