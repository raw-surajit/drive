const jwt = require('jsonwebtoken');

function auth(req, res, next) {
    // 1. Get the token from cookies
    const token = req.cookies.token;

    // 2. If no token, redirect to login or send error
    if (!token) {
        return res.status(401).json({
            message: 'Unauthorized'
        });
    }

    try {
        // 3. Verify the token using your JWT_SECRET from .env
        const decoded = jwt.verify(token, process.env.JWT_SECRET);

        // 4. Attach user data to the request object
        req.user = decoded;

        // 5. Move to the next step (the route handler)
        return next();

    } catch (err) {
        return res.status(401).json({
            message: 'Unauthorized'
        });
    }
}

module.exports = auth;