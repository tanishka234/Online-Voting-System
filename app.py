from flask import Flask, render_template, request, jsonify, redirect, url_for, flash, session, make_response
from flask_login import LoginManager, login_user, login_required, logout_user, current_user
from werkzeug.security import generate_password_hash, check_password_hash
from datetime import datetime
import uuid
import requests
from functools import wraps
import json
import io
import csv
from reportlab.lib import colors
from reportlab.lib.pagesizes import letter, landscape
from reportlab.platypus import SimpleDocTemplate, Table, TableStyle, Paragraph, Spacer
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from reportlab.lib.units import inch

from config import Config
from models import db, User, Voter, Candidate, Vote, VoteReceipt

def create_app():
    app = Flask(__name__)
    app.config.from_object(Config)
    
    db.init_app(app)
    
    login_manager = LoginManager()
    login_manager.init_app(app)
    login_manager.login_view = 'login'
    
    @login_manager.user_loader
    def load_user(user_id):
        return User.query.get(int(user_id))
    
    # Admin login required decorator
    def admin_required(f):
        @wraps(f)
        def decorated_function(*args, **kwargs):
            if not current_user.is_authenticated or not current_user.is_admin:
                return redirect(url_for('admin_login'))
            return f(*args, **kwargs)
        return decorated_function
    
    # Home page route
    @app.route('/')
    def index():
        candidates = Candidate.query.filter_by(is_active=True).all()
        total_votes = Vote.query.count()
        return render_template('index.html', candidates=candidates, total_votes=total_votes)
    
    # User registration
    @app.route('/register', methods=['GET', 'POST'])
    def register():
        if request.method == 'POST':
            name = request.form.get('name')
            email = request.form.get('email')
            password = request.form.get('password')
            confirm_password = request.form.get('confirm_password')
            
            if password != confirm_password:
                flash('Passwords do not match!', 'error')
                return redirect(url_for('register'))
            
            existing_user = User.query.filter_by(email=email).first()
            if existing_user:
                flash('Email already registered!', 'error')
                return redirect(url_for('register'))
            
            hashed_password = generate_password_hash(password)
            new_user = User(name=name, email=email, password=hashed_password)
            
            db.session.add(new_user)
            db.session.commit()
            
            flash('Registration successful! Please login.', 'success')
            return redirect(url_for('login'))
        
        return render_template('register.html')
    
    # User login
    @app.route('/login', methods=['GET', 'POST'])
    def login():
        if request.method == 'POST':
            email = request.form.get('email')
            password = request.form.get('password')
            
            user = User.query.filter_by(email=email).first()
            
            if user and check_password_hash(user.password, password):
                login_user(user)
                flash('Login successful!', 'success')
                return redirect(url_for('index'))
            else:
                flash('Invalid credentials!', 'error')
        
        return render_template('login.html')
    
    # Logout
    @app.route('/logout')
    @login_required
    def logout():
        logout_user()
        flash('Logged out successfully!', 'success')
        return redirect(url_for('index'))
    
    # Vote Now - Verification Page
    @app.route('/verify', methods=['GET', 'POST'])
    @login_required
    def verify():
        if request.method == 'POST':
            voter_id = request.form.get('voter_id')
            name = request.form.get('name')
            
            voter = Voter.query.filter_by(voter_id=voter_id, name=name).first()
            
            if voter:
                if voter.has_voted:
                    flash('You have already voted!', 'error')
                    return redirect(url_for('index'))
                
                session['voter_id'] = voter.voter_id
                session['voter_name'] = voter.name
                return redirect(url_for('vote_page'))
            else:
                flash('Voter not found or not verified!', 'error')
        
        return render_template('verify.html')
    
    # Get location (simulated)
    @app.route('/get_location')
    def get_location():
        # In production, use a geolocation service
        # For demo, return a mock location
        return jsonify({
            'location': 'New Delhi, India',
            'latitude': 28.6139,
            'longitude': 77.2090
        })
    
    # Voting Page
    @app.route('/vote')
    @login_required
    def vote_page():
        if 'voter_id' not in session:
            return redirect(url_for('verify'))
        
        candidates = Candidate.query.filter_by(is_active=True).all()
        return render_template('vote.html', candidates=candidates)
    
    # Submit Vote
    @app.route('/submit_vote', methods=['POST'])
    @login_required
    def submit_vote():
        if 'voter_id' not in session:
            return jsonify({'success': False, 'message': 'Voter not verified'})
        
        data = request.json
        candidate_id = data.get('candidate_id')
        location = data.get('location', 'Unknown')
        
        # Check if already voted
        voter = Voter.query.filter_by(voter_id=session['voter_id']).first()
        if voter and voter.has_voted:
            return jsonify({'success': False, 'message': 'Already voted'})
        
        candidate = Candidate.query.filter_by(candidate_id=candidate_id).first()
        if not candidate:
            return jsonify({'success': False, 'message': 'Invalid candidate'})
        
        # Generate receipt number
        receipt_number = f"REC-{datetime.now().strftime('%Y%m%d')}-{str(uuid.uuid4())[:8].upper()}"
        
        # Create vote record
        new_vote = Vote(
            voter_id=session['voter_id'],
            candidate_id=candidate_id,
            location=location,
            ip_address=request.remote_addr,
            receipt_number=receipt_number
        )
        
        # Create receipt
        new_receipt = VoteReceipt(
            receipt_number=receipt_number,
            voter_name=session['voter_name'],
            voter_id=session['voter_id'],
            candidate_name=candidate.name,
            candidate_party=candidate.party_name,
            timestamp=datetime.utcnow(),
            location=location,
            status='VALID'
        )
        
        # Update voter status
        voter.has_voted = True
        
        db.session.add(new_vote)
        db.session.add(new_receipt)
        db.session.commit()
        
        # Clear session
        session.pop('voter_id', None)
        session.pop('voter_name', None)
        
        return jsonify({
            'success': True,
            'receipt_number': receipt_number,
            'redirect': url_for('receipt', receipt_id=receipt_number)
        })
    
    # View Receipt
    @app.route('/receipt/<receipt_id>')
    @login_required
    def receipt(receipt_id):
        receipt = VoteReceipt.query.filter_by(receipt_number=receipt_id).first()
        if not receipt:
            flash('Receipt not found!', 'error')
            return redirect(url_for('index'))
        
        return render_template('receipt.html', receipt=receipt)
    
    # Tutorial Page
    @app.route('/tutorial')
    def tutorial():
        return render_template('tutorial.html')
    
    @app.route('/contact', methods=['GET', 'POST'])
    def contact():
        if request.method == 'POST':
            name = request.form.get('name')
            email = request.form.get('email')
            phone = request.form.get('phone')
            subject = request.form.get('subject')
            message = request.form.get('message')
            
            # Here you can add code to send email or save to database
            # For now, just flash success message
            
            # You can also save contact messages to database if you want
            # new_contact = ContactMessage(name=name, email=email, ...)
            # db.session.add(new_contact)
            # db.session.commit()
            
            flash('Thank you for contacting us! We will get back to you soon.', 'success')
            return redirect(url_for('contact'))
        
        return render_template('contact.html')
    
    # Admin Routes
    @app.route('/admin/login', methods=['GET', 'POST'])
    def admin_login():
        if request.method == 'POST':
            username = request.form.get('username')
            password = request.form.get('password')
            
            if username == app.config['ADMIN_USERNAME'] and password == app.config['ADMIN_PASSWORD']:
                admin_user = User.query.filter_by(is_admin=True).first()
                login_user(admin_user)
                return redirect(url_for('admin_dashboard'))
            else:
                flash('Invalid admin credentials!', 'error')
        
        return render_template('admin/login.html')
    
    @app.route('/admin/dashboard')
    @admin_required
    def admin_dashboard():
        total_voters = Voter.query.count()
        total_candidates = Candidate.query.count()
        total_votes = Vote.query.count()
        voted_count = Voter.query.filter_by(has_voted=True).count()
        
        # Get vote counts per candidate
        candidates = Candidate.query.all()
        vote_data = []
        for candidate in candidates:
            vote_count = Vote.query.filter_by(candidate_id=candidate.candidate_id).count()
            vote_data.append({
                'name': candidate.name,
                'party': candidate.party_name,
                'votes': vote_count
            })
        
        return render_template('admin/dashboard.html',
                             total_voters=total_voters,
                             total_candidates=total_candidates,
                             total_votes=total_votes,
                             voted_count=voted_count,
                             vote_data=vote_data)


    @app.route('/api/vote_counts')
    def vote_counts():
        candidates = Candidate.query.all()
        data = []
        for candidate in candidates:
            count = Vote.query.filter_by(candidate_id=candidate.candidate_id).count()
            data.append({
                'name': candidate.name,
                'party': candidate.party_name,
                'votes': count,
                'candidate_id': candidate.candidate_id,
                'is_active': candidate.is_active
            })
        return jsonify(data)

    @app.route('/admin/manage_voters', methods=['GET', 'POST'])
    @admin_required
    def manage_voters():
        if request.method == 'POST':
            action = request.form.get('action')
            
            if action == 'add':
                voter_id = request.form.get('voter_id')
                name = request.form.get('name')
                email = request.form.get('email')
                dob = datetime.strptime(request.form.get('dob'), '%Y-%m-%d')
                address = request.form.get('address')
                
                new_voter = Voter(
                    voter_id=voter_id,
                    name=name,
                    email=email,
                    date_of_birth=dob,
                    address=address,
                    is_verified=True,
                    added_by=current_user.name
                )
                db.session.add(new_voter)
                db.session.commit()
                flash('Voter added successfully!', 'success')
            
            elif action == 'delete':
                voter_id = request.form.get('voter_id')
                voter = Voter.query.filter_by(voter_id=voter_id).first()
                if voter:
                    db.session.delete(voter)
                    db.session.commit()
                    flash('Voter deleted successfully!', 'success')
        
        voters = Voter.query.all()
        return render_template('admin/manage_voters.html', voters=voters)
    
    @app.route('/admin/manage_candidates', methods=['GET', 'POST'])
    @admin_required
    def manage_candidates():
        if request.method == 'POST':
            action = request.form.get('action')
            print(f"Action received: {action}")  # Debug print
            
            if action == 'add':
                candidate_id = request.form.get('candidate_id')
                name = request.form.get('name')
                party_name = request.form.get('party_name')
                party_symbol = request.form.get('party_symbol')
                candidate_photo = request.form.get('candidate_photo')
                manifesto = request.form.get('manifesto')
                
                # Check if candidate with same ID already exists
                existing_candidate = Candidate.query.filter_by(candidate_id=candidate_id).first()
                if existing_candidate:
                    flash(f'Candidate with ID "{candidate_id}" already exists! Please use a different ID.', 'error')
                    return redirect(url_for('manage_candidates'))
                
                # Trim whitespace from inputs
                name = name.strip() if name else ''
                party_name = party_name.strip() if party_name else ''
                
                new_candidate = Candidate(
                    candidate_id=candidate_id.strip(),
                    name=name,
                    party_name=party_name,
                    party_symbol=party_symbol.strip() if party_symbol else None,
                    candidate_photo=candidate_photo.strip() if candidate_photo else None,
                    manifesto=manifesto.strip() if manifesto else '',
                    is_active=True
                )
                db.session.add(new_candidate)
                try:
                    db.session.commit()
                    flash(f'Candidate "{name}" added successfully!', 'success')
                except Exception as e:
                    db.session.rollback()
                    flash(f'Error adding candidate: {str(e)}', 'error')
            
            elif action == 'edit':
                old_candidate_id = request.form.get('old_candidate_id')
                new_candidate_id = request.form.get('candidate_id')
                name = request.form.get('name')
                party_name = request.form.get('party_name')
                party_symbol = request.form.get('party_symbol')
                candidate_photo = request.form.get('candidate_photo')
                manifesto = request.form.get('manifesto')
                
                candidate = Candidate.query.filter_by(candidate_id=old_candidate_id).first()
                if candidate:
                    # If candidate ID is being changed, check if new ID is unique
                    if old_candidate_id != new_candidate_id:
                        existing = Candidate.query.filter_by(candidate_id=new_candidate_id).first()
                        if existing:
                            flash(f'Candidate with ID "{new_candidate_id}" already exists! Cannot change ID.', 'error')
                            return redirect(url_for('manage_candidates'))
                    
                    candidate.candidate_id = new_candidate_id.strip()
                    candidate.name = name.strip() if name else ''
                    candidate.party_name = party_name.strip() if party_name else ''
                    candidate.party_symbol = party_symbol.strip() if party_symbol else None
                    candidate.candidate_photo = candidate_photo.strip() if candidate_photo else None
                    candidate.manifesto = manifesto.strip() if manifesto else ''
                    
                    try:
                        db.session.commit()
                        flash(f'Candidate "{name}" updated successfully!', 'success')
                    except Exception as e:
                        db.session.rollback()
                        flash(f'Error updating candidate: {str(e)}', 'error')
                else:
                    flash('Candidate not found!', 'error')
            
            elif action == 'delete':
                candidate_id = request.form.get('candidate_id')
                print(f"Attempting to delete candidate with ID: {candidate_id}")  # Debug print
                
                candidate = Candidate.query.filter_by(candidate_id=candidate_id).first()
                if candidate:
                    # Check if candidate has any votes
                    vote_count = Vote.query.filter_by(candidate_id=candidate_id).count()
                    print(f"Vote count for candidate: {vote_count}")  # Debug print
                    
                    if vote_count > 0:
                        flash(f'Cannot delete "{candidate.name}" because they have {vote_count} vote(s). Deactivate instead.', 'error')
                        return redirect(url_for('manage_candidates'))
                    
                    candidate_name = candidate.name
                    try:
                        # Delete the candidate
                        db.session.delete(candidate)
                        db.session.commit()
                        print(f"Candidate {candidate_name} deleted successfully")  # Debug print
                        flash(f'Candidate "{candidate_name}" deleted successfully!', 'success')
                    except Exception as e:
                        db.session.rollback()
                        print(f"Error deleting candidate: {str(e)}")  # Debug print
                        flash(f'Error deleting candidate: {str(e)}', 'error')
                else:
                    print(f"Candidate with ID {candidate_id} not found")  # Debug print
                    flash('Candidate not found!', 'error')
            
            elif action == 'toggle':
                candidate_id = request.form.get('candidate_id')
                candidate = Candidate.query.filter_by(candidate_id=candidate_id).first()
                if candidate:
                    candidate.is_active = not candidate.is_active
                    status = 'activated' if candidate.is_active else 'deactivated'
                    try:
                        db.session.commit()
                        flash(f'Candidate "{candidate.name}" {status} successfully!', 'success')
                    except Exception as e:
                        db.session.rollback()
                        flash(f'Error updating candidate status: {str(e)}', 'error')
                else:
                    flash('Candidate not found!', 'error')
            
            return redirect(url_for('manage_candidates'))
        
        # GET request - display candidates
        candidates = Candidate.query.order_by(Candidate.added_at.desc()).all()
        votes = Vote.query.all()
        return render_template('admin/manage_candidates.html', candidates=candidates, votes=votes)
    
    @app.route('/admin/vote_receipts')
    @admin_required
    def vote_receipts():
        receipts = VoteReceipt.query.order_by(VoteReceipt.timestamp.desc()).all()
        candidates = Candidate.query.all()
        return render_template('admin/vote_receipts.html', receipts=receipts, candidates=candidates)
    
    @app.route('/admin/export_receipts')
    @admin_required
    def export_receipts():
        # Get receipts from database
        receipts = VoteReceipt.query.order_by(VoteReceipt.timestamp.desc()).all()
        
        # Check export format
        export_format = request.args.get('format', 'pdf')
        
        if export_format == 'csv':
            return export_receipts_csv(receipts)
        else:
            return export_receipts_pdf(receipts)
    
    def export_receipts_pdf(receipts):
        buffer = io.BytesIO()
        
        # Create PDF document
        doc = SimpleDocTemplate(buffer, pagesize=landscape(letter))
        elements = []
        
        # Styles
        styles = getSampleStyleSheet()
        title_style = ParagraphStyle(
            'CustomTitle',
            parent=styles['Heading1'],
            fontSize=16,
            spaceAfter=30,
            alignment=1  # Center alignment
        )
        
        # Title
        title = Paragraph(f"Vote Receipts Report - {datetime.now().strftime('%Y-%m-%d %H:%M')}", title_style)
        elements.append(title)
        elements.append(Spacer(1, 20))
        
        # Summary stats
        total_receipts = len(receipts)
        valid_receipts = sum(1 for r in receipts if r.status == 'VALID')
        invalid_receipts = sum(1 for r in receipts if r.status == 'INVALID')
        pending_receipts = sum(1 for r in receipts if r.status == 'PENDING')
        
        summary_style = ParagraphStyle(
            'Summary',
            parent=styles['Normal'],
            fontSize=10,
            spaceAfter=10
        )
        
        summary_text = f"Total Receipts: {total_receipts} | Valid: {valid_receipts} | Invalid: {invalid_receipts} | Pending: {pending_receipts}"
        summary = Paragraph(summary_text, summary_style)
        elements.append(summary)
        elements.append(Spacer(1, 20))
        
        # Table data
        data = [['Receipt No.', 'Voter Name', 'Voter ID', 'Candidate', 'Party', 'Timestamp', 'Location', 'Status']]
        
        for receipt in receipts:
            # Truncate location if too long
            location = receipt.location[:30] + '...' if len(receipt.location) > 30 else receipt.location
            
            data.append([
                receipt.receipt_number,
                receipt.voter_name,
                receipt.voter_id,
                receipt.candidate_name,
                receipt.candidate_party,
                receipt.timestamp.strftime('%Y-%m-%d %H:%M'),
                location,
                receipt.status
            ])
        
        # Create table
        table = Table(data)
        table.setStyle(TableStyle([
            ('BACKGROUND', (0, 0), (-1, 0), colors.grey),
            ('TEXTCOLOR', (0, 0), (-1, 0), colors.whitesmoke),
            ('ALIGN', (0, 0), (-1, -1), 'CENTER'),
            ('FONTNAME', (0, 0), (-1, 0), 'Helvetica-Bold'),
            ('FONTSIZE', (0, 0), (-1, 0), 10),
            ('BOTTOMPADDING', (0, 0), (-1, 0), 12),
            ('BACKGROUND', (0, 1), (-1, -1), colors.beige),
            ('GRID', (0, 0), (-1, -1), 1, colors.black),
            ('FONTNAME', (0, 1), (-1, -1), 'Helvetica'),
            ('FONTSIZE', (0, 1), (-1, -1), 8),
        ]))
        
        elements.append(table)
        
        # Add footer with generation info
        elements.append(Spacer(1, 20))
        footer_style = ParagraphStyle(
            'Footer',
            parent=styles['Normal'],
            fontSize=8,
            textColor=colors.grey,
            alignment=1
        )
        footer = Paragraph(f"Generated by Admin on {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}", footer_style)
        elements.append(footer)
        
        # Build PDF
        doc.build(elements)
        
        # Get PDF from buffer
        pdf = buffer.getvalue()
        buffer.close()
        
        # Create response
        response = make_response(pdf)
        response.headers['Content-Type'] = 'application/pdf'
        response.headers['Content-Disposition'] = f'attachment; filename=vote_receipts_{datetime.now().strftime("%Y%m%d_%H%M%S")}.pdf'
        
        return response
    
    def export_receipts_csv(receipts):
        # Create CSV in memory
        output = io.StringIO()
        writer = csv.writer(output)
        
        # Write header
        writer.writerow(['Receipt Number', 'Voter Name', 'Voter ID', 'Candidate', 'Party', 'Timestamp', 'Location', 'Status'])
        
        # Write data
        for receipt in receipts:
            writer.writerow([
                receipt.receipt_number,
                receipt.voter_name,
                receipt.voter_id,
                receipt.candidate_name,
                receipt.candidate_party,
                receipt.timestamp.strftime('%Y-%m-%d %H:%M:%S'),
                receipt.location,
                receipt.status
            ])
        
        # Get CSV from buffer
        csv_data = output.getvalue()
        output.close()
        
        # Create response
        response = make_response(csv_data)
        response.headers['Content-Type'] = 'text/csv'
        response.headers['Content-Disposition'] = f'attachment; filename=vote_receipts_{datetime.now().strftime("%Y%m%d_%H%M%S")}.csv'
        
        return response
    
    @app.route('/admin/validate_receipt/<receipt_number>', methods=['POST'])
    @admin_required
    def validate_receipt(receipt_number):
        receipt = VoteReceipt.query.filter_by(receipt_number=receipt_number).first()
        if receipt:
            data = request.json
            new_status = data.get('status', 'VALID')
            receipt.status = new_status
            db.session.commit()
            return jsonify({'success': True, 'message': f'Receipt marked as {new_status}'})
        return jsonify({'success': False, 'message': 'Receipt not found'}), 404
    
    @app.route('/admin/print_receipt/<receipt_number>')
    @admin_required
    def print_receipt(receipt_number):
        receipt = VoteReceipt.query.filter_by(receipt_number=receipt_number).first()
        if not receipt:
            flash('Receipt not found!', 'error')
            return redirect(url_for('vote_receipts'))
        
        # Create PDF for single receipt
        buffer = io.BytesIO()
        doc = SimpleDocTemplate(buffer, pagesize=letter)
        elements = []
        
        styles = getSampleStyleSheet()
        
        # Title
        title = Paragraph(f"Vote Receipt - {receipt.receipt_number}", styles['Title'])
        elements.append(title)
        elements.append(Spacer(1, 20))
        
        # Receipt details
        data = [
            ['Receipt Number:', receipt.receipt_number],
            ['Voter Name:', receipt.voter_name],
            ['Voter ID:', receipt.voter_id],
            ['Candidate:', receipt.candidate_name],
            ['Party:', receipt.candidate_party],
            ['Timestamp:', receipt.timestamp.strftime('%Y-%m-%d %H:%M:%S')],
            ['Location:', receipt.location],
            ['Status:', receipt.status]
        ]
        
        table = Table(data)
        table.setStyle(TableStyle([
            ('GRID', (0, 0), (-1, -1), 1, colors.black),
            ('BACKGROUND', (0, 0), (0, -1), colors.lightgrey),
            ('FONTNAME', (0, 0), (0, -1), 'Helvetica-Bold'),
            ('ALIGN', (0, 0), (-1, -1), 'LEFT'),
            ('PADDING', (0, 0), (-1, -1), 6),
        ]))
        
        elements.append(table)
        
        # QR Code placeholder (you can generate actual QR code here)
        elements.append(Spacer(1, 30))
        qr_note = Paragraph("Verification QR Code would appear here", styles['Normal'])
        elements.append(qr_note)
        
        doc.build(elements)
        
        pdf = buffer.getvalue()
        buffer.close()
        
        response = make_response(pdf)
        response.headers['Content-Type'] = 'application/pdf'
        response.headers['Content-Disposition'] = f'attachment; filename=receipt_{receipt_number}.pdf'
        
        return response
    
    @app.route('/admin/audit_votes', methods=['POST'])
    @admin_required
    def audit_votes():
        # Perform vote audit
        total_votes = Vote.query.count()
        total_voters = Voter.query.count()
        voted_voters = Voter.query.filter_by(has_voted=True).count()
        
        # Check for anomalies
        anomalies = []
        
        # Check if any voter has multiple votes
        voters_with_multiple = db.session.query(Vote.voter_id, db.func.count(Vote.voter_id)).group_by(Vote.voter_id).having(db.func.count(Vote.voter_id) > 1).all()
        if voters_with_multiple:
            anomalies.append(f"Found {len(voters_with_multiple)} voters with multiple votes")
        
        # Check for votes without receipts
        votes_without_receipt = Vote.query.filter(~Vote.receipt_number.in_(db.session.query(VoteReceipt.receipt_number))).count()
        if votes_without_receipt:
            anomalies.append(f"Found {votes_without_receipt} votes without receipts")
        
        # Check for receipts without votes
        receipts_without_vote = VoteReceipt.query.filter(~VoteReceipt.receipt_number.in_(db.session.query(Vote.receipt_number))).count()
        if receipts_without_vote:
            anomalies.append(f"Found {receipts_without_vote} receipts without corresponding votes")
        
        audit_result = {
            'timestamp': datetime.now().strftime('%Y-%m-%d %H:%M:%S'),
            'total_votes': total_votes,
            'total_voters': total_voters,
            'voted_voters': voted_voters,
            'voter_turnout': f"{(voted_voters/total_voters*100):.2f}%" if total_voters > 0 else '0%',
            'anomalies_found': len(anomalies) > 0,
            'anomalies': anomalies,
            'status': 'PASSED' if not anomalies else 'ISSUES_FOUND'
        }
        
        return jsonify(audit_result)
    
    # API endpoints for real-time updates
    @app.route('/api/recent_votes')
    def recent_votes():
        votes = Vote.query.order_by(Vote.timestamp.desc()).limit(10).all()
        data = []
        for vote in votes:
            candidate = Candidate.query.filter_by(candidate_id=vote.candidate_id).first()
            voter = Voter.query.filter_by(voter_id=vote.voter_id).first()
            data.append({
                'voter': voter.name if voter else 'Unknown',
                'candidate': candidate.name if candidate else 'Unknown',
                'time': vote.timestamp.strftime('%Y-%m-%d %H:%M:%S'),
                'location': vote.location
            })
        return jsonify(data)
    
    return app


if __name__ == '__main__':
    app = create_app()
    with app.app_context():
        db.create_all()
        
        # Create admin user if not exists
        admin = User.query.filter_by(is_admin=True).first()
        if not admin:
            admin = User(
                name='Admin',
                email='admin@votingsystem.com',
                password=generate_password_hash('admin123'),
                is_admin=True
            )
            db.session.add(admin)
            db.session.commit()
            print("Admin user created - Email: admin@votingsystem.com, Password: admin123")
    
    app.run(debug=True, host='0.0.0.0', port=5000)