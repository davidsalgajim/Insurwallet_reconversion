# InsurWallet document worker — JDK 11 (OpenDataLoader) + Python 3.12
FROM eclipse-temurin:11-jdk-jammy

RUN apt-get update \
  && apt-get install -y --no-install-recommends \
    python3.12 \
    python3.12-venv \
    python3-pip \
  && rm -rf /var/lib/apt/lists/* \
  && ln -sf /usr/bin/python3.12 /usr/local/bin/python

WORKDIR /app

COPY pyproject.toml ./
COPY pipeline ./pipeline
COPY main.py ./

RUN python -m pip install --no-cache-dir --upgrade pip \
  && python -m pip install --no-cache-dir fastapi "uvicorn[standard]" pydantic

ENV PYTHONPATH=/app
ENV PORT=8080

EXPOSE 8080

CMD ["python", "-m", "uvicorn", "main:app", "--host", "0.0.0.0", "--port", "8080"]
