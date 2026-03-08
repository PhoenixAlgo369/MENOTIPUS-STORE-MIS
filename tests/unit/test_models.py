"""
Unit Tests for Authentication
"""

import pytest
from app import db
from app.models import User, Product, Store, Supplier, Sale, SaleItem
from flask_bcrypt import Bcrypt


class TestUserModel:
    """Test User model."""
    
    def test_create_user(self, app, bcrypt):
        """Test user creation."""
        with app.app_context():
            user = User(
                username='testuser',
                email='test@example.com',
                password=bcrypt.generate_password_hash('password123').decode('utf-8'),
                role='admin'
            )
            db.session.add(user)
            db.session.commit()
            
            assert user.id is not None
            assert user.username == 'testuser'
            assert user.email == 'test@example.com'
            assert user.role == 'admin'
            assert user.status == 'active'
    
    def test_user_password_hashing(self, app, bcrypt):
        """Test password hashing."""
        with app.app_context():
            password = 'securepassword'
            hashed = bcrypt.generate_password_hash(password).decode('utf-8')
            
            assert bcrypt.check_password_hash(hashed, password)
            assert not bcrypt.check_password_hash(hashed, 'wrongpassword')
    
    def test_user_to_dict(self, app, bcrypt):
        """Test user serialization."""
        with app.app_context():
            user = User(
                username='testuser',
                email='test@example.com',
                password=bcrypt.generate_password_hash('password123').decode('utf-8'),
                role='admin',
                name='Test User'
            )
            db.session.add(user)
            db.session.commit()
            
            user_dict = user.to_dict()
            assert user_dict['username'] == 'testuser'
            assert user_dict['email'] == 'test@example.com'
            assert 'password' not in user_dict
            assert user_dict['name'] == 'Test User'
    
    def test_user_unique_username(self, app, bcrypt):
        """Test username uniqueness."""
        with app.app_context():
            user1 = User(
                username='duplicate',
                email='user1@example.com',
                password=bcrypt.generate_password_hash('password123').decode('utf-8'),
                role='admin'
            )
            db.session.add(user1)
            db.session.commit()
            
            user2 = User(
                username='duplicate',
                email='user2@example.com',
                password=bcrypt.generate_password_hash('password123').decode('utf-8'),
                role='cashier'
            )
            db.session.add(user2)
            
            with pytest.raises(Exception):
                db.session.commit()
    
    def test_user_unique_email(self, app, bcrypt):
        """Test email uniqueness."""
        with app.app_context():
            user1 = User(
                username='user1',
                email='duplicate@example.com',
                password=bcrypt.generate_password_hash('password123').decode('utf-8'),
                role='admin'
            )
            db.session.add(user1)
            db.session.commit()
            
            user2 = User(
                username='user2',
                email='duplicate@example.com',
                password=bcrypt.generate_password_hash('password123').decode('utf-8'),
                role='cashier'
            )
            db.session.add(user2)
            
            with pytest.raises(Exception):
                db.session.commit()


