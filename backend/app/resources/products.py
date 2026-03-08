"""API Resources for Product Management."""

from flask import request
from flask_restful import Resource
from flask_jwt_extended import jwt_required
from app import db
from app.models import Product, Supplier
from app.schemas import product_schema, products_schema, product_stock_schema
from datetime import date, datetime
import uuid


class ProductListResource(Resource):
    """Resource for product list."""
    
    @jwt_required()
    def get(self):
        """Get all products with optional filtering."""
        # Query parameters
        category = request.args.get('category')
        status = request.args.get('status')
        search = request.args.get('search')
        low_stock = request.args.get('low_stock')
        supplier_id = request.args.get('supplier_id')
        store_id = request.args.get('store_id')
        
        query = Product.query
        
        if category:
            query = query.filter_by(category=category)
        if status:
            query = query.filter_by(status=status)
        if supplier_id:
            query = query.filter_by(supplier_id=int(supplier_id))
        if store_id:
            query = query.filter_by(store_id=int(store_id))
        if search:
            query = query.filter(
                db.or_(
                    Product.name.ilike(f'%{search}%'),
                    Product.sku.ilike(f'%{search}%'),
                    Product.barcode.ilike(f'%{search}%')
                )
            )
        if low_stock == 'true':
            query = query.filter(Product.stock <= Product.min_stock)
        
        products = query.order_by(Product.name).all()
        
        return {'products': products_schema.dump(products), 'count': len(products)}, 200
    
    @jwt_required()
    def post(self):
        """Create a new product."""
        data = request.get_json()
        
        # Validate required fields
        if not data.get('name'):
            return {'error': 'Product name is required'}, 400
        if not data.get('selling_price'):
            return {'error': 'Selling price is required'}, 400
        
        # Check for duplicate SKU
        if data.get('sku'):
            existing = Product.query.filter_by(sku=data['sku']).first()
            if existing:
                return {'error': 'SKU already exists'}, 409
        
        # Check for duplicate barcode
        if data.get('barcode'):
            existing = Product.query.filter_by(barcode=data['barcode']).first()
            if existing:
                return {'error': 'Barcode already exists'}, 409
        
        # Generate SKU if not provided
        if not data.get('sku'):
            sku_base = ''.join(word[:3].upper() for word in data['name'].split()[:2])
            sku = f"{sku_base}-{uuid.uuid4().hex[:4].upper()}"
            data['sku'] = sku
        
        # Create product
        product = Product(
            name=data['name'],
            category=data.get('category', 'General'),
            sku=data['sku'],
            barcode=data.get('barcode'),
            description=data.get('description'),
            cost_price=data.get('cost_price', 0),
            selling_price=data['selling_price'],
            currency=data.get('currency', 'USD'),
            stock=data.get('stock', 0),
            min_stock=data.get('min_stock', 10),
            base_unit=data.get('base_unit', 'piece'),
            sell_units=data.get('sell_units', ['piece']),
            conversion_factors=data.get('conversion_factors', {'piece': 1}),
            supplier_id=data.get('supplier_id'),
            store_id=data.get('store_id'),
            status=data.get('status', 'active'),
            date_added=data.get('date_added', date.today())
        )
        
        # Parse date_added if string
        if isinstance(product.date_added, str):
            try:
                product.date_added = date.fromisoformat(product.date_added)
            except ValueError:
                product.date_added = date.today()
        
        db.session.add(product)
        db.session.commit()
        
        return {'message': 'Product created successfully', 'product': product_schema.dump(product)}, 201


