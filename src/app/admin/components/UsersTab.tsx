"use client";

import { Users } from "lucide-react";
import { Profile } from "../types";

interface UsersTabProps {
  users: Profile[];
}

export default function UsersTab({ users }: UsersTabProps) {
  return (
    <div className="space-y-4">
      <h3 className="text-lg font-bold flex items-center space-x-2 border-b border-border pb-3">
        <Users className="h-5 w-5 text-primary" />
        <span>Daftar Warga Terdaftar</span>
      </h3>

      <div className="rounded-xl border border-border bg-card overflow-hidden shadow-sm">
        <table className="w-full text-left border-collapse text-xs">
          <thead>
            <tr className="bg-muted/40 font-semibold border-b border-border text-muted-foreground uppercase text-[10px] tracking-wider">
              <th className="px-4 py-3">Nama</th>
              <th className="px-4 py-3">Nomor WhatsApp</th>
              <th className="px-4 py-3">Tipe Akun (Role)</th>
              <th className="px-4 py-3">Terdaftar Sejak</th>
            </tr>
          </thead>
          <tbody>
            {users.map((user) => (
              <tr key={user.id} className="border-b border-border/40 hover:bg-muted/10 transition-colors">
                <td className="px-4 py-3 font-bold text-foreground">{user.name}</td>
                <td className="px-4 py-3 text-muted-foreground">{user.phone_number}</td>
                <td className="px-4 py-3 capitalize">
                  <span
                    className={`inline-flex px-1.5 py-0.5 rounded text-[10px] font-bold ${
                      user.role === "admin" ? "bg-amber-500/10 text-amber-500" : "bg-muted text-muted-foreground"
                    }`}
                  >
                    {user.role}
                  </span>
                </td>
                <td className="px-4 py-3 text-muted-foreground">
                  {new Date(user.created_at).toLocaleDateString("id-ID", {
                    day: "numeric",
                    month: "short",
                    year: "numeric",
                  })}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
