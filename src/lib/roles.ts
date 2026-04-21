import { supabase } from "@/integrations/supabase/client";

export type AppRole = "patient" | "doctor" | "guardian";

export const getCurrentUserRoles = async (): Promise<AppRole[]> => {
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return [];

  const { data, error } = await (supabase as any)
    .from("user_roles")
    .select("role")
    .eq("user_id", user.id);

  if (error) throw error;
  return (data ?? []).map((row: { role: AppRole }) => row.role);
};

export const getDefaultRouteForRoles = (roles: AppRole[]) => {
  if (roles.includes("doctor")) return "/doctor";
  if (roles.includes("guardian")) return "/guardian";
  return "/";
};
