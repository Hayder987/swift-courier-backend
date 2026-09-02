import multer from "multer";

// Set up Multer for handling file uploads
const storage = multer.memoryStorage();

export const upload = multer({
	storage,
	limits: {
		fileSize: 8 * 1024 * 1024,
	},
});
