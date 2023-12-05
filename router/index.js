const router = require("express").Router();
const fs = require("fs");
const path = require("path");
const profileImageUpload = require("../middlewares/profileImageUpload");
const {
    getUserSessionInfo,
    getAccessToRoute,
    loginControl,
    convertTurkishEnglish,
} = require("../middlewares/auth");
const {
    renderLoginPage,
    renderMenuPage,
    renderMenuControlPage,
    login,
    setMenu,
    logout,
    getImageFiles,
    deleteImage,
    getImageNames,
    postAdisyon,
    switchMenu,
    postProducts,
    postCloseDesk,
    postCloseProduct,
    postDelProduct,
    postFullAdisyon,
    postTransferProducts,
    postSingleProduct,
    clearDesks,
    setDefaultMenu,
    changeRandomProduct,
    stopChangeRandomProduct,
    renderAutoMenuControl,
} = require("../controller/menuController");

router.use(getUserSessionInfo);
router.use(convertTurkishEnglish);
router.use((req, res, next) => {
    // Burada isteği kontrol edebilir veya işleyebilirsiniz
    if (req.url === "/desksadmin.html") {
        getAccessToRoute(req, res, next);
    } else {
        next();
    }
});
router.get("/", renderMenuPage);

router.get("/menucontrol", getAccessToRoute, renderMenuControlPage);
// router.get("/menucontrol", renderMenuControlPage);
// router.get("/menucontroladmin", renderMenuControlPage);
router.post("/menucontrol", getAccessToRoute, setMenu);
// router.post("/menucontrol", setMenu);

router.post("/login", login);
router.get("/login", loginControl, renderLoginPage);

router.get("/logout", logout);

router.post(
    "/upload",
    getAccessToRoute,
    profileImageUpload.single("profile_image"),
    (req, res, next) => {
        res.redirect("/upload");
    }
);
// router.post(
//     "/upload",

//     profileImageUpload.single("profile_image"),
//     (req, res, next) => {
//         res.redirect("/upload");
//     }
// );
router.get("/upload", getAccessToRoute, getImageFiles, (req, res, next) => {
    res.render("imageUpload", { imageFiles: req.imageFiles });
});
// router.get("/upload", getImageFiles, (req, res, next) => {
//     res.render("imageUpload", { imageFiles: req.imageFiles });
// });

router.delete(
    "/dell/:imageName",
    getAccessToRoute,
    deleteImage,
    (req, res, next) => {
        res.status(200).json({ message: "Image deleted successfully" });
    }
);
// router.delete(
//     "/dell/:imageName",

//     deleteImage,
//     (req, res, next) => {
//         res.status(200).json({ message: "Image deleted successfully" });
//     }
// );

router.get("/imageNames", getImageNames);

router.get("/menuswitch/:isBar", switchMenu);
// router.get("/menuswitch/:isBar", getAccessToRoute, switchMenu);

router.post("/products", postProducts);

router.post("/postadisyon", postAdisyon);

router.post("/postclosedesk", postCloseDesk);
router.post("/closeproduct", postCloseProduct);
router.post("/delproduct", postDelProduct);
router.post("/postfulladisyon", postFullAdisyon);
router.post("/transverproducts", postTransferProducts);

router.post("/singleproduct", postSingleProduct);

router.get("/cleardesks", clearDesks);
router.get("/setdefaultmenu", setDefaultMenu);

router.get("/automenucontrol", getAccessToRoute, renderAutoMenuControl);
router.get("/start-random-product/:time", changeRandomProduct);
router.get("/stop-random-product", stopChangeRandomProduct);

module.exports = router;
