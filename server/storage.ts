import { users, type User, type InsertUser } from "@shared/schema";
import { schools, type School, type InsertSchool } from "@shared/schema";
import { subjects, type Subject, type InsertSubject } from "@shared/schema";
import { academicYears, type AcademicYear, type InsertAcademicYear } from "@shared/schema";
import { terms, type Term, type InsertTerm } from "@shared/schema";
import { studentPerformances, type StudentPerformance, type InsertStudentPerformance } from "@shared/schema";
import { fileUploads, type FileUpload, type InsertFileUpload } from "@shared/schema";
import { schoolPerformanceSummaries, type SchoolPerformanceSummary, type InsertSchoolPerformanceSummary } from "@shared/schema";
import session from "express-session";
import createMemoryStore from "memorystore";

const MemoryStore = createMemoryStore(session);

export interface IStorage {
  // User methods
  getUser(id: number): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  getUserByEmail(email: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
  updateUserResetToken(id: number, resetToken: string | null, resetTokenExpiry: Date | null): Promise<User | undefined>;
  
  // School methods
  getSchool(id: number): Promise<School | undefined>;
  getSchools(): Promise<School[]>;
  createSchool(school: InsertSchool): Promise<School>;
  
  // Subject methods
  getSubject(id: number): Promise<Subject | undefined>;
  getSubjects(): Promise<Subject[]>;
  createSubject(subject: InsertSubject): Promise<Subject>;
  
  // Academic Year methods
  getAcademicYear(id: number): Promise<AcademicYear | undefined>;
  getAcademicYears(): Promise<AcademicYear[]>;
  getActiveAcademicYear(): Promise<AcademicYear | undefined>;
  createAcademicYear(academicYear: InsertAcademicYear): Promise<AcademicYear>;
  
  // Term methods
  getTerm(id: number): Promise<Term | undefined>;
  getTermsByAcademicYear(academicYearId: number): Promise<Term[]>;
  createTerm(term: InsertTerm): Promise<Term>;
  
  // Student Performance methods
  getStudentPerformance(id: number): Promise<StudentPerformance | undefined>;
  getStudentPerformancesBySchool(schoolId: number, academicYearId: number, termId?: number): Promise<StudentPerformance[]>;
  getStudentPerformancesBySubject(subjectId: number, academicYearId: number, termId?: number): Promise<StudentPerformance[]>;
  createStudentPerformance(performance: InsertStudentPerformance): Promise<StudentPerformance>;
  createManyStudentPerformances(performances: InsertStudentPerformance[]): Promise<StudentPerformance[]>;
  
  // File Upload methods
  getFileUpload(id: number): Promise<FileUpload | undefined>;
  getFileUploadsByUser(userId: number): Promise<FileUpload[]>;
  createFileUpload(fileUpload: InsertFileUpload): Promise<FileUpload>;
  updateFileUploadStatus(id: number, status: string): Promise<FileUpload | undefined>;
  
  // School Performance Summary methods
  getSchoolPerformanceSummary(id: number): Promise<SchoolPerformanceSummary | undefined>;
  getSchoolPerformanceSummaries(academicYearId: number, termId?: number): Promise<SchoolPerformanceSummary[]>;
  getSchoolPerformanceSummaryBySchool(schoolId: number, academicYearId: number, termId?: number): Promise<SchoolPerformanceSummary | undefined>;
  createSchoolPerformanceSummary(summary: InsertSchoolPerformanceSummary): Promise<SchoolPerformanceSummary>;
  updateSchoolPerformanceSummary(id: number, summary: Partial<InsertSchoolPerformanceSummary>): Promise<SchoolPerformanceSummary | undefined>;
  
  // Session store
  sessionStore: session.SessionStore;
}

export class MemStorage implements IStorage {
  private users: Map<number, User>;
  private schools: Map<number, School>;
  private subjects: Map<number, Subject>;
  private academicYears: Map<number, AcademicYear>;
  private terms: Map<number, Term>;
  private studentPerformances: Map<number, StudentPerformance>;
  private fileUploads: Map<number, FileUpload>;
  private schoolPerformanceSummaries: Map<number, SchoolPerformanceSummary>;
  
  sessionStore: session.SessionStore;
  
  private userIdCounter: number;
  private schoolIdCounter: number;
  private subjectIdCounter: number;
  private academicYearIdCounter: number;
  private termIdCounter: number;
  private studentPerformanceIdCounter: number;
  private fileUploadIdCounter: number;
  private schoolPerformanceSummaryIdCounter: number;

  constructor() {
    this.users = new Map();
    this.schools = new Map();
    this.subjects = new Map();
    this.academicYears = new Map();
    this.terms = new Map();
    this.studentPerformances = new Map();
    this.fileUploads = new Map();
    this.schoolPerformanceSummaries = new Map();
    
    this.userIdCounter = 1;
    this.schoolIdCounter = 1;
    this.subjectIdCounter = 1;
    this.academicYearIdCounter = 1;
    this.termIdCounter = 1;
    this.studentPerformanceIdCounter = 1;
    this.fileUploadIdCounter = 1;
    this.schoolPerformanceSummaryIdCounter = 1;
    
    this.sessionStore = new MemoryStore({
      checkPeriod: 86400000 // 24 hours
    });
    
    // Initialize with some basic data
    this.initializeData();
  }
  
