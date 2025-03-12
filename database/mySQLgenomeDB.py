import mysql.connector
from jproperties import Properties
import os
import json


configs = Properties()
with open(".\database\db.properties", "rb") as read_props:
    configs.load(read_props)



try:
  mydb = mysql.connector.connect(
    host=configs.get("db.host").data,
    user=configs.get("db.user").data,
    password=configs.get("db.password").data,
    database=configs.get("db.name").data)
except:
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



myCursor = mydb.cursor()

deleteTable = f"DROP TABLE IF EXISTS genomeData"
myCursor.execute(deleteTable)
createTable = f"CREATE TABLE genomeData (Species TEXT, `data` LONGTEXT NOT NULL, PRIMARY KEY (`Species`(255)))"
myCursor.execute(createTable)
dataTable=[]




with open(f".\data\proportions\genomeWideJSON.json") as f:
    data = json.load(f)
    for item in data:
        speciesName = item["Species"]
        
        dataTable.append((speciesName, json.dumps(item)))





    importData = f"INSERT INTO genomeData (Species, data) VALUES (%s, %s)"
    while len(dataTable) > 0:
        if len(dataTable) < 60000:
            batch = len(dataTable)
        else:
            batch = 59999
        myCursor.executemany(importData, dataTable[0:batch])
        mydb.commit()
        print(myCursor.rowcount, "was inserted")
        dataTable = dataTable[batch:]


    
















