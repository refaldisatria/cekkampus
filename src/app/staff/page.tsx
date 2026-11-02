import { redirect } from "next/navigation";
import AppHeader from "@/components/AppHeader";
import StaffDashboard from "@/components/StaffDashboard";
import { getSessionUser } from "@/lib/auth";

export default async function StaffPage() {
  const user = await getSessionUser();
  if (!user) redirect("/login");
  if (user.role !== "STAFF") redirect("/search");
  return (
    <>
      <AppHeader />
      <main className="mx-auto max-w-5xl p-4"><StaffDashboard /></main>
    </>
  );
}
