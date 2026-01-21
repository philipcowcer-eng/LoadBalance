#!/bin/bash
# PostgreSQL Backup Script for Resource Manager
# Run via cron: 0 2 * * * /home/user-phil/resource_manager/scripts/backup_postgres.sh

BACKUP_DIR="/home/user-phil/backups"
DATE=$(date +%Y%m%d_%H%M%S)
DB_CONTAINER="rm-postgres"
DB_NAME="resource_manager"
DB_USER="postgres"

# Create backup directory if it doesn't exist
mkdir -p $BACKUP_DIR

# Create backup
echo "Starting backup at $(date)..."
docker exec $DB_CONTAINER pg_dump -U $DB_USER $DB_NAME > $BACKUP_DIR/rm_backup_$DATE.sql

if [ $? -eq 0 ]; then
    echo "Backup created: $BACKUP_DIR/rm_backup_$DATE.sql"
    
    # Compress the backup
    gzip $BACKUP_DIR/rm_backup_$DATE.sql
    echo "Backup compressed: $BACKUP_DIR/rm_backup_$DATE.sql.gz"
    
    # Delete backups older than 7 days
    find $BACKUP_DIR -name "rm_backup_*.sql.gz" -mtime +7 -delete
    echo "Old backups cleaned up."
else
    echo "ERROR: Backup failed!"
    exit 1
fi

echo "Backup complete at $(date)"
