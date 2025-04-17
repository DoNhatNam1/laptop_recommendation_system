FROM python:3.9-slim

# Cài đặt các dependencies cho psycopg2
RUN apt-get update && apt-get install -y \
    gcc \
    python3-dev \
    libpq-dev \
    curl \
    && apt-get clean \
    && rm -rf /var/lib/apt/lists/*

# Thiết lập thư mục làm việc
WORKDIR /app

# Copy requirements.txt
COPY requirements.txt .

# Cài đặt dependencies
RUN pip install --no-cache-dir -r requirements.txt

# Cài đặt psycopg2-binary trực tiếp nếu cần
RUN pip install --no-cache-dir psycopg2-binary

# Copy source code
COPY . .

# Đặt quyền thực thi cho entrypoint script
RUN chmod +x entrypoint.sh

# Expose port
EXPOSE 5000

# Chạy migration và khởi động ứng dụng
ENTRYPOINT ["./entrypoint.sh"]