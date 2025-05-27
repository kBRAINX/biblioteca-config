
export interface CloudinaryUploadResult {
  public_id: string;
  secure_url: string;
  url: string;
  format: string;
  resource_type: string;
  bytes: number;
  width?: number;
  height?: number;
}

export interface UploadOptions {
  folder?: string;
  transformation?: string;
  allowedFormats?: string[];
  maxFileSize?: number;
}