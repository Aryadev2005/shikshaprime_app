import crypto from "crypto";
import { CryptoService } from "./cryptoService";

// -------------------------------
// 1. N‑GRAM GENERATOR (for partial search)
// -------------------------------
export function generateNGrams(value: string, n = 3): string[] {
  const normalized = value.toLowerCase().trim();
  const grams: string[] = [];

  for (let i = 0; i <= normalized.length - n; i++) {
    grams.push(normalized.substring(i, i + n));
  }

  return grams;
}

// -------------------------------
// 2. HASHED N‑GRAM INDEX
// -------------------------------
export function generateSearchIndex(value: string): string[] {
  const ngrams = generateNGrams(value, 3);

  return ngrams.map(g =>
    crypto.createHash("sha256").update(g).digest("hex")
  );
}

// -------------------------------
// 3. Encrypt a field (AES‑GCM via Vault)
// -------------------------------
export async function encryptField(
  cryptoService: CryptoService,
  tenantId: string,
  value: string
): Promise<string> {
  const { ciphertext } = await cryptoService.encrypt(tenantId, value);
  return ciphertext;
}

// -------------------------------
// 4. Deterministic encrypt a field (for exact search)
// -------------------------------
export async function deterministicEncryptField(
  cryptoService: CryptoService,
  tenantId: string,
  value: string
): Promise<string> {
  return cryptoService.deterministicEncrypt(tenantId, value);
}

// -------------------------------
// 5. Decrypt a field
// -------------------------------
export async function decryptField(
  cryptoService: CryptoService,
  tenantId: string,
  ciphertext: string
): Promise<string> {
  return cryptoService.decrypt(tenantId, ciphertext);
}

// -------------------------------
// 6. Full helper for partial‑searchable fields
// -------------------------------
export async function encryptSearchableField(
  cryptoService: CryptoService,
  tenantId: string,
  value: string
): Promise<{
  enc: string;
  det: string;
  index: string[];
}> {
  const enc = await encryptField(cryptoService, tenantId, value);
  const det = await deterministicEncryptField(cryptoService, tenantId, value);
  const index = generateSearchIndex(value);

  return { enc, det, index };
}