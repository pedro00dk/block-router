import * as viteDevServer from '@cypress/vite-dev-server'

const vitePlugin: Cypress.PluginConfig = (on, config) => {
    const viteConfig = { configFile: 'vite.config.ts' }
    on('dev-server:start', options => viteDevServer.startDevServer({ options, viteConfig }))
    return config
}

export default vitePlugin
