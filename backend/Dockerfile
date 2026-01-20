# Use official Python image
FROM python:3.11-slim

# Set working directory
WORKDIR /app

# Install system dependencies (needed for psycopg2-binary sometimes, though binary usually includes them)
RUN apt-get update && apt-get install -y libpq-dev gcc && rm -rf /var/lib/apt/lists/*

# Copy requirements first for caching
COPY requirements.txt .

# Install dependencies
RUN pip install --no-cache-dir -r requirements.txt
RUN pip install uvicorn psycopg2-binary

# Copy application code
COPY . .

# Expose port
EXPOSE 8000

# Command to run (using 8000 inside container)
CMD ["uvicorn", "main:app", "--host", "0.0.0.0", "--port", "8000"]
