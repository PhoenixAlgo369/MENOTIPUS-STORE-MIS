"""
Database initialization script.
Run this to create tables and seed initial data.
"""

from app import create_app, db
from app.models import User, Store, Supplier, Product
from flask_bcrypt import Bcrypt
import os

app = create_app()
bcrypt = Bcrypt(app)


def init_db():
    """Initialize database with tables and seed data."""
    with app.app_context():
        # Create tables
        print("Creating database tables...")
        db.create_all()
        print("Tables created successfully!")
        
        # Check if data already exists
        if User.query.first():
            print("Database already has data. Skipping seed.")
            return
        
        # Seed data
        print("Seeding initial data...")
        seed_data()
        print("Database initialized successfully!")


def seed_data():
    """Seed initial data for the application."""
    
    # Create admin user
    admin = User(
        username='admin',
        email='admin@menotipus.com',
        password=bcrypt.generate_password_hash('admin123').decode('utf-8'),
        name='System Admin',
        role='admin',
        status='active',
        pin='0000',
        pin_set=True,
        verified=True,
        trial_status='unlimited'
    )
    db.session.add(admin)
    
    # Create cashier user
    cashier = User(
        username='cashier',
        email='cashier@menotipus.com',
        password=bcrypt.generate_password_hash('cashier123').decode('utf-8'),
        name='Jane Cashier',
        role='cashier',
        status='active',
        pin='1234',
        pin_set=True,
        verified=True,
        trial_status='active'
    )
    db.session.add(cashier)
    
    # Create main store
    store = Store(
        name='Main Store',
        code='MAIN-001',
        address='123 Business Street',
        phone='+1234567890',
        email='mainstore@menotipus.com',
        status='active'
    )
    db.session.add(store)
    
    # Create suppliers
    suppliers = [
        Supplier(name='Tech Supplies Inc', email='info@techsupplies.com', phone='555-0101', status='active'),
        Supplier(name='Global Products Ltd', email='contact@globalproducts.com', phone='555-0102', status='active'),
        Supplier(name='Quality Goods Co', email='sales@qualitygoods.com', phone='555-0103', status='active')
    ]
    for supplier in suppliers:
        db.session.add(supplier)
    
    db.session.commit()
    
    # Create sample products
    products = [
        Product(
            name='Premium Coffee Beans',
            category='Beverages',
            sku='PCB-001',
            barcode='123456789012',
            description='1kg premium arabica coffee beans',
            cost_price=15.00,
            selling_price=24.99,
            stock=100,
            min_stock=20,
            supplier_id=1,
            status='active'
        ),
        Product(
            name='Ceramic Mug',
            category='Kitchen',
            sku='CM-001',
            barcode='234567890123',
            description='350ml ceramic coffee mug',
            cost_price=3.50,
            selling_price=9.99,
            stock=200,
            min_stock=50,
            supplier_id=1,
            status='active'
        ),
        Product(
            name='Notebook A5',
            category='Stationery',
            sku='NB-A5-001',
            barcode='345678901234',
            description='A5 lined notebook, 100 pages',
            cost_price=2.00,
            selling_price=5.99,
            stock=500,
            min_stock=100,
            supplier_id=2,
            status='active'
        )
    ]
    
    for product in products:
        db.session.add(product)
    
    db.session.commit()
    
    print(f"""
    ╔══════════════════════════════════════════════════════════╗
    ║              Database Seeded Successfully!               ║
    ╠══════════════════════════════════════════════════════════╣
    ║  Default Users:                                          ║
    ║  - Admin:    username: admin     password: admin123      ║
    ║  - Cashier:  username: cashier   password: cashier123    ║
    ╚══════════════════════════════════════════════════════════╝
    """)


if __name__ == '__main__':
    init_db()
