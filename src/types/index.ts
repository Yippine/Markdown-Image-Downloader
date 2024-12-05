export interface ImageLink {
  url: string;
  isValid: boolean;
  error?: string;
}

export interface ProcessingStatus {
  total: number;
  processed: number;
  successful: number;
  failed: number;
}