class TestProductModel:
    """Test Product model."""
    
    def test_create_product(self, app, sample_supplier):
        """Test product creation."""
        with app.app_context():
            product = Product(
                name='Test Product',
                category='Test',
                sku='TEST-001',
                selling_price=19.99,
                stock=50,
                min_stock=10,
                supplier_id=sample_supplier
            )
            db.session.add(product)
            db.session.commit()
            
            # Re-fetch to verify
            product = Product.query.get(product.id)
            assert product.id is not None
            assert product.name == 'Test Product'
            assert product.sku == 'TEST-001'
            assert float(product.selling_price) == 19.99
    
    def test_product_low_stock_property(self, app, sample_supplier):
        """Test low stock detection."""
        with app.app_context():
            # Low stock product
            product_low = Product(
                name='Low Stock Product',
                category='Test',
                sku='LOW-001',
                selling_price=9.99,
                stock=5,
                min_stock=10,
                supplier_id=sample_supplier
            )
            
            # Normal stock product
            product_normal = Product(
                name='Normal Stock Product',
                category='Test',
                sku='NORMAL-001',
                selling_price=14.99,
                stock=50,
                min_stock=10,
                supplier_id=sample_supplier
            )
            
            db.session.add_all([product_low, product_normal])
            db.session.commit()
            
            # Re-fetch to verify
            product_low = Product.query.get(product_low.id)
            product_normal = Product.query.get(product_normal.id)
            
            assert product_low.is_low_stock is True
            assert product_normal.is_low_stock is False
    
    def test_product_to_dict(self, app, sample_supplier):
        """Test product serialization."""
        with app.app_context():
            product = Product(
                name='Test Product',
                category='Test',
                sku='TEST-001',
                selling_price=19.99,
                cost_price=10.00,
                stock=50,
                supplier_id=sample_supplier
            )
            db.session.add(product)
            db.session.commit()
            
            # Re-fetch to verify
            product = Product.query.get(product.id)
            product_dict = product.to_dict()
            assert product_dict['name'] == 'Test Product'
            assert product_dict['selling_price'] == 19.99
            assert product_dict['cost_price'] == 10.00
            assert product_dict['stock'] == 50


class TestStoreModel:
    """Test Store model."""
    
    def test_create_store(self, app):
        """Test store creation."""
        with app.app_context():
            store = Store(
                name='Test Store',
                code='TEST-001',
                address='123 Test St',
                phone='555-0100',
                email='test@store.com'
            )
            db.session.add(store)
            db.session.commit()
            
            # Re-fetch to verify
            store = Store.query.get(store.id)
            assert store.id is not None
            assert store.name == 'Test Store'
            assert store.code == 'TEST-001'
            assert store.status == 'active'
    
    def test_store_to_dict(self, app):
        """Test store serialization."""
        with app.app_context():
            store = Store(
                name='Test Store',
                code='TEST-001',
                address='123 Test St'
            )
            db.session.add(store)
            db.session.commit()
            
            # Re-fetch to verify
            store = Store.query.get(store.id)
            store_dict = store.to_dict()
            assert store_dict['name'] == 'Test Store'
            assert store_dict['code'] == 'TEST-001'


class TestSupplierModel:
    """Test Supplier model."""
    
    def test_create_supplier(self, app):
        """Test supplier creation."""
        with app.app_context():
            supplier = Supplier(
                name='Test Supplier',
                email='supplier@test.com',
                phone='555-0200'
            )
            db.session.add(supplier)
            db.session.commit()
            
            # Re-fetch to verify
            supplier = Supplier.query.get(supplier.id)
            assert supplier.id is not None
            assert supplier.name == 'Test Supplier'
            assert supplier.status == 'active'


class TestSaleModel:
    """Test Sale model."""
    
    def test_create_sale(self, app, sample_user, sample_store):
        """Test sale creation."""
        from datetime import date
        
        with app.app_context():
            sale = Sale(
                invoice_number='INV-TEST-001',
                total=99.99,
                subtotal=99.99,
                user_id=sample_user,
                store_id=sample_store
            )
            db.session.add(sale)
            db.session.commit()
            
            # Re-fetch to get fresh data
            sale = Sale.query.get(sale.id)
            assert sale.id is not None
            assert sale.invoice_number == 'INV-TEST-001'
            assert float(sale.total) == 99.99
            assert sale.date == date.today()
    
    def test_sale_to_dict(self, app, sample_user, sample_store):
        """Test sale serialization."""
        with app.app_context():
            sale = Sale(
                invoice_number='INV-TEST-002',
                total=149.99,
                subtotal=149.99,
                user_id=sample_user,
                store_id=sample_store
            )
            db.session.add(sale)
            db.session.commit()
            
            # Re-fetch to get fresh data
            sale = Sale.query.get(sale.id)
            sale_dict = sale.to_dict()
            assert sale_dict['invoice_number'] == 'INV-TEST-002'
            assert sale_dict['total'] == 149.99
            assert sale_dict['cashier_name'] is not None
