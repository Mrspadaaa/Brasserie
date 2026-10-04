import { statSync } from 'node:fs';
import os from 'node:os';
import path from 'node:path';

const cliPathOptions = new Map([
  ['--java', 'java'],
  ['--emulator-cache', 'emulatorCache'],
  ['--chrome', 'chrome'],
]);

export function parseTransportPathOptions(args) {
  const options = {};
  for (let i = 0; i < args.length; i++) {
    const argument = args[i];
    if (argument === '--inside-emulators') {
      i++;
      continue;
    }
    let matched = false;
    for (const [flag, key] of cliPathOptions) {
      if (argument === flag) {
        const value = args[++i];
        if (!value || value.startsWith('--')) throw new Error(`Valeur manquante pour ${flag}.`);
        options[key] = value;
        matched = true;
        break;
      }
      if (argument.startsWith(`${flag}=`)) {
        const value = argument.slice(flag.length + 1);
        if (!value) throw new Error(`Valeur manquante pour ${flag}.`);
        options[key] = value;
        matched = true;
        break;
      }
    }
    if (!matched && argument.startsWith('--') && argument !== '--') {
      throw new Error(`Option inconnue pour le harnais transport : ${argument}.`);
    }
  }
  return options;
}

function configuredValue(...values) {
  return values.find(value => typeof value === 'string' && value.trim().length > 0)?.trim();
}

function isFile(file) {
  try { return statSync(file).isFile(); } catch { return false; }
}

function findOnPath(command, env, platform) {
  const separator = platform === 'win32' ? ';' : path.delimiter;
  const pathEntries = (env.PATH ?? '').split(separator).filter(Boolean);
  const extensionSeparator = platform === 'win32' ? ';' : path.delimiter;
  const extensions = platform === 'win32'
    ? (env.PATHEXT ?? '.COM;.EXE;.BAT;.CMD').split(extensionSeparator).filter(Boolean)
    : [''];
  const suffixes = path.extname(command) ? [''] : extensions;
  for (const directory of pathEntries) {
    for (const suffix of suffixes) {
      const candidate = path.resolve(directory, `${command}${suffix}`);
      if (isFile(candidate)) return candidate;
    }
  }
  return undefined;
}

function resolveExecutable(value, label, env, platform) {
  const candidate = path.resolve(value);
  if (isFile(candidate)) return candidate;
  if (!value.includes('/') && !value.includes('\\')) {
    const fromPath = findOnPath(value, env, platform);
    if (fromPath) return fromPath;
  }
  throw new Error(`${label} introuvable : ${value}. Configurez le chemin avec l’option dédiée ou son environnement.`);
}

function javaExecutableName(platform) {
  return platform === 'win32' ? 'java.exe' : 'java';
}

function chromeDefaults(env, homeDir, platform) {
  if (platform !== 'win32') return [];
  const root = path.parse(process.execPath).root;
  const programFiles = env.ProgramFiles || (root && path.join(root, 'Program Files'));
  const programFilesX86 = env['ProgramFiles(x86)'] || (root && path.join(root, 'Program Files (x86)'));
  const localAppData = env.LOCALAPPDATA || path.join(homeDir, 'AppData', 'Local');
  const suffix = path.join('Google', 'Chrome', 'Application', 'chrome.exe');
  return [
    programFiles && path.join(programFiles, suffix),
    programFilesX86 && path.join(programFilesX86, suffix),
    path.join(localAppData, suffix),
  ].filter(Boolean);
}

export function resolveTransportPaths({ options = {}, env = process.env, homeDir = os.homedir(), platform = process.platform } = {}) {
  const explicitJava = configuredValue(options.java, env.HOP_V55_JAVA);
  let javaExe;
  if (explicitJava) {
    javaExe = resolveExecutable(explicitJava, 'Java', env, platform);
  } else if (configuredValue(env.JAVA_HOME)) {
    const homeJava = path.join(path.resolve(env.JAVA_HOME), 'bin', javaExecutableName(platform));
    javaExe = isFile(homeJava) ? path.resolve(homeJava) : findOnPath(javaExecutableName(platform), env, platform);
    if (!javaExe) throw new Error(`Java introuvable dans JAVA_HOME (${env.JAVA_HOME}) ou PATH. Configurez --java ou HOP_V55_JAVA.`);
  } else {
    const fromPath = findOnPath(javaExecutableName(platform), env, platform);
    if (!fromPath) throw new Error('Java introuvable dans JAVA_HOME ou PATH. Configurez --java ou HOP_V55_JAVA.');
    javaExe = fromPath;
  }
  const javaBin = path.dirname(javaExe);
  const javaHome = path.dirname(javaBin);

  const emulatorCache = path.resolve(configuredValue(
    options.emulatorCache,
    env.HOP_V55_FIREBASE_EMULATOR_CACHE,
    env.FIREBASE_EMULATORS_PATH,
  ) ?? path.join(homeDir, '.cache', 'firebase', 'emulators'));
  const firestoreJar = path.join(emulatorCache, 'cloud-firestore-emulator-v1.22.0.jar');

  const explicitChrome = configuredValue(options.chrome, env.HOP_V55_CHROME, env.CHROME_PATH);
  let chromeExe;
  if (explicitChrome) {
    chromeExe = resolveExecutable(explicitChrome, 'Chrome', env, platform);
  } else {
    const defaults = chromeDefaults(env, homeDir, platform);
    chromeExe = defaults.find(isFile)
      ?? findOnPath(platform === 'win32' ? 'chrome.exe' : 'chrome', env, platform)
      ?? defaults[0];
    if (!chromeExe) throw new Error('Chrome introuvable. Configurez --chrome ou CHROME_PATH.');
    chromeExe = path.resolve(chromeExe);
  }

  return { javaExe, javaHome, javaBin, emulatorCache, firestoreJar, chromeExe };
}
