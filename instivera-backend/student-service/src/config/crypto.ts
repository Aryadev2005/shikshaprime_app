import { VaultKeyProvider } from "@shared/crypto/vaultKeyProvider";
import { VaultCryptoService } from "@shared/crypto/vaultCryptoService";
const vaultUrl = process.env.VAULT_URL!;
const vaultToken = process.env.VAULT_TOKEN!;

const keyProvider = new VaultKeyProvider(vaultUrl, vaultToken);

export const cryptoService = new VaultCryptoService(
  vaultUrl,
  vaultToken,
  keyProvider
);
