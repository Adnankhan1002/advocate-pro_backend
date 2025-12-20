# Deployment Guide

Deploy your Advocate Pro Backend to production!

## Option 1: Heroku (Easiest)

### Prerequisites
- Heroku account (free tier available)
- Heroku CLI installed
- Git installed

### Steps

1. **Login to Heroku**
   ```bash
   heroku login
   ```

2. **Create Heroku App**
   ```bash
   heroku create your-app-name
   ```

3. **Set Environment Variables**
   ```bash
   heroku config:set MONGODB_URI="mongodb+srv://username:password@cluster.xxxxx.mongodb.net/advocate-pro"
   heroku config:set JWT_SECRET="your_super_secret_key_production"
   heroku config:set NODE_ENV="production"
   heroku config:set CORS_ORIGIN="https://your-frontend-domain.com"
   ```

4. **Deploy**
   ```bash
   git push heroku main
   ```

5. **View Logs**
   ```bash
   heroku logs --tail
   ```

### Heroku Troubleshooting
```bash
# Check app status
heroku ps

# View environment variables
heroku config

# Reset database
heroku config:unset MONGODB_URI
heroku config:set MONGODB_URI="new_connection_string"
```

---

## Option 2: Docker + Any Cloud Platform

### Create Dockerfile

```dockerfile
FROM node:18-alpine

WORKDIR /app

# Copy package files
COPY package*.json ./

# Install dependencies
RUN npm ci --only=production

# Copy application
COPY src ./src

# Expose port
EXPOSE 5000

# Health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
  CMD node -e "require('http').get('http://localhost:5000/health', (r) => {if (r.statusCode !== 200) throw new Error(r.statusCode)})"

# Start app
CMD ["node", "src/server.js"]
```

### Create docker-compose.yml

```yaml
version: '3.8'

services:
  api:
    build: .
    ports:
      - "5000:5000"
    environment:
      - MONGODB_URI=${MONGODB_URI}
      - JWT_SECRET=${JWT_SECRET}
      - NODE_ENV=production
      - CORS_ORIGIN=${CORS_ORIGIN}
    restart: unless-stopped
```

### Build and Run
```bash
# Build image
docker build -t advocate-pro-backend .

# Run container
docker run -p 5000:5000 \
  -e MONGODB_URI="mongodb+srv://..." \
  -e JWT_SECRET="your_secret" \
  advocate-pro-backend
```

---

## Option 3: AWS EC2

### Prerequisites
- AWS account
- EC2 key pair

### Steps

1. **Launch EC2 Instance**
   - OS: Ubuntu 22.04 LTS
   - Instance type: t2.micro (free tier)
   - Security group: Allow SSH (22), HTTP (80), HTTPS (443), Custom (5000)

2. **Connect to Instance**
   ```bash
   ssh -i your-key.pem ubuntu@your-ec2-ip
   ```

3. **Install Dependencies**
   ```bash
   sudo apt update
   sudo apt install nodejs npm nginx -y
   ```

4. **Clone and Setup**
   ```bash
   cd /var/www
   git clone your-repo-url advocate-pro
   cd advocate-pro/Backend
   npm install --production
   ```

5. **Setup Environment**
   ```bash
   sudo cp .env.example /etc/advocate-pro/.env
   sudo nano /etc/advocate-pro/.env
   # Add your MongoDB URI and JWT secret
   ```

6. **Install PM2 (Process Manager)**
   ```bash
   sudo npm install -g pm2
   pm2 start src/server.js --name "advocate-pro"
   pm2 startup
   pm2 save
   ```

7. **Setup Nginx Reverse Proxy**
   ```bash
   sudo nano /etc/nginx/sites-available/advocate-pro
   ```

   Add:
   ```nginx
   server {
     listen 80;
     server_name your-domain.com;

     location / {
       proxy_pass http://localhost:5000;
       proxy_http_version 1.1;
       proxy_set_header Upgrade $http_upgrade;
       proxy_set_header Connection 'upgrade';
       proxy_set_header Host $host;
       proxy_cache_bypass $http_upgrade;
     }
   }
   ```

8. **Enable Site**
   ```bash
   sudo ln -s /etc/nginx/sites-available/advocate-pro /etc/nginx/sites-enabled/
   sudo nginx -t
   sudo systemctl restart nginx
   ```

