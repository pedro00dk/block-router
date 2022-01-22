import React from 'react'
import { Router, Selector } from '../lib/core/router'

export const App = () => {
    const [r, setR] = React.useState('1')

    console.log(`app render`, r)
    const match = false
    return (
        <>
            <Selector rule={[]} key='0'>
                <div onClick={() => Router.singleton.navigate('/1')}>0</div>
            </Selector>
            <Selector rule={['1']} key='1'>
                {
                    <>
                        <div onClick={() => Router.singleton.navigate('/1/2')}>1 {match.toString()}</div>

                        <Selector rule={['2']} key='2'>
                            {match => (
                                <div onClick={() => Router.singleton.navigate('/3/a:b')}>1/2 {match.toString()}</div>
                            )}
                        </Selector>
                    </>
                }
            </Selector>
            <Selector rule={['3', { a: 'b' }]} key='3'>
                <div onClick={() => Router.singleton.navigate('/3/a:b/4')}>3</div>
                <Selector rule={['4']} key='4'>
                    <div onClick={() => Router.singleton.navigate('/3/~')}>3/4</div>
                </Selector>
            </Selector>
            <button onClick={() => setR(r == '1' ? '3' : '1')}>here</button>
            <Selector rule={['~']}>
                <div onClick={() => Router.singleton.navigate('/')}>stack</div>
            </Selector>
        </>
    )
}
