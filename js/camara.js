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

        // preserveDrawingBuffer es VITAL para que toDataURL() funcione y no devuelva negro
        renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true, preserveDrawingBuffer: true }); 
        renderer.setPixelRatio(window.devicePixelRatio);
        renderer.setSize(window.innerWidth, window.innerHeight);
        renderer.xr.enabled = true;
        
        document.body.appendChild(renderer.domElement);
        
        const arOptions = {
            optionalFeatures: ['dom-overlay'],
            domOverlay: { root: document.getElementById('ar-ui') }
        };
        document.body.appendChild(ARButton.createButton(renderer, arOptions));

        // Eventos para mostrar/ocultar la UI al entrar y salir del modo Inmersivo
        renderer.xr.addEventListener('sessionstart', () => {
            document.getElementById('ar-ui').style.display = 'flex';
            actualizarGaleria(); 
        });
        renderer.xr.addEventListener('sessionend', () => {
            document.getElementById('ar-ui').style.display = 'none';
            document.getElementById('gallery-modal').style.display = 'none';
        });

        setupUI(); // Vinculamos los eventos de los botones

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

       
        renderer.render(scene, camera);
    
    }

    const galeriaImagenes = [];

    function setupUI() {
        const btnCapture = document.getElementById('btn-capture');
        const btnGallery = document.getElementById('btn-gallery');
        const btnCloseGallery = document.getElementById('btn-close-gallery');
        const modalGallery = document.getElementById('gallery-modal');
        const btnDownload = document.getElementById('btn-download');

        // --- Acción: Botón Central de Captura ---
        btnCapture.addEventListener('click', () => {
            // Efecto sutil de destello blanco
            const overlay = document.getElementById('ar-ui');
            overlay.style.backgroundColor = 'rgba(255, 255, 255, 0.5)';
            setTimeout(() => { overlay.style.backgroundColor = 'transparent'; }, 150);

            // Capturar el modelo 3D renderizado
            const imgData = renderer.domElement.toDataURL('image/png');
            galeriaImagenes.push(imgData);
            actualizarGaleria();
        });

        // --- Acción: Abrir Galería ---
        btnGallery.addEventListener('click', () => {
            modalGallery.style.display = 'flex';
        });

        // --- Acción: Cerrar Galería ---
        btnCloseGallery.addEventListener('click', () => {
            modalGallery.style.display = 'none';
        });

        // --- Acción: Descargar Foto ---
        btnDownload.addEventListener('click', () => {
            if (galeriaImagenes.length === 0) {
                console.log('No hay fotos para descargar');
                return;
            }
            // Descarga la foto más reciente capturada
            const link = document.createElement('a');
            link.download = 'mi-captura-ar.png';
            link.href = galeriaImagenes[galeriaImagenes.length - 1];
            link.click();
        });
    }

    // --- Acción: Refrescar la cuadrícula de fotos ---
    function actualizarGaleria() {
        const grid = document.getElementById('gallery-grid');
        if(!grid) return;
        
        grid.innerHTML = ''; 

        // Mostrar 8 celdas simulando la cuadrícula de tu imagen diseño
        for (let i = 0; i < 8; i++) {
            const item = document.createElement('div');
            item.className = 'gallery-item';
            
            if (i < galeriaImagenes.length) {
                const img = document.createElement('img');
                img.src = galeriaImagenes[i];
                item.appendChild(img);
            } else {
                // Ícono de "montaña" por defecto para los huecos vacíos
                item.innerHTML = '<svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#999" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="3" width="18" height="18" rx="2" ry="2"></rect><circle cx="8.5" cy="8.5" r="1.5"></circle><polyline points="21 15 16 10 5 21"></polyline></svg>';
            }
            grid.appendChild(item);
        }
    }