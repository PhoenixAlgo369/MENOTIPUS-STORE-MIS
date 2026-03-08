"""
Integration Tests for Products API
"""

import pytest
from app import db
from app.models import Product


class TestProductList:
    """Test product list endpoint."""
    
    def test_list_products(self, authenticated_client, sample_product):
        """Test listing all products."""
        response = authenticated_client.get('/api/products')
        
        assert response.status_code == 200
        data = response.get_json()
        assert 'products' in data
        assert len(data['products']) >= 1
    
    def test_list_products_filtered_by_category(self, authenticated_client, sample_product):
        """Test filtering products by category."""
        response = authenticated_client.get('/api/products?category=Test Category')
        
        assert response.status_code == 200
        data = response.get_json()
        for product in data['products']:
            assert product['category'] == 'Test Category'
    
    def test_list_products_search(self, authenticated_client, sample_product):
        """Test searching products."""
        response = authenticated_client.get('/api/products?search=Test')
        
        assert response.status_code == 200
        data = response.get_json()
        assert len(data['products']) >= 1
    
    def test_list_low_stock_products(self, authenticated_client, sample_supplier):
        """Test listing low stock products."""
        with app.app_context():
            low_stock = Product(
                name='Low Stock Item',
                category='Test',
                sku='LOW-STOCK-001',
                selling_price=9.99,
                stock=5,
                min_stock=10,
                supplier_id=sample_supplier.id
            )
            db.session.add(low_stock)
            db.session.commit()
        
        response = authenticated_client.get('/api/products/low-stock')
        
        assert response.status_code == 200
        data = response.get_json()
        assert data['count'] >= 1
    
    def test_get_categories(self, authenticated_client, sample_product):
        """Test getting product categories."""
        response = authenticated_client.get('/api/products/categories')
        
        assert response.status_code == 200
        data = response.get_json()
        assert 'categories' in data
        assert 'Test Category' in data['categories']
    
    def test_list_products_unauthorized(self, client):
        """Test listing products without authentication."""
        response = client.get('/api/products')
        assert response.status_code == 401


class TestProductCreate:
    """Test product creation endpoint."""
    
    def test_create_product(self, authenticated_client, sample_supplier):
        """Test creating a new product."""
        response = authenticated_client.post('/api/products', json={
            'name': 'New Product',
            'category': 'New Category',
            'selling_price': 29.99,
            'cost_price': 15.00,
            'stock': 100,
            'min_stock': 20,
            'supplier_id': sample_supplier.id,
            'description': 'Test product'
        })
        
        assert response.status_code == 201
        data = response.get_json()
        assert 'product' in data
        assert data['product']['name'] == 'New Product'
        assert data['product']['selling_price'] == 29.99
    
    def test_create_product_missing_name(self, authenticated_client):
        """Test creating product without name."""
        response = authenticated_client.post('/api/products', json={
            'selling_price': 19.99
        })
        
        assert response.status_code == 400
        data = response.get_json()
        assert 'error' in data
    
    def test_create_product_missing_price(self, authenticated_client):
        """Test creating product without selling price."""
        response = authenticated_client.post('/api/products', json={
            'name': 'Test Product'
        })
        
        assert response.status_code == 400
        data = response.get_json()
        assert 'error' in data
    
    def test_create_product_duplicate_sku(self, authenticated_client, sample_product):
        """Test creating product with duplicate SKU."""
        response = authenticated_client.post('/api/products', json={
            'name': 'Duplicate SKU Product',
            'selling_price': 19.99,
            'sku': sample_product.sku
        })
        
        assert response.status_code == 409
        data = response.get_json()
        assert 'error' in data


class TestProductResource:
    """Test individual product endpoints."""
    
    def test_get_product(self, authenticated_client, sample_product):
        """Test getting single product."""
        response = authenticated_client.get(f'/api/products/{sample_product.id}')
        
        assert response.status_code == 200
        data = response.get_json()
        assert data['product']['id'] == sample_product.id
        assert data['product']['name'] == sample_product.name
    
    def test_get_nonexistent_product(self, authenticated_client):
        """Test getting non-existent product."""
        response = authenticated_client.get('/api/products/99999')
        
        assert response.status_code == 404
    
    def test_update_product(self, authenticated_client, sample_product):
        """Test updating product."""
        response = authenticated_client.put(f'/api/products/{sample_product.id}', json={
            'name': 'Updated Product Name',
            'selling_price': 39.99,
            'stock': 200
        })
        
        assert response.status_code == 200
        data = response.get_json()
        assert data['product']['name'] == 'Updated Product Name'
        assert data['product']['selling_price'] == 39.99
        assert data['product']['stock'] == 200
    
    def test_delete_product(self, authenticated_client, sample_product):
        """Test soft deleting product."""
        response = authenticated_client.delete(f'/api/products/{sample_product.id}')
        
        assert response.status_code == 200
        
        # Verify product is marked inactive
        with app.app_context():
            product = Product.query.get(sample_product.id)
            assert product.status == 'inactive'


class TestProductStock:
    """Test product stock management endpoints."""
    
    def test_update_stock(self, authenticated_client, sample_product):
        """Test updating product stock."""
        response = authenticated_client.put(f'/api/products/{sample_product.id}/stock', json={
            'stock': 500
        })
        
        assert response.status_code == 200
        data = response.get_json()
        assert data['product']['stock'] == 500
    
    def test_update_stock_negative(self, authenticated_client, sample_product):
        """Test updating stock to negative value."""
        response = authenticated_client.put(f'/api/products/{sample_product.id}/stock', json={
            'stock': -10
        })
        
        assert response.status_code == 400
    
    def test_adjust_stock_add(self, authenticated_client, sample_product):
        """Test adding to stock."""
        response = authenticated_client.post(f'/api/products/{sample_product.id}/stock', json={
            'adjustment': 50,
            'reason': 'New shipment received'
        })
        
        assert response.status_code == 200
        data = response.get_json()
        assert data['product']['stock'] == sample_product.stock + 50
    
    def test_adjust_stock_subtract(self, authenticated_client, sample_product):
        """Test subtracting from stock."""
        response = authenticated_client.post(f'/api/products/{sample_product.id}/stock', json={
            'adjustment': -20,
            'reason': 'Damaged items'
        })
        
        assert response.status_code == 200
        data = response.get_json()
        assert data['product']['stock'] == sample_product.stock - 20
    
    def test_adjust_stock_insufficient(self, authenticated_client, sample_product):
        """Test subtracting more than available stock."""
        response = authenticated_client.post(f'/api/products/{sample_product.id}/stock', json={
            'adjustment': -1000,
            'reason': 'Test'
        })
        
        assert response.status_code == 400
