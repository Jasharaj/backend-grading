# Backend Grading Platform

This is the backend for the AI Grading Platform. It provides REST APIs for assignments, grading, authentication, and user management (students, faculty, TAs).

## Features
- User authentication (JWT)
- Assignment and grading management
- Faculty, TA, and student APIs
- MongoDB database (Atlas or local)
- Cloudinary integration for file uploads

## Getting Started

### 1. Clone the repository
```sh
git clone https://github.com/Jasharaj/backend-grading.git
cd backend-grading
```

### 2. Install dependencies
```sh
npm install
```

### 3. Environment Variables
Create a `.env` file in the root directory. Example:
```env
PORT=5000
MONGO_URL=your_mongodb_connection_string
JWT_SECRET_KEY=your_jwt_secret
CLOUDINARY_CLOUD_NAME=your_cloud_name
CLOUDINARY_API_KEY=your_api_key
CLOUDINARY_API_SECRET=your_api_secret
CLOUDINARY_URL=your_cloudinary_url
```
**Never commit your `.env` file or secrets to GitHub!**

### 4. Run the server
```sh
node index.js
```

## Project Structure
- `Controllers/` - API controllers
- `models/` - Mongoose schemas
- `Routes/` - Express routes
- `auth/` - Authentication middleware

## Contributing
Pull requests are welcome. For major changes, please open an issue first.

## License
[MIT](LICENSE)
