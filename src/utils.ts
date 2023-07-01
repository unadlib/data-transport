import { v4 as uuid } from 'uuid';

export const detectSafari = () =>
  /^((?!chrome|android).)*safari/i.test(navigator.userAgent);
export const generateId = () =>
  uuid({
    // In nodejs, crypto.getRandomValues() not supported.
    // workaround: https://github.com/uuidjs/uuid/issues/375
    rng() {
      const randomNumbers: number[] = new Array(16);
      let r;
      for (let i = 0; i < 16; i++) {
        if ((i & 0x03) === 0) r = Math.random() * 0x100000000;
        randomNumbers[i] = ((r as number) >>> ((i & 0x03) << 3)) & 0xff;
      }
      return randomNumbers;
    },
  });
