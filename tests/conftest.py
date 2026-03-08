"""
Test configuration and fixtures
"""

import pytest
from app import create_app, db
from app.models import User, Product, Store, Supplier
from flask_bcrypt import Bcrypt
import os


@pytest.fixture
def app():
    """Create application for testing."""
    app = create_app({
        'TESTING': True,
        'SQLALCHEMY_DATABASE_URI': 'sqlite:///:memory:',
        'SQLALCHEMY_TRACK_MODIFICATIONS': False,
        'JWT_SECRET_KEY': 'test-secret-key',
        'WTF_CSRF_ENABLED': False,
        'SECRET_KEY': 'test-secret-key',
    })
    
    with app.app_context():
        db.create_all()
        yield app
        db.session.remove()
        db.drop_all()


@pytest.fixture
def client(app):
    """Create test client."""
    return app.test_client()


@pytest.fixture
def runner(app):
    """Create test CLI runner."""
    return app.test_cli_runner()


@pytest.fixture
def bcrypt():
    """Create bcrypt instance for testing."""
    return Bcrypt()


@pytest.fixture
def auth_token(client, app):
    """Create authenticated user and return JWT token."""
    # Create test user
    with app.app_context():
        user = User(
            username='testuser',
            email='test@example.com',
            password=Bcrypt().generate_password_hash('password123').decode('utf-8'),
            role='admin',
            status='active'
        )
        db.session.add(user)
        db.session.commit()
    
    # Login and get token
    response = client.post('/api/auth/login', json={
        'username': 'testuser',
        'password': 'password123'
    })
    return response.get_json()['access_token']


@pytest.fixture
def authenticated_client(client, auth_token):
    """Create authenticated test client."""
    client.environ_base['HTTP_AUTHORIZATION'] = f'Bearer {auth_token}'
    return client


@pytest.fixture
def sample_user(app, bcrypt):
    """Create sample user for testing."""
    with app.app_context():
        user = User(
            username='sampleuser',
            email='sample@example.com',
            password=bcrypt.generate_password_hash('password123').decode('utf-8'),
            name='Sample User',
            role='cashier',
            status='active'
        )
        db.session.add(user)
        db.session.commit()
        user_id = user.id
        # Return user_id instead of user object to avoid detachment
        return user_id


@pytest.fixture
def sample_store(app):
    """Create sample store for testing."""
    with app.app_context():
        store = Store(
            name='Test Store',
            code='TEST-001',
            address='123 Test Street',
            phone='555-0100',
            email='test@store.com',
            status='active'
        )
        db.session.add(store)
        db.session.commit()
        return store.id


@pytest.fixture
def sample_supplier(app):
    """Create sample supplier for testing."""
    with app.app_context():
        supplier = Supplier(
            name='Test Supplier',
            email='supplier@test.com',
            phone='555-0200',
            address='456 Supplier Ave',
            status='active'
        )
        db.session.add(supplier)
        db.session.commit()
        return supplier.id


@pytest.fixture
def sample_product(app, sample_supplier):
    """Create sample product for testing."""
    with app.app_context():
        product = Product(
            name='Test Product',
            category='Test Category',
            sku='TEST-001',
            barcode='123456789012',
            description='Test product description',
            cost_price=10.00,
            selling_price=19.99,
            stock=100,
            min_stock=10,
            supplier_id=sample_supplier,
            status='active'
        )
        db.session.add(product)
        db.session.commit()
        return product.id
