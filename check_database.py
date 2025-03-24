import pymssql

# Azure SQL Database credentials
SERVER = "authcodes.database.windows.net"
DATABASE = "CastSeekDB"
USERNAME = "CloudSA84a5f8c6"
PASSWORD = "YourActualPasswordHere"  # Replace with your real password

try:
    # Connect to Azure SQL Database
    conn = pymssql.connect(server=SERVER, user=USERNAME, password=PASSWORD, database=DATABASE)
    cursor = conn.cursor()

    # Test query
    cursor.execute("SELECT @@VERSION")
    row = cursor.fetchone()
    print("✅ Successfully connected to Azure SQL Database!")
    print("SQL Server Version:", row[0])

    # Close connection
    conn.close()
except Exception as e:
    print(f"❌ Connection failed: {e}")
