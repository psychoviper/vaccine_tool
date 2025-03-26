# Base image
FROM python:3.9

# Set working directory
WORKDIR /app

# Copy files
COPY . .

# Install dependencies
RUN pip install --no-cache-dir -r requirements.txt

# Expose port for Quart
EXPOSE 8000

# Default command to start Quart
CMD exec python app.py
