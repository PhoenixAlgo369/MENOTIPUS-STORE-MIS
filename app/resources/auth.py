"""API Resources for Authentication and User Management."""

from flask import request
from flask_restful import Resource, reqparse
from flask_jwt_extended import create_access_token, jwt_required, get_jwt_identity
from app import db, bcrypt
from app.models import User
from app.schemas import user_schema, users_schema, user_login_schema, user_pin_schema
from datetime import datetime


class UserRegisterResource(Resource):
    """Resource for user registration."""
    
    def post(self):
        """Register a new user."""
        data = request.get_json()
        
        # Validate required fields
        required_fields = ['username', 'email', 'password', 'role']
        for field in required_fields:
            if not data.get(field):
                return {'error': f'{field} is required'}, 400
        
        # Check if username exists
        if User.query.filter_by(username=data['username']).first():
            return {'error': 'Username already exists'}, 409
        
        # Check if email exists
        if User.query.filter_by(email=data['email']).first():
            return {'error': 'Email already exists'}, 409
        
        # Hash password
        hashed_password = bcrypt.generate_password_hash(data['password']).decode('utf-8')
        
        # Create user
        user = User(
            username=data['username'],
            email=data['email'],
            password=hashed_password,
            name=data.get('name'),
            full_name=data.get('full_name'),
            first_name=data.get('first_name'),
            last_name=data.get('last_name'),
            phone=data.get('phone'),
            role=data['role'],
            status=data.get('status', 'active'),
            pin=data.get('pin'),
            pin_set=bool(data.get('pin')),
            trial_status=data.get('trial_status', 'active'),
            is_company_account=data.get('is_company_account', False),
            allowed_roles=data.get('allowed_roles'),
            stores=data.get('stores', []),
            verified=data.get('verified', False)
        )
        
        # Handle trial end date
        if data.get('trial_end_date'):
            try:
                user.trial_end_date = datetime.fromisoformat(data['trial_end_date'])
            except ValueError:
                pass
        
        db.session.add(user)
        db.session.commit()
        
        return {'message': 'User registered successfully', 'user': user_schema.dump(user)}, 201


class UserLoginResource(Resource):
    """Resource for user login."""
    
    def post(self):
        """Authenticate user and return JWT token."""
        data = request.get_json()
        
        username = data.get('username')
        password = data.get('password')
        
        if not username or not password:
            return {'error': 'Username and password are required'}, 400
        
        # Find user
        user = User.query.filter_by(username=username).first()
        
        if not user:
            return {'error': 'Invalid credentials'}, 401
        
        if user.status != 'active':
            return {'error': 'Account is not active'}, 403
        
        # Verify password
        if not bcrypt.check_password_hash(user.password, password):
            return {'error': 'Invalid credentials'}, 401
        
        # Create access token
        access_token = create_access_token(identity={
            'id': user.id,
            'username': user.username,
            'role': user.role
        })
        
        return {
            'message': 'Login successful',
            'access_token': access_token,
            'user': user_schema.dump(user)
        }, 200


class UserResource(Resource):
    """Resource for individual user operations."""
    
    @jwt_required()
    def get(self, user_id):
        """Get user by ID."""
        user = User.query.get(user_id)
        
        if not user:
            return {'error': 'User not found'}, 404
        
        return {'user': user_schema.dump(user)}, 200
    
    @jwt_required()
    def put(self, user_id):
        """Update user."""
        user = User.query.get(user_id)
        
        if not user:
            return {'error': 'User not found'}, 404
        
        data = request.get_json()
        
        # Update fields
        if 'name' in data:
            user.name = data['name']
        if 'full_name' in data:
            user.full_name = data['full_name']
        if 'first_name' in data:
            user.first_name = data['first_name']
        if 'last_name' in data:
            user.last_name = data['last_name']
        if 'phone' in data:
            user.phone = data['phone']
        if 'role' in data:
            user.role = data['role']
        if 'status' in data:
            user.status = data['status']
        if 'email' in data:
            # Check if new email is taken
            existing = User.query.filter_by(email=data['email']).first()
            if existing and existing.id != user_id:
                return {'error': 'Email already in use'}, 409
            user.email = data['email']
        if 'stores' in data:
            user.stores = data['stores']
        if 'trial_status' in data:
            user.trial_status = data['trial_status']
        
        db.session.commit()
        
        return {'message': 'User updated successfully', 'user': user_schema.dump(user)}, 200
    
    @jwt_required()
    def delete(self, user_id):
        """Delete user."""
        user = User.query.get(user_id)
        
        if not user:
            return {'error': 'User not found'}, 404
        
        db.session.delete(user)
        db.session.commit()
        
        return {'message': 'User deleted successfully'}, 200


class UserListResource(Resource):
    """Resource for user list."""
    
    @jwt_required()
    def get(self):
        """Get all users with optional filtering."""
        # Get query parameters
        role = request.args.get('role')
        status = request.args.get('status')
        search = request.args.get('search')
        
        query = User.query
        
        if role:
            query = query.filter_by(role=role)
        if status:
            query = query.filter_by(status=status)
        if search:
            query = query.filter(
                db.or_(
                    User.username.ilike(f'%{search}%'),
                    User.email.ilike(f'%{search}%'),
                    User.name.ilike(f'%{search}%')
                )
            )
        
        users = query.order_by(User.created_at.desc()).all()
        
        return {'users': users_schema.dump(users), 'count': len(users)}, 200


class UserPINResource(Resource):
    """Resource for PIN operations."""
    
    @jwt_required()
    def post(self, user_id):
        """Set or update user PIN."""
        user = User.query.get(user_id)
        
        if not user:
            return {'error': 'User not found'}, 404
        
        data = request.get_json()
        pin = data.get('pin')
        
        if not pin or len(pin) < 4:
            return {'error': 'PIN must be at least 4 digits'}, 400
        
        user.pin = pin
        user.pin_set = True
        db.session.commit()
        
        return {'message': 'PIN set successfully'}, 200
    
    @jwt_required()
    def put(self, user_id):
        """Verify user PIN."""
        user = User.query.get(user_id)
        
        if not user:
            return {'error': 'User not found'}, 404
        
        data = request.get_json()
        pin = data.get('pin')
        
        if not user.pin_set:
            return {'error': 'PIN not set', 'pin_set': False}, 400
        
        if user.pin != pin:
            return {'error': 'Invalid PIN', 'pin_set': True}, 401
        
        return {'message': 'PIN verified', 'pin_set': True}, 200


class UserProfileResource(Resource):
    """Resource for current user profile."""
    
    @jwt_required()
    def get(self):
        """Get current user profile."""
        current_user = get_jwt_identity()
        user = User.query.get(current_user['id'])
        
        if not user:
            return {'error': 'User not found'}, 404
        
        return {'user': user_schema.dump(user)}, 200
    
    @jwt_required()
    def put(self):
        """Update current user profile."""
        current_user = get_jwt_identity()
        user = User.query.get(current_user['id'])
        
        if not user:
            return {'error': 'User not found'}, 404
        
        data = request.get_json()
        
        # Update allowed fields
        if 'name' in data:
            user.name = data['name']
        if 'phone' in data:
            user.phone = data['phone']
        if 'password' in data and len(data['password']) >= 6:
            user.password = bcrypt.generate_password_hash(data['password']).decode('utf-8')
        
        db.session.commit()
        
        return {'message': 'Profile updated successfully', 'user': user_schema.dump(user)}, 200
