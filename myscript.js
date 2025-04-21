// Variables globales
const dropArea = document.getElementById('drop-area');
const fileInput = document.getElementById('file-input');
const selectButton = document.getElementById('select-files');
const convertButton = document.getElementById('convert-button');
const downloadAllButton = document.getElementById('download-all');
const previewArea = document.getElementById('preview');
const statusElement = document.getElementById('status');
const formatSelect = document.getElementById('format-select'); // Nuevo selector de formato
const zipNameInput = document.getElementById('zip-name'); // Campo para el nombre del ZIP
const downloadDirectButton = document.getElementById('download-direct'); // Botón para descarga directa
const widthInput = document.getElementById('width-input');
const heightInput = document.getElementById('height-input');
const backgroundColorInput = document.getElementById('background-color');
const downloadSelectedButton = document.getElementById('download-selected'); // Botón para descargar seleccionadas

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
    // Comprobar tanto por tipo MIME como por extensión de archivo
    Array.from(files).forEach(file => {
        // Obtener la extensión del nombre de archivo
        const fileExtension = file.name.split('.').pop().toLowerCase();
        const validMimeTypes = ['image/avif', 'image/png', 'image/jpeg', 'image/webp'];
        const validExtensions = ['avif', 'png', 'jpg', 'jpeg', 'webp'];
        
        // Aceptar el archivo si el tipo MIME o la extensión es válida
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

    // Agregar evento para eliminar la imagen
    const deleteButton = item.querySelector('.delete-button');
    deleteButton.addEventListener('click', () => removeImage(index));

    // Actualizar el nombre del archivo en la lista cuando se cambie el valor del input
    const renameInput = item.querySelector('.rename-input');
    renameInput.addEventListener('input', (e) => {
        const newName = e.target.value.trim();
        if (convertedImages[index]) {
            convertedImages[index].filename = newName || filename; // Usar el nuevo nombre o el original si está vacío
        }
    });

    // Elimina este bloque dentro de displayPreview
    const downloadButton = item.querySelector('.download-button');
    downloadButton.addEventListener('click', () => downloadSingleImage(convertedImages[index].dataUrl, convertedImages[index].filename));
}

// Conversión de AVIF a JPG o WebP
convertButton.addEventListener('click', convertImages);

async function convertImages() {
    if (avifFiles.length === 0) return;

    const selectedFormat = formatSelect.value; // Obtener el formato seleccionado (jpg o webp)
    convertButton.disabled = true;
    updateStatus("Convirtiendo imágenes...");
    convertedImages = [];

    for (let i = 0; i < avifFiles.length; i++) {
        updateStatus(`Convirtiendo imagen ${i + 1} de ${avifFiles.length}`);
        await convertAvifToFormat(avifFiles[i], i, selectedFormat);
    }

    updateStatus(`Se han convertido ${convertedImages.length} imágenes a ${selectedFormat.toUpperCase()}`);
    downloadAllButton.disabled = false;
    downloadDirectButton.disabled = false; // Habilitar el botón de descarga directa
}

function convertAvifToFormat(imageFile, index, format) {
    return new Promise((resolve) => {
        const reader = new FileReader();
        reader.onload = function (e) {
            const img = new Image();
            img.onload = function () {
                const targetWidth = parseInt(widthInput.value, 10) || 1000;
                const targetHeight = parseInt(heightInput.value, 10) || 1000;

                const canvas = document.createElement('canvas');
                canvas.width = targetWidth;
                canvas.height = targetHeight;

                const ctx = canvas.getContext('2d');

                // Obtener el color seleccionado
                const backgroundColor = backgroundColorInput.value;

                // Dibujar el fondo con el color seleccionado
                ctx.fillStyle = backgroundColor;
                ctx.fillRect(0, 0, canvas.width, canvas.height);

                // Calcular las dimensiones para centrar la imagen
                const aspectRatio = img.width / img.height;
                let drawWidth, drawHeight, offsetX, offsetY;

                if (aspectRatio > 1) {
                    drawWidth = targetWidth;
                    drawHeight = targetWidth / aspectRatio;
                    offsetX = 0;
                    offsetY = (targetHeight - drawHeight) / 2;
                } else {
                    drawWidth = targetHeight * aspectRatio;
                    drawHeight = targetHeight;
                    offsetX = (targetWidth - drawWidth) / 2;
                    offsetY = 0;
                }

                ctx.drawImage(img, offsetX, offsetY, drawWidth, drawHeight);

                // Determinar el formato de salida
                let outputFormat = format;
                let mimeType;

                // Si el archivo original ya es WebP y el formato seleccionado es WebP, mantener WebP
                if (imageFile.type === 'image/webp' && format === 'webp') {
                    mimeType = 'image/webp';
                } else {
                    mimeType = format === 'webp' ? 'image/webp' : 'image/jpeg';
                }

                const dataUrl = canvas.toDataURL(mimeType, 0.9);

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

    // Obtener el formato seleccionado y el prefijo
    const selectedFormat = formatSelect.value; // "webp" o "jpg"
    const prefix = document.getElementById('prefix-input').value.trim(); // Obtener el prefijo

    // Sincronizar los nombres personalizados con los inputs
    const renameInputs = document.querySelectorAll('.rename-input');
    renameInputs.forEach((input, index) => {
        const newName = input.value.trim();
        if (newName) {
            // Agregar el prefijo y la extensión seleccionada al final del nombre personalizado
            convertedImages[index].filename = `${prefix}${newName}.${selectedFormat}`;
        }
    });

    const zip = new JSZip();
    const folder = zip.folder("imagenes_convertidas");

    convertedImages.forEach(image => {
        const base64Data = image.dataUrl.split(",")[1]; // Extraer datos base64
        const updatedFilename = image.filename; // Usar el nombre actualizado con el prefijo y la extensión
        folder.file(updatedFilename, base64Data, { base64: true });
    });

    try {
        const content = await zip.generateAsync({ type: "blob" });
        const zipName = zipNameInput.value.trim() || "imagenes_convertidas"; // Usar el nombre del ZIP ingresado
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

    // Obtener el formato seleccionado y el prefijo
    const selectedFormat = formatSelect.value; // "webp" o "jpg"
    const prefix = document.getElementById('prefix-input').value.trim(); // Obtener el prefijo

    // Sincronizar los nombres personalizados con los inputs y descargar
    const renameInputs = document.querySelectorAll('.rename-input');
    renameInputs.forEach((input, index) => {
        const originalFilename = avifFiles[index].name; // Nombre original para fallback
        let newName = input.value.trim();

        // Si el input está vacío, usar el nombre original sin extensión
        if (!newName) {
            newName = originalFilename.replace(/\.[^/.]+$/, "");
        }

        // Construir el nombre final con prefijo y extensión
        const finalFilename = `${prefix}${newName}.${selectedFormat}`;

        // Descargar la imagen individualmente con el nombre final
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
    // Eliminar el archivo de la lista
    avifFiles.splice(index, 1);

    // Actualizar la previsualización
    updatePreview();

    // Deshabilitar el botón de convertir si no quedan imágenes
    if (avifFiles.length === 0) {
        convertButton.disabled = true;
        updateStatus("No hay imágenes para procesar");
    } else {
        updateStatus(`Se han seleccionado ${avifFiles.length} archivos`);
    }
}

function updatePreview() {
    // Limpiar el área de previsualización
    previewArea.innerHTML = '';

    // Volver a mostrar las imágenes restantes
    avifFiles.forEach((file, index) => {
        const reader = new FileReader();
        reader.onload = function (e) {
            displayPreview(e.target.result, file.name, index);
        };
        reader.readAsDataURL(file);
    });
}
