import mysql.connector

mydb = mysql.connector.connect(
  host="localhost",
  user="root",
  password="1632143Ja$"
)

mycursor = mydb.cursor()

mycursor.execute("CREATE DATABASE codonbias")