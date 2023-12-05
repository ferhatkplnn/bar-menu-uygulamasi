const CustomError = require("../helpers/CustomError");
const jwt = require("jsonwebtoken");
const {
    isTokenIncluded,
    getAcessTokenFromCookie,
} = require("../helpers/tokenHelpers");
const asyncErrorWrapper = require("express-async-handler");

////////////////////////////////////////////////
const getAccessToRoute = asyncErrorWrapper(async (req, res, next) => {
    if (!isTokenIncluded(req)) {
        return next(
            new CustomError("You are not authorized to access this router", 401)
        );
    }

    const { JWT_SECRET_KEY } = process.env;
    const accessToken = getAcessTokenFromCookie(req);

    jwt.verify(accessToken, JWT_SECRET_KEY, (err, decoded) => {
        if (err) {
            return next(new CustomError("You are not authorization.", 401));
        }

        req.user = {
            id: decoded.id,
            name: decoded.name,
        };
        next();
    });
});
////////////////////////////////
const getUserSessionInfo = asyncErrorWrapper(async (req, res, next) => {
    if (!isTokenIncluded) {
        return next();
    }

    const { JWT_SECRET_KEY } = process.env;
    const accessToken = getAcessTokenFromCookie(req);

    jwt.verify(accessToken, JWT_SECRET_KEY, (err, decoded) => {
        if (err) {
            return next();
        }

        res.locals.userSession = {
            id: decoded.id,
            name: decoded.name,
        };
        next();
    });
});

const loginControl = asyncErrorWrapper(async (req, res, next) => {
    if (!isTokenIncluded(req)) {
        return next();
    }

    const { JWT_SECRET_KEY } = process.env;
    const accessToken = getAcessTokenFromCookie(req);

    jwt.verify(accessToken, JWT_SECRET_KEY, (err, decoded) => {
        if (err) {
            return next(new CustomError("You are not authorization.", 401));
        }

        req.user = {
            id: decoded.id,
            name: decoded.name,
        };
        res.redirect("/menucontrol");
    });
});

const turkishToEnglishMap = {
    ı: "i",
    ğ: "g",
    ü: "u",
    ş: "s",
    ö: "o",
    ç: "c",
    İ: "I",
    Ğ: "G",
    Ü: "U",
    Ş: "S",
    Ö: "O",
    Ç: "C",
};

const convertTurkishEnglish = asyncErrorWrapper(async (req, res, next) => {
    if (req.body) {
        for (const [key, value] of Object.entries(req.body)) {
            if (typeof value === "string") {
                req.body[key] = value.replace(
                    /[ığüşöçİĞÜŞÖÇ]/g,
                    (char) => turkishToEnglishMap[char]
                );
            }
        }
    }

    next();
});

module.exports = {
    getAccessToRoute,
    getUserSessionInfo,
    loginControl,
    convertTurkishEnglish,
};
