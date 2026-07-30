import { HttpException, HttpStatus } from '@nestjs/common';
import { AxiosError } from 'axios';

type DownstreamErrorBody = {
  statusCode?: number;
  message?: string | string[];
  error?: string;
};

/**
 * Maps Axios failures from downstream Nest services into Nest HttpExceptions
 * so clients see the original status/message instead of an opaque 500.
 */
export function rethrowDownstreamHttpError(error: unknown): never {
  if (error instanceof HttpException) {
    throw error;
  }

  const axiosError = error as AxiosError<DownstreamErrorBody>;
  const status = axiosError.response?.status;
  const data = axiosError.response?.data;

  if (status && data !== undefined) {
    throw new HttpException(data, status);
  }

  if (status) {
    throw new HttpException(
      {
        statusCode: status,
        message: axiosError.message || 'Downstream service error',
      },
      status,
    );
  }

  throw new HttpException(
    {
      statusCode: HttpStatus.BAD_GATEWAY,
      message: 'Downstream service unreachable',
    },
    HttpStatus.BAD_GATEWAY,
  );
}

/** Run an async proxy call and normalize downstream HTTP errors. */
export async function proxyDownstream<T>(operation: () => Promise<T>): Promise<T> {
  try {
    return await operation();
  } catch (error: unknown) {
    rethrowDownstreamHttpError(error);
  }
}
