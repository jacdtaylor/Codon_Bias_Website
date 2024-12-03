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



JSONfiles = os.listdir('.\public\speciesIndividualJSONS')
myCursor = mydb.cursor()


for fileName in JSONfiles:
   
  dataTable = []
  tableName = fileName.strip("JSON.json")
  deleteTable = f"DROP TABLE IF EXISTS {tableName}"
  myCursor.execute(deleteTable)

  createTable = f"CREATE TABLE {tableName} (gene BLOB NOT NULL, `data` TEXT NOT NULL, PRIMARY KEY (`gene`(255)))"
  myCursor.execute(createTable)
  with open(f".\public\speciesIndividualJSONS\{fileName}") as f:
    data = json.load(f)
    for gene in data:
      geneData = data[gene]
      newGeneDict = {"gene": gene, "orthoGroups": geneData[0], "Proportions" : geneData[1]}
      dataTable.append((gene, json.dumps(newGeneDict)))



    importData = f"INSERT INTO {tableName} (gene, data) VALUES (%s, %s)"
    myCursor.executemany(importData, dataTable)
    mydb.commit()
    print(fileName)
    print(myCursor.rowcount, "was inserted")
    



   












