const CLOUDINARY_CLOUD_NAME = import.meta.env.VITE_CLOUDINARY_CLOUD_NAME;
const CLOUDINARY_UPLOAD_PRESET = import.meta.env.VITE_CLOUDINARY_UPLOAD_PRESET;

type CloudinaryUploadResponse = {
  secure_url?: string;
};

export const cloudinaryService = {
  isConfigured(): boolean {
    return Boolean(CLOUDINARY_CLOUD_NAME && CLOUDINARY_UPLOAD_PRESET);
  },

  async uploadProfileImage(file: File): Promise<string> {
    if (!this.isConfigured()) {
      throw new Error('Cloudinary is not configured. Please set VITE_CLOUDINARY_CLOUD_NAME and VITE_CLOUDINARY_UPLOAD_PRESET.');
    }

    const formData = new FormData();
    formData.append('file', file);
    formData.append('upload_preset', CLOUDINARY_UPLOAD_PRESET as string);
    formData.append('folder', 'task-management/profile-pictures');

    const response = await fetch(
      `https://api.cloudinary.com/v1_1/${CLOUDINARY_CLOUD_NAME}/image/upload`,
      {
        method: 'POST',
        body: formData,
      },
    );

    if (!response.ok) {
      throw new Error('Image upload failed');
    }

    const data = (await response.json()) as CloudinaryUploadResponse;
    if (!data.secure_url) {
      throw new Error('Cloudinary did not return an image URL');
    }

    return data.secure_url;
  },
};
