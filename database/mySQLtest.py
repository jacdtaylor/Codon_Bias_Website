import mysql.connector
from jproperties import Properties
import os
import json


configs = Properties()
with open(".\database\db.properties", "rb") as read_props:
    configs.load(read_props)



mydb = mysql.connector.connect(
host=configs.get("db.host").data,
user=configs.get("db.user").data,
password=configs.get("db.password").data,
database=configs.get("db.name").data)


mycursor = mydb.cursor()

mycursor.execute("SELECT data FROM GCF_000281125_3 WHERE gene = 'PLCH2'")
myresult = mycursor.fetchall()
print(myresult[0][0])