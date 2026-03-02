import os
import tomllib
import uuid
from flask import Flask, request, redirect, url_for, session, jsonify, send_from_directory
from flask_cors import CORS
from ctfd_client import CTFdClient

# Load configuration
CONFIG_PATH = os.environ.get("SETTINGS_PATH", "config/settings.toml")
try:
    with open(CONFIG_PATH, "rb") as f:
        config = tomllib.load(f)
except FileNotFoundError:
    config = {}

# Serve static files from the 'dist' folder in root
app = Flask(__name__, static_folder="dist", static_url_path="")
CORS(app, supports_credentials=True)
app.secret_key = config.get("secret_key", os.environ.get("SECRET_KEY", "dev-key-for-poc"))

# Configuration
CTFD_HOST = config.get("host", os.environ.get("CTFD_HOST", "https://demo.ctfd.io"))
DEBUG = config.get("debug", True)
PORT = config.get("port", 5000)

# Map to store CTFd sessions per Flask session
ctf_sessions = {}

def get_ctf_client():
    session_id = session.get("ctf_session_id")
    if not session_id or session_id not in ctf_sessions:
        return None
    return ctf_sessions[session_id]

# --- API ENDPOINTS ---

@app.route("/api/user")
def api_user():
    client = get_ctf_client()
    if not client:
        return jsonify({"logged_in": False}), 401
    user_data = client.get_user()
    if not user_data:
        session.pop("ctf_session_id", None)
        return jsonify({"logged_in": False}), 401
    return jsonify({"logged_in": True, "user": user_data})

@app.route("/api/login", methods=["POST"])
def api_login():
    data = request.json
    username = data.get("username")
    password = data.get("password")
    
    client = CTFdClient(CTFD_HOST)
    success, message = client.login(username, password)
    
    if success:
        session_id = str(uuid.uuid4())
        session["ctf_session_id"] = session_id
        ctf_sessions[session_id] = client
        user_data = client.get_user()
        return jsonify({"success": True, "user": user_data})
    else:
        return jsonify({"success": False, "message": message}), 401

@app.route("/api/challenges")
def api_challenges():
    client = get_ctf_client()
    if not client:
        return jsonify({"message": "Unauthorized"}), 401
    
    challenges_list = client.get_challenges()
    return jsonify(challenges_list if challenges_list is not None else [])

@app.route("/api/challenges/<int:challenge_id>")
def api_challenge_detail(challenge_id):
    client = get_ctf_client()
    if not client:
        return jsonify({"message": "Unauthorized"}), 401
    
    challenge = client.get_challenge(challenge_id)
    if not challenge:
        return jsonify({"message": "Challenge not found"}), 404
        
    return jsonify(challenge)

@app.route("/api/challenges/attempt", methods=["POST"])
def api_challenge_attempt():
    client = get_ctf_client()
    if not client:
        return jsonify({"message": "Unauthorized"}), 401
    
    data = request.json
    challenge_id = data.get("challenge_id")
    submission = data.get("submission")
    
    result = client.submit_flag(challenge_id, submission)
    if result:
        return jsonify(result)
    else:
        return jsonify({"success": False, "data": {"status": "error", "message": "Submission failed"}}), 500

@app.route("/api/scoreboard")
def api_scoreboard():
    client = get_ctf_client() or CTFdClient(CTFD_HOST)
    scoreboard = client.get_scoreboard()
    return jsonify(scoreboard if scoreboard is not None else [])

@app.route("/api/scoreboard/top")
def api_scoreboard_top():
    client = get_ctf_client() or CTFdClient(CTFD_HOST)
    top_data = client.get_scoreboard_top(count=15)
    return jsonify(top_data)

@app.route("/api/users")
def api_users():
    client = get_ctf_client() or CTFdClient(CTFD_HOST)
    users = client.get_users()
    return jsonify(users)

@app.route("/api/teams")
def api_teams():
    client = get_ctf_client() or CTFdClient(CTFD_HOST)
    teams = client.get_teams()
    return jsonify(teams)

@app.route("/api/teams/<int:team_id>")
def api_team_profile(team_id):
    client = get_ctf_client() or CTFdClient(CTFD_HOST)
    team = client.get_team(team_id)
    return jsonify(team)

@app.route("/api/config")
def api_config():
    client = CTFdClient(CTFD_HOST)
    config_data = client.get_config()
    return jsonify(config_data if config_data is not None else {})

@app.route("/api/logout", methods=["POST"])
def api_logout():
    session_id = session.pop("ctf_session_id", None)
    if session_id:
        ctf_sessions.pop(session_id, None)
    return jsonify({"success": True})

# --- SPA SERVING ---

@app.route('/', defaults={'path': ''})
@app.route('/<path:path>')
def serve(path):
    if path != "" and os.path.exists(os.path.join(app.static_folder, path)):
        return send_from_directory(app.static_folder, path)
    else:
        return send_from_directory(app.static_folder, "index.html")

if __name__ == "__main__":
    app.run(debug=DEBUG, host="0.0.0.0", port=PORT)
