import { customAlphabet } from "nanoid";

/**
 * Public-facing lead reference, e.g. "SP-7K4M2P" — never a raw database
 * ID. Alphabet excludes visually ambiguous characters (0/O, 1/I/L) since
 * people read these back over the phone or WhatsApp.
 */
const ALPHABET = "23456789ABCDEFGHJKMNPQRSTUVWXYZ";
const generate = customAlphabet(ALPHABET, 6);

export function generatePublicReference(): string {
  return `SP-${generate()}`;
}
