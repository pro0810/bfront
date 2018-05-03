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

function get_brands(field, callback) {
    xhttp_get('/review/lookup?type=models', function(err, body) {
        return callback(field, null, ['AUDI', 'PORCHE']);
        callback(field, null, body['brands']);
    });
}

function get_fueltypes(brand, field, callback) {
    if (!brand) {
        return callback(field, null, undefined);
    }
    xhttp_get('/review/lookup?type=models&brand=' + brand, function(err, body) {
        if (brand === 'AUDI') {
            return callback(field, null, ['BENZINE', 'DIESEL']);
        } else {
            return callback(field, null, ['BENZINE']);
        }
        callback(field, null, body['fueltypes']);
    });
}

function get_powers(brand, fueltype, field, callback) {
    if (!brand|| !fueltype) {
        return callback(field, null, undefined);
    }
    xhttp_get('/review/lookup?type=models&brand=' + brand + '&fueltype=' + fueltype, function(err, body) {
        return callback(field, null, [100]);
        callback(field, null, body['powers']);
    });
}

function get_models(brand, fueltype, power, field, callback) {
    if (!brand || !fueltype || !power) {
        return callback(field, null, undefined);
    }
    xhttp_get('/review/lookup?type=models&brand=' + brand + '&fueltype=' + fueltype + '&power=' + power, function(err, body) {
        return callback(field, null, ['Test model'])
        callback(field, null, body['models']);
    });
}

function get_franchise(catalog, field, callback) {
    console.log(catalog);
    console.log(field);
    setTimeout(function() {callback(field, null, ['Franchise-1', 'Franchise-2'])}, 300);
    return ['Franchise-1', 'Franchise-2'];
}
