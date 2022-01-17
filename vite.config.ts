import pluginReactRefresh from '@vitejs/plugin-react-refresh'
import pluginAnalyzer from 'rollup-plugin-analyzer'
import { UserConfig } from 'vite'

const config: UserConfig = {
    root: './src/',
    publicDir: './public/',
    build: { outDir: '../build/', minify: 'esbuild', target: 'es2021' },
    server: { port: 3000 },
    plugins: [pluginReactRefresh(), pluginAnalyzer()],
}

console.log(config)

export default config
