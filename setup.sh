#!/bin/bash

# Script to initialize the project structure

# Create main directories
mkdir -p finance-calculator/{backend/app/{api,core,services,utils},frontend/src/{components,services},frontend/public}

# Create necessary __init__.py files for Python packages
touch finance-calculator/backend/app/__init__.py
touch finance-calculator/backend/app/api/__init__.py
touch finance-calculator/backend/app/core/__init__.py
touch finance-calculator/backend/app/services/__init__.py
touch finance-calculator/backend/app/utils/__init__.py

# Copy files to their appropriate locations
echo "Copying backend files..."
cp backend-main-py finance-calculator/backend/app/main.py
cp backend-security-py finance-calculator/backend/app/core/security.py
cp backend-parser finance-calculator/backend/app/services/parser.py
cp backend-endpoints finance-calculator/backend/app/api/endpoints.py
cp backend-dockerfile finance-calculator/backend/Dockerfile
cp backend-requirements finance-calculator/backend/requirements.txt

echo "Copying frontend files..."
cp frontend-app-js finance-calculator/frontend/src/App.js
cp frontend-index-js finance-calculator/frontend/src/index.js
cp frontend-index-css finance-calculator/frontend/src/index.css
cp HomeExpenseCalculator finance-calculator/frontend/src/components/HomeExpenseCalculator.jsx
cp frontend-package-json finance-calculator/frontend/package.json
cp frontend-tailwind-config finance-calculator/frontend/tailwind.config.js
cp frontend-dockerfile finance-calculator/frontend/Dockerfile
cp frontend-dockerfile-dev finance-calculator/frontend/Dockerfile.dev

echo "Copying project files..."
cp docker-compose finance-calculator/docker-compose.yml

# Create empty placeholder for index.html
cat > finance-calculator/frontend/public/index.html << 'EOF'
<!DOCTYPE html>
<html lang="en">
  <head>
    <meta charset="utf-8" />
    <link rel="icon" href="%PUBLIC_URL%/favicon.ico" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <meta name="theme-color" content="#000000" />
    <meta
      name="description"
      content="Home Expenditure Calculator - Analyze your bank statements"
    />
    <title>Home Expenditure Calculator</title>
  </head>
  <body>
    <noscript>You need to enable JavaScript to run this app.</noscript>
    <div id="root"></div>
  </body>
</html>
EOF

# Create PostCSS config
cat > finance-calculator/frontend/postcss.config.js << 'EOF'
module.exports = {
  plugins: {
    tailwindcss: {},
    autoprefixer: {},
  },
}
EOF

# Create placeholder for reportWebVitals.js
cat > finance-calculator/frontend/src/reportWebVitals.js << 'EOF'
const reportWebVitals = onPerfEntry => {
  if (onPerfEntry && onPerfEntry instanceof Function) {
    import('web-vitals').then(({ getCLS, getFID, getFCP, getLCP, getTTFB }) => {
      getCLS(onPerfEntry);
      getFID(onPerfEntry);
      getFCP(onPerfEntry);
      getLCP(onPerfEntry);
      getTTFB(onPerfEntry);
    });
  }
};

export default reportWebVitals;
EOF

# Create Nginx config for frontend production build
cat > finance-calculator/frontend/nginx.conf << 'EOF'
server {
    listen 80;
    
    # Handle all locations
    location / {
        root /usr/share/nginx/html;
        index index.html index.htm;
        try_files $uri $uri/ /index.html;
    }
    
    # Handle API proxy
    location /api/ {
        proxy_pass http://backend:8000/api/;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
    }
}
EOF

echo "Project structure created successfully!"
echo "To start the application, navigate to the finance-calculator directory and run:"
echo "docker-compose up --build"