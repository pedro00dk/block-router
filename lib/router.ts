export class Router {
    static #initialized = false

    constructor() {
        if (Router.#initialized) throw new Error('Router is already initialized')
        Router.#initialized = true
    }
}
