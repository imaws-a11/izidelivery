import { storage } from './firebase';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';

// Upload usando Firebase Storage (já configurado via variáveis VITE_FIREBASE_*)
export const uploadToCloudinary = async (file: File): Promise<string> => {
  const ext = file.name.split('.').pop() || 'jpg';
  const fileName = `uploads/${Date.now()}_${Math.random().toString(36).substring(2)}.${ext}`;
  const storageRef = ref(storage, fileName);

  const snapshot = await uploadBytes(storageRef, file);
  const url = await getDownloadURL(snapshot.ref);
  return url;
};
