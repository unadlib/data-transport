import { global as globalObj } from '../src/global';

describe('global', () => {
  test('gets global object in browser environment (window)', () => {
    // In jsdom test environment, window should be available
    expect(globalObj).toBeDefined();
    // In jsdom, window should be the global object
    expect(globalObj).toBe(window);
  });

  test('global object has expected properties', () => {
    expect(globalObj).toBeDefined();
    // Should have common global properties
    expect(typeof globalObj).toBe('object');
  });
});
