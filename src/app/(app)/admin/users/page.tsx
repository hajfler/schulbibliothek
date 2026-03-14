import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/db";
import { formatDate } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import { UserRoleSelector } from "@/components/admin/user-role-selector";
import { Users, Mail, BookMarked } from "lucide-react";

export default async function AdminUsersPage() {
  const session = await auth();
  if (!session || !["LIBRARIAN", "ADMIN"].includes(session.user.role)) {
    redirect("/dashboard");
  }

  const schoolId = session.user.schoolId;

  const users = await prisma.user.findMany({
    where: schoolId ? { schoolId } : {},
    include: {
      school: { select: { name: true } },
      _count: {
        select: {
          loans: { where: { status: { in: ["ACTIVE", "OVERDUE"] } } },
        },
      },
    },
    orderBy: { name: "asc" },
  });

  const roleColors = {
    ADMIN: "purple" as const,
    LIBRARIAN: "blue" as const,
    USER: "gray" as const,
  };

  const roleLabels = {
    ADMIN: "Admin",
    LIBRARIAN: "Bibliothekar",
    USER: "Benutzer",
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-[28px] font-bold text-[#1C1C1E] tracking-tight">
            Benutzer
          </h1>
          <p className="text-[14px] text-[#8E8E93] mt-0.5">
            {users.length} Benutzer
          </p>
        </div>
      </div>

      <div className="card overflow-hidden">
        <table className="w-full">
          <thead>
            <tr className="border-b border-[#F2F2F7]">
              {["Benutzer", "Rolle", "Aktive Ausleihen", "Seit", "Aktionen"].map((h) => (
                <th key={h} className="text-left px-5 py-3.5 text-[12px] font-semibold text-[#8E8E93] uppercase tracking-wide">
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {users.map((user) => (
              <tr key={user.id} className="border-b border-[#F2F2F7] last:border-0 hover:bg-[#F9F9FB] transition-colors">
                <td className="px-5 py-4">
                  <div className="flex items-center gap-3">
                    {user.image ? (
                      <img src={user.image} alt="" className="w-9 h-9 rounded-full object-cover" />
                    ) : (
                      <div className="w-9 h-9 rounded-full bg-[#007AFF] flex items-center justify-center text-white text-[13px] font-semibold">
                        {user.name?.[0]?.toUpperCase() ?? "?"}
                      </div>
                    )}
                    <div>
                      <p className="text-[14px] font-semibold text-[#1C1C1E]">
                        {user.name ?? "Unbekannt"}
                      </p>
                      <a
                        href={`mailto:${user.email}`}
                        className="flex items-center gap-1 text-[12px] text-[#007AFF] hover:underline"
                      >
                        <Mail size={11} />
                        {user.email}
                      </a>
                    </div>
                  </div>
                </td>
                <td className="px-5 py-4">
                  <Badge variant={roleColors[user.role]}>
                    {roleLabels[user.role]}
                  </Badge>
                </td>
                <td className="px-5 py-4">
                  <div className="flex items-center gap-1.5">
                    <BookMarked size={14} className="text-[#8E8E93]" />
                    <span className="text-[14px] text-[#3A3A3C]">
                      {user._count.loans}
                    </span>
                  </div>
                </td>
                <td className="px-5 py-4">
                  <p className="text-[13px] text-[#8E8E93]">
                    {formatDate(user.createdAt)}
                  </p>
                </td>
                <td className="px-5 py-4">
                  {user.id !== session.user.id && (
                    <UserRoleSelector
                      userId={user.id}
                      currentRole={user.role}
                      isAdmin={session.user.role === "ADMIN"}
                    />
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
