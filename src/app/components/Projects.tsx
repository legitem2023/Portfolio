import { Icon } from '@iconify/react/dist/iconify.js';
import Image from 'next/image';
import React, { useEffect, useState } from 'react'
import Loading from './Partial/Loading';

const Projects = () => {
  const [useProject, setProject] = useState([]);
  const [loading, setLoading] = useState<boolean>(true); // State to handle loading

  useEffect(() => {
    async function fetchProjects() {
      try {
        setLoading(true); // Start loading
        const response = await fetch('/api/Projects');
        if (!response.ok) {
          throw new Error('Network response was not ok');
        }
        const data = await response.json();
        setProject(data);
      } catch (error) {
        console.error('Failed to fetch skills:', error);
      } finally {
        setLoading(false); // Stop loading after success or error
      }
    }
    fetchProjects();
  }, [])

  return (
    <div className='Main_child' id='Projects'>
      {loading?<Loading/>:""}
      <div className='center_body'>
        <div className='FullStack'>
          <Icon icon="grommet-icons:projects" /><code>Projects</code>
        </div>
        <div className='skillThumb'>
          {useProject.map((skill: any, i: number) => (
            <div className='skillThumbData' key={i}>
              <a href={skill.Link} target="_blank"><Image src={skill.Image} width='300' height='200' alt='1' /></a>
              <code className='ProjName'>{skill.Name}</code>
              <code className='ProjName'>{skill.Language}</code>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

export default Projects