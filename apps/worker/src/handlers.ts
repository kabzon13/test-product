import type { Logger } from 'pino';

type Handler = (data: object, logger: Logger) => Promise<void>;

/**
 * Скелет обработчиков. Фоновые задачи продукта регистрируются здесь.
 * API кладёт задачи через JobQueue.enqueue(name, data).
 */
export const handlers: Record<string, Handler> = {
  heartbeat: async (_data, logger) => {
    logger.info('heartbeat handled');
  },
};
