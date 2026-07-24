        import * as THREE from 'three';
        import { ARButton } from 'three/addons/webxr/ARButton.js';

        let camera, scene, renderer;
        let modelo3D;

        init();
        animate();

        function init() {
            // 1. Crear la Escena
            scene = new THREE.Scene();

            // 2. Configurar la Cámara Virtual
            camera = new THREE.PerspectiveCamera(70, window.innerWidth / window.innerHeight, 0.01, 20);

            // 3. Añadir Iluminación para que el modelo se vea bien
            const luzAmbiental = new THREE.HemisphereLight(0xffffff, 0xbbbbff, 1);
            luzAmbiental.position.set(0.5, 1, 0.25);
            scene.add(luzAmbiental);

            // 4. Configurar el Renderizador
            // IMPORTANTE: alpha: true permite que el fondo sea transparente para ver la cámara real
            renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true }); 
            renderer.setPixelRatio(window.devicePixelRatio);
            renderer.setSize(window.innerWidth, window.innerHeight);
            
            // Habilitamos WebXR en el renderizador
            renderer.xr.enabled = true;
            document.body.appendChild(renderer.domElement);

            // 5. Añadir el botón oficial de WebXR
            // Este botón gestiona automáticamente el permiso de cámara y la sesión 'immersive-ar'
            document.body.appendChild(ARButton.createButton(renderer));

            // 6. Crear un modelo 3D (Un Icosaedro flotante)
            const geometria = new THREE.IcosahedronGeometry(0.1, 1); // Radio de 10cm
            const material = new THREE.MeshPhongMaterial({
                color: 0x00ff88,
                shininess: 10,
                flatShading: true,
                transparent: true,
                opacity: 0.9
            });
            
            modelo3D = new THREE.Mesh(geometria, material);
            // Lo posicionamos medio metro frente a la cámara (Z: -0.5)
            modelo3D.position.set(0, 0, -0.5); 
            scene.add(modelo3D);

            // Manejar redimensionamiento de pantalla
            window.addEventListener('resize', onWindowResize, false);
        }

        function onWindowResize() {
            camera.aspect = window.innerWidth / window.innerHeight;
            camera.updateProjectionMatrix();
            renderer.setSize(window.innerWidth, window.innerHeight);
        }

        function animate() {
            // Usamos setAnimationLoop en lugar de requestAnimationFrame para compatibilidad con WebXR
            renderer.setAnimationLoop(render);
        }

        function render() {
            // Rotamos el modelo continuamente
            if (modelo3D) {
                modelo3D.rotation.x += 0.01;
                modelo3D.rotation.y += 0.02;
            }
            
            // Renderizamos la escena
            renderer.render(scene, camera);
        }