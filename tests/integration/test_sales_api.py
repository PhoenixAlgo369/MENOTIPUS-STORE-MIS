"""
Integration Tests for Sales API
"""

import pytest
from app import db
from app.models import Sale, SaleItem, Product


class TestSaleList:
    """Test sales list endpoint."""
    
    def test_list_sales(self, authenticated_client):
        """Test listing all sales."""
        response = authenticated_client.get('/api/sales')
        
        assert response.status_code == 200
        data = response.get_json()
        assert 'sales' in data
    
    def test_list_sales_filtered_by_date(self, authenticated_client):
        """Test filtering sales by date."""
        response = authenticated_client.get('/api/sales?start_date=2024-01-01')
        
        assert response.status_code == 200
        data = response.get_json()
        assert 'sales' in data
    
    def test_get_today_sales(self, authenticated_client):
        """Test getting today's sales."""
        response = authenticated_client.get('/api/sales/today')
        
        assert response.status_code == 200
        data = response.get_json()
        assert 'sales' in data
        assert 'total_revenue' in data
    
    def test_get_sales_stats(self, authenticated_client):
        """Test getting sales statistics."""
        response = authenticated_client.get('/api/sales/stats')
        
        assert response.status_code == 200
        data = response.get_json()
        assert 'total_revenue' in data
        assert 'total_transactions' in data
        assert 'average_transaction' in data


class TestSaleCreate:
    """Test sale creation endpoint."""
    
    def test_create_sale(self, authenticated_client, sample_product, sample_store):
        """Test creating a new sale."""
        response = authenticated_client.post('/api/sales', json={
            'items': [
                {
                    'product_id': sample_product.id,
                    'quantity': 2,
                    'unit_price': sample_product.selling_price
                }
            ],
            'payment_method': 'cash',
            'store_id': sample_store.id
        })
        
        assert response.status_code == 201
        data = response.get_json()
        assert 'sale' in data
        assert 'invoice_number' in data['sale']
        assert data['sale']['total'] > 0
        
        # Verify stock was reduced
        with app.app_context():
            product = Product.query.get(sample_product.id)
            assert product.stock == sample_product.stock - 2
    
    def test_create_sale_multiple_items(self, authenticated_client, sample_product, sample_supplier):
        """Test creating sale with multiple items."""
        with app.app_context():
            product2 = Product(
                name='Second Product',
                category='Test',
                sku='TEST-002',
                selling_price=24.99,
                stock=50,
                supplier_id=sample_supplier.id
            )
            db.session.add(product2)
            db.session.commit()
        
        response = authenticated_client.post('/api/sales', json={
            'items': [
                {'product_id': sample_product.id, 'quantity': 1, 'unit_price': 19.99},
                {'product_id': product2.id, 'quantity': 2, 'unit_price': 24.99}
            ],
            'payment_method': 'card'
        })
        
        assert response.status_code == 201
        data = response.get_json()
        assert data['sale']['total'] == 19.99 + (24.99 * 2)
    
    def test_create_sale_empty_items(self, authenticated_client):
        """Test creating sale with no items."""
        response = authenticated_client.post('/api/sales', json={
            'items': [],
            'payment_method': 'cash'
        })
        
        assert response.status_code == 400
    
    def test_create_sale_insufficient_stock(self, authenticated_client, sample_product):
        """Test creating sale with insufficient stock."""
        response = authenticated_client.post('/api/sales', json={
            'items': [
                {'product_id': sample_product.id, 'quantity': 1000}
            ],
            'payment_method': 'cash'
        })
        
        assert response.status_code == 400
        data = response.get_json()
        assert 'error' in data
    
    def test_create_sale_nonexistent_product(self, authenticated_client):
        """Test creating sale with non-existent product."""
        response = authenticated_client.post('/api/sales', json={
            'items': [
                {'product_id': 99999, 'quantity': 1}
            ],
            'payment_method': 'cash'
        })
        
        assert response.status_code == 404


class TestSaleResource:
    """Test individual sale endpoints."""
    
    def test_get_sale(self, authenticated_client, sample_product, sample_store):
        """Test getting single sale."""
        # Create a sale first
        with app.app_context():
            sale = Sale(
                invoice_number='INV-TEST-001',
                total=99.99,
                subtotal=99.99,
                store_id=sample_store.id
            )
            db.session.add(sale)
            db.session.commit()
            sale_id = sale.id
        
        response = authenticated_client.get(f'/api/sales/{sale_id}')
        
        assert response.status_code == 200
        data = response.get_json()
        assert data['sale']['id'] == sale_id
    
    def test_get_nonexistent_sale(self, authenticated_client):
        """Test getting non-existent sale."""
        response = authenticated_client.get('/api/sales/99999')
        
        assert response.status_code == 404
    
    def test_cancel_sale(self, authenticated_client, sample_product, sample_store):
        """Test cancelling a sale."""
        # Create a sale
        with app.app_context():
            sale = Sale(
                invoice_number='INV-CANCEL-001',
                total=49.99,
                subtotal=49.99,
                store_id=sample_store.id
            )
            item = SaleItem(
                product_id=sample_product.id,
                quantity=2,
                unit_price=24.995,
                subtotal=49.99
            )
            sale.items.append(item)
            db.session.add(sale)
            db.session.commit()
            sale_id = sale.id
            initial_stock = Product.query.get(sample_product.id).stock
        
        response = authenticated_client.delete(f'/api/sales/{sale_id}')
        
        assert response.status_code == 200
        
        # Verify stock was restored
        with app.app_context():
            product = Product.query.get(sample_product.id)
            assert product.stock == initial_stock + 2
    
    def test_process_refund(self, authenticated_client, sample_store):
        """Test processing a refund."""
        with app.app_context():
            sale = Sale(
                invoice_number='INV-REFUND-001',
                total=99.99,
                subtotal=99.99,
                payment_status='completed',
                store_id=sample_store.id
            )
            db.session.add(sale)
            db.session.commit()
            sale_id = sale.id
        
        response = authenticated_client.post(f'/api/sales/{sale_id}/refund', json={})
        
        assert response.status_code == 200
        data = response.get_json()
        assert data['sale']['payment_status'] == 'refunded'
