import 'server-only';

import { createApiClient } from '@test/api-client';
import { cookies } from 'next/headers';

const baseUrl = process.env.INTERNAL_API_URL ?? 'http://localhost:4000/api/v1';

/** Серверный клиент API (RSC): куки пробрасываются из запроса пользователя. */
export async function serverApi() {
  const cookieHeader = (await cookies()).toString();
  return createApiClient({
    baseUrl,
    headers: cookieHeader ? { cookie: cookieHeader } : {},
    cache: 'no-store',
  });
}
