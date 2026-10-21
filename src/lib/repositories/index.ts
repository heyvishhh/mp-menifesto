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
import {
  SupabasePromiseRepository,
  SupabaseDepartmentRepository,
  SupabaseCategoryRepository,
  SupabaseAnalyticsRepository,
  SupabaseImportRepository,
  SupabaseAuditRepository
} from './supabase/supabase-repository';

// Determine if live Supabase PostgreSQL is enabled
const useSupabase = Boolean(
  process.env.DATABASE_URL &&
  process.env.NEXT_PUBLIC_ENABLE_DEV_MOCK_FALLBACK !== 'true'
);

export const promiseRepository: IPromiseRepository = useSupabase
  ? new SupabasePromiseRepository()
  : new DevPromiseRepository();

export const departmentRepository: IDepartmentRepository = useSupabase
  ? new SupabaseDepartmentRepository()
  : new DevDepartmentRepository();

export const categoryRepository: ICategoryRepository = useSupabase
  ? new SupabaseCategoryRepository()
  : new DevCategoryRepository();

export const analyticsRepository: IAnalyticsRepository = useSupabase
  ? new SupabaseAnalyticsRepository()
  : new DevAnalyticsRepository();

export const importRepository: IImportRepository = useSupabase
  ? new SupabaseImportRepository()
  : new DevImportRepository();

export const auditRepository: IAuditRepository = useSupabase
  ? new SupabaseAuditRepository()
  : new DevAuditRepository();

export * from './interfaces';
