"""API Resources initialization."""

from app.resources.auth import (
    UserRegisterResource,
    UserLoginResource,
    UserResource,
    UserListResource,
    UserPINResource,
    UserProfileResource
)
from app.resources.products import (
    ProductListResource,
    ProductResource,
    ProductStockResource,
    ProductCategoriesResource,
    ProductLowStockResource
)
from app.resources.sales import (
    SaleListResource,
    SaleResource,
    SaleRefundResource,
    SaleTodayResource,
    SaleStatsResource
)
from app.resources.stores import (
    StoreListResource,
    StoreResource,
    SupplierListResource,
    SupplierResource
)
from app.resources.dashboard import (
    DashboardResource,
    AnalyticsResource
)

__all__ = [
    # Auth
    'UserRegisterResource',
    'UserLoginResource',
    'UserResource',
    'UserListResource',
    'UserPINResource',
    'UserProfileResource',
    # Products
    'ProductListResource',
    'ProductResource',
    'ProductStockResource',
    'ProductCategoriesResource',
    'ProductLowStockResource',
    # Sales
    'SaleListResource',
    'SaleResource',
    'SaleRefundResource',
    'SaleTodayResource',
    'SaleStatsResource',
    # Stores & Suppliers
    'StoreListResource',
    'StoreResource',
    'SupplierListResource',
    'SupplierResource',
    # Dashboard
    'DashboardResource',
    'AnalyticsResource'
]
