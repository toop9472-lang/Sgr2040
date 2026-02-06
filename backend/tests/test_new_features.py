"""
Test New Features - Saqr App (Iteration 8)
- Remember Me functionality (frontend)
- Draggable Timer in Ads Viewer (frontend)
- Navigation Blocking before 30 seconds (frontend)
- Points System API (backend)
- Login/Logout (backend)
"""
import pytest
import requests
import os
import uuid

BASE_URL = os.environ.get('REACT_APP_BACKEND_URL', '').rstrip('/')

# ============ AUTH TESTS ============

class TestLogin:
    """Test login functionality"""
    
    def test_viewer_login_success(self):
        """Test login with viewer credentials"""
        response = requests.post(f"{BASE_URL}/api/auth/signin", json={
            "email": "viewer@test.com",
            "password": "viewer123"
        })
        
        assert response.status_code == 200, f"Expected 200, got {response.status_code}: {response.text}"
        
        data = response.json()
        assert "token" in data, "Response should contain token"
        assert data["role"] == "user", f"Expected role 'user', got '{data.get('role')}'"
        assert data["user"]["email"] == "viewer@test.com"
        print(f"✅ Viewer login successful - name: {data['user']['name']}")
        return data["token"]
    
    def test_admin_login_success(self):
        """Test login with admin credentials"""
        response = requests.post(f"{BASE_URL}/api/auth/signin", json={
            "email": "sky-321@hotmail.com",
            "password": "Wsxzaq123"
        })
        
        assert response.status_code == 200, f"Expected 200, got {response.status_code}: {response.text}"
        
        data = response.json()
        assert "token" in data, "Response should contain token"
        assert data["role"] == "admin", f"Expected role 'admin', got '{data.get('role')}'"
        print(f"✅ Admin login successful")
        return data["token"]
    
    def test_login_invalid_password(self):
        """Test login with wrong password returns 401"""
        response = requests.post(f"{BASE_URL}/api/auth/signin", json={
            "email": "viewer@test.com",
            "password": "wrongpassword"
        })
        
        assert response.status_code == 401, f"Expected 401, got {response.status_code}"
        print("✅ Invalid password correctly returns 401")


class TestLogout:
    """Test logout functionality"""
    
    def test_logout_endpoint(self):
        """Test logout endpoint returns success"""
        response = requests.post(f"{BASE_URL}/api/auth/logout")
        
        assert response.status_code == 200, f"Expected 200, got {response.status_code}"
        data = response.json()
        assert data.get("success") == True or "message" in data
        print("✅ Logout endpoint working")


# ============ REWARDED ADS TESTS ============

class TestRewardedAdsComplete:
    """Test POST /api/rewarded-ads/complete endpoint"""
    
    @pytest.fixture
    def auth_token(self):
        """Get auth token for viewer user"""
        response = requests.post(f"{BASE_URL}/api/auth/signin", json={
            "email": "viewer@test.com",
            "password": "viewer123"
        })
        if response.status_code == 200:
            return response.json()["token"]
        pytest.skip("Authentication failed")
    
    def test_complete_rewarded_ad_success(self, auth_token):
        """Test completing a rewarded ad gives points"""
        response = requests.post(
            f"{BASE_URL}/api/rewarded-ads/complete",
            headers={
                "Content-Type": "application/json",
                "Authorization": f"Bearer {auth_token}"
            },
            json={
                "ad_type": "video",
                "ad_id": f"test_ad_{uuid.uuid4().hex[:8]}",
                "completed": True,
                "watch_duration": 60  # 60 seconds = full watch
            }
        )
        
        assert response.status_code == 200, f"Expected 200, got {response.status_code}: {response.text}"
        
        data = response.json()
        assert data.get("success") == True, f"Expected success: True, got {data}"
        assert "points_earned" in data, "Response should contain points_earned"
        assert data["points_earned"] > 0, "Should earn at least 1 point"
        assert "total_points" in data, "Response should contain total_points"
        print(f"✅ Rewarded ad complete - earned {data['points_earned']} points, total: {data['total_points']}")
    
    def test_complete_ad_short_duration_fails(self, auth_token):
        """Test that short watch duration fails"""
        response = requests.post(
            f"{BASE_URL}/api/rewarded-ads/complete",
            headers={
                "Content-Type": "application/json",
                "Authorization": f"Bearer {auth_token}"
            },
            json={
                "ad_type": "video",
                "ad_id": f"test_short_{uuid.uuid4().hex[:8]}",
                "completed": True,
                "watch_duration": 10  # Only 10 seconds - too short
            }
        )
        
        assert response.status_code == 200, f"Expected 200, got {response.status_code}"
        data = response.json()
        assert data.get("success") == False, f"Expected success: False for short duration"
        print("✅ Short watch duration correctly rejected")
    
    def test_complete_ad_not_completed_fails(self, auth_token):
        """Test that incomplete ad view fails"""
        response = requests.post(
            f"{BASE_URL}/api/rewarded-ads/complete",
            headers={
                "Content-Type": "application/json",
                "Authorization": f"Bearer {auth_token}"
            },
            json={
                "ad_type": "video",
                "ad_id": f"test_incomplete_{uuid.uuid4().hex[:8]}",
                "completed": False,  # Not completed
                "watch_duration": 60
            }
        )
        
        assert response.status_code == 200
        data = response.json()
        assert data.get("success") == False, "Incomplete ad should not grant points"
        print("✅ Incomplete ad correctly rejected")


