# reset_database.py
import os
from app import create_app
from models import db, User
from werkzeug.security import generate_password_hash

# Delete existing database
if os.path.exists('voting_system.db'):
    os.remove('voting_system.db')
    print("Old database deleted")

app = create_app()
with app.app_context():
    # Create all tables
    db.create_all()
    
    # Create admin user
    admin = User(
        name="Administrator",
        email="admin@evote.com",
        password=generate_password_hash("Admin@123"),
        is_admin=True
    )
    
    # Create a regular user for testing
    regular_user = User(
        name="vinay",
        email="vinay@example.com",
        password=generate_password_hash("password123"),
        is_admin=False
    )
    
    db.session.add(admin)
    db.session.add(regular_user)
    db.session.commit()
    
    print("Database reset successfully!")
    print("Admin credentials:")
    print("  Username: admin (or admin@evote.com)")
    print("  Password: Admin@123")
    print("\nRegular user credentials:")
    print("  Email: vinay@example.com")
    print("  Password: password123")