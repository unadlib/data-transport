import { generateId } from '../src/utils';

test('generateId', () => {
  expect(generateId()).toMatch(/[a-z0-9-]{36}/);
  expect(generateId()).not.toBe(generateId());
});
