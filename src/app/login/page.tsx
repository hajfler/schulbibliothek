import { auth, signIn } from "@/lib/auth";
import { redirect } from "next/navigation";
import { BookOpen } from "lucide-react";

export default async function LoginPage() {
  const session = await auth();
  if (session) redirect("/dashboard");

  return (
    <div className="min-h-screen bg-[#F2F2F7] flex items-center justify-center p-4">
      <div className="w-full max-w-sm">
        {/* Logo */}
        <div className="text-center mb-10">
          <div className="w-20 h-20 bg-[#007AFF] rounded-[22px] flex items-center justify-center mx-auto mb-5 shadow-lg shadow-[#007AFF]/30">
            <BookOpen size={36} className="text-white" />
          </div>
          <h1 className="text-[28px] font-bold text-[#1C1C1E] tracking-tight">
            Schulbibliothek
          </h1>
          <p className="text-[15px] text-[#8E8E93] mt-1">Schule Dietlikon</p>
        </div>

        {/* Card */}
        <div className="bg-white rounded-2xl p-8 shadow-sm border border-[#E5E5EA]">
          <h2 className="text-[20px] font-semibold text-[#1C1C1E] mb-2">
            Willkommen
          </h2>
          <p className="text-[14px] text-[#8E8E93] mb-8">
            Melde dich mit deinem Schulkonto an, um auf die Bibliothek
            zuzugreifen.
          </p>

          <form
            action={async () => {
              "use server";
              await signIn("microsoft-entra-id", { redirectTo: "/dashboard" });
            }}
          >
            <button
              type="submit"
              className="w-full flex items-center justify-center gap-3 bg-[#007AFF] hover:bg-[#0071E3] text-white font-semibold text-[15px] py-3.5 px-6 rounded-xl transition-all duration-150 active:scale-[0.98] shadow-sm"
            >
              <MicrosoftIcon />
              Mit Microsoft 365 anmelden
            </button>
          </form>

          <p className="text-[12px] text-[#C7C7CC] text-center mt-6">
            Nur für Schüler und Lehrpersonen der Schule Dietlikon
          </p>
        </div>

        <p className="text-[12px] text-[#C7C7CC] text-center mt-6">
          Schulbibliothek Dietlikon · Schulhaus Dorf
        </p>
      </div>
    </div>
  );
}

function MicrosoftIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 21 21" fill="none">
      <rect x="1" y="1" width="9" height="9" fill="#f25022" rx="1" />
      <rect x="11" y="1" width="9" height="9" fill="#7fba00" rx="1" />
      <rect x="1" y="11" width="9" height="9" fill="#00a4ef" rx="1" />
      <rect x="11" y="11" width="9" height="9" fill="#ffb900" rx="1" />
    </svg>
  );
}
