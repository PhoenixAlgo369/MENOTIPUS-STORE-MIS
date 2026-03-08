"""API Resources for Sales Management."""

from flask import request
from flask_restful import Resource
from flask_jwt_extended import jwt_required, get_jwt_identity
from app import db
from app.models import Sale, SaleItem, Product, User
from app.schemas import sale_schema, sales_schema, sale_create_schema
from datetime import date, datetime
import uuid


def generate_invoice_number():
    """Generate unique invoice number."""
    timestamp = datetime.now().strftime('%Y%m%d%H%M%S')
    random_suffix = uuid.uuid4().hex[:4].upper()
    return f"INV-{timestamp}-{random_suffix}"


class SaleListResource(Resource):
    """Resource for sales list."""
    
    @jwt_required()
    def get(self):
        """Get all sales with optional filtering."""
        # Query parameters
        start_date = request.args.get('start_date')
        end_date = request.args.get('end_date')
        user_id = request.args.get('user_id')
        store_id = request.args.get('store_id')
        payment_method = request.args.get('payment_method')
        payment_status = request.args.get('payment_status')
        
        query = Sale.query
        
        if start_date:
            try:
                start = date.fromisoformat(start_date)
                query = query.filter(Sale.date >= start)
            except ValueError:
                pass
        if end_date:
            try:
                end = date.fromisoformat(end_date)
                query = query.filter(Sale.date <= end)
            except ValueError:
                pass
        if user_id:
            query = query.filter_by(user_id=int(user_id))
        if store_id:
            query = query.filter_by(store_id=int(store_id))
        if payment_method:
            query = query.filter_by(payment_method=payment_method)
        if payment_status:
            query = query.filter_by(payment_status=payment_status)
        
        sales = query.order_by(Sale.created_at.desc()).all()
        
        return {'sales': sales_schema.dump(sales), 'count': len(sales)}, 200
    
    @jwt_required()
    def post(self):
        """Create a new sale."""
        data = request.get_json()
        
        # Validate request
        errors = sale_create_schema.validate(data)
        if errors:
            return {'error': errors}, 400
        
        items_data = data.get('items', [])
        if not items_data:
            return {'error': 'Sale must have at least one item'}, 400
        
        # Get current user
        current_user = get_jwt_identity()
        
        # Create sale
        sale = Sale(
            invoice_number=generate_invoice_number(),
            subtotal=0,
            tax=0,
            discount=data.get('discount', 0),
            total=0,
            payment_method=data.get('payment_method', 'cash'),
            payment_status='completed',
            user_id=current_user['id'],
            store_id=data.get('store_id')
        )
        
        # Process items
        subtotal = 0
        for item_data in items_data:
            product = Product.query.get(item_data['product_id'])
            
            if not product:
                db.session.rollback()
                return {'error': f"Product {item_data['product_id']} not found"}, 404
            
            if product.status != 'active':
                db.session.rollback()
                return {'error': f"Product {product.name} is not available"}, 400
            
            quantity = item_data['quantity']
            if product.stock < quantity:
                db.session.rollback()
                return {'error': f"Insufficient stock for {product.name}"}, 400
            
            unit_price = item_data.get('unit_price', float(product.selling_price))
            item_subtotal = quantity * unit_price
            
            # Create sale item
            sale_item = SaleItem(
                product_id=product.id,
                quantity=quantity,
                unit_price=unit_price,
                unit=item_data.get('unit', product.base_unit),
                subtotal=item_subtotal
            )
            
            sale.items.append(sale_item)
            subtotal += item_subtotal
            
            # Update product stock
            product.stock -= quantity
        
        # Calculate totals
        sale.subtotal = subtotal
        sale.total = subtotal - sale.discount
        
        db.session.add(sale)
        db.session.commit()
        
        return {'message': 'Sale created successfully', 'sale': sale_schema.dump(sale)}, 201


