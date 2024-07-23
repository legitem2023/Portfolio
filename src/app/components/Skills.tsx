import { Icon } from '@iconify/react/dist/iconify.js';
import Image from 'next/image'
import React, { useEffect, useState } from 'react'

const Skills = () => {
  const [useSkills,setSkills] = useState([]);

  useEffect(()=>{
    async function fetchSkills() {
      try {
        const response = await fetch('/api/skills');
        if (!response.ok) {
          throw new Error('Network response was not ok');
        }
        const data = await response.json();
        setSkills(data);
      } catch (error) {
        console.error('Failed to fetch skills:', error);
      }
    }

    fetchSkills();
  },[])

  return (
    <div className='Main_child' id='Skills'>
      <div className='center_body'>
      <div className='FullStack'>
              <Icon icon="oui:editor-code-block" /><code>Skills</code><Icon icon="oui:editor-code-block" />
      </div>
        <div className='skillThumb'>
          {useSkills.map((skill:any,i:number)=>(
            <div className='skillThumbData' key={i}>
              <Image src={skill.Image} width='100' height='100' alt='1'/>
              <code>{skill.Name}</code>
              <code className='ProgressContainer'>
                <div className='Progress' style={{width:skill.Level}}></div>
                <div className='ProgressLabel'>{skill.Level}</div>  
              </code>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

export default Skills