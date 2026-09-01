export interface CryptoService {
  encrypt(
    tenantId: string,
    plaintext: Buffer | string,
    context?: Record<string, string>
  ): Promise<{ ciphertext: string; wrappedDek?: string | null }>;

  decrypt(
    tenantId: string,
    ciphertext: string,
    wrappedDek?: string | null,
    context?: Record<string, string>
  ): Promise<string>;

  deterministicEncrypt(
    tenantId: string,
    plaintext: string,
    context?: Record<string, string>
  ): Promise<string>;
}