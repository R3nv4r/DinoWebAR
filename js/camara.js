  AFRAME.registerComponent('tap-to-place', {
        init: function() {
          const ground = document.getElementById('ground');
          const modelo = document.getElementById('mi-modelo');
          
          ground.addEventListener('click', (event) => {
            const camera = document.querySelector('a-camera');
            const point = event.detail.intersection.point;
            const camPos = camera.object3D.position;
            
            // Calculamos dirección desde la cámara al punto tocado
            let dx = point.x - camPos.x;
            let dz = point.z - camPos.z;
            const distancia = Math.sqrt(dx * dx + dz * dz);
            
            // Empujamos el modelo 60 cm (0.6) más hacia adelante
            const offset = 0.6; 
            let finalX = point.x;
            let finalZ = point.z;
            
            if (distancia > 0) {
                finalX += (dx / distancia) * offset;
                finalZ += (dz / distancia) * offset;
            }
            
            // Obtener altura y posición configurada
            const alturaY = window.modeloActualConfig ? window.modeloActualConfig.positionY : 0;
            modelo.setAttribute('position', {x: finalX, y: alturaY, z: finalZ});
            
            // Aplicar corrección de rotación si existe
            if (window.modeloActualConfig && window.modeloActualConfig.rotacion) {
                modelo.setAttribute('rotation', window.modeloActualConfig.rotacion);
            }
            
            modelo.setAttribute('visible', 'true');
          });
        }
      });

      document.addEventListener('DOMContentLoaded', () => {
        const welcomeScreen = document.getElementById('welcome-screen');
        const btnStart = document.getElementById('btn-start');
        const arUI = document.getElementById('ar-ui');
        const btnExitAR = document.getElementById('btn-exit-ar');
        
        const btnCapture = document.getElementById('btn-capture');
        const btnModels = document.getElementById('btn-models');
        const carouselContainer = document.getElementById('model-carousel-container');
        const btnCloseCarousel = document.getElementById('btn-close-carousel');
        const carouselDiv = document.getElementById('model-carousel');
        const modeloAFrame = document.getElementById('mi-modelo');
        
        // Añadimos las propiedades rotacion y svgActivo a cada modelo
        const modelosDisponibles = [
            { 
                id: 'coahuilaceratops', 
                nombre: 'Coahuilaceratops',
                url: 'assets/modelos/coahuilaceratops.glb', 
                scale: 1, 
                positionY: -0.2,
                rotacion: '0 0 0', 
                svg: 'assets/miniatura/layer1.svg',
                svgActivo: 'assets/miniatura/open1.svg'
            },
            { 
                id: 'centrosaurus', 
                nombre: 'Centrosaurus',
                url: 'assets/modelos/Centrosaurus.glb', 
                scale: 1, 
                positionY: -0.2,
                rotacion: '0 0 0',
                svg: `assets/miniatura/layer1.svg`,
                svgActivo: 'assets/miniatura/open1.svg'
            },
            { 
                id: 'coahuilasaurus',
                nombre: 'Coahuilasaurus', 
                url: 'assets/modelos/Coahuilasaurus.glb', 
                scale: 1, 
                positionY: -0.2,
                rotacion: '0 0 0',
                svg: 'assets/miniatura/layer1.svg',
                svgActivo: 'assets/miniatura/open1.svg'
            },
            { 
                id: 'tlatolophus', 
                nombre: 'Tlatolophus',
                url: 'assets/modelos/tlatolophus.glb', 
                scale: 1, 
                positionY: -0.2,
                rotacion: '0 0 0',
                svg: 'assets/miniatura/layer1.svg',
                svgActivo: 'assets/miniatura/open1.svg'
            },
            { 
                id: 'velafrons', 
                nombre: 'Velafrons',
                url: 'assets/modelos/velafrons.glb', 
                scale: 1, 
                positionY: -0.2,
                rotacion: '0 0 0',
                svg: 'assets/miniatura/layer1.svg',
                svgActivo: 'assets/miniatura/open1.svg'
            }
        ];
        
        // 0. Función para cambiar el modelo en 3D dinámicamente
        function cargarModelo(modelo) {
            window.modeloActualConfig = modelo; // Guardar referencia global para tap-to-place
            modeloAFrame.setAttribute('gltf-model', modelo.url);
            modeloAFrame.setAttribute('scale', `${modelo.scale} ${modelo.scale} ${modelo.scale}`);
            
            let currentPos = modeloAFrame.getAttribute('position') || {x: 0, y: 0, z: 0};
            modeloAFrame.setAttribute('position', {x: currentPos.x, y: modelo.positionY || 0, z: currentPos.z});
            
            if (modelo.rotacion) {
                modeloAFrame.setAttribute('rotation', modelo.rotacion);
            } else {
                modeloAFrame.setAttribute('rotation', '0 0 0');
            }
        }

        // 1. LÓGICA DE APERTURA Y CIERRE DE MENÚ DE MODELOS
        btnModels.addEventListener('click', () => {
            carouselContainer.classList.add('show-carousel');
        });

        btnCloseCarousel.addEventListener('click', () => {
            carouselContainer.classList.remove('show-carousel');
        });

        // 2. Generar botones y crear efecto Rolling
        function construirCarrusel() {
            carouselDiv.innerHTML = ''; 
            
            modelosDisponibles.forEach((modelo) => {
                const btnItem = document.createElement('div');
                btnItem.className = 'model-option';
                
                // Estructura con atributos de imagen cerrada y abierta
                btnItem.innerHTML = `
                    <img src="${modelo.svg}" class="carousel-icon" data-cerrado="${modelo.svg}" data-abierto="${modelo.svgActivo}" alt="${modelo.nombre}">
                    <span class="carousel-name">${modelo.nombre}</span>
                `;

                // EVENTO CLIC: Seleccionar modelo
                btnItem.addEventListener('click', () => {
                    document.querySelectorAll('.model-option').forEach(el => {
                        el.classList.remove('active');
                        const img = el.querySelector('.carousel-icon');
                        if(img) img.src = img.getAttribute('data-cerrado');
                    });

                    btnItem.classList.add('active');
                    const miImg = btnItem.querySelector('.carousel-icon');
                    miImg.src = miImg.getAttribute('data-abierto');

                    // Deslizar automáticamente al centro
                    btnItem.scrollIntoView({ behavior: 'smooth', inline: 'center', block: 'nearest' });
                    cargarModelo(modelo);
                });

                carouselDiv.appendChild(btnItem);
            });

            // EVENTO SCROLL: Efecto lupa en el centro (Rolling)
            carouselDiv.addEventListener('scroll', () => {
                const carouselRect = carouselDiv.getBoundingClientRect();
                const carouselCenter = carouselRect.left + (carouselRect.width / 2);
                
                let closestItem = null;
                let minDistance = Infinity;
                const items = document.querySelectorAll('.model-option');

                items.forEach(item => {
                    const itemRect = item.getBoundingClientRect();
                    const itemCenter = itemRect.left + (itemRect.width / 2);
                    const distance = Math.abs(carouselCenter - itemCenter);
                    
                    if (distance < minDistance) {
                        minDistance = distance;
                        closestItem = item;
                    }
                });

                items.forEach(item => {
                    if (item === closestItem) {
                        item.classList.add('center-focus');
                    } else {
                        item.classList.remove('center-focus');
                    }
                });
            });

            // Iniciar por defecto
            setTimeout(() => {
                const firstItem = carouselDiv.querySelector('.model-option');
                if(firstItem) {
                    firstItem.classList.add('center-focus', 'active');
                    const img = firstItem.querySelector('.carousel-icon');
                    img.src = img.getAttribute('data-abierto');
                    carouselDiv.scrollLeft = 0; 
                }
            }, 300);
        }

        // 3. Botón INICIAR (Pantalla completa y revelar UI)
        btnStart.addEventListener('click', () => {
          const elem = document.documentElement;
          try {
            if (elem.requestFullscreen) {
              elem.requestFullscreen().catch(err => {
                console.warn(`Error al intentar pantalla completa: normal en iOS o Iframes`);
              });
            } else if (elem.webkitRequestFullscreen) { 
              elem.webkitRequestFullscreen();
            } else if (elem.msRequestFullscreen) { 
              elem.msRequestFullscreen();
            }
          } catch (e) {
            console.warn("API Fullscreen no soportada.");
          }
          
          welcomeScreen.classList.add('hidden');
          arUI.classList.add('active');
        });

        // 4. Botón SALIR
        if (btnExitAR) {
          btnExitAR.addEventListener('click', () => {
            window.location.reload();
          });
        }

        // 5. Botón eliminar/reposicionar
        const btnCamara = document.getElementById('btn-eliminar');
        btnCamara.addEventListener('click', () => {
          modeloAFrame.setAttribute('visible', 'false');
          btnCamara.style.transform = 'scale(0.8)';
          setTimeout(() => { btnCamara.style.transform = 'scale(1)'; }, 200);
        });

        // 6. LÓGICA DE CAPTURA FOTOGRÁFICA
        btnCapture.addEventListener('click', () => {
            arUI.style.visibility = 'hidden';
            if(btnExitAR) btnExitAR.style.display = 'none';
            
            setTimeout(() => {
                const video = document.querySelector('video');
                const canvas3D = document.querySelector('canvas.a-canvas');
                const sceneEl = document.querySelector('a-scene'); 
                
                const captureCanvas = document.createElement('canvas');
                captureCanvas.width = window.innerWidth;
                captureCanvas.height = window.innerHeight;
                const ctx = captureCanvas.getContext('2d');
                
                if (video) {
                    const videoRatio = video.videoWidth / video.videoHeight;
                    const windowRatio = window.innerWidth / window.innerHeight;
                    let drawWidth, drawHeight, startX, startY;

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
                
                if (canvas3D && sceneEl && sceneEl.renderer) {
                    sceneEl.renderer.render(sceneEl.object3D, sceneEl.camera);
                    ctx.drawImage(canvas3D, 0, 0, captureCanvas.width, captureCanvas.height);
                }
                
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
                
                const link = document.createElement('a');
                const now = new Date();
                const pad = (n) => n.toString().padStart(2, '0');
                const filename = `WebAR-XdevLab-${now.getFullYear()}${pad(now.getMonth()+1)}${pad(now.getDate())}-${pad(now.getHours())}${pad(now.getMinutes())}${pad(now.getSeconds())}.jpeg`;
                link.download = filename;
                link.href = captureCanvas.toDataURL('image/jpeg');
                link.click();
                
                setTimeout(() => {
                    arUI.style.visibility = 'visible';
                    if(btnExitAR) btnExitAR.style.display = 'flex';
                    flash.style.opacity = '0'; 
                    setTimeout(() => { flash.remove(); }, 400); 
                }, 50);
            }, 100); 
        });

        // 7. INICIO AUTOMÁTICO
        construirCarrusel();
        cargarModelo(modelosDisponibles[0]);

        // 8. LÓGICA DE POLVO/RED ANIMADA
        const canvas = document.getElementById('canvas-polvo');
        const ctx = canvas.getContext('2d');

        canvas.width = window.innerWidth;
        canvas.height = window.innerHeight;

        const particulas = [];
        const cantidadPolvo = 50; 
        const distanciaConexion = 100; 

        class Particula {
            constructor() {
                this.x = Math.random() * canvas.width;
                this.y = Math.random() * canvas.height;
                this.size = Math.random() * 5 + 0.5; 
                this.speedX = Math.random() * 0.4 - 0.2; 
                this.speedY = Math.random() * 0.4 - 0.2; 
                this.opacity = Math.random() * 0.4 + 0.1; 
            }

            actualizar() {
                this.x += this.speedX;
                this.y += this.speedY;

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

        function conectarParticulas() {
            for (let a = 0; a < particulas.length; a++) {
                for (let b = a; b < particulas.length; b++) {
                    let dx = particulas[a].x - particulas[b].x;
                    let dy = particulas[a].y - particulas[b].y;
                    let distancia = Math.sqrt(dx * dx + dy * dy);

                    if (distancia < distanciaConexion) {
                        let opacidadLinea = 1 - (distancia / distanciaConexion);
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

        function animar() {
            ctx.clearRect(0, 0, canvas.width, canvas.height);
            for (let i = 0; i < particulas.length; i++) {
                particulas[i].actualizar();
                particulas[i].dibujar();
            }
            conectarParticulas();
            requestAnimationFrame(animar);
        }

        iniciar();
        animar();

        window.addEventListener('resize', function() {
            canvas.width = window.innerWidth;
            canvas.height = window.innerHeight;
        });
      });
    