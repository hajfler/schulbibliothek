"use client";

import { signIn } from "next-auth/react";

export function LoginButton() {
  return (
    <button
      onClick={() => signIn("microsoft-entra-id", { callbackUrl: "/dashboard" })}
      className="w-full flex items-center justify-center gap-3 bg-[#007AFF] hover:bg-[#0071E3] text-white font-semibold text-[15px] py-3.5 px-6 rounded-xl transition-all duration-150 active:scale-[0.98] shadow-sm"
    >
      <MicrosoftIcon />
      Mit Microsoft 365 anmelden
    </button>
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
