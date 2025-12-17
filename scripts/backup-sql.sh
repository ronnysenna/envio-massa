#!/bin/bash

# Script para fazer backup SQL completo via pg_dump
# Uso: ./scripts/backup-sql.sh

# Carregar variáveis de ambiente de forma segura
if [ -f ".env.local" ]; then
    set -a
    source .env.local
    set +a
elif [ -f ".env" ]; then
    set -a
    source .env
    set +a
fi

BACKUP_DIR="./backups"
TIMESTAMP=$(date +"%Y-%m-%d_%H-%M-%S")
BACKUP_FILE="$BACKUP_DIR/backup-sql-$TIMESTAMP.sql"

# Criar diretório de backups se não existir
mkdir -p "$BACKUP_DIR"

# Verificar se DATABASE_URL está definida
if [ -z "$DATABASE_URL" ]; then
    echo "❌ Erro: DATABASE_URL não está definida"
    echo "   Configure a variável de ambiente DATABASE_URL em seu .env.local"
    exit 1
fi

echo "🔄 Iniciando backup SQL do banco de dados..."
echo "📁 Arquivo será salvo em: $BACKUP_FILE"
echo ""

# Fazer backup
if pg_dump "$DATABASE_URL" > "$BACKUP_FILE"; then
    FILE_SIZE=$(du -h "$BACKUP_FILE" | cut -f1)
    echo "✅ Backup SQL criado com sucesso!"
    echo "📊 Tamanho do arquivo: $FILE_SIZE"
    echo ""
    echo "💾 Para restaurar este backup em outro banco, execute:"
    echo "   psql \$NEW_DATABASE_URL < $BACKUP_FILE"
else
    echo "❌ Erro ao criar backup SQL"
    echo "   Verifique se o PostgreSQL está instalado e DATABASE_URL está correto"
    exit 1
fi
