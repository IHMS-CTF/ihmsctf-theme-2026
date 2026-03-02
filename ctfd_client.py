import requests
from urllib.parse import urljoin
import logging


class CTFdClient:
    def __init__(self, host):
        self.host = host
        self.api = urljoin(self.host, "api/v1/")
        self.session = requests.Session()
        # Comprehensive browser-like headers (matching MCP client)
        self.session.headers.update(
            {
                "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/143.0.0.0 Safari/537.36 OPR/127.0.0.0 (Edition ms_store_gx)",
                "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8,application/signed-exchange;v=b3;q=0.7",
                "Accept-Language": "en-US,en;q=0.9",
                "Cache-Control": "max-age=0",
                "Priority": "u=0, i",
                "Sec-Ch-Ua": '"Opera GX";v="127", "Chromium";v="143", "Not A(Brand";v="24"',
                "Sec-Ch-Ua-Mobile": "?0",
                "Sec-Ch-Ua-Platform": '"Windows"',
                "Sec-Fetch-Dest": "document",
                "Sec-Fetch-Mode": "navigate",
                "Sec-Fetch-Site": "none",
                "Sec-Fetch-User": "?1",
                "Upgrade-Insecure-Requests": "1",
            }
        )

    def get_cookies(self):
        """Return current session cookies as a dict."""
        return self.session.cookies.get_dict()

    def set_cookies(self, cookies):
        """Restore session cookies from a dict."""
        if cookies:
            self.session.cookies.update(cookies)
            # After restoring cookies, fetch CSRF token for API calls
            logging.info(f"Restored cookies: {list(cookies.keys())}")
            self._get_csrf()

    def _get_csrf(self):
        """Fetch CSRF token from CTFd API."""
        try:
            response = self.session.get(urljoin(self.api, "csrf_token"))
            response.raise_for_status()
            data = response.json()
            # The API returns {'csrf_token': '...'} directly
            if "csrf_token" in data:
                csrf_token = data["csrf_token"]
                # Set it in headers for API calls
                self.session.headers.update({"Csrf-Token": csrf_token})
                logging.info(f"Updated CSRF token: {csrf_token[:16]}...")
                return csrf_token
            else:
                logging.warning(f"CSRF API returned unexpected response: {data}")
        except Exception as e:
            logging.error(f"Error fetching CSRF: {e}")
        return None

    def login(self, username, password):
        """Log in to CTFd using API."""
        # Get initial CSRF token
        nonce = self._get_csrf()
        if not nonce:
            return False, "Could not get CSRF token"

        # Use the API login endpoint
        url = urljoin(self.host, "login")
        payload = {
            "name": username,
            "password": password,
        }

        try:
            response = self.session.post(url, json=payload)
            response.raise_for_status()
            data = response.json()

            if data.get("success"):
                # Refresh CSRF token after successful login
                self._get_csrf()
                logging.info(f"Login successful for user: {username}")
                return True, "Login successful"
            else:
                message = (
                    data.get("errors", ["Login failed"])[0]
                    if "errors" in data
                    else "Login failed"
                )
                logging.warning(f"Login failed for {username}: {message}")
                return False, message
        except Exception as e:
            logging.error(f"Login error: {e}")
            return False, f"Login failed: {str(e)}"

    def _update_api_csrf(self):
        """Update the session header with the latest CSRF token."""
        self._get_csrf()

    def _safe_get_json(self, endpoint):
        """Safely fetch and parse JSON from an endpoint."""
        response = None
        try:
            url = urljoin(self.api, endpoint)
            response = self.session.get(url)
            if response.status_code == 200:
                return response.json()
            else:
                logging.warning(
                    f"Endpoint {endpoint} returned status {response.status_code}: {response.text[:200]}"
                )
        except requests.exceptions.JSONDecodeError:
            logging.error(
                f"Failed to decode JSON from {endpoint}. Response text: {response.text[:500] if response else 'No response'}"
            )
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
        payload = {"challenge_id": challenge_id, "submission": flag}
        try:
            # We need to ensure the Csrf-Token header is set correctly
            # It should have been set during login or _update_api_csrf
            response = self.session.post(url, json=payload)
            if response.status_code == 200:
                return response.json()
            else:
                logging.warning(
                    f"Flag submission returned status {response.status_code}"
                )
                return response.json() if response.status_code == 400 else None
        except Exception as e:
            logging.error(f"Error submitting flag: {e}")
        return None

    def get_solves(self, challenge_id):
        """Fetch solves for a specific challenge."""
        data = self._safe_get_json(f"challenges/{challenge_id}/solves")
        return data.get("data", []) if data else []
