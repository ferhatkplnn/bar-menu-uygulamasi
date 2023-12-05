function setDefaultMenu() {
    let prompts = prompt(`Menuyu sifirlamak istiyorsaniz "Sifirla" yazin.`);

    if (!(prompts === "Sifirla")) {
        return;
    }
    const apiUrl = "/setdefaultmenu";

    // Fetch ile GET isteği oluşturun
    fetch(apiUrl)
        .then((response) => {
            if (!response.ok) {
                throw new Error("HTTP Hata " + response.status);
            }
            setTimeout(function () {
                location.reload();
            }, 300);
            return response.json();
        })
        .then((data) => {
            console.log(data);
        })
        .catch((error) => {
            console.error("Bir hata oluştu: ", error);
        });
}

function delInput(button) {
    button.parentElement.parentElement.remove();
}

function initializeMenuSwitcher() {
    const menuSwitcher = document.getElementById("menuSwitcher");

    fetch("menu.json")
        .then((response) => response.json())
        .then((data) => {
            menuSwitcher.checked = data.isBar === "true" ? true : false;
        })
        .catch((error) => console.error(error));

    menuSwitcher.addEventListener("change", function () {
        const url = `/menuswitch/${menuSwitcher.checked}`;
        fetch(url, { method: "GET" })
            .then((res) => res.json())
            .then((data) => {
                if (data.message === "successful") {
                    location.reload();
                }
            })
            .catch((err) => console.error(err));
    });
}

function addMenuInputValue(products) {
    fetch("imageNames")
        .then((res) => res.json())
        .then((imageNameList) => {
            createMenuElements(imageNameList);
        })
        .catch((err) => console.error(err));

    function createMenuElements(imageNames) {
        for (const product of products) {
            const options = imageNames.map((imageName) => {
                return `<option value="${imageName}">${imageName}</option>`;
            });

            const productHtml = `
          <div class="row mb-3">
            <div class="col-sm">
              <select class="form-select form-select-sm" name="imageName">
                <option value=${product["imageName"]} selected>${
                product["imageName"]
            }</option>
                ${options.join("")}
              </select>
            </div>
            <div class="col-sm-6">
              <input type="text" class="form-control" name="productName" placeholder="Ürün Adı" value="${
                  product["productName"]
              }">
            </div>
            <div class="col-sm">
              <input type="number" class="form-control" name="productPrice" placeholder="Fiyat" value="${
                  product["productPrice"]
              }">
            </div>
            <div class="col-sm">
              <input type="number" class="form-control" name="oldPrice" placeholder="Eski Fiyat" value="${
                  product["oldPrice"]
              }">
            </div>
            <div class="col-sm">
            <input type="number" class="form-control" name="indirim" placeholder="Indirim araligi" value="${
                product["indirim"]
            }">
          </div>
            <div class="col-sm">
              <button type="button" class="btn btn-danger btn-remove" onclick="delInput(this)">Sil</button>
            </div>
          </div>
        `;

            const productInputs = document.getElementById("productInputs");
            productInputs.innerHTML += productHtml;
        }
    }
}

function addAddButtonEvent() {
    fetch("imageNames")
        .then((res) => res.json())
        .then((imageNameList) => {
            addInput(imageNameList);
        })
        .catch((err) => console.error(err));

    function addInput(imageNameList) {
        const options = imageNameList.map((imageName) => {
            return `<option value="${imageName}">${imageName}</option>`;
        });

        document
            .querySelector(".btn-add")
            .addEventListener("click", function () {
                let productInputs = document.querySelector("#productInputs");
                let newProductInput = document.createElement("div");
                newProductInput.classList.add("row", "mb-3");
                newProductInput.innerHTML = `<div class="col-sm">
                <select class="form-select form-select-sm" name="imageName">
                  <option ></option>
                  ${options.join("")}
                </select>
                    </div>
                    <div class="col-sm-6">
                    <input type="text" class="form-control" name="productName" placeholder="Ürün Adı">
                    </div>
                    <div class="col-sm">
                    <input type="number" class="form-control" name="productPrice" placeholder="Fiyat">
                    </div>
                    <div class="col-sm">
                    <input type="number" class="form-control" name="oldPrice" placeholder="Eski Fiyat">
                    </div>
                    <div class="col-sm">
                    <input type="number" class="form-control" name="indirim" placeholder="Indirim araligi">
                    </div>
                    <div class="col-sm">
                    <button type="button" class="btn btn-danger btn-remove">Sil</button>
                    </div>`;
                productInputs.appendChild(newProductInput);
                newProductInput
                    .querySelector(".btn-remove")
                    .addEventListener("click", function () {
                        newProductInput.remove();
                    });
            });
    }
}

