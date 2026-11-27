import dotenv from 'dotenv';
import path from 'path';

dotenv.config({ path: path.join(process.cwd(), '.env') });

export const envVars = {
  env: process.env.NODE_ENV || 'development',
  port: process.env.PORT || 5000,
  databaseUrl: process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/my_app_db',
  bcryptSaltRounds: Number(process.env.BCRYPT_SALT_ROUNDS) || 12,
  jwt: {
    secret: process.env.JWT_SECRET || 'super_secret_jwt_access_key_12345',
    expiresIn: process.env.JWT_EXPIRES_IN || '7d',
  },
  betterAuthSecret: process.env.BETTER_AUTH_SECRET || process.env.JWT_SECRET || 'super_secret_better_auth_key_12345',
  corsOrigin: process.env.CORS_ORIGIN || 'http://localhost:3000',
  googleMapsApiKey: process.env.GOOGLE_MAPS_API_KEY || '',
  googleClientId: process.env.Google_Client_ID || process.env.GOOGLE_CLIENT_ID || '',
  googleClientSecret: process.env.Google_Client_Secret || process.env.GOOGLE_CLIENT_SECRET || '',
  googleCallbackUrl: process.env.Google_callbackURL || process.env.GOOGLE_CALLBACK_URL || '',
};

export default envVars;
