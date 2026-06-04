from models import db
from app import create_app

def init_db():
    app = create_app()
    with app.app_context():
        db.create_all()
        
        # Create admin user if not exists
        from models import User
        from werkzeug.security import generate_password_hash
        
        admin = User.query.filter_by(email='admin@evote.com').first()
        if not admin:
            admin = User(
                name='Administrator',
                email='admin@evote.com',
                password=generate_password_hash('Admin@123'),
                is_admin=True
            )
            db.session.add(admin)
            db.session.commit()
            print("Admin user created!")