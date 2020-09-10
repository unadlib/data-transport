import { originalRespondsMapKey } from '../constant';
import { Transport } from '../transport';

export const listen = (
  target: Transport,
  key: string,
  descriptor: TypedPropertyDescriptor<(...args: any) => any>
) => {
  const fn = descriptor.value;
  if (__DEV__) {
    if (typeof fn !== 'function') {
      console.warn(
        `The decorator '@listen' can only decorate methods, '${key}' is NOT a methods.`
      );
      return descriptor;
    }
  }
  target[originalRespondsMapKey] ??= {};
  target[originalRespondsMapKey][key] = fn!;
  return {
    ...descriptor,
    value(this: Transport) {
      if (__DEV__) {
        throw new Error(
          `The method '${key}' is a listener function that can NOT be actively called.`
        );
      }
    },
  };
};
