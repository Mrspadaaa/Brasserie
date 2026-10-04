import assert from 'node:assert/strict';
import { createHash, randomBytes } from 'node:crypto';
import { execFileSync, spawn, spawnSync } from 'node:child_process';
import { createServer as createTcpServer } from 'node:net';
import { createRequire } from 'node:module';
import path from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { parseTransportPathOptions, resolveTransportPaths } from './hop-v55-transport-paths.mjs';
import {
  access, lstat, mkdir, readFile, realpath, rm, stat, symlink, unlink, writeFile,
} from 'node:fs/promises';
import { createServer as createViteServer } from 'vite';

const require = createRequire(import.meta.url);
const puppeteer = require('puppeteer-core');
const repoRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const fixtureRoot = path.join(repoRoot, 'work/houblons-v55-integration-app-2026-10-02/transport-fixtures');
const runtimeRoot = path.join(fixtureRoot, '.runtime');
const runtimeFunctions = path.join(runtimeRoot, 'functions');
const scriptPath = fileURLToPath(import.meta.url);
// Override paths with --java/--emulator-cache/--chrome; env: HOP_V55_JAVA,
// JAVA_HOME/PATH, HOP_V55_FIREBASE_EMULATOR_CACHE/FIREBASE_EMULATORS_PATH, CHROME_PATH.
const transportPathOptions = parseTransportPathOptions(process.argv.slice(2));
let resolvedTransportPaths;
function transportPaths() {
  return resolvedTransportPaths ??= resolveTransportPaths({ options: transportPathOptions });
}
const projectId = 'demo-hop-v55-http';
const authPort = 9097;
const firestorePort = 8087;
const functionsPort = 5007;
const vitePort = 4179;
const firestoreWebsocketPort = 9150;
const hubPort = 4400;
const loggingPort = 4500;
const servicePorts = [authPort, firestorePort, functionsPort];
const allPorts = [...servicePorts, firestoreWebsocketPort, hubPort, loggingPort, vitePort];
const firestoreJarBytes = 136707194;
const firestoreJarSha256 = '9b6498b7f62714d67f48f59b3818883cd682dbcd46b9f59511de81c97bb5166c';
const firebaseCli = path.join(repoRoot, 'node_modules/firebase-tools/lib/bin/firebase.js');
const actualFunctionsNodeModules = path.join(repoRoot, 'functions/node_modules');
const evidenceRoot = path.join(fixtureRoot, 'evidence');
const runtimeMarker = path.join(runtimeRoot, '.transport-fixture-owner.json');
const expectedFunctions = [
  'readBrewingCatalogue', 'writeBrewingCatalogue', 'readBrewingScenario', 'writeBrewingScenario',
].sort();

function isoNow() {
  return new Date().toISOString();
}

function sha256(bytes) {
  return createHash('sha256').update(bytes).digest('hex');
}

async function hashFile(file) {
  const content = await readFile(file);
  return { path: path.relative(repoRoot, file).replaceAll('\\', '/'), bytes: content.length, sha256: sha256(content) };
}

async function writeJson(file, value) {
  await writeFile(file, `${JSON.stringify(value, null, 2)}\n`, 'utf8');
}

function quoteWindows(value) {
  return `"${String(value).replaceAll('"', '\\"')}"`;
}

async function checkPortFree(port) {
  const results = [];
  for (const host of ['127.0.0.1', '::1']) {
    const server = createTcpServer();
    const result = await new Promise(resolve => {
      const onError = error => resolve({ host, port, free: error?.code === 'EADDRNOTAVAIL' || error?.code === 'EAFNOSUPPORT', code: error?.code });
      server.once('error', onError);
      server.listen({ host, port, exclusive: true }, () => {
        server.close(() => resolve({ host, port, free: true }));
      });
    });
    results.push(result);
    if (!result.free) return results;
  }
  return results;
}

async function assertPortsFree(ports) {
  const checks = [];
  for (const port of ports) {
    const attempts = await checkPortFree(port);
    const free = attempts.every(item => item.free);
    checks.push({ port, free, attempts });
    assert(free, `Port ${port} déjà occupé; aucun processus existant ne sera arrêté.`);
  }
  return checks;
}

async function portIsListening(port) {
  for (const host of ['127.0.0.1', '::1']) {
    const open = await new Promise(resolve => {
      const socket = createTcpServer();
      socket.once('error', error => resolve(error?.code === 'EADDRINUSE'));
      socket.listen({ host, port, exclusive: true }, () => socket.close(() => resolve(false)));
    });
    if (open) return true;
  }
  return false;
}

async function assertPortsListening(ports) {
  const result = [];
  for (const port of ports) {
    const listening = await portIsListening(port);
    result.push({ port, listening });
    assert(listening, `Émulateur non à l'écoute sur le port de fixture ${port}.`);
  }
  return result;
}

