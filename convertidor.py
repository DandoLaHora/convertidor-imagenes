#!/usr/bin/env python3
import os
import sys
from PIL import Image
import argparse
from concurrent.futures import ProcessPoolExecutor
import logging
from pillow_avif import register_avif_opener

# Registrar soporte para AVIF
register_avif_opener()

# Configurar logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(levelname)s - %(message)s',
    handlers=[
        logging.FileHandler("conversion.log"),
        logging.StreamHandler()
    ]
)

def convert_image(avif_path, output_dir=None, delete_original=False, quality=80, size=(1000, 1000), format='webp'):
    """
    Convierte un archivo AVIF a formato JPG o WEBP y lo redimensiona
    
    Args:
        avif_path: Ruta del archivo AVIF a convertir
        output_dir: Directorio de salida (opcional)
        delete_original: Si se debe eliminar el archivo original después de la conversión
        quality: Calidad de la imagen (1-100)
        size: Tamaño al que redimensionar la imagen (ancho, alto)
        format: Formato de salida ('jpg' o 'webp')
    
    Returns:
        bool: True si la conversión fue exitosa, False en caso contrario
    """
    try:
        # Verificar que el archivo existe y es un AVIF
        if not os.path.isfile(avif_path) or not avif_path.lower().endswith('.avif'):
            logging.warning(f"Archivo no válido o no es AVIF: {avif_path}")
            return False
        
        # Determinar la ruta de salida
        if output_dir:
            # Asegurar que el directorio de salida existe
            os.makedirs(output_dir, exist_ok=True)
            
            # Obtener solo el nombre del archivo
            filename = os.path.basename(avif_path)
            
            # Cambiar la extensión a la especificada
            output_filename = os.path.splitext(filename)[0] + f'.{format}'
            
            # Ruta completa del archivo de salida
            output_path = os.path.join(output_dir, output_filename)
        else:
            # Si no se especifica un directorio de salida, guardar en el mismo lugar
            output_path = os.path.splitext(avif_path)[0] + f'.{format}'
        
        # Abrir la imagen con PIL
        img = Image.open(avif_path)
        
        # Convertir a RGB (necesario para JPG y recomendado para WEBP)
        if img.mode != 'RGB':
            img = img.convert('RGB')
        
        # Redimensionar manteniendo la proporción
        img.thumbnail(size, Image.LANCZOS)
        
        # Guardar en el formato especificado
        if format.lower() == 'jpg' or format.lower() == 'jpeg':
            img.save(output_path, format='JPEG', quality=quality, optimize=True)
        elif format.lower() == 'webp':
            img.save(output_path, format='WEBP', quality=quality, method=6, lossless=False)
        else:
            logging.error(f"Formato no soportado: {format}")
            return False
        
        logging.info(f"Convertido: {avif_path} -> {output_path} ({img.width}x{img.height})")
        
        # Eliminar el original si se solicita
        if delete_original:
            os.remove(avif_path)
            logging.info(f"Original eliminado: {avif_path}")
        
        return True
    
    except Exception as e:
        logging.error(f"Error al convertir {avif_path}: {str(e)}")
        return False

def convert_image_wrapper(args):
    """Función envoltura para desempaquetar argumentos y llamar a convert_image."""
    return convert_image(*args)

def process_directory(directory, output_dir=None, recursive=False, delete_original=False, quality=80, size=(1000, 1000), format='webp'):
    """
    Procesa un directorio para convertir todos los archivos AVIF al formato especificado
    
    Args:
        directory: Directorio a procesar
        output_dir: Directorio de salida (opcional)
        recursive: Si se deben procesar subdirectorios
        delete_original: Si se deben eliminar los archivos originales
        quality: Calidad de la imagen (1-100)
        size: Tamaño al que redimensionar la imagen (ancho, alto)
        format: Formato de salida ('jpg' o 'webp')
    """
    # Verificar que el directorio existe
    if not os.path.isdir(directory):
        logging.error(f"El directorio no existe: {directory}")
        return
    
    # Lista para almacenar las rutas de todos los archivos AVIF
    avif_files = []
    
    # Recorrer el directorio
    if recursive:
        for root, _, files in os.walk(directory):
            for file in files:
                if file.lower().endswith('.avif'):
                    avif_files.append(os.path.join(root, file))
    else:
        for file in os.listdir(directory):
            if file.lower().endswith('.avif'):
                avif_files.append(os.path.join(directory, file))
    
    if not avif_files:
        logging.warning(f"No se encontraron archivos AVIF en {directory}")
        return
    
    logging.info(f"Encontrados {len(avif_files)} archivos AVIF para convertir")
    
    # Usar múltiples procesos para acelerar la conversión
    with ProcessPoolExecutor() as executor:
        # Preparar los argumentos para cada archivo
        args = [(avif_path, output_dir, delete_original, quality, size, format) for avif_path in avif_files]
        
        # Ejecutar la conversión en paralelo usando la función explícita
        results = list(executor.map(convert_image_wrapper, args))
    
    # Contar éxitos y fallos
    successes = results.count(True)
    failures = results.count(False)
    
    logging.info(f"Conversión completada. Éxitos: {successes}, Fallos: {failures}")

def main():
    parser = argparse.ArgumentParser(description='Conversor de AVIF a JPG/WEBP con redimensionamiento')
    parser.add_argument('directories', metavar='DIR', type=str, nargs='+',
                        help='Directorios a procesar (pueden ser múltiples)')
    parser.add_argument('-o', '--output', type=str, help='Directorio de salida')
    parser.add_argument('-r', '--recursive', action='store_true', 
                        help='Procesar recursivamente los subdirectorios')
    parser.add_argument('-d', '--delete', action='store_true',
                        help='Eliminar los archivos AVIF originales después de la conversión')
    parser.add_argument('-q', '--quality', type=int, default=80,
                        help='Calidad de la imagen (1-100, por defecto: 80)')
    parser.add_argument('-s', '--size', type=int, nargs=2, default=[1000, 1000],
                        help='Tamaño al que redimensionar la imagen (ancho alto, por defecto: 1000 1000)')
    parser.add_argument('-f', '--format', type=str, choices=['jpg', 'webp'], default='webp',
                        help='Formato de salida (jpg o webp, por defecto: webp)')
    
    args = parser.parse_args()
    
    # Validar el parámetro de calidad
    if args.quality < 1 or args.quality > 100:
        logging.error("La calidad debe estar entre 1 y 100")
        sys.exit(1)
    
    # Procesar cada directorio especificado
    for directory in args.directories:
        logging.info(f"Procesando directorio: {directory}")
        process_directory(
            directory, 
            output_dir=args.output, 
            recursive=args.recursive, 
            delete_original=args.delete,
            quality=args.quality,
            size=tuple(args.size),
            format=args.format
        )

if __name__ == "__main__":
    main()