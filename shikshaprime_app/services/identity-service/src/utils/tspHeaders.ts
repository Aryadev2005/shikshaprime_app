// import axios from "axios";
// import { config } from "../config";

// interface OAuthTokenResponse {
//   access_token: string;
//   token_type?: string;
//   expires_in?: number;
// }

// export class TSPHeadersUtil {
//   private static accessToken: string | null = null;
//   private static tokenExpiry = 0;

//   static async getAccessToken(): Promise<string> {
//     if (this.accessToken && Date.now() < this.tokenExpiry - 60_000) {
//       return this.accessToken;
//     }

//     const form = new URLSearchParams({
//       client_id: config.phonepe.clientId,
//       client_version: String(config.phonepe.clientVersion || "1"),
//       client_secret: config.phonepe.clientSecret,
//       grant_type: "client_credentials",
//     });

//     const tokenUrl = `${config.phonepe.baseUrl.replace(/\/+$/, "")}${config.phonepe.oauthPath}`;
//     const response = await axios.post<OAuthTokenResponse>(tokenUrl, form.toString(), {
//       headers: {
//         "Content-Type": "application/x-www-form-urlencoded",
//       },
//     });

//     if (!response.data?.access_token) {
//       throw new Error("PhonePe OAuth token response is missing access_token");
//     }

//     const expiresIn = Number(response.data.expires_in || 900);
//     this.accessToken = response.data.access_token;
//     this.tokenExpiry = Date.now() + expiresIn * 1000;
//     return this.accessToken;
//   }

//   static async generateStandardHeaders(extraHeaders: Record<string, string> = {}): Promise<Record<string, string>> {
//     const token = await this.getAccessToken();
//     return {
//       Authorization: `O-Bearer ${token}`,
//       "Content-Type": "application/json",
//       Accept: "application/json",
//       "X-MERCHANT-ID": config.phonepe.merchantId,
//       "X-CLIENT-ID": config.phonepe.clientId,
//       "X-CLIENT-VERSION": String(config.phonepe.clientVersion || "1"),
//       ...extraHeaders,
//     };
//   }
// }


import axios from "axios";
import { config } from "../config";

interface OAuthTokenResponse {
  access_token: string;
  token_type?: string;
  expires_in?: number;
}

export class TSPHeadersUtil {

  private static accessToken: string | null = null;
  private static tokenExpiry = 0;

  /**
   * Fetch OAuth token from PhonePe
   * Reuses cached token until 4 minutes before expiry
   */
  static async getAccessToken(): Promise<string> {

    const now = Date.now();

    // reuse cached token if still valid
    if (this.accessToken && now < this.tokenExpiry - 240_000) {
      return this.accessToken;
    }

    const form = new URLSearchParams({
      client_id: config.phonepe.clientId,
      client_version: String(config.phonepe.clientVersion || "1"),
      client_secret: config.phonepe.clientSecret,
      grant_type: "client_credentials",
    });

    const tokenUrl =
      `${config.phonepe.baseUrl.replace(/\/+$/, "")}${config.phonepe.oauthPath}`;

    const response = await axios.post<OAuthTokenResponse>(
      tokenUrl,
      form.toString(),
      {
        headers: {
          "Content-Type": "application/x-www-form-urlencoded",
        },
      }
    );

    if (!response.data?.access_token) {
      throw new Error("PhonePe OAuth token response is missing access_token");
    }

    const expiresIn = Number(response.data.expires_in || 900);

    this.accessToken = response.data.access_token;
    this.tokenExpiry = now + expiresIn * 1000;

    return this.accessToken;
  }

  /**
   * Generate standard headers for PhonePe API calls
   */
  static async generateStandardHeaders(
    extraHeaders: Record<string, string> = {}
  ): Promise<Record<string, string>> {

    const token = await this.getAccessToken();

    let merchantDomain = "localhost";

    try {
      merchantDomain = new URL(config.frontendUrl).hostname;
    } catch {
      merchantDomain = config.frontendUrl || "localhost";
    }

    return {
      Authorization: `O-Bearer ${token}`,
      "Content-Type": "application/json",
      Accept: "application/json",

      "X-MERCHANT-ID": config.phonepe.merchantId,
      "X-CLIENT-ID": config.phonepe.clientId,
      "X-CLIENT-VERSION": String(config.phonepe.clientVersion || "1"),

      // Required TSP headers (PhonePe UAT requirement)
      "X-SOURCE": "WEB",
      "X-SOURCE-CHANNEL": "WEB",
      "X-BROWSER-FINGERPRINT": "student-registration",
      "X-MERCHANT-DOMAIN": merchantDomain,
      "X-MERCHANT-IP": "127.0.0.1",
      "X-SOURCE-REDIRECTION-TYPE": "GET",

      ...extraHeaders,
    };
  }
}