from flask_login import UserMixin
from werkzeug.security import generate_password_hash, check_password_hash
from .config import db
from sqlalchemy import Enum as SQLAlchemyEnum
from enum import Enum as PyEnum

class UserSystemEnum(PyEnum):
    MODEL = "model"
    USER = "user"

class User(UserMixin, db.Model):
    id = db.Column(db.Integer, primary_key=True)
    username = db.Column(db.String(120), unique=True, nullable=False)
    email= db.Column(db.String(120), unique=True, nullable=False)
    password_hash = db.Column(db.String(),nullable=False)

    def set_password(self, password):
        self.password_hash = generate_password_hash(password)

    def check_password(self, password):
        if self.password_hash is None:
            return False
        return check_password_hash(self.password_hash, password)

    def to_json(self):
        return {
            'id': self.id,
            'username': self.username
        }

class Chats(db.Model):
    chat_id=db.Column(db.Integer, primary_key=True)
    pdf_name=db.Column(db.String(120), nullable=False)
    pdf_url=db.Column(db.String(120), nullable=False)
    created_at=db.Column(db.DateTime, nullable=False,default=db.func.now())
    username=db.Column(db.String(120), nullable=False)
    file_key=db.Column(db.String(120), nullable=False)

    def to_json(self):
        return {
            'chat_id': self.chat_id,
            'pdf_name': self.pdf_name,
            'pdf_url': self.pdf_url,
            'created_at': self.created_at,
            'username': self.username,
            'file_key': self.file_key,
        }

class Messages(db.Model):
    id=db.Column(db.Integer, primary_key=True)
    chat_id=db.Column(db.Integer,db.ForeignKey('chats.chat_id'), nullable=False)
    content=db.Column(db.String(), nullable=False)
    created_at = db.Column(db.DateTime, nullable=False, default=db.func.now())
    role=db.Column(SQLAlchemyEnum(UserSystemEnum), nullable=False)

    def to_json(self):
        return {
            'id': self.id,
            'chat_id': self.chat_id,
            'content': self.content,
            'created_at': self.created_at,
            'role': self.role.value
        }

def init_models(app):
    with app.app_context():
        db.create_all()