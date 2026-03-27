import typescript from '@rollup/plugin-typescript';
import resolve from '@rollup/plugin-node-resolve';
import commonjs from '@rollup/plugin-commonjs';
import terser from '@rollup/plugin-terser';

const dev = process.env.ROLLUP_WATCH;

export default {
  input: 'src/armadarr-card.ts',
  output: {
    file: 'dist/armadarr-card.js',
    format: 'es',
    sourcemap: true,
    inlineDynamicImports: true,
  },
  plugins: [
    resolve(),
    commonjs(),
    typescript(),
    !dev && terser(),
  ],
};
