/**
 * Este módulo contiene toda la lógica de Three.js.
 * 8th Wall usa este patrón en lugar de renderer.setAnimationLoop()
 */
const dinoWebARPipeline = () => {
  let model;
  let mixer;
  const clock = new THREE.Clock();

  return {
    // El nombre del módulo (requerido por XR8)
    name: 'dinowebar-pipeline',

    // onStart se llama una vez cuando 8th Wall ha inicializado la cámara
    onStart: ({ canvas }) => {
      // Obtenemos las instancias creadas automáticamente por 8th Wall
      const { scene, camera, renderer } = XR8.Threejs.xrScene();

      // Añadimos iluminación a la escena
      const ambientLight = new THREE.AmbientLight(0xffffff, 1.0);
      scene.add(ambientLight);

      const directionalLight = new THREE.DirectionalLight(0xffffff, 2.0);
      directionalLight.position.set(5, 10, 5);
      directionalLight.castShadow = true;
      scene.add(directionalLight);

      // Inicializamos el cargador de modelos de Three.js
      const loader = new THREE.GLTFLoader();

      // Asegúrate de que la ruta coincida con la ubicación de tu archivo en el servidor
      loader.load(
        './assets/egg.glb',
        (gltf) => {
          model = gltf.scene;
          
          // Ajustamos la escala del modelo (modifica estos valores según necesites)
          model.scale.set(0.5, 0.5, 0.5);
          
          // Posicionamos el modelo 2 metros frente a la cámara al iniciar
          model.position.set(0, 0, -2);
          
          // Habilitamos sombras si es necesario
          model.traverse((node) => {
            if (node.isMesh) {
              node.castShadow = true;
              node.receiveShadow = true;
            }
          });

          scene.add(model);

          // Si el modelo tiene animaciones, preparamos el AnimationMixer
          if (gltf.animations && gltf.animations.length > 0) {
            mixer = new THREE.AnimationMixer(model);
            const action = mixer.clipAction(gltf.animations[0]);
            action.play();
          }
          
          console.log('Modelo cargado exitosamente en el entorno AR.');
        },
        // Progreso de carga
        (xhr) => {
          console.log((xhr.loaded / xhr.total) * 100 + '% cargado');
        },
        // Manejo de errores
        (error) => {
          console.error('Ocurrió un error al cargar el modelo 3D:', error);
        }
      );
    },

    // onUpdate se llama en cada frame, reemplazando a requestAnimationFrame
    onUpdate: () => {
      const delta = clock.getDelta();

      // Si el modelo está cargado, aplicamos una rotación constante
      if (model) {
        model.rotation.y += 0.01;
      }

      // Si hay animaciones activas, las actualizamos
      if (mixer) {
        mixer.update(delta);
      }
    },
  };
};

const initXR8 = () => {
  // Asegúrate de tener un <canvas id="ar-canvas"></canvas> en tu index.html
  const canvas = document.getElementById('ar-canvas');
  
  if (!canvas) {
    console.error('No se encontró el canvas. Verifica que el ID en index.html sea "ar-canvas".');
    return;
  }

  // Registramos los módulos en la tubería de 8th Wall
  XR8.addCameraPipelineModules([
    // Dibuja el feed de video de la cámara en el canvas
    XR8.GlTextureRenderer.pipelineModule(), 
    
    // Conecta la cámara de 8th Wall con la de Three.js
    XR8.Threejs.pipelineModule(),           
    
    // Habilita el tracking espacial de 6 grados de libertad (SLAM)
    XR8.XrController.pipelineModule(),      
    
    // Inyectamos nuestro módulo personalizado con la lógica del Dinosaurio/Huevo
    dinoWebARPipeline(),                    
  ]);

  // Configuramos e iniciamos la experiencia
  XR8.run({ 
    canvas: canvas,
    allowedDevices: XR8.XrConfig.device().ANY, // Permite móviles y pruebas en escritorio
  });
};

window.onload = () => {
  // Verificamos si el objeto XR8 ya está disponible globalmente
  if (window.XR8) {
    initXR8();
  } else {
    // Si no, esperamos al evento que dispara el script de xr.js al terminar de cargar
    window.addEventListener('xrloaded', initXR8);
  }
};