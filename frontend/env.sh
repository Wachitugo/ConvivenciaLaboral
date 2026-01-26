#!/bin/sh
# Recreate config file
rm -rf /usr/share/nginx/html/env-config.js
touch /usr/share/nginx/html/env-config.js

# Add assignment
echo "window._env_ = {" >> /usr/share/nginx/html/env-config.js

# In production, we use Nginx proxy, so we don't set VITE_API_URL
# This forces the app to use relative URLs (/api/v1) which are proxied by Nginx
# Only include GOOGLE_CLIENT_ID for OAuth
echo "  VITE_GOOGLE_CLIENT_ID: \"$VITE_GOOGLE_CLIENT_ID\"" >> /usr/share/nginx/html/env-config.js

echo "}" >> /usr/share/nginx/html/env-config.js

