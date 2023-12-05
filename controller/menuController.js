const fs = require("fs");
const path = require("path");
const asyncErrorWrapper = require("express-async-handler");
const { exec } = require("child_process");

const { validateUserInput } = require("../helpers/inputHelpers");
const CustomError = require("../helpers/CustomError");
const { sendJwtToClient } = require("../helpers/tokenHelpers");

const renderLoginPage = asyncErrorWrapper(async (req, res, next) => {
    res.render("login");
});

const renderMenuPage = asyncErrorWrapper(async (req, res, next) => {
    res.render("menu");
});

const renderMenuControlPage = asyncErrorWrapper(async (req, res, next) => {
    res.render("menuControl");
});

const login = asyncErrorWrapper(async (req, res, next) => {
    const { email, password } = req.body;
    let errors = undefined;

    if (!validateUserInput(email, password)) {
        return next(new CustomError("Please check your inputs", 400));
    }

    const user = {
        userName: process.env.LOGIN_USER_NAME,
        password: process.env.LOGIN_PASWORD,
    };

    if (user.userName !== email) {
        errors = "Please check your e-mail address.";
    } else if (user.password !== password) {
        errors = "Please check your password.";
    }

    if (errors !== undefined) {
        return res.render("login", {
            errors,
        });
    }

    sendJwtToClient(user, res);

    res.redirect("/menucontrol");
});

const logout = asyncErrorWrapper(async (req, res, next) => {
    return res.status(200).clearCookie("access_token").redirect("/");
});

const setMenu = asyncErrorWrapper(async (req, res, next) => {
    const data = req.body;
    const postMenu = [];

    if (Object.keys(req.body).length === 0) {
        return res.redirect("/menucontroladmin");
    }
    if (!data.productName) {
        return res.redirect("/menucontroladmin");
    }

    const existingMenu = getMenuFromJsonSync(); // Senkron olarak çağırın

    for (let i = 0; i < data.productName.length; i++) {
        const existingItem = existingMenu.find(
            (item) => item.productName === data.productName[i]
        );

        let date = Date.now();

        if (existingItem && existingItem.date) {
            if (
                existingItem.imageName === data.imageName[i] &&
                existingItem.productPrice === data.productPrice[i] &&
                existingItem.oldPrice === data.oldPrice[i]
            ) {
                date = existingItem.date;
            }
        }

        postMenu.push({
            imageName: data.imageName[i],
            productName: data.productName[i],
            productPrice: data.productPrice[i],
            oldPrice: data.oldPrice[i],
            indirim: data.indirim[i],
            date: date,
        });
    }

    const filePath = path.join(__dirname, "../public/menu.json");

    try {
        const data = fs.readFileSync(filePath, "utf-8");
        const menu = JSON.parse(data);

        let newMenu;

        if (menu.isBar === "true") {
            newMenu = { ...menu, barMenu: postMenu };
        } else {
            newMenu = { ...menu, kafeMenu: postMenu };
        }

        fs.writeFileSync(filePath, JSON.stringify(newMenu));
        res.redirect("menucontroladmin");
    } catch (err) {
        return next(
            new CustomError("Dosya işlemleri sırasında bir hata oluştu", 500)
        );
    }
});

const getMenuFromJsonSync = () => {
    const filePath = path.join(__dirname, "../public/menu.json");

    try {
        const data = fs.readFileSync(filePath, "utf-8");
        const menu = JSON.parse(data);
        const existingMenu = [];

        if (menu.isBar === "true") {
            existingMenu.push(...menu.barMenu);
        } else {
            existingMenu.push(...menu.kafeMenu);
        }

        return existingMenu;
    } catch (err) {
        throw new CustomError(
            "Dosya okuma işlemi sırasında bir hata oluştu",
            500
        );
    }
};

const deleteImage = asyncErrorWrapper(async (req, res, next) => {
    const imageName = req.params.imageName;
    const imagePath = path.join(__dirname, "../public/uploads", imageName);

    fs.unlink(imagePath, (err) => {
        if (err) {
            return next(new CustomError("Failed to delete image", 500));
        }
    });
    next();
});

const getImageFiles = asyncErrorWrapper(async (req, res, next) => {
    const imageFiles = await getFilteredFiles([
        ".jpg",
        ".jpeg",
        ".png",
        ".gif",
    ]);
    req.imageFiles = imageFiles;
    next();
});

