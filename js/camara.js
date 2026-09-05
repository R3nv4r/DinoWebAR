      AFRAME.registerComponent('tap-to-place', {
        init: function() {
          const ground = document.getElementById('ground');
          const modelo = document.getElementById('mi-modelo');
          
          // Cuando detectamos un toque en el suelo virtual
          ground.addEventListener('click', (event) => {
            // Obtenemos las coordenadas 3D del punto exacto tocado
            const point = event.detail.intersection.point;
            
            // Movemos el modelo a ese punto
            modelo.setAttribute('position', point);
            
            // Hacemos el modelo visible (ya que empieza oculto)
            modelo.setAttribute('visible', 'true');
          });
        
        }
      });
     document.addEventListener('DOMContentLoaded', () => {
        const welcomeScreen = document.getElementById('welcome-screen');
        const btnStart = document.getElementById('btn-start');
        const arUI = document.getElementById('ar-ui');
        const btnExitAR = document.getElementById('btn-exit-ar');
        
        // Elementos de la interfaz de usuario
        const btnCapture = document.getElementById('btn-capture');
        const btnModels = document.getElementById('btn-models');
        const carouselContainer = document.getElementById('model-carousel-container');
        const btnCloseCarousel = document.getElementById('btn-close-carousel');
        const carouselDiv = document.getElementById('model-carousel');
        const modeloAFrame = document.getElementById('mi-modelo');
        
        const modelosDisponibles = [
            { 
                id: 'coahuilaceratops', 
                nombre: 'Coahuilaceratops',
                url: 'assets/modelos/coahuilaceratops.glb', 
                scale: 1, 
                positionY: -0.2,
                svg: 'assets/miniatura/layer1.svg'
            },
            { 
                id: 'centrosaurus', 
                nombre: 'Centrosaurus',
                url: 'assets/modelos/Centrosaurus.glb', 
                scale: 1, 
                positionY: -0.2,
                svg: `assets/miniatura/layer1.svg` 
            },
            { 
                id: 'coahuilasaurus',
                nombre: 'Coahuilasaurus', 
                url: 'assets/modelos/Coahuilasaurus.glb', 
                scale: 1, 
                positionY: -0.2,
                svg: 'assets/miniatura/layer1.svg'
            },
            { 
                id: 'tlatolophus', 
                nombre: 'Tlatolophus',
                url: 'assets/modelos/tlatolophus.glb', 
                scale: 1, 
                positionY: -0.2,
                svg: 'assets/miniatura/layer1.svg'
            },
            { 
                id: 'velafrons', 
                nombre: 'Velafrons',
                url: 'assets/modelos/velafrons.glb', 
                scale: 1, 
                positionY: -0.2,
                svg: 'assets/miniatura/layer1.svg'
            },
        ];
        
        // 0. Función para cambiar el modelo en 3D dinámicamente
        function cargarModelo(modelo) {
            modeloAFrame.setAttribute('gltf-model', modelo.url);
            modeloAFrame.setAttribute('scale', `${modelo.scale} ${modelo.scale} ${modelo.scale}`);
            // El centrosaurus y otros modelos podrían estar descentrados en Y, ajustamos un poco
            let currentPos = modeloAFrame.getAttribute('position') || {x: 0, y: 0, z: 0};
            modeloAFrame.setAttribute('position', {x: currentPos.x, y: modelo.positionY || 0, z: currentPos.z});
        }

        // 1. LÓGICA DE APERTURA Y CIERRE DE MENÚ DE MODELOS
        btnModels.addEventListener('click', () => {
            carouselContainer.classList.add('show-carousel');
        });

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
                
                // AQUÍ INYECTAMOS LA IMAGEN Y EL NOMBRE
                btnItem.innerHTML = `
                    <img src="${modelo.svg}" alt="${modelo.nombre}" class="carousel-icon">
                    <span class="carousel-name">${modelo.nombre}</span>
                `;

                btnItem.addEventListener('click', () => {
                    document.querySelectorAll('.model-option').forEach(el => el.classList.remove('active'));
                    btnItem.classList.add('active');
                    cargarModelo(modelo);
                });

                carouselDiv.appendChild(btnItem);
            });
        }

        // 3. Botón INICIAR (Pantalla completa y revelar UI)
        btnStart.addEventListener('click', () => {
          const elem = document.documentElement;
          
          // Lógica de pantalla completa mejorada para atrapar bloqueos de seguridad
          try {
            if (elem.requestFullscreen) {
              elem.requestFullscreen().catch(err => {
                console.warn(`Error al intentar pantalla completa: ${err.message}. (Normal en iOS o Iframes)`);
              });
            } else if (elem.webkitRequestFullscreen) { /* Safari / iOS antiguo */
              elem.webkitRequestFullscreen();
            } else if (elem.msRequestFullscreen) { /* Edge antiguo */
              elem.msRequestFullscreen();
            }
          } catch (e) {
            console.warn("La API de Fullscreen no está soportada en este navegador.");
          }
          
          welcomeScreen.classList.add('hidden');
          arUI.classList.add('active');
        });

        // 4. Botón SALIR (Recargar página)
        if (btnExitAR) {
          btnExitAR.addEventListener('click', () => {
            window.location.reload();
          });
        }

        // 5. Botón eliminat (Ocultar modelo actual para ponerlo en otro lado)
        const btnCamara = document.getElementById('btn-eliminar');
        btnCamara.addEventListener('click', () => {
          modeloAFrame.setAttribute('visible', 'false');
          btnCamara.style.transform = 'scale(0.8)';
          setTimeout(() => { btnCamara.style.transform = 'scale(1)'; }, 200);
        });

        // 6. NUEVA LÓGICA DEL BOTÓN DE CAPTURA (FOTO PERFECTA AR)
        btnCapture.addEventListener('click', () => {
            // A. Ocultar la UI
            arUI.style.visibility = 'hidden';
            if(btnExitAR) btnExitAR.style.display = 'none';
            
            // Damos un pequeño respiro de 100ms para asegurar que los botones se fueron
            setTimeout(() => {
                // Conseguimos el video del mundo real, el lienzo 3D y la escena de A-Frame
                const video = document.querySelector('video');
                const canvas3D = document.querySelector('canvas.a-canvas');
                const sceneEl = document.querySelector('a-scene'); // <-- NUEVO: Obtenemos la escena
                
                // Creamos un lienzo 2D del tamaño exacto de la pantalla
                const captureCanvas = document.createElement('canvas');
                captureCanvas.width = window.innerWidth;
                captureCanvas.height = window.innerHeight;
                const ctx = captureCanvas.getContext('2d');
                
                // Paso 1: Dibujar la cámara de fondo
                if (video) {
                    const videoRatio = video.videoWidth / video.videoHeight;
                    const windowRatio = window.innerWidth / window.innerHeight;
                    let drawWidth, drawHeight, startX, startY;

                    // Lógica para emular "object-fit: cover" y evitar distorsión
                    if (windowRatio > videoRatio) {
                        drawWidth = window.innerWidth;
                        drawHeight = window.innerWidth / videoRatio;
                        startX = 0;
                        startY = (window.innerHeight - drawHeight) / 2;
                    } else {
                        drawWidth = window.innerHeight * videoRatio;
                        drawHeight = window.innerHeight;
                        startX = (window.innerWidth - drawWidth) / 2;
                        startY = 0;
                    }
                    ctx.drawImage(video, startX, startY, drawWidth, drawHeight);
                }
                
                // Paso 2: FORZAR RENDER Y DIBUJAR EL MODELO 3D
                if (canvas3D && sceneEl && sceneEl.renderer) {
                    // Magia: Obligamos a A-Frame a pintar el frame exacto en este milisegundo.
                    // Esto evita que el modelo 3D esté transparente o vacío al tomar la foto.
                    sceneEl.renderer.render(sceneEl.object3D, sceneEl.camera);
                    
                    // Ahora copiamos el lienzo 3D (que ya tiene tu modelo seguro) por encima del video
                    ctx.drawImage(canvas3D, 0, 0, captureCanvas.width, captureCanvas.height);
                }
                
                // B. Efecto Visual de "Flash" fotográfico
                const flash = document.createElement('div');
                flash.style.position = 'absolute';
                flash.style.top = '0';
                flash.style.left = '0';
                flash.style.width = '100%';
                flash.style.height = '100%';
                flash.style.backgroundColor = 'white';
                flash.style.zIndex = '9999';
                flash.style.transition = 'opacity 0.4s ease-out';
                document.body.appendChild(flash);
                
                // C. Procesar y descargar la imagen
                const link = document.createElement('a');
                // Create a timestamped filename: WebAR-XdevLab-YYYYMMDD-HHMMSS.jpeg
                const now = new Date();
                const pad = (n) => n.toString().padStart(2, '0');
                const filename = `WebAR-XdevLab-${now.getFullYear()}${pad(now.getMonth()+1)}${pad(now.getDate())}-${pad(now.getHours())}${pad(now.getMinutes())}${pad(now.getSeconds())}.jpeg`;
                link.download = filename;
                link.href = captureCanvas.toDataURL('image/jpeg');
                link.click();
                
                // D. Restaurar la pantalla
                setTimeout(() => {
                    arUI.style.visibility = 'visible';
                    if(btnExitAR) btnExitAR.style.display = 'flex';
                    
                    flash.style.opacity = '0'; // Apagar el flash suavemente
                    setTimeout(() => { flash.remove(); }, 400); 
                }, 50);
                
            }, 100); 
        });
        // 7. INICIO AUTOMÁTICO: Inicializar carrusel y cargar el modelo base
        construirCarrusel();
        cargarModelo(modelosDisponibles[0]);
        // 8. LÓGICA DE POLVO/RED ANIMADA EN EL FONDO
