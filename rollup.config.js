import { terser } from 'rollup-plugin-terser';

export default {
  input: './src/main.js',
  output: {
    file: './dist/ohbug.js',
    format: 'umd',
    name: 'Ohbug',
  },
  plugins: [
    terser(),
  ],
};
