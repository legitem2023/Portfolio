'use client';
import { Icon } from '@iconify/react';
import MenuJson from './Menu.json';
import React, { useEffect, useState } from 'react';
import { usePathname } from 'next/navigation';
import useToggle from '../../../../Store/useToggle';

const Menu = () => {
    const pathname = usePathname();
    const { isToggled, toggle } = useToggle();
    const [isPortrait, setIsPortrait] = useState(false);

    useEffect(() => {
        if (typeof window !== 'undefined') {
            setIsPortrait(window.matchMedia("(orientation: portrait)").matches);
            
            const handleOrientationChange = () => {
                setIsPortrait(window.matchMedia("(orientation: portrait)").matches);
            };

            window.addEventListener("resize", handleOrientationChange);

            // Cleanup the event listener on component unmount
            return () => {
                window.removeEventListener("resize", handleOrientationChange);
            };
        }
    }, []);

    return (
        <div className='Menu' style={isPortrait ? { left: isToggled ? "0vw" : "-100vw" } : {}}>
            <div className='blurBackGroundUniversal'></div>
            <div className='divide_menu '>
                {/* <div className='ProfileIcon'><Image src="https://hokei-storage.s3.ap-northeast-1.amazonaws.com/images/Legit/Portfolio/Projects/Me.png" height='300' width='300' alt='1'/></div> */}
                <div className='MenuItemCont'>
                    {MenuJson.map((item: any, i: number) => (
                        <div key={i} className='MenuItem' >
                            <a href={pathname + `#` + item.Link} onClick={toggle}>
                                <div className='MenuItemLabel'><Icon icon={item.Icon} />
                                    <code className='closeMOB'>{item.Name}</code>
                                </div>
                            </a>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
};

export default Menu;
