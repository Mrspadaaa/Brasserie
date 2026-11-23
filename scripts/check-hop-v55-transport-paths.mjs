import assert from 'node:assert/strict';
import { mkdtemp, mkdir, rm, writeFile } from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import { parseTransportPathOptions, resolveTransportPaths } from './hop-v55-transport-paths.mjs';

const fixture = await mkdtemp(path.join(os.tmpdir(), 'hop-v55-transport-paths-'));
const executable = async file => {
  await mkdir(path.dirname(file), { recursive: true });
  await writeFile(file, 'fixture executable path only; never launched');
  return file;
};

try {
  const home = path.join(fixture, 'home');
  const javaFromHome = await executable(path.join(fixture, 'jdk-home', 'bin', 'java.exe'));
  const javaFromPath = await executable(path.join(fixture, 'path-jdk', 'bin', 'java.exe'));
  const explicitJava = await executable(path.join(fixture, 'explicit-jdk', 'bin', 'java.exe'));
  const explicitChrome = await executable(path.join(fixture, 'custom-chrome', 'chrome.exe'));
  const standardChrome = await executable(path.join(fixture, 'Program Files', 'Google', 'Chrome', 'Application', 'chrome.exe'));
  const envChrome = await executable(path.join(fixture, 'env-chrome', 'chrome.exe'));
  const envJava = await executable(path.join(fixture, 'env-jdk', 'bin', 'java.exe'));
  const cacheFromOption = path.join(fixture, 'option-cache');
  const cacheFromEnv = path.join(fixture, 'env-cache');
  const pathEnv = { PATH: path.dirname(javaFromPath), PATHEXT: '.EXE;.CMD' };

  const cliOptions = parseTransportPathOptions([
    '--java', explicitJava,
    `--emulator-cache=${cacheFromOption}`,
    '--chrome', explicitChrome,
    '--inside-emulators', 'q123456789abc',
  ]);
  assert.deepEqual(cliOptions, { java: explicitJava, emulatorCache: cacheFromOption, chrome: explicitChrome });
  const explicit = resolveTransportPaths({
    options: cliOptions,
    env: { ...pathEnv, JAVA_HOME: path.join(fixture, 'ignored-home') },
    homeDir: home,
    platform: 'win32',
  });
  assert.equal(explicit.javaExe, explicitJava);
  assert.equal(explicit.javaHome, path.join(fixture, 'explicit-jdk'));
  assert.equal(explicit.javaBin, path.dirname(explicitJava));
  assert.equal(explicit.emulatorCache, path.resolve(cacheFromOption));
  assert.equal(explicit.firestoreJar, path.join(cacheFromOption, 'cloud-firestore-emulator-v1.22.0.jar'));
  assert.equal(explicit.chromeExe, explicitChrome);

  const standard = resolveTransportPaths({
    env: { ...pathEnv, JAVA_HOME: path.join(fixture, 'jdk-home'), ProgramFiles: path.join(fixture, 'Program Files') },
    homeDir: home,
    platform: 'win32',
  });
  assert.equal(standard.javaExe, javaFromHome);
  assert.equal(standard.javaHome, path.join(fixture, 'jdk-home'));
  assert.equal(standard.chromeExe, standardChrome);
  assert.equal(standard.emulatorCache, path.join(home, '.cache', 'firebase', 'emulators'));

  const fromPath = resolveTransportPaths({ env: { ...pathEnv, ProgramFiles: path.join(fixture, 'Program Files') }, homeDir: home, platform: 'win32' });
  assert.equal(fromPath.javaExe, javaFromPath);
  assert.equal(fromPath.javaHome, path.join(fixture, 'path-jdk'));
  const staleJavaHome = resolveTransportPaths({
    env: { ...pathEnv, JAVA_HOME: path.join(fixture, 'missing-jdk'), ProgramFiles: path.join(fixture, 'Program Files') },
    homeDir: home,
    platform: 'win32',
  });
  assert.equal(staleJavaHome.javaExe, javaFromPath);

  const envOverride = resolveTransportPaths({
    env: {
      ...pathEnv,
      JAVA_HOME: path.join(fixture, 'jdk-home'),
      HOP_V55_JAVA: envJava,
      HOP_V55_FIREBASE_EMULATOR_CACHE: cacheFromEnv,
      FIREBASE_EMULATORS_PATH: path.join(fixture, 'ignored-firebase-cache'),
      CHROME_PATH: envChrome,
      ProgramFiles: path.join(fixture, 'Program Files'),
    },
    homeDir: home,
    platform: 'win32',
  });
  assert.equal(envOverride.javaExe, envJava);
  assert.equal(envOverride.emulatorCache, path.resolve(cacheFromEnv));
  assert.equal(envOverride.chromeExe, envChrome);
  assert.throws(() => parseTransportPathOptions(['--chrome']), /Valeur manquante/);

  console.log('Résolution des chemins transport : options, variables et valeurs par défaut vérifiées; aucun Java ni réseau lancé.');
} finally {
  await rm(fixture, { recursive: true, force: true });
}