const getImageNames = asyncErrorWrapper(async (req, res, next) => {
    const imageFiles = await getFilteredFiles([
        ".jpg",
        ".jpeg",
        ".png",
        ".gif",
    ]);
    res.status(200).json(imageFiles);
});

const getFilteredFiles = async (extensions) => {
    const folderPath = path.join(__dirname, "../public/uploads");
    const files = fs.readdirSync(folderPath);
    const imageFiles = files.filter((file) => {
        const fileExtension = path.extname(file).toLowerCase();
        return extensions.includes(fileExtension);
    });
    return imageFiles;
};

const switchMenu = asyncErrorWrapper(async (req, res, next) => {
    const isBar = req.params.isBar;

    const filePath = path.join(__dirname, "../public/menu.json");

    try {
        const data = fs.readFileSync(filePath, "utf-8");
        const menu = JSON.parse(data);
        const newMenu = { ...menu, isBar };

        fs.writeFileSync(filePath, JSON.stringify(newMenu));

        res.status(200).json({
            message: "successful",
            data: menu,
        });
    } catch (err) {
        return next(
            new CustomError("Dosya işlemleri sırasında bir hata oluştu", 500)
        );
    }
});

const postProducts = asyncErrorWrapper(async (req, res, next) => {
    const data = req.body;
    let message = "";
    if (!data.orderNote) {
        message = "error";
    } else {
        message = "successfull";
    }

    function createDeskSync(datas) {
        const { orderNote, products } = datas;
        if (!orderNote) {
            return res.redirect("/menucontroladmin");
        }

        const filePath = path.join(__dirname, "../public/masalar.json");
        const data = fs.readFileSync(filePath, "utf-8");
        const existingDesks = JSON.parse(data);

        const menuFilePath = path.join(__dirname, "../public/menu.json");
        const menuData = fs.readFileSync(menuFilePath, "utf-8");
        const existingMenu = JSON.parse(menuData);
        const newMenu = [
            ...existingMenu["kafeMenu"],
            ...existingMenu["barMenu"],
        ];

        function addOrUpdateProducts(deskName, newProducts, existingData) {
            const currentDate = Date.now();

            if (existingData.hasOwnProperty(deskName)) {
                for (const newProduct of newProducts) {
                    newMenu.find((item) => {
                        if (newProduct.name === item.productName) {
                            existingData[deskName].push({
                                name: item.productName,
                                price: item.productPrice,
                                quantity: 1,
                                date: currentDate,
                                isClosed: false,
                            });
                        }
                    });
                }
            } else {
                const productsWithDate = [];

                for (const newProduct of newProducts) {
                    newMenu.find((item) => {
                        if (newProduct.name === item.productName) {
                            productsWithDate.push({
                                name: item.productName,
                                price: item.productPrice,
                                quantity: 1,
                                date: currentDate,
                                isClosed: false,
                            });
                        }
                    });
                }
                existingData[deskName] = productsWithDate;
            }
            return existingData;
        }

        const newsExistingDesks = addOrUpdateProducts(
            orderNote,
            products,
            existingDesks
        );

        try {
            fs.writeFileSync(filePath, JSON.stringify(newsExistingDesks));
        } catch (err) {
            return next(new CustomError("Dosya yazma hatası", 500));
        }
    }

    function generateReceipt(data) {
        const { orderNote, products } = data;
        let totalAmount = 0;
        let maxLength = 0;
        const lineLength = 44;

        const formattedData = products.map((item) => {
            const itemTotal = item.price * item.quantity;
            totalAmount += itemTotal;
            const itemLength =
                item.name.length +
                item.quantity.toString().length +
                itemTotal.toFixed(2).length +
                11;
            maxLength = Math.max(maxLength, itemLength);
            return { ...item, total: itemTotal.toFixed(2) };
        });

        const currentDate = new Date();
        const currentYear = currentDate.getFullYear();
        const currentMonth = String(currentDate.getMonth() + 1).padStart(
            2,
            "0"
        );
        const currentDay = String(currentDate.getDate()).padStart(2, "0");
        const currentHour = String(currentDate.getHours()).padStart(2, "0");
        const currentMinute = String(currentDate.getMinutes()).padStart(2, "0");
        const currentSecond = String(currentDate.getSeconds()).padStart(2, "0");

        const formattedDate = `${currentYear}-${currentMonth}-${currentDay} ${currentHour}:${currentMinute}:${currentSecond}`;

        let receipt = "--------------------------------------------\n";
        receipt += "               USA WALL STREET                \n";
        receipt += "--------------------------------------------\n";
        receipt += `Masa: ${orderNote}\n`;
        receipt += `Tarih: ${formattedDate}\n`;
        receipt += "--------------------------------------------\n";

        formattedData.forEach((item) => {
            const namePadding = " ".repeat(
                maxLength -
                    (item.name.length + item.quantity.toString().length + 16)
            );
            const quantityPadding = " ".repeat(
                (6 - item.quantity.toString().length) / 2
            );
            receipt += `${item.name}${namePadding}${quantityPadding}${
                item.quantity
            }${quantityPadding}${item.total.padStart(
                14 - item.total.length,
                " "
            )} TL\n`;
        });

        receipt += "--------------------------------------------\n";
        receipt += `Toplam Tutar: ${totalAmount
            .toFixed(2)
            .padStart(lineLength - 14, " ")} TL\n`;
        receipt += "--------------------------------------------\n";

        return receipt;
    }

    const receipt = generateReceipt(data);
    createDeskSync(data);

    function runPythonCommandSync(command) {
        try {
            const { execSync } = require("child_process");
            const stdout = execSync(command);
            console.log(`Python çıktısı: ${stdout.toString()}`);
        } catch (error) {
            console.error(`Hata oluştu: ${error.message}`);
        }
    }

    const pythonCommand = `python3 ./public/print.py "${receipt}"`;
    const pythonCommand2 = `python3 ./public/print2.py "${receipt}"`;
    runPythonCommandSync(pythonCommand);
    runPythonCommandSync(pythonCommand2);

    res.status(200).json({ message: "successfull" });
});

