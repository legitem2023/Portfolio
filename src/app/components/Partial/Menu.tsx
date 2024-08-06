
'use client'
import { Icon } from '@iconify/react';
import MenuJson from './Menu.json'
import React from 'react'
import Image from 'next/image';
import { usePathname } from 'next/navigation';

const Menu = () => {
    const pathname = usePathname();
    return (
        <div className='Menu'>
            <div className='blurBackGroundUniversal'></div>
            <div className='divide_menu '>
                {/* <div className='ProfileIcon'><Image src="https://hokei-storage.s3.ap-northeast-1.amazonaws.com/images/Legit/Portfolio/Projects/Me.png" height='300' width='300' alt='1'/></div> */}
                <div className='MenuItemCont'>
                    {MenuJson.map((item: any, i: number) => (
                        <div key={i} className='MenuItem' >
                            <a href={pathname + `#` + item.Link}>
                                <div className='MenuItemLabel'><Icon icon={item.Icon} />
                                    <code className='closeMOB'>{item.Name}</code>
                                </div>
                            </a>
                        </div>
                    ))}
                </div>
            </div>

        </div>
    )
}

export default Menu