import React from 'react'
import { Router } from '../lib/core/router'
import { Selector, useRoute } from '../lib/react/hooks'

export const App = () => {
    const route = useRoute()

    console.log(route)

    return (
        <>
            <Selector selector={['']}>
                <div onClick={() => Router.singleton.navigate('1')}>0</div>
            </Selector>
            <Selector selector={['1']}>
                <div onClick={() => Router.singleton.navigate('2')}>1</div>
            </Selector>
            <Selector selector={['2']}>
                <div onClick={() => Router.singleton.navigate('3')}>2</div>
                <Selector selector={['1']}>
                    <div onClick={() => Router.singleton.navigate('2')}>1</div>
                </Selector>
            </Selector>
            <Selector selector={['3']}>
                <div onClick={() => Router.singleton.navigate('4')}>3</div>
            </Selector>
            <Selector selector={['4']}>
                <div onClick={() => Router.singleton.navigate('/')}>4</div>
            </Selector>
            <dialog open>test</dialog>
        </>
    )
}
