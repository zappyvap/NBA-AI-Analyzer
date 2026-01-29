FROM python:3.10-slim

WORKDIR /app

# Install system dependencies
RUN apt-get update && apt-get install -y \
    build-essential \
    && rm -rf /var/lib/apt/lists/*

# Copy and install requirements
COPY backend/src/requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# Copy the backend code and data
COPY backend/src/ ./backend/src/
COPY backend/src/data/ ./data/

# Add the src directory to the Python Path so local imports work
ENV PYTHONPATH=/app/backend/src

# Hugging Face uses port 7860
EXPOSE 7860

# Command to start your engine
CMD ["uvicorn", "backend.src.engine:app", "--host", "0.0.0.0", "--port", "7860", "--proxy-headers"]