"use client";

import { useState } from "react";
import { Eye, EyeOff } from "lucide-react";

// Parooliväli: silmaikoon näitab parooli (näha, mida brauser automaatselt täitis) ja
// hoiatab, kui Caps Lock on sees
export function PasswordInput({
  value,
  onChange,
  autoComplete = "current-password",
  placeholder = "Parool",
  className = "",
  id,
  name = "password",
}: {
  value: string;
  onChange: (v: string) => void;
  autoComplete?: string;
  placeholder?: string;
  className?: string;
  id?: string;
  name?: string;
}) {
  const [show, setShow] = useState(false);
  const [capsLock, setCapsLock] = useState(false);

  function checkCaps(e: React.KeyboardEvent<HTMLInputElement>) {
    setCapsLock(e.getModifierState?.("CapsLock") ?? false);
  }

  return (
    <div>
      <div className="relative">
        <input
          id={id}
          type={show ? "text" : "password"}
          name={name}
          autoComplete={autoComplete}
          placeholder={placeholder}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          onKeyDown={checkCaps}
          onKeyUp={checkCaps}
          className={`${className} w-full pr-10`}
        />
        <button
          type="button"
          onClick={() => setShow((s) => !s)}
          className="absolute inset-y-0 right-0 px-3 flex items-center text-gray-500 hover:text-black cursor-pointer"
          aria-label={show ? "Peida parool" : "Näita parooli"}
          title={show ? "Peida parool" : "Näita parooli"}
        >
          {show ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
        </button>
      </div>
      {capsLock && <p className="text-xs text-amber-800 mt-1">Caps Lock on sees.</p>}
    </div>
  );
}

// E-post ilma tühikuteta ja väiketähtedega (tühik lõpus annab muidu "vale parool")
export function cleanEmail(email: string) {
  return email.trim().toLowerCase();
}

// Supabase'i ingliskeelsed vead arusaadavaks
export function loginErrorMessage(message: string) {
  if (/invalid login credentials/i.test(message)) {
    return "Vale e-post või parool – või selle e-postiga kontot pole veel loodud. Kontrolli e-posti. Kui brauser täitis parooli ise, võib see olla vana: vajuta silmaikoonile, kirjuta parool käsitsi või vajuta „Unustasid parooli?“.";
  }
  if (/email not confirmed/i.test(message)) return "E-post on kinnitamata. Vaata postkasti kinnituslinki.";
  if (/rate limit|too many/i.test(message)) return "Liiga palju katseid. Oota mõni minut ja proovi uuesti.";
  return message;
}
