import { pgTable, text, serial, integer, boolean, timestamp, uniqueIndex, jsonb } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  email: text("email").notNull().unique(),
  username: text("username").notNull().unique(),
  password: text("password").notNull(),
  resetToken: text("reset_token"),
  resetTokenExpiry: timestamp("reset_token_expiry"),
  createdAt: timestamp("created_at").defaultNow(),
});

export const schools = pgTable("schools", {
  id: serial("id").primaryKey(),
  name: text("name").notNull().unique(),
  location: text("location"),
  type: text("type"),
  createdAt: timestamp("created_at").defaultNow(),
});

export const subjects = pgTable("subjects", {
  id: serial("id").primaryKey(),
  name: text("name").notNull().unique(),
  code: text("code"),
  createdAt: timestamp("created_at").defaultNow(),
});

export const academicYears = pgTable("academic_years", {
  id: serial("id").primaryKey(),
  name: text("name").notNull().unique(),
  startDate: timestamp("start_date"),
  endDate: timestamp("end_date"),
  active: boolean("active").default(false),
});

export const terms = pgTable("terms", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  academicYearId: integer("academic_year_id").notNull(),
  startDate: timestamp("start_date"),
  endDate: timestamp("end_date"),
});

export const studentPerformances = pgTable("student_performances", {
  id: serial("id").primaryKey(),
  schoolId: integer("school_id").notNull(),
  academicYearId: integer("academic_year_id").notNull(),
  termId: integer("term_id"),
  subjectId: integer("subject_id").notNull(),
  averageScore: integer("average_score").notNull(),
  passRate: integer("pass_rate").notNull(),
  attendanceRate: integer("attendance_rate"),
  createdAt: timestamp("created_at").defaultNow(),
});

export const fileUploads = pgTable("file_uploads", {
  id: serial("id").primaryKey(),
  filename: text("filename").notNull(),
  userId: integer("user_id").notNull(),
  fileSize: integer("file_size").notNull(),
  academicYearId: integer("academic_year_id").notNull(),
  termId: integer("term_id"),
  status: text("status").notNull(),
  createdAt: timestamp("created_at").defaultNow(),
});

export const schoolPerformanceSummaries = pgTable("school_performance_summaries", {
  id: serial("id").primaryKey(),
  schoolId: integer("school_id").notNull(),
  academicYearId: integer("academic_year_id").notNull(),
  termId: integer("term_id"),
  overallAverage: integer("overall_average").notNull(),
  successRate: integer("success_rate").notNull(),
  attendanceRate: integer("attendance_rate"),
  improvementRate: integer("improvement_rate"),
  ranking: integer("ranking"),
  createdAt: timestamp("created_at").defaultNow(),
});

export const insertUserSchema = createInsertSchema(users).pick({
  email: true,
  username: true,
  password: true,
});

export const insertSchoolSchema = createInsertSchema(schools).pick({
  name: true,
  location: true,
  type: true,
});

export const insertSubjectSchema = createInsertSchema(subjects).pick({
  name: true,
  code: true,
});

export const insertAcademicYearSchema = createInsertSchema(academicYears).pick({
  name: true,
  startDate: true,
  endDate: true,
  active: true,
});

export const insertTermSchema = createInsertSchema(terms).pick({
  name: true,
  academicYearId: true,
  startDate: true,
  endDate: true,
});

export const insertStudentPerformanceSchema = createInsertSchema(studentPerformances).pick({
  schoolId: true,
  academicYearId: true,
  termId: true,
  subjectId: true,
  averageScore: true,
  passRate: true,
  attendanceRate: true,
});

export const insertFileUploadSchema = createInsertSchema(fileUploads).pick({
  filename: true,
  userId: true,
  fileSize: true,
  academicYearId: true,
  termId: true,
  status: true,
});

export const insertSchoolPerformanceSummarySchema = createInsertSchema(schoolPerformanceSummaries).pick({
  schoolId: true,
  academicYearId: true,
  termId: true,
  overallAverage: true,
  successRate: true,
  attendanceRate: true,
  improvementRate: true,
  ranking: true,
});

export type User = typeof users.$inferSelect;
export type InsertUser = z.infer<typeof insertUserSchema>;

export type School = typeof schools.$inferSelect;
export type InsertSchool = z.infer<typeof insertSchoolSchema>;

export type Subject = typeof subjects.$inferSelect;
export type InsertSubject = z.infer<typeof insertSubjectSchema>;

export type AcademicYear = typeof academicYears.$inferSelect;
export type InsertAcademicYear = z.infer<typeof insertAcademicYearSchema>;

export type Term = typeof terms.$inferSelect;
export type InsertTerm = z.infer<typeof insertTermSchema>;

export type StudentPerformance = typeof studentPerformances.$inferSelect;
export type InsertStudentPerformance = z.infer<typeof insertStudentPerformanceSchema>;

export type FileUpload = typeof fileUploads.$inferSelect;
export type InsertFileUpload = z.infer<typeof insertFileUploadSchema>;

export type SchoolPerformanceSummary = typeof schoolPerformanceSummaries.$inferSelect;
export type InsertSchoolPerformanceSummary = z.infer<typeof insertSchoolPerformanceSummarySchema>;
