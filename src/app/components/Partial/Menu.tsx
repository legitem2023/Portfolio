
'use client'
import { Icon } from '@iconify/react';
import Link from 'next/link';
import MenuJson from './Menu.json'
import React, { useEffect } from 'react'
import { useRouter } from 'next/navigation';
import Image from 'next/image';
const Menu = () => {
    const router = useRouter();


  return (
    <div className='Menu'>
        <div className='blurBackGroundUniversal'></div>
        <div className='divide_menu '>
        <div className='ProfileIcon'><Image src="http://192.168.100.86:3000/Me.png" height='300' width='300' alt='1'/></div>
        <div>
        {MenuJson.map((item:any,i:number)=>(
            <div key={i} className='MenuItem' >
                <a href={`http://localhost:3000/#`+item.Link}>
                    <div className='MenuItemLabel'><Icon icon={item.Icon}/>
                        <code className='closeMOB'>{item.Name}</code>
                    </div>
                </a>
            </div>
        ))}
        </div>

        <div></div>
        </div>

    </div>
  )
}

export default Menu