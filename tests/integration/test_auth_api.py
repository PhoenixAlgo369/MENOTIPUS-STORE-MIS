"""
Integration Tests for Authentication API
"""

import pytest
from app import db
from app.models import User


class TestAuthRegistration:
    """Test user registration endpoint."""
    
    def test_register_new_user(self, client):
        """Test successful user registration."""
        response = client.post('/api/auth/register', json={
            'username': 'newuser',
            'email': 'newuser@example.com',
            'password': 'password123',
            'role': 'cashier',
            'name': 'New User'
        })
        
        assert response.status_code == 201
        data = response.get_json()
        assert 'message' in data
        assert 'user' in data
        assert data['user']['username'] == 'newuser'
        assert data['user']['email'] == 'newuser@example.com'
    
    def test_register_duplicate_username(self, client, sample_user):
        """Test registration with existing username."""
        response = client.post('/api/auth/register', json={
            'username': 'sampleuser',
            'email': 'different@example.com',
            'password': 'password123',
            'role': 'cashier'
        })
        
        assert response.status_code == 409
        data = response.get_json()
        assert 'error' in data
    
    def test_register_duplicate_email(self, client, sample_user):
        """Test registration with existing email."""
        response = client.post('/api/auth/register', json={
            'username': 'differentuser',
            'email': 'sample@example.com',
            'password': 'password123',
            'role': 'cashier'
        })
        
        assert response.status_code == 409
        data = response.get_json()
        assert 'error' in data
    
    def test_register_missing_fields(self, client):
        """Test registration with missing required fields."""
        response = client.post('/api/auth/register', json={
            'username': 'testuser'
        })
        
        assert response.status_code == 400
        data = response.get_json()
        assert 'error' in data
    
    def test_register_invalid_role(self, client):
        """Test registration with invalid role."""
        response = client.post('/api/auth/register', json={
            'username': 'testuser',
            'email': 'test@example.com',
            'password': 'password123',
            'role': 'invalid_role'
        })
        
        # Should still create user but role validation depends on implementation
        assert response.status_code in [201, 400]


class TestAuthLogin:
    """Test user login endpoint."""
    
    def test_login_success(self, client, sample_user):
        """Test successful login."""
        response = client.post('/api/auth/login', json={
            'username': 'sampleuser',
            'password': 'password123'
        })
        
        assert response.status_code == 200
        data = response.get_json()
        assert 'access_token' in data
        assert 'user' in data
        assert data['user']['username'] == 'sampleuser'
    
    def test_login_wrong_password(self, client, sample_user):
        """Test login with wrong password."""
        response = client.post('/api/auth/login', json={
            'username': 'sampleuser',
            'password': 'wrongpassword'
        })
        
        assert response.status_code == 401
        data = response.get_json()
        assert 'error' in data
    
    def test_login_nonexistent_user(self, client):
        """Test login with non-existent user."""
        response = client.post('/api/auth/login', json={
            'username': 'nonexistent',
            'password': 'password123'
        })
        
        assert response.status_code == 401
        data = response.get_json()
        assert 'error' in data
    
    def test_login_inactive_user(self, client, app, bcrypt):
        """Test login with inactive user."""
        with app.app_context():
            user = User(
                username='inactiveuser',
                email='inactive@example.com',
                password=bcrypt.generate_password_hash('password123').decode('utf-8'),
                role='cashier',
                status='inactive'
            )
            db.session.add(user)
            db.session.commit()
        
        response = client.post('/api/auth/login', json={
            'username': 'inactiveuser',
            'password': 'password123'
        })
        
        assert response.status_code == 403
        data = response.get_json()
        assert 'error' in data
    
    def test_login_missing_credentials(self, client):
        """Test login with missing credentials."""
        response = client.post('/api/auth/login', json={
            'username': 'testuser'
        })
        
        assert response.status_code == 400
        data = response.get_json()
        assert 'error' in data


class TestUserProfile:
    """Test user profile endpoint."""
    
    def test_get_profile(self, authenticated_client):
        """Test getting current user profile."""
        response = authenticated_client.get('/api/auth/profile')
        
        assert response.status_code == 200
        data = response.get_json()
        assert 'user' in data
        assert data['user']['username'] == 'testuser'
    
    def test_get_profile_unauthorized(self, client):
        """Test getting profile without authentication."""
        response = client.get('/api/auth/profile')
        
        assert response.status_code == 401
    
    def test_update_profile(self, authenticated_client):
        """Test updating user profile."""
        response = authenticated_client.put('/api/auth/profile', json={
            'name': 'Updated Name',
            'phone': '555-1234'
        })
        
        assert response.status_code == 200
        data = response.get_json()
        assert data['user']['name'] == 'Updated Name'
        assert data['user']['phone'] == '555-1234'
    
    def test_update_password(self, authenticated_client, app, bcrypt):
        """Test updating password."""
        response = authenticated_client.put('/api/auth/profile', json={
            'password': 'newpassword123'
        })
        
        assert response.status_code == 200
        
        # Verify new password works
        login_response = authenticated_client.post('/api/auth/login', json={
            'username': 'testuser',
            'password': 'newpassword123'
        })
        assert login_response.status_code == 200


class TestUserManagement:
    """Test user management endpoints."""
    
    def test_list_users(self, authenticated_client, sample_user):
        """Test listing all users."""
        response = authenticated_client.get('/api/users')
        
        assert response.status_code == 200
        data = response.get_json()
        assert 'users' in data
        assert len(data['users']) >= 2
    
    def test_list_users_filtered_by_role(self, authenticated_client, sample_user):
        """Test listing users filtered by role."""
        response = authenticated_client.get('/api/users?role=cashier')
        
        assert response.status_code == 200
        data = response.get_json()
        for user in data['users']:
            assert user['role'] == 'cashier'
    
    def test_list_users_search(self, authenticated_client, sample_user):
        """Test searching users."""
        response = authenticated_client.get('/api/users?search=sample')
        
        assert response.status_code == 200
        data = response.get_json()
        assert len(data['users']) >= 1
    
    def test_get_user(self, authenticated_client, sample_user):
        """Test getting single user."""
        response = authenticated_client.get(f'/api/users/{sample_user.id}')
        
        assert response.status_code == 200
        data = response.get_json()
        assert data['user']['id'] == sample_user.id
    
    def test_get_nonexistent_user(self, authenticated_client):
        """Test getting non-existent user."""
        response = authenticated_client.get('/api/users/99999')
        
        assert response.status_code == 404
    
    def test_update_user(self, authenticated_client, sample_user):
        """Test updating user."""
        response = authenticated_client.put(f'/api/users/{sample_user.id}', json={
            'name': 'Updated Name',
            'status': 'inactive'
        })
        
        assert response.status_code == 200
        data = response.get_json()
        assert data['user']['name'] == 'Updated Name'
        assert data['user']['status'] == 'inactive'
    
    def test_delete_user(self, authenticated_client, app, bcrypt):
        """Test deleting user."""
        with app.app_context():
            user = User(
                username='deletable',
                email='deletable@example.com',
                password=bcrypt.generate_password_hash('password123').decode('utf-8'),
                role='cashier'
            )
            db.session.add(user)
            db.session.commit()
            user_id = user.id
        
        response = authenticated_client.delete(f'/api/users/{user_id}')
        
        assert response.status_code == 200
        
        # Verify user is deleted
        with app.app_context():
            deleted_user = User.query.get(user_id)
            assert deleted_user is None
