import JSZip from 'jszip';
import { ImageLink, ProcessingStatus } from '../types';

// 多個代理伺服器輪詢
const CORS_PROXIES = [
  'https://corsproxy.io/?',
  'https://api.allorigins.win/raw?url=',
  'https://api.codetabs.com/v1/proxy?quest='
];

const sleep = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

const downloadWithRetry = async (url: string, retries = 3, proxyIndex = 0): Promise<Response> => {
  try {
    const proxyUrl = `${CORS_PROXIES[proxyIndex]}${encodeURIComponent(url)}`;
    console.log(`嘗試使用代理 ${proxyIndex + 1}/${CORS_PROXIES.length} 下載: ${url}`);
    
    const response = await fetch(proxyUrl, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
      }
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    
    return response;
  } catch (error) {
    if (retries > 0) {
      console.log(`重試下載 (剩餘重試次數: ${retries - 1})`);
      // 嘗試下一個代理
      const nextProxyIndex = (proxyIndex + 1) % CORS_PROXIES.length;
      await sleep(1000); // 等待1秒後重試
      return downloadWithRetry(url, retries - 1, nextProxyIndex);
    }
    throw error;
  }
};

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

  console.log(`開始處理 ${images.length} 張圖片...`);

  // 分批處理圖片，每批5張
  const batchSize = 5;
  for (let i = 0; i < images.length; i += batchSize) {
    const batch = images.slice(i, i + batchSize);
    const batchPromises = batch.map(async (image, batchIndex) => {
      const index = i + batchIndex;
      try {
        console.log(`[${index + 1}/${images.length}] 開始下載: ${image.url}`);
        
        const response = await downloadWithRetry(image.url);
        console.log(`[${index + 1}/${images.length}] 下載完成，開始處理...`);
        
        const blob = await response.blob();
        const filename = image.url.split('/').pop() || 'image.jpg';
        
        console.log(`[${index + 1}/${images.length}] 添加到壓縮檔: ${filename}`);
        zip.file(filename, blob);
        
        status.successful++;
        console.log(`✅ [${index + 1}/${images.length}] 處理成功！`);
      } catch (error) {
        console.error(`❌ [${index + 1}/${images.length}] 下載失敗:`, image.url);
        console.error('錯誤詳情:', error);
        status.failed++;
      } finally {
        status.processed++;
        const progress = Math.round((status.processed / images.length) * 100);
        console.log(`進度: ${progress}% (${status.processed}/${images.length})`);
        console.log(`成功: ${status.successful}, 失敗: ${status.failed}`);
        onProgress({ ...status });
      }
    });

    await Promise.all(batchPromises);
    // 每批處理完後等待一段時間
    if (i + batchSize < images.length) {
      console.log('等待2秒後處理下一批...');
      await sleep(2000);
    }
  }

  console.log('所有圖片處理完成，正在生成壓縮檔...');
  const finalZip = await zip.generateAsync({ type: 'blob' });
  console.log('壓縮檔生成完成！');
  return finalZip;
};