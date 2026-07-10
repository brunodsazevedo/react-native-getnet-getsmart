import { createRunOncePlugin } from '@expo/config-plugins';
import type { ConfigPlugin } from '@expo/config-plugins';
import pkg from '../../package.json';
import type { AarResolutionProps } from './withAarResolution';
import { withAarResolution } from './withAarResolution';
import type { GetnetManifestProps } from './withAndroidManifest';
import { withGetnetAndroidManifest } from './withAndroidManifest';
import { withForbiddenPermissionsGuard } from './withForbiddenPermissionsGuard';
import { withSigningV1V2 } from './withSigningV1V2';

export type GetnetGetsmartPluginProps = GetnetManifestProps &
  AarResolutionProps;

const withGetnetGetsmart: ConfigPlugin<GetnetGetsmartPluginProps> = (
  config,
  props = {}
) => {
  let nextConfig = withGetnetAndroidManifest(config, props);
  nextConfig = withAarResolution(nextConfig, props);
  nextConfig = withSigningV1V2(nextConfig);
  nextConfig = withForbiddenPermissionsGuard(nextConfig, undefined);
  return nextConfig;
};

export default createRunOncePlugin(withGetnetGetsmart, pkg.name, pkg.version);
