import * as THREE from 'three';
        import { ARButton } from 'three/addons/webxr/ARButton.js';
        import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';

        // 1. DECLARACIÓN DE VARIABLES GLOBALES
        let camera, scene, renderer;
        let modelo3D, mixer; 
        const clock = new THREE.Clock(); 
        const loader = new GLTFLoader();

        // 2. OBTENER REFERENCIAS DEL DOM
        const welcomeScreen = document.getElementById('welcome-screen');
        const arUI = document.getElementById('ar-ui');
        const btnExitAR = document.getElementById('btn-exit-ar');
        const btnCapture = document.getElementById('btn-capture');
        const bottomBar = document.getElementById('bottom-bar');
        const toastMessage = document.getElementById('toast-message');
        const btnModels = document.getElementById('btn-models');
        const carouselContainer = document.getElementById('model-carousel-container');
        const btnCloseCarousel = document.getElementById('btn-close-carousel');
        const carouselDiv = document.getElementById('model-carousel');

        // 3. CONFIGURACIÓN DE MODELOS
        const modelosDisponibles = [
            { 
                id: 'huevo', 
                url: 'assets/egg.glb', 
                scale: 0.1, 
                positionY: -0.2,
                svg: `<svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#333" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="9"></circle></svg>` 
            },
            { 
                id: 'pato_prueba', 
                url: 'https://raw.githubusercontent.com/KhronosGroup/glTF-Sample-Models/master/2.0/Duck/glTF-Binary/Duck.glb', 
                scale: 0.5, 
                positionY: -0.2,
                svg: `<svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#333" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="4"></circle><path d="M22 12A10 10 0 1 1 12 2"></path></svg>` 
            }
        ];

        // 4. INICIALIZACIÓN
        init();
        animate();

        function init() {
            scene = new THREE.Scene();
            scene.visible = false; // Ocultar todo el mundo 3D hasta iniciar AR

            camera = new THREE.PerspectiveCamera(70, window.innerWidth / window.innerHeight, 0.01, 20);

            // Iluminación
            const luzAmbiental = new THREE.AmbientLight(0xffffff, 1); 
            scene.add(luzAmbiental);
            
            const luzDireccional = new THREE.DirectionalLight(0xffffff, 2);
            luzDireccional.position.set(1, 2, 1);
            scene.add(luzDireccional);

            // Renderer
            renderer = new THREE.WebGLRenderer({ antialias: false, alpha: true }); 
            renderer.setPixelRatio(1); 
            renderer.setSize(window.innerWidth, window.innerHeight);
            renderer.setClearColor(0x000000, 0); 
            renderer.xr.enabled = true;
            document.body.appendChild(renderer.domElement);
            
            // Botón AR con DOM Overlay
            const arOptions = {
                optionalFeatures: ['dom-overlay'],
                domOverlay: { root: document.getElementById('ar-ui') }
            };
            
            // CLAVE: Inyectar el botón en el contenedor, NO en el body
            document.getElementById('ar-button-container').appendChild(ARButton.createButton(renderer, arOptions));

            // Gestión de visibilidad al entrar y salir de AR
            renderer.xr.addEventListener('sessionstart', () => {
                arUI.classList.add('ar-active'); // Mostrar interfaz
                scene.visible = true; // Mostrar el modelo 3D
                welcomeScreen.classList.add('hidden'); // Desvanece la pantalla de bienvenida
            });

            renderer.xr.addEventListener('sessionend', () => {
                arUI.classList.remove('ar-active'); // Ocultar interfaz
                carouselContainer.classList.remove('show-carousel'); // Asegurar que el carrusel se cierre
                scene.visible = false; // Ocultar el modelo 3D
                welcomeScreen.classList.remove('hidden'); // Vuelve a mostrar la pantalla de bienvenida
            });

            // Llenar el carrusel con botones antes de cargar el primer modelo
            construirCarrusel();

            // Cargar modelo inicial
            cargarModelo(modelosDisponibles[0]);
           
            window.addEventListener('resize', onWindowResize, false);
        }

        function cargarModelo(modeloConfig) {
            // Limpiar anterior
            if (modelo3D) {
                scene.remove(modelo3D);
            }
            if (mixer) {
                mixer.stopAllAction();
                mixer = null;
            }

            console.log("Cargando: ", modeloConfig.url);

            // Cargar nuevo
            loader.load(modeloConfig.url, function (gltf) {
                modelo3D = gltf.scene;
                modelo3D.scale.set(modeloConfig.scale, modeloConfig.scale, modeloConfig.scale); 
                modelo3D.position.set(0, modeloConfig.positionY, -1); 
                scene.add(modelo3D);
                
                // Animaciones
                if (gltf.animations && gltf.animations.length) {
                    mixer = new THREE.AnimationMixer(modelo3D);
                    gltf.animations.forEach((clip) => {
                        mixer.clipAction(clip).play();
                    });
                }
            }, undefined, function (error) {
                console.error("Error al cargar el modelo:", error);
                const textoOriginal = toastMessage.innerText;
                toastMessage.innerText = "Error cargando modelo";
                toastMessage.style.opacity = '1';
                setTimeout(() => { 
                    toastMessage.style.opacity = '0'; 
                    setTimeout(() => { toastMessage.innerText = textoOriginal; }, 300);
                }, 3000);
            });
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
            if (mixer) mixer.update(delta);
            renderer.render(scene, camera);
        }

        // 5. EVENTOS DE LOS BOTONES
        let toastTimeout;
        let uiTimeout;

        // Botón Salir de AR (X)
        btnExitAR.addEventListener('click', () => {
            const session = renderer.xr.getSession();
            if (session) {
                session.end();
            }
        });

        // Botón Capturar (Limpiar pantalla)
        btnCapture.addEventListener('click', () => {
            bottomBar.classList.add('hide-for-capture');
            carouselContainer.classList.add('hide-for-capture');
            btnExitAR.classList.add('hide-for-capture');
            carouselContainer.classList.remove('show-carousel'); // Asegurar cierre del carrusel
            
            
            toastMessage.style.opacity = '1';
            clearTimeout(toastTimeout);
            clearTimeout(uiTimeout);

            toastTimeout = setTimeout(() => {
                toastMessage.style.opacity = '0';
            }, 2500);

            uiTimeout = setTimeout(() => {
                bottomBar.classList.remove('hide-for-capture');
                carouselContainer.classList.remove('hide-for-capture');
            }, 8000);
        });

        // Botón Abrir Carrusel
        btnModels.addEventListener('click', () => {
            carouselContainer.classList.toggle('show-carousel');
        });

        // Botón Cerrar Carrusel
        btnCloseCarousel.addEventListener('click', () => {
            carouselContainer.classList.remove('show-carousel');
        });

        // Generar botones dentro del carrusel
        function construirCarrusel() {
            carouselDiv.innerHTML = ''; 
            modelosDisponibles.forEach((modelo, index) => {
                const btnItem = document.createElement('div');
                btnItem.className = 'model-option';
                if (index === 0) btnItem.classList.add('active');
                
                btnItem.innerHTML = modelo.svg;

                btnItem.addEventListener('click', () => {
                    document.querySelectorAll('.model-option').forEach(el => el.classList.remove('active'));
                    btnItem.classList.add('active');
                    cargarModelo(modelo);
                });

                carouselDiv.appendChild(btnItem);
            });
        }