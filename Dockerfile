FROM python:3.14

ENV PYTHONUNBUFFERED=1
WORKDIR /app

RUN useradd -m -s /bin/bash ihms

RUN apt-get update \
    && apt-get install -y nodejs npm git \
    && rm -rf /var/lib/apt/lists/*

COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

COPY docker-entrypoint.sh /usr/local/bin/docker-entrypoint.sh
RUN chmod +x /usr/local/bin/docker-entrypoint.sh

COPY . .
RUN mkdir -p /app/config \
    && chown -R ihms:ihms /app \
    && chmod 755 /app/config

RUN npm run build

EXPOSE 8000

ENTRYPOINT ["/usr/local/bin/docker-entrypoint.sh"]