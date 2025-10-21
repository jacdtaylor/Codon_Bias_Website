import mysql.connector
from jproperties import Properties
import os
import json

configs = Properties()
with open("./database/db.properties", "rb") as read_props:
    configs.load(read_props)

try:
    mydb = mysql.connector.connect(
        host=configs.get("db.host").data,
        user=configs.get("db.user").data,
        password=configs.get("db.password").data,
        database=configs.get("db.name").data)
    print("Connected to database.")
except mysql.connector.Error:
    dbCreate = mysql.connector.connect(
        host=configs.get("db.host").data,
        user=configs.get("db.user").data,
        password=configs.get("db.password").data)
    createCursor = dbCreate.cursor()
    createCursor.execute(f"CREATE DATABASE {configs.get('db.name').data}")

    mydb = mysql.connector.connect(
        host=configs.get("db.host").data,
        user=configs.get("db.user").data,
        password=configs.get("db.password").data,
        database=configs.get('db.name').data
    )
    print(f"Connected to database '{configs.get('db.name').data}' successfully.")

TSVfiles = os.listdir('./public/vertebrate-other')
myCursor = mydb.cursor()

FILE_SIZE_LIMIT = 32 * 1024 * 1024  

for fileName in TSVfiles:
    print(fileName)
    dataTable = []
    tableName = fileName.strip("_Species_Proportions").replace(".", "_")
    deleteTable = f"DROP TABLE IF EXISTS {tableName}"
    myCursor.execute(deleteTable)

    createTable = f"CREATE TABLE {tableName} (gene BLOB NOT NULL, `data` TEXT NOT NULL, PRIMARY KEY (`gene`(255)))"
    myCursor.execute(createTable)

    file_path = f"./public/vertebrate-other/{fileName}"
    file_size = os.path.getsize(file_path)

    try:
        with open(file_path) as f:
            
            for line in f:
                line = line.strip()
                line = line.split("\t")
                newGeneDict = {"gene": line[0], "orthoGroups": line[2], "Proportions": line[3:]}
                dataTable.append((line[0], json.dumps(newGeneDict)))

            importData = f"INSERT INTO {tableName} (gene, data) VALUES (%s, %s)"
            
            if file_size > FILE_SIZE_LIMIT:
                length = len(dataTable)
                initialIndex = 0
                while initialIndex < length:
                    myCursor.executemany(importData, dataTable[initialIndex: initialIndex + 20000])
                    mydb.commit()
                    print(f"{fileName}: First batch inserted (20000 rows).")
                    initialIndex += 20000
                # myCursor.executemany(importData, dataTable[initialIndex - 20000:])
                # mydb.commit()
                # print(f"{fileName}: First batch inserted (20000 rows).")

                
                
            else:
                # Insert all at once if below limit
                myCursor.executemany(importData, dataTable)
                mydb.commit()
                print(f"{fileName}: {myCursor.rowcount} rows inserted.")

    except Exception as e:
        print(fileName, "ERROR WITH FILE:", e)
