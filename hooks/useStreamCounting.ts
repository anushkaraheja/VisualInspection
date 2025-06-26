import { prepareFormData } from '@/lib/stream/streamHelper';

// Error types for better categorization
export enum StreamErrorType {
  NETWORK = 'NETWORK_ERROR',
  SERVER = 'SERVER_ERROR',
  VALIDATION = 'VALIDATION_ERROR',
  UNKNOWN = 'UNKNOWN_ERROR',
}

export interface StreamError {
  type: StreamErrorType;
  message: string;
  timestamp: Date;
  originalError?: any;
  statusCode?: number;
}

// Type guard to check if an object is a StreamError
export function isStreamError(obj: any): obj is StreamError {
  return (
    obj !== null &&
    typeof obj === 'object' &&
    'type' in obj &&
    'message' in obj &&
    'timestamp' in obj &&
    Object.values(StreamErrorType).includes(obj.type as StreamErrorType)
  );
}

interface UseStreamCountingOptions {
  baseUrl?: string;
  onError?: (error: StreamError) => void;
}

export const useStreamCounting = (options: UseStreamCountingOptions = {}) => {
  const baseUrl = options.baseUrl || 'http://172.206.1.94:8003';

  const createError = (
    type: StreamErrorType,
    message: string,
    originalError?: any,
    statusCode?: number
  ): StreamError => ({
    type,
    message,
    timestamp: new Date(),
    originalError,
    statusCode,
  });

  const startStopCounting = async (isCounting: boolean, formData: any) => {
    const preparedData = prepareFormData(formData);
    const endpoint = isCounting ? '/stop' : '/start';

    try {
      const response = await fetch(`${baseUrl}${endpoint}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(preparedData),
      });

      if (!response.ok) {
        // More detailed error handling based on status code
        const errorMessage = await response
          .text()
          .catch(() => 'Unknown server error');
        const error = createError(
          StreamErrorType.SERVER,
          `Server error: ${errorMessage}`,
          null,
          response.status
        );

        if (options.onError) {
          options.onError(error);
        }

        throw error;
      }

      return await response.json().catch(() => ({}));
    } catch (error) {
      if (isStreamError(error)) {
        throw error; // Already handled
      }

      let streamError: StreamError;

      if (error instanceof TypeError) {
        streamError = createError(
          StreamErrorType.NETWORK,
          'Network error: Unable to connect to the server',
          error
        );
      } else {
        streamError = createError(
          StreamErrorType.UNKNOWN,
          'An unexpected error occurred',
          error
        );
      }

      if (options.onError) {
        options.onError(streamError);
      }

      throw streamError;
    }
  };

  return { startStopCounting };
};
