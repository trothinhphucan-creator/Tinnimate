# TinniMate Deployment Guide

This guide explains how to deploy TinniMate to `tinimate.vuinghe.com` using Docker and GitHub Actions.

## Table of Contents

- [Architecture Overview](#architecture-overview)
- [Initial Server Setup](#initial-server-setup)
- [GitHub Actions Setup](#github-actions-setup)
- [Manual Deployment](#manual-deployment)
- [Monitoring & Troubleshooting](#monitoring--troubleshooting)

---

## Architecture Overview

The deployment uses:
- **Docker** containers for isolation and consistency
- **Docker Compose** for multi-container orchestration
- **Nginx** reverse proxy with SSL/TLS
- **PostgreSQL** database (optional, can use Supabase)
- **GitHub Actions** for CI/CD pipeline
- **systemd** service for process management

### Services

```
┌─────────────────────────────────────┐
│  tinimate.vuinghe.com (Nginx 443)   │
│  ├─ SSL/TLS termination             │
│  ├─ Rate limiting & security        │
│  └─ Reverse proxy to app            │
├─────────────────────────────────────┤
│  TinniMate Web App (Next.js 3000)   │
│  ├─ Node.js 20 LTS                  │
│  ├─ Multi-provider LLM support      │
│  └─ Admin dashboard                 │
├─────────────────────────────────────┤
│  PostgreSQL 16 (optional)           │
│  └─ Database for logs & config      │
└─────────────────────────────────────┘
```

---

## Initial Server Setup

### Prerequisites

- Ubuntu 20.04 LTS or later
- Sudo access
- Domain: `tinimate.vuinghe.com` configured to point to server IP
- SSH access to server

### Step 1: Run Setup Script

SSH into your server and run:

```bash
# Download the setup script
curl -fsSL https://raw.githubusercontent.com/trothinhphucan-creator/Tinnimate/main/scripts/setup-server.sh -o /tmp/setup.sh

# Run with sudo
sudo bash /tmp/setup.sh deploy
```

This script will:
- Create `deploy` user for deployments
- Install Docker and Docker Compose
- Clone the Tinnimate repository
- Create required directories and SSL certificates
- Setup systemd service
- Generate SSH keys for GitHub Actions

### Step 2: Configure Environment

Edit the environment file on the server:

```bash
sudo nano /home/deploy/tinnimate/.env.production
```

Fill in all required variables:
- Supabase credentials (URL, keys)
- LLM API keys (Gemini, OpenAI, Anthropic)
- Database credentials (if using local PostgreSQL)
- Other secrets

### Step 3: Setup SSL Certificates

#### Option A: Let's Encrypt (Recommended)

```bash
sudo certbot certonly --standalone -d tinimate.vuinghe.com

# Copy certificates to project
sudo cp /etc/letsencrypt/live/tinimate.vuinghe.com/fullchain.pem /home/deploy/tinnimate/ssl/cert.pem
sudo cp /etc/letsencrypt/live/tinimate.vuinghe.com/privkey.pem /home/deploy/tinnimate/ssl/key.pem
sudo chown deploy:deploy /home/deploy/tinnimate/ssl/*
```

#### Option B: Self-Signed (Testing Only)

The setup script can generate self-signed certificates, but these are NOT suitable for production.

### Step 4: Start Services

```bash
sudo systemctl start tinnimate
sudo systemctl status tinnimate
```

Check services are running:

```bash
cd /home/deploy/tinnimate
docker-compose ps
```

---

## GitHub Actions Setup

### Step 1: Generate Deploy SSH Key

On your local machine:

```bash
ssh-keygen -t ed25519 -f github-deploy-key -N ''
cat github-deploy-key  # This is the private key
```

### Step 2: Add Public Key to Server

```bash
ssh deploy@tinimate.vuinghe.com
cat >> ~/.ssh/authorized_keys << 'EOF'
<paste content of github-deploy-key.pub>
EOF
exit
```

### Step 3: Add GitHub Secrets

In your GitHub repository, go to **Settings → Secrets and variables → Actions**.

Create the following secrets:

| Secret Name | Value |
|---|---|
| `DEPLOY_HOST` | `tinimate.vuinghe.com` |
| `DEPLOY_USER` | `deploy` |
| `DEPLOY_PORT` | `22` |
| `DEPLOY_SSH_KEY` | Content of `github-deploy-key` (private key) |
| `SLACK_WEBHOOK` | (Optional) Slack webhook for notifications |

### Step 4: Test Deployment

Push a commit to `main` branch:

```bash
git add .
git commit -m "test: trigger deployment"
git push origin main
```

Monitor the deployment in **Actions** tab.

---

## Manual Deployment

### Update and Restart

SSH into the server:

```bash
ssh deploy@tinimate.vuinghe.com
cd ~/tinnimate

# Pull latest code
git pull origin main

# Load environment
set -a
source .env.production
set +a

# Rebuild and restart
docker-compose down
docker-compose pull
docker-compose up -d

# Check status
docker-compose ps
```

### View Logs

```bash
# Web app logs
docker-compose logs -f web

# Nginx logs
docker-compose logs -f nginx

# All services
docker-compose logs -f
```

### Database Migrations

If there are schema changes, run migrations:

```bash
docker-compose exec -T web npm run db:migrate
```

---

## Monitoring & Troubleshooting

### Health Checks

The deployment includes health checks for all services:

```bash
# Check service health
docker-compose ps

# Manual health check
curl https://tinimate.vuinghe.com/health
```

### Common Issues

#### 1. Connection Refused

**Problem**: `connection refused` when accessing the site

**Solution**:
```bash
# Check if containers are running
docker-compose ps

# Check logs
docker-compose logs web

# Restart services
docker-compose restart web nginx
```

#### 2. SSL Certificate Issues

**Problem**: `SSL_ERROR_BAD_CERT_DOMAIN` or expired certificates

**Solution**:
```bash
# Check certificate validity
openssl x509 -in /home/deploy/tinnimate/ssl/cert.pem -text -noout

# For Let's Encrypt, renew with:
sudo certbot renew --force-renewal
sudo cp /etc/letsencrypt/live/tinimate.vuinghe.com/fullchain.pem /home/deploy/tinnimate/ssl/cert.pem
sudo cp /etc/letsencrypt/live/tinimate.vuinghe.com/privkey.pem /home/deploy/tinnimate/ssl/key.pem
docker-compose restart nginx
```

#### 3. Out of Disk Space

**Problem**: Deployment fails due to disk space

**Solution**:
```bash
# Check disk usage
df -h

# Clean up Docker
docker system prune -a

# Remove old logs
docker-compose exec -T web rm -rf /app/logs/*
```

#### 4. Database Connection Issues

**Problem**: `Can't connect to database`

**Solution**:
```bash
# Check database service
docker-compose ps postgres

# Check environment variables
docker-compose exec -T web env | grep DATABASE

# Verify credentials
docker-compose logs postgres
```

### Performance Tuning

#### Increase Worker Connections

Edit `/home/deploy/tinnimate/nginx.conf`:

```nginx
events {
    worker_connections 2048;  # Increase from 1024
}
```

Restart nginx:

```bash
docker-compose restart nginx
```

#### Adjust Docker Memory Limits

Edit `docker-compose.yml` to add memory limits:

```yaml
services:
  web:
    deploy:
      resources:
        limits:
          memory: 2G
        reservations:
          memory: 1G
```

### Monitoring with Logs

```bash
# Watch logs in real-time
docker-compose logs -f

# Filter by service
docker-compose logs -f web

# Show last N lines
docker-compose logs --tail=50 web

# Search logs
docker-compose logs web | grep "ERROR"
```

---

## Backup & Recovery

### Database Backup

```bash
# Backup PostgreSQL
docker-compose exec -T postgres pg_dump -U postgres tinnimate > backup.sql

# Restore from backup
docker-compose exec -T postgres psql -U postgres tinnimate < backup.sql
```

### Full System Backup

```bash
# Backup entire project
tar -czf tinnimate-backup-$(date +%Y%m%d).tar.gz /home/deploy/tinnimate

# Backup only data
tar -czf tinnimate-data-$(date +%Y%m%d).tar.gz /home/deploy/tinnimate/postgres-data
```

---

## Auto-Renewal of SSL Certificates

For Let's Encrypt certificates, setup automatic renewal:

```bash
# Create renewal hook script
sudo tee /etc/letsencrypt/renewal-hooks/post/tinnimate.sh > /dev/null << 'EOF'
#!/bin/bash
cp /etc/letsencrypt/live/tinimate.vuinghe.com/fullchain.pem /home/deploy/tinnimate/ssl/cert.pem
cp /etc/letsencrypt/live/tinimate.vuinghe.com/privkey.pem /home/deploy/tinnimate/ssl/key.pem
chown deploy:deploy /home/deploy/tinnimate/ssl/*
cd /home/deploy/tinnimate && docker-compose restart nginx
EOF

sudo chmod +x /etc/letsencrypt/renewal-hooks/post/tinnimate.sh

# Test renewal
sudo certbot renew --dry-run
```

---

## Support

For issues or questions:

1. Check GitHub Actions logs
2. Review service logs: `docker-compose logs`
3. Verify environment variables
4. Check server disk/memory usage
5. Review Nginx error logs

---

## Rollback

If deployment goes wrong:

```bash
# Revert to previous commit
cd /home/deploy/tinnimate
git revert HEAD
git push origin main

# Or manually reset
git reset --hard HEAD~1
docker-compose down
docker-compose up -d
```

---

Last updated: 2026-03-10
