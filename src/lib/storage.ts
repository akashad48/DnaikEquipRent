import { storage } from './firebase';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { v4 as uuidv4 } from 'uuid';
import { FirebaseError } from 'firebase/app';

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
  
  const uniquePath = `${path}/${uuidv4()}/${file.name}`;
  const storageRef = ref(storage, uniquePath);

  try {
    await uploadBytes(storageRef, file);
    const downloadURL = await getDownloadURL(storageRef);
    return downloadURL;
  } catch (error) {
    console.error("Firebase Storage Upload Error:", error);
    if (error instanceof FirebaseError) {
      switch (error.code) {
        case 'storage/unauthorized':
          throw new Error("Permission denied. Please check your Firebase Storage security rules to allow writes for authenticated users.");
        case 'storage/canceled':
          throw new Error("Upload canceled by the user.");
        case 'storage/unknown':
          throw new Error("An unknown error occurred. This could be a CORS configuration issue on your Google Cloud Storage bucket.");
        default:
          throw new Error(`An unexpected Firebase error occurred: ${error.message}`);
      }
    }
    // Re-throw if it's not a FirebaseError or a generic error
    throw error;
  }
};
