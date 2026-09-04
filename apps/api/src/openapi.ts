import { DocumentBuilder } from '@nestjs/swagger';

export function buildOpenApiConfig() {
  // Пути в спеке — без /api/v1: клиенты сами задают baseUrl
  // (браузер '/api/v1', сервер INTERNAL_API_URL).
  return new DocumentBuilder()
    .setTitle('test API')
    .setVersion('1.0')
    .addServer('/api/v1')
    .addCookieAuth('session')
    .build();
}
