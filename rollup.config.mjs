import nodeResolve from '@rollup/plugin-node-resolve';
import typescript from '@rollup/plugin-typescript';
import dts from 'rollup-plugin-dts';

const external = [
  'react',
  'react-dom',
  'react/jsx-runtime',
  'vue',
  '@angular/core',
  '@angular/common',
  'rxjs',
  '@cashfreepayments/cashfree-js',
  '@stripe/stripe-js',
  'node:crypto',
];

const tsPlugin = (options = {}) =>
  typescript({
    tsconfig: './tsconfig.json',
    declaration: false,
    declarationMap: false,
    sourceMap: true,
    ...options,
  });

function bundle({ input, outDir, umdName = null }) {
  const outputs = [
    { file: `${outDir}/index.mjs`, format: 'es', sourcemap: true },
    { file: `${outDir}/index.cjs`, format: 'cjs', sourcemap: true, exports: 'named' },
  ];
  if (umdName) {
    outputs.push({
      file: `${outDir}/index.umd.js`,
      format: 'umd',
      name: umdName,
      sourcemap: true,
      exports: 'named',
    });
  }
  return {
    input,
    external,
    output: outputs,
    plugins: [nodeResolve(), tsPlugin()],
  };
}

function dtsBundle({ input, outFile }) {
  return {
    input,
    external,
    output: { file: outFile, format: 'es' },
    plugins: [dts()],
  };
}

// Gateway file bundle — outputs as `dist/gateways/{gateway}/{browser|server}.{mjs,cjs,d.ts}`
function gatewayBundle({ gateway, side }) {
  const input = `src/gateways/${gateway}/${side}.ts`;
  const outBase = `dist/gateways/${gateway}/${side}`;
  return [
    {
      input,
      external,
      output: [
        { file: `${outBase}.mjs`, format: 'es', sourcemap: true },
        { file: `${outBase}.cjs`, format: 'cjs', sourcemap: true, exports: 'named' },
      ],
      plugins: [nodeResolve(), tsPlugin()],
    },
    {
      input,
      external,
      output: { file: `${outBase}.d.ts`, format: 'es' },
      plugins: [dts()],
    },
  ];
}

const gateways = ['razorpay', 'cashfree', 'payu', 'juspay', 'stripe'];
const sides = ['browser', 'server'];

export default [
  // Core entry
  bundle({ input: 'src/index.ts', outDir: 'dist' }),
  dtsBundle({ input: 'src/index.ts', outFile: 'dist/index.d.ts' }),

  // UMD bundle
  {
    input: 'src/umd.ts',
    external,
    output: {
      file: 'dist/index.umd.js',
      format: 'umd',
      name: 'PaymentUniversal',
      sourcemap: true,
      exports: 'named',
    },
    plugins: [nodeResolve(), tsPlugin()],
  },

  // Framework adapters
  bundle({ input: 'src/adapters/react/index.ts', outDir: 'dist/adapters/react' }),
  dtsBundle({ input: 'src/adapters/react/index.ts', outFile: 'dist/adapters/react/index.d.ts' }),
  bundle({ input: 'src/adapters/vue/index.ts', outDir: 'dist/adapters/vue' }),
  dtsBundle({ input: 'src/adapters/vue/index.ts', outFile: 'dist/adapters/vue/index.d.ts' }),
  bundle({ input: 'src/adapters/angular/index.ts', outDir: 'dist/adapters/angular' }),
  dtsBundle({ input: 'src/adapters/angular/index.ts', outFile: 'dist/adapters/angular/index.d.ts' }),
  bundle({ input: 'src/adapters/vanilla/index.ts', outDir: 'dist/adapters/vanilla' }),
  dtsBundle({ input: 'src/adapters/vanilla/index.ts', outFile: 'dist/adapters/vanilla/index.d.ts' }),

  // Gateway adapters — browser + server per gateway
  ...gateways.flatMap((g) => sides.flatMap((s) => gatewayBundle({ gateway: g, side: s }))),
];
