'use client'
import React, { useEffect } from 'react'
import About from '../About'
import Skills from '../Skills'
import Educations from '../Educations'
import Expiriences from '../Expiriences'
import Information from '../Information'
import Projects from '../Projects'
import { useRouter } from 'next/navigation'

const Main = () => {
  
  return (
    <div className='Main'>
      <About/>
      <Skills/>
      <Educations/>
      <Expiriences/>
      <Information/>
      <Projects/>
    </div>
  )
}

export default Main