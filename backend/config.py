from flask import Flask
from flask_login import LoginManager
from flask_sqlalchemy import SQLAlchemy
from flask_cors import CORS
import os
from dotenv import load_dotenv

load_dotenv(dotenv_path='../.env')
app = Flask(__name__)
CORS(app)

#TODO: CHANGE DATABASE URL TO NEON DB
app.config['SECRET_KEY']=os.getenv('FLASK_SECRET_KEY')
app.config['SQLALCHEMY_DATABASE_URI'] = os.getenv('NEON_DB_URI')
app.config['CHATS']={}
db = SQLAlchemy(app)

login_manager = LoginManager(app)
login_manager.login_view = 'login'