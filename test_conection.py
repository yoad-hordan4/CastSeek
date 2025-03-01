import pyodbc

server = "authcodes.database.windows.net"
database = "authcodes"
username = "yoad.hordan@post.runi.ac.il"
password = "stepmomxxx123"
driver = "{ODBC Driver 17 for SQL Server}"

try:
    conn = pyodbc.connect(
        f"DRIVER={driver};SERVER={server};DATABASE={database};UID={username};PWD={password}"
    )
    cursor = conn.cursor()
    cursor.execute("SELECT name FROM sys.databases;")
    rows = cursor.fetchall()
    
    print("✅ Connection Successful!")
    for row in rows:
        print(row.name)

except Exception as e:
    print("❌ Connection Failed:", e)
