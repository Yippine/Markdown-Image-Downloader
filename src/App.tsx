import React, { useState } from 'react';
import { FileUploader } from './components/FileUploader';
import { ProgressBar } from './components/ProgressBar';
import { Download } from 'lucide-react';
import { isMarkdownFile, readFileAsText } from './utils/fileUtils';
import { extractImageLinks, validateImageUrl } from './utils/markdownUtils';
import { downloadImages } from './utils/downloadUtils';
import { ImageLink, ProcessingStatus } from './types';

function App() {
  const [processing, setProcessing] = useState(false);
  const [status, setStatus] = useState<ProcessingStatus>({
    total: 0,
    processed: 0,
    successful: 0,
    failed: 0
  });
  const [downloadReady, setDownloadReady] = useState(false);
  const [zipBlob, setZipBlob] = useState<Blob | null>(null);
  const [fileName, setFileName] = useState<string>('');

  const handleFileSelect = async (file: File) => {
    if (!isMarkdownFile(file)) {
      alert('Please select a valid Markdown file (.md or .markdown)');
      return;
    }

    setProcessing(true);
    setDownloadReady(false);
    setFileName(file.name.replace(/\.(md|markdown)$/, ''));
    
    try {
      const content = await readFileAsText(file);
      const links = extractImageLinks(content);
      
      if (links.length === 0) {
        alert('No images found in the Markdown file');
        setProcessing(false);
        return;
      }

      setStatus({
        total: links.length,
        processed: 0,
        successful: 0,
        failed: 0
      });

      const imageLinks: ImageLink[] = await Promise.all(
        links.map(async (url) => ({
          url,
          isValid: await validateImageUrl(url)
        }))
      );

      const validImages = imageLinks.filter(img => img.isValid);
      
      if (validImages.length === 0) {
        alert('No valid images found in the Markdown file');
        setProcessing(false);
        return;
      }

      const blob = await downloadImages(validImages, setStatus);
      setZipBlob(blob);
      setDownloadReady(true);
    } catch (error) {
      console.error('Error processing file:', error);
      alert('An error occurred while processing the file');
    } finally {
      setProcessing(false);
    }
  };

  const handleDownload = () => {
    if (!zipBlob) return;
    
    const url = URL.createObjectURL(zipBlob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${fileName}-images-${new Date().toISOString().split('T')[0]}.zip`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  return (
    <div className="min-h-screen bg-gray-100 p-8">
      <div className="max-w-2xl mx-auto">
        <h1 className="text-3xl font-bold text-gray-800 mb-8 text-center">
          Markdown Image Extractor
        </h1>
        
        <div className="bg-white rounded-lg shadow-md p-6 mb-6">
          <FileUploader onFileSelect={handleFileSelect} />
        </div>

        {processing && (
          <div className="bg-white rounded-lg shadow-md p-6 mb-6">
            <h2 className="text-lg font-semibold mb-4">Processing Images</h2>
            <ProgressBar status={status} />
          </div>
        )}

        {downloadReady && (
          <div className="space-y-4">
            <div className="bg-green-50 border border-green-200 rounded-lg p-4">
              <p className="text-green-800">
                Successfully processed {status.successful} out of {status.total} images
              </p>
              {status.failed > 0 && (
                <p className="text-amber-600 mt-2">
                  Failed to process {status.failed} images
                </p>
              )}
            </div>
            <button
              onClick={handleDownload}
              className="w-full bg-blue-600 text-white rounded-lg py-3 px-6 flex items-center justify-center gap-2 hover:bg-blue-700 transition-colors"
            >
              <Download className="w-5 h-5" />
              Download Images
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

export default App;