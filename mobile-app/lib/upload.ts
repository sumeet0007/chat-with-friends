import { api } from './api';

export const uploadFile = async (uri: string) => {
    try {
        const filename = uri.split('/').pop() || 'upload.jpg';
        const formData = new FormData();
        
        // @ts-ignore
        formData.append('file', {
            uri: uri,
            name: filename,
            type: 'image/jpeg',
        });

        const res = await api.post("/api/mobile/upload", formData, {
            headers: {
                'Content-Type': 'multipart/form-data',
            },
        });

        return res.data?.url || null;
    } catch (error) {
        console.error("[UPLOAD_FILE_ERROR]", error);
        return null;
    }
};
