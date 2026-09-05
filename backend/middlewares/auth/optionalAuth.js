const optionalAuth = async (req, res, next) => {
  const authHeader = req.headers.authorization;
  
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    req.user = null;
    return next();
  }
  
  try {
    const token = authHeader.split(' ')[1];
    const accessSecret = process.env.JWT_ACCESS_SECRET;
    
    if (!accessSecret) {
      req.user = null;
      return next();
    }
    
    const decoded = verifyToken(token, accessSecret, 'access');
    const user = User.findById(decoded.payload.id); // حذف await
    
    if (user && user.isActive) {
      req.user = {
        id: user.id,
        username: user.username,
        email: user.email,
        role: user.role,
        permissions: user.permissions || []
      };
    } else {
      req.user = null;
    }
  } catch (error) {
    req.user = null;
  }
  
  next();
};
