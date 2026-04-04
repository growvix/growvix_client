/**
 * Utility to compress images using HTML5 Canvas.
 * This helps reduce the file size of high-quality images before uploading to the server.
 */

interface CompressionOptions {
  maxWidth?: number;
  maxHeight?: number;
  quality?: number;
  mimeType?: string;
}

/**
 * Compresses a single image file.
 * @param file The image file to compress.
 * @param options Compression options (maxWidth, maxHeight, quality, mimeType).
 * @returns A promise that resolves to the compressed File object.
 */
export const compressImage = (
  file: File,
  options: CompressionOptions = {}
): Promise<File> => {
  const {
    maxWidth = 1920, // Default max width
    maxHeight = 1080, // Default max height
    quality = 0.7,   // Default quality (0.0 to 1.0)
    mimeType = 'image/jpeg' // Default output format
  } = options;

  // We only compress images. If it's not an image (e.g. SVG or GIF), we skip compression.
  if (!file.type.startsWith('image/') || file.type === 'image/gif' || file.type === 'image/svg+xml') {
    return Promise.resolve(file);
  }

  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = (event) => {
      const img = new Image();
      img.src = event.target?.result as string;
      img.onload = () => {
        let width = img.width;
        let height = img.height;

        // Calculate aspect ratio and new dimensions
        if (width > height) {
          if (width > maxWidth) {
            height *= maxWidth / width;
            width = maxWidth;
          }
        } else {
          if (height > maxHeight) {
            width *= maxHeight / height;
            height = maxHeight;
          }
        }

        const canvas = document.createElement('canvas');
        canvas.width = width;
        canvas.height = height;

        const ctx = canvas.getContext('2d');
        if (!ctx) {
          return resolve(file); // Fallback to original file if canvas is not supported
        }

        ctx.drawImage(img, 0, 0, width, height);

        canvas.toBlob(
          (blob) => {
            if (!blob) {
              return resolve(file);
            }
            // Create a new file from the blob
            const compressedFile = new File([blob], file.name, {
              type: mimeType,
              lastModified: Date.now(),
            });
            
            // Log for debugging
            console.log(`Compressed ${file.name}: ${(file.size / 1024).toFixed(2)}KB -> ${(compressedFile.size / 1024).toFixed(2)}KB`);
            
            // If the compressed version is actually larger (rare but possible with very small/optimized images), keep the original
            if (compressedFile.size > file.size) {
                resolve(file);
            } else {
                resolve(compressedFile);
            }
          },
          mimeType,
          quality
        );
      };
      img.onerror = (err) => reject(err);
    };
    reader.onerror = (err) => reject(err);
  });
};

/**
 * Compresses multiple image files.
 * @param files Array or FileList of images.
 * @param options Compression options.
 * @returns A promise that resolves to an array of compressed File objects.
 */
export const compressImages = async (
  files: File[] | FileList,
  options: CompressionOptions = {}
): Promise<File[]> => {
  const fileArray = Array.isArray(files) ? files : Array.from(files);
  const compressionPromises = fileArray.map((file) => compressImage(file, options));
  return Promise.all(compressionPromises);
};
