FROM python:3.9-slim

WORKDIR /app

# Устанавливаем системные зависимости и шрифты
RUN apt-get update && apt-get install -y \
    fonts-liberation \
    fonts-dejavu \
    && rm -rf /var/lib/apt/lists/*

COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

COPY . .

RUN mkdir -p uploads/photos

EXPOSE 5000

CMD ["python", "app.py"]