class ProductResource(Resource):
    """Resource for individual product operations."""
    
    @jwt_required()
    def get(self, product_id):
        """Get product by ID."""
        product = Product.query.get(product_id)
        
        if not product:
            return {'error': 'Product not found'}, 404
        
        return {'product': product_schema.dump(product)}, 200
    
    @jwt_required()
    def put(self, product_id):
        """Update product."""
        product = Product.query.get(product_id)
        
        if not product:
            return {'error': 'Product not found'}, 404
        
        data = request.get_json()
        
        # Update fields
        if 'name' in data:
            product.name = data['name']
        if 'category' in data:
            product.category = data['category']
        if 'description' in data:
            product.description = data['description']
        if 'cost_price' in data:
            product.cost_price = data['cost_price']
        if 'selling_price' in data:
            product.selling_price = data['selling_price']
        if 'currency' in data:
            product.currency = data['currency']
        if 'stock' in data:
            product.stock = data['stock']
        if 'min_stock' in data:
            product.min_stock = data['min_stock']
        if 'base_unit' in data:
            product.base_unit = data['base_unit']
        if 'sell_units' in data:
            product.sell_units = data['sell_units']
        if 'conversion_factors' in data:
            product.conversion_factors = data['conversion_factors']
        if 'supplier_id' in data:
            product.supplier_id = data['supplier_id']
        if 'store_id' in data:
            product.store_id = data['store_id']
        if 'status' in data:
            product.status = data['status']
        
        # Handle barcode update with uniqueness check
        if 'barcode' in data and data['barcode'] != product.barcode:
            existing = Product.query.filter_by(barcode=data['barcode']).first()
            if existing:
                return {'error': 'Barcode already exists'}, 409
            product.barcode = data['barcode']
        
        # Handle SKU update with uniqueness check
        if 'sku' in data and data['sku'] != product.sku:
            existing = Product.query.filter_by(sku=data['sku']).first()
            if existing:
                return {'error': 'SKU already exists'}, 409
            product.sku = data['sku']
        
        product.updated_at = datetime.utcnow()
        db.session.commit()
        
        return {'message': 'Product updated successfully', 'product': product_schema.dump(product)}, 200
    
    @jwt_required()
    def delete(self, product_id):
        """Delete product (soft delete by setting status to inactive)."""
        product = Product.query.get(product_id)
        
        if not product:
            return {'error': 'Product not found'}, 404
        
        # Soft delete
        product.status = 'inactive'
        product.updated_at = datetime.utcnow()
        db.session.commit()
        
        return {'message': 'Product deleted successfully'}, 200


class ProductStockResource(Resource):
    """Resource for product stock operations."""
    
    @jwt_required()
    def put(self, product_id):
        """Update product stock."""
        product = Product.query.get(product_id)
        
        if not product:
            return {'error': 'Product not found'}, 404
        
        data = request.get_json()
        
        if 'stock' not in data:
            return {'error': 'Stock value is required'}, 400
        
        if data['stock'] < 0:
            return {'error': 'Stock cannot be negative'}, 400
        
        product.stock = data['stock']
        product.updated_at = datetime.utcnow()
        db.session.commit()
        
        return {
            'message': 'Stock updated successfully',
            'product': product_schema.dump(product)
        }, 200
    
    @jwt_required()
    def post(self, product_id):
        """Adjust product stock (add or subtract)."""
        product = Product.query.get(product_id)
        
        if not product:
            return {'error': 'Product not found'}, 404
        
        data = request.get_json()
        adjustment = data.get('adjustment', 0)
        reason = data.get('reason', 'Stock adjustment')
        
        new_stock = product.stock + adjustment
        
        if new_stock < 0:
            return {'error': 'Insufficient stock'}, 400
        
        product.stock = new_stock
        product.updated_at = datetime.utcnow()
        db.session.commit()
        
        return {
            'message': f'Stock adjusted by {adjustment} ({reason})',
            'product': product_schema.dump(product)
        }, 200


class ProductCategoriesResource(Resource):
    """Resource for product categories."""
    
    @jwt_required()
    def get(self):
        """Get all unique product categories."""
        categories = db.session.query(Product.category).distinct().all()
        category_list = [cat[0] for cat in categories if cat[0]]
        
        return {'categories': category_list, 'count': len(category_list)}, 200


class ProductLowStockResource(Resource):
    """Resource for low stock products."""
    
    @jwt_required()
    def get(self):
        """Get all products below minimum stock level."""
        products = Product.query.filter(Product.stock <= Product.min_stock).all()
        
        return {
            'products': products_schema.dump(products),
            'count': len(products)
        }, 200
