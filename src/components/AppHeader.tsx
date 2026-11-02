import Link from "next/link";
import { getSessionUser } from "@/lib/auth";
import SignOutButton from "./SignOutButton";

export default async function AppHeader() {
  const user = await getSessionUser();
  return (
    <header className="sticky top-0 z-10 bg-surface/90 backdrop-blur">
      <div className="mx-auto flex h-14 max-w-5xl items-center justify-between px-4">
        <Link href="/" className="font-headline text-lg font-bold text-primary">StudyNook</Link>
        {user && (
          <div className="flex items-center gap-3">
            <span className="hidden text-sm text-on-surface-variant sm:inline">{user.name}</span>
            <SignOutButton />
          </div>
        )}
      </div>
    </header>
  );
}
