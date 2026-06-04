🗳️ Online Voting System

A secure and user-friendly web-based voting platform developed using Python, Flask, SQLite, HTML, CSS, and JavaScript. The system enables voters to cast votes digitally while allowing administrators to manage elections, candidates, and results efficiently.

📌 Project Overview

The Online Voting System is designed to modernize the traditional voting process by providing a secure, transparent, and accessible platform for conducting elections online.

The application supports voter registration, authentication, candidate management, vote casting, and result generation. The system ensures that each voter can vote only once, maintaining election integrity and fairness.

✨ Features
👤 User Features
User Registration and Login
Secure Authentication System
View Available Elections
Browse Candidate Details
Cast Vote Online
One Vote per User Restriction
View Election Results
🛠️ Admin Features
Admin Dashboard
Manage Elections
Add/Edit/Delete Candidates
Monitor Voting Activity
View and Publish Results
Manage Registered Users
🔒 Security Features
Session-Based Authentication
Password Protection
Duplicate Vote Prevention
Role-Based Access Control
Secure Database Management
🏗️ System Architecture
User
 │
 ▼
Frontend (HTML, CSS, JavaScript)
 │
 ▼
Flask Application
 │
 ├── Authentication Module
 ├── Voting Module
 ├── Candidate Management
 ├── Result Processing
 │
 ▼
SQLite Database
💻 Technology Stack
Technology	Purpose
Python	Backend Development
Flask	Web Framework
SQLite	Database
HTML5	Structure
CSS3	Styling
JavaScript	Client-side Functionality
Bootstrap	Responsive Design
📂 Project Structure
Online-Voting-System/
│
├── app.py
├── config.py
├── database.py
├── models.py
├── requirements.txt
├── README.md
│
├── static/
│   ├── css/
│   ├── js/
│   └── images/
│
├── templates/
│   ├── admin/
│   ├── voter/
│   └── auth/
│
└── instance/
    └── voting_system.db
⚙️ Installation Guide
1️⃣ Clone Repository
git clone https://github.com/yourusername/Online-Voting-System.git
2️⃣ Move to Project Directory
cd Online-Voting-System
3️⃣ Create Virtual Environment
python -m venv venv
4️⃣ Activate Environment

Windows

venv\Scripts\activate

Linux / Mac

source venv/bin/activate
5️⃣ Install Dependencies
pip install -r requirements.txt
6️⃣ Run Application
python app.py
7️⃣ Open Browser
http://127.0.0.1:5000
📊 Database Modules
User Module
User Registration
Login Authentication
Vote Tracking
Candidate Module
Candidate Information
Election Participation
Election Module
Election Creation
Election Scheduling
Voting Module
Vote Recording
Vote Validation
📸 Screenshots
Home Page

Add screenshot here

Login Page

Add screenshot here

Admin Dashboard

Add screenshot here

Voting Page

Add screenshot here

Result Page

Add screenshot here

🎯 Future Enhancements
OTP Verification
Email Notifications
Biometric Authentication
Real-Time Result Dashboard
Blockchain-Based Voting
Multi-Election Support
Cloud Deployment
👩‍💻 Author

Tanishka Jain

BCA 

Passionate about Web Development, Software Engineering, AI, and Data Analytics.

GitHub: https://github.com/tanishka234

LinkedIn: https://www.linkedin.com/feed/

📄 License

This project is licensed under the MIT License.
