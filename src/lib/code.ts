// Unguessable, URL-safe household codes. A Crockford-style alphabet (no 0/O/1/I/L)
// keeps codes unambiguous to read aloud or copy. 31^8 ≈ 8.5e11 combinations, so
// codes can't realistically be guessed or enumerated.
const ALPHABET = 'ABCDEFGHJKMNPQRSTUVWXYZ23456789';
const LENGTH = 8;

export function generateCode(): string {
  const bytes = new Uint8Array(LENGTH);
  crypto.getRandomValues(bytes);
  let out = '';
  for (let i = 0; i < LENGTH; i++) out += ALPHABET[bytes[i] % ALPHABET.length];
  return out;
}