function netstatListeners(ports) {
  const output = execFileSync('netstat.exe', ['-ano', '-p', 'tcp'], { encoding: 'utf8', windowsHide: true });
  const wanted = new Set(ports);
  const rows = [];
  for (const line of output.split(/\r?\n/)) {
    if (!/\bLISTENING\b/i.test(line)) continue;
    const match = line.match(/^\s*TCP\s+(\S+)\s+(\S+)\s+LISTENING\s+(\d+)\s*$/i);
    if (!match) continue;
    const portMatch = match[1].match(/:(\d+)$/);
    if (!portMatch) continue;
    const port = Number(portMatch[1]);
    if (wanted.has(port)) rows.push({ localAddress: match[1], port, pid: Number(match[3]) });
  }
  return rows;
}

function inspectListenerLineage(listenerPids, rootPid) {
  const uniquePids = [...new Set(listenerPids)].filter(Number.isInteger);
  if (!uniquePids.length) return [];
  const ps = [
    '$ErrorActionPreference = "Stop"',
    `$rootPid = ${Number(rootPid)}`,
    `$targets = @(${uniquePids.join(',')})`,
    '$result = foreach ($startPid in $targets) {',
    '  $currentPid = [int]$startPid',
    '  $chain = @()',
    '  $reachedRoot = $false',
    '  for ($i = 0; $i -lt 16 -and $currentPid -gt 0; $i++) {',
    '    $process = Get-CimInstance Win32_Process -Filter "ProcessId = $currentPid"',
    '    if (-not $process) { break }',
    '    $chain += [pscustomobject]@{ pid = [int]$process.ProcessId; parentPid = [int]$process.ParentProcessId; name = [string]$process.Name; commandLine = [string]$process.CommandLine }',
    '    if ([int]$process.ProcessId -eq $rootPid) { $reachedRoot = $true; break }',
    '    $currentPid = [int]$process.ParentProcessId',
    '  }',
    '  [pscustomobject]@{ listenerPid = [int]$startPid; reachedRoot = $reachedRoot; chain = $chain }',
    '}',
    '$result | ConvertTo-Json -Depth 8 -Compress',
  ].join('\n');
  const output = execFileSync('powershell.exe', ['-NoProfile', '-NonInteractive', '-Command', ps], {
    encoding: 'utf8', windowsHide: true, timeout: 10000,
  }).trim();
  if (!output) return [];
  const parsed = JSON.parse(output);
  const rows = Array.isArray(parsed) ? parsed : [parsed];
  return rows.map(row => ({
    listenerPid: row.listenerPid,
    reachedCliPid: row.reachedRoot === true,
    chain: (Array.isArray(row.chain) ? row.chain : [row.chain]).filter(Boolean).map(item => {
      const command = String(item.commandLine ?? '').toLowerCase();
      let role = 'emulator-child';
      if (command.includes('emulators:exec')) role = 'firebase-emulators-exec';
      else if (command.includes('cloud-firestore-emulator')) role = 'firestore-emulator-java';
      else if (command.includes('.runtime\\functions') || command.includes('.runtime/functions')) role = 'functions-runtime';
      return {
        pid: item.pid,
        parentPid: item.parentPid,
        image: item.name,
        role,
        commandReferencesFixtureFunctions: command.includes('.runtime\\functions') || command.includes('.runtime/functions'),
      };
    }),
  }));
}

async function javaVersion() {
  const { javaExe } = transportPaths();
  await access(javaExe);
  const result = spawnSync(javaExe, ['--version'], { encoding: 'utf8', windowsHide: true, timeout: 5000 });
  assert(!result.error && result.status === 0, 'Le JRE QA portable ne démarre pas.');
  const versionOutput = `${result.stdout ?? ''}${result.stderr ?? ''}`.trim();
  const major = Number(versionOutput.match(/(?:openjdk|java)\s+(\d+)/i)?.[1] ?? 0);
  assert(major >= 21, `Le JRE QA doit être Java 21 ou plus; version trouvée ${major || 'illisible'}.`);
  return { major, firstLine: versionOutput.split(/\r?\n/)[0] };
}

async function verifyCachedFirestoreJar() {
  const { firestoreJar } = transportPaths();
  const info = await stat(firestoreJar);
  assert(info.size === firestoreJarBytes, 'Le JAR Firestore local ne correspond pas à la taille de la version requise.');
  const digest = sha256(await readFile(firestoreJar));
  assert(digest === firestoreJarSha256, 'Le JAR Firestore local ne correspond pas à la somme SHA-256 attendue.');
  return { path: path.relative(repoRoot, firestoreJar).replaceAll('\\', '/'), bytes: info.size, sha256: digest, version: '1.22.0' };
}

async function packageVersion(file) {
  return JSON.parse(await readFile(file, 'utf8')).version;
}

