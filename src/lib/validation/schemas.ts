import { z } from 'zod';

export const PromiseStatusEnum = z.enum([
  'COMPLETED',
  'IN_PROGRESS',
  'INITIAL_STAGE',
  'NOT_STARTED',
]);

export const PoliticalImportanceEnum = z.enum([
  'HIGH',
  'MEDIUM',
  'LIMITED',
]);

export const promiseRecordSchema = z.object({
  id: z.number().int().positive({ message: 'वैध क्रमांक (ID) आवश्यक है।' }),
  title: z.string().min(1, { message: 'घोषणा / वादा शीर्षक आवश्यक है।' }),
  description: z.string().default(''),
  departments: z.array(z.string()).min(1, { message: 'कम से कम एक विभाग संबद्ध होना आवश्यक है।' }),
  primaryDepartment: z.string().min(1, { message: 'प्राथमिक विभाग आवश्यक है।' }),
  category: z.string().min(1, { message: 'श्रेणी / क्षेत्र आवश्यक है।' }),
  workStarted: z.boolean().default(false),
  status: PromiseStatusEnum,
  statusRaw: z.string().default('प्रारंभ नहीं'),
  politicalImportance: PoliticalImportanceEnum,
  politicalImportanceRaw: z.string().default('सीमित'),
  notes: z.string().nullable().optional(),
  groundImpact: z.string().nullable().optional(),
  publicPerception: z.string().nullable().optional(),
  delayReason: z.string().nullable().optional(),
  keyAchievements: z.string().nullable().optional(),
  referenceLinks: z.array(z.string()).default([]),
  referenceLink1: z.string().nullable().optional(),
  referenceLink2: z.string().nullable().optional(),
  newsImage: z.string().nullable().optional(),
  politicalIssue: z.string().nullable().optional(),
  officialConfirmationLink: z.string().nullable().optional(),
  updateNotes: z.string().nullable().optional(),
  sourceSheet: z.string().default('All Promises'),
  sourceRow: z.number().int().default(0),
  updatedAt: z.string().default(() => new Date().toISOString()),
  unknownFields: z.record(z.string(), z.unknown()).optional(),
});

export const promiseCreateSchema = promiseRecordSchema.omit({
  id: true,
  updatedAt: true,
  sourceRow: true,
}).extend({
  id: z.number().int().positive().optional(),
});

export const promiseUpdateSchema = promiseRecordSchema.partial().omit({
  id: true,
});

export const importOptionsSchema = z.object({
  mode: z.enum(['REPLACE', 'MERGE']),
  sheetName: z.string().optional(),
});

export type ValidatedPromise = z.infer<typeof promiseRecordSchema>;
export type ValidatedPromiseCreate = z.infer<typeof promiseCreateSchema>;
export type ValidatedPromiseUpdate = z.infer<typeof promiseUpdateSchema>;
