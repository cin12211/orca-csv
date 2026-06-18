export enum CsvErrorCode {
  FILE_NOT_FOUND = 'FILE_NOT_FOUND',
  PERMISSION_DENIED = 'PERMISSION_DENIED',
  FILE_TOO_LARGE = 'FILE_TOO_LARGE',
  INVALID_FORMAT = 'INVALID_FORMAT',
  PARSE_ERROR = 'PARSE_ERROR',
  WRITE_ERROR = 'WRITE_ERROR',
  NOT_SUPPORTED = 'NOT_SUPPORTED',
}

export class CsvFileSystemError extends Error {
  constructor(
    message: string,
    public code: CsvErrorCode,
    public originalError?: Error
  ) {
    super(message);
    this.name = 'CsvFileSystemError';
  }
}
