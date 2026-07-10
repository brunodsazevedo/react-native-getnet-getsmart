import { afterEach, describe, expect, it } from '@jest/globals';
import { Platform } from 'react-native';
import { assertAndroidPlatform } from '../utils/assertAndroidPlatform';

describe('assertAndroidPlatform', () => {
  const originalOS = Platform.OS;

  afterEach(() => {
    Object.defineProperty(Platform, 'OS', {
      value: originalOS,
      configurable: true,
    });
  });

  it('does not throw when running on Android', () => {
    Object.defineProperty(Platform, 'OS', {
      value: 'android',
      configurable: true,
    });

    expect(() => assertAndroidPlatform()).not.toThrow();
  });

  it.each(['ios', 'web', 'windows', 'macos'] as const)(
    'throws an explicit, immediate error on %s',
    (os) => {
      Object.defineProperty(Platform, 'OS', { value: os, configurable: true });

      expect(() => assertAndroidPlatform()).toThrow(/Android/);
    }
  );
});
