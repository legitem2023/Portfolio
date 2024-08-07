'use client'
import { Icon } from '@iconify/react/dist/iconify.js'
import React, { useEffect, useRef } from 'react'
import Threejs from './Threejs'
const About = () => {

  return (
    <div className='Main_child' id='About'>
      <div className='center_body'>
        <div className='FullStack'>
          <Icon icon="mdi:about-circle-outline" /><code>About</code>
        </div>
        <div className='AboutData'>
          
          <div>

            <div className='AboutTextName'>Hey there!
            Im Robert Marquez
            </div>
            <div>
            a passionate fullstack web developer with a knack for crafting elegant and efficient digital solutions. With over 5 years of experience in the field, I thrive on bringing ideas to life through clean, maintainable code and intuitive user interfaces.
            </div>
            {/* <button className='MenuButton'><Icon icon='ic:sharp-phone'/>Contact</button>                */}
          </div>
          <div className='AboutBackGround'>
          <svg>
                <filter id="wavy2">
                  <feTurbulence x="0" y="0" baseFrequency="0.02" numOctaves="5" seed="1" />
                  <feDisplacementMap in="SourceGraphic" scale="15" />
                </filter>
              </svg>
          </div>
        </div>
      </div>
    </div>
  )
}

export default About