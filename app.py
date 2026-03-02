import os
import tomllib
from flask import (
    Flask,
    request,
    redirect,
    url_for,
    session,
    jsonify,
    send_from_directory,
)
from flask_cors import CORS
from flask_session import Session
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

# Ensure static folder exists to avoid path errors
if not os.path.exists(app.static_folder or "dist"):
    os.makedirs(app.static_folder or "dist", exist_ok=True)

app.secret_key = config.get(
    "secret_key", os.environ.get("SECRET_KEY", "dev-key-for-poc")
)

# Session configuration for production stability
redis_url = os.environ.get("REDIS_URL")

session_config = {
    "SESSION_PERMANENT": False,
    "SESSION_USE_SIGNER": True,
    "SESSION_COOKIE_SAMESITE": os.environ.get("SESSION_COOKIE_SAMESITE", "Lax"),
    "SESSION_COOKIE_SECURE": os.environ.get("SESSION_COOKIE_SECURE", "true").lower()
    == "true",
    "SESSION_COOKIE_HTTPONLY": True,
}

if redis_url:
    session_config.update(
        {
            "SESSION_TYPE": "redis",
            "SESSION_REDIS": redis_url,
            "SESSION_KEY_PREFIX": "ihmsctf:",
        }
    )
else:
    session_config.update(
        {
            "SESSION_TYPE": "filesystem",
            "SESSION_FILE_DIR": os.environ.get(
                "SESSION_FILE_DIR", "/tmp/ihmsctf_sessions"
            ),
        }
    )

app.config.update(session_config)
Session(app)

# Configuration
CTFD_HOST = config.get("host", os.environ.get("CTFD_HOST", "https://demo.ctfd.io"))
DEBUG = config.get("debug", True)
PORT = config.get("port", 5000)

if os.environ.get("FLASK_ENV") == "production":
    DEBUG = False


def get_ctf_client():
    cookies = session.get("ctf_cookies")
    if not cookies:
        return None
    client = CTFdClient(CTFD_HOST)
    client.set_cookies(cookies)
    return client


# --- API ENDPOINTS ---


@app.route("/api/user")
def api_user():
    client = get_ctf_client()
    if not client:
        return jsonify({"logged_in": False}), 401
    user_data = client.get_user()
    if not user_data:
        session.pop("ctf_cookies", None)
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
        session["ctf_cookies"] = client.get_cookies()
        user_data = client.get_user()
        session["ctf_cookies"] = client.get_cookies()
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
        return jsonify(
            {
                "success": False,
                "data": {"status": "error", "message": "Submission failed"},
            }
        ), 500


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
    session.pop("ctf_cookies", None)
    return jsonify({"success": True})


# --- SPA SERVING ---


@app.route("/", defaults={"path": ""})
@app.route("/<path:path>")
def serve(path):
    static_folder = app.static_folder or "dist"
    if path != "" and os.path.exists(os.path.join(static_folder, path)):
        return send_from_directory(static_folder, path)
    else:
        return send_from_directory(static_folder, "index.html")


if __name__ == "__main__":
    app.run(debug=DEBUG, host="0.0.0.0", port=PORT)
