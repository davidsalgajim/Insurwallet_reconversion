# Golden set (task 3.10)

20 validator cases + 3 synthetic PDF fixtures. CI gate: critical fields ≥95%.

Replace synthetic `pdf_cases` with real policy PDFs (incl. Cancer Bancolombia) when available — keep `expected` JSON aligned with human-reviewed extractions.

Run locally:

```powershell
cd worker
pytest tests/test_golden.py -v
```
