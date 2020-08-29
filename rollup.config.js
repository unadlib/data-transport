import resolve from '@rollup/plugin-node-resolve';
import commonjs from '@rollup/plugin-commonjs';
import replace from '@rollup/plugin-replace';
import { terser } from 'rollup-plugin-terser';
import pkg from './package.json';

const isProduction = process.env.NODE_ENV === 'production';
const input = './dist/index.js';

export default isProduction
  ? {
      input,
      output: [
        {
          format: 'cjs',
          exports: 'auto',
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
      plugins: [
        resolve(),
        commonjs(),
        replace({
          __DEV__: 'false',
        }),
        terser(),
      ],
    }
  : {
      input,
      output: [
        {
          format: 'cjs',
          exports: 'auto',
          file: pkg.main.replace('cjs.js', (s) => `development.${s}`),
          sourcemap: true,
        },
      ],
      plugins: [
        resolve(),
        commonjs(),
        replace({
          __DEV__: 'true',
        }),
      ],
    };
