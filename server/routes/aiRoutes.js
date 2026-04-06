import express from "express";
import protect from "../middlewares/authMiddleware.js";
import upload from "../configs/multer.js";

import {
  analyzeResume,
  enhanceJobDescription,
  enhanceProfessionalSummary,
  uploadResume,
  fixResumeWithAI   // ✅ ADD THIS
} from "../controllers/aiController.js";

const aiRouter = express.Router();

// ✅ Existing routes
aiRouter.post('/enhance-pro-sum', protect, enhanceProfessionalSummary);
aiRouter.post('/enhance-job-desc', protect, enhanceJobDescription);

// ✅ Upload resume
aiRouter.post(
  '/upload-resume',
  protect,
  upload.single("resume"),
  uploadResume
);

// ✅ Analyze resume
aiRouter.post(
  '/analyze-resume',
  protect,
  analyzeResume
);

// ✅ NEW: Fix Resume with AI 🔥
aiRouter.post(
  '/fix-resume',
  protect,
  fixResumeWithAI
);

export default aiRouter;