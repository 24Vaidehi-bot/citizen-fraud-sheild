"""Shared application-level exceptions."""


class FraudShieldError(Exception):
    """Base class for all domain-specific errors."""

    def __init__(self, message: str, status_code: int = 400):
        self.message = message
        self.status_code = status_code
        super().__init__(message)


class InvalidInputError(FraudShieldError):
    def __init__(self, message: str = "Invalid input provided."):
        super().__init__(message, status_code=422)


class UnsupportedFileTypeError(FraudShieldError):
    def __init__(self, message: str = "Unsupported file type. Please upload PNG, JPG or WEBP."):
        super().__init__(message, status_code=415)


class FileTooLargeError(FraudShieldError):
    def __init__(self, message: str = "File exceeds the maximum allowed size."):
        super().__init__(message, status_code=413)


class OCRProcessingError(FraudShieldError):
    def __init__(self, message: str = "Failed to extract text from the image."):
        super().__init__(message, status_code=422)


class ResultNotFoundError(FraudShieldError):
    def __init__(self, message: str = "Analysis result not found."):
        super().__init__(message, status_code=404)