function mapCompiledSources(inputs) {
  const actual = [
    'functions/src/brewerCatalogueApi.ts',
    'functions/src/brewerScenarioApi.ts',
    'functions/src/brewSession.ts',
    'functions/src/brewerCatalogueStore.ts',
    'functions/src/brewerCatalogueCore.ts',
    'functions/src/brewerCatalogueSchema.ts',
    'functions/src/brewerScenarioStore.ts',
    'functions/src/brewerTools.d.ts',
    'src/domain/brewerTools.ts',
    'src/domain/brewingScenarioDossier.ts',
    'src/domain/brewingScenarioArchive.ts',
    'src/domain/brewingScenario.ts',
    'src/domain/hopDecision/adviceContentReference.ts',
  ];
  const fromMetafile = [];
  for (const input of inputs) {
    const normalized = input.replaceAll('\\', '/');
    if (normalized.startsWith('functions/lib/')) {
      const basename = path.posix.basename(normalized, '.js');
      const candidate = basename === 'brewerTools' ? 'src/domain/brewerTools.ts' : `functions/src/${basename}.ts`;
      if (!actual.includes(candidate)) actual.push(candidate);
      fromMetafile.push(normalized);
    }
  }
  return { sourceFiles: actual, compiledInputs: [...new Set(fromMetafile)].sort() };
}

async function safeCleanupRuntime(runId) {
  const expected = path.resolve(fixtureRoot, '.runtime');
  const resolved = path.resolve(runtimeRoot);
  assert(resolved === expected && resolved.startsWith(`${path.resolve(fixtureRoot)}${path.sep}`),
    'Refus de nettoyer un chemin runtime hors du dossier de fixture attribué.');
  let marker;
  try {
    marker = JSON.parse(await readFile(runtimeMarker, 'utf8'));
  } catch {
    return false;
  }
  assert(marker.owner === 'check-hop-v55-transport' && marker.runId === runId,
    'Le runtime ne porte pas le marqueur de cette exécution; il est conservé.');
  const link = path.join(runtimeFunctions, 'node_modules');
  try {
    const entry = await lstat(link);
    if (entry.isSymbolicLink()) {
      const linked = await realpath(link);
      const target = await realpath(actualFunctionsNodeModules);
      assert(linked === target, 'Le lien node_modules du runtime pointe vers une autre cible; il est conservé.');
      await unlink(link);
    }
  } catch (error) {
    if (error?.code !== 'ENOENT') throw error;
  }
  const rootStat = await lstat(runtimeRoot);
  assert(!rootStat.isSymbolicLink() && rootStat.isDirectory(), 'Le runtime à nettoyer doit être un dossier normal dans la fixture.');
  await rm(runtimeRoot, { recursive: true, force: false });
  return true;
}

async function prepareRuntime(runId) {
  try {
    await lstat(runtimeRoot);
    throw new Error('Le dossier .runtime existe déjà; vérifier sa session/PID avant une nouvelle exécution.');
  } catch (error) {
    if (error?.code !== 'ENOENT') throw error;
  }
  await mkdir(runtimeFunctions, { recursive: true });
  await writeJson(runtimeMarker, { owner: 'check-hop-v55-transport', runId, createdAt: isoNow() });
  const functionsPackage = JSON.parse(await readFile(path.join(repoRoot, 'functions/package.json'), 'utf8'));
  await writeJson(path.join(runtimeFunctions, 'package.json'), {
    name: 'hop-v55-http-transport-fixture',
    private: true,
    type: 'module',
    main: 'index.js',
    engines: { node: '22' },
    dependencies: {
      'firebase-admin': functionsPackage.dependencies['firebase-admin'],
      'firebase-functions': functionsPackage.dependencies['firebase-functions'],
    },
  });
  await symlink(actualFunctionsNodeModules, path.join(runtimeFunctions, 'node_modules'), 'junction');
}

