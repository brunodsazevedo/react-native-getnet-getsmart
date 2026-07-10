import * as fs from 'fs';
import * as os from 'os';
import * as path from 'path';
import { afterEach, describe, expect, it } from '@jest/globals';
import {
  AAR_FILE_NAME,
  addAarDependency,
  buildMissingAarMessage,
  copyAarIntoAndroidProject,
  resolveAarPath,
} from '../withAarResolution';

describe('resolveAarPath', () => {
  it('resolves a relative path against the project root', () => {
    const resolved = resolveAarPath(
      '/tmp/project',
      './getnet/libposdigital.aar'
    );

    expect(resolved).toBe('/tmp/project/getnet/libposdigital.aar');
  });

  it('keeps an absolute path untouched', () => {
    const resolved = resolveAarPath(
      '/tmp/project',
      '/opt/getnet/libposdigital.aar'
    );

    expect(resolved).toBe('/opt/getnet/libposdigital.aar');
  });
});

describe('buildMissingAarMessage', () => {
  it('mentions the Getnet developer portal and the configured prop', () => {
    const message = buildMissingAarMessage('./getnet/libposdigital.aar');

    expect(message).toMatch(/Portal do Desenvolvedor Getnet/);
    expect(message).toMatch(/posDigitalAarPath/);
    expect(message).toMatch(/getnet\/libposdigital\.aar/);
  });

  it('explains that no path was configured when absent', () => {
    const message = buildMissingAarMessage(undefined);

    expect(message).toMatch(/Nenhum "posDigitalAarPath" configurado/);
  });
});

describe('copyAarIntoAndroidProject', () => {
  const tmpDirs: string[] = [];

  afterEach(() => {
    for (const dir of tmpDirs.splice(0)) {
      fs.rmSync(dir, { recursive: true, force: true });
    }
  });

  it('copies the resolved .aar into <platformProjectRoot>/app/libs/', () => {
    const workDir = fs.mkdtempSync(path.join(os.tmpdir(), 'getnet-aar-test-'));
    tmpDirs.push(workDir);

    const sourceAar = path.join(workDir, 'source.aar');
    fs.writeFileSync(sourceAar, 'fake-aar-contents');
    const platformProjectRoot = path.join(workDir, 'android');

    copyAarIntoAndroidProject(platformProjectRoot, sourceAar);

    const copiedPath = path.join(
      platformProjectRoot,
      'app',
      'libs',
      AAR_FILE_NAME
    );
    expect(fs.existsSync(copiedPath)).toBe(true);
    expect(fs.readFileSync(copiedPath, 'utf8')).toBe('fake-aar-contents');
  });
});

describe('addAarDependency', () => {
  it('injects flatDir + files(...) resolution into build.gradle contents', () => {
    const result = addAarDependency('android {}\n');

    expect(result).toContain('flatDir { dirs "libs" }');
    expect(result).toContain(`implementation files("libs/${AAR_FILE_NAME}")`);
  });

  it('is idempotent — does not duplicate the snippet on a second call', () => {
    const once = addAarDependency('android {}\n');
    const twice = addAarDependency(once);

    expect(twice).toBe(once);
  });
});
