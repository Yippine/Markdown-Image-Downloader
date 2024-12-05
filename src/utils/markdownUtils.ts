import { marked } from 'marked';
import { ImageLink } from '../types';

export const extractImageLinks = (markdown: string): string[] => {
  const links: string[] = [];
  const renderer = new marked.Renderer();
  
  renderer.image = (href) => {
    if (href) links.push(href);
    return '';
  };

  marked(markdown, { renderer });
  return [...new Set(links)];
};

export const validateImageUrl = async (url: string): Promise<boolean> => {
  try {
    // Use no-cors mode to avoid CORS issues during validation
    const response = await fetch(url, {
      method: 'HEAD',
      mode: 'no-cors',
      credentials: 'omit'
    });
    
    // Since we're using no-cors, we can't access headers
    // We'll assume the URL is valid if we get a response
    return true;
  } catch {
    return false;
  }
};