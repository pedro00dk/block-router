import { Route } from './route'

type RootMatcher = '/'
type BlockMatcher = '~'
type ContextMatcher = string
type ParamsMatcher = { [param: string]: ParamMatcher }
type ParamMatcher = any | ((param: string) => boolean)

export type Checkpoint = { block: number; context: number; parent?: Checkpoint }

export type Selector = (RootMatcher | BlockMatcher | ContextMatcher | ParamsMatcher)[]

export class Router {
    static #singleton: Router | undefined = undefined
    #route: Route = new Route()
    #checkpoint: Checkpoint = { block: 0, context: 0 }
    #subscriptions: ((route: Route) => void)[] = []

    private constructor() {
        if (Router.#singleton) throw new Error('Router is already initialized')
        Router.#singleton = this
        window.addEventListener('popstate', this.callSubscriptions)
    }

    static get singleton() {
        return Router.#singleton ?? new Router()
    }

    get route() {
        return this.#route
    }

    match = (selector: Selector, checkpoint = false) => {
        console.log(selector)
        let c = this.#checkpoint
        return true
        for (const s of selector)
            if (s === '/') c = { block: 0, context: 0 }
            else if (s === '~') c = { block: c.block, context: 0 }
            else if (typeof s === 'string') c = { block: c.block, context: c.context + 1 }
            else {
                s
            }
        return false
    }

    navigate = (to: string, options?: { replace?: boolean; data?: any; unused?: string }) => {
        if (options?.replace) window.history.replaceState(options?.data, options?.unused ?? '', to)
        else window.history.pushState(options?.data, options?.unused ?? '', to)
        this.callSubscriptions()
    }

    subscribe = (subscription: (route: Route) => void, call = false) => {
        if (call) subscription(this.#route)
        this.#subscriptions.push(subscription)
        return () => void (this.#subscriptions = this.#subscriptions.filter(s => s !== subscription))
    }

    callSubscriptions = () => {
        this.#route = new Route()
        this.#checkpoint = { block: 0, context: 0 }
        this.#subscriptions.forEach(subscription => subscription(this.#route))
    }
}
