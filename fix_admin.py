# fix_admin.py
from app import create_app
from models import db, User
from werkzeug.security import generate_password_hash

app = create_app()

with app.app_context():
    # Check if any admin exists
    admin = User.query.filter_by(is_admin=True).first()
    
    if admin:
        print(f"Admin found: {admin.name} ({admin.email})")
        print("Resetting password to 'Admin@123'")
        admin.password = generate_password_hash("Admin@123")
    else:
        print("No admin found. Creating new admin...")
        
        # Create admin user
        admin = User(
            name="Administrator",
            email="admin@evote.com",
            password=generate_password_hash("Admin@123"),
            is_admin=True
        )
        db.session.add(admin)
        print(f"Created admin: {admin.name} ({admin.email})")
    
    db.session.commit()
    
    # Verify
    admins = User.query.filter_by(is_admin=True).all()
    print(f"\nTotal admins in database: {len(admins)}")
    for a in admins:
        print(f"  - {a.name} ({a.email})")