"use client";
import { useState } from "react";
import { signIn } from "next-auth/react";

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true); setError("");
    const res = await signIn("credentials", { email, redirect: false });
    setLoading(false);
    if (res?.error) return setError("Akun kampus tidak ditemukan.");
    window.location.href = "/";
  }

  return (
    <main className="mx-auto flex min-h-screen max-w-md flex-col justify-center gap-6 p-5">
      <div>
        <p className="text-xs font-semibold uppercase tracking-wider text-outline">Layanan Terpadu Fasilitas Akademik</p>
        <h1 className="font-headline text-3xl font-bold text-primary">StudyNook</h1>
        <p className="mt-1 text-sm text-on-surface-variant">Masuk dengan akun kampus (simulasi SSO).</p>
      </div>
      <form onSubmit={submit} className="card flex flex-col gap-4">
        <div>
          <label className="label" htmlFor="email">Email Kampus</label>
          <input id="email" className="input" type="email" required value={email}
            onChange={(e) => setEmail(e.target.value)} placeholder="nama.mhs@mail.ac.id" />
        </div>
        {error && <p className="rounded-lg bg-error-container p-2 text-sm text-on-error-container">{error}</p>}
        <button className="btn-primary" disabled={loading}>
          {loading ? "Memverifikasi SSO..." : "Masuk Melalui Portal Kampus"}
        </button>
        <div className="rounded-lg bg-surface-container-low p-3 text-xs text-on-surface-variant">
          Demo:{" "}
          <button type="button" className="font-semibold text-secondary" onClick={() => setEmail("rafi.pratama@mail.ac.id")}>Mahasiswa</button>
          {" · "}
          <button type="button" className="font-semibold text-secondary" onClick={() => setEmail("bambang@staff.ac.id")}>Staf</button>
        </div>
      </form>
    </main>
  );
}
