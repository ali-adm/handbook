FROM python:3.9-slim

WORKDIR /app

COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# Патчим напрямую через sed (самый надежный способ)
RUN sed -i 's/from werkzeug import secure_filename, FileStorage/from werkzeug.utils import secure_filename; from werkzeug.datastructures import FileStorage/g' /usr/local/lib/python3.9/site-packages/flask_uploads.py

COPY . .

RUN mkdir -p uploads/photos

EXPOSE 5000

CMD ["python", "app.py"]
