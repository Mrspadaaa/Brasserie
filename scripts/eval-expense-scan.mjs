// Opt-in real integration. No credential files; no deployed callable or business documents.
import { readFile, writeFile, mkdir, open, unlink, stat } from 'node:fs/promises';
import { createHash, randomUUID } from 'node:crypto';
import { fileURLToPath } from 'node:url';
import { resolve } from 'node:path';
import { isDeepStrictEqual } from 'node:util';
import { createRequire } from 'node:module';
import { jsPDF } from 'jspdf';
import { requirePaidAiTestOptIn } from './paid-ai-test-guard.mjs';

const ROOT = fileURLToPath(new URL('../', import.meta.url));
const args = new Set(process.argv.slice(2));
for (const arg of args) if (!['--confirm-paid-ai', '--preflight', '--describe', '--fixture-v4'].includes(arg)) throw new Error('Argument inconnu. Aucun appel IA.');
// This historical fixture assumes a Flash Lite extraction and a lines-only reviewer.
// Refuse before credentials, writes or reservations when the application pipeline changes.
if (!args.has('--describe')) {
  const { INVOICE_SCAN_VERSION } = await import('../functions/lib/invoiceScanCore.js');
  if (INVOICE_SCAN_VERSION !== 'invoice-v2') throw new Error('Évaluation historique incompatible avec cette version. Utilise scripts/eval-expense-vision.mjs ; aucun appel IA effectué.');
}
// A new explicit, deterministic fixture verifies a corrected reviewer without
// invalidating the old cache or allowing accidental repeated paid generations.
const revision = args.has('--fixture-v4') ? 'v4' : 'v3';
const MAX_CALLS = 2, MAX_OUTPUT = 2048, UID = `synthetic-expense-evaluation-${revision}`, FIXTURE = `equipment-maintenance-${revision}`;
const INVOICE_NUMBER = revision === 'v4' ? 'TEST-EVAL-MATERIEL-004' : 'TEST-EVAL-MATERIEL-003';
const fixtureLines = [
  'TEST SYNTHETIQUE - SANS VALEUR COMMERCIALE',
  'Fournisseur fictif de materiel de brasserie',
  `Facture ${INVOICE_NUMBER} - Date : 09.09.2026 - Devise : CHF`, '',
  revision === 'v4' ? 'Hotte aspirante inox pour cuves de brassage - bien durable neuf' : 'Fermenteur inox 30 litres - bien durable neuf',
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
function makeSyntheticDocument() {
  const document = new jsPDF({ compress: false });
  document.setCreationDate("D:20260909000000+00'00'");
  document.setFileId(createHash('sha256').update(FIXTURE).digest('hex').slice(0, 32));
  document.setProperties({ title: FIXTURE, author: 'Synthetic evaluation', creator: 'Brasserie synthetic evaluation' });
  document.setFont('helvetica'); document.setFontSize(10); document.text(fixtureLines, 15, 20, { lineHeightFactor: 1.5 });
  return { mimeType: 'application/pdf', data: Buffer.from(document.output('arraybuffer')).toString('base64') };
}
const plan = {
  schemaVersion: 3, fixture: FIXTURE, syntheticOnly: true, maximumProviderRequests: MAX_CALLS,
  maxOutputTokensPerGeneration: MAX_OUTPUT, scenarios: 1, retries: 0, modelFallbacks: false,
  pathway: 'local aiTask.run -> scanInvoiceSafely -> runBudgetedInvoiceScan -> real Gemini',
  scope: 'Handler, shared pause/limits, durable reservations, document hash/cache and independent reviewer. Published HTTPS transport and Firebase token verification are not tested.',
  credentials: ['GEMINI_API_KEY', 'EVAL_GOOGLE_ACCESS_TOKEN', 'EVAL_FIREBASE_PROJECT_ID', 'AUTHORIZED_ACCOUNTS (or VITE_AUTHORIZED_ACCOUNTS)'],
  optionalEnvironment: ['EVAL_CALLER_EMAIL (defaults to first configured authorized account)'],
  writes: ['invoiceScans/<synthetic document hash>', 'brewerAiUsage/<current Zurich day>'],
  sharedControlsAreReadOnly: true, createsTransactionsOrStockOrChatJobs: false,
  output: revision === 'v4' ? 'docs/expense-scan-evaluation-v4.json' : 'docs/expense-scan-evaluation.json'
};
if (args.has('--describe')) {
  const bytes = Buffer.from(makeSyntheticDocument().data, 'base64');
  console.log(JSON.stringify({ ...plan, document: { bytes: bytes.length, sha256: createHash('sha256').update(bytes).digest('hex') } }, null, 2));
} else {
  const preflightOnly = args.has('--preflight');
  if (!preflightOnly) requirePaidAiTestOptIn({ label: '1 document synthétique, 2 requêtes Gemini maximum, 2048 jetons par requête, puis cache sans génération', command: `node scripts/eval-expense-scan.mjs ${revision === 'v4' ? '--fixture-v4 ' : ''}--confirm-paid-ai` });
  const reportPath = resolve(ROOT, preflightOnly ? `docs/expense-scan-preflight${revision === 'v4' ? '-v4' : ''}.json` : plan.output), lockPath = resolve(ROOT, '.expense-scan-evaluation.lock');
  const report = { ...plan, timestamp: new Date().toISOString(), runId: randomUUID(), status: 'preflight', generations: 0, requests: [], cases: [] };
  const secrets = [process.env.GEMINI_API_KEY, process.env.EVAL_GOOGLE_ACCESS_TOKEN].filter(Boolean);
  const safeError = error => {
    let message = String(error?.message ?? 'Échec du contrôle.');
    for (const secret of secrets) message = message.replaceAll(secret, '[secret]');
    return { code: String(error?.code ?? error?.name ?? 'error').slice(0, 80), message: message.replace(/(?:Bearer\s+|key=)[^\s&]+/gi, '[secret]').replace(/[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}/gi, '[account]').slice(0, 450) };
  };
  const persist = async () => { await mkdir(resolve(ROOT, 'docs'), { recursive: true }); await writeFile(reportPath, JSON.stringify(report, null, 2) + '\n'); };
  const ledger = data => data ? { status: data.status, calls: data.calls, reservedTokens: data.reservedTokens, reservations: Object.values(data.reservations ?? {}).map(value => ({ status: value.status, reserved: value.reserved, charged: value.charged })) } : null;
  let app, deleteApp, db, lock, scanRef, originalFetch, beforeUsage, phase = 'scan';
  const readUsage = async () => {
    const day = new Intl.DateTimeFormat('en-CA', { timeZone: 'Europe/Zurich', year: 'numeric', month: '2-digit', day: '2-digit' }).format(new Date());
    const data = (await db.doc(`brewerAiUsage/${day}`).get()).data();
    return { day, calls: data?.usage?.calls ?? 0, tokens: data?.usage?.tokens ?? 0, proCalls: data?.usage?.proCalls ?? 0 };
  };
  try {
    const configuredProject = JSON.parse(await readFile(resolve(ROOT, '.firebaserc'), 'utf8')).projects?.default;
    const projectId = process.env.EVAL_FIREBASE_PROJECT_ID;
    const authorized = process.env.AUTHORIZED_ACCOUNTS || process.env.VITE_AUTHORIZED_ACCOUNTS || '';
    const accounts = authorized.split(',').map(value => value.trim().toLowerCase()).filter(Boolean);
    const email = (process.env.EVAL_CALLER_EMAIL || accounts[0] || '').trim().toLowerCase();
    const missing = [];
    if (!process.env.GEMINI_API_KEY) missing.push('GEMINI_API_KEY absent de la mémoire du processus.');
    if (!process.env.EVAL_GOOGLE_ACCESS_TOKEN) missing.push('EVAL_GOOGLE_ACCESS_TOKEN absent de la mémoire du processus.');
    if (!projectId || projectId !== configuredProject) missing.push('EVAL_FIREBASE_PROJECT_ID doit correspondre au projet Firebase configuré dans ce dépôt.');
    if (!accounts.length || !accounts.includes(email)) missing.push('Une identité de test appartenant aux comptes configurés doit être fournie en mémoire.');
    if (process.env.FIRESTORE_EMULATOR_HOST) missing.push('Cette évaluation réelle exige le budget partagé du projet, pas un émulateur Firestore.');
    if (missing.length) { report.reason = missing; throw Object.assign(new Error('Préconditions indisponibles : aucune génération.'), { code: 'eval-preconditions' }); }
    process.env.AUTHORIZED_ACCOUNTS = authorized;
    for (const name of ['ai', 'invoiceScanBudget', 'invoiceScanCore', 'models', 'prompts']) {
      const [source, compiled] = await Promise.all([stat(resolve(ROOT, `functions/src/${name}.ts`)), stat(resolve(ROOT, `functions/lib/${name}.js`))]);
      if (compiled.mtimeMs < source.mtimeMs) throw Object.assign(new Error('Functions compilées périmées : compiler avant le test.'), { code: 'eval-stale-build' });
    }
    const admin = await import('../functions/node_modules/firebase-admin/lib/esm/app/index.js'); deleteApp = admin.deleteApp;
    const { getFirestore } = await import('../functions/node_modules/firebase-admin/lib/esm/firestore/index.js');
    // Resolve the auth library used by GAX itself: Admin uses v10 Headers while this
    // GAX version expects v9 plain header objects. Mixing them drops Authorization.
    const requireGax = createRequire(new URL('../functions/node_modules/google-gax/build/src/grpc.js', import.meta.url));
    const { GoogleAuth, OAuth2Client } = requireGax('google-auth-library');
    const tokenClient = new OAuth2Client();
    tokenClient.setCredentials({ access_token: process.env.EVAL_GOOGLE_ACCESS_TOKEN, expiry_date: Date.now() + 900_000 });
    report.transport = { authLibraryVersion: requireGax('google-auth-library/package.json').version, explicitTokenHeaderVerified: false, authenticatedRequests: 0 };
    const getHeaders = tokenClient.getRequestHeaders.bind(tokenClient);
    tokenClient.getRequestHeaders = async (...parameters) => {
      const headers = await getHeaders(...parameters);
      const authorization = headers.get?.('authorization') ?? headers.Authorization ?? headers.authorization;
      if (authorization !== `Bearer ${process.env.EVAL_GOOGLE_ACCESS_TOKEN}`) throw new Error('Jeton explicite absent des en-têtes Firestore : arrêt avant génération.');
      report.transport.explicitTokenHeaderVerified = true; report.transport.authenticatedRequests++;
      return headers;
    };
    const inMemoryAuth = new GoogleAuth({ projectId, authClient: tokenClient });
    inMemoryAuth.toJSON = () => ({ inMemoryCredential: true });
    // Admin requires its ADC credential type. Firestore's explicit auth client below
    // supplies every request; GoogleAuth uses this cached client, never credential discovery.
    app = admin.initializeApp({ projectId, credential: admin.applicationDefault() });
    db = getFirestore(app); db.settings({ auth: inMemoryAuth, preferRest: true });
    const [{ aiTask }, { TIERS }, { invoiceScanId, invoiceDocumentHash }, { DEFAULT_BREWER_LIMITS }] = await Promise.all([
      import('../functions/lib/ai.js'), import('../functions/lib/models.js'), import('../functions/lib/invoiceScanCore.js'), import('../functions/lib/brewerLimits.js')
    ]);
    report.model = TIERS.fast.primary;
    if (!/^gemini-3\./.test(report.model)) throw Object.assign(new Error('Modèle fast inattendu : vérifier la configuration avant génération.'), { code: 'eval-model' });
    // Fixed PDF metadata and UID guarantee the same server cache key across process restarts.
    const file = makeSyntheticDocument();
    const documentHash = invoiceDocumentHash(file);
    report.document = { sha256: documentHash, bytes: Buffer.from(file.data, 'base64').length, mimeType: file.mimeType, pages: 1 };
    scanRef = db.doc(`invoiceScans/${invoiceScanId(UID, file)}`);
    const [control, prior] = await Promise.all([db.doc('brewerAiControls/current').get(), scanRef.get()]);
    const raw = control.data(), limits = { ...DEFAULT_BREWER_LIMITS, ...raw?.limits };
    if ((raw?.paused != null && typeof raw.paused !== 'boolean') || Object.values(limits).some(value => !Number.isSafeInteger(value) || value < 0)) throw new Error('Contrôle partagé illisible.');
    beforeUsage = await readUsage();
    report.sharedBudget = { before: beforeUsage, paused: raw?.paused === true, limits, controlsModified: false, beforeAfterDeltasMayIncludeConcurrentUse: true };
    report.scanLedgerBefore = ledger(prior.data());
    if (raw?.paused === true && prior.data()?.status !== 'completed') throw Object.assign(new Error('IA suspendue : aucun changement de ce réglage et aucune génération.'), { code: 'eval-paused' });
    if (prior.exists && prior.data()?.status !== 'completed') throw Object.assign(new Error('Ce document possède une tentative inachevée ou refusée. Aucun nouvel identifiant ni nouvel essai automatique.'), { code: 'eval-existing-attempt' });
    if (preflightOnly) {
      report.status = prior.data()?.status === 'completed' ? 'ready-cached-only' : 'ready-no-generation';
    } else {
      lock = await open(lockPath, 'wx'); await lock.writeFile(report.runId);
      report.status = 'running'; await persist();
      originalFetch = globalThis.fetch;
      globalThis.fetch = async (input, options = {}) => {
        const url = new URL(typeof input === 'string' ? input : input instanceof URL ? input : input.url);
        if (url.hostname !== 'generativelanguage.googleapis.com') return originalFetch(input, options);
        if (phase !== 'scan' || report.generations >= MAX_CALLS || options.method !== 'POST' || url.pathname !== `/v1beta/models/${report.model}:generateContent`)
          throw Object.assign(new Error('Garde indépendante : aucune autre génération, aucun repli ou autre modèle autorisé.'), { code: 'eval-call-limit' });
        const body = JSON.parse(options.body), requestedOutput = body.generationConfig?.maxOutputTokens;
        if (!Number.isSafeInteger(requestedOutput) || requestedOutput < 1 || requestedOutput > 4500 || body.tools?.length) throw new Error('Configuration du scan inattendue.');
        const inline = body.contents?.flatMap(value => value.parts ?? []).filter(part => part.inlineData).map(part => part.inlineData) ?? [];
        if (inline.length !== 1 || invoiceDocumentHash(inline[0]) !== documentHash) throw new Error('Le document à transmettre ne correspond pas au document synthétique autorisé.');
        const stored = (await scanRef.get()).data();
        if (stored?.status !== 'running' || stored.calls !== report.generations + 1 || !Object.values(stored?.reservations ?? {}).some(value => value.status === 'reserved')) throw new Error('Réservation durable absente : aucune génération.');
        // Only the output cap is reduced. The application reservation stays conservative.
        const enforced = { ...body, generationConfig: { ...body.generationConfig, maxOutputTokens: Math.min(requestedOutput, MAX_OUTPUT) } };
        const userText = body.contents?.flatMap(value => value.parts ?? []).filter(part => typeof part.text === 'string').map(part => part.text).join('\n') || '';
        const number = ++report.generations;
        const request = { number, model: report.model, stage: number === 1 ? 'extraction' : 'independent-review', requestedMaxOutputTokens: requestedOutput,
          enforcedMaxOutputTokens: enforced.generationConfig.maxOutputTokens, reservationVerifiedBeforeProvider: true, scanCallsReserved: stored.calls, sameOriginalDocument: true,
          independentReviewerTargetsContainNoFirstAmounts: number === 2 ? !/"(?:amountTTC|quantity|kind)"\s*:/.test(userText) : null,
          requestSha256: createHash('sha256').update(JSON.stringify(enforced)).digest('hex'), status: 'sent', startedAt: new Date().toISOString() };
        report.requests.push(request); await persist();
        const start = Date.now();
        try {
          const response = await originalFetch(input, { ...options, body: JSON.stringify(enforced) });
          request.httpStatus = response.status; request.elapsedMs = Date.now() - start;
          const payload = await response.clone().json().catch(() => ({}));
          request.status = response.ok ? 'returned' : 'rejected'; request.finishReason = payload.candidates?.[0]?.finishReason ?? null;
          request.responseModel = typeof payload.modelVersion === 'string' ? payload.modelVersion.slice(0, 100) : null;
          request.usage = Object.fromEntries(['promptTokenCount', 'candidatesTokenCount', 'thoughtsTokenCount', 'cachedContentTokenCount', 'totalTokenCount'].map(key => [key, Number.isSafeInteger(payload.usageMetadata?.[key]) ? payload.usageMetadata[key] : null]));
          await persist(); return response;
        } catch (error) { request.status = 'uncertain'; request.error = safeError(error); request.elapsedMs = Date.now() - start; await persist(); throw error; }
      };
      const request = { auth: { uid: UID, token: { email, email_verified: true } }, data: { task: 'scanInvoice', file } };
      const began = Date.now(), response = await aiTask.run(request);
      if (!response.ok || !response.data) throw Object.assign(new Error(response.error || 'Aucun résultat de scan.'), { code: 'eval-scan-failed' });
      const result = response.data, items = result.items ?? [], equipment = items.find(item => item.kind === 'equipment'), maintenance = items.find(item => item.kind === 'maintenance');
      const checks = {
        totalSourcePreserved: result.amountTTC === 550,
        netAndVatSourcePreserved: result.amountHT === 508.79 && result.tvaRate === 0.081 && result.tvaAmount === 41.21,
        currencyAndDatePreserved: result.currency === 'CHF' && result.date === '09.09.2026',
        invoiceIdentityPreserved: result.invoiceNumber === INVOICE_NUMBER,
        durableEquipmentSeparated: equipment?.amountTTC === 500 && equipment?.quantity === 1 && /^(piece|pièce|pce|pcs|unite|unité)s?$/i.test(equipment?.unit?.trim() ?? ''),
        repairSeparatedFromEquipment: maintenance?.amountTTC === 50,
        missingRepairQuantityNotInvented: maintenance?.quantity === null && maintenance?.unit === '',
        shippingAndDiscountPreserved: items.some(item => item.kind === 'shipping' && item.amountTTC === 12) && items.some(item => item.kind === 'discount' && item.amountTTC === -12),
        independentReviewCompleted: result.review?.status === 'checked',
        disputesExplicit: result.review?.status !== 'disputed' || result.review?.findings?.length > 0,
        targetedReviewerHasNoFirstAmounts: response.cached === true || report.requests.length === 2 && report.requests[1].independentReviewerTargetsContainNoFirstAmounts === true,
        ownBudgetReservedBeforeEveryCall: report.requests.every(value => value.reservationVerifiedBeforeProvider),
        onlyConfiguredModelAndBoundedOutput: report.requests.every(value => value.model === report.model && value.enforcedMaxOutputTokens <= MAX_OUTPUT)
      };
      const caseReport = { id: FIXTURE, cachedBeforeRun: response.cached === true, checks, elapsedMs: Date.now() - began,
        extracted: { currency: result.currency, date: result.date, amountHT: result.amountHT, tvaRate: result.tvaRate, tvaAmount: result.tvaAmount, amountTTC: result.amountTTC,
          lines: items.map(item => ({ name: String(item.name).slice(0, 150), kind: item.kind, quantity: item.quantity, unit: item.unit, amountTTC: item.amountTTC })) },
        review: result.review, issues: result.issues, ok: false };
      report.cases.push(caseReport);
      phase = 'cache-verification';
      const beforeCache = report.generations, cached = await aiTask.run(request);
      checks.cacheReturnsSameResultWithoutProvider = cached.ok === true && cached.cached === true && isDeepStrictEqual(cached.data, result) && beforeCache === report.generations;
      checks.serverLedgerCallsBounded = (await scanRef.get()).data()?.calls <= MAX_CALLS;
      caseReport.ok = Object.values(checks).every(Boolean);
      report.status = caseReport.ok ? response.cached ? 'passed-from-existing-cache' : 'passed' : 'failed';
      if (!caseReport.ok) process.exitCode = 1;
    }
  } catch (error) {
    report.status = report.generations ? 'failed-no-retry' : 'blocked-before-generation'; report.error = safeError(error); process.exitCode = 2;
  } finally {
    if (originalFetch) globalThis.fetch = originalFetch;
    if (db && beforeUsage) { try { report.sharedBudget.after = await readUsage(); } catch { report.sharedBudget.afterReadUnavailable = true; } }
    if (scanRef) { try { report.scanLedgerAfter = ledger((await scanRef.get()).data()); } catch { report.scanLedgerReadUnavailable = true; } }
    report.finishedAt = new Date().toISOString();
    report.reportedTotalTokens = report.requests.reduce((total, request) => total + (request.usage?.totalTokenCount ?? 0), 0);
    report.tokenUsageComplete = report.requests.every(request => Number.isSafeInteger(request.usage?.totalTokenCount));
    await persist();
    if (lock) { await lock.close(); if (await readFile(lockPath, 'utf8').catch(() => '') === report.runId) await unlink(lockPath); }
    if (app && deleteApp) await deleteApp(app);
    console.log(JSON.stringify({ status: report.status, generations: report.generations, reportedTotalTokens: report.reportedTotalTokens, report: reportPath, ...(report.error ? { error: report.error } : {}) }, null, 2));
  }
}
