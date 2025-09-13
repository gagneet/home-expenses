# Financial Statement Analyzer - Complete Setup Guide

This guide provides step-by-step instructions for setting up the Financial Statement Analyzer application, including resolving common errors and running both the frontend and backend components.

## Project Structure

The project consists of two main parts:

1. **Frontend**: React application with TypeScript
2. **Backend**: Node.js/Express API with TypeScript

## Prerequisites

- [Node.js](https://nodejs.org/) v16 or later
- [npm](https://www.npmjs.com/) or [yarn](https://yarnpkg.com/)
- [Docker](https://www.docker.com/) and [Docker Compose](https://docs.docker.com/compose/) (optional, for containerized development)

## Option 1: Local Development Setup

### Frontend Setup

1. **Create React App with TypeScript**

```bash
npx create-react-app frontend --template typescript
cd frontend
```

2. **Install Dependencies**

```bash
npm install axios react-dropzone recharts
npm install -D tailwindcss postcss autoprefixer
```

3. **Initialize Tailwind CSS**

```bash
npx tailwindcss init -p
```

4. **Update Tailwind Configuration**

Update `tailwind.config.js`:

```js
module.exports = {
  content: [
    "./src/**/*.{js,jsx,ts,tsx}",
  ],
  theme: {
    extend: {},
  },
  plugins: [],
}
```

5. **Add Tailwind Directives**

Add to `src/index.css`:

```css
@tailwind base;
@tailwind components;
@tailwind utilities;
```

6. **Create Required Directories**

```bash
mkdir -p src/components/dashboard src/components/upload src/services src/types
```

7. **Copy Component Files**

Copy all the provided component files to their respective locations:

- `src/types/index.ts`
- `src/services/api.ts`
- `src/components/dashboard/Dashboard.tsx`
- `src/components/dashboard/Summary.tsx`
- `src/components/dashboard/CategoryTable.tsx` 
- `src/components/dashboard/TransactionList.tsx`
- `src/components/dashboard/MonthlyTrendChart.tsx`
- `src/components/upload/FileUploadSimple.tsx`
- `src/App.tsx`

8. **Start the Frontend Application**

```bash
npm start
```

The React app should now be running at http://localhost:3000.

### Backend Setup

1. **Create Backend Directory and Initialize**

```bash
mkdir backend
cd backend
npm init -y
```

2. **Install Dependencies**

```bash
npm install express cors multer
npm install -D typescript ts-node-dev @types/node @types/express @types/cors @types/multer
```

3. **Create TypeScript Configuration**

Create `tsconfig.json`:

```json
{
  "compilerOptions": {
    "target": "es2016",
    "module": "commonjs",
    "outDir": "./dist",
    "rootDir": "./src",
    "strict": true,
    "esModuleInterop": true,
    "skipLibCheck": true,
    "forceConsistentCasingInFileNames": true
  },
  "include": ["src/**/*"],
  "exclude": ["node_modules", "**/*.test.ts"]
}
```

4. **Update package.json Scripts**

Add to `package.json`:

```json
"scripts": {
  "build": "tsc",
  "start": "node dist/index.js",
  "dev": "ts-node-dev --respawn src/index.ts"
}
```

5. **Create Source Directory and Copy Index File**

```bash
mkdir -p src uploads
```

Copy the provided `src/index.ts` file.

6. **Start the Backend Server**

```bash
npm run dev
```

The backend API should now be running at http://localhost:4000.

## Option 2: Docker Development Setup

1. **Create Docker Configuration Files**

Create the following files:
- `docker-compose.yml` (from docker-compose-dev)
- `frontend/Dockerfile.dev`
- `backend/Dockerfile.dev`

2. **Start Development Environment**

```bash
docker-compose up --build
```

This will start both the frontend and backend services with hot reload enabled.

## Resolving Common Errors

### TypeScript Errors

If you see TypeScript errors like "Cannot find module" or similar:

1. **Check Module Installation**

Make sure all required npm packages are installed:

```bash
# In frontend directory
npm install axios react-dropzone recharts

# In backend directory
npm install express cors multer
```

2. **Check File Existence**

Ensure all required files exist at the correct paths.

3. **Fix Import Paths**

Make sure import paths match your project structure.

4. **TypeScript Parameter Error**

If you see errors about parameter types in FileUpload component, add explicit type annotations:

```typescript
onUploadProgress: (progressEvent: {loaded: number; total?: number}) => {
  // ...
}
```

5. **Restart Development Server**

After making changes, restart your development server to see if errors are resolved.

## Using the Application

1. **Upload Screen**:
   - Select a bank from the dropdown
   - Choose PDF or CSV statement files using the file input
   - Click "Upload Statements"

2. **Dashboard Screen**:
   - View the summary cards (income, expenses, savings)
   - Explore the category breakdown
   - Review the transaction list
   - Filter by category by clicking on category names

## Next Steps

After getting the MVP running, you can enhance it by:

1. **Implementing Real PDF Parsing**:
   Replace the mock data with actual PDF parsing using libraries like pdf-parse or pdf.js

2. **Adding Authentication**:
   Implement user accounts and secure access to financial data

3. **Enhancing Visualizations**:
   Improve the charts with more interactive features and detailed data

4. **Adding Machine Learning**:
   Implement smarter transaction categorization using ML techniques

5. **Supporting More Banks**:
   Add parsers for additional bank statement formats

## Troubleshooting

### Frontend Issues

- **Component Not Found**: Make sure all component files exist and import paths are correct
- **Styling Issues**: Check that Tailwind CSS is properly configured
- **API Connection Errors**: Verify the REACT_APP_API_URL environment variable is set correctly

### Backend Issues

- **Port Already in Use**: Change the port in your environment variables or stop any process using port 4000
- **File Upload Errors**: Check that the uploads directory exists and has proper permissions
- **CORS Errors**: Ensure the CORS middleware is correctly configured with your frontend origin

For any other issues, check the console logs for both frontend and backend applications.