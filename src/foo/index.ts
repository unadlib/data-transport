export const foo = (s: string) => {
  console.log('test');
  if (__DEV__) {
    console.log('dev');
  }
};
