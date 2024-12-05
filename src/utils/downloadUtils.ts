import JSZip from 'jszip';
import { ImageLink, ProcessingStatus } from '../types';

export const downloadImages = async (
  images: ImageLink[],
  onProgress: (status: ProcessingStatus) => void
): Promise<Blob> => {
  const zip = new JSZip();
  const status: ProcessingStatus = {
    total: images.length,
    processed: 0,
    successful: 0,
    failed: 0
  };

  for (const image of images) {
    try {
      const response = await fetch(image.url);
      if (!response.ok) throw new Error('Failed to fetch image');
      
      const blob = await response.blob();
      const filename = image.url.split('/').pop() || 'image.jpg';
      zip.file(filename, blob);
      
      status.successful++;
    } catch {
      status.failed++;
    }
    
    status.processed++;
    onProgress({ ...status });
  }

  return zip.generateAsync({ type: 'blob' });
};