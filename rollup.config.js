import pkg from './package.json';

export default {
  input: './dist/index.js',
  output: [
    {
      format: 'cjs',
      file: pkg.main,
      sourcemap: true,
    },
    {
      format: 'es',
      exports: 'named',
      file: pkg.module,
      sourcemap: true,
    },
    {
      format: 'umd',
      name: pkg.name,
      file: pkg.unpkg,
      sourcemap: true,
    },
  ],
};
