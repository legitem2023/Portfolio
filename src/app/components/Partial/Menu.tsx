
'use client'
import { Icon } from '@iconify/react';
import Link from 'next/link';
import MenuJson from './Menu.json'
import React, { useEffect, useRef } from 'react'
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import Threejs from '@/lib/Threejs'
import * as THREE from 'three';
import * as TWEEN from '@tweenjs/tween.js'

const Menu = () => {
//     const router = useRouter();
//  const Manager = new Threejs();
//  const sceneRef: any = useRef();

//  let model: any

//  useEffect(() => {
//      const Element = sceneRef;//(document.getElementById("RealStatecanvas_container") as HTMLDivElement);
//      const raycaster = new THREE.Raycaster();
//      const mouse = new THREE.Vector2();
//      const width = Element.clientWidth;
//      const height = Element.clientHeight;
//      // Create a scene
//      const scene = new THREE.Scene();
//      const canvas = sceneRef.current;
//      // Create a camera
//      const camera: any = new THREE.PerspectiveCamera(35, width / height, 0.1, 1000);
//      camera.position.z = 5;
//      camera.position.y = 1;
//      // Create a renderer
//      const renderer: any = new THREE.WebGLRenderer({ antialias: true, canvas: canvas,alpha:true });
//      renderer.setSize(width, height);

//      // Create a controls
//      const controls = Manager.orbitControl(camera, renderer);
//      controls.enableDamping = true;
//      controls.enableZoom = true;
//      controls.enableRotate = true;
//      controls.enablePan = false;


//      const light = Manager.Light();
//      scene.add(light.A, light.B, light.C, light.D, light.E, light.F, light.G, light.H, light.I, light.J, light.K, light.L, light.M, light.light);

//      Manager.Loadmodel(`https://hokei-storage.s3.ap-northeast-1.amazonaws.com/images/Legit/model_houses/modern_luxury_villa_house_building_home.glb`, camera, scene);

//      const geometry = new THREE.CircleGeometry(150, 150);

//      var loader = new THREE.TextureLoader();
//      var texture = loader.load(`https://hokei-storage.s3.ap-northeast-1.amazonaws.com/images/Legit/Portfolio/Projects/Me_2.png`, function (texture) {
//          texture.wrapS = texture.wrapT = THREE.RepeatWrapping;
//          texture.offset.set(0, 0);
//          texture.repeat.set(100, 100);
//      });

//      const material = new THREE.MeshBasicMaterial(
//          {
//              color: 0xc0c0c0,
//              map:texture
//          });
//      const plane = new THREE.Mesh(geometry, material);
//      plane.position.set(0, -0.5, 0);
//      plane.rotation.x = -Math.PI / 2;
//      plane.receiveShadow = true;
//      scene.add(plane);
//      let isTweening = false;



//      const onMouseClick = (event: any) => {
//          // Convert mouse coordinates to normalized device coordinates
//          mouse.x = (event.clientX / window.innerWidth) * 2 - 1;
//          mouse.y = - (event.clientY / window.innerHeight) * 2 + 1;
//          // Update the raycaster with the current mouse position
//          raycaster.setFromCamera(mouse, camera);
//          // Calculate objects intersected by the ray
//          const intersects = raycaster.intersectObjects([plane], true);
//          // Check if the cube is intersected
//          if (intersects.length > 0) {

//              let tween = new TWEEN.Tween(camera.position).to({
//                  x: intersects[0].point.x,
//                  y: intersects[0].point.y + 7,
//                  z: intersects[0].point.z
//              }, 1000);

//              tween.easing(TWEEN.Easing.Quadratic.Out);
//              tween.start();
//              tween.onUpdate(function () {
//                  Manager.updateCameraOrbit(camera, controls);
//              }.bind(this));
//              tween.onComplete(function () {
//                  Manager.updateCameraOrbit(camera, controls);
//              }.bind(this));


//          }
//      }

//      window.addEventListener('dblclick', onMouseClick, false);



//      renderer.setAnimationLoop((time: any) => {
//          TWEEN.update();
//          controls.update();
//          // Manager.cameraPositionLimit(camera, controls);
//          renderer.render(scene, camera);
//      })

//      const handleResize = () => {
//          const newWidth = window.innerWidth;
//          const newHeight = window.innerHeight;
//          camera.aspect = newWidth / newHeight;
//          camera.updateProjectionMatrix();
//          renderer.setSize(width, height);
//      };

//      window.addEventListener('resize', handleResize);
//      return () => {
//          window.removeEventListener('resize', handleResize);
//      };
//  }, []);


  return (
    <div className='Menu'>
        {/* <div id='Loading'></div> */}
        {/* <div id='progress'></div> */}
        <div className='blurBackGroundUniversal'>
            {/* <canvas width='300' height='200' ref={sceneRef}></canvas> */}
        </div>
        <div className='divide_menu '>
        <div className='ProfileIcon'><Image src="https://hokei-storage.s3.ap-northeast-1.amazonaws.com/images/Legit/Portfolio/Projects/Me.png" height='300' width='300' alt='1'/></div>
        <div>
        {MenuJson.map((item:any,i:number)=>(
            <div key={i} className='MenuItem' >
                <a href={`http://localhost:3000/#`+item.Link}>
                    <div className='MenuItemLabel'><Icon icon={item.Icon}/>
                        <code className='closeMOB'>{item.Name}</code>
                    </div>
                </a>
            </div>
        ))}
        </div>

        <div></div>
        </div>

    </div>
  )
}

export default Menu