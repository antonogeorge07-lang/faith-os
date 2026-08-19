FROM node:20-alpine AS frontend-build
WORKDIR /app/faith-os-ui
COPY faith-os-ui/package*.json ./
RUN npm install
COPY faith-os-ui/ ./
RUN npm run build

FROM python:3.11-slim
WORKDIR /app
COPY requirements.txt ./
RUN pip install --no-cache-dir -r requirements.txt
COPY . .
COPY --from=frontend-build /app/faith-os-ui/dist ./faith-os-ui/dist

EXPOSE 8999
CMD ["python3", "faith_os.py"]
