import { foo } from '..';

test('', () => {
  if (process.env.NODE_ENV === 'development') {
    foo('1');
  }
});