class SaleResource(Resource):
    """Resource for individual sale operations."""
    
    @jwt_required()
    def get(self, sale_id):
        """Get sale by ID."""
        sale = Sale.query.get(sale_id)
        
        if not sale:
            return {'error': 'Sale not found'}, 404
        
        return {'sale': sale_schema.dump(sale)}, 200
    
    @jwt_required()
    def delete(self, sale_id):
        """Delete/cancel a sale."""
        sale = Sale.query.get(sale_id)
        
        if not sale:
            return {'error': 'Sale not found'}, 404
        
        # Restore product stock
        for item in sale.items:
            product = Product.query.get(item.product_id)
            if product:
                product.stock += item.quantity
        
        db.session.delete(sale)
        db.session.commit()
        
        return {'message': 'Sale cancelled successfully'}, 200


class SaleRefundResource(Resource):
    """Resource for sale refunds."""
    
    @jwt_required()
    def post(self, sale_id):
        """Process a refund for a sale."""
        sale = Sale.query.get(sale_id)
        
        if not sale:
            return {'error': 'Sale not found'}, 404
        
        if sale.payment_status == 'refunded':
            return {'error': 'Sale already refunded'}, 400
        
        data = request.get_json()
        items_to_refund = data.get('items', [])  # List of item IDs to refund
        
        # If no specific items, refund all
        if not items_to_refund:
            items_to_refund = [item.id for item in sale.items]
        
        # Process refund
        for item in sale.items:
            if item.id in items_to_refund:
                # Restore stock
                product = Product.query.get(item.product_id)
                if product:
                    product.stock += item.quantity
        
        sale.payment_status = 'refunded'
        db.session.commit()
        
        return {'message': 'Refund processed successfully', 'sale': sale_schema.dump(sale)}, 200


class SaleTodayResource(Resource):
    """Resource for today's sales."""
    
    @jwt_required()
    def get(self):
        """Get all sales for today."""
        today = date.today()
        sales = Sale.query.filter_by(date=today).order_by(Sale.created_at.desc()).all()
        
        # Calculate totals
        total_revenue = sum(sale.total for sale in sales)
        total_transactions = len(sales)
        
        return {
            'sales': sales_schema.dump(sales),
            'count': total_transactions,
            'total_revenue': float(total_revenue) if total_revenue else 0
        }, 200


class SaleStatsResource(Resource):
    """Resource for sales statistics."""
    
    @jwt_required()
    def get(self):
        """Get sales statistics."""
        # Query parameters
        start_date = request.args.get('start_date')
        end_date = request.args.get('end_date')
        
        query = Sale.query.filter_by(payment_status='completed')
        
        if start_date:
            try:
                start = date.fromisoformat(start_date)
                query = query.filter(Sale.date >= start)
            except ValueError:
                pass
        if end_date:
            try:
                end = date.fromisoformat(end_date)
                query = query.filter(Sale.date <= end)
            except ValueError:
                pass
        
        sales = query.all()
        
        # Calculate statistics
        total_revenue = sum(sale.total for sale in sales)
        total_transactions = len(sales)
        avg_transaction = total_revenue / total_transactions if total_transactions > 0 else 0
        
        # Group by payment method
        by_payment_method = {}
        for sale in sales:
            method = sale.payment_method
            if method not in by_payment_method:
                by_payment_method[method] = {'count': 0, 'total': 0}
            by_payment_method[method]['count'] += 1
            by_payment_method[method]['total'] += float(sale.total)
        
        # Group by date
        by_date = {}
        for sale in sales:
            date_str = sale.date.isoformat()
            if date_str not in by_date:
                by_date[date_str] = {'count': 0, 'total': 0}
            by_date[date_str]['count'] += 1
            by_date[date_str]['total'] += float(sale.total)
        
        return {
            'total_revenue': float(total_revenue) if total_revenue else 0,
            'total_transactions': total_transactions,
            'average_transaction': float(avg_transaction) if avg_transaction else 0,
            'by_payment_method': by_payment_method,
            'by_date': by_date
        }, 200