async function makeManifest(runId, java, firestoreJarInfo, build, actualExports, ports) {
  const graph = Object.keys(build.metafile.inputs);
  const mapping = mapCompiledSources(graph);
  const sourcePaths = [
    scriptPath,
    path.join(fixtureRoot, 'firebase.json'),
    path.join(fixtureRoot, 'firestore.rules'),
    path.join(fixtureRoot, 'functions-entry.ts'),
    path.join(fixtureRoot, 'firebaseClient.ts'),
    path.join(fixtureRoot, 'vite.config.mjs'),
    path.join(fixtureRoot, 'main.ts'),
    path.join(repoRoot, 'src/services/brewingCatalogue.ts'),
    path.join(repoRoot, 'src/services/brewingScenarios.ts'),
    path.join(repoRoot, 'src/services/firebase.ts'),
    ...mapping.sourceFiles.map(file => path.join(repoRoot, file)),
  ];
  const unique = [...new Set(sourcePaths.map(file => path.resolve(file)))].sort();
  const sourceHashes = [];
  for (const file of unique) sourceHashes.push(await hashFile(file));
  const compiledHashes = [];
  for (const input of [...new Set(graph.map(item => path.resolve(repoRoot, item)))].sort()) {
    if (!input.startsWith(`${repoRoot}${path.sep}`)) continue;
    compiledHashes.push(await hashFile(input));
  }
  const runtimeEntry = path.join(runtimeFunctions, 'index.js');
  const nodeModules = path.join(actualFunctionsNodeModules);
  return {
    schemaVersion: 1,
    runId,
    createdAt: isoNow(),
    projectId,
    ports: { auth: authPort, firestore: firestorePort, firestoreWebsocket: firestoreWebsocketPort, functions: functionsPort, hub: hubPort, logging: loggingPort, vite: vitePort },
    bindHosts: { auth: '127.0.0.1', firestore: '127.0.0.1', functions: '127.0.0.1', vite: '127.0.0.1', hubDefault: 'localhost' },
    preflight: { java, firestoreJar: firestoreJarInfo, freePorts: ports },
    runtimeNode: {
      packageEngine: '22',
      hostVersion: process.version,
      hostExecutable: path.relative(repoRoot, process.execPath).replaceAll('\\', '/'),
      emulatorWillUseHostVersionWhenNode22IsAbsent: !process.version.startsWith('v22.'),
    },
    firebase: {
      cliVersion: await packageVersion(path.join(repoRoot, 'node_modules/firebase-tools/package.json')),
      functionsRuntime: 'nodejs22',
      functionsSdkVersion: await packageVersion(path.join(nodeModules, 'firebase-functions/package.json')),
      adminSdkVersion: await packageVersion(path.join(nodeModules, 'firebase-admin/package.json')),
      region: 'europe-west6',
      configPath: path.relative(repoRoot, path.join(fixtureRoot, 'firebase.json')).replaceAll('\\', '/'),
      source: path.relative(repoRoot, runtimeFunctions).replaceAll('\\', '/'),
      appName: 'hop-v55-http-fixture',
      fixtureClient: 'firebaseClient.ts',
      qaAlias: {
        plugin: 'hop-v55-transport-fixture-firebase-client',
        importPath: './firebase',
        onlyFrom: ['src/services/brewingCatalogue.ts', 'src/services/brewingScenarios.ts'],
        replacement: path.relative(repoRoot, path.join(fixtureRoot, 'firebaseClient.ts')).replaceAll('\\', '/'),
        productionDefaultModuleLoaded: false,
      },
    },
    functionExports: actualExports,
    excluded: [
      'functions/lib/index.js', 'functions/lib/brewerJobs.js', 'functions/lib/ai.js',
      'askBrewer', 'Gemini worker', 'production project configuration', '.env', '.firebaserc',
    ],
    sourceHashes,
    compiledModuleGraph: compiledHashes,
    compiledFunctionsEntry: await hashFile(runtimeEntry),
    esbuildInputs: mapping.compiledInputs,
    authFixturePolicy: {
      accountCount: 4,
      seedingMechanism: 'Firebase Admin SDK connected to Auth Emulator',
      allowlistedRoles: ['ownerA', 'ownerB', 'unverified'],
      nonAllowlistedRole: 'notAllowlisted',
      secretsPersisted: false,
      allowlistedEmailValuesRecorded: false,
      onlyAuthEmulator: true,
    },
    networkPolicy: {
      browserAllowedHosts: ['127.0.0.1'],
      browserAllowedPorts: [authPort, firestorePort, functionsPort, vitePort],
      externalRequestsBlockedAndCounted: true,
    },
    firebaseDefaultEntryImported: false,
    actualProductionClientServices: ['BrewingCatalogue.lookup/write', 'BrewingScenarios.read/write'],
  };
}

async function createAuthFixture(auth, role, email, verified) {
  const password = `${randomBytes(24).toString('base64url')}Q7!`;
  const user = await auth.createUser({ email, password, emailVerified: verified, disabled: false });
  assert(typeof user.uid === 'string' && user.emailVerified === verified,
    `Auth Emulator n'a pas créé le statut attendu pour ${role}.`);
  return { email, password };
}

async function createAuthFixtures(runId, emails) {
  assert(process.env.FIREBASE_AUTH_EMULATOR_HOST === `127.0.0.1:${authPort}`,
    'Le processus de fixture Auth ne pointe pas vers Auth Emulator.');
  const localRequire = createRequire(path.join(actualFunctionsNodeModules, 'package.json'));
  const { initializeApp } = localRequire('firebase-admin/app');
  const { getAuth } = localRequire('firebase-admin/auth');
  const adminApp = initializeApp({ projectId }, `hop-v55-http-admin-${runId}`);
  try {
    const auth = getAuth(adminApp);
    return {
      ownerA: await createAuthFixture(auth, 'ownerA', emails.ownerA, true),
      ownerB: await createAuthFixture(auth, 'ownerB', emails.ownerB, true),
      unverified: await createAuthFixture(auth, 'unverified', emails.unverified, false),
      notAllowlisted: await createAuthFixture(auth, 'notAllowlisted', emails.notAllowlisted, true),
    };
  } finally {
    await adminApp.delete();
  }
}

