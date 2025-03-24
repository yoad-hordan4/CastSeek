import unittest
from unittest.mock import patch, mock_open
import json
import requests
import castseek_api


class TestCastSeekAPI(unittest.TestCase):

    @patch("castseek_api.requests.get")
    def test_get_access_token_success(self, mock_get):
        print("test_1")
        """Test successful retrieval of an access token"""
        mock_get.return_value.status_code = 200
        mock_get.return_value.json.return_value = {"access_token": "mock_token"}
        
        token = castseek_api.get_access_token()
        self.assertEqual(token, "mock_token")

    @patch("castseek_api.requests.get")
    def test_get_access_token_failure(self, mock_get):
        """Test failure in retrieving an access token"""
        mock_get.side_effect = requests.exceptions.RequestException("Request failed")

        token = castseek_api.get_access_token()
        self.assertIsNone(token)

    @patch("builtins.open", new_callable=mock_open, read_data=json.dumps([{"podcast_name": "Podcast 1"}]))
    def test_load_podcasts_success(self, mock_file):
        """Test successful loading of podcasts from file"""
        podcasts = castseek_api.load_podcasts()
        self.assertEqual(podcasts, [{"podcast_name": "Podcast 1"}])

    @patch("builtins.open", side_effect=FileNotFoundError)
    def test_load_podcasts_file_not_found(self, mock_file):
        """Test handling of missing podcast file"""
        podcasts = castseek_api.load_podcasts()
        self.assertEqual(podcasts, [])

    def test_extract_podcast_names(self):
        """Test extraction of podcast names from data"""
        podcasts = [{"podcast_name": "Podcast A"}, {"podcast_name": "Podcast B"}]
        result = castseek_api.extract_podcast_names(podcasts, limit=1)
        self.assertEqual(result, ["Podcast A"])

    @patch("castseek_api.get_recommendations", return_value=["Rec 1", "Rec 2"])
    def test_get_combined_recommendations(self, mock_get_recommendations):
        """Test getting combined recommendations"""
        podcast_names = ["Podcast X"]
        recommendations = castseek_api.get_combined_recommendations(podcast_names, limit=3)
        self.assertIn("Rec 1", recommendations)
        self.assertIn("Rec 2", recommendations)

    @patch("castseek_api.webbrowser.open")
    def test_open_login_page(self, mock_web_open):
        """Test opening the login page in a browser"""
        castseek_api.open_login_page()
        mock_web_open.assert_called_with("http://localhost:3000/login")

    def test_load_podcasts_success(self):
        """Test loading podcasts with actual file"""
        podcasts = castseek_api.load_podcasts()
        self.assertGreater(len(podcasts), 0)  # Check if data is not empty


if __name__ == "__main__":
    unittest.main()
