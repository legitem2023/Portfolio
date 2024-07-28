import React, { useEffect, useRef } from 'react'
import Three from '@/lib/Threejs'
import * as THREE from 'three';
import * as TWEEN from '@tweenjs/tween.js'
import { useRouter } from 'next/navigation';
import { Icon } from '@iconify/react/dist/iconify.js';
const Threejs = () => {
    const router = useRouter();
    console.log()
  const Manager = new Three();
  const sceneRef: any = useRef();
  let model: any
  useEffect(() => {
     const Element = sceneRef;
     const raycaster = new THREE.Raycaster();
     const mouse = new THREE.Vector2();
     const width = 1080;
     const height = 920;

     // Create a scene
     const scene = Manager.scene();
     const canvas = sceneRef.current;
     // Create a camera
     const camera: any = Manager.threeCamera(width,height);

     let tween = new TWEEN.Tween(camera.position).to({
        x: camera.position.x,
        y: camera.position.y + 7,
        z: camera.position.z
    }, 1000);
    tween.easing(TWEEN.Easing.Quadratic.Out);
    tween.start();
    tween.onUpdate(function () {
        Manager.updateCameraOrbit(camera, controls);
    }.bind(this));
    tween.onComplete(function () {
        Manager.updateCameraOrbit(camera, controls);
    }.bind(this));
     // Create a renderer
     const renderer: any = Manager.renderer(canvas,width,height);
     renderer.setSize(width, height);
     // Create a controls
     const controls = Manager.orbitControl(camera, renderer);
     controls.enableDamping = true;
     controls.enableZoom = true;
     controls.enableRotate = true;
     controls.enablePan = false;
  
  
     const light = Manager.Light();
     scene.add(light.A, light.B, light.C, light.D, light.E, light.F, light.G, light.H, light.I, light.J, light.K, light.L, light.M, light.light);
  
     Manager.Loadmodel(`https://hokei-storage.s3.ap-northeast-1.amazonaws.com/images/Legit/model_houses/HouseLuxury.glb`, camera, scene);
     
     const geometry = new THREE.CircleGeometry(150, 150);
  
     var loader = new THREE.TextureLoader();
     var texture = loader.load(`https://png.pngtree.com/thumb_back/fw800/background/20231022/pngtree-realistic-style-green-grass-texture-background-image_13678592.png`, function (texture) {
         texture.wrapS = texture.wrapT = THREE.RepeatWrapping;
         texture.offset.set(0, 0);
         texture.repeat.set(50, 50);
     });
  
     const material = new THREE.MeshBasicMaterial(
         {
             color: 0xc0c0c0,
             map:texture
         });
     const plane = new THREE.Mesh(geometry, material);
     plane.position.set(0, -0.5, 0);
     plane.rotation.x = -Math.PI / 2;
     plane.receiveShadow = true;
     scene.add(plane);
     let isTweening = false;
  
     const onMouseClick = (event: any) => {
         // Convert mouse coordinates to normalized device coordinates
         mouse.x = (event.clientX / window.innerWidth) * 2 - 1;
         mouse.y = - (event.clientY / window.innerHeight) * 2 + 1;
         // Update the raycaster with the current mouse position
         raycaster.setFromCamera(mouse, camera);
         // Calculate objects intersected by the ray
         const intersects = raycaster.intersectObjects([plane], true);
         // Check if the cube is intersected
         if (intersects.length > 0) {
  
             let tween = new TWEEN.Tween(camera.position).to({
                 x: intersects[0].point.x,
                 y: intersects[0].point.y + 7,
                 z: intersects[0].point.z
             }, 1000);
  
             tween.easing(TWEEN.Easing.Quadratic.Out);
             tween.start();
             tween.onUpdate(function () {
                 Manager.updateCameraOrbit(camera, controls);
             }.bind(this));
             tween.onComplete(function () {
                 Manager.updateCameraOrbit(camera, controls);
             }.bind(this));
  
  
         }
     }
  
     window.addEventListener('dblclick', onMouseClick, false);

     renderer.setAnimationLoop((time: any) => {
         TWEEN.update();
         controls.update();
        //  Manager.cameraPositionLimit(camera, controls);
         renderer.render(scene, camera);
     })
  
     const handleResize = () => {
         const newWidth = window.innerWidth;
         const newHeight = window.innerHeight;
         camera.aspect = newWidth / newHeight;
         camera.updateProjectionMatrix();
         renderer.setSize(width, height);
     };
  
     window.addEventListener('resize', handleResize);
     return () => {
         window.removeEventListener('resize', handleResize);
     };
  }, []);
  
  return (
    <div className='Main_child'>
    <div className='center_body'>
    <div className='FullStack'>
        <Icon icon="oui:editor-code-block" /><code>Home</code><Icon icon="oui:editor-code-block" />
    </div>
    <div className='AboutData'>     
              <div>

            Hey there! 
            Im Robert Marquez
            
            a passionate fullstack web developer with a knack for crafting elegant and efficient digital solutions. With over 5 years of experience in the field, I thrive on bringing ideas to life through clean, maintainable code and intuitive user interfaces.

            {/* <button className='MenuButton'><Icon icon='ic:sharp-phone'/>Contact</button>                */}
              </div>         
              <div></div>
            </div>
    <div className='THREEJS'>
          <div id='Loading'></div>
          <div id='progress'></div>
        <div className='blurBackGroundUniversal' >
            <canvas width='1080' height='920' ref={sceneRef}></canvas>
        </div>
      </div>  
    </div>
  </div>
  )
}

export default Threejs