import { Icon } from '@iconify/react/dist/iconify.js';
import Image from 'next/image';
import React, { useEffect, useState } from 'react'

const Projects = () => {
  const [useProject,setProject] = useState([]);

  useEffect(()=>{
    async function fetchProjects() {
      try {
        const response = await fetch('/api/Projects');
        if (!response.ok) {
          throw new Error('Network response was not ok');
        }
        const data = await response.json();
        setProject(data);
      } catch (error) {
        console.error('Failed to fetch skills:', error);
      }
    }

    fetchProjects();
  },[])

  return (
    <div className='Main_child' id='Projects'>
          <div className='center_body'>
              <div className='FullStack'>
                  <Icon icon="oui:editor-code-block" /><code>Projects</code><Icon icon="oui:editor-code-block" />
            </div>
            <div className='skillThumb'>
            {useProject.map((skill:any,i:number)=>(
                <div className='skillThumbData' key={i}>
                  <Image src={skill.Image} width='150' height='150' alt='1'/>
                  <code className='ProjName'>{skill.Name}</code>
                  <code className='ProjName'><a href={skill.Link}>Visit</a></code>
                </div>
              ))}
            </div>
          </div>
    </div>
  )
}

export default Projects