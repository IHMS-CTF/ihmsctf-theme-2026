import os
import tomllib
import pickle
import base64
import hashlib
import hmac
from flask import Flask, request, session, jsonify, send_from_directory, make_response
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

# Ensure static folder exists
if not os.path.exists(app.static_folder or "dist"):
    os.makedirs(app.static_folder or "dist", exist_ok=True)

app.secret_key = config.get(
    "secret_key", os.environ.get("SECRET_KEY", "dev-key-change-in-prod")
)

# Session cookie config
app.config.update(
    SESSION_COOKIE_SAMESITE=os.environ.get("SESSION_COOKIE_SAMESITE", "Lax"),
    SESSION_COOKIE_SECURE=os.environ.get("SESSION_COOKIE_SECURE", "false").lower()
    == "true",
    SESSION_COOKIE_HTTPONLY=True,
    PERMANENT_SESSION_LIFETIME=86400,  # 24 hours
)

# Configuration
CTFD_HOST = config.get("host", os.environ.get("CTFD_HOST", "https://demo.ctfd.io"))
DEBUG = config.get("debug", os.environ.get("FLASK_ENV") != "production")


def get_ctf_client():
    """Reconstruct CTFd client from session cookies."""
    cookies = session.get("ctf_cookies")
    if not cookies:
        return None
    client = CTFdClient(CTFD_HOST)
    client.set_cookies(cookies)
    return client


def save_client_cookies(client):
    """Save CTFd client cookies to session."""
    session["ctf_cookies"] = client.get_cookies()
    session.modified = True


# --- API ENDPOINTS ---


@app.route("/api/user")
def api_user():
    client = get_ctf_client()
    if not client:
        return jsonify({"logged_in": False}), 200

    user_data = client.get_user()
    if not user_data:
        session.pop("ctf_cookies", None)
        return jsonify({"logged_in": False}), 200

    # Refresh cookies in case they changed
    save_client_cookies(client)
    return jsonify({"logged_in": True, "user": user_data})


@app.route("/api/login", methods=["POST"])
def api_login():
    data = request.json or {}
    username = data.get("username", "").strip()
    password = data.get("password", "")

    if not username or not password:
        return jsonify(
            {"success": False, "message": "Username and password required"}
        ), 400

    client = CTFdClient(CTFD_HOST)
    success, message = client.login(username, password)

    if success:
        save_client_cookies(client)
        user_data = client.get_user()
        save_client_cookies(client)  # Save again after user fetch
        return jsonify({"success": True, "user": user_data})
    else:
        return jsonify({"success": False, "message": message}), 401


@app.route("/api/logout", methods=["POST"])
def api_logout():
    session.clear()
    return jsonify({"success": True})


@app.route("/api/challenges")
def api_challenges():
    client = get_ctf_client()
    if not client:
        return jsonify({"message": "Unauthorized"}), 401

    challenges_list = client.get_challenges()
    save_client_cookies(client)
    return jsonify(challenges_list if challenges_list is not None else [])


@app.route("/api/challenges/<int:challenge_id>")
def api_challenge_detail(challenge_id):
    client = get_ctf_client()
    if not client:
        return jsonify({"message": "Unauthorized"}), 401

    challenge = client.get_challenge(challenge_id)
    save_client_cookies(client)

    if not challenge:
        return jsonify({"message": "Challenge not found"}), 404

    return jsonify(challenge)


@app.route("/api/challenges/attempt", methods=["POST"])
def api_challenge_attempt():
    client = get_ctf_client()
    if not client:
        return jsonify({"message": "Unauthorized"}), 401

    data = request.json or {}
    challenge_id = data.get("challenge_id")
    submission = data.get("submission", "").strip()

    if not challenge_id or not submission:
        return jsonify(
            {"success": False, "data": {"status": "error", "message": "Missing data"}}
        ), 400

    result = client.submit_flag(challenge_id, submission)
    save_client_cookies(client)

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
    # Scoreboard is public - use fresh client if not logged in
    client = get_ctf_client()
    if client:
        scoreboard = client.get_scoreboard()
        save_client_cookies(client)
    else:
        fresh_client = CTFdClient(CTFD_HOST)
        scoreboard = fresh_client.get_scoreboard()

    return jsonify(scoreboard if scoreboard is not None else [])


