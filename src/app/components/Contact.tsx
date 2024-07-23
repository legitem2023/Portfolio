import { Icon } from '@iconify/react/dist/iconify.js'
import React from 'react'

const Contact = () => {
  return (
        <div className='Main_child' id='Contact'>
          <div className='center_body'>
          <div className='FullStack'>
              <Icon icon="oui:editor-code-block" /><code>Contact</code><Icon icon="oui:editor-code-block" />
          </div>
          <div className='center_body_contact'>
          <div>
              <input type='text' placeholder='Fullname'/>
            </div>
            <div>
              <input type='text' placeholder='Email Address'/>
            </div>
            <div>
              <input type='text' placeholder='Contact No.'/>
            </div>
            <div>
              <textarea placeholder='More Details'></textarea>
            </div>
            <div>
              <input type='file'/>
            </div>
            <br></br>
            <div>
            <button className='MenuButton'><Icon icon='ic:sharp-phone'/>Apply</button>
            </div>
          </div>
          </div>
        </div>
  )
}

export default Contact