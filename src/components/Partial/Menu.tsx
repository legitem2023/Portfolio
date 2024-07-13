
import { Icon } from '@iconify/react';
import Link from 'next/link';

import React from 'react'

const Menu = () => {
    const Menu = [
        {
            "Name":"About",
            "Link":"./About",
            "Icon":"mdi:about-circle-outline"
        }
        ,
        {
            "Name":"Information",
            "Link":"./Information",
            "Icon":"mdi:information-outline"
        },
        {
            "Name":"Skills",
            "Link":"./Skills",
            "Icon":"game-icons:skills"
        },
        {
            "Name":"Educations",
            "Link":"./Educations",
            "Icon":"fluent-mdl2:education"
        },
        {
            "Name":"Projects",
            "Link":"./Projects",
            "Icon":"grommet-icons:projects"
        },
        {
            "Name":"Work Expiriences",
            "Link":"./Expiriences",
            "Icon":"mdi:work-outline"
        },
        {
            "Name":"Contact",
            "Link":"./Contact",
            "Icon":"ic:sharp-phone"
        }
]
  return (
    <div className='Menu'>
        <div className='ProfileIcon'><Icon icon="healthicons:ui-user-profile" /></div>
        {Menu.map((item:any,i:number)=>(
            <div key={i} className='MenuItem'>
                <div><Link href={item.Link}><Icon icon={item.Icon}/><code>{item.Name}</code></Link></div>
            </div>
        ))}
    </div>
  )
}

export default Menu