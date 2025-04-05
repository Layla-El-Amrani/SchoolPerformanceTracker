import type { Express, Request, Response } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { setupAuth } from "./auth";
import multer from "multer";
import path from "path";
import fs from "fs";
import ExcelJS from 'exceljs';
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
      const getAll = req.query.all === 'true' || req.query.all === true;
      console.log('getAll parameter:', req.query.all, 'evaluated as:', getAll);
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
      } else if (getAll) {
        // Get all performances for the academic year and term
        // First get all subjects
        const subjects = await storage.getSubjects();
        for (const subject of subjects) {
          const subjectPerfs = await storage.getStudentPerformancesBySubject(subject.id, academicYearId, termId);
          performances = [...performances, ...subjectPerfs];
        }
      } else {
        return res.status(400).json({ message: "Either schoolId, subjectId, or all=true is required" });
      }
      
      res.json(performances);
    } catch (error) {
      console.error("Error fetching student performances:", error);
      res.status(500).json({ message: "Failed to fetch student performances" });
    }
  });

  // Export functionality
  app.get("/api/export", async (req, res) => {
    try {
      if (!req.isAuthenticated()) {
        return res.status(401).json({ message: "Unauthorized" });
      }
      
      // Get parameters from request
      const reportType = req.query.reportType as string || 'performance';
      const fileFormat = req.query.fileFormat as string || 'excel';
      const includeCharts = req.query.includeCharts === 'true';
      
      let academicYearId: number;
      if (req.query.academicYearId) {
        academicYearId = parseInt(req.query.academicYearId as string, 10);
        if (isNaN(academicYearId)) {
          return res.status(400).json({ message: "Invalid academic year ID" });
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
      
      // Get academic year info
      const academicYear = await storage.getAcademicYear(academicYearId);
      if (!academicYear) {
        return res.status(404).json({ message: "Academic year not found" });
      }
      
      // Get term info if specified
      let term;
      if (termId) {
        term = await storage.getTerm(termId);
        if (!term) {
          return res.status(404).json({ message: "Term not found" });
        }
      }
      
      // Get data for the report
      const schoolSummaries = await storage.getSchoolPerformanceSummaries(academicYearId, termId);
      
      // Get all schools for reference
      const schools = await storage.getSchools();
      const schoolMap = new Map(schools.map(school => [school.id, school]));
      
      // Get all subjects
      const subjects = await storage.getSubjects();
      
      // Create workbook
      const workbook = new ExcelJS.Workbook();
      workbook.creator = 'School Performance Analysis System';
      workbook.created = new Date();
      
      // Create the appropriate report based on type
      if (reportType === 'performance') {
        // Performance Summary Sheet
        const summarySheet = workbook.addWorksheet('Performance Summary');
        
        // Add title and metadata
        summarySheet.mergeCells('A1:F1');
        const titleCell = summarySheet.getCell('A1');
        titleCell.value = `School Performance Report - ${academicYear.name}${term ? ' - ' + term.name : ''}`;
        titleCell.font = { size: 16, bold: true };
        titleCell.alignment = { horizontal: 'center' };
        
        // Add header row
        summarySheet.addRow(['Rank', 'School', 'Average Score', 'Pass Rate', 'Improvement', 'Students Analyzed']);
        const headerRow = summarySheet.lastRow;
        headerRow?.eachCell(cell => {
          cell.font = { bold: true };
          cell.fill = {
            type: 'pattern',
            pattern: 'solid',
            fgColor: { argb: 'FFE0E0E0' }
          };
          cell.border = {
            top: { style: 'thin' },
            left: { style: 'thin' },
            bottom: { style: 'thin' },
            right: { style: 'thin' }
          };
        });
        
        // Add data rows
        // Sort by average score descending
        const sortedSummaries = [...schoolSummaries].sort((a, b) => b.averageScore - a.averageScore);
        
        sortedSummaries.forEach((summary, index) => {
          const school = schoolMap.get(summary.schoolId);
          summarySheet.addRow([
            index + 1, // Rank
            school ? school.name : `School ID ${summary.schoolId}`,
            summary.averageScore,
            summary.passRate + '%',
            (summary.improvementRate > 0 ? '+' : '') + summary.improvementRate + '%',
            summary.studentsCount
          ]);
        });
        
        // Format the data rows
        summarySheet.getColumn('C').numFmt = '0.00';
        summarySheet.getColumn('D').alignment = { horizontal: 'right' };
        summarySheet.getColumn('E').alignment = { horizontal: 'right' };
        
        // Auto-size columns
        summarySheet.columns.forEach(column => {
          column.width = 15;
        });
        
        // Add a Subject Performance sheet
        const subjectSheet = workbook.addWorksheet('Subject Performance');
        
        // Add title
        subjectSheet.mergeCells('A1:E1');
        const subjectTitleCell = subjectSheet.getCell('A1');
        subjectTitleCell.value = `Subject Performance Analysis - ${academicYear.name}${term ? ' - ' + term.name : ''}`;
        subjectTitleCell.font = { size: 16, bold: true };
        subjectTitleCell.alignment = { horizontal: 'center' };
        
        // Add header row
        subjectSheet.addRow(['Subject', 'Average Score', 'Pass Rate', 'Year-Over-Year Change', 'Schools Analyzed']);
        const subjectHeaderRow = subjectSheet.lastRow;
        subjectHeaderRow?.eachCell(cell => {
          cell.font = { bold: true };
          cell.fill = {
            type: 'pattern',
            pattern: 'solid',
            fgColor: { argb: 'FFE0E0E0' }
          };
          cell.border = {
            top: { style: 'thin' },
            left: { style: 'thin' },
            bottom: { style: 'thin' },
            right: { style: 'thin' }
          };
        });
        
        // For each subject, calculate averages across all schools
        for (const subject of subjects) {
          const performances = await storage.getStudentPerformancesBySubject(subject.id, academicYearId, termId);
          
          if (performances.length > 0) {
            const averageScore = performances.reduce((sum, perf) => sum + perf.averageScore, 0) / performances.length;
            const passRate = performances.reduce((sum, perf) => sum + perf.passRate, 0) / performances.length;
            const improvementRate = performances.reduce((sum, perf) => sum + (perf.improvementRate || 0), 0) / performances.length;
            
            subjectSheet.addRow([
              subject.name,
              averageScore.toFixed(2),
              passRate.toFixed(2) + '%',
              (improvementRate > 0 ? '+' : '') + improvementRate.toFixed(2) + '%',
              performances.length
            ]);
          }
        }
        
        // Format columns
        subjectSheet.getColumn('B').numFmt = '0.00';
        subjectSheet.getColumn('C').alignment = { horizontal: 'right' };
        subjectSheet.getColumn('D').alignment = { horizontal: 'right' };
        
        // Auto-size columns
        subjectSheet.columns.forEach(column => {
          column.width = 18;
        });
      }
      else if (reportType === 'comparison') {
        // School Comparison Sheet
        const comparisonSheet = workbook.addWorksheet('School Comparison');
        
        // Add title and metadata
        comparisonSheet.mergeCells('A1:G1');
        const titleCell = comparisonSheet.getCell('A1');
        titleCell.value = `School Comparison Report - ${academicYear.name}${term ? ' - ' + term.name : ''}`;
        titleCell.font = { size: 16, bold: true };
        titleCell.alignment = { horizontal: 'center' };
        
        // Add header row
        comparisonSheet.addRow(['School', 'Average Score', 'Pass Rate', 'Improvement', 'Students', 'Attendance', 'Performance Level']);
        
        const headerRow = comparisonSheet.lastRow;
        headerRow?.eachCell(cell => {
          cell.font = { bold: true };
          cell.fill = {
            type: 'pattern',
            pattern: 'solid',
            fgColor: { argb: 'FFE0E0E0' }
          };
          cell.border = {
            top: { style: 'thin' },
            left: { style: 'thin' },
            bottom: { style: 'thin' },
            right: { style: 'thin' }
          };
        });
        
        // Add data rows
        schoolSummaries.forEach(summary => {
          const school = schoolMap.get(summary.schoolId);
          let performanceLevel = 'Needs Improvement';
          if (summary.averageScore >= 80) performanceLevel = 'Excellent';
          else if (summary.averageScore >= 70) performanceLevel = 'Very Good';
          else if (summary.averageScore >= 60) performanceLevel = 'Good';
          else if (summary.averageScore >= 50) performanceLevel = 'Satisfactory';
          
          comparisonSheet.addRow([
            school ? school.name : `School ID ${summary.schoolId}`,
            summary.averageScore,
            summary.passRate + '%',
            (summary.improvementRate > 0 ? '+' : '') + summary.improvementRate + '%',
            summary.studentsCount,
            summary.attendanceRate ? summary.attendanceRate + '%' : 'N/A',
            performanceLevel
          ]);
        });
        
        // Format the data
        comparisonSheet.getColumn('B').numFmt = '0.00';
        comparisonSheet.getColumn('C').alignment = { horizontal: 'right' };
        comparisonSheet.getColumn('D').alignment = { horizontal: 'right' };
        comparisonSheet.getColumn('F').alignment = { horizontal: 'right' };
        
        // Auto-size columns
        comparisonSheet.columns.forEach(column => {
          column.width = 16;
        });
      }
      else if (reportType === 'distribution') {
        // Distribution Analysis Sheet
        const distributionSheet = workbook.addWorksheet('Score Distribution');
        
        // Add title and metadata
        distributionSheet.mergeCells('A1:F1');
        const titleCell = distributionSheet.getCell('A1');
        titleCell.value = `Score Distribution Report - ${academicYear.name}${term ? ' - ' + term.name : ''}`;
        titleCell.font = { size: 16, bold: true };
        titleCell.alignment = { horizontal: 'center' };
        
        // Add header for distribution
        distributionSheet.addRow(['Score Range', 'Number of Schools', 'Percentage of Total']);
        
        const headerRow = distributionSheet.lastRow;
        headerRow?.eachCell(cell => {
          cell.font = { bold: true };
          cell.fill = {
            type: 'pattern',
            pattern: 'solid',
            fgColor: { argb: 'FFE0E0E0' }
          };
          cell.border = {
            top: { style: 'thin' },
            left: { style: 'thin' },
            bottom: { style: 'thin' },
            right: { style: 'thin' }
          };
        });
        
        // Create distribution ranges
        const ranges = [
          { min: 90, max: 100, label: "90-100%" },
          { min: 80, max: 89.99, label: "80-89%" },
          { min: 70, max: 79.99, label: "70-79%" },
          { min: 60, max: 69.99, label: "60-69%" },
          { min: 50, max: 59.99, label: "50-59%" },
          { min: 0, max: 49.99, label: "Below 50%" }
        ];
        
        // Calculate distribution
        const totalSchools = schoolSummaries.length;
        for (const range of ranges) {
          const schoolsInRange = schoolSummaries.filter(
            summary => summary.averageScore >= range.min && summary.averageScore <= range.max
          );
          
          const percentage = (schoolsInRange.length / totalSchools) * 100;
          
          distributionSheet.addRow([
            range.label,
            schoolsInRange.length,
            percentage.toFixed(2) + '%'
          ]);
        }
        
        // Format columns
        distributionSheet.getColumn('C').alignment = { horizontal: 'right' };
        
        // Auto-size columns
        distributionSheet.columns.forEach(column => {
          column.width = 18;
        });
        
        // Add a list of schools in each range
        distributionSheet.addRow([]);
        distributionSheet.addRow(['Detailed School List by Performance Range']);
        const detailHeaderRow = distributionSheet.lastRow;
        detailHeaderRow?.eachCell(cell => {
          cell.font = { size: 14, bold: true };
        });
        
        for (const range of ranges) {
          const schoolsInRange = schoolSummaries.filter(
            summary => summary.averageScore >= range.min && summary.averageScore <= range.max
          );
          
          if (schoolsInRange.length > 0) {
            distributionSheet.addRow([range.label]);
            const rangeHeaderRow = distributionSheet.lastRow;
            rangeHeaderRow?.eachCell(cell => {
              cell.font = { bold: true };
            });
            
            schoolsInRange.forEach(summary => {
              const school = schoolMap.get(summary.schoolId);
              distributionSheet.addRow([
                school ? school.name : `School ID ${summary.schoolId}`,
                summary.averageScore.toFixed(2) + '%'
              ]);
            });
            
            distributionSheet.addRow([]);
          }
        }
      }
      
      // Set response headers for file download
      let filename: string;
      let contentType: string;
      
      if (fileFormat === 'excel') {
        filename = `school-${reportType}-report-${academicYear.name}${term ? '-' + term.name : ''}.xlsx`;
        contentType = 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet';
        
        res.setHeader('Content-Type', contentType);
        res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
        
        // Write to response
        await workbook.xlsx.write(res);
        res.end();
      } 
      else {
        // For PDF format, we'll actually send an Excel file for now
        // In a real app, you would use a PDF generation library
        filename = `school-${reportType}-report-${academicYear.name}${term ? '-' + term.name : ''}.xlsx`;
        contentType = 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet';
        
        res.setHeader('Content-Type', contentType);
        res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
        
        // Write to response
        await workbook.xlsx.write(res);
        res.end();
      }
    } catch (error) {
      console.error("Error generating export:", error);
      res.status(500).json({ 
        message: "Failed to generate export", 
        error: error instanceof Error ? error.message : String(error)
      });
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
