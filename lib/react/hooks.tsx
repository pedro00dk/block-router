import React from 'react'
import { Router, Selector as SelectorType } from '../core/router'

export const useRouter = () => Router.singleton

export const useRoute = () => {
    const [route, setRoute] = React.useState(Router.singleton.route)
    React.useEffect(() => Router.singleton.subscribe(setRoute), [])
    return route
}

export const useSelector = (selector: SelectorType, checkpoint = false) => {
    const [match, setMatch] = React.useState(Router.singleton.match(selector, true))
    React.useEffect(() => Router.singleton.subscribe(() => Router.singleton.match(selector, true)), [])
    return match
}

export const Selector = (props: { selector: SelectorType; children?: React.ReactNode }) => (
    <>{useSelector(props.selector) && props.children}</>
)
