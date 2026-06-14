"""Pipeline error types with stable codes for API mapping."""


class PdfEncryptedError(RuntimeError):
    """Raised when a PDF requires a password or has an encryption dictionary."""

    CODE = "PDF_ENCRYPTED"

    def __init__(self, message: str = "PDF is password protected") -> None:
        super().__init__(message)
        self.code = self.CODE
