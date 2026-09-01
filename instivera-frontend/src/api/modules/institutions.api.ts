import { apiClient } from '../client';
import { ApiResponse } from '../../types/api';

export interface Institution {
  id: number;
  name: string;
  /** Tenant key sent as `x-tenant`. Backend column is `subdomain`. */
  slug: string;
  /**
   * The `tenants` table has no school/college column, so identity-service
   * cannot supply this. Callers fall back to 'college' (the same default
   * LoginScreen already applies). Tracked in INTEGRATION_LOG.md.
   */
  type?: 'school' | 'college';
  logo_url: string | null;
  tagline: string | null;
  city: string | null;
  state: string | null;
}

/** Row as identity-service actually returns it (institutionController.ts). */
interface RawInstitution {
  id: number;
  name: string;
  subdomain: string;
  logo: string | null;
  tagline: string | null;
  city: string | null;
  state: string | null;
  address_line: string | null;
  frontendUrl: string;
  apiUrl: string;
}

const client = apiClient.getClient();

export const institutionsApi = {
  async getInstitutions(): Promise<Institution[]> {
    const response = await client.get<ApiResponse<RawInstitution[]>>(
      '/api/identity/institutions',
    );
    return (response.data.data ?? []).map((raw) => ({
      id: raw.id,
      name: raw.name,
      slug: raw.subdomain,
      logo_url: raw.logo,
      tagline: raw.tagline,
      city: raw.city,
      state: raw.state,
    }));
  },
};
