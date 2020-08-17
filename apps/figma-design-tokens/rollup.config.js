import resolve from '@rollup/plugin-node-resolve';
import commonjs from '@rollup/plugin-commonjs';
import json from '@rollup/plugin-json';

export default {
  plugins: [
    resolve({
      jsnext: true,
      preferBuiltins: true,
      browser: true
    }),
    json(),
    commonjs(),
  ]
}
