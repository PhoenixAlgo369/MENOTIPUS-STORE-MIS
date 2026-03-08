"""
MENOTIPUS Store MIS - Flask Backend
Main entry point for running the application
"""

from app import create_app, db
from app.models import User, Product, Sale, Store, Supplier
from dotenv import load_dotenv
import os

# Load environment variables
load_dotenv()

app = create_app()


@app.shell_context_processor
def make_shell_context():
    """Add models to Flask shell context."""
    return {
        'db': db,
        'User': User,
        'Product': Product,
        'Sale': Sale,
        'Store': Store,
        'Supplier': Supplier
    }


if __name__ == '__main__':
    # Get configuration from environment
    debug = os.getenv('FLASK_ENV', 'development') == 'development'
    host = os.getenv('FLASK_HOST', '0.0.0.0')
    port = int(os.getenv('FLASK_PORT', 5000))
    
    print(f"""
    ╔══════════════════════════════════════════════════════════╗
    ║       MENOTIPUS STORE MIS - REST API Server              ║
    ╠══════════════════════════════════════════════════════════╣
    ║  Running on: http://{host}:{port}                          ║
    ║  Environment: {os.getenv('FLASK_ENV', 'development'):12}                             ║
    ║  Debug Mode: {str(debug):12}                            ║
    ╚══════════════════════════════════════════════════════════╝
    
    API Endpoints:
    - Health Check: GET /health
    - API Base:     GET /api/
    
    Documentation: See README.md
    """)
    
    app.run(host=host, port=port, debug=debug)
