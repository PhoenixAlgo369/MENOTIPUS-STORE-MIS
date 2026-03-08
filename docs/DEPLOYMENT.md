# Deployment Guide

## Production Deployment Options

### Option 1: Docker Compose (Recommended)

```bash
# Build images
docker-compose -f docker-compose.prod.yml build

# Start services
docker-compose -f docker-compose.prod.yml up -d

# View logs
docker-compose -f docker-compose.prod.yml logs -f
```

### Option 2: Heroku

```bash
# Install Heroku CLI
curl https://cli-assets.heroku.com/install.sh | sh

# Login
heroku login

# Create app
heroku create menotipus-store

# Add PostgreSQL
heroku addons:create heroku-postgresql:mini

# Set environment variables
heroku config:set FLASK_ENV=production
heroku config:set SECRET_KEY=$(openssl rand -hex 32)
heroku config:set JWT_SECRET_KEY=$(openssl rand -hex 32)

# Deploy
git push heroku main

# Initialize database
heroku run python init_db.py
```

### Option 3: AWS Elastic Beanstalk

```bash
# Install EB CLI
pip install awsebcli

# Initialize
eb init -p python-3.12 menotipus-store

# Create environment
eb create production

# Deploy
eb deploy
```

### Option 4: DigitalOcean App Platform

1. Connect GitHub repository
2. Configure build command: `pip install -r requirements.txt`
3. Configure run command: `gunicorn run:app`
4. Add PostgreSQL database
5. Set environment variables
6. Deploy

## Environment Variables for Production

```bash
# Required
FLASK_ENV=production
FLASK_DEBUG=False
SECRET_KEY=<generate-random-string>
JWT_SECRET_KEY=<generate-random-string>
DATABASE_URL=postgresql://user:password@host:5432/menotipus_store

# Optional
CORS_ORIGINS=https://yourdomain.com
LOG_LEVEL=INFO
RATELIMIT_DEFAULT=200 per hour
```

## Gunicorn Configuration

Create `wsgi.py`:
```python
from run import app

if __name__ == "__main__":
    app.run()
```

Create `gunicorn.conf.py`:
```python
bind = "0.0.0.0:5000"
workers = 4
worker_class = "sync"
worker_connections = 1000
timeout = 30
keepalive = 2
accesslog = "-"
errorlog = "-"
loglevel = "info"
```

Run:
```bash
gunicorn -c gunicorn.conf.py run:app
```

## Nginx Configuration

```nginx
server {
    listen 80;
    server_name api.menotipus.com;

    location / {
        proxy_pass http://127.0.0.1:5000;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
}
```

## SSL Certificate (Let's Encrypt)

```bash
# Install Certbot
sudo apt install certbot python3-certbot-nginx

# Get certificate
sudo certbot --nginx -d api.menotipus.com

# Auto-renewal
sudo certbot renew --dry-run
```

## Database Backup

```bash
# Backup
pg_dump menotipus_store > backup_$(date +%Y%m%d).sql

# Restore
psql menotipus_store < backup_20240101.sql
```

## Monitoring

### Health Check Endpoint

```bash
curl https://api.menotipus.com/health
```

### Log Aggregation

Use services like:
- Datadog
- New Relic
- Sentry (for errors)
- Logstash

## Scaling

### Horizontal Scaling

```bash
# Increase workers
gunicorn -c gunicorn.conf.py -w 8 run:app

# Use multiple instances behind load balancer
```

### Database Connection Pooling

```python
# In config
SQLALCHEMY_ENGINE_OPTIONS = {
    'pool_size': 10,
    'pool_recycle': 300,
    'pool_pre_ping': True,
}
```

## Security Checklist

- [ ] HTTPS enabled
- [ ] Strong SECRET_KEY and JWT_SECRET_KEY
- [ ] Database credentials secured
- [ ] CORS configured for production domain
- [ ] Rate limiting enabled
- [ ] Input validation active
- [ ] Error messages don't leak information
- [ ] Regular dependency updates
- [ ] Firewall configured
- [ ] Backups scheduled
