import { Response } from 'express';
import { handleUpload, type HandleUploadBody } from '@vercel/blob';
import { AuthenticatedRequest } from '../types/index.js';
import { deleteFromVercelBlob } from '../services/storage.service.js';

export const handleVercelBlobUpload = async (req: AuthenticatedRequest, res: Response) => {
  const body = req.body as HandleUploadBody;

  try {
    const jsonResponse = await handleUpload({
      body,
      request: req,
      onBeforeGenerateToken: async (pathname) => {
        // authenticateAdmin middleware already checks this, but we can double check here
        if (!req.user || req.user.role !== 'admin') {
          throw new Error('Only admins can upload files');
        }

        return {
          allowedContentTypes: ['image/jpeg', 'image/png', 'image/gif', 'image/webp', 'application/octet-stream', 'model/gltf-binary'],
          tokenPayload: JSON.stringify({
            userId: req.user.id,
          }),
        };
      },
      onUploadCompleted: async ({ blob, tokenPayload }) => {
        console.log('Blob upload completed:', blob.url);
      },
    });

    return res.json(jsonResponse);
  } catch (error) {
    console.error('Vercel Blob handleUpload error:', error);
    return res.status(400).json({ error: (error as Error).message });
  }
};

export const deleteVercelBlob = async (req: AuthenticatedRequest, res: Response) => {
  const { url } = req.query;
  if (!url || typeof url !== 'string') {
    return res.status(400).json({ error: 'URL is required' });
  }

  try {
    await deleteFromVercelBlob(url);
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: 'Failed to delete blob' });
  }
};
