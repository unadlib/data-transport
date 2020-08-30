import { originalRespondsMapKey } from '../constant';
import { Respond } from '../interface';
import { Transport } from '../transport';

export const respond = (
  target: Transport,
  key: string,
  descriptor: TypedPropertyDescriptor<Respond>
) => {
  const fn = descriptor.value;
  if (__DEV__) {
    if (typeof fn !== 'function') {
      console.warn(
        `The decorator '@respond' can only decorate methods, '${key}' is NOT a methods.`
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
          `The method ${key} is a listener function that can NOT be actively called.`
        );
      }
    },
  };
};
