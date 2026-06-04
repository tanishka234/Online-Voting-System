# test_admin.py
from app import create_app
from models import db, User

app = create_app()
with app.app_context():
    # Check database
    print("=== Database Check ===")
    users = User.query.all()
    print(f"Total users: {len(users)}")
    
    for user in users:
        print(f"\nUser: {user.name}")
        print(f"  Email: {user.email}")
        print(f"  is_admin: {user.is_admin}")
        print(f"  Password hash: {user.password[:30]}...")
    
    # Check config
    print("\n=== Config Check ===")
    print(f"ADMIN_USERNAME: {app.config.get('ADMIN_USERNAME')}")
    print(f"ADMIN_PASSWORD: {app.config.get('ADMIN_PASSWORD')}")