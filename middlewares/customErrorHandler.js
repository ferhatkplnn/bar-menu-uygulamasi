const CustomError = require("../helpers/CustomError");

const customErrorHandler = (err, req, res, next) => {
    if (process.env.NODE_ENV === "development") {
        console.log(err);
    }

    let customError = err;

    if (err.name === "CastError") {
        customError = new CustomError("Please provide a valid id", 400);
    }

    if (err.name === "SyntaxError") {
        customError = new CustomError("Unexpected Syntax", 400);
    }

    if (err.name === "ValidationError") {
        customError = new CustomError(err.message, 400);
    }

    if (err.code === 11000) {
        customError = new CustomError(
            "Duplicate Key Found : Check Your Input",
            400
        );
    }

    res.locals.message = customError.message;
    res.locals.error = process.env.NODE_ENV === "development" ? err : {};

    res.status(customError.status || 500);
    res.render("error");
};

module.exports = customErrorHandler;
