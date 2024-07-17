import Image from 'next/image'
import React from 'react'

const Skills = () => {
  return (
    <div className='Main_child' id='Skills'>
        <div className='skillThumb'>
            <div>
              <img src='http://192.168.100.86:3000/php.png' width='100' height='100' alt='1'/>
              <code>Classic PHP</code>
              <code>100%</code>
            </div>
            <div>
              <img src='http://192.168.100.86:3000/js-jquery.png' width='100' height='100' alt='1'/>
              <code>Javascript/JQuery</code>
              <code>100%</code>
            </div>
            <div>
              <img src='http://192.168.100.86:3000/html.png' width='100' height='100' alt='1'/>
              <code>HTML/CSS</code>
              <code>100%</code>
            </div>
            <div>
              <img src='http://192.168.100.86:3000/node.png' width='100' height='100' alt='1'/>
              <code>NodeJS</code>
              <code>100%</code>
            </div>

            <div>
              <img src='http://192.168.100.86:3000/next.png' width='100' height='100' alt='1'/>
              <code>React/NextJS</code>
              </div>
            <div>
              <img src='http://192.168.100.86:3000/prisma.png' width='100' height='100' alt='1'/>
              <code>Prisma</code>
              <code>100%</code>
              </div>
            <div>
              <img src='http://192.168.100.86:3000/graphql-apollo.webp' width='100' height='100' alt='1'/>
              <code>Apollo GraphQL</code>
              <code>100%</code>
              </div>
            <div>
              <img src='http://192.168.100.86:3000/threejs.png' width='100' height='100' alt='1'/>
              <code>ThreeJS</code>
              <code>100%</code>
              </div>
            <div>
              <img src='http://192.168.100.86:3000/Mysql.png' width='100' height='100' alt='1'/>
              <code>MySQL/SQlite</code>
              <code>100%</code>
            </div>
        </div>
    </div>
  )
}

export default Skills