9. **Setup SSL (Let's Encrypt)**
   ```bash
   sudo apt install certbot python3-certbot-nginx -y
   sudo certbot --nginx -d your-domain.com
   ```

---

## Option 4: Google Cloud Run

### Prerequisites
- Google Cloud account
- Cloud SDK installed
- Docker

### Steps

1. **Build and Push Image**
   ```bash
   gcloud builds submit --tag gcr.io/PROJECT-ID/advocate-pro
   ```

2. **Deploy to Cloud Run**
   ```bash
   gcloud run deploy advocate-pro \
     --image gcr.io/PROJECT-ID/advocate-pro \
     --platform managed \
     --region us-central1 \
     --set-env-vars MONGODB_URI="mongodb+srv://...",JWT_SECRET="...",CORS_ORIGIN="..."
   ```

3. **View Logs**
   ```bash
   gcloud run logs read advocate-pro --limit 50
   ```

---

## Option 5: Azure App Service

### Prerequisites
- Azure account
- Azure CLI installed

### Steps

1. **Create Resource Group**
   ```bash
   az group create --name advocate-pro --location eastus
   ```

2. **Create App Service Plan**
   ```bash
   az appservice plan create --name advocate-pro-plan --resource-group advocate-pro --sku B1 --is-linux
   ```

3. **Create Web App**
   ```bash
   az webapp create --resource-group advocate-pro \
     --plan advocate-pro-plan \
     --name your-app-name \
     --runtime "NODE|18"
   ```

4. **Configure Environment Variables**
   ```bash
   az webapp config appsettings set --resource-group advocate-pro \
     --name your-app-name \
     --settings MONGODB_URI="mongodb+srv://..." JWT_SECRET="..." NODE_ENV="production"
   ```

5. **Deploy from Git**
   ```bash
   az webapp deployment source config-zip --resource-group advocate-pro \
     --name your-app-name \
     --src app.zip
   ```

---

## Post-Deployment Checklist

- [ ] MongoDB Atlas firewall rules allow deployment IP
- [ ] Environment variables are set correctly
- [ ] CORS_ORIGIN matches frontend URL
- [ ] SSL certificate is installed (HTTPS)
- [ ] Health check endpoint `/health` returns 200
- [ ] Test sign-up endpoint
- [ ] Test login endpoint
- [ ] Monitor logs for errors
- [ ] Setup automatic backups for MongoDB
- [ ] Enable monitoring and alerts

---

## Monitoring & Logging

### MongoDB Atlas Monitoring
1. Go to [MongoDB Atlas Dashboard](https://cloud.mongodb.com)
2. Select your cluster
3. Go to "Monitoring"
4. Review:
   - Query performance
   - Database size
   - Connection count
   - CPU/Memory usage

### Application Monitoring

**Using PM2 (if using EC2)**
```bash
pm2 monit
pm2 logs advocate-pro
```

**Using Cloud Provider Tools**
- Heroku: Dashboard → Resources → View Logs
- AWS CloudWatch: Services → Monitoring → Logs
- Google Cloud: Logging → Cloud Logging
- Azure: App Service → Log Stream

---

## Performance Optimization

### MongoDB
```bash
# Index creation
db.users.createIndex({ tenantId: 1, email: 1 }, { unique: true })
db.tenants.createIndex({ slug: 1 })
```

### Node.js
```bash
# Increase file descriptors (Linux)
ulimit -n 65000

# Enable gzip compression
npm install compression
```

In `server.js`:
```javascript
const compression = require('compression');
app.use(compression());
```

### Caching (Optional)
```javascript
// Install Redis
npm install redis

// Add caching layer
const redis = require('redis');
const client = redis.createClient();
```

---

## Security Checklist

- [ ] Change JWT_SECRET from example value
- [ ] Use HTTPS only (not HTTP)
- [ ] Set secure CORS_ORIGIN
- [ ] Enable MongoDB IP whitelist
- [ ] Use strong MongoDB password
- [ ] Enable MFA on MongoDB Atlas
- [ ] Regular security updates
- [ ] Monitor failed login attempts
- [ ] Implement rate limiting
- [ ] Use environment-specific secrets

---

## Scaling Strategy

### Vertical Scaling
- Increase server resources (CPU, RAM)
- Works for small to medium traffic

### Horizontal Scaling
- Load balancer (Nginx, AWS ALB)
- Multiple app instances
- Shared MongoDB Atlas

Example with PM2:
```bash
pm2 start src/server.js -i max  # Start one process per CPU core
```

---

## Backup & Recovery

### MongoDB Atlas Backups
1. Dashboard → Backup
2. Enable Continuous Backups (M10+)
3. Or set up scheduled backups

### Manual Backup
```bash
mongodump --uri "mongodb+srv://user:pass@cluster.mongodb.net/advocate-pro" --out ./backup
```

### Restore from Backup
```bash
mongorestore --uri "mongodb+srv://user:pass@cluster.mongodb.net/advocate-pro" ./backup
```

---

## Rollback Strategy

1. **Keep Previous Deployment**
   ```bash
   # Heroku
   heroku releases
   heroku rollback v42  # Go back to specific version
   ```

2. **Database Migration**
   - Never delete old collections
   - Create new versioned collections
   - Keep migration scripts

---

## Cost Estimation (Monthly)

| Component | Tier | Cost |
|-----------|------|------|
| MongoDB Atlas | M0 (Free) | $0 |
| Heroku | Free (limited) | $0 |
|  | Standard 1x | ~$7 |
| AWS EC2 | t2.micro (free tier) | $0 |
|  | t2.small | ~$10 |
| Google Cloud Run | 1M requests | $0 |
| Azure App Service | B1 | ~$12 |

**Total for startup**: $0-15/month

---

## Support & Troubleshooting

### Common Deployment Issues

**Connection Timeout**
- Check firewall rules
- Verify IP whitelist
- Test MongoDB connection

**High CPU Usage**
- Check slow queries
- Add indexes
- Increase server resources

**Memory Leak**
- Monitor with: `pm2 monit`
- Check for unresolved promises
- Review event listeners

---

**Deployment Complete!** 🚀

Your Advocate Pro Backend is now live!
