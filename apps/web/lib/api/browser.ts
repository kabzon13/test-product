import { createApiClient } from '@test/api-client';

/** Браузерный клиент API: same-origin, куки идут автоматически. */
export const api = createApiClient({ baseUrl: '/api/v1' });