const canvas = document.getElementById('canvas-polvo');
const ctx = canvas.getContext('2d');

// Ajustar el canvas al tamaño de la pantalla
canvas.width = window.innerWidth;
canvas.height = window.innerHeight;

const particulas = [];
// Puedes cambiar este número para tener más o menos polvo
const cantidadPolvo = 50; 
// Distancia máxima para que se dibuje una línea entre dos partículas
const distanciaConexion = 100; 

class Particula {
    constructor() {
        this.x = Math.random() * canvas.width;
        this.y = Math.random() * canvas.height;
        // Tamaño de la partícula
        this.size = Math.random() * 5 + 0.5; 
        // Velocidad
        this.speedX = Math.random() * 0.4 - 0.2; 
        this.speedY = Math.random() * 0.4 - 0.2; 
        // Opacidad de la partícula
        this.opacity = Math.random() * 0.4 + 0.1; 
    }

    actualizar() {
        this.x += this.speedX;
        this.y += this.speedY;

        // Si la partícula sale de la pantalla, la hacemos reaparecer por el lado opuesto
        if (this.x > canvas.width) this.x = 0;
        if (this.x < 0) this.x = canvas.width;
        if (this.y > canvas.height) this.y = 0;
        if (this.y < 0) this.y = canvas.height;
    }

