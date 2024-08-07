'use client'
import { Icon } from '@iconify/react/dist/iconify.js'
import Image from 'next/image'
import React from 'react'
import ToggleComponent from './toggleComponent'
import { useRouter } from 'next/navigation'
const Nav = () => {
    const router = useRouter();
    return (
        <div className='Nav' id='Nav'>
            <ToggleComponent/>
            <div className='NavIconLink'>
                <div><Icon icon="bi:line" onClick={()=>router.push('/')}/></div>
                <div><Icon icon="bi:messenger" onClick={()=>router.push('/')}/></div>
                <div><Icon icon="bi:telegram" onClick={()=>router.push('/')}/></div>
            </div>
        </div>
    )
}

export default Nav