const postAdisyon = asyncErrorWrapper(async (req, res, next) => {
    const { masaAdi, urunListesi } = req.body;

    const getMenuFromJsonDesks = () => {
        return new Promise((resolve, reject) => {
            const filePath = path.join(__dirname, "../public/masalar.json");
            fs.readFile(filePath, "utf-8", (err, data) => {
                if (err) {
                    reject(err);
                } else {
                    try {
                        const desks = JSON.parse(data);

                        var sonuc = {};

                        // JSON verisindeki anahtarları (B1, B10, S6, vb.) döngü ile dolaş
                        for (var anahtar in desks) {
                            if (desks.hasOwnProperty(anahtar)) {
                                // Her anahtarın altındaki öğeleri kontrol et
                                var altOgeler = desks[anahtar];
                                var filtrelenmisAltOgeler = altOgeler.filter(
                                    function (item) {
                                        return item.isClosed === false;
                                    }
                                );

                                // "isClosed" değeri false olan alt öğeler varsa, sonuca ekle
                                if (filtrelenmisAltOgeler.length > 0) {
                                    sonuc[anahtar] = filtrelenmisAltOgeler;
                                }
                            }
                        }

                        resolve(sonuc);
                    } catch (err) {
                        reject(err);
                    }
                }
            });
        });
    };
    const existingDesks = await getMenuFromJsonDesks();

    function generateReceipt(data) {
        const { masaAdi, urunListesi } = data;
        let totalAmount = 0;
        let maxLength = 0;
        const lineLength = 44;

        const formattedData = existingDesks[masaAdi].map((item) => {
            const itemTotal = parseInt(item.price);
            totalAmount += itemTotal;
            const itemLength =
                item.name.length +
                item.quantity.toString().length +
                itemTotal.toFixed(2).length +
                10; // Reduce the constant by 1 from 11 to 10
            maxLength = Math.max(maxLength, itemLength);
            return { ...item, total: itemTotal.toFixed(2) };
        });

        const currentDate = new Date();
        const currentYear = currentDate.getFullYear();
        const currentMonth = String(currentDate.getMonth() + 1).padStart(
            2,
            "0"
        );
        const currentDay = String(currentDate.getDate()).padStart(2, "0");
        const currentHour = String(currentDate.getHours()).padStart(2, "0");
        const currentMinute = String(currentDate.getMinutes()).padStart(2, "0");
        const currentSecond = String(currentDate.getSeconds()).padStart(2, "0");
        const formattedDate = `${currentYear}-${currentMonth}-${currentDay} ${currentHour}:${currentMinute}:${currentSecond}`;

        let receipt = "                  Adisyon                \n";
        receipt += "--------------------------------------------\n";
        receipt += "               USA WALL STREET                \n";
        receipt += "--------------------------------------------\n";
        receipt += `Masa: ${masaAdi}\n`;
        receipt += `Tarih: ${formattedDate}\n`;
        receipt += "--------------------------------------------\n";

        formattedData.forEach((item) => {
            const namePadding = " ".repeat(maxLength - (item.name.length + 14));
            const quantityPadding = " ".repeat(3); // Increase the quantity padding to 3 spaces
            receipt += `${item.name}${namePadding}   ${
                item.quantity
            }${quantityPadding}${item.total.padStart(
                14 - item.total.length,
                " "
            )} TL\n`;
        });

        receipt += "--------------------------------------------\n";
        receipt += `Toplam Tutar: ${totalAmount
            .toFixed(2)
            .padStart(lineLength - 14, " ")} TL\n`;
        receipt += "--------------------------------------------\n";

        return receipt;
    }
    const receipt = generateReceipt(req.body);

    function runPythonCommand(command) {
        exec(command, (error, stdout, stderr) => {
            if (error) {
                console.error(`Hata oluştu: ${error.message}`);
                return;
            }
            if (stderr) {
                // console.error(`Hata çıktısı: ${stderr}`);
                return;
            }
            console.log(`Python çıktısı: ${stdout}`);
        });
    }

    const pythonCommand = `python3 ./public/print.py "${receipt}"`;
    const pythonCommand2 = `python3 ./public/print2.py "${receipt}"`;

    runPythonCommand(pythonCommand);
    runPythonCommand(pythonCommand2);
    res.status(200).json({ message: "successfull" });
});

