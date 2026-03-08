"""API Blueprint initialization."""

from flask import Blueprint
from flask_restful import Api
from app.resources import (
    UserRegisterResource,
    UserLoginResource,
    UserResource,
    UserListResource,
    UserPINResource,
    UserProfileResource,
    ProductListResource,
    ProductResource,
    ProductStockResource,
    ProductCategoriesResource,
    ProductLowStockResource,
    SaleListResource,
    SaleResource,
    SaleRefundResource,
    SaleTodayResource,
    SaleStatsResource,
    StoreListResource,
    StoreResource,
    SupplierListResource,
    SupplierResource,
    DashboardResource,
    AnalyticsResource
)

# Create blueprint
api_bp = Blueprint('api', __name__)
api = Api(api_bp)

# Register routes
# Auth routes
api.add_resource(UserRegisterResource, '/auth/register')
api.add_resource(UserLoginResource, '/auth/login')
api.add_resource(UserProfileResource, '/auth/profile')
api.add_resource(UserListResource, '/users')
api.add_resource(UserResource, '/users/<int:user_id>')
api.add_resource(UserPINResource, '/users/<int:user_id>/pin')

# Product routes
api.add_resource(ProductListResource, '/products')
api.add_resource(ProductResource, '/products/<int:product_id>')
api.add_resource(ProductStockResource, '/products/<int:product_id>/stock')
api.add_resource(ProductCategoriesResource, '/products/categories')
api.add_resource(ProductLowStockResource, '/products/low-stock')

# Sale routes
api.add_resource(SaleListResource, '/sales')
api.add_resource(SaleResource, '/sales/<int:sale_id>')
api.add_resource(SaleRefundResource, '/sales/<int:sale_id>/refund')
api.add_resource(SaleTodayResource, '/sales/today')
api.add_resource(SaleStatsResource, '/sales/stats')

# Store routes
api.add_resource(StoreListResource, '/stores')
api.add_resource(StoreResource, '/stores/<int:store_id>')

# Supplier routes
api.add_resource(SupplierListResource, '/suppliers')
api.add_resource(SupplierResource, '/suppliers/<int:supplier_id>')

# Dashboard routes
api.add_resource(DashboardResource, '/dashboard')
api.add_resource(AnalyticsResource, '/analytics')
