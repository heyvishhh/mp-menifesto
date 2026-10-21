import { 
  IPromiseRepository, 
  IDepartmentRepository, 
  ICategoryRepository, 
  IAnalyticsRepository, 
  IImportRepository, 
  IAuditRepository 
} from './interfaces';
import { 
  DevPromiseRepository, 
  DevDepartmentRepository, 
  DevCategoryRepository, 
  DevAnalyticsRepository, 
  DevImportRepository, 
  DevAuditRepository 
} from './dev/dev-repository';

// Singleton instances for Stage 1 & 2 development provider
// In Stage 3, these can be switched to SupabasePromiseRepository, etc. via environment variable
export const promiseRepository: IPromiseRepository = new DevPromiseRepository();
export const departmentRepository: IDepartmentRepository = new DevDepartmentRepository();
export const categoryRepository: ICategoryRepository = new DevCategoryRepository();
export const analyticsRepository: IAnalyticsRepository = new DevAnalyticsRepository();
export const importRepository: IImportRepository = new DevImportRepository();
export const auditRepository: IAuditRepository = new DevAuditRepository();

export * from './interfaces';