const postFullAdisyon = asyncErrorWrapper(async (req, res, next) => {
    const { masaAdi, urunListesi } = req.body;

    const getMenuFromJsonDesks = () => {
        return new Promise((resolve, reject) => {
            const filePath = path.join(__dirname, "../public/masalar.json");
            fs.readFile(filePath, "utf-8", (err, data) => {
                if (err) {
                    reject(err);
                } else {
                    try {
                        const desks = JSON.parse(data);
                        resolve(desks);
                    } catch (err) {
                        reject(err);
                    }
                }
            });
        });
    };
    const existingDesks = await getMenuFromJsonDesks();

    function generateReceipt(data) {
        const { masaAdi, urunListesi } = data;
        let totalAmount = 0;
        let maxLength = 0;
        const lineLength = 44;

        const formattedData = urunListesi.map((item) => {
            const itemTotal = item.price;
            totalAmount += itemTotal;
            const itemLength =
                item.name.length +
                item.quantity.toString().length +
                itemTotal.toFixed(2).length +
                10; // Reduce the constant by 1 from 11 to 10
            maxLength = Math.max(maxLength, itemLength);
            return { ...item, total: itemTotal.toFixed(2) };
        });

        const currentDate = new Date();
        const currentYear = currentDate.getFullYear();
        const currentMonth = String(currentDate.getMonth() + 1).padStart(
            2,
            "0"
        );
        const currentDay = String(currentDate.getDate()).padStart(2, "0");
        const currentHour = String(currentDate.getHours()).padStart(2, "0");
        const currentMinute = String(currentDate.getMinutes()).padStart(2, "0");
        const currentSecond = String(currentDate.getSeconds()).padStart(2, "0");
        const formattedDate = `${currentYear}-${currentMonth}-${currentDay} ${currentHour}:${currentMinute}:${currentSecond}`;

        let receipt = "                  Adisyon                \n";
        receipt += "--------------------------------------------\n";
        receipt += "               USA WALL STREET                \n";
        receipt += "--------------------------------------------\n";
        receipt += `Masa: ${masaAdi}\n`;
        receipt += `Tarih: ${formattedDate}\n`;
        receipt += "--------------------------------------------\n";

        formattedData.forEach((item) => {
            const namePadding = " ".repeat(maxLength - (item.name.length + 14));
            const quantityPadding = " ".repeat(3); // Increase the quantity padding to 3 spaces
            receipt += `${item.name}${namePadding}   ${
                item.quantity
            }${quantityPadding}${item.total.padStart(
                14 - item.total.length,
                " "
            )} TL\n`;
        });

        receipt += "--------------------------------------------\n";
        receipt += `Toplam Tutar: ${totalAmount
            .toFixed(2)
            .padStart(lineLength - 14, " ")} TL\n`;
        receipt += "--------------------------------------------\n";

        return receipt;
    }

    const receipt = generateReceipt(req.body);

    function runPythonCommand(command) {
        exec(command, (error, stdout, stderr) => {
            if (error) {
                console.error(`Hata oluştu: ${error.message}`);
                return;
            }
            if (stderr) {
                return;
            }
            console.log(`Python çıktısı: ${stdout}`);
        });
    }

    const pythonCommand = `python3 ./public/print.py "${receipt}"`;
    const pythonCommand2 = `python3 ./public/print2.py "${receipt}"`;

    runPythonCommand(pythonCommand);
    runPythonCommand(pythonCommand2);
    res.status(200).json({ message: "successfull" });
});

