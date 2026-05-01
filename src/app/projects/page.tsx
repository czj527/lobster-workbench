import { createClient } from "@/lib/supabase/server";
import ProjectsListClient from "@/components/ProjectsListClient";

export default async function ProjectsPage() {
  const supabase = await createClient();
  
  const { data: projects } = await supabase
    .from("projects")
    .select("*")
    .order("sort_order", { ascending: true })
    .order("created_at", { ascending: false });

  return <ProjectsListClient initialProjects={projects || []} />;
}