@app.route("/api/scoreboard/top")
def api_scoreboard_top():
    client = get_ctf_client()
    if client:
        top_data = client.get_scoreboard_top(count=10)
        save_client_cookies(client)
    else:
        fresh_client = CTFdClient(CTFD_HOST)
        top_data = fresh_client.get_scoreboard_top(count=10)

    return jsonify(top_data if top_data else {})


@app.route("/api/users")
def api_users():
    client = get_ctf_client()
    if client:
        users = client.get_users()
        save_client_cookies(client)
    else:
        fresh_client = CTFdClient(CTFD_HOST)
        users = fresh_client.get_users()

    return jsonify(users if users else [])


@app.route("/api/teams")
def api_teams():
    client = get_ctf_client()
    if client:
        teams = client.get_teams()
        save_client_cookies(client)
    else:
        fresh_client = CTFdClient(CTFD_HOST)
        teams = fresh_client.get_teams()

    return jsonify(teams if teams else [])


@app.route("/api/teams/<int:team_id>")
def api_team_profile(team_id):
    client = get_ctf_client()
    if client:
        team = client.get_team(team_id)
        save_client_cookies(client)
    else:
        fresh_client = CTFdClient(CTFD_HOST)
        team = fresh_client.get_team(team_id)

    return jsonify(team if team else {})


@app.route("/api/config")
def api_config():
    fresh_client = CTFdClient(CTFD_HOST)
    config_data = fresh_client.get_config()
    return jsonify(config_data if config_data else {})


# --- CONTAINER API ENDPOINTS ---


@app.route("/api/containers/request", methods=["POST"])
def api_container_request():
    """Request a new container or get existing one for a challenge."""
    client = get_ctf_client()
    if not client:
        return jsonify({"error": "Unauthorized"}), 401

    data = request.json or {}
    challenge_id = data.get("challenge_id")

    if not challenge_id:
        return jsonify({"error": "challenge_id is required"}), 400

    result = client.request_container(challenge_id)
    save_client_cookies(client)

    if result is None:
        return jsonify({"error": "Failed to request container"}), 500

    if "error" in result:
        return jsonify(result), 400

    return jsonify(result)


@app.route("/api/containers/info/<int:challenge_id>")
def api_container_info(challenge_id):
    """Get info about running container for a challenge."""
    client = get_ctf_client()
    if not client:
        return jsonify({"error": "Unauthorized"}), 401

    result = client.get_container_info(challenge_id)
    save_client_cookies(client)

    if result is None:
        return jsonify({"status": "not_found"})

    return jsonify(result)


@app.route("/api/containers/renew", methods=["POST"])
def api_container_renew():
    """Renew (extend) container expiration."""
    client = get_ctf_client()
    if not client:
        return jsonify({"error": "Unauthorized"}), 401

    data = request.json or {}
    challenge_id = data.get("challenge_id")

    if not challenge_id:
        return jsonify({"error": "challenge_id is required"}), 400

    result = client.renew_container(challenge_id)
    save_client_cookies(client)

    if result is None:
        return jsonify({"error": "Failed to renew container"}), 500

    if "error" in result:
        return jsonify(result), 400

    return jsonify(result)


@app.route("/api/containers/stop", methods=["POST"])
def api_container_stop():
    """Stop running container."""
    client = get_ctf_client()
    if not client:
        return jsonify({"error": "Unauthorized"}), 401

    data = request.json or {}
    challenge_id = data.get("challenge_id")

    if not challenge_id:
        return jsonify({"error": "challenge_id is required"}), 400

    result = client.stop_container(challenge_id)
    save_client_cookies(client)

    if result is None:
        return jsonify({"error": "Failed to stop container"}), 500

    if "error" in result:
        return jsonify(result), 400

    return jsonify(result)


# --- SPA SERVING ---


@app.route("/", defaults={"path": ""})
@app.route("/<path:path>")
def serve(path):
    static_folder = app.static_folder or "dist"
    if path and os.path.exists(os.path.join(static_folder, path)):
        return send_from_directory(static_folder, path)
    return send_from_directory(static_folder, "index.html")


if __name__ == "__main__":
    app.run(debug=DEBUG, host="0.0.0.0", port=int(os.environ.get("PORT", 5000)))
