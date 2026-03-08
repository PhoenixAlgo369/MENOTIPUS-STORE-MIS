"""API Resources for Store and Supplier Management."""

from flask import request
from flask_restful import Resource
from flask_jwt_extended import jwt_required
from app import db
from app.models import Store, Supplier
from app.schemas import store_schema, stores_schema, supplier_schema, suppliers_schema
from datetime import datetime


class StoreListResource(Resource):
    """Resource for store list."""
    
    @jwt_required()
    def get(self):
        """Get all stores."""
        status = request.args.get('status')
        
        query = Store.query
        if status:
            query = query.filter_by(status=status)
        
        stores = query.order_by(Store.name).all()
        
        return {'stores': stores_schema.dump(stores), 'count': len(stores)}, 200
    
    @jwt_required()
    def post(self):
        """Create a new store."""
        data = request.get_json()
        
        if not data.get('name'):
            return {'error': 'Store name is required'}, 400
        
        # Check for duplicate code
        if data.get('code'):
            existing = Store.query.filter_by(code=data['code']).first()
            if existing:
                return {'error': 'Store code already exists'}, 409
        
        store = Store(
            name=data['name'],
            code=data.get('code'),
            address=data.get('address'),
            phone=data.get('phone'),
            email=data.get('email'),
            status=data.get('status', 'active')
        )
        
        db.session.add(store)
        db.session.commit()
        
        return {'message': 'Store created successfully', 'store': store_schema.dump(store)}, 201


class StoreResource(Resource):
    """Resource for individual store operations."""
    
    @jwt_required()
    def get(self, store_id):
        """Get store by ID."""
        store = Store.query.get(store_id)
        
        if not store:
            return {'error': 'Store not found'}, 404
        
        return {'store': store_schema.dump(store)}, 200
    
    @jwt_required()
    def put(self, store_id):
        """Update store."""
        store = Store.query.get(store_id)
        
        if not store:
            return {'error': 'Store not found'}, 404
        
        data = request.get_json()
        
        if 'name' in data:
            store.name = data['name']
        if 'code' in data and data['code'] != store.code:
            existing = Store.query.filter_by(code=data['code']).first()
            if existing:
                return {'error': 'Store code already exists'}, 409
            store.code = data['code']
        if 'address' in data:
            store.address = data['address']
        if 'phone' in data:
            store.phone = data['phone']
        if 'email' in data:
            store.email = data['email']
        if 'status' in data:
            store.status = data['status']
        
        store.updated_at = datetime.utcnow()
        db.session.commit()
        
        return {'message': 'Store updated successfully', 'store': store_schema.dump(store)}, 200
    
    @jwt_required()
    def delete(self, store_id):
        """Delete store (soft delete)."""
        store = Store.query.get(store_id)
        
        if not store:
            return {'error': 'Store not found'}, 404
        
        store.status = 'inactive'
        store.updated_at = datetime.utcnow()
        db.session.commit()
        
        return {'message': 'Store deleted successfully'}, 200


class SupplierListResource(Resource):
    """Resource for supplier list."""
    
    @jwt_required()
    def get(self):
        """Get all suppliers."""
        status = request.args.get('status')
        search = request.args.get('search')
        
        query = Supplier.query
        if status:
            query = query.filter_by(status=status)
        if search:
            query = query.filter(
                db.or_(
                    Supplier.name.ilike(f'%{search}%'),
                    Supplier.email.ilike(f'%{search}%'),
                    Supplier.phone.ilike(f'%{search}%')
                )
            )
        
        suppliers = query.order_by(Supplier.name).all()
        
        return {'suppliers': suppliers_schema.dump(suppliers), 'count': len(suppliers)}, 200
    
    @jwt_required()
    def post(self):
        """Create a new supplier."""
        data = request.get_json()
        
        if not data.get('name'):
            return {'error': 'Supplier name is required'}, 400
        
        # Check for duplicate email
        if data.get('email'):
            existing = Supplier.query.filter_by(email=data['email']).first()
            if existing:
                return {'error': 'Email already exists'}, 409
        
        supplier = Supplier(
            name=data['name'],
            email=data.get('email'),
            phone=data.get('phone'),
            address=data.get('address'),
            contact_person=data.get('contact_person'),
            status=data.get('status', 'active')
        )
        
        db.session.add(supplier)
        db.session.commit()
        
        return {'message': 'Supplier created successfully', 'supplier': supplier_schema.dump(supplier)}, 201


class SupplierResource(Resource):
    """Resource for individual supplier operations."""
    
    @jwt_required()
    def get(self, supplier_id):
        """Get supplier by ID."""
        supplier = Supplier.query.get(supplier_id)
        
        if not supplier:
            return {'error': 'Supplier not found'}, 404
        
        return {'supplier': supplier_schema.dump(supplier)}, 200
    
    @jwt_required()
    def put(self, supplier_id):
        """Update supplier."""
        supplier = Supplier.query.get(supplier_id)
        
        if not supplier:
            return {'error': 'Supplier not found'}, 404
        
        data = request.get_json()
        
        if 'name' in data:
            supplier.name = data['name']
        if 'email' in data and data['email'] != supplier.email:
            existing = Supplier.query.filter_by(email=data['email']).first()
            if existing:
                return {'error': 'Email already exists'}, 409
            supplier.email = data['email']
        if 'phone' in data:
            supplier.phone = data['phone']
        if 'address' in data:
            supplier.address = data['address']
        if 'contact_person' in data:
            supplier.contact_person = data['contact_person']
        if 'status' in data:
            supplier.status = data['status']
        
        supplier.updated_at = datetime.utcnow()
        db.session.commit()
        
        return {'message': 'Supplier updated successfully', 'supplier': supplier_schema.dump(supplier)}, 200
    
    @jwt_required()
    def delete(self, supplier_id):
        """Delete supplier (soft delete)."""
        supplier = Supplier.query.get(supplier_id)
        
        if not supplier:
            return {'error': 'Supplier not found'}, 404
        
        supplier.status = 'inactive'
        supplier.updated_at = datetime.utcnow()
        db.session.commit()
        
        return {'message': 'Supplier deleted successfully'}, 200
