import * as fs from 'fs';
import * as path from 'path';
import { describe, expect, it } from '@jest/globals';

const buildGradleContents = fs.readFileSync(
  path.join(__dirname, '..', 'build.gradle'),
  'utf8'
);

describe('android/build.gradle — paridade bare RN (FR-011)', () => {
  it('reads GETNET_POSDIGITAL_AAR from gradle.properties', () => {
    expect(buildGradleContents).toMatch(/GETNET_POSDIGITAL_AAR/);
  });

  it('resolves the .aar via flatDir when the property is set', () => {
    expect(buildGradleContents).toMatch(/flatDir/);
  });

  it('fails with a friendly message pointing to the Getnet developer portal when the resolved path does not exist', () => {
    expect(buildGradleContents).toMatch(/Portal do Desenvolvedor Getnet/);
    expect(buildGradleContents).toMatch(/GradleException/);
  });

  it('does not enforce GETNET_POSDIGITAL_AAR unconditionally (Expo consumers resolve the .aar via the config plugin instead)', () => {
    expect(buildGradleContents).toMatch(
      /if\s*\(\s*getnetPosDigitalAarPath\s*\)/
    );
  });
});