const postCloseDesk = asyncErrorWrapper(async (req, res, next) => {
    const { masaAdi } = req.body;

    const getMenuFromJsonDesksSync = () => {
        const filePath = path.join(__dirname, "../public/masalar.json");
        const data = fs.readFileSync(filePath, "utf-8");
        return JSON.parse(data);
    };
    const existingDesks = getMenuFromJsonDesksSync();

    function addOrUpdateProducts(deskName, existingData) {
        const currentDate = Date.now();
        let newExistingData = null;
        if (existingData.hasOwnProperty(deskName)) {
            existingData[deskName] = existingData[deskName].map((item) => {
                return { ...item, isClosed: true };
            });
        }
        return existingData;
    }
    const newsExistingDesks = addOrUpdateProducts(masaAdi, existingDesks);

    try {
        const filePath = path.join(__dirname, "../public/masalar.json");
        fs.writeFileSync(filePath, JSON.stringify(newsExistingDesks));
    } catch (err) {
        return next(new CustomError("Dosya yazma hatası", 500));
    }

    res.status(200).json({ message: "successfull" });
});

const postCloseProduct = asyncErrorWrapper(async (req, res, next) => {
    console.log(req.body);
    const { masaAdi, urunListesi } = req.body;

    urunListesi[0].price = parseInt(urunListesi[0].price).toFixed(0);
    urunListesi[0].date = Math.floor(
        new Date(urunListesi[0].date).getTime() / 1000
    );

    const getMenuFromJsonDesksSync = () => {
        const filePath = path.join(__dirname, "../public/masalar.json");
        const data = fs.readFileSync(filePath, "utf-8");
        return JSON.parse(data);
    };
    const existingDesks = getMenuFromJsonDesksSync();

    for (const item of existingDesks[masaAdi]) {
        if (
            urunListesi.some(
                (urun) =>
                    urun.name === item.name &&
                    urun.price === item.price &&
                    urun.date === Math.floor(item.date / 1000) &&
                    urun.isClosed === item.isClosed
            )
        ) {
            item.isClosed = true;
            break;
        }
    }

    try {
        const filePath = path.join(__dirname, "../public/masalar.json");
        fs.writeFileSync(filePath, JSON.stringify(existingDesks));
    } catch (err) {
        return next(new CustomError("Dosya yazma hatası", 500));
    }

    res.status(200).json({ message: "successfull" });
});

const postDelProduct = asyncErrorWrapper(async (req, res, next) => {
    const { masaAdi, urunListesi } = req.body;
    console.log(req.body);

    urunListesi[0].price = parseInt(urunListesi[0].price).toFixed(0);
    urunListesi[0].date = Math.floor(
        new Date(urunListesi[0].date).getTime() / 1000
    );

    const getMenuFromJsonDesksSync = () => {
        const filePath = path.join(__dirname, "../public/masalar.json");
        const data = fs.readFileSync(filePath, "utf-8");
        return JSON.parse(data);
    };
    const existingDesks = getMenuFromJsonDesksSync();

    const indexToRemove = existingDesks[masaAdi].findIndex((item) => {
        return urunListesi.some(
            (ulItem) =>
                ulItem.name === item.name &&
                ulItem.price === item.price &&
                ulItem.date === Math.floor(item.date / 1000) &&
                ulItem.isClosed === item.isClosed
        );
    });

    if (indexToRemove !== -1) {
        existingDesks[masaAdi].splice(indexToRemove, 1);
    }

    try {
        const filePath = path.join(__dirname, "../public/masalar.json");
        fs.writeFileSync(filePath, JSON.stringify(existingDesks));
    } catch (err) {
        return next(new CustomError("Dosya yazma hatası", 500));
    }

    res.status(200).json({ message: "successfull" });
});

