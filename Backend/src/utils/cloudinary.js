import { v2 as cloudinary } from "cloudinary";
import fs from "fs";

// This tells Cloudinary to parse your CLOUDINARY_URL automatically
cloudinary.config({
  cloudinary_url: process.env.CLOUDINARY_URL,
});

const uploadOnCloudinary = async (localFilePath) => {
  try {
    if (!localFilePath) return null;

    // Windows Path Normalization: Fixes the backslash (\) issue
    const normalizedPath = localFilePath.replace(/\\/g, "/");

    // Upload the file
    const response = await cloudinary.uploader.upload(normalizedPath, {
      resource_type: "auto", // Crucial: Supports PDF, PNG, JPG
    });

    // Attempt to delete the local temp file (Windows-safe)
    try {
      if (fs.existsSync(localFilePath)) {
        fs.unlinkSync(localFilePath);
      }
    } catch (err) {
      console.warn("Temporary file locked by Windows, skipping auto-delete:", localFilePath);
    }

    return response;
  } catch (error) {
    console.error("❌ Cloudinary Upload Error:", error.message);
    
    // Cleanup on failure
    try {
      if (fs.existsSync(localFilePath)) fs.unlinkSync(localFilePath);
    } catch (e) {}
    
    return null;
  }
};

export { uploadOnCloudinary };