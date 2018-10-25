import { terser } from 'rollup-plugin-terser';

const config = {
  input: './src/main.js',
  output: {
    file: './dist/ohbug.js',
    format: 'umd',
    name: 'Ohbug',
  },
  plugins: [],
};

if (process.argv[3] === '--compress') {
  config.output.file = './dist/ohbug.min.js';
  config.plugins.push(terser());
}

export default config;
