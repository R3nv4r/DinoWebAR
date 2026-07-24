  import * as THREE from 'three';
        import { ARButton } from 'three/addons/webxr/ARButton.js';
        import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';

        let camera, scene, renderer;
        let modelo3D;
        let mixer; // Controlador para las animaciones del modelo
        const clock = new THREE.Clock(); // Necesario para calcular el tiempo de las animaciones

        init();
        animate();

        function init() {
            scene = new THREE.Scene();

            camera = new THREE.PerspectiveCamera(70, window.innerWidth / window.innerHeight, 0.01, 20);

            // Luces mejoradas para modelos 3D texturizados
            const luzAmbiental = new THREE.AmbientLight(0xffffff, 1); 
            scene.add(luzAmbiental);
            
            const luzDireccional = new THREE.DirectionalLight(0xffffff, 2);
            luzDireccional.position.set(1, 2, 1);
            scene.add(luzDireccional);

            renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true }); 
            renderer.setPixelRatio(window.devicePixelRatio);
            renderer.setSize(window.innerWidth, window.innerHeight);
            renderer.xr.enabled = true;
            
            document.body.appendChild(renderer.domElement);
            document.body.appendChild(ARButton.createButton(renderer));

            // Instanciamos el cargador GLTF
            const loader = new GLTFLoader();
            
            // ¡IMPORTANTE! Cambia 'tu_modelo.glb' por la ruta a tu archivo (ej. 'assets/dinosaurio.glb')
            loader.load('assets/egg.glb', function (gltf) {
                modelo3D = gltf.scene;
                
                // Escala el modelo (los modelos .glb a veces son gigantes o minúsculos por defecto)
                modelo3D.scale.set(0.1, 0.1, 0.1); 
                // Colócalo frente a la cámara (Z negativo es hacia adelante) y un poco abajo (Y negativo)
                modelo3D.position.set(0, -0.2, -1); 
                
                scene.add(modelo3D);

                // Si tu modelo tiene animaciones incluidas, las reproducimos
                if (gltf.animations && gltf.animations.length) {
                    mixer = new THREE.AnimationMixer(modelo3D);
                    gltf.animations.forEach((clip) => {
                        mixer.clipAction(clip).play();
                    });
                }
            }, undefined, function (error) {
                console.error('Ocurrió un error al cargar el modelo .glb:', error);
            });

            window.addEventListener('resize', onWindowResize, false);
        }

        function onWindowResize() {
            camera.aspect = window.innerWidth / window.innerHeight;
            camera.updateProjectionMatrix();
            renderer.setSize(window.innerWidth, window.innerHeight);
        }

        function animate() {
            renderer.setAnimationLoop(render);
        }

        function render() {
            const delta = clock.getDelta();

            // Actualizar el frame de la animación si el modelo la tiene
            if (mixer) {
                mixer.update(delta);
            }

            // Opcional: hacemos que el modelo rote suavemente sobre su eje Y
            if (modelo3D) {
                modelo3D.rotation.y += 0.005;
            }
            
            renderer.render(scene, camera);
        }