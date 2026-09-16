import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";
import { authOptions } from "@/lib/auth";
import { SignOutButton } from "@/components/SignOutButton";

export default async function DashboardPage() {
  const session = await getServerSession(authOptions);

  if (!session || !session.user) {
    redirect("/login");
  }

  const userDisplayName = session.user.name || session.user.email || "Student";

  return (
    <main className="flex min-h-screen flex-col items-center justify-center p-6 bg-slate-50 text-slate-900">
      <div className="w-full max-w-md rounded-2xl bg-white p-8 shadow-sm border border-slate-100 flex flex-col items-center text-center">
        <h1 className="text-2xl font-bold tracking-tight text-slate-900 mb-2">UnClutter</h1>
        <p className="text-sm font-medium text-emerald-600 bg-emerald-50 px-3 py-1 rounded-full mb-4">
          Authentication successful
        </p>
        <p className="text-sm text-slate-600 mb-6">
          Signed in as <span className="font-semibold text-slate-800">{userDisplayName}</span>
        </p>
        <SignOutButton />
      </div>
    </main>
  );
}
