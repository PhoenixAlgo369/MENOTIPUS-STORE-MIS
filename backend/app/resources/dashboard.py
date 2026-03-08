"""API Resources for Dashboard and Analytics."""

from flask_restful import Resource
from flask_jwt_extended import jwt_required
from app import db
from app.models import User, Product, Sale
from app.schemas import dashboard_schema
from datetime import date, timedelta
from sqlalchemy import func


class DashboardResource(Resource):
    """Resource for dashboard statistics."""
    
    @jwt_required()
    def get(self):
        """Get dashboard statistics."""
        # Total sales
        total_sales = db.session.query(func.sum(Sale.total)).filter_by(payment_status='completed').scalar() or 0
        
        # Today's sales
        today = date.today()
        today_sales = db.session.query(func.sum(Sale.total)).filter(
            Sale.date == today,
            Sale.payment_status == 'completed'
        ).scalar() or 0
        
        # Total products
        total_products = Product.query.filter_by(status='active').count()
        
        # Low stock products
        low_stock_products = Product.query.filter(
            Product.stock <= Product.min_stock,
            Product.status == 'active'
        ).count()
        
        # Total users
        total_users = User.query.count()
        
        # Active cashiers
        active_cashiers = User.query.filter_by(role='cashier', status='active').count()
        
        # Recent sales (last 5)
        recent_sales = Sale.query.order_by(Sale.created_at.desc()).limit(5).all()
        
        return {
            'statistics': {
                'total_sales': float(total_sales),
                'today_sales': float(today_sales),
                'total_products': total_products,
                'low_stock_products': low_stock_products,
                'total_users': total_users,
                'active_cashiers': active_cashiers
            },
            'recent_sales': [sale.to_dict() for sale in recent_sales]
        }, 200


class AnalyticsResource(Resource):
    """Resource for detailed analytics."""
    
    @jwt_required()
    def get(self):
        """Get analytics data."""
        # Sales trend (last 7 days)
        seven_days_ago = date.today() - timedelta(days=7)
        sales_trend = db.session.query(
            Sale.date,
            func.sum(Sale.total).label('daily_total'),
            func.count(Sale.id).label('daily_count')
        ).filter(
            Sale.date >= seven_days_ago,
            Sale.payment_status == 'completed'
        ).group_by(Sale.date).order_by(Sale.date).all()
        
        # Top products (by quantity sold)
        from app.models import SaleItem
        top_products = db.session.query(
            Product.id,
            Product.name,
            func.sum(SaleItem.quantity).label('total_sold')
        ).join(SaleItem).group_by(Product.id).order_by(
            func.sum(SaleItem.quantity).desc()
        ).limit(10).all()
        
        # Category performance
        category_performance = db.session.query(
            Product.category,
            func.sum(SaleItem.quantity).label('total_sold'),
            func.sum(SaleItem.subtotal).label('total_revenue')
        ).join(SaleItem).group_by(Product.category).order_by(
            func.sum(SaleItem.subtotal).desc()
        ).all()
        
        return {
            'sales_trend': [
                {'date': row.date.isoformat(), 'total': float(row.daily_total), 'count': row.daily_count}
                for row in sales_trend
            ],
            'top_products': [
                {'id': row.id, 'name': row.name, 'total_sold': row.total_sold}
                for row in top_products
            ],
            'category_performance': [
                {'category': row.category, 'total_sold': row.total_sold, 'total_revenue': float(row.total_revenue) if row.total_revenue else 0}
                for row in category_performance
            ]
        }, 200
