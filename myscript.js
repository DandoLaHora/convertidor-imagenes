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
      
      // Elementos para ChatGPT
      const enableChatGPTCheckbox = document.getElementById('enable-chatgpt');
      const apiConfigDiv = document.getElementById('api-config');
      const openaiApiKeyInput = document.getElementById('openai-api-key');
      
      // Elementos para padding
      const paddingTopInput = document.getElementById('padding-top');
      const paddingBottomInput = document.getElementById('padding-bottom');
      const paddingLeftInput = document.getElementById('padding-left');
      const paddingRightInput = document.getElementById('padding-right');
      const paddingTopUnitSelect = document.getElementById('padding-top-unit');
      const paddingBottomUnitSelect = document.getElementById('padding-bottom-unit');
      const paddingLeftUnitSelect = document.getElementById('padding-left-unit');
      const paddingRightUnitSelect = document.getElementById('padding-right-unit');

      // Elementos para controles de padding globales
      const paddingAllValueInput = document.getElementById('padding-all-value');
      const paddingAllUnitSelect = document.getElementById('padding-all-unit');
      const setAllPaddingButton = document.getElementById('set-all-padding');
      const setVerticalPaddingButton = document.getElementById('set-vertical-padding');
      const setHorizontalPaddingButton = document.getElementById('set-horizontal-padding');

      let avifFiles = [];
      let convertedImages = [];

      // Event listener para checkbox de ChatGPT
      enableChatGPTCheckbox.addEventListener('change', function() {
          apiConfigDiv.style.display = this.checked ? 'flex' : 'none';
      });

      // Función para extraer SKU del nombre del archivo
      function extractSKU(filename) {
          // Remover extensión
          const nameWithoutExt = filename.replace(/\.(avif|png|jpg|jpeg|webp)$/i, '');
          
          // Buscar patrones comunes de SKU (números, letras y guiones)
          // Ejemplo: SKU123, ABC-123, 12345, etc.
          const skuMatch = nameWithoutExt.match(/[A-Z0-9\-_]+/i);
          
          return skuMatch ? skuMatch[0] : nameWithoutExt;
      }

      // Función para generar texto alternativo con ChatGPT usando Responses API con visión
      async function generateAltTextWithChatGPT(sku, apiKey, imageDataUrl) {
          try {
              // Extraer solo el base64 de la imagen (sin el prefijo data:image/...)
              const base64Data = imageDataUrl.split(',')[1];
              const mimeType = imageDataUrl.split(';')[0].split(':')[1];
              
              const response = await fetch('https://api.openai.com/v1/chat/completions', {
                  method: 'POST',
                  headers: {
                      'Content-Type': 'application/json',
                      'Authorization': `Bearer ${apiKey}`
                  },
                  body: JSON.stringify({
                      model: 'gpt-4o-mini',
                      messages: [
                          {
                              role: 'system',
                              content: 'Eres un experto en SEO y descripción de productos de relojería. Analiza la imagen del reloj y genera un texto alternativo optimizado para SEO.'
                          },
                          {
                              role: 'user',
                              content: [
                                  {
                                      type: 'text',
                                      text: `Analiza esta imagen de un reloj con SKU: "${sku}". Genera un texto alternativo optimizado para SEO (máximo 125 caracteres) que incluya el SKU y describa las características visibles del reloj (estilo, colores, materiales aparentes, tipo de carátula, etc.). El texto debe ser atractivo para motores de búsqueda. Solo responde con el texto alternativo, sin explicaciones adicionales.`
                                  },
                                  {
                                      type: 'image_url',
                                      image_url: {
                                          url: imageDataUrl,
                                          detail: 'low' // Usar 'low' para ahorrar tokens
                                      }
                                  }
                              ]
                          }
                      ],
                      max_tokens: 150,
                      temperature: 0.7
                  })
              });

              if (!response.ok) {
                  const errorData = await response.json();
                  throw new Error(`Error de API: ${errorData.error?.message || response.statusText}`);
              }

              const data = await response.json();
              return data.choices[0].message.content.trim();
          } catch (error) {
              console.error('Error al generar alt text con ChatGPT:', error);
              throw error;
          }
      }

      // Event listeners para botones de padding
      setAllPaddingButton.addEventListener('click', () => {
          const value = paddingAllValueInput.value;
          const unit = paddingAllUnitSelect.value;
          
          paddingTopInput.value = value;
          paddingBottomInput.value = value;
          paddingLeftInput.value = value;
          paddingRightInput.value = value;
          
          paddingTopUnitSelect.value = unit;
          paddingBottomUnitSelect.value = unit;
          paddingLeftUnitSelect.value = unit;
          paddingRightUnitSelect.value = unit;
      });

      setVerticalPaddingButton.addEventListener('click', () => {
          const topValue = paddingTopInput.value;
          const topUnit = paddingTopUnitSelect.value;
          
          paddingBottomInput.value = topValue;
          paddingBottomUnitSelect.value = topUnit;
      });

      setHorizontalPaddingButton.addEventListener('click', () => {
          const leftValue = paddingLeftInput.value;
          const leftUnit = paddingLeftUnitSelect.value;
          
          paddingRightInput.value = leftValue;
          paddingRightUnitSelect.value = leftUnit;
      });

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
          item.setAttribute('data-file-index', index); // Añadir atributo para rastrear el índice
          // Extraer el nombre base sin extensión
          const nameWithoutExtension = filename.replace(/\.(avif|png|jpg|jpeg|webp)$/i, '');
          item.innerHTML = `
              <img src="${src}" alt="Previsualización" />
              <div class="file-name">${filename}</div>
              <input type="text" class="rename-input" data-index="${index}" placeholder="Nuevo nombre" value="${nameWithoutExtension}" />
              <div class="alt-text-container" id="alt-text-${index}" style="display: none;">
                  <label>Texto alternativo generado:</label>
                  <textarea class="alt-text-preview" readonly></textarea>
              </div>
          `;
          previewArea.appendChild(item);

          const renameInput = item.querySelector('.rename-input');
          renameInput.addEventListener('input', (e) => {
              const newName = e.target.value.trim();
              const fileIndex = parseInt(e.target.getAttribute('data-index'), 10);
              // Guardar el nuevo nombre en el archivo original
              if (avifFiles[fileIndex]) {
                  avifFiles[fileIndex].customName = newName;
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
          const useChatGPT = enableChatGPTCheckbox.checked;
          const apiKey = openaiApiKeyInput.value.trim();

          // Validar API key si ChatGPT está habilitado
          if (useChatGPT && !apiKey) {
              alert('Por favor ingresa tu API Key de OpenAI para usar ChatGPT');
              return;
          }

          convertButton.disabled = true;
          updateStatus("Convirtiendo imágenes...");
          convertedImages = [];

          // Procesar las imágenes en orden secuencial para mantener el índice correcto
          for (let i = 0; i < avifFiles.length; i++) {
              updateStatus(`Convirtiendo imagen ${i + 1} de ${avifFiles.length}`);
              await convertImageWithPadding(avifFiles[i], i, selectedFormat);
              
              // Generar alt text con ChatGPT si está habilitado
              if (useChatGPT) {
                  try {
                      updateStatus(`Generando texto alternativo para imagen ${i + 1} de ${avifFiles.length}`);
                      const sku = extractSKU(avifFiles[i].name);
                      
                      // Obtener la imagen convertida para enviarla a ChatGPT
                      const imageDataUrl = convertedImages[i]?.dataUrl;
                      
                      if (!imageDataUrl) {
                          throw new Error('No se pudo obtener la imagen convertida');
                      }
                      
                      const altText = await generateAltTextWithChatGPT(sku, apiKey, imageDataUrl);
                      
                      // Guardar el alt text en el objeto de imagen convertida
                      if (convertedImages[i]) {
                          convertedImages[i].altText = altText;
                      }
                      
                      // Mostrar el alt text en el preview
                      const altTextContainer = document.getElementById(`alt-text-${i}`);
                      if (altTextContainer) {
                          altTextContainer.style.display = 'block';
                          const textarea = altTextContainer.querySelector('.alt-text-preview');
                          textarea.value = altText;
                      }
                  } catch (error) {
                      console.error(`Error al generar alt text para imagen ${i + 1}:`, error);
                      updateStatus(`Error al generar texto alternativo para imagen ${i + 1}: ${error.message}`);
                      // Continuar con la siguiente imagen incluso si hay error
                  }
              }
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

                      // Obtener el nombre personalizado si existe
                      const customName = imageFile.customName || imageFile.name.replace(/\.(avif|png|jpg|jpeg|webp)$/i, '');
                      const finalFilename = `${customName}.${format}`;

                      // Guardar con el índice correcto para mantener el orden
                      convertedImages[index] = {
                          dataUrl: dataUrl,
                          filename: finalFilename,
                          originalIndex: index
                      };

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

          // Actualizar nombres basados en los inputs de renombre
          const renameInputs = document.querySelectorAll('.rename-input');
          renameInputs.forEach((input, index) => {
              const newName = input.value.trim();
              if (newName && convertedImages[index]) {
                  convertedImages[index].filename = `${prefix}${newName}.${selectedFormat}`;
              } else if (convertedImages[index]) {
                  // Si no hay nombre personalizado, usar el nombre del archivo original
                  const originalName = avifFiles[index].name.replace(/\.(avif|png|jpg|jpeg|webp)$/i, '');
                  convertedImages[index].filename = `${prefix}${originalName}.${selectedFormat}`;
              }
          });

          const zip = new JSZip();
          const folder = zip.folder("imagenes_convertidas");

          // Procesar en orden para mantener la secuencia
          convertedImages.forEach((image, index) => {
              if (image) {
                  const base64Data = image.dataUrl.split(",")[1];
                  folder.file(image.filename, base64Data, { base64: true });
              }
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
          
          // Descargar en orden usando índices
          convertedImages.forEach((image, index) => {
              if (image && avifFiles[index]) {
                  const renameInput = renameInputs[index];
                  let newName = renameInput ? renameInput.value.trim() : '';

                  if (!newName) {
                      newName = avifFiles[index].name.replace(/\.[^/.]+$/, "");
                  }

                  const finalFilename = `${prefix}${newName}.${selectedFormat}`;
                  downloadSingleImage(image.dataUrl, finalFilename);
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