  private initializeData() {
    // Create admin user
    this.createUser({
      username: "admin",
      email: "admin@example.com",
      password: "$2b$10$6Q5/3/JPHqvluT9BR2JtF.TkiAHNKcDWUYKK9A0T3NHVMNx2iONGW", // password123
      role: "admin",
      resetToken: null,
      resetTokenExpiry: null
    });
    
    // Add common subjects
    const subjects = [
      { name: "Mathematics", code: "MATH" },
      { name: "Science", code: "SCI" },
      { name: "Language Arts", code: "LANG" },
      { name: "Social Studies", code: "SOC" },
      { name: "Physical Education", code: "PE" }
    ];
    
    subjects.forEach(subject => {
      this.createSubject(subject);
    });
    
    // Add academic years
    const currentYear = new Date().getFullYear();
    for (let i = 0; i < 4; i++) {
      const year = currentYear - i;
      const isActive = i === 0;
      
      this.createAcademicYear({
        name: `${year}-${year + 1}`,
        startDate: new Date(`${year}-09-01`),
        endDate: new Date(`${year + 1}-06-30`),
        active: isActive
      });
    }
    
    // For each academic year, create terms
    this.academicYears.forEach((year) => {
      const startYear = new Date(year.startDate!).getFullYear();
      const endYear = new Date(year.endDate!).getFullYear();
      
      this.createTerm({
        name: "First Term",
        academicYearId: year.id,
        startDate: new Date(`${startYear}-09-01`),
        endDate: new Date(`${startYear}-12-15`)
      });
      
      this.createTerm({
        name: "Second Term",
        academicYearId: year.id,
        startDate: new Date(`${startYear}-12-16`),
        endDate: new Date(`${endYear}-03-31`)
      });
      
      this.createTerm({
        name: "Third Term",
        academicYearId: year.id,
        startDate: new Date(`${endYear}-04-01`),
        endDate: new Date(`${endYear}-06-30`)
      });
    });
  }

  // User methods
  async getUser(id: number): Promise<User | undefined> {
    return this.users.get(id);
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    return Array.from(this.users.values()).find(
      (user) => user.username === username,
    );
  }
  
  async getUserByEmail(email: string): Promise<User | undefined> {
    return Array.from(this.users.values()).find(
      (user) => user.email === email,
    );
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const id = this.userIdCounter++;
    const user: User = { 
      ...insertUser, 
      id, 
      resetToken: null,
      resetTokenExpiry: null,
      createdAt: new Date()
    };
    this.users.set(id, user);
    return user;
  }
  
  async updateUserResetToken(id: number, resetToken: string | null, resetTokenExpiry: Date | null): Promise<User | undefined> {
    const user = await this.getUser(id);
    if (!user) return undefined;
    
    const updatedUser = {
      ...user,
      resetToken,
      resetTokenExpiry
    };
    
    this.users.set(id, updatedUser);
    return updatedUser;
  }
  
  // School methods
  async getSchool(id: number): Promise<School | undefined> {
    return this.schools.get(id);
  }
  
  async getSchools(): Promise<School[]> {
    return Array.from(this.schools.values());
  }
  
  async createSchool(insertSchool: InsertSchool): Promise<School> {
    const id = this.schoolIdCounter++;
    const school: School = {
      ...insertSchool,
      id,
      createdAt: new Date()
    };
    this.schools.set(id, school);
    return school;
  }
  
  // Subject methods
  async getSubject(id: number): Promise<Subject | undefined> {
    return this.subjects.get(id);
  }
  
  async getSubjects(): Promise<Subject[]> {
    return Array.from(this.subjects.values());
  }
  
  async createSubject(insertSubject: InsertSubject): Promise<Subject> {
    const id = this.subjectIdCounter++;
    const subject: Subject = {
      ...insertSubject,
      id,
      createdAt: new Date()
    };
    this.subjects.set(id, subject);
    return subject;
  }
  
  // Academic Year methods
  async getAcademicYear(id: number): Promise<AcademicYear | undefined> {
    return this.academicYears.get(id);
  }
  
  async getAcademicYears(): Promise<AcademicYear[]> {
    return Array.from(this.academicYears.values());
  }
  
  async getActiveAcademicYear(): Promise<AcademicYear | undefined> {
    return Array.from(this.academicYears.values()).find(year => year.active);
  }
  
  async createAcademicYear(insertAcademicYear: InsertAcademicYear): Promise<AcademicYear> {
    const id = this.academicYearIdCounter++;
    const academicYear: AcademicYear = {
      ...insertAcademicYear,
      id
    };
    this.academicYears.set(id, academicYear);
    return academicYear;
  }
  
