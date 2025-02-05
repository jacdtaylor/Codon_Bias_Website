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



JSONfiles = os.listdir('.\public\OrthoGroups')
myCursor = mydb.cursor()

deleteTable = f"DROP TABLE IF EXISTS orthogroups"
myCursor.execute(deleteTable)
createTable = f"CREATE TABLE orthogroups (groupID BLOB NOT NULL, `data` LONGTEXT NOT NULL, PRIMARY KEY (`groupID`(255)))"
myCursor.execute(createTable)
dataTable=[]

for fileName in JSONfiles:
  
 
    with open(f".\public\OrthoGroups\{fileName}") as f:
        data = json.load(f)
        for ID in data:
            groupData = data[ID]
            orthoDict = {'groupID': ID, "species": groupData}
            dataTable.append((ID, json.dumps(orthoDict)))





        importData = f"INSERT INTO orthogroups (groupID, data) VALUES (%s, %s)"
        while len(dataTable) > 0:
            if len(dataTable) < 60000:
               batch = len(dataTable)
            else:
               batch = 59999
            myCursor.executemany(importData, dataTable[0:batch])
            mydb.commit()
            print(fileName)
            print(myCursor.rowcount, "was inserted")
            dataTable = dataTable[batch:]
  
    
      



   












