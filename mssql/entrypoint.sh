#!/bin/bash

/opt/mssql/bin/sqlservr &

# Wait until SQL Server is up
echo "Waiting for SQL Server to start..."
until /opt/mssql-tools/bin/sqlcmd -S localhost -U SA -P "$SA_PASSWORD" -Q "SELECT 1" &> /dev/null
do
  sleep 2
done

# Restore the database
echo "Restoring database from .bak..."
/opt/mssql-tools/bin/sqlcmd -S localhost -U SA -P "$SA_PASSWORD" -i /var/opt/mssql/restore-database.sql

# Keep container alive
wait
