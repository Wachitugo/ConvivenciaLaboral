#!/bin/sh

# Script de inicio para Nginx con configuración dinámica

# Establecer valores por defecto si no están definidos
export BACKEND_URL=${BACKEND_URL:-"https://convivencia-backend-564491733339.us-central1.run.app"}
export BACKEND_HOST=${BACKEND_HOST:-"convivencia-backend-564491733339.us-central1.run.app"}

echo "🔧 Configurando Nginx con:"
echo "  BACKEND_URL: $BACKEND_URL"
echo "  BACKEND_HOST: $BACKEND_HOST"

# Sustituir variables en el template y generar nginx.conf
envsubst '${BACKEND_URL} ${BACKEND_HOST}' < /etc/nginx/conf.d/default.conf.template > /etc/nginx/conf.d/default.conf

echo "✅ Configuración de Nginx generada"

# Iniciar Nginx
exec nginx -g 'daemon off;'
