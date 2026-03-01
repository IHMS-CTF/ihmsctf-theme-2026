import requests
import re
from urllib.parse import urljoin
import logging

class CTFdClient:
    def __init__(self, host):
        self.host = host
        self.api = urljoin(self.host, "api/v1/")
        self.session = requests.Session()
        # Common headers to look more like a browser
        self.session.headers.update({
            "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/143.0.0.0 Safari/537.36",
            "Accept": "application/json",
        })

    def _get_csrf(self):
        """Fetch CSRF token from CTFd."""
        try:
            response = self.session.get(urljoin(self.host, "login"))
            response.raise_for_status()
            # CTFd often puts the CSRF nonce in the HTML
            match = re.search(r"'csrfNonce': \"([0-9a-f]{64})\"", response.text)
            if match:
                return match.group(1)
            # Fallback if it's in a different format
            match = re.search(r'name="nonce" value="([0-9a-f]{64})"', response.text)
            if match:
                return match.group(1)
        except Exception as e:
            logging.error(f"Error fetching CSRF: {e}")
        return None

    def login(self, username, password):
        """Log in to CTFd."""
        nonce = self._get_csrf()
        if not nonce:
            return False, "Could not find CSRF token"

        url = urljoin(self.host, "login")
        payload = {
            "name": username,
            "password": password,
            "nonce": nonce,
            "_submit": "Submit"
        }

        try:
            response = self.session.post(url, data=payload)
            # CTFd redirects on successful login
            if response.status_code == 200 and "challenges" in response.url:
                # Update session with new CSRF token for API calls
                self._update_api_csrf()
                return True, "Login successful"
        except Exception as e:
            logging.error(f"Login error: {e}")
        
        return False, "Login failed"

    def _update_api_csrf(self):
        """Update the session header with the latest CSRF token."""
        try:
            response = self.session.get(urljoin(self.host, "challenges"))
            match = re.search(r"'csrfNonce': \"([0-9a-f]{64})\"", response.text)
            if match:
                self.session.headers.update({"Csrf-Token": match.group(1)})
        except Exception as e:
            logging.error(f"Error updating API CSRF: {e}")

    def _safe_get_json(self, endpoint):
        """Safely fetch and parse JSON from an endpoint."""
        try:
            url = urljoin(self.api, endpoint)
            response = self.session.get(url)
            if response.status_code == 200:
                return response.json()
            else:
                logging.warning(f"Endpoint {endpoint} returned status {response.status_code}")
        except requests.exceptions.JSONDecodeError:
            logging.error(f"Failed to decode JSON from {endpoint}")
        except Exception as e:
            logging.error(f"Error fetching {endpoint}: {e}")
        return None

    def get_challenges(self):
        """Fetch challenges from the API."""
        data = self._safe_get_json("challenges")
        return data.get("data", []) if data else None

    def get_challenge(self, challenge_id):
        """Fetch details for a specific challenge."""
        data = self._safe_get_json(f"challenges/{challenge_id}")
        if data:
            challenge = data.get("data")
            if challenge and "files" in challenge:
                challenge["files"] = [urljoin(self.host, f) for f in challenge["files"]]
            return challenge
        return None

    def get_scoreboard(self):
        """Fetch the public scoreboard."""
        data = self._safe_get_json("scoreboard")
        return data.get("data", []) if data else None

    def get_scoreboard_top(self, count=15):
        """Fetch the top scoreboard data for line charts."""
        data = self._safe_get_json(f"scoreboard/top/{count}")
        if data and data.get("success"):
            return data.get("data", {})
        return {}

    def get_users(self):
        """Fetch all users."""
        data = self._safe_get_json("users")
        return data.get("data", []) if data else []

    def get_teams(self):
        """Fetch all teams."""
        data = self._safe_get_json("teams")
        return data.get("data", []) if data else []

    def get_team(self, team_id):
        """Fetch a specific team profile."""
        data = self._safe_get_json(f"teams/{team_id}")
        return data.get("data") if data else None

    def get_config(self):
        """Fetch public configuration."""
        # Note: api/v1/configs is often admin-only.
        # We try to get it, but return empty dict if it fails.
        data = self._safe_get_json("configs")
        return data.get("data", {}) if data else {}
    
    def get_user(self, user_id="me"):
        """Fetch current user profile."""
        data = self._safe_get_json(f"users/{user_id}")
        return data.get("data") if data else None

    def submit_flag(self, challenge_id, flag):
        """Submit a flag for a challenge."""
        url = urljoin(self.api, "challenges/attempt")
        payload = {
            "challenge_id": challenge_id,
            "submission": flag
        }
        try:
            # We need to ensure the Csrf-Token header is set correctly
            # It should have been set during login or _update_api_csrf
            response = self.session.post(url, json=payload)
            if response.status_code == 200:
                return response.json()
            else:
                logging.warning(f"Flag submission returned status {response.status_code}")
                return response.json() if response.status_code == 400 else None
        except Exception as e:
            logging.error(f"Error submitting flag: {e}")
        return None

    def get_solves(self, challenge_id):
        """Fetch solves for a specific challenge."""
        data = self._safe_get_json(f"challenges/{challenge_id}/solves")
        return data.get("data", []) if data else []
