import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/db";
import { formatDate } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import { UserRoleSelector } from "@/components/admin/user-role-selector";
import { Mail } from "lucide-react";
import { UserSearchInput } from "@/components/admin/user-search-input";
import { UserLoansModal } from "@/components/admin/user-loans-modal";
import Link from "next/link";
import { Upload } from "lucide-react";

interface PageProps {
  searchParams: Promise<{ search?: string; role?: string; school?: string }>;
}

const VALID_ROLES = ["USER", "LIBRARIAN", "ADMIN"] as const;
type FilterRole = (typeof VALID_ROLES)[number];

interface UserWithDetails {
  id: string;
  name: string | null;
  email: string | null;
  image: string | null;
  role: "USER" | "LIBRARIAN" | "ADMIN";
  createdAt: Date;
  school: { id: string; name: string } | null;
  schoolMemberships: { schoolId: string }[];
  _count: { loans: number };
}

export default async function AdminUsersPage({ searchParams }: PageProps) {
  const session = await auth();
  if (!session || !["LIBRARIAN", "ADMIN"].includes(session.user.role)) {
    redirect("/dashboard");
  }

  const { search, role, school } = await searchParams;
  const isAdmin = session.user.role === "ADMIN";
  const roleFilter = role && (VALID_ROLES as readonly string[]).includes(role) ? (role as FilterRole) : undefined;

  // Bibliothekare sehen nur ihr aktives Schulhaus; Admins filtern frei nach Mitgliedschaft
  const schoolWhere = isAdmin
    ? school
      ? { schoolMemberships: { some: { schoolId: school } } }
      : {}
    : { schoolId: session.user.schoolId ?? undefined };

  const [users, schools] = await Promise.all([
    prisma.user.findMany({
      where: {
        ...schoolWhere,
        ...(roleFilter ? { role: roleFilter } : {}),
        ...(search
          ? {
              OR: [
                { name: { contains: search, mode: "insensitive" } },
                { email: { contains: search, mode: "insensitive" } },
              ],
            }
          : {}),
      },
      include: {
        school: { select: { id: true, name: true } },
        schoolMemberships: { select: { schoolId: true } },
        _count: {
          select: {
            loans: { where: { status: { in: ["ACTIVE", "OVERDUE"] } } },
          },
        },
      },
      orderBy: { name: "asc" },
    }) as unknown as Promise<UserWithDetails[]>,
    isAdmin
      ? prisma.school.findMany({ orderBy: { name: "asc" }, select: { id: true, name: true } })
      : Promise.resolve([] as { id: string; name: string }[]),
  ]);

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

  const activeFilters = [
    search && `„${search}"`,
    roleFilter && roleLabels[roleFilter],
    isAdmin && school && (schools.find((s) => s.id === school)?.name ?? ""),
  ]
    .filter(Boolean)
    .join(" · ");

  return (
    <div className="space-y-4">
      {/* Titelzeile */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-[28px] font-bold text-[var(--foreground)] tracking-tight">Benutzer</h1>
          <p className="text-[14px] text-[var(--foreground-tertiary)] mt-0.5">
            {users.length} Benutzer{activeFilters ? ` · ${activeFilters}` : ""}
          </p>
        </div>
        {isAdmin && (
          <Link
            href="/admin/import"
            className="flex items-center gap-2 px-4 py-2.5 bg-[var(--surface-secondary)] text-[var(--foreground-secondary)] rounded-xl text-[14px] font-semibold hover:opacity-90 transition-opacity"
          >
            <Upload size={15} />
            Benutzer importieren
          </Link>
        )}
      </div>

      {/* Filterzeile: Suche, Rolle, Schulhaus */}
      <UserSearchInput schools={isAdmin ? schools : []} />

      {/* Mobil: Karten */}
      <div className="md:hidden space-y-3">
        {users.map((user) => {
          const isSelf = user.id === session.user.id;
          return (
            <div key={user.id} className="card p-4">
              <div className="flex items-center gap-3 mb-3">
                {user.image ? (
                  <img src={user.image} alt="" className="w-10 h-10 rounded-full object-cover flex-shrink-0" />
                ) : (
                  <div className="w-10 h-10 rounded-full bg-[#007AFF] flex items-center justify-center text-white text-[14px] font-semibold flex-shrink-0">
                    {user.name?.[0]?.toUpperCase() ?? "?"}
                  </div>
                )}
                <div className="flex-1 min-w-0">
                  <p className="text-[14px] font-semibold text-[var(--foreground)] truncate">{user.name ?? "Unbekannt"}</p>
                  <a href={`mailto:${user.email}`} className="flex items-center gap-1 text-[12px] text-[#007AFF]">
                    <Mail size={10} /><span className="truncate">{user.email}</span>
                  </a>
                </div>
                {isSelf && <Badge variant={roleColors[user.role]}>{roleLabels[user.role]}</Badge>}
              </div>
              <div className="flex items-center gap-3 mb-3">
                <UserLoansModal
                  userId={user.id}
                  userName={user.name ?? user.email ?? ""}
                  userEmail={user.email ?? ""}
                  loanCount={user._count.loans}
                />
                <span className="text-[12px] text-[var(--foreground-tertiary)]">Dabei seit {formatDate(user.createdAt)}</span>
              </div>
              {!isSelf && (
                <UserRoleSelector
                  userId={user.id}
                  currentRole={user.role}
                  currentSchoolId={user.school?.id ?? null}
                  memberSchoolIds={user.schoolMemberships.map((m) => m.schoolId)}
                  isAdmin={isAdmin}
                  schools={schools.length > 0 ? schools : user.school ? [user.school] : []}
                />
              )}
            </div>
          );
        })}
      </div>

      {/* Desktop: dichte Tabelle wie im LMI */}
      <div className="hidden md:block card overflow-hidden">
        <table className="w-full">
          <thead>
            <tr className="border-b border-[var(--separator-opaque)]">
              {[
                ["Name / E-Mail", ""],
                ["Rolle", ""],
                ["Schulhäuser", ""],
                ["Ausleihen", "text-right"],
                ["", "w-10"],
              ].map(([h, extra], i) => (
                <th
                  key={i}
                  className={`px-4 py-2.5 text-left text-[11px] font-semibold uppercase tracking-wider text-[var(--foreground-tertiary)] ${extra}`}
                >
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {users.length === 0 ? (
              <tr>
                <td colSpan={5} className="px-4 py-12 text-center text-[var(--foreground-tertiary)]">Keine Benutzer gefunden</td>
              </tr>
            ) : (
              users.map((user) => {
                const isSelf = user.id === session.user.id;
                const chipSchools = schools.length > 0 ? schools : user.school ? [user.school] : [];
                return (
                  <tr key={user.id} className="border-b border-[var(--separator-opaque)] last:border-0 hover:bg-[var(--surface-secondary)]">
                    <td className="px-4 py-2">
                      <div className="flex items-center gap-3">
                        {user.image ? (
                          <img src={user.image} alt="" className="h-8 w-8 flex-shrink-0 rounded-full object-cover" />
                        ) : (
                          <div className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full bg-[#007AFF] text-[12px] font-semibold text-white">
                            {user.name?.[0]?.toUpperCase() ?? "?"}
                          </div>
                        )}
                        <div className="min-w-0 leading-tight">
                          <p className="truncate text-[13.5px] font-semibold text-[var(--foreground)]">
                            {user.name ?? "Unbekannt"}
                            {isSelf && (
                              <span className="ml-1.5 rounded-full bg-[#E1F0FF] px-1.5 py-px text-[9.5px] font-bold uppercase tracking-wider text-[#007AFF]">Du</span>
                            )}
                          </p>
                          <p className="truncate text-[11.5px] text-[var(--foreground-tertiary)]">{user.email}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-2 whitespace-nowrap">
                      {isSelf ? (
                        <Badge variant={roleColors[user.role]}>{roleLabels[user.role]}</Badge>
                      ) : (
                        <UserRoleSelector
                          userId={user.id}
                          currentRole={user.role}
                          currentSchoolId={user.school?.id ?? null}
                          memberSchoolIds={user.schoolMemberships.map((m) => m.schoolId)}
                          isAdmin={isAdmin}
                          schools={chipSchools}
                          layout="row"
                          part="role"
                        />
                      )}
                    </td>
                    <td className="px-4 py-2">
                      {isSelf ? (
                        <span className="text-[12px] text-[var(--foreground-secondary)]">
                          {user.school?.name.replace(/^Schulhaus\s+/, "") ?? <span className="font-medium text-[#FF3B30]">Nicht zugewiesen</span>}
                        </span>
                      ) : (
                        <UserRoleSelector
                          userId={user.id}
                          currentRole={user.role}
                          currentSchoolId={user.school?.id ?? null}
                          memberSchoolIds={user.schoolMemberships.map((m) => m.schoolId)}
                          isAdmin={isAdmin}
                          schools={chipSchools}
                          layout="row"
                          part="schools"
                        />
                      )}
                    </td>
                    <td className="px-4 py-2 text-right tabular-nums">
                      <div className="inline-flex justify-end">
                        <UserLoansModal
                          userId={user.id}
                          userName={user.name ?? user.email ?? ""}
                          userEmail={user.email ?? ""}
                          loanCount={user._count.loans}
                        />
                      </div>
                    </td>
                    <td className="px-2 py-2 text-right">
                      {user.email && (
                        <a
                          href={`mailto:${user.email}`}
                          title={`E-Mail an ${user.name ?? user.email}`}
                          className="inline-flex h-7 w-7 items-center justify-center rounded-full text-[var(--foreground-tertiary)] transition-[background-color,color] duration-[160ms] hover:bg-[var(--surface-secondary)] hover:text-[var(--foreground)]"
                        >
                          <Mail size={14} />
                        </a>
                      )}
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
