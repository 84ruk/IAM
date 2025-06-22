#!/bin/sh

# Espera a que el host y puerto estén disponibles
# Uso: ./wait-for.sh host:port -- comando

HOST_PORT=$1
shift

HOST=$(echo "$HOST_PORT" | cut -d':' -f1)
PORT=$(echo "$HOST_PORT" | cut -d':' -f2)

echo "Esperando a $HOST:$PORT..."

while ! nc -z "$HOST" "$PORT"; do
  sleep 1
done

echo "$HOST:$PORT está disponible, ejecutando comando: $@"
exec "$@"
