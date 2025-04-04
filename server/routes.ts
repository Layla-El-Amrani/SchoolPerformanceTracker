import type { Express, Request, Response } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { setupAuth } from "./auth";
import multer from "multer";
import path from "path";
import fs from "fs";
import { 
  processExcelFile, 
  processXmlFile,
  calculateSchoolPerformanceSummaries
} from "./file-processor";
import { insertSchoolSchema, insertSubjectSchema } from "@shared/schema";

// Setup file upload
const uploadDir = path.join(process.cwd(), "temp-uploads");
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

const storage2 = multer.diskStorage({
  destination: (_req, _file, cb) => {
    cb(null, uploadDir);
  },
  filename: (_req, file, cb) => {
    const uniqueSuffix = `${Date.now()}-${Math.round(Math.random() * 1E9)}`;
    cb(null, `${uniqueSuffix}-${file.originalname}`);
  }
});

const upload = multer({ 
  storage: storage2,
  limits: {
    fileSize: 10 * 1024 * 1024 // 10MB max file size
  },
  fileFilter: (_req, file, cb) => {
    const ext = path.extname(file.originalname).toLowerCase();
    if (ext === '.xlsx' || ext === '.xls' || ext === '.xml') {
      cb(null, true);
    } else {
      cb(new Error('Only Excel files (.xlsx, .xls) and XML files are allowed'));
    }
  }
});

