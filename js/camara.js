  
        // Obtenemos las referencias a los elementos del DOM
        const videoElement = document.getElementById('mi-camara');
        const mensajeElement = document.getElementById('mensaje');

        // Función para iniciar la cámara
        async function iniciarCamara() {
            try {
                // Solicitamos acceso solo a la cámara de video
                const restricciones = { video: true };
                
                // Intentamos obtener el flujo de medios (media stream)
                const stream = await navigator.mediaDevices.getUserMedia(restricciones);
                
                // Si tenemos éxito:
                // 1. Ocultamos el mensaje inicial
                mensajeElement.style.display = 'none';
                
                // 2. Asignamos el flujo al elemento de video
                videoElement.srcObject = stream;
                
                // 3. Mostramos el elemento de video
                videoElement.style.display = 'block';
                
            } catch (error) {
                // Si ocurre un error (ej. el usuario deniega el permiso o no hay cámara)
                console.error("Error al acceder a la cámara:", error);
                
                let mensajeError = "No se pudo acceder a la cámara.";
                
                if (error.name === 'NotAllowedError') {
                    mensajeError = "Permiso denegado. Por favor, permite el acceso a la cámara en tu navegador.";
                } else if (error.name === 'NotFoundError') {
                     mensajeError = "No se encontró ninguna cámara en el dispositivo.";
                }

                mensajeElement.textContent = mensajeError;
                mensajeElement.classList.add('error');
            }
        }

        // Iniciamos el proceso tan pronto como la página se cargue
        window.addEventListener('load', iniciarCamara);