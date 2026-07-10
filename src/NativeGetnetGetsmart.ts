import { TurboModuleRegistry, type TurboModule } from 'react-native';
import { assertAndroidPlatform } from './utils/assertAndroidPlatform';

export interface Spec extends TurboModule {
  multiply(a: number, b: number): number;
}

// Fail-fast (Princípio V/VI): nunca tentar resolver o TurboModule fora do Android.
assertAndroidPlatform();

export default TurboModuleRegistry.getEnforcing<Spec>('GetnetGetsmart');
