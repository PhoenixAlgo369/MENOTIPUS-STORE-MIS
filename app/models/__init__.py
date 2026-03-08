"""Database models for MENOTIPUS Store MIS."""

from app import db
from datetime import datetime, date
from sqlalchemy.dialects.postgresql import ARRAY, JSONB
import json


class MutableList(db.TypeDecorator):
    """Mutable list type that works with both PostgreSQL and SQLite."""
    impl = db.Text
    
    def process_bind_param(self, value, dialect):
        if value is None:
            return None
        return json.dumps(value)
    
    def process_result_value(self, value, dialect):
        if value is None:
            return None
        return json.loads(value)


class User(db.Model):
    """User model for authentication and authorization."""
    __tablename__ = 'users'
    
    id = db.Column(db.Integer, primary_key=True)
    username = db.Column(db.String(80), unique=True, nullable=False, index=True)
    email = db.Column(db.String(120), unique=True, nullable=False, index=True)
    password = db.Column(db.String(255), nullable=False)
    name = db.Column(db.String(100))
    full_name = db.Column(db.String(150))
    first_name = db.Column(db.String(50))
    last_name = db.Column(db.String(50))
    phone = db.Column(db.String(20))
    role = db.Column(db.String(50), nullable=False, index=True)
    status = db.Column(db.String(20), default='active', index=True)
    
    # PIN authentication
    pin = db.Column(db.String(10))
    pin_set = db.Column(db.Boolean, default=False)
    
    # Trial management
    trial_status = db.Column(db.String(20), default='active')
    trial_end_date = db.Column(db.DateTime)
    
    # Company account features
    is_company_account = db.Column(db.Boolean, default=False)
    company_id = db.Column(db.String(100), index=True)
    allowed_roles = db.Column(MutableList, default=list)
    
    # Store associations
    stores = db.Column(MutableList, default=list)
    
    # Verification
    verified = db.Column(db.Boolean, default=False)
    
    # Timestamps
    created_at = db.Column(db.DateTime, default=datetime.utcnow, index=True)
    updated_at = db.Column(db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    
    # Relationships
    sales = db.relationship('Sale', backref='cashier', lazy='dynamic')
    
    def __repr__(self):
        return f'<User {self.username}>'
    
    def to_dict(self):
        """Convert user to dictionary."""
        return {
            'id': self.id,
            'username': self.username,
            'email': self.email,
            'name': self.name or self.full_name or f'{self.first_name} {self.last_name}',
            'phone': self.phone,
            'role': self.role,
            'status': self.status,
            'pin_set': self.pin_set,
            'trial_status': self.trial_status,
            'trial_end_date': self.trial_end_date.isoformat() if self.trial_end_date else None,
            'is_company_account': self.is_company_account,
            'allowed_roles': self.allowed_roles,
            'stores': self.stores,
            'verified': self.verified,
            'created_at': self.created_at.isoformat() if self.created_at else None
        }


class Store(db.Model):
    """Store location model."""
    __tablename__ = 'stores'
    
    id = db.Column(db.Integer, primary_key=True)
    name = db.Column(db.String(100), nullable=False)
    code = db.Column(db.String(20), unique=True)
    address = db.Column(db.String(255))
    phone = db.Column(db.String(20))
    email = db.Column(db.String(120))
    status = db.Column(db.String(20), default='active', index=True)
    
    # Timestamps
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    updated_at = db.Column(db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    
    # Relationships
    products = db.relationship('Product', backref='store', lazy='dynamic')
    sales = db.relationship('Sale', backref='store', lazy='dynamic')
    
    def __repr__(self):
        return f'<Store {self.name}>'
    
    def to_dict(self):
        """Convert store to dictionary."""
        return {
            'id': self.id,
            'name': self.name,
            'code': self.code,
            'address': self.address,
            'phone': self.phone,
            'email': self.email,
            'status': self.status,
            'created_at': self.created_at.isoformat() if self.created_at else None
        }


class Supplier(db.Model):
    """Supplier model for product sourcing."""
    __tablename__ = 'suppliers'
    
    id = db.Column(db.Integer, primary_key=True)
    name = db.Column(db.String(150), nullable=False, index=True)
    email = db.Column(db.String(120), unique=True)
    phone = db.Column(db.String(20))
    address = db.Column(db.String(255))
    contact_person = db.Column(db.String(100))
    status = db.Column(db.String(20), default='active', index=True)
    
    # Timestamps
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    updated_at = db.Column(db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    
    # Relationships
    products = db.relationship('Product', backref='supplier', lazy='dynamic')
    
    def __repr__(self):
        return f'<Supplier {self.name}>'
    
    def to_dict(self):
        """Convert supplier to dictionary."""
        return {
            'id': self.id,
            'name': self.name,
            'email': self.email,
            'phone': self.phone,
            'address': self.address,
            'contact_person': self.contact_person,
            'status': self.status,
            'created_at': self.created_at.isoformat() if self.created_at else None
        }


class Product(db.Model):
    """Product model for inventory management."""
    __tablename__ = 'products'
    
    id = db.Column(db.Integer, primary_key=True)
    name = db.Column(db.String(150), nullable=False, index=True)
    category = db.Column(db.String(50), index=True)
    sku = db.Column(db.String(50), unique=True, index=True)
    barcode = db.Column(db.String(100), index=True)
    description = db.Column(db.Text)
    
    # Pricing
    cost_price = db.Column(db.Numeric(10, 2), default=0)
    selling_price = db.Column(db.Numeric(10, 2), nullable=False)
    currency = db.Column(db.String(3), default='USD')
    
    # Inventory
    stock = db.Column(db.Integer, default=0)
    min_stock = db.Column(db.Integer, default=10)
    
    # Units - using MutableList for cross-database compatibility
    base_unit = db.Column(db.String(20), default='piece')
    sell_units = db.Column(MutableList, default=list)
    conversion_factors = db.Column(db.Text)  # Store as JSON string
    
    # Foreign keys
    supplier_id = db.Column(db.Integer, db.ForeignKey('suppliers.id'), index=True)
    store_id = db.Column(db.Integer, db.ForeignKey('stores.id'), index=True)
    
    # Status
    status = db.Column(db.String(20), default='active', index=True)
    
    # Timestamps
    date_added = db.Column(db.Date, default=date.today)
    created_at = db.Column(db.DateTime, default=datetime.utcnow, index=True)
    updated_at = db.Column(db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    
    # Relationships
    sale_items = db.relationship('SaleItem', backref='product', lazy='dynamic')
    
    def __repr__(self):
        return f'<Product {self.name}>'
    
    def to_dict(self):
        """Convert product to dictionary."""
        # Parse conversion_factors if string
        cf = self.conversion_factors
        if isinstance(cf, str):
            try:
                cf = json.loads(cf)
            except (json.JSONDecodeError, TypeError):
                cf = {}
        
        return {
            'id': self.id,
            'name': self.name,
            'category': self.category,
            'sku': self.sku,
            'barcode': self.barcode,
            'description': self.description,
            'cost_price': float(self.cost_price) if self.cost_price else 0,
            'selling_price': float(self.selling_price) if self.selling_price else 0,
            'currency': self.currency,
            'stock': self.stock,
            'min_stock': self.min_stock,
            'base_unit': self.base_unit,
            'sell_units': self.sell_units or [],
            'conversion_factors': cf,
            'supplier_id': self.supplier_id,
            'store_id': self.store_id,
            'status': self.status,
            'date_added': self.date_added.isoformat() if self.date_added else None,
            'created_at': self.created_at.isoformat() if self.created_at else None
        }
    
    @property
    def is_low_stock(self):
        """Check if product is below minimum stock level."""
        return self.stock <= self.min_stock


class Sale(db.Model):
    """Sale transaction model."""
    __tablename__ = 'sales'
    
    id = db.Column(db.Integer, primary_key=True)
    invoice_number = db.Column(db.String(50), unique=True, index=True)
    
    # Pricing
    subtotal = db.Column(db.Numeric(10, 2), default=0)
    tax = db.Column(db.Numeric(10, 2), default=0)
    discount = db.Column(db.Numeric(10, 2), default=0)
    total = db.Column(db.Numeric(10, 2), nullable=False)
    
    # Payment
    payment_method = db.Column(db.String(50), default='cash')
    payment_status = db.Column(db.String(20), default='completed')
    
    # Foreign keys
    user_id = db.Column(db.Integer, db.ForeignKey('users.id'), index=True)
    store_id = db.Column(db.Integer, db.ForeignKey('stores.id'), index=True)
    
    # Timestamps
    date = db.Column(db.Date, default=date.today, index=True)
    time = db.Column(db.Time, default=datetime.utcnow().time)
    created_at = db.Column(db.DateTime, default=datetime.utcnow, index=True)
    updated_at = db.Column(db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    
    # Relationships
    items = db.relationship('SaleItem', backref='sale', lazy='dynamic', cascade='all, delete-orphan')
    
    def __repr__(self):
        return f'<Sale {self.invoice_number}>'
    
    def to_dict(self):
        """Convert sale to dictionary."""
        return {
            'id': self.id,
            'invoice_number': self.invoice_number,
            'subtotal': float(self.subtotal) if self.subtotal else 0,
            'tax': float(self.tax) if self.tax else 0,
            'discount': float(self.discount) if self.discount else 0,
            'total': float(self.total) if self.total else 0,
            'payment_method': self.payment_method,
            'payment_status': self.payment_status,
            'user_id': self.user_id,
            'cashier_name': self.cashier.name if self.cashier else None,
            'store_id': self.store_id,
            'store_name': self.store.name if self.store else None,
            'date': self.date.isoformat() if self.date else None,
            'time': self.time.isoformat() if self.time else None,
            'created_at': self.created_at.isoformat() if self.created_at else None,
            'items': [item.to_dict() for item in self.items]
        }


class SaleItem(db.Model):
    """Sale item model for individual items in a sale."""
    __tablename__ = 'sale_items'
    
    id = db.Column(db.Integer, primary_key=True)
    sale_id = db.Column(db.Integer, db.ForeignKey('sales.id'), nullable=False, index=True)
    product_id = db.Column(db.Integer, db.ForeignKey('products.id'), nullable=False, index=True)
    
    # Item details
    quantity = db.Column(db.Integer, nullable=False)
    unit_price = db.Column(db.Numeric(10, 2), nullable=False)
    unit = db.Column(db.String(20), default='piece')
    subtotal = db.Column(db.Numeric(10, 2), nullable=False)
    
    def __repr__(self):
        return f'<SaleItem {self.id}>'
    
    def to_dict(self):
        """Convert sale item to dictionary."""
        return {
            'id': self.id,
            'sale_id': self.sale_id,
            'product_id': self.product_id,
            'product_name': self.product.name if self.product else None,
            'quantity': self.quantity,
            'unit_price': float(self.unit_price) if self.unit_price else 0,
            'unit': self.unit,
            'subtotal': float(self.subtotal) if self.subtotal else 0
        }