  // Term methods
  async getTerm(id: number): Promise<Term | undefined> {
    return this.terms.get(id);
  }
  
  async getTermsByAcademicYear(academicYearId: number): Promise<Term[]> {
    return Array.from(this.terms.values()).filter(
      term => term.academicYearId === academicYearId
    );
  }
  
  async createTerm(insertTerm: InsertTerm): Promise<Term> {
    const id = this.termIdCounter++;
    const term: Term = {
      ...insertTerm,
      id
    };
    this.terms.set(id, term);
    return term;
  }
  
  // Student Performance methods
  async getStudentPerformance(id: number): Promise<StudentPerformance | undefined> {
    return this.studentPerformances.get(id);
  }
  
  async getStudentPerformancesBySchool(schoolId: number, academicYearId: number, termId?: number): Promise<StudentPerformance[]> {
    return Array.from(this.studentPerformances.values()).filter(
      perf => perf.schoolId === schoolId 
            && perf.academicYearId === academicYearId
            && (termId === undefined || perf.termId === termId)
    );
  }
  
  async getStudentPerformancesBySubject(subjectId: number, academicYearId: number, termId?: number): Promise<StudentPerformance[]> {
    return Array.from(this.studentPerformances.values()).filter(
      perf => perf.subjectId === subjectId 
            && perf.academicYearId === academicYearId
            && (termId === undefined || perf.termId === termId)
    );
  }
  
  async createStudentPerformance(insertPerformance: InsertStudentPerformance): Promise<StudentPerformance> {
    const id = this.studentPerformanceIdCounter++;
    const performance: StudentPerformance = {
      ...insertPerformance,
      id,
      createdAt: new Date()
    };
    this.studentPerformances.set(id, performance);
    return performance;
  }
  
  async createManyStudentPerformances(insertPerformances: InsertStudentPerformance[]): Promise<StudentPerformance[]> {
    const performances: StudentPerformance[] = [];
    
    for (const insertPerformance of insertPerformances) {
      const performance = await this.createStudentPerformance(insertPerformance);
      performances.push(performance);
    }
    
    return performances;
  }
  
  // File Upload methods
  async getFileUpload(id: number): Promise<FileUpload | undefined> {
    return this.fileUploads.get(id);
  }
  
  async getFileUploadsByUser(userId: number): Promise<FileUpload[]> {
    return Array.from(this.fileUploads.values())
      .filter(upload => upload.userId === userId)
      .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
  }
  
  async createFileUpload(insertFileUpload: InsertFileUpload): Promise<FileUpload> {
    const id = this.fileUploadIdCounter++;
    const fileUpload: FileUpload = {
      ...insertFileUpload,
      id,
      createdAt: new Date()
    };
    this.fileUploads.set(id, fileUpload);
    return fileUpload;
  }
  
  async updateFileUploadStatus(id: number, status: string): Promise<FileUpload | undefined> {
    const fileUpload = await this.getFileUpload(id);
    if (!fileUpload) return undefined;
    
    const updatedFileUpload = {
      ...fileUpload,
      status
    };
    
    this.fileUploads.set(id, updatedFileUpload);
    return updatedFileUpload;
  }
  
  // School Performance Summary methods
  async getSchoolPerformanceSummary(id: number): Promise<SchoolPerformanceSummary | undefined> {
    return this.schoolPerformanceSummaries.get(id);
  }
  
  async getSchoolPerformanceSummaries(academicYearId: number, termId?: number): Promise<SchoolPerformanceSummary[]> {
    return Array.from(this.schoolPerformanceSummaries.values())
      .filter(summary => 
        summary.academicYearId === academicYearId &&
        (termId === undefined || summary.termId === termId)
      )
      .sort((a, b) => (a.ranking || 0) - (b.ranking || 0));
  }
  
  async getSchoolPerformanceSummaryBySchool(schoolId: number, academicYearId: number, termId?: number): Promise<SchoolPerformanceSummary | undefined> {
    return Array.from(this.schoolPerformanceSummaries.values()).find(
      summary => summary.schoolId === schoolId 
              && summary.academicYearId === academicYearId
              && (termId === undefined || summary.termId === termId)
    );
  }
  
  async createSchoolPerformanceSummary(insertSummary: InsertSchoolPerformanceSummary): Promise<SchoolPerformanceSummary> {
    const id = this.schoolPerformanceSummaryIdCounter++;
    const summary: SchoolPerformanceSummary = {
      ...insertSummary,
      id,
      createdAt: new Date()
    };
    this.schoolPerformanceSummaries.set(id, summary);
    return summary;
  }
  
  async updateSchoolPerformanceSummary(id: number, updateData: Partial<InsertSchoolPerformanceSummary>): Promise<SchoolPerformanceSummary | undefined> {
    const summary = await this.getSchoolPerformanceSummary(id);
    if (!summary) return undefined;
    
    const updatedSummary = {
      ...summary,
      ...updateData
    };
    
    this.schoolPerformanceSummaries.set(id, updatedSummary);
    return updatedSummary;
  }
}

export const storage = new MemStorage();
