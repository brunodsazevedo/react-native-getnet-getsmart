import {
  afterEach,
  beforeEach,
  describe,
  expect,
  it,
  jest,
} from '@jest/globals';
import { Platform } from 'react-native';

describe('native entrypoint fail-fast guard', () => {
  const originalOS = Platform.OS;

  beforeEach(() => {
    jest.resetModules();
  });

  afterEach(() => {
    Object.defineProperty(Platform, 'OS', {
      value: originalOS,
      configurable: true,
    });
  });

  it('throws an explicit Android-only error before reaching the TurboModuleRegistry on non-Android platforms', () => {
    Object.defineProperty(Platform, 'OS', { value: 'ios', configurable: true });

    expect(() => require('../NativeGetnetGetsmart')).toThrow(/Android/);
  });
});
