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
    const response = await fetch(url, { method: 'HEAD' });
    const contentType = response.headers.get('content-type');
    return contentType?.startsWith('image/') || false;
  } catch {
    return false;
  }
};