function deleteFlight(id) {
    const url = `/dell/${id}`;

    fetch(url, {
        method: "DELETE",
    })
        .then((response) => {
            document.getElementById(id).remove();
        })
        .catch((error) => {
            console.log(error);
        });
}

function getMenu(callback) {
    fetch("menu.json")
        .then((response) => response.json())
        .then((data) => {
            let products = data.menu;
            if (data.isBar === "true") {
                products = data.barMenu;
            } else {
                products = data.kafeMenu;
            }
            callback(products);
        })
        .catch((error) => console.error(error));
}

function createClock() {
    const clock = document.getElementById("time");
    setInterval(function () {
        clock.innerHTML = getFormattedTime();
    }, 1000);
}

function createMenu(products) {
    const productList = document.getElementById("product-menu-list");
    let isRowLight = true;
    let counter = 0;
    let lastChangedItem = { date: 0 };

    productList.innerHTML = "";

    products.forEach((product) => {
        if (
            product.date > lastChangedItem.date &&
            product.productPrice - product.oldPrice < 0
        ) {
            lastChangedItem = product;
        }

        const productDiv = document.createElement("div");
        productDiv.className = "row";

        const priceDiff = product["productPrice"] - product["oldPrice"];
        const priceDiffAbs = Math.abs(priceDiff);
        const priceDiffPercentage = calculatePercentage(product);

        let arrowClass, priceChangeClass;

        if (priceDiff > 0) {
            arrowClass = "arrow-up";
            priceChangeClass = isRowLight ? "red1" : "red2";
        } else if (priceDiff < 0) {
            arrowClass = "arrow-down";
            priceChangeClass = isRowLight ? "green2" : "green1";
        }

        productDiv.innerHTML = `
  <div class="cell"><img style="max-width: 30px;" src="../uploads/${
      product["imageName"]
  }" alt=""></div>
  <div class="cell">${product["productName"]}</div>
  <div class="cell">${product["productPrice"]}TL</div>
  <div class="cell increase">
    <div class="${arrowClass}"></div>
  </div>
  <div class="cell ${priceChangeClass}">
    ${priceDiff == 0 ? "" : priceDiff > 0 ? "+" : "-"}${priceDiffAbs}TL
  </div>
  <div class="cell ${priceChangeClass}">
    ${priceDiff == 0 ? "" : priceDiff > 0 ? "+" : "-"}${priceDiffPercentage}%

  </div>`;

        productList.appendChild(productDiv);
        counter = (counter + 1) % 2;
        if (counter == 0) {
            isRowLight = !isRowLight;
        }
    });

    const kayanYazi = document.querySelector(".kayan-yazi");
    kayanYazi.innerHTML = `
    ${lastChangedItem.productName} ${lastChangedItem.productPrice}TL <img src="instagramLogo.png" alt="Resim açıklaması"  style="position: relative; top: 50px;">`;
}

function calculatePercentage(product) {
    const priceDiff = product["productPrice"] - product["oldPrice"];
    const percentage = (priceDiff / product["oldPrice"]) * 100;
    const roundedPercentage = Math.abs(percentage).toFixed(1);
    const formattedPercentage =
        roundedPercentage % 1 === 0
            ? roundedPercentage.split(".")[0]
            : roundedPercentage;

    return formattedPercentage;
}

function getFormattedTime() {
    const currentDate = new Date();
    const hours = addLeadingZero(currentDate.getHours());
    const minutes = addLeadingZero(currentDate.getMinutes());
    const seconds = addLeadingZero(currentDate.getSeconds());

    return `${hours}:${minutes}:${seconds}`;
}

function addLeadingZero(value) {
    return value < 10 ? "0" + value : value;
}
