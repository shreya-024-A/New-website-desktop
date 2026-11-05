import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export const validateCertificateName = (registeredName: string, extractedName: string): boolean => {
  if (!registeredName || !extractedName) return false;

  const reg = registeredName.toLowerCase().trim();
  const ext = extractedName.toLowerCase().trim();

  // Returns true if the names are similar or one contains the other
  return ext.includes(reg) || reg.includes(ext);
};