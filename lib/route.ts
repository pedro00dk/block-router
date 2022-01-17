import { Configuration, defaultConfiguration, loadConfiguration } from './configuration'

type Mutable<T> = {
    -readonly [P in keyof T]: T[P]
}

/**
 * Stack is the representation of a given URL pathname.
 * It is composed of a list of `Block`s, which in turn are composed of `Contexts`s.
 *
 * @see Route
 * @see Block
 * @see Context
 */
export type Stack = ReadonlyArray<Block>

/**
 * A block is composed of one or more contexts, it can be used to represent an independent navigation section.
 * The most adequate use case for a block is for modal navigation.
 *
 * ### Examples
 *
 * For the given configuration:
 * ```typescript
 *  const configuration = { blockSeparator: '~' }
 * ```
 *
 * The following examples will be resolved as:
 *
 * ```
 * # Example 0:
 * http://localhost:3000/
 * contexts:             None
 * blocks:               None
 *
 * # Example 1:
 * http://localhost:3000/users
 * contexts:            |ctx0 |
 * blocks:              |blk0 |
 * blk0: [ctx0]
 *
 * # Example 2:
 * http://localhost:3000/users/user/=123/~/edit/tab=delete/~/confirm
 * contexts:            |ctx0 |ctx1     | |ctx2           | |ctx3   |
 * blocks:              |blk0           | |blk1           | |blk2   |
 * blk0: [ctx0, ctx1]
 * blk1: [ctx2]
 * blk2: [ctx3]
 * ```
 *
 * @see Context
 * @see Stack
 */
export type Block = ReadonlyArray<Context>

/**
 * A context is composed of a name and set of key-value pairs, it is the smallest unit of a route's pathname.
 * Contexts can be interpreted as a set of properties encoded withing the pathname itself.
 *
 * ### Examples
 *
 * For the given configuration:
 * ```typescript
 *  const configuration = { paramSeparator: '=' }
 * ```
 *
 * The following examples will be resolved as:
 *
 * ```
 * # Example 0:
 * # URL without a pathname.
 * http://localhost:3000/
 * contexts:             None
 *
 * # Example 1:
 * # Context without properties.
 * http://localhost:3000/users
 * contexts:            |ctx0 |
 * ctx0: {__name: 'users'}
 *
 * # Example 2:
 * # Context with one unnamed ('') property.
 * # If paramSeparator (=) is present in a path slice, it will be interpreted as a property.
 * http://localhost:3000/users/=123
 * contexts:            |ctx0      |
 * ctx0: {__name: 'users', ['']: '123'}
 *
 * # Example 3:
 * # Context with one named property.
 * http://localhost:3000/users/user=123
 * contexts:            |ctx0          |
 * ctx0: {__name: 'users', user: '123'}
 *
 * # Example 4:
 * # Context with repeated properties.
 * # Properties with same key are joined with space.
 * http://localhost:3000/users/=123/id=123/=456/id=456
 * contexts:            |ctx0                         |
 * ctx1: {__name: 'user', ['']: '123 456' id: '123 456'}
 *
 * # Example 5:
 * # Multiple contexts without properties.
 * http://localhost:3000/users/user/123
 * contexts:            |ctx0 |ctx1|ctx2|
 * ctx0: {__name: 'users'}
 * ctx1: {__name: 'user'}
 * ctx2: {__name: '123'}
 *
 * # Example 6:
 * # Multiple contexts with properties.
 * # Each context carries its own set of properties.
 * http://localhost:3000/users/=male/age=45/user/name=pedro/=123
 * contexts:            |ctx0              |ctx1                |
 * ctx0: {__name: 'users', ['']: 'male', age: '45' }
 * ctx1: {__name: 'user', name: 'pedro', ['']: '123'}
 * ```
 *
 * The first path slice and the slices that initiate each `Block` are always assumed to contain a context name.
 * These cases allow the the Router implementation to correctly interpret any conceivable pathname.
 * However, such cases should be avoided.
 *
 * ```
 * # Example 7:
 * # First path slice is always parsed as a context name even if it contains a paramSeparator (=).
 * http://localhost:3000/user=123
 * contexts:            |ctx0    |
 * ctx0: {__name: 'user=123' }
 *
 * # Example 8:
 * # First path slice contains paramSeparator (=) and extra properties.
 * http://localhost:3000/user=123/=male/age=45
 * contexts:            |ctx0                 |
 * ctx0: {__name: 'user=123', ['']: 'male', age: '45' }
 * ```
 *
 * @see Block
 */
export type Context = Readonly<{ __name: string; [key: string]: string }>

export type Params = Readonly<{ [key: string]: string }>

/**
 * The Route object stores a opinionated view of a given `URL` or `Location`.
 * It interprets the `URL` as a stack of blocks, each block being a list of contexts.
 *
 * @see Stack
 * @see Block
 * @see Context
 */
export class Route {
    /**
     * Route's configuration object.
     */
    get configuration() {
        return this.#configuration
    }
    #configuration: Configuration

    /**
     * Route's parsed stack.
     */
    get stack() {
        return this.#stack
    }
    #stack: Stack

    /**
     * Route's parsed search.
     */
    get search() {
        return this.#search
    }
    #search: Params

    /**
     * The route's parsed hash.
     */
    get hash() {
        return this.#hash
    }
    #hash: string

    /**
     * Create a `Route` object from the given `url`.
     *
     * @param url - `URL` or `Location` to be parsed. Default: `window.location`.
     * @param configuration - The configuration object. Default: `defaultConfiguration`.
     * @returns A `Route` object.
     */
    constructor(url: URL | Location = window.location, configuration: Partial<Configuration> = defaultConfiguration) {
        this.#configuration = loadConfiguration(configuration)
        this.#stack = this.parseStack(url.pathname, this.#configuration)
        this.#search = this.parseSearch(url.search)
        this.#hash = this.parseHash(url.hash)
    }

