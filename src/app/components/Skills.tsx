import { Icon } from '@iconify/react/dist/iconify.js';
import Image from 'next/image'
import React, { useEffect, useState } from 'react'
import Loading from './Partial/Loading';

const Skills = () => {
  const [useSkills, setSkills] = useState([]);
  const [loading, setLoading] = useState<boolean>(true); // State to handle loading

  useEffect(() => {
    async function fetchSkills() {
      try {
        setLoading(true); // Start loading

        const response = await fetch('/api/skills');
        if (!response.ok) {
          throw new Error('Network response was not ok');
        }
        const data = await response.json();
        setSkills(data);
      } catch (error) {
        console.error('Failed to fetch skills:', error);
      }finally {
        setLoading(false); // Stop loading after success or error
      }
    }

    fetchSkills();
  }, [])

  return (
    <div className='Main_child' id='Skills'>
            {loading?<Loading/>:""}
      <div className='center_body'>
        <div className='FullStack'>
          <Icon icon="game-icons:skills" /><code>Skills</code>
        </div>
        <div className='skillThumb'>
          {useSkills.map((skill: any, i: number) => (
            <div className='skillThumbData' key={i}>
              <Image src={skill.Image} width='200' height='200' alt='1' /> 

              <code className='skillName'>{skill.Name}</code>
              <code className='ProgressContainer'>
                <div className={`ProgressLabel`} style={{width:skill.Level}}>{skill.Level}</div>
              </code>
              <code className='skillName flex justify-center item-center p-2'>Level</code>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

export default Skills