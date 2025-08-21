import fs from 'fs';
import { v4 as uuidv4 } from 'uuid';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Create uploads directory if it doesn't exist
const uploadsDir = path.join(__dirname, '../../uploads');
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
}

/**
 * Upload a file to local storage
 * @param {Object} file - The file object from multer
 * @returns {Promise<string>} The URL of the uploaded file
 */
export const uploadFile = async (file) => {
  try {
    if (!file) {
      throw new Error('No file provided');
    }

    // Generate unique filename
    const fileExtension = path.extname(file.originalname);
    const fileName = `${uuidv4()}${fileExtension}`;
    const filePath = path.join(uploadsDir, fileName);

    // Write file to disk
    await fs.promises.writeFile(filePath, file.buffer);

    // Return the relative URL
    return fileName;
  } catch (error) {
    console.error('Error uploading file:', error);
    throw new Error('Failed to upload file');
  }
};

/**
 * Delete a file from local storage
 * @param {string} fileUrl - The URL of the file to delete
 * @returns {Promise<void>}
 */
export const deleteFile = async (fileUrl) => {
  try {
    if (!fileUrl) {
      throw new Error('No file URL provided');
    }

    // Extract the filename from the URL
    const fileName = fileUrl.split('/').pop();
    const filePath = path.join(uploadsDir, fileName);

    // Check if file exists before deleting
    if (fs.existsSync(filePath)) {
      await fs.promises.unlink(filePath);
    }
  } catch (error) {
    console.error('Error deleting file:', error);
    throw new Error('Failed to delete file');
  }
};
