"""
Unit Tests for API Schemas
"""

import pytest
from app.schemas import (
    user_schema, users_schema, user_login_schema,
    product_schema, products_schema,
    sale_schema, sale_create_schema,
    store_schema, stores_schema,
    supplier_schema, suppliers_schema
)


class TestUserSchema:
    """Test User schema validation."""
    
    def test_valid_user_data(self):
        """Test valid user data."""
        data = {
            'username': 'testuser',
            'email': 'test@example.com',
            'password': 'password123',
            'role': 'admin'
        }
        errors = user_schema.validate(data)
        assert errors == {}
    
    def test_invalid_email(self):
        """Test invalid email format."""
        data = {
            'username': 'testuser',
            'email': 'invalid-email',
            'password': 'password123',
            'role': 'admin'
        }
        errors = user_schema.validate(data)
        assert 'email' in errors
    
    def test_short_username(self):
        """Test username too short."""
        data = {
            'username': 'ab',
            'email': 'test@example.com',
            'password': 'password123',
            'role': 'admin'
        }
        errors = user_schema.validate(data)
        assert 'username' in errors
    
    def test_invalid_role(self):
        """Test invalid role."""
        data = {
            'username': 'testuser',
            'email': 'test@example.com',
            'password': 'password123',
            'role': 'invalid_role'
        }
        errors = user_schema.validate(data)
        assert 'role' in errors
    
    def test_missing_required_fields(self):
        """Test missing required fields."""
        data = {}
        errors = user_schema.validate(data)
        assert 'username' in errors
        assert 'email' in errors
        assert 'role' in errors
    
    def test_valid_login_data(self):
        """Test valid login data."""
        data = {
            'username': 'testuser',
            'password': 'password123'
        }
        errors = user_login_schema.validate(data)
        assert errors == {}
    
    def test_login_missing_password(self):
        """Test login missing password."""
        data = {'username': 'testuser'}
        errors = user_login_schema.validate(data)
        assert 'password' in errors


class TestProductSchema:
    """Test Product schema validation."""
    
    def test_valid_product_data(self):
        """Test valid product data."""
        data = {
            'name': 'Test Product',
            'selling_price': 19.99,
            'category': 'Test'
        }
        errors = product_schema.validate(data)
        assert errors == {}
    
    def test_missing_name(self):
        """Test missing product name."""
        data = {
            'selling_price': 19.99
        }
        errors = product_schema.validate(data)
        assert 'name' in errors
    
    def test_missing_selling_price(self):
        """Test missing selling price."""
        data = {
            'name': 'Test Product'
        }
        errors = product_schema.validate(data)
        assert 'selling_price' in errors
    
    def test_negative_stock(self):
        """Test negative stock value."""
        data = {
            'name': 'Test Product',
            'selling_price': 19.99,
            'stock': -10
        }
        # Stock validation is handled in resource, not schema
        errors = product_schema.validate(data)
        assert errors == {}


class TestSaleSchema:
    """Test Sale schema validation."""
    
    def test_valid_sale_create_data(self):
        """Test valid sale creation data."""
        data = {
            'items': [
                {'product_id': 1, 'quantity': 2, 'unit_price': 19.99}
            ],
            'payment_method': 'cash'
        }
        errors = sale_create_schema.validate(data)
        assert errors == {}
    
    def test_sale_missing_items(self):
        """Test sale with no items."""
        data = {
            'payment_method': 'cash'
        }
        errors = sale_create_schema.validate(data)
        assert 'items' in errors
    
    def test_sale_empty_items(self):
        """Test sale with empty items list."""
        data = {
            'items': [],
            'payment_method': 'cash'
        }
        errors = sale_create_schema.validate(data)
        assert 'items' in errors
    
    def test_sale_invalid_payment_method(self):
        """Test invalid payment method."""
        data = {
            'items': [{'product_id': 1, 'quantity': 1}],
            'payment_method': 'invalid'
        }
        errors = sale_create_schema.validate(data)
        assert 'payment_method' in errors
    
    def test_sale_zero_quantity(self):
        """Test zero quantity in item."""
        data = {
            'items': [{'product_id': 1, 'quantity': 0}]
        }
        errors = sale_create_schema.validate(data)
        # Zero quantity should be invalid
        assert 'items' in errors


class TestStoreSchema:
    """Test Store schema validation."""
    
    def test_valid_store_data(self):
        """Test valid store data."""
        data = {
            'name': 'Test Store',
            'code': 'TEST-001'
        }
        errors = store_schema.validate(data)
        assert errors == {}
    
    def test_missing_store_name(self):
        """Test missing store name."""
        data = {'code': 'TEST-001'}
        errors = store_schema.validate(data)
        assert 'name' in errors
    
    def test_valid_store_status(self):
        """Test valid store status values."""
        for status in ['active', 'inactive', 'closed']:
            data = {'name': 'Test Store', 'status': status}
            errors = store_schema.validate(data)
            assert errors == {}
    
    def test_invalid_store_status(self):
        """Test invalid store status."""
        data = {'name': 'Test Store', 'status': 'invalid'}
        errors = store_schema.validate(data)
        assert 'status' in errors


class TestSupplierSchema:
    """Test Supplier schema validation."""
    
    def test_valid_supplier_data(self):
        """Test valid supplier data."""
        data = {
            'name': 'Test Supplier',
            'email': 'supplier@test.com'
        }
        errors = supplier_schema.validate(data)
        assert errors == {}
    
    def test_missing_supplier_name(self):
        """Test missing supplier name."""
        data = {'email': 'supplier@test.com'}
        errors = supplier_schema.validate(data)
        assert 'name' in errors
    
    def test_invalid_supplier_email(self):
        """Test invalid email format."""
        data = {
            'name': 'Test Supplier',
            'email': 'invalid-email'
        }
        errors = supplier_schema.validate(data)
        assert 'email' in errors
