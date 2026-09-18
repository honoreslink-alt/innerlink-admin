"use client";

import { FormEvent, useState } from "react";
import { supabase } from "../../lib/supabase";

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [mensaje, setMensaje] = useState("");

  async function iniciarSesion(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    setLoading(true);
    setMensaje("");

    const { error: loginError } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (loginError) {
      setMensaje(`Error: ${loginError.message}`);
      setLoading(false);
      return;
    }

    const { data: isAdmin, error: adminError } = await supabase.rpc(
      "is_current_user_admin"
    );

    if (adminError) {
      await supabase.auth.signOut();
      setMensaje(`Error: ${adminError.message}`);
      setLoading(false);
      return;
    }

    if (!isAdmin) {
      await supabase.auth.signOut();

      setMensaje(
        "Error: Esta cuenta no tiene autorización para acceder al panel administrativo."
      );

      setLoading(false);
      return;
    }

    setMensaje("Acceso autorizado. Entrando al panel...");

    window.location.href = "/";
  }

  return (
    <main className="min-h-screen bg-[#020812] text-white">
      <div className="relative flex min-h-screen items-center justify-center overflow-hidden px-6">

        <div className="pointer-events-none absolute left-1/2 top-[-180px] h-[420px] w-[420px] -translate-x-1/2 rounded-full bg-cyan-500/10 blur-[120px]" />

        <div className="pointer-events-none absolute bottom-[-220px] right-[-120px] h-[420px] w-[420px] rounded-full bg-purple-500/10 blur-[120px]" />

        <div className="relative z-10 w-full max-w-[430px]">

          <div className="mb-8 text-center">
            <p className="text-[11px] font-bold tracking-[0.35em] text-cyan-400">
              INNERLINK
            </p>

            <h1 className="mt-3 text-3xl font-bold tracking-tight">
              Panel Administrativo
            </h1>

            <p className="mt-2 text-sm text-slate-500">
              Acceso exclusivo para administración
            </p>
          </div>

          <div className="rounded-3xl border border-cyan-500/20 bg-[#06111f]/95 p-7 shadow-[0_0_45px_rgba(0,174,255,0.08)]">

            <div className="mb-6">
              <p className="text-[10px] font-bold tracking-[0.22em] text-cyan-400">
                ACCESO SEGURO
              </p>

              <h2 className="mt-2 text-xl font-bold text-white">
                Iniciar sesión
              </h2>

              <p className="mt-1 text-xs leading-5 text-slate-500">
                Ingresa con la cuenta autorizada de INNERLINK.
              </p>
            </div>

            <form
              onSubmit={iniciarSesion}
              className="space-y-4"
            >

              <div>
                <label className="mb-2 block text-[10px] font-bold tracking-wider text-slate-500">
                  CORREO
                </label>

                <input
                  type="email"
                  value={email}
                  onChange={(event) => setEmail(event.target.value)}
                  placeholder="admin@innerlink.cl"
                  required
                  autoComplete="email"
                  className="h-12 w-full rounded-xl border border-white/10 bg-[#020812] px-4 text-sm text-white outline-none transition placeholder:text-slate-700 focus:border-cyan-400/50 focus:shadow-[0_0_18px_rgba(0,200,255,0.08)]"
                />
              </div>

              <div>
                <label className="mb-2 block text-[10px] font-bold tracking-wider text-slate-500">
                  CONTRASEÑA
                </label>

                <input
                  type="password"
                  value={password}
                  onChange={(event) => setPassword(event.target.value)}
                  placeholder="••••••••••••"
                  required
                  autoComplete="current-password"
                  className="h-12 w-full rounded-xl border border-white/10 bg-[#020812] px-4 text-sm text-white outline-none transition placeholder:text-slate-700 focus:border-purple-400/50 focus:shadow-[0_0_18px_rgba(168,85,247,0.08)]"
                />
              </div>

              {mensaje && (
                <div
                  className={`rounded-xl border px-4 py-3 text-xs ${
                    mensaje.startsWith("Error:")
                      ? "border-red-500/20 bg-red-500/5 text-red-300"
                      : "border-emerald-500/20 bg-emerald-500/5 text-emerald-300"
                  }`}
                >
                  {mensaje}
                </div>
              )}

              <button
                type="submit"
                disabled={loading}
                className="mt-2 h-12 w-full rounded-xl border border-cyan-400/40 bg-gradient-to-r from-cyan-500/15 via-blue-500/15 to-purple-500/15 text-sm font-bold text-cyan-100 transition hover:border-cyan-300/60 hover:bg-cyan-500/20 disabled:cursor-wait disabled:opacity-60"
              >
                {loading
                  ? "Verificando acceso..."
                  : "Entrar al panel"}
              </button>

            </form>

            <div className="mt-6 border-t border-white/5 pt-5 text-center">
              <div className="flex items-center justify-center gap-2 text-[10px] text-slate-600">
                <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 shadow-[0_0_8px_rgba(52,211,153,0.7)]" />
                Conexión protegida por Supabase Auth
              </div>
            </div>

          </div>

          <p className="mt-5 text-center text-[9px] tracking-wide text-slate-700">
            INNERLINK · ADMINISTRACIÓN
          </p>

        </div>
      </div>
    </main>
  );
}