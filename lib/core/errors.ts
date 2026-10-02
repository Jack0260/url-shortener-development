import type { RiskReport } from './risk'

export class AppError extends Error {
  constructor(
    message: string,
    readonly status: number,
    readonly code: string,
    readonly details?: unknown,
  ) {
    super(message)
    this.name = new.target.name
  }
}

export class ValidationError extends AppError {
  constructor(message: string) {
    super(message, 400, 'invalid_input')
  }
}

export class AliasTakenError extends AppError {
  constructor(alias: string) {
    super(`The alias "${alias}" is already taken`, 409, 'alias_taken')
  }
}

export class MaliciousUrlError extends AppError {
  constructor(risk: RiskReport) {
    super('This URL looks malicious and was not shortened', 422, 'malicious_url', risk)
  }
}

export class CodeExhaustedError extends AppError {
  constructor() {
    super('Could not allocate a unique short code, please retry', 503, 'code_exhausted')
  }
}
