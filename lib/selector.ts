import { Route } from './route'

type PredicateMatcher = (route: Route) => boolean
type RootMatcher = '/'
type BlockMatcher = '~'
type ContextMatcher = string
type ParamsMatcher = { [param: string]: ParamMatcher }
type ParamMatcher = any | ((param: string) => boolean)

export type Selector = PredicateMatcher | (RootMatcher | BlockMatcher | ContextMatcher | ParamsMatcher)[]

const match = (route: Route, selector: Selector) => {
    if (typeof selector === 'function') return selector(route)
    selector = Array.isArray(selector) ? selector : [selector]
    const reference = { stack: 0, context: 0 }
    for (const s of selector) console.log(s)
    return false
}
