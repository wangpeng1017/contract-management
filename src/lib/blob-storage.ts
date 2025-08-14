import { put, del, list, head } from '@vercel/blob';
import { BLOB_CONTAINERS } from './database';

// 文件上传到Vercel Blob存储
export async function uploadFile(
  file: File,
  container: keyof typeof BLOB_CONTAINERS,
  filename?: string
): Promise<{ url: string; pathname: string }> {
  try {
    const actualFilename = filename || `${Date.now()}-${file.name}`;
    const pathname = `${BLOB_CONTAINERS[container]}/${actualFilename}`;
    
    const blob = await put(pathname, file, {
      access: 'public',
      addRandomSuffix: false,
    });

    return {
      url: blob.url,
      pathname: blob.pathname
    };
  } catch (error) {
    console.error('文件上传失败:', error);
    throw new Error('文件上传失败');
  }
}

// 删除文件
export async function deleteFile(url: string): Promise<void> {
  try {
    await del(url);
  } catch (error) {
    console.error('文件删除失败:', error);
    throw new Error('文件删除失败');
  }
}

// 列出文件
export async function listFiles(
  container: keyof typeof BLOB_CONTAINERS,
  options?: {
    limit?: number;
    prefix?: string;
  }
): Promise<Array<{ url: string; pathname: string; size: number; uploadedAt: Date }>> {
  try {
    const prefix = `${BLOB_CONTAINERS[container]}/`;
    const result = await list({
      prefix: options?.prefix ? `${prefix}${options.prefix}` : prefix,
      limit: options?.limit || 100,
    });

    return result.blobs.map(blob => ({
      url: blob.url,
      pathname: blob.pathname,
      size: blob.size,
      uploadedAt: blob.uploadedAt
    }));
  } catch (error) {
    console.error('文件列表获取失败:', error);
    throw new Error('文件列表获取失败');
  }
}

// 获取文件信息
export async function getFileInfo(url: string): Promise<{
  url: string;
  pathname: string;
  size: number;
  uploadedAt: Date;
} | null> {
  try {
    const result = await head(url);
    return {
      url: result.url,
      pathname: result.pathname,
      size: result.size,
      uploadedAt: result.uploadedAt
    };
  } catch (error) {
    console.error('文件信息获取失败:', error);
    return null;
  }
}

// 生成安全的文件名
export function generateSafeFilename(originalName: string, prefix?: string): string {
  const timestamp = Date.now();
  const randomSuffix = Math.random().toString(36).substring(2, 8);
  const extension = originalName.split('.').pop();
  const baseName = originalName
    .replace(/\.[^/.]+$/, '')
    .replace(/[^a-zA-Z0-9\u4e00-\u9fa5]/g, '_')
    .substring(0, 50);
  
  const filename = `${baseName}_${timestamp}_${randomSuffix}.${extension}`;
  return prefix ? `${prefix}_${filename}` : filename;
}

// 验证文件类型
export function validateFileType(file: File, allowedTypes: string[]): boolean {
  return allowedTypes.includes(file.type);
}

// 验证文件大小
export function validateFileSize(file: File, maxSizeInMB: number): boolean {
  const maxSizeInBytes = maxSizeInMB * 1024 * 1024;
  return file.size <= maxSizeInBytes;
}

// 格式化文件大小
export function formatFileSize(bytes: number): string {
  if (bytes === 0) return '0 Bytes';
  
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
}
