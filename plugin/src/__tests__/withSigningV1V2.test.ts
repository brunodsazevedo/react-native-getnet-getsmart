import { describe, expect, it } from '@jest/globals';
import { addSigningV1V2 } from '../withSigningV1V2';

describe('addSigningV1V2', () => {
  it('appends the V1+V2 signing snippet to build.gradle contents', () => {
    const result = addSigningV1V2('android {\n  defaultConfig {}\n}\n');

    expect(result).toContain('android.signingConfigs.all');
    expect(result).toContain('config.v1SigningEnabled = true');
    expect(result).toContain('config.v2SigningEnabled = true');
  });

  it('is idempotent — does not duplicate the snippet on a second call', () => {
    const once = addSigningV1V2('android {}\n');
    const twice = addSigningV1V2(once);

    expect(twice).toBe(once);
  });
});
