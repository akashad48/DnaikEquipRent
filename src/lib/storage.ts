import { storage } from './firebase';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { v4 as uuidv4 } from 'uuid';

/**
 * Uploads a file to Firebase Storage and returns the public download URL.
 * This method ensures file uniqueness by creating a unique folder for each upload,
 * preserving the original filename. This prevents file collisions in the storage bucket.
 * @param file The file to upload.
 * @param path The base path in Firebase Storage (e.g., 'equipment-photos').
 * @returns A promise that resolves to the public URL of the uploaded file.
 */
export const uploadFile = async (file: File, path: string): Promise<string> => {
  if (!storage) {
    throw new Error("Firebase Storage is not initialized.");
  }
  
  // Create a reference with a unique path to avoid filename collisions,
  // leveraging the concept of fullPath to ensure uniqueness.
  // The full path will be, for example: 'customer-photos/a-unique-uuid/original-filename.jpg'
  const uniquePath = `${path}/${uuidv4()}/${file.name}`;
  const storageRef = ref(storage, uniquePath);

  await uploadBytes(storageRef, file);
  const downloadURL = await getDownloadURL(storageRef);
  
  return downloadURL;
};
