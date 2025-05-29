      const dropArea = document.getElementById('drop-area');
      const fileInput = document.getElementById('file-input');
      const selectButton = document.getElementById('select-files');
      const convertButton = document.getElementById('convert-button');
      const downloadAllButton = document.getElementById('download-all');
      const previewArea = document.getElementById('preview');
      const statusElement = document.getElementById('status');
      const formatSelect = document.getElementById('format-select');
      const zipNameInput = document.getElementById('zip-name');
      const downloadDirectButton = document.getElementById('download-direct');
      const widthInput = document.getElementById('width-input');
      const heightInput = document.getElementById('height-input');
      const backgroundColorInput = document.getElementById('background-color');
      
      // Elementos para padding
      const paddingTopInput = document.getElementById('padding-top');
      const paddingBottomInput = document.getElementById('padding-bottom');
      const paddingLeftInput = document.getElementById('padding-left');
      const paddingRightInput = document.getElementById('padding-right');
      const paddingTopUnitSelect = document.getElementById('padding-top-unit');
      const paddingBottomUnitSelect = document.getElementById('padding-bottom-unit');
      const paddingLeftUnitSelect = document.getElementById('padding-left-unit');
      const paddingRightUnitSelect = document.getElementById('padding-right-unit');

      let avifFiles = [];
      let convertedImages = [];

      // Eventos para drag and drop
      ['dragenter', 'dragover', 'dragleave', 'drop'].forEach(eventName => {
          dropArea.addEventListener(eventName, preventDefaults, false);
      });

      function preventDefaults(e) {
          e.preventDefault();
          e.stopPropagation();
      }

      ['dragenter', 'dragover'].forEach(eventName => {
          dropArea.addEventListener(eventName, highlight, false);
      });

      ['dragleave', 'drop'].forEach(eventName => {
          dropArea.addEventListener(eventName, unhighlight, false);
      });

      function highlight() {
          dropArea.style.borderColor = '#4CAF50';
          dropArea.style.backgroundColor = '#f8f8f8';
      }

      function unhighlight() {
          dropArea.style.borderColor = '#ccc';
          dropArea.style.backgroundColor = 'transparent';
      }

      // Manejo de archivos soltados
      dropArea.addEventListener('drop', handleDrop, false);

      function handleDrop(e) {
          const dt = e.dataTransfer;
          const files = dt.files;
          handleFiles(files);
      }

      // Manejo de selección de archivos
      selectButton.addEventListener('click', () => {
          fileInput.click();
      });

      fileInput.addEventListener('change', () => {
          handleFiles(fileInput.files);
      });

      function handleFiles(files) {
          Array.from(files).forEach(file => {
              const fileExtension = file.name.split('.').pop().toLowerCase();
              const validMimeTypes = ['image/avif', 'image/png', 'image/jpeg', 'image/webp'];
              const validExtensions = ['avif', 'png', 'jpg', 'jpeg', 'webp'];
              
              if (validMimeTypes.includes(file.type) || validExtensions.includes(fileExtension)) {
                  avifFiles.push(file);
                  const reader = new FileReader();
                  reader.onload = function (e) {
                      displayPreview(e.target.result, file.name, avifFiles.length - 1);
                  };
                  reader.readAsDataURL(file);
              } else {
                  console.log(`Tipo rechazado: ${file.type}, extensión: ${fileExtension}`);
                  alert(`El archivo ${file.name} no es un tipo de imagen válido.`);
              }
          });

          if (avifFiles.length > 0) {
              convertButton.disabled = false;
              updateStatus(`Se han seleccionado ${avifFiles.length} archivos.`);
          }
      }

      function displayPreview(src, filename, index) {
          const item = document.createElement('div');
          item.className = 'preview-item';
          item.innerHTML = `
              <img src="${src}" alt="Previsualización" />
              <div class="file-name">${filename}</div>
              <input type="text" class="rename-input" data-index="${index}" placeholder="Nuevo nombre" value="${filename}" />
          `;
          previewArea.appendChild(item);

          const renameInput = item.querySelector('.rename-input');
          renameInput.addEventListener('input', (e) => {
              const newName = e.target.value.trim();
              if (convertedImages[index]) {
                  convertedImages[index].filename = newName || filename;
              }
          });
      }

      // Función para calcular padding en píxeles
      function calculatePadding(paddingValue, unit, imageSize) {
          if (unit === '%') {
              return Math.round((paddingValue / 100) * imageSize);
          }
          return paddingValue; // Ya está en píxeles
      }

      // Conversión de imágenes con padding
      convertButton.addEventListener('click', convertImages);

      async function convertImages() {
          if (avifFiles.length === 0) return;

          const selectedFormat = formatSelect.value;
          convertButton.disabled = true;
          updateStatus("Convirtiendo imágenes...");
          convertedImages = [];

          for (let i = 0; i < avifFiles.length; i++) {
              updateStatus(`Convirtiendo imagen ${i + 1} de ${avifFiles.length}`);
              await convertImageWithPadding(avifFiles[i], i, selectedFormat);
          }

          updateStatus(`Se han convertido ${convertedImages.length} imágenes a ${selectedFormat.toUpperCase()}`);
          downloadAllButton.disabled = false;
          downloadDirectButton.disabled = false;
      }

      function convertImageWithPadding(imageFile, index, format) {
          return new Promise((resolve) => {
              const reader = new FileReader();
              reader.onload = function (e) {
                  const img = new Image();
                  img.onload = function () {
                      const targetWidth = parseInt(widthInput.value, 10) || 1000;
                      const targetHeight = parseInt(heightInput.value, 10) || 1000;
                      
                      // Obtener valores de padding vertical
                      const paddingTopValue = parseInt(paddingTopInput.value, 10) || 0;
                      const paddingBottomValue = parseInt(paddingBottomInput.value, 10) || 0;
                      const paddingTopUnit = paddingTopUnitSelect.value;
                      const paddingBottomUnit = paddingBottomUnitSelect.value;
                      
                      // Obtener valores de padding horizontal
                      const paddingLeftValue = parseInt(paddingLeftInput.value, 10) || 0;
                      const paddingRightValue = parseInt(paddingRightInput.value, 10) || 0;
                      const paddingLeftUnit = paddingLeftUnitSelect.value;
                      const paddingRightUnit = paddingRightUnitSelect.value;
                      
                      // Calcular padding en píxeles basado en la imagen original
                      const paddingTopPx = calculatePadding(paddingTopValue, paddingTopUnit, img.height);
                      const paddingBottomPx = calculatePadding(paddingBottomValue, paddingBottomUnit, img.height);
                      const paddingLeftPx = calculatePadding(paddingLeftValue, paddingLeftUnit, img.width);
                      const paddingRightPx = calculatePadding(paddingRightValue, paddingRightUnit, img.width);
                      
                      // El canvas total incluye todo el padding
                      const totalCanvasWidth = targetWidth + paddingLeftPx + paddingRightPx;
                      const totalCanvasHeight = targetHeight + paddingTopPx + paddingBottomPx;
                      
                      const canvas = document.createElement('canvas');
                      canvas.width = totalCanvasWidth;
                      canvas.height = totalCanvasHeight;

                      const ctx = canvas.getContext('2d');
                      const backgroundColor = backgroundColorInput.value;

                      // Llenar todo el canvas con el color de fondo
                      ctx.fillStyle = backgroundColor;
                      ctx.fillRect(0, 0, canvas.width, canvas.height);

                      // Calcular las dimensiones para centrar la imagen en el área designada (sin padding)
                      const aspectRatio = img.width / img.height;
                      let drawWidth, drawHeight, offsetX, offsetY;

                      if (aspectRatio > 1) {
                          // Imagen más ancha que alta
                          drawWidth = targetWidth;
                          drawHeight = targetWidth / aspectRatio;
                          offsetX = paddingLeftPx;
                          offsetY = paddingTopPx + (targetHeight - drawHeight) / 2;
                      } else {
                          // Imagen más alta que ancha
                          drawWidth = targetHeight * aspectRatio;
                          drawHeight = targetHeight;
                          offsetX = paddingLeftPx + (targetWidth - drawWidth) / 2;
                          offsetY = paddingTopPx;
                      }

                      // Dibujar la imagen centrada en el área designada
                      ctx.drawImage(img, offsetX, offsetY, drawWidth, drawHeight);

                      // Determinar el formato de salida
                      let mimeType = format === 'webp' ? 'image/webp' : 'image/jpeg';
                      const dataUrl = canvas.toDataURL(mimeType, 0.9);

                      // Actualizar preview
                      const previewItems = document.querySelectorAll('.preview-item');
                      if (previewItems[index]) {
                          const imgElement = previewItems[index].querySelector('img');
                          imgElement.src = dataUrl;

                          const filenameElement = previewItems[index].querySelector('.file-name');
                          const newFilename = imageFile.name.replace(/\.(avif|png|jpg|jpeg|webp)$/i, `.${format}`);
                          filenameElement.textContent = newFilename;
                      }

                      convertedImages.push({
                          dataUrl: dataUrl,
                          filename: imageFile.name.replace(/\.(avif|png|jpg|jpeg|webp)$/i, `.${format}`)
                      });

                      resolve();
                  };
                  img.src = e.target.result;
              };
              reader.readAsDataURL(imageFile);
          });
      }

      // Descargar todas las imágenes convertidas
      downloadAllButton.addEventListener('click', downloadAllImages);

      async function downloadAllImages() {
          if (convertedImages.length === 0) return;

          updateStatus("Preparando imágenes para descarga...");

          const selectedFormat = formatSelect.value;
          const prefix = document.getElementById('prefix-input').value.trim();

          const renameInputs = document.querySelectorAll('.rename-input');
          renameInputs.forEach((input, index) => {
              const newName = input.value.trim();
              if (newName) {
                  convertedImages[index].filename = `${prefix}${newName}.${selectedFormat}`;
              }
          });

          const zip = new JSZip();
          const folder = zip.folder("imagenes_convertidas");

          convertedImages.forEach(image => {
              const base64Data = image.dataUrl.split(",")[1];
              const updatedFilename = image.filename;
              folder.file(updatedFilename, base64Data, { base64: true });
          });

          try {
              const content = await zip.generateAsync({ type: "blob" });
              const zipName = zipNameInput.value.trim() || "imagenes_convertidas";
              saveAs(content, `${zipName}.zip`);
              updateStatus("Todas las imágenes han sido descargadas en un archivo ZIP");
          } catch (error) {
              console.error("Error al generar el archivo ZIP:", error);
              updateStatus("Error al generar el archivo ZIP");
          }
      }

      // Descargar imágenes directamente
      downloadDirectButton.addEventListener('click', () => {
          if (convertedImages.length === 0) return;

          updateStatus("Descargando imágenes una por una...");

          const selectedFormat = formatSelect.value;
          const prefix = document.getElementById('prefix-input').value.trim();

          const renameInputs = document.querySelectorAll('.rename-input');
          renameInputs.forEach((input, index) => {
              const originalFilename = avifFiles[index].name;
              let newName = input.value.trim();

              if (!newName) {
                  newName = originalFilename.replace(/\.[^/.]+$/, "");
              }

              const finalFilename = `${prefix}${newName}.${selectedFormat}`;

              if (convertedImages[index]) {
                  downloadSingleImage(convertedImages[index].dataUrl, finalFilename);
              }
          });

          updateStatus("Todas las imágenes han sido descargadas directamente");
      });

      function downloadSingleImage(dataUrl, filename) {
          const link = document.createElement('a');
          link.href = dataUrl;
          link.download = filename;
          document.body.appendChild(link);
          link.click();
          document.body.removeChild(link);
      }

      function updateStatus(message) {
          statusElement.textContent = message;
      }

      function removeImage(index) {
          avifFiles.splice(index, 1);
          updatePreview();

          if (avifFiles.length === 0) {
              convertButton.disabled = true;
              updateStatus("No hay imágenes para procesar");
          } else {
              updateStatus(`Se han seleccionado ${avifFiles.length} archivos`);
          }
      }

      function updatePreview() {
          previewArea.innerHTML = '';
          avifFiles.forEach((file, index) => {
              const reader = new FileReader();
              reader.onload = function (e) {
                  displayPreview(e.target.result, file.name, index);
              };
              reader.readAsDataURL(file);
          });
      }