export async function registerRoutes(app: Express): Promise<Server> {
  // Setup authentication
  setupAuth(app);

  // Academic Years
  app.get("/api/academic-years", async (_req, res) => {
    try {
      const academicYears = await storage.getAcademicYears();
      res.json(academicYears);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch academic years" });
    }
  });

  app.get("/api/academic-years/active", async (_req, res) => {
    try {
      const activeYear = await storage.getActiveAcademicYear();
      if (!activeYear) {
        return res.status(404).json({ message: "No active academic year found" });
      }
      res.json(activeYear);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch active academic year" });
    }
  });

  // Terms
  app.get("/api/terms/:academicYearId", async (req, res) => {
    try {
      const academicYearId = parseInt(req.params.academicYearId, 10);
      if (isNaN(academicYearId)) {
        return res.status(400).json({ message: "Invalid academic year ID" });
      }
      
      const terms = await storage.getTermsByAcademicYear(academicYearId);
      res.json(terms);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch terms" });
    }
  });

  // Schools
  app.get("/api/schools", async (_req, res) => {
    try {
      const schools = await storage.getSchools();
      res.json(schools);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch schools" });
    }
  });

  app.post("/api/schools", async (req, res) => {
    try {
      // Validate request body
      const parseResult = insertSchoolSchema.safeParse(req.body);
      if (!parseResult.success) {
        return res.status(400).json({ message: "Invalid school data" });
      }
      
      const school = await storage.createSchool(parseResult.data);
      res.status(201).json(school);
    } catch (error) {
      res.status(500).json({ message: "Failed to create school" });
    }
  });

  // Subjects
  app.get("/api/subjects", async (_req, res) => {
    try {
      const subjects = await storage.getSubjects();
      res.json(subjects);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch subjects" });
    }
  });

  app.post("/api/subjects", async (req, res) => {
    try {
      // Validate request body
      const parseResult = insertSubjectSchema.safeParse(req.body);
      if (!parseResult.success) {
        return res.status(400).json({ message: "Invalid subject data" });
      }
      
      const subject = await storage.createSubject(parseResult.data);
      res.status(201).json(subject);
    } catch (error) {
      res.status(500).json({ message: "Failed to create subject" });
    }
  });

  // School Performance Summaries
  app.get("/api/school-performance", async (req, res) => {
    try {
      let academicYearId: number;
      
      if (req.query.academicYearId) {
        academicYearId = parseInt(req.query.academicYearId as string, 10);
        if (isNaN(academicYearId)) {
          return res.status(400).json({ message: "Invalid academic year ID format" });
        }
      } else {
        // Get active academic year if not provided
        const activeYear = await storage.getActiveAcademicYear();
        if (!activeYear) {
          return res.json([]);  // Return empty array if no active year
        }
        academicYearId = activeYear.id;
      }
      
      const termId = req.query.termId ? parseInt(req.query.termId as string, 10) : undefined;
      
      const summaries = await storage.getSchoolPerformanceSummaries(academicYearId, termId);
      res.json(summaries);
    } catch (error) {
      console.error("Error fetching school performance:", error);
      res.status(500).json({ message: "Failed to fetch school performance summaries" });
    }
  });

  app.get("/api/school-performance/:schoolId", async (req, res) => {
    try {
      const schoolId = parseInt(req.params.schoolId, 10);
      let academicYearId: number;
      
      if (req.query.academicYearId) {
        academicYearId = parseInt(req.query.academicYearId as string, 10);
        if (isNaN(academicYearId)) {
          return res.status(400).json({ message: "Invalid academic year ID format" });
        }
      } else {
        // Get active academic year if not provided
        const activeYear = await storage.getActiveAcademicYear();
        if (!activeYear) {
          return res.status(404).json({ message: "No active academic year found" });
        }
        academicYearId = activeYear.id;
      }
      
      const termId = req.query.termId ? parseInt(req.query.termId as string, 10) : undefined;
      
      if (isNaN(schoolId)) {
        return res.status(400).json({ message: "Invalid school ID" });
      }
      
      const summary = await storage.getSchoolPerformanceSummaryBySchool(schoolId, academicYearId, termId);
      if (!summary) {
        return res.status(404).json({ message: "School performance summary not found" });
      }
      
      res.json(summary);
    } catch (error) {
      console.error("Error fetching school performance for school:", error);
      res.status(500).json({ message: "Failed to fetch school performance summary" });
    }
  });

  // Student Performances
  app.get("/api/student-performances", async (req, res) => {
    try {
      const schoolId = req.query.schoolId ? parseInt(req.query.schoolId as string, 10) : undefined;
      const subjectId = req.query.subjectId ? parseInt(req.query.subjectId as string, 10) : undefined;
      let academicYearId: number;
      
      if (req.query.academicYearId) {
        academicYearId = parseInt(req.query.academicYearId as string, 10);
        if (isNaN(academicYearId)) {
          return res.status(400).json({ message: "Invalid academic year ID format" });
        }
      } else {
        // Get active academic year if not provided
        const activeYear = await storage.getActiveAcademicYear();
        if (!activeYear) {
          return res.json([]);  // Return empty array if no active year
        }
        academicYearId = activeYear.id;
      }
      
      const termId = req.query.termId ? parseInt(req.query.termId as string, 10) : undefined;
      
      let performances = [];
      
      if (schoolId) {
        performances = await storage.getStudentPerformancesBySchool(schoolId, academicYearId, termId);
      } else if (subjectId) {
        performances = await storage.getStudentPerformancesBySubject(subjectId, academicYearId, termId);
      } else {
        return res.status(400).json({ message: "Either schoolId or subjectId is required" });
      }
      
      res.json(performances);
    } catch (error) {
      console.error("Error fetching student performances:", error);
      res.status(500).json({ message: "Failed to fetch student performances" });
    }
  });

  // File Uploads
  app.get("/api/file-uploads", async (req, res) => {
    try {
      if (!req.isAuthenticated()) {
        return res.status(401).json({ message: "Unauthorized" });
      }
      
      const fileUploads = await storage.getFileUploadsByUser(req.user.id);
      res.json(fileUploads);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch file uploads" });
    }
  });

  app.post("/api/upload", upload.single('file'), async (req, res) => {
    try {
      if (!req.isAuthenticated()) {
        return res.status(401).json({ message: "Unauthorized" });
      }
      
      if (!req.file) {
        return res.status(400).json({ message: "No file uploaded" });
      }
      
      const academicYearId = parseInt(req.body.academicYearId, 10);
      const termId = req.body.termId ? parseInt(req.body.termId, 10) : undefined;
      
      if (isNaN(academicYearId)) {
        return res.status(400).json({ message: "Invalid academic year ID" });
      }
      
      // Create file upload record
      const fileUpload = await storage.createFileUpload({
        filename: req.file.originalname,
        userId: req.user.id,
        fileSize: req.file.size,
        academicYearId,
        termId: termId || null,
        status: "processing"
      });
      
      // Process file based on type
      const filePath = req.file.path;
      const fileExt = path.extname(req.file.originalname).toLowerCase();
      
      let processResult;
      if (fileExt === '.xml') {
        processResult = await processXmlFile(filePath, academicYearId, termId);
      } else {
        processResult = await processExcelFile(filePath, academicYearId, termId);
      }
      
      // Clean up temporary file
      fs.unlink(filePath, (err) => {
        if (err) console.error("Error deleting temporary file:", err);
      });
      
      if (processResult.error) {
        await storage.updateFileUploadStatus(fileUpload.id, "error");
        return res.status(400).json({ message: processResult.error });
      }
      
      // Save student performances
      await storage.createManyStudentPerformances(processResult.studentPerformances);
      
      // Calculate and save school performance summaries
      const summaries = await calculateSchoolPerformanceSummaries(academicYearId, termId);
      
      for (const summary of summaries) {
        // Check if a summary already exists for this school/year/term
        const existingSummary = await storage.getSchoolPerformanceSummaryBySchool(
          summary.schoolId, 
          summary.academicYearId, 
          summary.termId
        );
        
        if (existingSummary) {
          // Update existing summary
          await storage.updateSchoolPerformanceSummary(existingSummary.id, summary);
        } else {
          // Create new summary
          await storage.createSchoolPerformanceSummary(summary);
        }
      }
      
      // Update file upload status
      await storage.updateFileUploadStatus(fileUpload.id, "processed");
      
      res.status(200).json({ 
        message: "File processed successfully",
        fileUpload: await storage.getFileUpload(fileUpload.id)
      });
    } catch (error) {
      console.error("Error processing file upload:", error);
      res.status(500).json({ 
        message: "Failed to process file upload", 
        error: error instanceof Error ? error.message : String(error)
      });
    }
  });

  const httpServer = createServer(app);

  return httpServer;
}
