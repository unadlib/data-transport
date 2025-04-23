type GlobalThis = typeof globalThis;

const getGlobal = () => {
  let _global: GlobalThis;
  if (typeof window !== 'undefined') {
    _global = window;
  } else if (typeof global !== 'undefined') {
    _global = global as GlobalThis;
  } else if (typeof self !== 'undefined') {
    _global = self;
  } else {
    _global = {} as GlobalThis;
  }
  return _global;
};

export const global = getGlobal();
