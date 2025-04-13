import multer from 'multer';
import { bucket } from '../config/firebase.js';
import path from 'path';
import { v4 as uuidv4 } from 'uuid';

const storage = multer.memoryStorage();

export const upload = multer({
  storage: storage,
  limits: { fileSize: 5 * 1024 * 1024 },
  fileFilter: (_, file, cb) => {
    if (!file.mimetype.startsWith('image/')) {
      return cb(new Error('Only image files are allowed!'), false);
    }
    cb(null, true);
  },
});

export const uploadToFirebase = async (file, folder = 'avatars') => {
  try {
    if (!file) throw new Error('No file provided');

    const fileExtension = path.extname(file.originalname);
    const fileName = `${folder}/${uuidv4()}${fileExtension}`;

    const fileRef = bucket.file(fileName);

    const stream = fileRef.createWriteStream({
      metadata: {
        contentType: file.mimetype,
      },
    });

    return new Promise((resolve, reject) => {
      stream.on('error', (error) => {
        reject(error);
      });

      stream.on('finish', async () => {
        await fileRef.makePublic();

        const publicUrl = `https://storage.googleapis.com/${bucket.name}/${fileName}`;
        resolve(publicUrl);
      });

      stream.end(file.buffer);
    });
  } catch (error) {
    console.error('Error uploading file to Firebase:', error);
    throw error;
  }
};

export const deleteFromFirebase = async (fileUrl) => {
  try {
    if (!fileUrl) throw new Error('No file URL provided');

    const bucketName = bucket.name;
    const storageUrl = `https://storage.googleapis.com/${bucketName}/`;

    if (!fileUrl.startsWith(storageUrl)) {
      console.warn('URL does not match Firebase Storage pattern:', fileUrl);
      return false;
    }

    const filePath = fileUrl.replace(storageUrl, '');
    const fileRef = bucket.file(filePath);

    const [exists] = await fileRef.exists();
    if (!exists) {
      console.warn(`File does not exist in Firebase Storage: ${filePath}`);
      return false;
    }

    await fileRef.delete();
    console.log(`Successfully deleted file from Firebase Storage: ${filePath}`);
    return true;
  } catch (error) {
    console.error('Error deleting file from Firebase:', error);
    return false;
  }
};
