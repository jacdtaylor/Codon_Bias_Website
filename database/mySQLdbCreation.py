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

JSONfiles = os.listdir('.\public\speciesIndividualJSONS')
myCursor = mydb.cursor()

FILE_SIZE_LIMIT = 32 * 1024 * 1024  

for fileName in JSONfiles:
    dataTable = []
    tableName = fileName.strip("JSON.json").replace(".", "_")
    deleteTable = f"DROP TABLE IF EXISTS {tableName}"
    myCursor.execute(deleteTable)

    createTable = f"CREATE TABLE {tableName} (gene BLOB NOT NULL, `data` TEXT NOT NULL, PRIMARY KEY (`gene`(255)))"
    myCursor.execute(createTable)

    file_path = f".\public\speciesIndividualJSONS\{fileName}"
    file_size = os.path.getsize(file_path)

    try:
        with open(file_path) as f:
            data = json.load(f)
            for gene, geneData in data.items():
                newGeneDict = {"gene": gene, "orthoGroups": geneData[0], "Proportions": geneData[1]}
                dataTable.append((gene, json.dumps(newGeneDict)))

            importData = f"INSERT INTO {tableName} (gene, data) VALUES (%s, %s)"
            
            if file_size > FILE_SIZE_LIMIT:
                # Split into two batches
                first_index = len(dataTable) // 3
                second_index = first_index*2
                myCursor.executemany(importData, dataTable[:first_index])
                mydb.commit()
                print(f"{fileName}: First batch inserted ({first_index} rows).")

                myCursor.executemany(importData, dataTable[first_index:second_index])
                mydb.commit()
                print(f"{fileName}: Second batch inserted ({second_index-first_index} rows).")


                myCursor.executemany(importData, dataTable[second_index:])
                mydb.commit()
                print(f"{fileName}: Third batch inserted ({len(dataTable) - second_index} rows).")
            else:
                # Insert all at once if below limit
                myCursor.executemany(importData, dataTable)
                mydb.commit()
                print(f"{fileName}: {myCursor.rowcount} rows inserted.")

    except Exception as e:
        print(fileName, "ERROR WITH FILE:", e)
