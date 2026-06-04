from flask_sqlalchemy import SQLAlchemy
from flask_login import UserMixin
from datetime import datetime
import uuid

db = SQLAlchemy()

class User(UserMixin, db.Model):
    id = db.Column(db.Integer, primary_key=True)
    name = db.Column(db.String(100), nullable=False)
    email = db.Column(db.String(100), unique=True, nullable=False)
    password = db.Column(db.String(200), nullable=False)
    is_admin = db.Column(db.Boolean, default=False)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)

class Voter(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    voter_id = db.Column(db.String(20), unique=True, nullable=False)
    name = db.Column(db.String(100), nullable=False)
    email = db.Column(db.String(100), nullable=False)
    date_of_birth = db.Column(db.Date, nullable=False)
    address = db.Column(db.Text, nullable=False)
    is_verified = db.Column(db.Boolean, default=False)
    has_voted = db.Column(db.Boolean, default=False)
    added_by = db.Column(db.String(100))
    added_at = db.Column(db.DateTime, default=datetime.utcnow)

class Candidate(db.Model):
    __tablename__ = 'candidate'
    
    id = db.Column(db.Integer, primary_key=True)
    candidate_id = db.Column(db.String(50), unique=True, nullable=False)
    name = db.Column(db.String(100), nullable=False)
    party_name = db.Column(db.String(100), nullable=False)
    party_symbol = db.Column(db.String(500))
    candidate_photo = db.Column(db.String(500))  # Add this field
    manifesto = db.Column(db.Text)
    is_active = db.Column(db.Boolean, default=True)
    added_at = db.Column(db.DateTime, default=datetime.utcnow)
    
    # Relationship
    votes = db.relationship('Vote', backref='candidate', lazy=True)

class Vote(db.Model):
    id = db.Column(db.String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    voter_id = db.Column(db.String(20), db.ForeignKey('voter.voter_id'), nullable=False)
    candidate_id = db.Column(db.String(20), db.ForeignKey('candidate.candidate_id'), nullable=False)
    timestamp = db.Column(db.DateTime, default=datetime.utcnow)
    location = db.Column(db.String(200))
    ip_address = db.Column(db.String(50))
    receipt_number = db.Column(db.String(50), unique=True)

class VoteReceipt(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    receipt_number = db.Column(db.String(50), unique=True, nullable=False)
    voter_name = db.Column(db.String(100), nullable=False)
    voter_id = db.Column(db.String(20), nullable=False)
    candidate_name = db.Column(db.String(100), nullable=False)
    candidate_party = db.Column(db.String(100), nullable=False)
    timestamp = db.Column(db.DateTime, nullable=False)
    location = db.Column(db.String(200))
    status = db.Column(db.String(20), default='VALID')
    
class ContactMessage(db.Model):
    __tablename__ = 'contact_message'
    
    id = db.Column(db.Integer, primary_key=True)
    name = db.Column(db.String(100), nullable=False)
    email = db.Column(db.String(100), nullable=False)
    phone = db.Column(db.String(20))
    subject = db.Column(db.String(50), nullable=False)
    message = db.Column(db.Text, nullable=False)
    status = db.Column(db.String(20), default='pending')  # pending, replied, closed
    ip_address = db.Column(db.String(50))
    user_agent = db.Column(db.String(200))
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    replied_at = db.Column(db.DateTime)
    replied_by = db.Column(db.String(100))
    reply_message = db.Column(db.Text)
    
    def __repr__(self):
        return f'<ContactMessage {self.name} - {self.subject}>'