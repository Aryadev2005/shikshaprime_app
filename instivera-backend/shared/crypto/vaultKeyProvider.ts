import { KeyProvider } from "./keyProvider";
import axios from "axios";

export class VaultKeyProvider implements KeyProvider {
  constructor(
    private vaultUrl: string,
    private token: string
  ) {}

  private keyName(tenantId: string) {
    return `tenant-${tenantId}`;
  }

  async getTenantKek(tenantId: string): Promise<string> {
    // In Vault, the KEK is simply the key name.
    // If the key does not exist, we create it automatically.
    const name = this.keyName(tenantId);

    try {
      await axios.get(
        `${this.vaultUrl}/v1/transit/keys/${name}`,
        { headers: { "X-Vault-Token": this.token } }
      );
    } catch (err: any) {
      if (err.response?.status === 404) {
        await this.createTenantKek(tenantId);
      } else {
        throw err;
      }
    }

    return name;
  }

  async createTenantKek(tenantId: string): Promise<string> {
    const name = this.keyName(tenantId);

    await axios.post(
      `${this.vaultUrl}/v1/transit/keys/${name}`,
      {},
      { headers: { "X-Vault-Token": this.token } }
    );

    return name;
  }

  async rotateTenantKek(tenantId: string): Promise<void> {
    const name = this.keyName(tenantId);

    await axios.post(
      `${this.vaultUrl}/v1/transit/keys/${name}/rotate`,
      {},
      { headers: { "X-Vault-Token": this.token } }
    );
  }
}
