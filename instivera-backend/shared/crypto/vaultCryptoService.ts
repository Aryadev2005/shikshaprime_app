import axios from "axios";
import { CryptoService } from "./cryptoService";
import { KeyProvider } from "./keyProvider";

export class VaultCryptoService implements CryptoService {
  constructor(
    private vaultUrl: string,
    private token: string,
    private keyProvider: KeyProvider
  ) {}

  private headers() {
    return { "X-Vault-Token": this.token };
  }

  async encrypt(
    tenantId: string,
    plaintext: Buffer | string,
    context?: Record<string, string>
  ): Promise<{ ciphertext: string }> {
    const keyName = await this.keyProvider.getTenantKek(tenantId);

    const payload: any = {
      plaintext: Buffer.isBuffer(plaintext)
        ? plaintext.toString("base64")
        : Buffer.from(plaintext).toString("base64")
    };

    if (context) payload.context = Buffer.from(JSON.stringify(context)).toString("base64");

    const res: any = await axios.post(
      `${this.vaultUrl}/v1/transit/encrypt/${keyName}`,
      payload,
      { headers: this.headers() }
    );

    return { ciphertext: res.data.data.ciphertext };
  }

  async decrypt(
        tenantId: string,
        ciphertext: string,
        wrappedDek?: string | null,   // must exist for interface compatibility
        context?: Record<string, string>
        ): Promise<string> {
        const keyName = await this.keyProvider.getTenantKek(tenantId);

        const payload: any = { ciphertext };

        if (context) {
            payload.context = Buffer.from(JSON.stringify(context)).toString("base64");
        }

        const res: any = await axios.post(
            `${this.vaultUrl}/v1/transit/decrypt/${keyName}`,
            payload,
            { headers: this.headers() }
        );

        const plaintextBase64 = res.data.data.plaintext;
        return Buffer.from(plaintextBase64, "base64").toString("utf8");
  }


  async deterministicEncrypt(
    tenantId: string,
    plaintext: string,
    context?: Record<string, string>
  ): Promise<string> {
    const keyName = await this.keyProvider.getTenantKek(tenantId);

    const payload: any = {
      plaintext: Buffer.from(plaintext).toString("base64"),
      type: "aes256-gcm96" // deterministic mode requires same key type
    };

    if (context) payload.context = Buffer.from(JSON.stringify(context)).toString("base64");

    const res: any = await axios.post(
      `${this.vaultUrl}/v1/transit/encrypt/${keyName}`,
      payload,
      { headers: this.headers() }
    );

    return res.data.data.ciphertext;
  }
}