const postTransferProducts = asyncErrorWrapper(async (req, res, next) => {
    const { gonderenMasa, aliciMasa, products } = req.body;

    const getMenuFromJsonDesksSync = () => {
        const filePath = path.join(__dirname, "../public/masalar.json");
        const data = fs.readFileSync(filePath, "utf-8");
        return JSON.parse(data);
    };
    const existingDesks = getMenuFromJsonDesksSync();

    const remainingList1 = [...existingDesks[gonderenMasa]];

    for (const item2 of products) {
        const { name, price, quantity, date, isClosed } = item2;
        let foundIndex = -1;
        for (let i = 0; i < remainingList1.length; i++) {
            const item1 = remainingList1[i];
            if (
                item1.name === name &&
                item1.price === price &&
                item1.quantity === parseInt(quantity) &&
                item1.date === parseInt(date) &&
                item1.isClosed === JSON.parse(isClosed)
            ) {
                foundIndex = i;
                break;
            }
        }
        if (foundIndex !== -1) {
            remainingList1.splice(foundIndex, 1);
        }
    }

    const newProducts = products.map((item) => {
        return {
            name: item.name,
            price: item.price,
            quantity: parseInt(item.quantity),
            date: parseInt(item.date),
            isClosed: JSON.parse(item.isClosed),
        };
    });

    const newExistingData = {
        ...existingDesks,
        [gonderenMasa]: remainingList1,
    };
    const newExistingDataFinall = {
        ...newExistingData,
        [aliciMasa]: [...existingDesks[aliciMasa], ...newProducts],
    };

    try {
        const filePath = path.join(__dirname, "../public/masalar.json");
        fs.writeFileSync(filePath, JSON.stringify(newExistingDataFinall));
    } catch (err) {
        return next(new CustomError("Dosya yazma hatası", 500));
    }

    res.status(200).json({ message: "successfull" });
});

const postSingleProduct = asyncErrorWrapper(async (req, res, next) => {
    const { productName, productPrice, deskName } = req.body;

    const getMenuFromJsonDesksSync = () => {
        const filePath = path.join(__dirname, "../public/masalar.json");
        const data = fs.readFileSync(filePath, "utf-8");
        return JSON.parse(data);
    };
    const existingDesks = getMenuFromJsonDesksSync();
    existingDesks[deskName].push({
        name: productName,
        price: productPrice,
        quantity: 1,
        date: Date.now(),
        isClosed: false,
    });

    try {
        const filePath = path.join(__dirname, "../public/masalar.json");
        fs.writeFileSync(filePath, JSON.stringify(existingDesks));
    } catch (err) {
        return next(new CustomError("Dosya yazma hatası", 500));
    }
    console.log(existingDesks);
    res.status(200).json({ message: "successfull" });
});

const clearDesks = asyncErrorWrapper(async (req, res, next) => {
    const sourceFile = path.join(__dirname, "../public/masalar.json");

    const dataToFill = "{}";

    try {
        const data = fs.readFileSync(sourceFile, "utf8");
        const desks = JSON.parse(data);

        const firstKey = Object.keys(desks)[0];

        if (firstKey === undefined) {
            return;
        }

        const firstElement = desks[firstKey];
        const targetFile = path.join(
            __dirname,
            `../public/desksHistory/${firstElement[0].date}.json`
        );

        fs.writeFileSync(targetFile, data, "utf8");

        fs.writeFileSync(sourceFile, dataToFill, "utf8");

        console.log("Hedef dosya başarıyla oluşturuldu ve dolduruldu.");
        console.log("masalar.json dosyası başarıyla dolduruldu.");
    } catch (err) {
        return next(new CustomError("Dosya işlemleri hatası", 500));
    }

    res.status(200).json({ message: "successfull" });
});

