# Nginx deployment templates

Official first beta deployment strategy: **PM2 + Nginx**.

These templates are the supported VPS beta path. Docker/Caddy files in this repository are kept as Future Alternative Deployment / Experimental assets and should not be used for the first beta unless the release owner explicitly changes the deployment strategy.

These templates expose the three local PM2 processes through public domains:

- Website: `YOUR_DOMAIN.com` -> `127.0.0.1:3000`
- Admin: `admin.YOUR_DOMAIN.com` -> `127.0.0.1:3001`
- API: `api.YOUR_DOMAIN.com` -> `127.0.0.1:4000`

Use them on the VPS after DNS records point to the server:

```bash
sudo cp deploy/nginx/website.conf /etc/nginx/sites-available/egitim-gurmesi-website.conf
sudo cp deploy/nginx/admin.conf /etc/nginx/sites-available/egitim-gurmesi-admin.conf
sudo cp deploy/nginx/api.conf /etc/nginx/sites-available/egitim-gurmesi-api.conf

sudo sed -i 's/YOUR_DOMAIN.com/example.com/g' /etc/nginx/sites-available/egitim-gurmesi-*.conf

sudo ln -s /etc/nginx/sites-available/egitim-gurmesi-website.conf /etc/nginx/sites-enabled/
sudo ln -s /etc/nginx/sites-available/egitim-gurmesi-admin.conf /etc/nginx/sites-enabled/
sudo ln -s /etc/nginx/sites-available/egitim-gurmesi-api.conf /etc/nginx/sites-enabled/

sudo nginx -t
sudo systemctl reload nginx
```

After Nginx is serving HTTP, issue SSL certificates:

```bash
sudo certbot --nginx -d example.com -d www.example.com -d admin.example.com -d api.example.com
```
