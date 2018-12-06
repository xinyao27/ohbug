import { terser } from 'rollup-plugin-terser';
import babel from 'rollup-plugin-babel';
import resolve from 'rollup-plugin-node-resolve';
import commonjs from 'rollup-plugin-commonjs';

const config = {
  input: './src/main.js',
  output: {
    file: './dist/ohbug.js',
    format: 'umd',
    name: 'Ohbug',
  },
  plugins: [
    babel({
      exclude: 'node_modules/**', // 只编译我们的源代码
    }),
    commonjs({
      include: 'node_modules/**',
    }),
    resolve({
      jsnext: true, // Default: false
      browser: true, // Default: false
      preferBuiltins: false, // Default: true
    }),
  ],
};

if (process.argv[3] === '--compress') {
  config.output.file = './dist/ohbug.min.js';
  config.plugins.push(terser());
}

export default config;