async function runInside(runId) {
  const evidenceDir = path.join(evidenceRoot, runId);
  const session = JSON.parse(await readFile(path.join(evidenceDir, 'emulator-session.json'), 'utf8'));
  assert(session.projectId === projectId && session.cwd === fixtureRoot && session.cliPid > 0,
    'Session Firebase Emulator ou workdir inattendu.');
  assert(path.resolve(process.cwd()) === path.resolve(fixtureRoot), 'Le callback Firebase Emulator a un workdir inattendu.');
  const listenerRows = netstatListeners([...servicePorts, firestoreWebsocketPort, hubPort, loggingPort]);
  const listenerPids = listenerRows.map(row => row.pid);
  const lineage = inspectListenerLineage(listenerPids, session.cliPid);
  assert(listenerRows.some(row => row.port === authPort) && listenerRows.some(row => row.port === firestorePort) &&
    listenerRows.some(row => row.port === functionsPort) && listenerRows.some(row => row.port === firestoreWebsocketPort),
    'Les ports de service et le websocket Firestore ne sont pas tous occupés par les émulateurs.');
  assert(listenerRows.every(row => /^(127(?:\.\d+){3}|localhost|\[::1\]|::1):/.test(row.localAddress)),
    'Un listener de cette session n’est pas lié à une adresse loopback.');
  assert(lineage.length === new Set(listenerPids).size && lineage.every(row => row.reachedCliPid),
    'Un PID écoutant sur un port fixture ne descend pas du processus Firebase Emulator lancé pour cette preuve.');

  const emails = {
    ownerA: `hop-v55-${runId}-owner-a@example.test`,
    ownerB: `hop-v55-${runId}-owner-b@example.test`,
    unverified: `hop-v55-${runId}-unverified@example.test`,
    notAllowlisted: `hop-v55-${runId}-outside@example.test`,
  };
  const accounts = await createAuthFixtures(runId, emails);

  const vite = await createViteServer({
    configFile: path.join(fixtureRoot, 'vite.config.mjs'),
    root: fixtureRoot,
    logLevel: 'error',
    clearScreen: false,
    server: { host: '127.0.0.1', port: vitePort, strictPort: true },
  });
  let browser;
  let blockedRequests = [];
  let pageErrors = 0;
  let proof;
  let responsePaths = [];
  try {
    await vite.listen();
    await assertPortsListening([...servicePorts, vitePort]);
    browser = await puppeteer.launch({
      executablePath: transportPaths().chromeExe,
      headless: true,
      args: [
        '--no-sandbox', '--disable-dev-shm-usage', '--disable-background-networking',
        '--disable-component-update', '--disable-sync', '--metrics-recording-only',
        '--no-first-run', '--no-default-browser-check',
        `--user-data-dir=${path.join(runtimeRoot, 'chrome-profile')}`,
      ],
      env: {
        PATH: process.env.PATH,
        SystemRoot: process.env.SystemRoot,
        TEMP: process.env.TEMP,
        TMP: process.env.TMP,
      },
    });
    const page = await browser.newPage();
    await page.setRequestInterception(true);
    page.on('request', request => {
      let url;
      try { url = new URL(request.url()); } catch { url = null; }
      const port = url ? Number(url.port || (url.protocol === 'https:' ? 443 : 80)) : -1;
      const allowed = url && ['http:', 'ws:'].includes(url.protocol) && url.hostname === '127.0.0.1' &&
        [authPort, firestorePort, functionsPort, vitePort].includes(port);
      if (allowed) {
        if (port === functionsPort) responsePaths.push(url.pathname);
        request.continue().catch(() => {});
      } else {
        blockedRequests.push({ protocol: url?.protocol ?? 'unknown', host: url?.hostname ?? 'unknown' });
        request.abort('blockedbyclient').catch(() => {});
      }
    });
    page.on('pageerror', () => { pageErrors += 1; });
    await page.goto(`http://127.0.0.1:${vitePort}/`, { waitUntil: 'domcontentloaded', timeout: 30000 });
    await page.waitForFunction('typeof window.runHopV55TransportProof === "function"', { timeout: 30000 });
    proof = await page.evaluate(input => window.runHopV55TransportProof(input), { runId, accounts });
    await new Promise(resolve => setTimeout(resolve, 150));
    const moduleIds = [...vite.moduleGraph.idToModuleMap.keys()].map(item => item.replaceAll('\\', '/'));
    const productionFirebaseLoaded = moduleIds.some(item => item.endsWith('/src/services/firebase.ts'));
    const calledEndpoints = expectedFunctions.filter(name => responsePaths.some(route => route.endsWith(`/${name}`)));
    proof = {
      ...proof,
      browser: { chrome: 'local Chrome', pageErrors, blockedExternalRequestCount: blockedRequests.length },
      network: { externalRequestsBlocked: blockedRequests, functionsRoutesObserved: [...new Set(calledEndpoints)].sort() },
      sourceGraph: { productionDefaultFirebaseModuleLoaded: productionFirebaseLoaded },
      emulatorProcess: {
        callbackPid: process.pid,
        callbackParentPid: process.ppid,
        callbackCwd: path.resolve(process.cwd()),
        cliPid: session.cliPid,
        listenerRows,
        listenerLineage: lineage,
      },
    };
    assert(proof.ok === true, `Parcours client en échec à ${proof.failedStep ?? 'inconnu'} (${proof.errorCode ?? 'sans code'}).`);
    assert(blockedRequests.length === 0, 'Une requête navigateur hors loopback a été bloquée.');
    assert(pageErrors === 0, 'Une exception navigateur est survenue pendant le parcours.');
    assert(productionFirebaseLoaded === false, 'Le module Firebase par défaut de production a été chargé par la fixture.');
    assert(calledEndpoints.length === expectedFunctions.length, 'Au moins un des quatre endpoints callable n’a pas été appelé depuis le navigateur.');
    await writeJson(path.join(evidenceDir, 'transport-proof.json'), proof);
  } catch (error) {
    const failure = {
      ok: false,
      failedStep: proof?.failedStep ?? 'browser-harness',
      error: error instanceof Error ? error.message : 'Erreur de fixture non détaillée.',
      blockedExternalRequestCount: blockedRequests.length,
      blockedExternalRequests: blockedRequests,
      pageErrors,
      functionsRoutesObserved: [...new Set(responsePaths)].map(route => route.split('?')[0]),
      emulatorProcess: { callbackPid: process.pid, callbackParentPid: process.ppid, callbackCwd: path.resolve(process.cwd()), cliPid: session.cliPid, listenerRows, listenerLineage: lineage },
      credentialsOrTokensLogged: false,
    };
    await writeJson(path.join(evidenceDir, 'transport-proof.json'), { ...proof, ...failure });
    throw error;
  } finally {
    if (browser) await browser.close();
    await vite.close();
  }
}

