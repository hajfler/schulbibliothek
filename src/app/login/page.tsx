import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { BookOpen } from "lucide-react";
import { LoginButton } from "./login-button";

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

          <LoginButton />

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

