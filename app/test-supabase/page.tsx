"use client";

import { useEffect, useState } from "react";
import { supabase } from "../../lib/supabase";

type AdminUser = {
  id: string;
  display_name: string | null;
  interlink_number: number;
  plan: string | null;
  premium_status: string | null;
  premium_expires_at: string | null;
  level: number | null;
};

export default function TestSupabase() {
  const [mensaje, setMensaje] = useState(
    "Consultando usuarios reales de INNERLINK..."
  );

  const [usuarios, setUsuarios] = useState<AdminUser[]>([]);

  useEffect(() => {
    async function cargarUsuarios() {
      const { data, error } = await supabase.rpc("admin_list_users");

      if (error) {
        setMensaje(`ERROR: ${error.message}`);
        return;
      }

      const lista = (data ?? []) as AdminUser[];

      setUsuarios(lista);

      setMensaje(
        `CONEXIÓN OK — ${lista.length} usuario(s) reales encontrados`
      );
    }

    cargarUsuarios();
  }, []);

  return (
    <main className="min-h-screen bg-[#020812] p-10 text-white">
      <h1 className="text-2xl font-bold">
        Prueba Admin Supabase — INNERLINK
      </h1>

      <p className="mt-4 text-cyan-300">
        {mensaje}
      </p>

      <div className="mt-8 space-y-3">
        {usuarios.map((usuario) => (
          <div
            key={usuario.id}
            className="rounded-xl border border-cyan-500/20 bg-[#06111f] p-4"
          >
            <p className="font-bold text-white">
              {usuario.display_name || "Sin nombre"}
            </p>

            <p className="mt-1 text-sm text-cyan-400">
              IL-{String(usuario.interlink_number).padStart(7, "0")}
            </p>

            <div className="mt-2 flex gap-5 text-xs text-slate-400">
              <span>Plan: {usuario.plan ?? "—"}</span>

              <span>
                Premium: {usuario.premium_status ?? "—"}
              </span>

              <span>
                Nivel: {usuario.level ?? "—"}
              </span>
            </div>
          </div>
        ))}
      </div>
    </main>
  );
}