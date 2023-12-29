const { JWT_SECRET } = process.env;

if (!JWT_SECRET) {
  throw new Error('JWT_SECRET is not defined on environments');
}

export const jwtSecret = JWT_SECRET;
