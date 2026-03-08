"""Marshmallow schemas for request/response validation."""

from marshmallow import Schema, fields, validate, validates, validates_schema, ValidationError
from datetime import datetime, date


class UserSchema(Schema):
    """Schema for User serialization/deserialization."""
    
    id = fields.Int(dump_only=True)
    username = fields.Str(required=True, validate=validate.Length(min=3, max=80))
    email = fields.Email(required=True)
    password = fields.Str(load_only=True, validate=validate.Length(min=6))
    name = fields.Str()
    full_name = fields.Str()
    first_name = fields.Str()
    last_name = fields.Str()
    phone = fields.Str()
    role = fields.Str(required=True, validate=validate.OneOf([
        'admin', 'cashier', 'manager', 'owner', 'engineer', 'supervisor', 'systems_admin'
    ]))
    status = fields.Str(validate=validate.OneOf(['active', 'inactive', 'suspended']))
    pin = fields.Str(load_only=True, validate=validate.Length(min=4, max=10))
    pin_set = fields.Bool(dump_only=True)
    trial_status = fields.Str(validate=validate.OneOf(['active', 'unlimited', 'extended', 'expired']))
    trial_end_date = fields.DateTime()
    is_company_account = fields.Bool()
    allowed_roles = fields.List(fields.Str())
    stores = fields.List(fields.Int())
    verified = fields.Bool()
    created_at = fields.DateTime(dump_only=True)
    updated_at = fields.DateTime(dump_only=True)


class UserLoginSchema(Schema):
    """Schema for user login."""
    
    username = fields.Str(required=True)
    password = fields.Str(required=True)


class UserPINSchema(Schema):
    """Schema for PIN verification."""
    
    pin = fields.Str(required=True, validate=validate.Length(min=4, max=10))


class StoreSchema(Schema):
    """Schema for Store serialization/deserialization."""
    
    id = fields.Int(dump_only=True)
    name = fields.Str(required=True, validate=validate.Length(min=2, max=100))
    code = fields.Str(validate=validate.Length(max=20))
    address = fields.Str()
    phone = fields.Str()
    email = fields.Email()
    status = fields.Str(validate=validate.OneOf(['active', 'inactive', 'closed']))
    created_at = fields.DateTime(dump_only=True)
    updated_at = fields.DateTime(dump_only=True)


class SupplierSchema(Schema):
    """Schema for Supplier serialization/deserialization."""
    
    id = fields.Int(dump_only=True)
    name = fields.Str(required=True, validate=validate.Length(min=2, max=150))
    email = fields.Email()
    phone = fields.Str()
    address = fields.Str()
    contact_person = fields.Str()
    status = fields.Str(validate=validate.OneOf(['active', 'inactive']))
    created_at = fields.DateTime(dump_only=True)
    updated_at = fields.DateTime(dump_only=True)


class ProductSchema(Schema):
    """Schema for Product serialization/deserialization."""
    
    id = fields.Int(dump_only=True)
    name = fields.Str(required=True, validate=validate.Length(min=2, max=150))
    category = fields.Str()
    sku = fields.Str(validate=validate.Length(max=50))
    barcode = fields.Str()
    description = fields.Str()
    cost_price = fields.Decimal(places=2)
    selling_price = fields.Decimal(required=True, places=2)
    currency = fields.Str(validate=validate.Length(max=3))
    stock = fields.Int()
    min_stock = fields.Int()
    base_unit = fields.Str()
    sell_units = fields.List(fields.Str())
    conversion_factors = fields.Dict()
    supplier_id = fields.Int()
    store_id = fields.Int()
    status = fields.Str(validate=validate.OneOf(['active', 'inactive', 'discontinued']))
    date_added = fields.Date()
    created_at = fields.DateTime(dump_only=True)
    updated_at = fields.DateTime(dump_only=True)
    
    # Computed fields
    is_low_stock = fields.Bool(dump_only=True)


class ProductStockUpdateSchema(Schema):
    """Schema for updating product stock."""
    
    stock = fields.Int(required=True, validate=validate.Range(min=0))
    reason = fields.Str()


class SaleItemSchema(Schema):
    """Schema for Sale Item."""
    
    id = fields.Int(dump_only=True)
    product_id = fields.Int(required=True)
    product_name = fields.Str(dump_only=True)
    quantity = fields.Int(required=True, validate=validate.Range(min=1))
    unit_price = fields.Decimal(required=True, places=2)
    unit = fields.Str()
    subtotal = fields.Decimal(dump_only=True, places=2)


class SaleSchema(Schema):
    """Schema for Sale serialization/deserialization."""
    
    id = fields.Int(dump_only=True)
    invoice_number = fields.Str(dump_only=True)
    subtotal = fields.Decimal(places=2)
    tax = fields.Decimal(places=2)
    discount = fields.Decimal(places=2)
    total = fields.Decimal(required=True, places=2)
    payment_method = fields.Str(validate=validate.OneOf(['cash', 'card', 'mobile', 'credit']))
    payment_status = fields.Str(validate=validate.OneOf(['completed', 'pending', 'refunded']))
    user_id = fields.Int()
    cashier_name = fields.Str(dump_only=True)
    store_id = fields.Int()
    store_name = fields.Str(dump_only=True)
    date = fields.Date()
    time = fields.Time()
    created_at = fields.DateTime(dump_only=True)
    updated_at = fields.DateTime(dump_only=True)
    items = fields.Nested(SaleItemSchema, many=True, required=True)


class SaleCreateSchema(Schema):
    """Schema for creating a new sale."""
    
    items = fields.List(fields.Dict(), required=True)
    payment_method = fields.Str(validate=validate.OneOf(['cash', 'card', 'mobile', 'credit']))
    discount = fields.Decimal(places=2)
    store_id = fields.Int()
    
    @validates('items')
    def validate_items(self, items):
        if not items:
            raise ValidationError('Sale must have at least one item')
        for item in items:
            if 'product_id' not in item:
                raise ValidationError('Each item must have a product_id')
            if 'quantity' not in item or item['quantity'] < 1:
                raise ValidationError('Each item must have a valid quantity')


class DashboardSchema(Schema):
    """Schema for dashboard statistics."""
    
    total_sales = fields.Decimal(places=2, dump_only=True)
    today_sales = fields.Decimal(places=2, dump_only=True)
    total_products = fields.Int(dump_only=True)
    low_stock_products = fields.Int(dump_only=True)
    total_users = fields.Int(dump_only=True)
    active_cashiers = fields.Int(dump_only=True)


# Instantiate schemas for import
user_schema = UserSchema()
users_schema = UserSchema(many=True)
user_login_schema = UserLoginSchema()
user_pin_schema = UserPINSchema()

store_schema = StoreSchema()
stores_schema = StoreSchema(many=True)

supplier_schema = SupplierSchema()
suppliers_schema = SupplierSchema(many=True)

product_schema = ProductSchema()
products_schema = ProductSchema(many=True)
product_stock_schema = ProductStockUpdateSchema()

sale_item_schema = SaleItemSchema()
sale_schema = SaleSchema()
sales_schema = SaleSchema(many=True)
sale_create_schema = SaleCreateSchema()

dashboard_schema = DashboardSchema()
