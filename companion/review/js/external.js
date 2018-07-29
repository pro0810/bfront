function xhttp_get(url, callback) {
    console.log(url);
    return setTimeout(function() {callback(null, null)}, 1000);
    var xhttp;
    if (window.XMLHttpRequest) {
        xhttp = new XMLHttpRequest();
    } else {
        xhttp = new ActiveXObject("Microsoft.XMLHTTP");
    }
    xhttp.onreadystatechange = function() {
        if (this.readyState === 4){
            if (this.status !== 200) {
                callback(this.responseText);
            } else {
                callback(null, JSON.parse(this.responseText));
            }
        }
    };
    console.log(url);
    xhttp.open("GET", url, true);
    xhttp.send();
}

function get_brands() {
    return new Promise(function(resolve, reject) {
        xhttp_get('/review/lookup?type=models', function(err, body) {
            if (! err) {
                resolve(['AUDI', 'PORCHE']);
            } else {
                reject(err);
            }
        });
    });
}

function get_fueltypes(brand) {
    return new Promise(function(resolve, reject) {
        xhttp_get('/review/lookup?type=models&brand=' + brand, function (err, body) {
            if (brand === 'AUDI') {
                resolve(['BENZINE', 'DIESEL']);
            } else {
                resolve(['BENZINE']);
            }
        });
    });
}

function get_powers(brand, fueltype) {
    return new Promise(function(resolve, reject) {
        xhttp_get('/review/lookup?type=models&brand=' + brand + '&fueltype=' + fueltype, function (err, body) {
            if (! err) {
                resolve([100]);
            } else {
                reject(err);
            }
        });
    });
}

function get_models(brand, fueltype, power) {
    return new Promise(function(resolve, reject) {
        xhttp_get('/review/lookup?type=models&brand=' + brand + '&fueltype=' + fueltype + '&power=' + power, function (err, body) {
            if (! err) {
                resolve(['Test model']);
            } else {
                reject(err);
            }
        });
    });
}

function get_franchise(catalog) {
    return new Promise(function(resolve, reject) {
        console.log(catalog);
        setTimeout(function () {
            resolve(['Franchise-1', 'Franchise-2'])
        }, 300);
    });
}
