#!/usr/bin/env node

/**
 * Warmup script to pre-compile all API routes in Next.js dev mode
 * This script automatically discovers API endpoints by scanning the app/api directory
 * Run this after starting the dev server to avoid compilation delays during trading
 */

const fs = require('fs');
const path = require('path');

const API_BASE = 'http://localhost:3000/api';
const API_DIR = path.join(process.cwd(), 'app', 'api');

/**
 * Extracts HTTP methods from a route.ts file by parsing the exported functions
 */
function extractMethodsFromRouteFile(filePath) {
  try {
    const content = fs.readFileSync(filePath, 'utf8');
    const methods = [];
    
    // Look for exported async functions that match HTTP methods
    const httpMethods = ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'HEAD', 'OPTIONS'];
    
    for (const method of httpMethods) {
      // Match patterns like: export async function GET(
      const pattern = new RegExp(`export\\s+async\\s+function\\s+${method}\\s*\\(`, 'i');
      if (pattern.test(content)) {
        methods.push(method);
      }
    }
    
    return methods;
  } catch (error) {
    console.warn(`Warning: Could not read route file ${filePath}: ${error.message}`);
    return [];
  }
}

/**
 * Recursively scans the API directory to find all route.ts files and their endpoints
 */
function discoverApiEndpoints(dir, basePath = '') {
  const endpoints = [];
  
  try {
    const items = fs.readdirSync(dir, { withFileTypes: true });
    
    for (const item of items) {
      const fullPath = path.join(dir, item.name);
      const currentPath = path.join(basePath, item.name);
      
      if (item.isDirectory()) {
        // Handle dynamic route segments by using placeholder values
        let processedPath = currentPath;
        if (item.name.startsWith('[') && item.name.endsWith(']')) {
          // Replace [param] with placeholder value
          processedPath = basePath + '/placeholder';
          console.log(`🔄 Processing dynamic route: ${currentPath} -> ${processedPath}`);
        }
        
        // Recursively scan subdirectories
        endpoints.push(...discoverApiEndpoints(fullPath, processedPath));
      } else if (item.name === 'route.ts') {
        // Found a route file - extract HTTP methods
        const methods = extractMethodsFromRouteFile(fullPath);
        const routePath = basePath || '/';
        
        for (const method of methods) {
          endpoints.push({
            method,
            path: basePath === '/' ? '' : ('/' + basePath.replace(/\\/g, '/')),
            file: path.relative(API_DIR, fullPath)
          });
        }
      }
    }
  } catch (error) {
    console.warn(`Warning: Could not scan directory ${dir}: ${error.message}`);
  }
  
  return endpoints;
}

// Discover all API endpoints automatically
console.log('🔍 Discovering API endpoints...\n');
const endpoints = discoverApiEndpoints(API_DIR);

async function warmupEndpoint(endpoint) {
  const url = `${API_BASE}${endpoint.path}`;
  console.log(`Warming up ${endpoint.method} ${url}... (${endpoint.file})`);
  
  try {
    const options = {
      method: endpoint.method,
      headers: {
        'Content-Type': 'application/json',
      },
    };

    // Send minimal valid body for POST/PUT/PATCH requests
    if (['POST', 'PUT', 'PATCH'].includes(endpoint.method)) {
      options.body = JSON.stringify({});
    }

    const response = await fetch(url, options);
    
    // Don't worry about auth errors or validation errors - we just want to compile the route
    if (response.status < 500) {
      console.log(`✓ ${endpoint.method} ${endpoint.path} - Status: ${response.status}`);
    } else {
      console.log(`⚠️  ${endpoint.method} ${endpoint.path} - Status: ${response.status} (Server Error)`);
    }
  } catch (error) {
    console.log(`✗ ${endpoint.method} ${endpoint.path} - Error: ${error.message}`);
  }
}

async function warmupAll() {
  console.log('🔥 Starting API warmup...\n');
  
  if (endpoints.length === 0) {
    console.log('⚠️  No API endpoints discovered. Make sure you have route.ts files in your app/api directory.');
    return;
  }
  
  console.log(`📊 Found ${endpoints.length} API endpoints:\n`);
  endpoints.forEach(endpoint => {
    console.log(`   ${endpoint.method.padEnd(6)} ${endpoint.path} (${endpoint.file})`);
  });
  console.log('');
  
  // Also warm up the main pages
  const pages = ['/', '/start', '/partner'];
  console.log('📄 Warming up pages...\n');
  for (const page of pages) {
    try {
      console.log(`Warming up page ${page}...`);
      await fetch(`http://localhost:3000${page}`);
      console.log(`✓ Page ${page} loaded`);
    } catch (error) {
      console.log(`✗ Page ${page} - Error: ${error.message}`);
    }
  }
  
  console.log('\n📡 Warming up API endpoints...\n');
  
  // Warm up all discovered API endpoints
  for (const endpoint of endpoints) {
    await warmupEndpoint(endpoint);
    // Small delay to avoid overwhelming the dev server
    await new Promise(resolve => setTimeout(resolve, 100));
  }
  
  console.log('\n✅ Warmup complete! Your API routes should now be compiled.\n');
  console.log('💡 Tip: Run this after starting "pnpm dev" to avoid compilation delays during trading.');
  console.log('🔄 Endpoints are automatically discovered from your app/api directory structure.');
}

// Check if dev server is running
fetch(API_BASE)
  .then(() => warmupAll())
  .catch(() => {
    console.error('❌ Error: Dev server is not running on http://localhost:3000');
    console.error('Please start the dev server first with "pnpm dev"');
    process.exit(1);
  });