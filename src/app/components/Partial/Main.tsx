'use client'
import React, { useEffect, useRef } from 'react'
import About from '../About'
import Skills from '../Skills'
import Projects from '../Projects'
import { useRouter } from 'next/navigation'
import Contact from '../Contact'
import Threejs from '../Threejs'

const Main = () => {


  return (
    <div className='Main'>
      {/* <Threejs/> */}
      <About/>
      <Skills/>
      <Projects/>
      <Contact/>
    </div>
  )
}

export default Main