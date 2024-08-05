import Image from 'next/image'
import React from 'react'

const Nav = () => {
    return (
        <div className='Nav' id='Nav'>
            <div className='ProfileIcon'><Image src="https://hokei-storage.s3.ap-northeast-1.amazonaws.com/images/Legit/Portfolio/Projects/Me.png" height='300' width='300' alt='1' /></div>
        </div>
    )
}

export default Nav