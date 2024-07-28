'use client'
import { Icon } from '@iconify/react/dist/iconify.js'
import React, { useEffect, useRef } from 'react'
import Threejs from './Threejs'
const About = () => {

  return (
        <div className='Main_child' id='About'>
          <div className='center_body'>
              <div className='FullStack'>
              <Icon icon="oui:editor-code-block" /><code>About</code><Icon icon="oui:editor-code-block" />
              </div>
            <div className='AboutData'>     
              <div>

            Hey there! 
            Im Robert Marquez
            
            a passionate fullstack web developer with a knack for crafting elegant and efficient digital solutions. With over 5 years of experience in the field, I thrive on bringing ideas to life through clean, maintainable code and intuitive user interfaces.

            {/* <button className='MenuButton'><Icon icon='ic:sharp-phone'/>Contact</button>                */}
              </div>         
              <div></div>
            </div>
          </div>
        </div>
  )
}

export default About