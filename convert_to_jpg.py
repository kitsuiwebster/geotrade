#!/usr/bin/env python3
"""
Script pour convertir toutes les images du dossier temp en JPG
"""

import os
import sys
from PIL import Image
import glob

# Essayer différentes méthodes pour le support AVIF
AVIF_SUPPORT = False

# Méthode 1: pillow-heif (HEIF/HEIC + AVIF si version >= 0.10)
try:
    import pillow_heif
    pillow_heif.register_heif_opener()
    if hasattr(pillow_heif, "register_avif_opener"):
        pillow_heif.register_avif_opener()
        AVIF_SUPPORT = True
        print("✅ Support AVIF activé via pillow-heif")
    else:
        print("ℹ️  pillow-heif < 0.10 : HEIF activé mais pas AVIF (mettez à jour avec pip install --upgrade pillow-heif)")
except ImportError:
    pass

# Méthode 2: pillow-avif-plugin (fallback dédié AVIF)
if not AVIF_SUPPORT:
    try:
        import pillow_avif  # noqa: F401  l'import enregistre le plugin automatiquement
        AVIF_SUPPORT = True
        print("✅ Support AVIF activé via pillow-avif-plugin")
    except ImportError:
        pass

if not AVIF_SUPPORT:
    print("⚠️  Aucun support AVIF trouvé. Essayez: pip install --upgrade pillow-heif  (ou pip install pillow-avif-plugin)")

def convert_images_to_jpg(input_dir="./temp"):
    """
    Convertit toutes les images d'un dossier en JPG
    
    Args:
        input_dir (str): Chemin vers le dossier contenant les images
    """
    
    # Vérifier si le dossier existe
    if not os.path.exists(input_dir):
        print(f"❌ Le dossier {input_dir} n'existe pas!")
        return
    
    # Extensions d'images supportées
    image_extensions = ['*.png', '*.jpeg', '*.webp', '*.avif', '*.bmp', '*.tiff', '*.gif']
    
    converted_count = 0
    error_count = 0
    
    print(f"🔄 Conversion des images dans {input_dir}...")
    
    # Parcourir toutes les extensions
    for extension in image_extensions:
        files = glob.glob(os.path.join(input_dir, extension))
        files.extend(glob.glob(os.path.join(input_dir, extension.upper())))
        
        for file_path in files:
            try:
                # Obtenir le nom de fichier sans extension
                base_name = os.path.splitext(os.path.basename(file_path))[0]
                output_path = os.path.join(input_dir, f"{base_name}.jpg")
                
                # Si c'est déjà un JPG, passer
                if file_path.lower().endswith('.jpg'):
                    print(f"⏭️  Déjà en JPG: {os.path.basename(file_path)}")
                    continue
                
                # Ouvrir l'image
                with Image.open(file_path) as img:
                    # Convertir en RGB si nécessaire (pour les PNG avec transparence)
                    if img.mode in ('RGBA', 'LA', 'P'):
                        # Créer un fond blanc pour les images avec transparence
                        background = Image.new('RGB', img.size, (255, 255, 255))
                        if img.mode == 'P':
                            img = img.convert('RGBA')
                        background.paste(img, mask=img.split()[-1] if img.mode == 'RGBA' else None)
                        img = background
                    elif img.mode != 'RGB':
                        img = img.convert('RGB')
                    
                    # Sauvegarder en JPG avec qualité 90
                    img.save(output_path, 'JPEG', quality=90, optimize=True)
                    
                    print(f"✅ {os.path.basename(file_path)} → {base_name}.jpg")
                    converted_count += 1
                    
                    # Supprimer le fichier original
                    os.remove(file_path)
                    
            except Exception as e:
                if file_path.lower().endswith('.avif') and not AVIF_SUPPORT:
                    print(f"⚠️  {os.path.basename(file_path)}: Format AVIF non supporté (installez pillow-avif)")
                else:
                    print(f"❌ Erreur avec {os.path.basename(file_path)}: {str(e)}")
                error_count += 1
    
    print(f"\n📊 Résultats:")
    print(f"   ✅ Convertis: {converted_count}")
    print(f"   ❌ Erreurs: {error_count}")
    print(f"   📁 Dossier: {input_dir}")

if __name__ == "__main__":
    # Permettre de spécifier un dossier différent en argument
    input_directory = sys.argv[1] if len(sys.argv) > 1 else "./temp"
    convert_images_to_jpg(input_directory)