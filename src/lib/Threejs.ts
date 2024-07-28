import * as THREE from 'three';
import { GLTFLoader } from 'three/examples/jsm/Addons.js';
import { RGBELoader } from 'three/examples/jsm/Addons.js';
import { DRACOLoader } from 'three/examples/jsm/Addons.js';
import { OrbitControls } from 'three/examples/jsm/Addons.js';
import Router, { useRouter } from 'next/router';

class Three {
    public scene() {
        return new THREE.Scene()
    }
    public renderer(canvas: any, width: any, height: any) {
        const renderer = new THREE.WebGLRenderer({
            preserveDrawingBuffer: true,
            canvas: canvas,
            antialias: true,
            alpha: true,
            precision: 'highp',
        });
        
        // renderer.autoClear = false;
        // renderer.clear();
        // renderer.clearDepth();
        // renderer.setClearColor(0xffffff);
        renderer.setSize(width, height);
        // renderer.setPixelRatio(window.devicePixelRatio || 1);
        // renderer.shadowMap.enabled = true;
        // renderer.shadowMap.type = THREE.PCFSoftShadowMap;
        // renderer.toneMapping = THREE.ReinhardToneMapping;
        return renderer;
    }
    public threeCamera(width: any, height: any) {
        const camera = new THREE.PerspectiveCamera(35, width / height, 0.1, 1000);
        camera.position.set(0, 10, -70);
        return camera;
    }
    public HDRLighting(path: string) {
        const HDR = new RGBELoader()
            .load(path, function (texture: any) {
                texture.mapping = THREE.EquirectangularReflectionMapping;
                // console.log(texture);
                return texture;
            })
        return HDR;
    }
    public Light() {
        const A = new THREE.DirectionalLight(0xFFFFFF, 1);
        A.position.set(12.119, 10.000, 12.311);
        const B = new THREE.DirectionalLight(0xFFFFFF, 1);
        B.position.set(12.124, 10.000, -12.773);
        const C = new THREE.DirectionalLight(0xFFFFFF, 1);
        C.position.set(-12.856, 10.000, 12.346);
        const D = new THREE.DirectionalLight(0xFFFFFF, 1);
        D.position.set(-12.871, 10.000, -12.723);
        const E = new THREE.DirectionalLight(0xFFFFFF, 1);
        E.position.set(12.119, -10.000, 12.311);
        const F = new THREE.DirectionalLight(0xFFFFFF, 1);
        F.position.set(12.124, -10.000, -12.773);
        const G = new THREE.DirectionalLight(0xFFFFFF, 1);
        G.position.set(-12.856, -10.000, 12.346);
        const H = new THREE.DirectionalLight(0xFFFFFF, 1);
        H.position.set(-12.871, -10.000, -12.723);
        const I = new THREE.PointLight(0xFFffff, 0.1);
        I.position.set(0, 1.197, 0)
        const J = new THREE.PointLight(0xffFFff, 0.1);
        J.position.set(0, 0, 2.208)
        const K = new THREE.PointLight(0xffffFF, 0.1);
        K.position.set(0, 0, -2.208)
        const L = new THREE.PointLight(0xFFFFFF, 0.1);
        L.position.set(-2.208, 0, 0)
        const M = new THREE.PointLight(0xFFFFFF, 0.1);
        M.position.set(2.208, 0, 0)
        const N = new THREE.DirectionalLight(0xFF0000, 0.5);
        N.position.set(2.140, 10.000, 2.140);
        const O = new THREE.DirectionalLight(0xFF0000, 0.5);
        O.position.set(2.140, 10.000, -2.140);
        const P = new THREE.DirectionalLight(0xFF0000, 0.5);
        P.position.set(-2.140, 10.000, 2.140);
        const Q = new THREE.DirectionalLight(0xFF0000, 0.5);
        Q.position.set(-2.140, 10.000, -2.140);
        const N1 = new THREE.DirectionalLight(0x00FF00, 0.5);
        N1.position.set(2.140, 9.000, 2.140);
        const O1 = new THREE.DirectionalLight(0x00FF00, 0.5);
        O1.position.set(2.140, 9.000, -2.140);
        const P1 = new THREE.DirectionalLight(0x00FF00, 0.5);
        P1.position.set(-2.140, 9.000, 2.140);
        const Q1 = new THREE.DirectionalLight(0x00FF00, 0.5);
        Q1.position.set(-2.140, 9.000, -2.140);
        const N2 = new THREE.DirectionalLight(0x0000FF, 0.5);
        N2.position.set(2.140, 8.000, 2.140);
        const O2 = new THREE.DirectionalLight(0x0000FF, 0.5);
        O2.position.set(2.140, 8.000, -2.140);
        const P2 = new THREE.DirectionalLight(0x0000FF, 0.5);
        P2.position.set(-2.140, 8.000, 2.140);
        const Q2 = new THREE.AmbientLight(0xFF0000); // Soft white ambient light
        const light = new THREE.DirectionalLight(0x717171, 1);

        light.position.set(0, 100, 40);
        light.castShadow = true;
        light.shadow.mapSize.width = 150; // Set larger shadow map width
        light.shadow.mapSize.height = 150; // Set larger shadow map height
        light.shadow.camera.near = 5.5; // Set near value for the shadow camera
        light.shadow.camera.far = 500; // Set far value for the shadow camera
        light.shadow.camera.left = -40; // Adjust the shadow camera left
        light.shadow.camera.right = 40; // Adjust the shadow camera right
        light.shadow.camera.top = 40; // Adjust the shadow camera top
        light.shadow.camera.bottom = -40; // Adjust the shadow camera bottom
        light.shadow.radius = 2; // Set shadow map blur radius for softening\
        return { A, B, C, D, E, F, G, H, I, J, K, L, M, N, O, P, Q, N1, O1, P1, Q1, N2, O2, P2, Q2, light };
    }
    public Loadmodel(path: any, camera: any, scene: any) {
        let model:any;
        const manager = new THREE.LoadingManager();
        manager.onStart = function (url, itemsLoaded, itemsTotal) {
            const loadingElement = document.getElementById('Loading') as HTMLDivElement;
            loadingElement.style.display = 'flex';
        };
        manager.onLoad = function () {
            const loadingElement = document.getElementById('Loading') as HTMLDivElement;
            loadingElement.style.display = 'none';
            const Element = document.getElementById('progress') as HTMLDivElement; // You're missing a declaration for 'Element'
            Element.style.display = 'none';
        };
        manager.onProgress = function (url, itemsLoaded, itemsTotal) {
            const loadingElement = document.getElementById('Loading') as HTMLDivElement;
            loadingElement.style.display = 'flex';
            const Element = document.getElementById('progress') as HTMLDivElement; // You're missing a declaration for 'Element'
            const percentComplete = ((itemsLoaded / itemsTotal) * 100).toFixed(0);
            Element.innerText = `Progress: ${percentComplete}%`;
        };
        manager.onError = function (url) {
            const loadingElement = document.getElementById('Loading') as HTMLDivElement;
            loadingElement.style.display = 'flex';
        };
        const loader = new GLTFLoader(manager);
        const dracoLoader = new DRACOLoader().setDecoderPath('https://www.gstatic.com/draco/versioned/decoders/').setDecoderConfig({ type: 'js' });
        loader.setDRACOLoader(dracoLoader);
        loader.load(path, (gltf: any) => {
            model = gltf.scene;
            // model.position.set(0, -0.5, 0);
            if (!model) return;
            var box = new THREE.Box3().setFromObject(model);
            var center = box.getCenter(new THREE.Vector3());
            var size = box.getSize(new THREE.Vector3());
            var maxDim = Math.max(size.x, size.y, size.z);
            var fov = camera.fov * (Math.PI / 180);
            model.castShadow = true;
            model.receiveShadow = true;
            model.traverse((child: any) => {
                if (child.isMesh) {
                    child.castShadow = true;
                    child.receiveShadow = true;
                }
            })
            scene.add(model);
        },
            // onProgress callback
            function (xhr: any) {
                const loadingElement = document.getElementById('progress') as HTMLDivElement;
                if (xhr.lengthComputable) {
                    const percentComplete = xhr.loaded / xhr.total * 100;
                    loadingElement.innerText = `Downloading: ${Math.round(percentComplete)}%`;
                } else {
                    loadingElement.innerText = 'Loading...';
                }
            });
       
    }
    public GroundLoadmodel(path: any, camera: any, scene: any) {
        let model:any;
        const manager = new THREE.LoadingManager();
        manager.onStart = function (url, itemsLoaded, itemsTotal) {
            const loadingElement = document.getElementById('Loading') as HTMLDivElement;
            loadingElement.style.display = 'flex';
        };
        manager.onLoad = function () {
            const loadingElement = document.getElementById('Loading') as HTMLDivElement;
            loadingElement.style.display = 'none';
            const Element = document.getElementById('progress') as HTMLDivElement; // You're missing a declaration for 'Element'
            Element.style.display = 'none';
        };
        manager.onProgress = function (url, itemsLoaded, itemsTotal) {
            const loadingElement = document.getElementById('Loading') as HTMLDivElement;
            loadingElement.style.display = 'flex';
            const Element = document.getElementById('progress') as HTMLDivElement; // You're missing a declaration for 'Element'
            const percentComplete = ((itemsLoaded / itemsTotal) * 100).toFixed(0);
            Element.innerText = `Progress: ${percentComplete}%`;
        };
        manager.onError = function (url) {
            const loadingElement = document.getElementById('Loading') as HTMLDivElement;
            loadingElement.style.display = 'flex';
        };
        const loader = new GLTFLoader(manager);
        const dracoLoader = new DRACOLoader().setDecoderPath('https://www.gstatic.com/draco/versioned/decoders/').setDecoderConfig({ type: 'js' });
        loader.setDRACOLoader(dracoLoader);
        loader.load(path, (gltf: any) => {
            model = gltf.scene;
            // model.position.set(0, -0.5, 0);
            if (!model) return;
            var box = new THREE.Box3().setFromObject(model);
            var center = box.getCenter(new THREE.Vector3());
            var size = box.getSize(new THREE.Vector3());
            var maxDim = Math.max(size.x, size.y, size.z);
            var fov = camera.fov * (Math.PI / 180);
            model.castShadow = true;
            model.receiveShadow = true;
            model.traverse((child: any) => {
                if (child.isMesh) {
                    child.castShadow = true;
                    child.receiveShadow = true;
                }
            })
            model.position.set(0,-285,0)
            scene.add(model);
        },
            // onProgress callback
            function (xhr: any) {
                const loadingElement = document.getElementById('progress') as HTMLDivElement;
                if (xhr.lengthComputable) {
                    const percentComplete = xhr.loaded / xhr.total * 100;
                    loadingElement.innerText = `Downloading: ${Math.round(percentComplete)}%`;
                } else {
                    loadingElement.innerText = 'Loading...';
                }
            });
            return model;
    }
    public orbitControl(camera: any, renderer: any) {
        const controls = new OrbitControls(camera, renderer.domElement);
        controls.enableDamping = true;
        controls.enableZoom = true;
        controls.enableRotate = true;
        controls.enablePan = false;
        return controls;
    }
    public updateCameraOrbit = (camera: any, controls: any) => {
        var forward = new THREE.Vector3();
        camera.getWorldDirection(forward);
        controls.target.copy(camera.position).add(forward);
        controls.update();
    };
}
export default Three
