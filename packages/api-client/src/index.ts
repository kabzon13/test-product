import createClient, { type ClientOptions } from 'openapi-fetch';

import type { paths } from './types';

export type { paths };

/**
 * Typed клиент API. Два применения:
 * - браузер: createApiClient({ baseUrl: '/api/v1' }) — same-origin, куки идут сами
 * - RSC:     createApiClient({ baseUrl: INTERNAL_API_URL, headers: { cookie } })
 */
export function createApiClient(options: ClientOptions) {
  return createClient<paths>(options);
}