function minimalEmulatorEnv(runId) {
  const { javaBin, javaHome, emulatorCache, chromeExe } = transportPaths();
  const fixtureHome = path.join(runtimeRoot, 'firebase-home');
  const appData = path.join(fixtureHome, 'AppData/Roaming');
  const localAppData = path.join(fixtureHome, 'AppData/Local');
  const temp = path.join(runtimeRoot, 'temp');
  const ownerA = `hop-v55-${runId}-owner-a@example.test`;
  const ownerB = `hop-v55-${runId}-owner-b@example.test`;
  const unverified = `hop-v55-${runId}-unverified@example.test`;
  const hostPath = process.env.PATH ?? '';
  const values = {
    SystemRoot: process.env.SystemRoot,
    WINDIR: process.env.WINDIR,
    PATHEXT: process.env.PATHEXT,
    COMSPEC: process.env.COMSPEC,
    PROCESSOR_ARCHITECTURE: process.env.PROCESSOR_ARCHITECTURE,
    TEMP: temp,
    TMP: temp,
    USERPROFILE: fixtureHome,
    APPDATA: appData,
    LOCALAPPDATA: localAppData,
    PATH: [javaBin, path.dirname(process.execPath), path.join(repoRoot, 'node_modules/.bin'), hostPath].filter(Boolean).join(path.delimiter),
    JAVA_HOME: javaHome,
    FIREBASE_EMULATORS_PATH: emulatorCache,
    CHROME_PATH: chromeExe,
    FIREBASE_AUTH_EMULATOR_HOST: `127.0.0.1:${authPort}`,
    FIRESTORE_EMULATOR_HOST: `127.0.0.1:${firestorePort}`,
    FIREBASE_CLI_DISABLE_TELEMETRY: '1',
    NO_UPDATE_NOTIFIER: '1',
    CI: '1',
    GCLOUD_PROJECT: projectId,
    GOOGLE_CLOUD_PROJECT: projectId,
    AUTHORIZED_ACCOUNTS: [ownerA, ownerB, unverified].join(','),
    TZ: 'UTC',
  };
  return Object.fromEntries(Object.entries(values).filter(([, value]) => typeof value === 'string' && value.length > 0));
}

