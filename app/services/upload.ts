import api from './Config';

/**
 * Uploads a single file (image or doc) to AWS S3.
 * @param formData - FormData containing the file field
 */
export const uploadSingleFile = (formData: FormData) => {
  return api.post('/upload/single', formData, {
    headers: {
      'Content-Type': 'multipart/form-data',
    },
  });
};

export default {
  uploadSingleFile,
};
