export interface EnqueueOptions {
  /** задержка в секундах */
  startAfterSeconds?: number;
  /** ключ дедупликации */
  singletonKey?: string;
}

export interface JobQueue {
  enqueue(name: string, data: object, opts?: EnqueueOptions): Promise<void>;
}

export const JOB_QUEUE = Symbol('JOB_QUEUE');