const setDefaultMenu = asyncErrorWrapper(async (req, res, next) => {
    const menuJsonPath = path.join(__dirname, "../public/menu.json");
    const defaultMenuJsonPath = path.join(
        __dirname,
        "../public/defaultMenu.json"
    );

    try {
        // defaultMenu.json dosyasını oku
        const defaultMenuData = fs.readFileSync(defaultMenuJsonPath, "utf8");

        // defaultMenu.json'dan okunan veriyi menu.json dosyasına yaz
        fs.writeFileSync(menuJsonPath, defaultMenuData, "utf8");
    } catch (error) {
        console.error("Hata oluştu: ", error);
    }

    res.status(200).json({ message: "successfull" });
});

//////////// auto product changer ////////////////////////
function getRandomDiscount(maxDiscount) {
    const randomValue = Math.floor(Math.random() * (maxDiscount + 1));
    const discountMultipleOfTen = Math.floor(randomValue / 10) * 10; // 10'un katına yuvarla
    return discountMultipleOfTen;
}

function readMenuData() {
    // JSON verilerini bir dosyadan okuyun
    const filePath = path.join(__dirname, "../public/menu.json");
    try {
        const data = fs.readFileSync(filePath, "utf8");
        return JSON.parse(data);
    } catch (error) {
        console.error("JSON dosyasını okuma hatası:", error.message);
        return null;
    }
}

function writeMenuData(data) {
    // JSON verilerini bir dosyadan okuyun
    const filePath = path.join(__dirname, "../public/menu.json");
    try {
        fs.writeFileSync(filePath, JSON.stringify(data, null, 4), "utf8");
        console.log("JSON dosyası başarıyla güncellendi.");
    } catch (error) {
        console.error("JSON dosyasını yazma hatası:", error.message);
    }
}

// Kafe menüsündeki rasgele bir ürünün productPrice değerini güncelleyen fonksiyon
function updateRandomProductPrice() {
    const menuData = readMenuData();
    const kafeMenu = menuData.kafeMenu;
    if (kafeMenu.length > 0) {
        const randomIndex = Math.floor(Math.random() * kafeMenu.length);
        const selectedProduct = kafeMenu[randomIndex];

        const maxDiscount = parseInt(selectedProduct.indirim);
        const maxIncrease = maxDiscount; // Maksimum zam, indirim değerine eşit olacak

        const oldPrice = parseInt(selectedProduct.oldPrice);

        // Rastgele bir indirim veya zam miktarı alın (indirim değerine göre sınırlı)
        const discountAmount = getRandomDiscount(maxDiscount);
        console.log("discountAmount: ", discountAmount);
        const increaseAmount = getRandomDiscount(maxIncrease);
        console.log("increaseAmount: ", increaseAmount);

        // Yeni fiyatı hesaplayın, indirim ve zam sınırlarını aşmaz
        let newPrice = oldPrice + increaseAmount - discountAmount;

        console.log("oldPrice: ", oldPrice);
        console.log("newPrice: ", newPrice);

        // Fiyatı menuData içinde güncelleyin
        menuData.kafeMenu[randomIndex].productPrice = newPrice.toString();

        console.log(
            `"${selectedProduct.productName}" ürününün yeni fiyatı: ${newPrice}`
        );

        // JSON dosyasını güncelleyin
        if (menuData) {
            writeMenuData(menuData);
        }
    }
}
let intervalId;

const changeRandomProduct = asyncErrorWrapper(async (req, res, next) => {
    const delayTime = parseInt(req.params.time);

    console.log("changeRandomProduct calisti");
    if (!intervalId) {
        intervalId = setInterval(
            updateRandomProductPrice,
            delayTime * 1000 * 60
        );
    }

    res.status(200).json({ message: "successfull" });
});

const stopChangeRandomProduct = asyncErrorWrapper(async (req, res, next) => {
    console.log("stopChangeRandomProduct calisti");

    if (intervalId) {
        clearInterval(intervalId);
        intervalId = undefined;
    }
    res.status(200).json({ message: "successfull" });
});

const renderAutoMenuControl = asyncErrorWrapper(async (req, res, next) => {
    res.render("autoMenuControl");
});
module.exports = {
    renderLoginPage,
    renderMenuPage,
    login,
    renderMenuControlPage,
    setMenu,
    logout,
    getImageFiles,
    deleteImage,
    getImageNames,
    switchMenu,
    postProducts,
    postAdisyon,
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
};
