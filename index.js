const path = require("path");
const express = require("express");
// require("dotenv").config();
const dotenv = require("dotenv");

const bodyParser = require("body-parser");
const cookieParser = require("cookie-parser");

const routers = require("./router/index");
const customErrorHandller = require("./middlewares/customErrorHandler");

dotenv.config();

const PORT = process.env.PORT || 4000;

const app = express();

app.set("views", path.join(__dirname, "views"));
app.set("view engine", "pug");

app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));
app.use(cookieParser());
app.use("/", routers);

app.use(express.static(path.join(__dirname, "public")));

app.use(customErrorHandller);

app.use((req, res, next) => {
    res.redirect("/");
});
app.listen(PORT, () => {
    console.log(`App started on http://localhost:${PORT}`);
});
