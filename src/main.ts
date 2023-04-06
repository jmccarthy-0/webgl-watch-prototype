import * as THREE from 'three' ;
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';
import {OrbitControls} from 'three/examples/jsm/controls/OrbitControls.js';

import { gsap } from "gsap";

import * as dat from 'lil-gui';

const main = () => {
  // Global Params
  const globalParams = {
    width: window.innerWidth,
    height: window.innerHeight
  }



  // Debug GUI
  const gui = new dat.GUI();
  
  const debug = {
    envMapIntensity: 2.75
  }

  let hideDebug = true;
  const currentUrl = document.URL;
  const urlFrags = currentUrl.split('#');
  
  if (urlFrags.length > 1 && urlFrags[1] === 'debug') {
    hideDebug = false;
  }

  if (hideDebug) {
    gui.hide();
  }



  // Canvas
  const canvas = document.querySelector('canvas.webgl') as HTMLCanvasElement;



  // Scene
  const scene = new THREE.Scene();
  scene.backgroundBlurriness = .04;



  // Loaders
  const gltfLoader = new GLTFLoader();
  const cubeTextureLoader = new THREE.CubeTextureLoader();


  // Camera
  const cameraParams = {
    fov: 45,
    aspect: globalParams.width / globalParams.height,
    near: .1,
    far: 15,
    defaultPos: new THREE.Vector3(0,0,0)
  }

  const setCameraDefaultPos = () => {
    if (window.matchMedia('(min-width: 900px)').matches) {
      return new THREE.Vector3(3.3,-2, 8);
    }
    
    if (window.matchMedia('(min-width: 768px)').matches) {
      return new THREE.Vector3(4.73, -2, 9);
    } 
  
    return new THREE.Vector3(0, -1.28, 9)
  } 

  const camera = new THREE.PerspectiveCamera(
    cameraParams.fov, 
    cameraParams.aspect, 
    cameraParams.near, 
    cameraParams.far
  );

  cameraParams.defaultPos.copy(setCameraDefaultPos());
  camera.position.copy(cameraParams.defaultPos);

  scene.add(camera);
  
  // Camera Debug
  const cameraFolder = gui.addFolder('camera');
  cameraFolder.add(camera.position, 'x').min(-10).max(10).step(.001).name('pos x');
  cameraFolder.add(camera.position, 'y').min(-10).max(10).step(.001).name('pos y');
  cameraFolder.add(camera.position, 'z').min(0).max(10).step(.001).name('pos z');



  // Textures
  const envMap = cubeTextureLoader.load([
    'textures/london_studio/px.png',
    'textures/london_studio/nx.png',
    'textures/london_studio/py.png',
    'textures/london_studio/ny.png',
    'textures/london_studio/pz.png',
    'textures/london_studio/nz.png',
  ]);

  const refreshEnvMap = (scene) => {
    scene.environment = envMap;
    scene.traverse(child => {
      if (child instanceof THREE.Mesh && child.material instanceof THREE.MeshStandardMaterial) {
          child.material.envMapIntensity = debug.envMapIntensity;
      }
    });
  }

  // Cubemap Debug
  gui.add(debug, 'envMapIntensity').min(0).max(10).step(.001).onChange(() => {
    refreshEnvMap(scene);
  });

  envMap.encoding = THREE.sRGBEncoding;
  scene.background = envMap;
  scene.environment = envMap;



  // Models
  let watch: THREE.Group;
  const watchGroup = new THREE.Group();

  gltfLoader.load(
    '/model/watch01.gltf',
    gltf => {
      watch = gltf.scene;
      watch.scale.set(10,10,10);

      watch.traverse(child => {
        if (child instanceof THREE.Mesh && child.material instanceof THREE.MeshStandardMaterial) {
          child.receiveShadow = true;
          if (child.material.name !== 'glass1') {
            child.castShadow = true;
          }
        }
      });

      watchGroup.add(watch);
      scene.add(watchGroup);
    }
  );

  // Model Debug
  gui.add(watchGroup.rotation, 'x').min(-1).max(1).step(.001).name('watch rotate y');

  // Lights
  const keyLightParams = {
    color: 0xFFFFFF,
    intensity: 2.1
  }
  const keyLight = new THREE.DirectionalLight(keyLightParams.color, keyLightParams.intensity);

  keyLight.position.set(2.624, 0.903, 10);
  keyLight.shadow.camera.far = 15;
  keyLight.castShadow = true;

  scene.add(keyLight);

  // Keylight Debugger
  const keyLightFolder = gui.addFolder('key light');
  keyLightFolder.add(keyLight.position, 'x').min(-10).max(10).step(.001).name('pos x');
  keyLightFolder.add(keyLight.position, 'y').min(-10).max(10).step(.001).name('pos y');
  keyLightFolder.add(keyLight.position, 'z').min(-10).max(10).step(.001).name('pos z');
  keyLightFolder.add(keyLightParams, 'intensity').min(0).max(15).step(.1).name('intensity').onChange(() => { keyLight.intensity = keyLightParams.intensity });

  if (!hideDebug) {
    const keyLightHelper = new THREE.CameraHelper(keyLight.shadow.camera);
    scene.add(keyLightHelper);
  }
  
  

  // Renderer
  const renderer = new THREE.WebGLRenderer({
    canvas,
    antialias: true,
  });
  renderer.setSize(globalParams.width, globalParams.height);
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
  
  //renderer.physicallyCorrectLights = true;
  renderer.useLegacyLights = false;
  renderer.shadowMap.enabled = true;
  renderer.shadowMap.type = THREE.PCFShadowMap;
  renderer.outputEncoding = THREE.sRGBEncoding;
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = 2;

  gui.add(renderer, 'toneMappingExposure').min(0).max(5).step(.001).name('tone map exp');


  
  // Orbit Controls
  const controls = new OrbitControls( camera, renderer.domElement );
  controls.update();
  controls.enableDamping = true;
  controls.enableZoom = false;
  controls.enablePan =  false;

 
  // Animation Loop
  const clock = new THREE.Clock();
  let prevTime = 0;

  const animate = () => {
    controls.update();

    //const elapsedTime = clock.getElapsedTime();

    if (watch) {
      //watch.rotation.y = elapsedTime * .1;
    }

    renderer.render(scene, camera);
    window.requestAnimationFrame(animate);
  }

  animate();



  // Event Listeners
  window.addEventListener('resize', () => {
    // Reset renderer and camera dimensions
    if (window.innerWidth !== globalParams.width || window.innerHeight !== globalParams.height) {
      globalParams.width = window.innerWidth;
      globalParams.height = window.innerHeight;

      renderer.setSize(globalParams.width, globalParams.height);

      camera.aspect = globalParams.width / globalParams.height;
      camera.updateProjectionMatrix();
    }

    // Update and reset camera to default position depending on breakpoint
    const newCameraPos = setCameraDefaultPos();
    if (cameraParams.defaultPos !== newCameraPos) {
      cameraParams.defaultPos.copy(setCameraDefaultPos());

      gsap.to(camera.position, {
        x: cameraParams.defaultPos.x,
        y: cameraParams.defaultPos.y,
        z: cameraParams.defaultPos.z,
        duration: .5,
      });
    }
  });
  
  // Hide and display watch name on orbit control interaction
  const hgroup = document.getElementById('heading') as HTMLElement;
  hgroup.style.opacity = '1';

  let timeout: number;

  controls.addEventListener('start', () => {
    timeout > 0 && clearTimeout(timeout);

    if (hgroup) {
      hgroup.style.opacity = '0';
    } 
  });

  controls.addEventListener('end', () => {
    timeout = setTimeout(() => {
      if (hgroup) {
        hgroup.style.opacity = '1';
      }
    }, 5000);
  });
};

main();