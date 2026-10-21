import { createClient } from '@/lib/supabase/server';
import { getDbPool } from '@/lib/supabase/db';

export type UserRole = 'ADMIN' | 'EDITOR' | 'VIEWER' | 'PUBLIC';

export interface AuthUserProfile {
  id: string;
  email: string;
  fullName: string | null;
  role: UserRole;
  departmentName: string | null;
}

export async function getCurrentUserProfile(): Promise<AuthUserProfile | null> {
  try {
    const supabase = await createClient();
    const { data: { user }, error } = await supabase.auth.getUser();

    if (error || !user) {
      return null;
    }

    // Query profile from database
    const pool = getDbPool();
    const res = await pool.query(`
      SELECT id, email, full_name, role, department_name 
      FROM profiles 
      WHERE id = $1;
    `, [user.id]);

    if (res.rows.length === 0) {
      // Fallback: create default VIEWER profile
      return {
        id: user.id,
        email: user.email || '',
        fullName: user.user_metadata?.full_name || null,
        role: (user.user_metadata?.role as UserRole) || 'VIEWER',
        departmentName: null,
      };
    }

    const r = res.rows[0];
    return {
      id: r.id,
      email: r.email,
      fullName: r.full_name,
      role: r.role as UserRole,
      departmentName: r.department_name,
    };
  } catch {
    return null;
  }
}

export async function checkUserPermission(allowedRoles: UserRole[]): Promise<{
  authorized: boolean;
  profile: AuthUserProfile | null;
}> {
  const profile = await getCurrentUserProfile();
  if (!profile) {
    return { authorized: allowedRoles.includes('PUBLIC'), profile: null };
  }

  const authorized = allowedRoles.includes(profile.role);
  return { authorized, profile };
}