async function runOuter() {
  assert(projectId.startsWith('demo-'), 'Refus d’utiliser un project ID qui ne commence pas par demo-.');
  const runId = `q${randomBytes(6).toString('hex')}`;
  const evidenceDir = path.join(evidenceRoot, runId);
  await mkdir(evidenceRoot, { recursive: true });
  await mkdir(evidenceDir, { recursive: false });
  let runtimePrepared = false;
  let emulatorChild;
  let emulatorExited = false;
  let portsReleased = false;
  let resultCode = 1;
  const logPath = path.join(evidenceDir, 'emulator-run.log');
  let logStream;
  try {
    const java = await javaVersion();
    const jar = await verifyCachedFirestoreJar();
    await access(transportPaths().chromeExe);
    await access(firebaseCli);
    await access(path.join(repoRoot, 'node_modules/esbuild/package.json'));
    await access(path.join(repoRoot, 'node_modules/vite/package.json'));
    await access(path.join(actualFunctionsNodeModules, 'firebase-functions/package.json'));
    await access(path.join(actualFunctionsNodeModules, 'firebase-admin/package.json'));
    const freePorts = await assertPortsFree(allPorts);
    await prepareRuntime(runId);
    runtimePrepared = true;
    await mkdir(path.join(runtimeRoot, 'temp'), { recursive: true });
    await mkdir(path.join(runtimeRoot, 'firebase-home/AppData/Roaming'), { recursive: true });
    await mkdir(path.join(runtimeRoot, 'firebase-home/AppData/Local'), { recursive: true });

    const build = await import('esbuild').then(({ build }) => build({
      absWorkingDir: repoRoot,
      entryPoints: [path.join(fixtureRoot, 'functions-entry.ts')],
      outfile: path.join(runtimeFunctions, 'index.js'),
      bundle: true,
      packages: 'external',
      platform: 'node',
      target: 'node22',
      format: 'esm',
      sourcemap: false,
      metafile: true,
      logLevel: 'silent',
    }));

    const loaded = await import(`${pathToFileURL(path.join(runtimeFunctions, 'index.js')).href}?run=${runId}`);
    const actualExports = Object.keys(loaded).sort();
    assert.deepEqual(actualExports, expectedFunctions, 'L’entrée Functions de fixture doit exposer exactement les quatre callables demandés.');
    const endpointMetadata = {};
    for (const name of expectedFunctions) {
      const endpoint = loaded[name]?.__endpoint ?? loaded[name]?.__trigger ?? {};
      const regions = Array.isArray(endpoint.region) ? endpoint.region : [endpoint.region ?? endpoint.regions].flat().filter(Boolean);
      assert(regions.includes('europe-west6'), `${name} n’expose pas la région europe-west6 dans son wrapper compilé.`);
      endpointMetadata[name] = { platform: endpoint.platform ?? 'gcfv2', region: regions };
    }

    const manifest = await makeManifest(runId, java, jar, build, actualExports, freePorts);
    manifest.functionEndpointMetadata = endpointMetadata;
    await writeJson(path.join(evidenceDir, 'pretest-manifest.json'), manifest);
    await writeJson(path.join(evidenceDir, 'preflight.json'), {
      ok: true, runId, createdAt: isoNow(), projectId,
      Java: java, cachedFirestoreJar: jar,
      Node: { hostVersion: process.version, packageEngine: '22', emulatorUsesHostVersion: !process.version.startsWith('v22.') },
      javaEnvironmentInjectedInEmulatorChildOnly: true,
      freePorts,
      functionExports: actualExports,
      functionEndpointMetadata: endpointMetadata,
      runtimeDirectory: path.relative(repoRoot, runtimeRoot).replaceAll('\\', '/'),
      runtimePrepared,
    });

    const config = JSON.parse(await readFile(path.join(fixtureRoot, 'firebase.json'), 'utf8'));
    assert(config.functions?.source === '.runtime/functions' && config.emulators?.auth?.port === authPort &&
      config.emulators?.firestore?.port === firestorePort && config.emulators?.firestore?.websocketPort === firestoreWebsocketPort &&
      config.emulators?.functions?.port === functionsPort,
      'La config Firebase de la fixture ne correspond pas aux ports/périmètre vérifiés.');
    assert(config.emulators.auth.host === '127.0.0.1' && config.emulators.firestore.host === '127.0.0.1' &&
      config.emulators.functions.host === '127.0.0.1' && config.emulators.ui?.enabled === false,
      'Une adresse de service est hors loopback ou l’Emulator UI est activée.');

    const callback = `${quoteWindows(process.execPath)} ${quoteWindows(scriptPath)} --inside-emulators ${runId}`;
    logStream = (await import('node:fs')).createWriteStream(logPath, { flags: 'wx' });
    emulatorChild = spawn(process.execPath, [
      firebaseCli, 'emulators:exec', '--only', 'auth,firestore,functions',
      '--project', projectId, '--config', 'firebase.json', callback,
    ], {
      cwd: fixtureRoot,
      env: minimalEmulatorEnv(runId),
      stdio: ['ignore', 'pipe', 'pipe'],
      windowsHide: true,
    });
    const session = {
      projectId,
      cliPid: emulatorChild.pid,
      cwd: path.resolve(fixtureRoot),
      config: path.join(fixtureRoot, 'firebase.json'),
      callbackScript: scriptPath,
      callbackCommand: 'node scripts/check-hop-v55-transport.mjs --inside-emulators <runId>',
      startedAt: isoNow(),
      javaHome: transportPaths().javaHome,
      authPort, firestorePort, firestoreWebsocketPort, functionsPort, hubPort, loggingPort,
      noCredentialFilesRead: true,
    };
    await writeJson(path.join(evidenceDir, 'emulator-session.json'), session);
    const onChunk = chunk => logStream.write(chunk);
    emulatorChild.stdout.on('data', onChunk);
    emulatorChild.stderr.on('data', onChunk);
    const exit = await new Promise((resolve, reject) => {
      emulatorChild.once('error', reject);
      emulatorChild.once('close', (code, signal) => resolve({ code, signal }));
    });
    emulatorExited = true;
    resultCode = exit.code ?? 1;
    await new Promise(resolve => logStream.end(resolve));
    logStream = null;

    const listenersAfter = netstatListeners(allPorts);
    const freeAfter = await assertPortsFree(allPorts).then(() => true).catch(() => false);
    portsReleased = freeAfter && listenersAfter.length === 0;
    const closed = {
      projectId,
      cliPid: emulatorChild.pid,
      cliExitCode: exit.code,
      cliSignal: exit.signal,
      cliProcessExited: true,
      cliWorkdir: path.resolve(fixtureRoot),
      cliWorkdirVerified: path.resolve(fixtureRoot) === path.resolve(session.cwd),
      stoppedBy: 'firebase emulators:exec orderly shutdown',
      listenersAfter,
      allFixturePortsReleased: portsReleased,
      closedAt: isoNow(),
    };
    await writeJson(path.join(evidenceDir, 'emulators-closed.json'), closed);

    let proof = null;
    try { proof = JSON.parse(await readFile(path.join(evidenceDir, 'transport-proof.json'), 'utf8')); } catch { /* reported below */ }
    assert(exit.code === 0,
      `Firebase emulators:exec s'est terminé avec le code ${exit.code ?? exit.signal ?? 'inconnu'}; callback ${proof?.failedStep ?? 'absent'}: ${proof?.failedAssertion ?? proof?.errorCode ?? 'aucun détail'}.`);
    assert(proof?.ok === true, 'Le callback transport n’a pas produit une preuve positive.');
    assert(portsReleased, 'Un port de cette session reste occupé après emulators:exec; aucun PID extérieur ne sera arrêté.');
    await safeCleanupRuntime(runId);
    runtimePrepared = false;
    resultCode = 0;
    console.log(JSON.stringify({
      ok: true,
      runId,
      projectId,
      endpoints: expectedFunctions,
      javaMajor: java.major,
      ports: { auth: authPort, firestore: firestorePort, firestoreWebsocket: firestoreWebsocketPort, functions: functionsPort },
      stepsPassed: proof.steps.length,
      snapshotBytes: proof.snapshotBytes,
      snapshotSha256: proof.snapshotSha256,
      emulatorCliPid: emulatorChild.pid,
      workdir: path.relative(repoRoot, fixtureRoot).replaceAll('\\', '/'),
      emulatorsClosed: portsReleased,
      evidence: path.relative(repoRoot, evidenceDir).replaceAll('\\', '/'),
    }, null, 2));
  } catch (error) {
    if (logStream) {
      await new Promise(resolve => logStream.end(resolve));
      logStream = null;
    }
    const listeners = netstatListeners(allPorts);
    const state = {
      ok: false,
      runId,
      projectId,
      error: error instanceof Error ? error.message : 'Erreur de runner non détaillée.',
      javaExe: resolvedTransportPaths?.javaExe ?? transportPathOptions.java ?? process.env.HOP_V55_JAVA ?? process.env.JAVA_HOME ?? 'unresolved',
      runtimePrepared,
      emulatorCliPid: emulatorChild?.pid ?? null,
      emulatorExited,
      listeners,
      portsReleased,
      credentialsOrTokensLogged: false,
      evidence: path.relative(repoRoot, evidenceDir).replaceAll('\\', '/'),
    };
    await writeJson(path.join(evidenceDir, 'runner-failure.json'), state).catch(() => {});
    console.error(JSON.stringify(state, null, 2));
    if (!emulatorChild || emulatorExited) {
      const allFree = await assertPortsFree(allPorts).then(() => true).catch(() => false);
      if (allFree && runtimePrepared) {
        await safeCleanupRuntime(runId).catch(cleanupError => {
          console.error(`Runtime de fixture conservé: ${cleanupError instanceof Error ? cleanupError.message : 'vérification impossible'}`);
        });
      }
    }
    resultCode = 1;
  }
  process.exitCode = resultCode;
}

const mode = process.argv[2];
if (mode === '--inside-emulators') {
  const runId = process.argv[3];
  assert(/^q[0-9a-f]{12}$/.test(runId ?? ''), 'Run ID fixture invalide.');
  await runInside(runId);
} else {
  await runOuter();
}
