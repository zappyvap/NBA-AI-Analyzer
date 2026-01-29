# Use a lightweight Python image
FROM python:3.10-slim

# Set working directory
WORKDIR /app

# Install system dependencies for PyMuPDF and other tools
RUN apt-get update && apt-get install -y \
    build-essential \
    && rm -rf /var/lib/apt/lists/*

# Copy requirements first to leverage Docker cache
COPY backend/src/requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# Copy the rest of the backend code and data
COPY backend/src/ ./backend/src/
COPY backend/src/data/ ./data/

# Set environment variables (OpenAI key will be added via HF interface)
ENV PYTHONUNBUFFERED=1

# Hugging Face Spaces uses port 7860 by default
EXPOSE 7860

# Run the application
# We point to engine.py inside backend/src/
CMD ["uvicorn", "backend.src.engine:app", "--host", "0.0.0.0", "--port", "7860"]