    dibujar() {
        ctx.fillStyle = `rgba(255, 255, 255, ${this.opacity})`;
        ctx.beginPath();
        ctx.arc(this.x, this.y, this.size, 0, Math.PI * 2);
        ctx.closePath();
        ctx.fill();
    }
}

function iniciar() {
    for (let i = 0; i < cantidadPolvo; i++) {
        particulas.push(new Particula());
    }
}

// --- NUEVA FUNCIÓN PARA DIBUJAR LAS LÍNEAS ---
function conectarParticulas() {
    for (let a = 0; a < particulas.length; a++) {
        // Empezamos en 'a' para no repetir pares de partículas (ahorra rendimiento)
        for (let b = a; b < particulas.length; b++) {
            
            // Fórmula matemática para calcular la distancia entre dos puntos
            let dx = particulas[a].x - particulas[b].x;
            let dy = particulas[a].y - particulas[b].y;
            let distancia = Math.sqrt(dx * dx + dy * dy);

            // Si están lo suficientemente cerca, dibujamos la línea
            if (distancia < distanciaConexion) {
                // Calcula la opacidad (más cerca = más visible, más lejos = más transparente)
                let opacidadLinea = 1 - (distancia / distanciaConexion);
                
                // Reducimos la opacidad general a 0.3 para que no brille demasiado
                ctx.strokeStyle = `rgba(255, 255, 255, ${opacidadLinea * 0.5})`; 
                ctx.lineWidth = 1;
                ctx.beginPath();
                ctx.moveTo(particulas[a].x, particulas[a].y);
                ctx.lineTo(particulas[b].x, particulas[b].y);
                ctx.stroke();
            }
        }
    }
}
// ---------------------------------------------

function animar() {
    // Limpia el canvas en cada fotograma
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    
    // 1. Primero actualizamos y dibujamos las partículas
    for (let i = 0; i < particulas.length; i++) {
        particulas[i].actualizar();
        particulas[i].dibujar();
    }
    
    // 2. Luego dibujamos las líneas que las conectan
    conectarParticulas();
    
    requestAnimationFrame(animar);
}

iniciar();
animar();

// Redimensionar el canvas si el usuario cambia el tamaño de la ventana
window.addEventListener('resize', function() {
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
});
});

