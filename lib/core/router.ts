import React from 'react'
import { Route } from './route'

export type Rule = ('/' | '~' | string | { [k: string]: ((v: string) => boolean) | undefined | any })[]
type Checkpoint = { block: number; context: number }

/**
 * The Router object manages navigation, route matching, and route events.
 *
 * This object is a singleton, and should preferably be accessed via the `Router.singleton` getter.
 *
 * @see Route
 */
export class Router {
    /**
     * Router singleton instance.
     */
    static get singleton() {
        return Router.#singleton ?? new Router()
    }
    static #singleton: Router | undefined = undefined

    /**
     * Current application route.
     */
    get route() {
        return this.#route
    }
    #route: Route = new Route()

    /**
     * Notifier used for the base selector.
     * @see Notifier
     */
    #notifier = new Notifier(undefined, [], { block: 0, context: -1 })

    /**
     * React context storing selection checkpoints.
     */
    get context() {
        return this.#context
    }
    #context = React.createContext(this.#notifier)

    /**
     * Create the router singleton instance, if it already exists, an error is thrown.
     *
     * The preferred way to access the router is via the `Router.singleton` getter.
     *
     * @throws Error - If the router singleton already exists.
     */
    constructor() {
        if (Router.#singleton) throw new Error('Router is already initialized.')
        Router.#singleton = this
        this.#route = new Route()
        this.#context.displayName = 'ContextRouter'
    }

    //
    // Selector utilities
    //

    select = (rule: Rule, checkpoint: Checkpoint | undefined) => {
        if (!checkpoint) return undefined
        let next = { ...checkpoint }
        for (let i = 0; i < rule.length; i++) {
            const part = rule[i]
            if (part === '/') {
                if (next.block > 0 || next.context > -1) return undefined
            } else if (typeof part === 'string') {
                next.context += 1
                if (this.route.stack[next.block]?.[next.context]?.__name !== part) return undefined
            }
        }
        return next
    }

    //

    navigate = (to: string, options?: { replace?: boolean; data?: any; unused?: string }) => {
        if (options?.replace) window.history.replaceState(options?.data, options?.unused ?? '', to)
        else window.history.pushState(options?.data, options?.unused ?? '', to)
        console.log('url change', to)
        this.#route = new Route()
        this.#notifier.notify({ block: 0, context: -1 })
    }
}

/**
 * The notifier manages route selection across the react tree.
 *
 * The main idea is to provide a way to compute if a selector still matches when the route changes before rendering.
 * That allow components bail out from re-rendering if the matching state does not change.
 */
class Notifier {
    /**
     * The parent notifier.
     */
    #parent: Notifier | undefined

    /**
     * The selector rule used to compute the current checkpoint.
     */
    #rule: Rule = []

    /**
     * The last checkpoint provided by the `constructor` or the `notify` function.
     * A non null value means the notifier is currently in a matching state.
     * @see Checkpoint
     */
    get checkpoint() {
        return this.#checkpoint
    }
    #checkpoint: Checkpoint | undefined

    /**
     * Subscriptions registered to the notifier.
     */
    #subscriptions: ((checkpoint?: Checkpoint) => void)[] = []

    /**
     * Create the notifier and subscribes itself to the parent notifier.
     *
     * @param parent - The parent notifier or undefined if there is not parent.
     * @param rule - The selector rule used to compute the current checkpoint.
     * @param checkpoint - The initial checkpoint, only used if `parent` is undefined.
     */
    constructor(parent: Notifier | undefined, rule: Rule, checkpoint?: Checkpoint | undefined) {
        this.#parent = parent
        this.#rule = rule
        this.#checkpoint = this.#parent ? Router.singleton.select(this.#rule, this.#parent.checkpoint) : checkpoint
        this.#parent?.subscribe(this.notify)
    }

    /**
     * Compute the current checkpoint and notify all the subscriptions.
     *
     * @param checkpoint - The parent checkpoint.
     */
    notify = (checkpoint?: Checkpoint) => {
        this.#checkpoint = this.#parent ? Router.singleton.select(this.#rule, this.#parent.checkpoint) : checkpoint
        this.#subscriptions.forEach(subscription => subscription(this.#checkpoint))
    }

    /**
     * Subscribe to the notifier.
     *
     * @param subscription - Callback that accepts a checkpoint or undefined.
     */
    subscribe = (subscription: (checkpoint?: Checkpoint) => void) => {
        this.#subscriptions.push(subscription)
        return () => void this.#subscriptions.splice(this.#subscriptions.indexOf(subscription), 1)
    }
}

/**
 * The useSelector hooks returns if a given selector `rule` matches the current route, taking into account all ancestor
 * selectors.
 *
 * This function hooks into the `Notifier` tree and listens to url changes, only triggering updates when the selector
 * match state changes.
 *
 * @param rule - The selector rule to match.
 * @returns An object containing the selector `match` state, and the `notifier` created to listen ancestor selectors.
 */
export const useSelector = (rule: Rule) => {
    const update = React.useReducer(u => u + 1, 0)[1]
    const match = React.useRef(false)
    const parent = React.useContext(Router.singleton.context)
    const { notifier, unsubscribe } = React.useMemo(() => {
        const notifier = new Notifier(parent, rule)
        const unsubscribe = notifier //
            .subscribe(checkpoint => match.current !== !!checkpoint && ((match.current = !!checkpoint), update()))
        match.current = !!notifier.checkpoint
        return { notifier, unsubscribe }
    }, [parent, ...rule])
    React.useEffect(() => unsubscribe, [parent, ...rule])
    return { match: match.current, notifier }
}

/**
 * The Selector component conditionally renders `children` if `rule` matches the current route.
 *
 * As well as `useSelector` this component only re-renders when the selector match state changes.
 *
 * @param props.rule - The selector rule to match.
 * @param props.children - Children to be conditionally rendered. A function can be provided instead, in that case, the
 *        function will be called with the `match` state as parameter even if it does not match.
 */
export const Selector = (props: { rule: Rule; children?: React.ReactNode | ((match: boolean) => React.ReactNode) }) => {
    const { match, notifier } = useSelector(props.rule)

    return React.createElement(
        Router.singleton.context.Provider,
        { value: notifier },
        typeof props.children === 'function' ? props.children(match) : match ? props.children : undefined,
    )
}