class TestRewardedAdsStats:
    """Test GET /api/rewarded-ads/stats endpoint"""
    
    @pytest.fixture
    def auth_token(self):
        """Get auth token for viewer user"""
        response = requests.post(f"{BASE_URL}/api/auth/signin", json={
            "email": "viewer@test.com",
            "password": "viewer123"
        })
        if response.status_code == 200:
            return response.json()["token"]
        pytest.skip("Authentication failed")
    
    def test_get_user_stats(self, auth_token):
        """Test getting user rewarded ad stats"""
        response = requests.get(
            f"{BASE_URL}/api/rewarded-ads/stats",
            headers={"Authorization": f"Bearer {auth_token}"}
        )
        
        assert response.status_code == 200, f"Expected 200, got {response.status_code}: {response.text}"
        
        data = response.json()
        # Check response structure
        assert "today" in data, "Response should contain 'today' stats"
        assert "all_time" in data, "Response should contain 'all_time' stats"
        assert "reward_per_ad" in data, "Response should contain 'reward_per_ad'"
        assert "cooldown_seconds" in data, "Response should contain 'cooldown_seconds'"
        
        # Check today stats structure
        assert "views" in data["today"]
        assert "points" in data["today"]
        assert "remaining" in data["today"]
        assert "limit" in data["today"]
        
        print(f"✅ Stats retrieved - today views: {data['today']['views']}, total points: {data['all_time']['points']}")


class TestRewardedAdsLeaderboard:
    """Test GET /api/rewarded-ads/leaderboard endpoint"""
    
    def test_get_leaderboard(self):
        """Test getting leaderboard (no auth required)"""
        response = requests.get(f"{BASE_URL}/api/rewarded-ads/leaderboard")
        
        assert response.status_code == 200, f"Expected 200, got {response.status_code}"
        
        data = response.json()
        assert "leaderboard" in data, "Response should contain leaderboard"
        assert "period" in data, "Response should contain period"
        assert data["period"] == "weekly", "Period should be 'weekly'"
        print(f"✅ Leaderboard retrieved - {len(data['leaderboard'])} entries")


# ============ ADS ENDPOINT TEST ============

class TestAdsEndpoint:
    """Test GET /api/ads endpoint"""
    
    def test_get_ads(self):
        """Test getting ads list"""
        response = requests.get(f"{BASE_URL}/api/ads")
        
        assert response.status_code == 200, f"Expected 200, got {response.status_code}"
        
        data = response.json()
        assert isinstance(data, list), "Response should be a list"
        assert len(data) >= 0, "Should return ads (or empty list)"
        
        if len(data) > 0:
            ad = data[0]
            assert "id" in ad or "title" in ad, "Ad should have id or title"
        
        print(f"✅ Ads endpoint working - {len(data)} ads found")


if __name__ == "__main__":
    pytest.main([__file__, "-v", "--tb=short"])