    /**
     * Returns a string representation of the route.
     *
     * The returned string is not a full URL path, it starts with the pathname.
     *
     * @returns The route's string representation.
     */
    toString = () => `${this.stringifyStack()}${this.stringifySearch()}${this.stringifyHash()}`

    /**
     * Parse `pathname` and return its stack of blocks.
     *
     * @param pathname - String containing the url pathname.
     * @param configuration - The configuration object. Default: `this.configuration`.
     * @returns A `Stack` object
     * @see Stack
     */
    parseStack = (pathname: string, configuration = this.configuration): Stack =>
        Object.freeze(
            pathname
                .split('/')
                .filter(Boolean)
                .reduce<string[][]>((acc, part, i) => {
                    if (!i || part === configuration.splitBlock) acc.push([])
                    acc.at(-1)!.push(part)
                    return acc
                }, [])
                .map(pathParts => this.parseBlock(pathParts, configuration)),
        )

    /**
     * Parse `pathParts` into a `Block` containing zero or more `Context`s.
     *
     * @param pathParts - Array containing slices of a url `pathname` split by `/`.
     * @param configuration - The configuration object. Default: `this.configuration`.
     * @returns A `Block` object.
     * @see Block
     */
    parseBlock = (pathParts: string[], configuration = this.configuration): Block =>
        Object.freeze(
            pathParts
                .reduce<string[][]>((acc, part, i) => {
                    if (!i || part.includes(configuration.splitParam)) acc.push([])
                    acc.at(-1)!.push(part)
                    return acc
                }, [])
                .map(pathParts => this.parseContext(pathParts, configuration)),
        )

    /**
     * Parse `pathParts` and produces back a block context.
     *
     * The first part is taken as the context name, the following parts are parsed as key-value pairs and assigned as
     * context props.
     *
     * @param pathParts - Array containing slices of a url `pathname` split by `/`.
     * @param configuration - The configuration object. Default: `this.configuration`.
     * @returns A `Context` object.
     * @see Context
     */
    parseContext = (pathParts: string[], configuration = this.configuration): Context =>
        Object.freeze(
            pathParts
                .map((param, i) => (!i ? ['__name', param] : param.split(configuration.splitParam)))
                .reduce<Mutable<Context>>(
                    (acc, [key, value]) => {
                        acc[key] = `${acc[key] ?? ''}${acc[key] ? ' ' : ''}${value ?? ''}`
                        return acc
                    },
                    { __name: '' },
                ),
        )

    /**
     * Parse a url `search` string and return its key-value pairs.
     *
     * @param search - Search string, it may or may not start with `?`.
     * @returns A `Params` object.
     * @see Params
     */
    parseSearch = (search: string): Params =>
        Object.freeze(
            search
                .slice(+search.startsWith('?'))
                .split('&')
                .filter(Boolean)
                .map(param => param.split('='))
                .reduce<Mutable<Params>>((acc, [key, value]) => {
                    acc[key] = `${acc[key] ?? ''}${acc[key] ? ' ' : ''}${value ?? ''}`
                    return acc
                }, {}),
        )

    /**
     * Parse a url `hash` by stripping `#` if present.
     *
     * @param hash - Hash string.
     * @return A hash string with its `#` stripped.
     */
    parseHash = (hash: string) => hash.slice(+hash.startsWith('#'))

    /**
     * Stringify a given `stack` object.
     *
     * @param context - A `stack` object to be stringified. Default: `this.stack`.
     * @param configuration - The configuration object. Default: `this.configuration`.
     * @returns A pathname string with a leading `/` but without a trailing `/`.
     */
    stringifyStack = (stack: Stack = this.stack, configuration = this.configuration) =>
        stack.map(block => this.stringifyBlock(block, configuration)).join(`/${configuration.splitBlock}`)

    /**
     * Stringify a given `block` object.
     *
     * @param context - A `Block` object to be stringified.
     * @param configuration - The configuration object. Default: `this.configuration`.
     * @returns A pathname string with a leading `/` but without a trailing `/`.
     */
    stringifyBlock = (block: Block, configuration = this.configuration) =>
        block.map(context => this.stringifyContext(context, configuration)).join('/')

    /**
     * Stringify a given `context` object.
     *
     * @param context - A `Context` object to be stringified.
     * @param configuration - The configuration object. Default: `this.configuration`.
     * @returns A pathname string with a leading `/` but without a trailing `/`.
     */
    stringifyContext = (context: Context, configuration = this.configuration) => {
        const { __name, ...props } = context
        const contextEntries = Object.entries(props)

        return `/${__name}${contextEntries.length ? '/' : ''}${contextEntries
            .map(([key, value]) => `${encodeURIComponent(key)}${configuration.splitParam}${encodeURIComponent(value)}`)
            .join('/')}`
    }

    /**
     * Stringify the route's hash.
     *
     * @param search - A route's search object. Default: `this.search`.
     * @returns the hash string
     */
    stringifySearch = (search = this.search) => {
        const searchEntries = Object.entries(search)
        return searchEntries.length
            ? `?${searchEntries
                  .map(([key, value]) => `${encodeURIComponent(key)}=${encodeURIComponent(value)}`)
                  .join('&')}`
            : ''
    }

    /**
     * Serialize the route's hash.
     *
     * @param hash - A route's hash string. Default: `this.hash`.
     * @returns the URL stringified hash string
     */
    stringifyHash = (hash = this.hash) => (hash ? `#${encodeURIComponent(hash)}` : '')
}
