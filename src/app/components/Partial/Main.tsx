'use client'
import React, { useEffect } from 'react'
import About from '../About'
import Skills from '../Skills'
import Projects from '../Projects'
import { useRouter } from 'next/navigation'
import Contact from '../Contact'

const Main = () => {
  
  return (
    <div className='Main'>
      <About/>
      <Skills/>
      <Projects/>
      <Contact/>
    </div>
  )
}

export default Main