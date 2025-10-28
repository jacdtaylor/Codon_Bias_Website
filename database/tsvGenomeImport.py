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



for clade in ["archaea", "fungi", "invertebrate", "mammalia", "protozoa", "vertebrate-other", "viridiplantae"]:
    first = True
    with open(f".\data\proportions\genome\{clade}.tsv") as f:
        for line in f:
            if first:
                first = False
                line = line.strip()
                line = line.split()
                codons = line[3:]
            else:
                item = {}
                line = line.strip()
                line = line.split()
                proportions = line[3:]
                for n in range(len(codons)):
                    item[codons[n]] = proportions[n]
                speciesName = line[0]
                item["Species"] = speciesName
            
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


    
















