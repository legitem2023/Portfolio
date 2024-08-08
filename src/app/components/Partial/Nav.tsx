'use client'
import { Icon } from '@iconify/react/dist/iconify.js'
import Image from 'next/image'
import React from 'react'
import ToggleComponent from './toggleComponent'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
const Nav = () => {
    const router = useRouter();
    return (
        <div className='Nav' id='Nav'>
            <ToggleComponent/>
            <div className='NavIconLink'>
                <Link href="https://t.me/RobertMarquez" target='_blank'><Icon icon="bi:line" onClick={()=>router.push('/')}/></Link>
                <Link href="https://t.me/RobertMarquez" target='_blank'><Icon icon="bi:messenger" onClick={()=>router.push('/')}/></Link>
                <Link href="https://t.me/RobertMarquez" target='_blank'><Icon icon="bi:telegram" /></Link>
            </div>
        </div>
    )
}

export default Nav