const jwt = require("jsonwebtoken");
///////////////////////////////////////////
const generateJwtFromUser = function (userName) {
    const { JWT_SECRET_KEY, JWT_EXPIRE } = process.env;

    const payload = {
        name: userName,
    };

    const token = jwt.sign(payload, JWT_SECRET_KEY, { expiresIn: JWT_EXPIRE });

    return token;
};
/////////////////////////////////////////////////////
const sendJwtToClient = (user, res) => {
    // Generete JWT
    const token = generateJwtFromUser(user.userName);

    const { JWT_COOKIE, NODE_ENV } = process.env;
    return res.status(200).cookie("access_token", token, {
        httpOnly: true,
        expires: new Date(Date.now() + parseInt(JWT_COOKIE) * 1000 * 60),
        secure: NODE_ENV === "development" ? false : true,
    });
};
////////////////////////////////////////////////
const isTokenIncluded = (req) => {
    return typeof req.cookies.access_token !== "undefined";
};
///////////////////////////////////////////////
const getAcessTokenFromCookie = (req) => {
    return req.cookies.access_token;
};

module.exports = {
    sendJwtToClient,
    isTokenIncluded,
    getAcessTokenFromCookie,
};
