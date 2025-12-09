import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

// Remove emojis e símbolos Unicode especiais de uma string
export function removeEmojis(text: string): string {
  return text
    .replace(/[\u{1F300}-\u{1F9FF}]/gu, '') // Emojis diversos
    .replace(/[\u{2600}-\u{26FF}]/gu, '')   // Símbolos diversos
    .replace(/[\u{2700}-\u{27BF}]/gu, '')   // Dingbats
    .replace(/[\u{FE00}-\u{FE0F}]/gu, '')   // Variation Selectors
    .replace(/[\u{1F000}-\u{1F02F}]/gu, '') // Mahjong
    .replace(/[\u{1F0A0}-\u{1F0FF}]/gu, '') // Cartas
    .replace(/\s+/g, ' ')                    // Limpar espaços extras
    .trim();
}
