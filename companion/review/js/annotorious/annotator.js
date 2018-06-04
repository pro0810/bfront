var default_confidence = 70;
var saved_confidence = {};
var extra_space = 0.0005;
var activeImage = 0;
var showJson = false;
var finalReverses = [];
var json;
var pointers = [];
var ignoreLines = [];
var rightToggle = false;
var originalToggle = false;
var images = $("#images");
var barBox = document.getElementById("barbox");
var choiceBox = document.getElementById("choicebox");
var entityTable = document.getElementById("entity-table");
var entityHeader = document.getElementById("entity-header");
var defaultHeader = ["Label", "Content", "Confidence"];
var st_flag_arr = [];
var drawAnnotation = false;
var default_table_type = "Metadata";
var select_label_style_arr = ["success", "warning", "default", "danger", "info"];
var clickedUnrecognized = [];
var undoLimit = 10;
var show_unrecognized_text = true;
var maxLineSpaceForIntegrate = 5;
var firstLoaded;
var saved_json;
var originalJsonTags;
var originalPointers = [];
var checkedCallback;
var clickedPageRangeLabel;
var keyCodes = {
    TAB: 9,
    ENTER: 13,
    ESCAPE: 27,
    SPACE: 32,
    ARROW_LEFT: 37,
    ARROW_UP: 38,
    ARROW_RIGHT: 39,
    ARROW_DOWN: 40,
    DELETE: 46,
    KEY0: 48,
    KEY1: 49,
    KEY2: 50,
    KEY3: 51,
    KEY4: 52,
    KEY5: 53,
    KEY6: 54,
    KEY7: 55,
    KEY8: 56,
    KEY9: 57,
    NUM0: 96,
    NUM1: 97,
    NUM2: 98,
    NUM3: 99,
    NUM4: 100,
    NUM5: 101,
    NUM6: 102,
    NUM7: 103,
    NUM8: 104,
    NUM9: 105,
    a: 65,
    z: 90
};
var choiceNumLists = ['1','2','3','4','5','6','7','8','9','a','b','c','d','e','f','g','h','i','j','k','l','m','n','o','p','q','r','s','t','u','v','w','x','y','z'];

function getSavedConfidence() {
    return new Promise(function(resolve) {
        var xhttp;
        if (window.XMLHttpRequest) {
            // code for modern browsers
            xhttp = new XMLHttpRequest();
        } else {
            // code for old IE browsers
            xhttp = new ActiveXObject("Microsoft.XMLHTTP");
        }
        xhttp.open("GET", "/review/fieldThresholds.json", true);
        xhttp.onloadend = function () {
            if (xhttp.status === 200) {
                try {
                    saved_confidence = JSON.parse(this.responseText);
                } catch (err) {
                    console.error("error in json parse getErrorConfidenceDict");
                }
            }
            resolve();
        };
        try {
            xhttp.send();
        }
        catch (err) {
            console.log('Error getting fieldThresholds.json')
        }
    });
}

function get_error_confidence(label) {
    return saved_confidence[label] !== undefined ? saved_confidence[label] : default_confidence;
}

Number.isInteger = Number.isInteger || function(value) {
    return typeof value === 'number' && isFinite(value) && Math.floor(value) === value;
};

// https://tc39.github.io/ecma262/#sec-array.prototype.findIndex
if (!Array.prototype.findIndex) {
    Object.defineProperty(Array.prototype, 'findIndex', {
        value: function(predicate) {
            // 1. Let O be ? ToObject(this value).
            if (this == null) {
                throw new TypeError('"this" is null or not defined');
            }

            var o = Object(this);

            // 2. Let len be ? ToLength(? Get(O, "length")).
            var len = o.length >>> 0;

            // 3. If IsCallable(predicate) is false, throw a TypeError exception.
            if (typeof predicate !== 'function') {
                throw new TypeError('predicate must be a function');
            }

            // 4. If thisArg was supplied, let T be thisArg; else let T be undefined.
            var thisArg = arguments[1];

            // 5. Let k be 0.
            var k = 0;

            // 6. Repeat, while k < len
            while (k < len) {
                // a. Let Pk be ! ToString(k).
                // b. Let kValue be ? Get(O, Pk).
                // c. Let testResult be ToBoolean(? Call(predicate, T, « kValue, k, O »)).
                // d. If testResult is true, return k.
                var kValue = o[k];
                if (predicate.call(thisArg, kValue, k, o)) {
                    return k;
                }
                // e. Increase k by 1.
                k++;
            }

            // 7. Return -1.
            return -1;
        },
        configurable: true,
        writable: true
    });
}

function showModalPopup(title, text, submit, time) {
    $("#modal-request-title").addClass("modal-request-hidden");
    $("#modal-request-text").addClass("modal-request-hidden");
    $("#modal-request-submit").addClass("modal-request-hidden");
    $("#modal-request-copy").addClass("modal-request-hidden");
    $("#modal-request-errors").addClass("modal-request-hidden");
    if (title) {
        $("#modal-request-title").removeClass("modal-request-hidden");
        $("#modal-request-title").text(title);
    }
    if (text) {
        $("#myModal .modal-body").removeClass("modal-request-hidden");
        $("#modal-request-text").removeClass("modal-request-hidden");
        if (typeof text === 'object') {
            if (text['type'] === 'text') {
                $("#modal-request-text").text(text['text']);
            } else {
                if (text['type'] === 'copy') {
                    $("#modal-request-text").text('Click inside this box to copy the code to your clipboard.');
                    $("#modal-request-copy").removeClass("modal-request-hidden");
                    $("#modal-request-copy").val(text['text']);
                } else if (text['type'] === 'errors') {
                    $("#modal-request-text").text('Some errors have occurred:');
                    $("#modal-request-errors").removeClass("modal-request-hidden");
                    $("#modal-request-errors").empty();
                    for (var errorIndex in text['errors']) {
                        $("#modal-request-errors").append(
                            $('<li>').text(text['errors'][errorIndex]['message'])
                        );
                    }
                } else if (text['type'] === 'list') {
                    $("#modal-request-text").text(text['title']);
                    $("#modal-request-errors").removeClass("modal-request-hidden");
                    $("#modal-request-errors").empty();
                    for (var errorIndex in text['items']) {
                        $("#modal-request-errors").append(
                            $('<li>').text(text['items'][errorIndex]['message'])
                        );
                    }
                }
            }
        } else {
            $("#modal-request-text").text(text);
        }
    }
    if (submit) {
        $("#myModal .modal-body").removeClass("modal-request-hidden");
        $("#modal-request-submit").removeClass("modal-request-hidden");
    }
    if (time) {
        setTimeout(function() {
            $("#myModal").modal("hide");
        }, 2000);
    }
    $("#myModal").modal("show");
}

var fileInput = document.getElementById("fileSelector");

$("#fileSelector").on("change", function() {
    if (fileInput.files[0]) {
        showModalPopup("Please wait. We are processing your request...");
        $(fileInput.parentElement).ajaxSubmit({
            timeout: 600000,
            success: function(response) {
                window.location.replace(response["redirect"] + (response["instance"] ? "?instance=" + response["instance"] : ""));
            }
        });
    }
});

function addslashes(str) {
    //  discuss at: http://locutus.io/php/addslashes/
    // original by: Kevin van Zonneveld (http://kvz.io)
    // improved by: Ates Goral (http://magnetiq.com)
    // improved by: marrtins
    // improved by: Nate
    // improved by: Onno Marsman (https://twitter.com/onnomarsman)
    // improved by: Brett Zamir (http://brett-zamir.me)
    // improved by: Oskar Larsson Högfeldt (http://oskar-lh.name/)
    //    input by: Denny Wardhana
    //   example 1: addslashes("kevin's birthday")
    //   returns 1: "kevin\'s birthday"
    return (str + "")
        .replace(/[\\"']/g, "\\$&")
        .replace(/\u0000/g, "\\0")
}
// ## SINGLE QUOTES ## //
function escapeHtml(text) {
    if (text === undefined || text === null) {
        return text;
    }
    return text.toString()
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;")
        .replace(/'/g, "&#039;");
}

function getAllAnnotations() {
    var annotations = {};
    for (var pointerIndex in pointers) {
        for (var annotationIndex in pointers[pointerIndex]["annotations"]) {
            var annotation = pointers[pointerIndex]["annotations"][annotationIndex];
            if (annotation) {
                annotations[annotation["label"]] = annotation;
            }
        }
    }
    return annotations;
}

function getActiveAnnotations() {
    var annotations = {};
    for (var annotationIndex in pointers[activeImage]["annotations"]) {
        var annotation = pointers[activeImage]["annotations"][annotationIndex];
        if (annotation) {
            annotations[annotation["label"]] = annotation;
        }
    }
    return annotations;
}

$("#annotator-submit").on("click", function() {
    showModalPopup("Please wait. We are processing your request...");
    var xhr = new XMLHttpRequest();
    var url = location.protocol + "//" + server + ":" + port + "/review/save/" + directory;
    xhr.open("POST", url, true);
    xhr.setRequestHeader("Content-type", "application/json");
    xhr.onreadystatechange = function() {
        if (xhr.readyState === 4) {
            var xhr2 = new XMLHttpRequest();
            var url2 = location.protocol + "//" + server + ":" + port + "/review/put";
            xhr2.open("POST", url2, true);
            xhr2.setRequestHeader("Content-type", "application/json");
            xhr2.onreadystatechange = function() {
                if (xhr2.readyState === 4) {
                    if (xhr2.status === 200) {
                        var submitResponse = JSON.parse(xhr2.responseText);
                        var event = new CustomEvent('post_submit', {detail: {response: submitResponse}, cancelable: true});
                        var cancelled = !document.dispatchEvent(event)
                        if (!cancelled) {
                            showModalPopup("Submitted!");
                        }
                    } else {
                        showModalPopup("Your request could not be processed", xhr2.responseText);
                    }
                }
            };
            var data = {
                "id": directory,
                "content": getJsonData()
            };
            xhr2.send(JSON.stringify(data));
        }
    };
    xhr.send(JSON.stringify(pointers));
});

$("#annotator-save").click(function() {
    showModalPopup("Please wait. We are processing your request...");
    var xhr = new XMLHttpRequest();
    var url = location.protocol + "//" + server + ":" + port + "/review/save/" + directory;
    xhr.open("POST", url, true);
    xhr.setRequestHeader("Content-type", "application/json");
    xhr.onreadystatechange = function() {
        if (xhr.readyState === 4) {
            if (xhr.status === 200) {
                showModalPopup("Saved!", undefined, false, 3000);
            } else {
                showModalPopup("Failed!", "Your progress could not be saved.")
            }
        }
    };
    xhr.send(JSON.stringify({"pointers": pointers, "tags": json["tags"]}));
});

function toggle_table() {
    if (rightToggle) {
        if (json["size_of_right"] === undefined) {
            changeRightPanel(6);
        } else {
            changeRightPanel(json["size_of_right"]);
        }
    } else {
        changeRightPanel(0);
    }
    rightToggle = !rightToggle;
}

$("#annotator-toggle-right").click(toggle_table);
$("#annotator-toggle-original").click(toggle_original);

function toggle_original(changeValue) {
    console.log("toggle_original");
    if (activeImage === -1) {
        return;
    }
    lastActiveField = {};
    clickedUnrecognized = [];
    hideChoiceBox();
    if (originalToggle) {
        $("#annotator-toggle-original .icon-repeat").replaceWith("<i class='icon-undo'></i>");
        $("#annotator-toggle-original .ts-text").replaceWith("<span class='ts-text'>Original</span>");
        if (changeValue !== true) {
            pointers[activeImage] = originalPointers[activeImage]?JSON.parse(originalPointers[activeImage]):[];
            if (saved_json && saved_json["tags"]){
                json["tags"] = saved_json["tags"];
            }
            // setupImage(activeImage);
            hideBarBox();
            generateTable();
        }
    } else {
        $("#annotator-toggle-original .icon-undo").replaceWith("<i class='icon-repeat'></i>");
        $("#annotator-toggle-original .ts-text").replaceWith("<span class='ts-text'>Saved</span>");

        if (changeValue !== true) {
            originalPointers[activeImage] = JSON.stringify(pointers[activeImage]);
            pointers[activeImage] = {};
            json["tags"] = originalJsonTags;
            setupImage(activeImage);
            hideBarBox();
            generateTable();
        }
    }

    originalToggle = !originalToggle;
}

function onetime(node, type, callback) {
    node.addEventListener(type, function(e) {
        e.target.removeEventListener(e.type, arguments.callee);
        return callback(e);
    });
}

function getLabels() {
    if (!json["labels"] || json["labels"].length <= 0) {
        return [];
    }
    var labels = new Set();
    if (json["labels_version"]) {
        labels = [];
        for (var i in json["labels"][activeImage]) {
            var label = json["labels"][activeImage][i];
            if (label instanceof String) {
                if (json['form']) {
                    labels.push({
                        "mandatory": true,
                        "multiple": true,
                        "label": label
                    });
                } else {
                    labels.push({
                        "mandatory": true,
                        "multiple": false,
                        "label": label
                    });
                }

            } else if (label instanceof Object && label["label"]) {
                labels.push(label);
            }
        }
        return labels;
    } else if (json["labels"][activeImage] instanceof Array) {
        for (var i in json["labels"][activeImage]) {
            var label = json["labels"][activeImage][i];
            if (label instanceof String) {
                if (json['form']) {
                    labels.push({
                        "mandatory": true,
                        "multiple": true,
                        "label": label
                    });
                } else {
                    labels.push({
                        "mandatory": true,
                        "multiple": false,
                        "label": label
                    });
                }
            } else if (label instanceof Object && label["label"]) {
                labels.add(label);
            }
        }
    } else {
        for (var labelIndex in json["labels"]) {
            if (json["labels"][labelIndex] instanceof Object) {
                if (!json["labels"][labelIndex]["page"] || json["labels"][labelIndex]["page"] == activeImage) {
                    labels.add(json["labels"][labelIndex]);
                }
            } else if (typeof json["labels"][labelIndex] === "string") {
                if (json['form']) {
                    labels.add({
                        "mandatory": true,
                        "multiple": true,
                        "label": json["labels"][labelIndex]
                    });
                } else {
                    labels.add({
                        "mandatory": true,
                        "multiple": false,
                        "label": json["labels"][labelIndex]
                    });
                }
            }
        }
    }
    return Array.from(labels);
}

function generateTableRowBlankTag(deleteCallback) {
    var row = document.createElement("tr");
    var rowLabel = document.createElement("td");
    var rowContent = document.createElement("td");
    var rowConfidence = document.createElement("td");
    var rowDelete = document.createElement("td");

    row.classList.add("table-tag");
    row.classList.add("active");
    rowLabel.classList.add("entity-row-label");
    rowContent.classList.add("entity-row-content");

    var labelInput = document.createElement("input");
    labelInput.setAttribute("type", "text");
    labelInput.setAttribute("placeholder", "label");
    labelInput.classList.add("nomargin");
    rowLabel.appendChild(labelInput);

    contentInput = document.createElement("input");
    contentInput.setAttribute("type", "text");
    contentInput.setAttribute("placeholder", "content");
    contentInput.classList.add("nomargin");
    rowContent.appendChild(contentInput);

    (function() {
        var tagCount = json["tags"].length;
        onetime(labelInput, "keypress", function() {
            generateTableRowBlankTag(function() {
                delete json["tags"][tagCount];
                generateTable();
            });
        });
    })();

    labelInput.onchange = contentInput.onchange = (function(labelInput, contentInput) {
        return function(event) {
            var tr = event.target.parentElement.parentElement;
            var firstTagIndex = document.querySelector("#entity-table .table-tag").rowIndex;
            var thisRowIndex = tr.rowIndex - firstTagIndex;

            json["tags"].length = Math.max(json["tags"].length, thisRowIndex + 1);
            if (!json["tags"][thisRowIndex]) {
                json["tags"][thisRowIndex] = {
                    confidence: 100
                };
            }

            json["tags"][thisRowIndex]["label"] = labelInput.value;
            json["tags"][thisRowIndex]["text"] = contentInput.value;
        }
    })(labelInput, contentInput);
    labelInput.onclick = contentInput.onclick = function(event) {
        event.stopImmediatePropagation();
    };

    if (deleteCallback) {
        rowDelete.classList.add("entity-row-delete");
        rowDelete.textContent = "×";
        rowDelete.onclick = deleteCallback;
    }

    row.appendChild(rowLabel);
    row.appendChild(rowContent);
    row.appendChild(rowConfidence);
    row.appendChild(rowDelete);
    entityTable.appendChild(row);
    return row;
}

function createTableRow(classList, data, deleteCallback) {
    var row = document.createElement("tr");
    for (var classIndex in classList) {
        row.classList.add(classList[classIndex].replace(/ /g, "_"));
    }
    for (var data_key in data) {
        var row_td = document.createElement("td");
        row_td.classList.add("entity-row-" + data_key);
        row_td.textContent = escapeHtml(data[data_key]);
        row.appendChild(row_td);
    }
    var rowDelete = document.createElement("td");
    if (deleteCallback) {
        rowDelete.classList.add("entity-row-delete");
        rowDelete.textContent = "×";
        rowDelete.onclick = deleteCallback;
    }
    row.appendChild(rowDelete);
    entityTable.appendChild(row);
    return row;
}

function get_table_type_index(table_type) {
    for (var i in json["table_types"]) {
        if (json["table_types"][i] && json["table_types"][i]["type"] == table_type) {
            return i;
        }
    }
}

function generateRowTable() {
    var table_type_index = get_table_type_index($("#instanceSelected").selectpicker("val"));
    if (table_type_index == undefined) {
        return;
    }
    generateTableHeader(json["table_types"][table_type_index]["columns"]);
    for (var pointerIndex in pointers) {
        // pointerIndex = activeImage;
        for (var rowIndex in pointers[pointerIndex]["rows"]) {
            var rows = pointers[pointerIndex]["rows"][rowIndex];
            if ((rows[0]["page"] === undefined || (Number.isInteger(rows[0]["page"]) && rows[0]["page"] == activeImage) || (Array.isArray(rows[0]["page"]) && rows[0]["page"].indexOf(activeImage) !== -1)) && rows[0]["type"] == json["table_types"][table_type_index]["type"]) {
                var data = {};
                var sorted_rows_by_column = [];
                for (var i in json["table_types"][table_type_index]["columns"]) {
                    var matched = false;
                    for (var j in rows) {
                        if (rows[j]["column"] == json["table_types"][table_type_index]["columns"][i]) {
                            data[rows[j]["column"]] = rows[j]["text"];
                            sorted_rows_by_column.push(rows[j]);
                            matched = true;
                            break;
                        }
                    }
                    if (! matched){
                        data[json["table_types"][table_type_index]["columns"][i]] = "";
                        sorted_rows_by_column.push({});
                    }
                }
                if (sorted_rows_by_column.length < 1) {
                    continue;
                }
                (function(rows, pointerIndex, rowIndex) {
                    var tableRow = createTableRow(["table-annotation", "entity-cell-confident"], data, function(event) {
                        event.stopImmediatePropagation();
                        for (var i in rows) {
                            if (rows[i]["destroyBox"]) {
                                rows[i]["destroyBox"]();
                            }
                        }
                        delete pointers[pointerIndex]["rows"][rowIndex];
                        generateTable();
                    });
                    for (var i in sorted_rows_by_column) {
                        var editable_tag = tableRow.childNodes[i];
                        var row = sorted_rows_by_column[i];
                        editable_tag.style.cursor = "pointer";
                        row["edit_tag"] = editable_tag;
                        editable_tag.onclick = (function(row) {
                            return function(event) {
                                event.stopImmediatePropagation();
                                drawBarBox(row);
                                insertInputToFormField(row['edit_tag'], row);
                            }
                        })(row);
                    }
                })(rows, pointerIndex, rowIndex);
                // labels.delete(row["label"]);
            }
        }
    }
}

function clear_right_input() {
    var right_input = document.getElementById("editable_td");
    if (right_input) {
        var value = right_input.value;
        right_input.parentElement.textContent = value;
        if (clickedPageRangeLabel) {
            var field = searchFieldFromLabel(clickedPageRangeLabel);
            var annotation = searchFieldData(clickedPageRangeLabel);
            annotation['text'] = value;
            annotation['prevtext'] = value;
            field['value'] = value;
            clickedPageRangeLabel = undefined;
        }
        // $(right_input).remove();
    }
}

function convert_tag_row_editable(tag, rowTag, thumbnail) {
    if (thumbnail == undefined){
        thumbnail = false;
    }
    if ((!thumbnail && json["tag_types"] && json["tag_types"][tag["type"]] && Array.isArray(json["tag_types"][tag["type"]])) || (thumbnail && json["page_tags"])) {
        var options_arr = thumbnail ? Object.assign([], json["page_tags"]) : Object.assign([], json["tag_types"][tag["type"]]);
        insertSelectToFormField(rowTag, tag, options_arr);
    }
    else {
        insertInputToFormField(rowTag, tag);
    }
}

function generateMetadataTable() {
    generateTableHeader();
    var labels = getLabels();
    for (var pointerIndex in pointers) {
        // pointerIndex = activeImage;
        for (var annotationIndex in pointers[pointerIndex]["annotations"]) {
            var annotation = pointers[pointerIndex]["annotations"][annotationIndex];
            if (annotation === null || annotation === undefined || !(annotation["page"] == undefined || (Number.isInteger(annotation["page"]) && annotation["page"] == activeImage) || (Array.isArray(annotation["page"]) && annotation["page"].indexOf(activeImage) != -1))) {
                continue;
            }
            // Dirty hack
            if (!annotation || ("label" in annotation && (annotation["label"] === "signature") || !annotation["label"])) {
                continue;
            }
            (function(annotation, pointerIndex, annotationIndex) {
                var tableRow = createTableRow(["table-annotation", parseFloat(annotation["confidence"]) >= get_error_confidence(annotation["label"]) ? "entity-cell-confident" : "entity-cell-danger"], {
                    "label": annotation["label"],
                    "content": annotation["text"],
                    "confidence": annotation["confidence"] + "%"
                }, function(event) {
                    event.stopImmediatePropagation();
                    if (annotation["destroyBox"]) {
                        annotation["destroyBox"]();
                    }
                    pointers[pointerIndex]["annotations"].splice(annotationIndex, 1);
                    generateTable();
                });
                var editable_tag = tableRow.childNodes[1];
                // editable_tag.style.cursor = "pointer";
                annotation["edit_tag"] = editable_tag;
                editable_tag.onclick = function(event) {
                    event.stopImmediatePropagation();
                    drawBarBox(annotation);
                    insertInputToFormField(annotation['edit_tag'], annotation);
                    if (event.target.hasChildNodes()) {
                        // setTimeout(function() {
                        //     event.target.childNodes[0].focus();
                        // }, 3);
                    }
                }
                tableRow.onclick = function(event) {
                    event.stopImmediatePropagation();
                    drawBarBox(annotation);
                }
            })(annotation, pointerIndex, annotationIndex);
            labels.splice(labels.findIndex(function(label) {
                if (!label || !annotation) {
                    return false;
                }
                return label["label"] === annotation["label"]
            }), 1);
        }
    }
    for (var tagIndex in json["tags"]) {
        var tag = json["tags"][tagIndex];
        if (!tag) {
            continue;
        }
        if (!(tag["page"] == undefined || (Number.isInteger(tag["page"]) && tag["page"] == activeImage) || (Array.isArray(tag["page"]) && tag["page"].indexOf(activeImage) != -1))) {
            continue;
        }
        // Dirty hack
        if ("label" in tag && tag["label"] === "barcode") {
            continue;
        }
        (function(tag, tagIndex) {
            var tableRow = createTableRow(["table-tag", "active", parseFloat(tag["confidence"]) >= get_error_confidence(tag["label"]) ? "entity-cell-confident" : "entity-cell-danger"], {
                "label": tag["label"],
                "content": tag["text"],
                "confidence": tag["confidence"] + "%"
            }, function() {
                delete json["tags"][tagIndex];
                generateTable();
            });
            var editable_tag = tableRow.childNodes[1];
            // editable_tag.style.cursor = "pointer";
            // annotation["edit_tag"] = editable_tag;
            tableRow.onclick = function(event) {
                event.stopImmediatePropagation();
                scroll_to_table_row(event.target);
                convert_tag_row_editable(tag, editable_tag, tag["label"] == activeImage + 1);
                if (editable_tag.hasChildNodes()) {
                    setTimeout(function() {
                        editable_tag.childNodes[0].focus();
                    }, 3);
                }
            }
        })(tag, tagIndex);
        labels.splice(labels.findIndex(function(label) {
            if (!label || !tag) {
                return false;
            }
            return label["label"] === tag["label"]
        }), 1);
    }
    if (json["tags"]) {
        (function() {
            var tagCount = json["tags"].length;
            generateTableRowBlankTag(function() {
                delete json["tags"][tagCount];
                generateTable();
            });
        })();
    }
    var failedChecks = [];
    for (var checkIndex in json["checks"]) {
        var check = json["checks"][checkIndex];
        if (!check) {
            continue;
        }
        if (!check["passed"]) {
            failedChecks.push(check);
            continue;
        }
        createTableRow(["table-check", "success", parseFloat(check["confidence"]) >= get_error_confidence(check['label']) ? "entity-cell-confident" : "entity-cell-danger"], {
            "label": check["label"],
            "content": check["text"],
            "confidence": check["confidence"] + "%"
        });
        labels.splice(labels.findIndex(function(label) {
            if (!label || !check) {
                return false;
            }
            return label["label"] === check["label"]
        }), 1);
    }
    for (var checkIndex in failedChecks) {
        var check = failedChecks[checkIndex];
        createTableRow(["table-check", "warning", parseFloat(check["confidence"]) >= get_error_confidence(check['label']) ? "entity-cell-confident" : "entity-cell-danger"], {
            "label": check["label"],
            "content": check["text"],
            "confidence": check["confidence"] + "%"
        });
        labels.splice(labels.findIndex(function(label) {
            if (!label || !check) {
                return false;
            }
            return label["label"] === check["label"]
        }), 1);
    }
    labels.forEach(function(label) {
        createTableRow(["entity-" + label["label"].replace(/[ ,\.]/g, "_"), "danger"], {
            "label": label["label"],
            "content": "Not found",
            "confidence": ""
        });
    });
    for (var actionIndex in json["actions"]) {
        var action = json["actions"][actionIndex];
        if (!action) {
            continue;
        }
        createTableRow(["table-action", "info"], {
            "label": "actions",
            "content": action["text"],
            "confidence": action["confidence"] + "%"
        });
    }
}

function generateTableHeader(header) {
    while (entityHeader.hasChildNodes()) {
        entityHeader.removeChild(entityHeader.firstChild);
    }
    while (entityTable.hasChildNodes()) {
        entityTable.removeChild(entityTable.firstChild);
    }
    header = header ? header : defaultHeader;
    for (var i in header) {
        var th_tag = document.createElement("th");
        th_tag.innerHTML = header[i];
        entityHeader.appendChild(th_tag);
    }
    var th_tag = document.createElement("th");
    th_tag.style.width = "30px";
    th_tag.innerHTML = "";
    entityHeader.appendChild(th_tag);
}

function searchFieldData(label) {
    for (var i in pointers) {
        for (var j in pointers[i]['annotations']) {
            if (label === pointers[i]['annotations'][j]['label']) {
                return pointers[i]['annotations'][j];
            }
        }
    }
}

function insertSelectToFormField(tdTag, annotation, options_arr) {
    if (!(options_arr && Array.isArray(options_arr) && options_arr.length)) {
        return;
    }
    var titlebox = document.createElement("select");
    // titlebox.value = annotation["text"] ? annotation["text"] : "";
    titlebox.style.border = "1px solid";
    titlebox.style.borderRadius = "3px";
    titlebox.style.height = "33px";
    titlebox.style.width = "100%";
    titlebox.style["margin"] = "0px";
    titlebox.id = "editable_td";

    // options_arr.splice(0, 0, "unknown");
    var select_option = document.createElement("option");
    select_option.value = '';
    select_option.innerHTML = '-- Select Options--';
    select_option.disabled = true;
    select_option.selected = true;
    titlebox.appendChild(select_option);

    for (var i in options_arr) {
        var select_option = document.createElement("option");
        select_option.value = options_arr[i];
        select_option.innerHTML = options_arr[i];
        titlebox.appendChild(select_option);
        if (select_option.value === annotation["text"]) {
            titlebox.value = annotation["text"];
        }
    }
    var left_input;
    if(annotation && annotation['label'] && typeof annotation['label'] === 'string') {
        left_input = document.getElementById(annotation["label"].replace(/[ \.,]/g, "_"));
    }
    titlebox.onchange = (function(annotation, left_input) {
        return function(event) {
            //event.preventDefault();
            event.stopImmediatePropagation();
            annotation["text"] = event.target.value;
            if (left_input) {
                $(left_input).val(this.value);
            }
            clear_right_input();
            // if (annotation && annotation['label']) {
            //     invalidateCallbackOptions(annotation['label']);
            // }
            cell_blur(annotation, event, left_input);
            hideBarBox();
            return;
        }
    })(annotation, left_input);
    titlebox.onblur = (function(annotation) {
        return function(event) {
            //event.preventDefault();
            event.stopImmediatePropagation();
            // annotation["text"] = event.target.value;
            clear_right_input();
            cell_blur(annotation, event, left_input);
            hideBarBox();
            return;
        }
    })(annotation);
    $(titlebox).click(function(event) {
        event.stopImmediatePropagation();
    });
    $(tdTag).empty();
    $(tdTag).append(titlebox);
}

function getTooltip(validType) {
    var tooltip;
    if (validType === 'int') {
        tooltip = 'Valid Format: Integer';
    } else if (validType === 'number') {
        tooltip = 'Valid Format: Float';
    } else if (validType === 'date') {
        tooltip = 'Valid Format: Date'
    }
    return tooltip;
}

function validateFormFieldType(validType, text) {
    var checkResult;
    if (validType === 'int') {
        checkResult = parseInt(text) == text;
    } else if (validType === 'number') {
        checkResult = parseFloat(text) == text;
    } else if (validType === 'date') {
        checkResult = text.match(/^(\d{2}){1}(\/\d{2})?(\/\d{4})?$/);
    } else {
        return true;
    }
    return checkResult;
}

function insertInputToFormField(tdTag, annotation, validType) {
    var titlebox = document.createElement("input");
    var tooltip = getTooltip(validType);

    titlebox.setAttribute('title', tooltip);
    titlebox.value = annotation["text"] ? annotation["text"] : "";
    titlebox.style.border = "1px solid";
    titlebox.style.borderRadius = "3px";
    titlebox.style.height = "21px";
    titlebox.style.width = "100%";
    titlebox.style["margin"] = "0px";
    titlebox.id = "editable_td";
    var left_input = document.getElementById(annotation["label"].replace(/[ \.,]/g, "_"));
    if (left_input) {
        $(titlebox).on("input", function() {
            $(left_input).val(this.value);
        });
    }
    titlebox.onkeydown = (function(annotation) {
        return function(event) {
            if (event.keyCode === keyCodes.ENTER) {
                event.stopImmediatePropagation();
                event.target.blur();
            } else if (event.keyCode === 27) {
                titlebox.value = annotation.text;
                event.target.blur();
            }
        }
    })(annotation);
    titlebox.onblur = (function(annotation) {
        return function(event) {
            // event.stopImmediatePropagation();

            if (cell_blur(annotation, event, left_input)) {
                event.target.focus();
                return;
            }
            annotation["text"] = event.target.value;
            hideBarBox();
            clear_right_input();
            return;
        }
    })(annotation);
    titlebox.onfocusin = (function(annotation, left_input) {
        return function(event) {
            if (left_input) {
                lastActiveField = {
                    annotation: annotation,
                    element: left_input
                };
            }
            if (annotation && !annotation["creating"] && annotation["shapes"] && annotation["shapes"].length) {
                annotation.activateBox();
            }
        }
    })(annotation, left_input);

    $(titlebox).click(function() {
        event.stopPropagation();
    });
    $(tdTag).empty();
    $(tdTag).append(titlebox);
    if (!left_input) {
        titlebox.focus();
    }

    if (tooltip) {
        $(titlebox).tooltip();
    }
}

function insertPageRangeInputToFormField(tdTag, field, validType) {
    if (activeImage !== -1) {
        clickedPageRangeLabel = field['label'];
        switchActiveImage(-1);
    }
    var titlebox = document.createElement("input");
    var tooltip = getTooltip(validType);
    titlebox.setAttribute('title', tooltip);
    titlebox.value = field['value'] ? field['value'] : "";
    titlebox.style.border = "1px solid";
    titlebox.style.borderRadius = "3px";
    titlebox.style.height = "21px";
    titlebox.style.width = "100%";
    titlebox.style["margin"] = "0px";
    titlebox.id = "editable_td";
    titlebox.onkeydown = (function(field) {
        return function(event) {
            if (event.keyCode === keyCodes.ENTER) {
                event.stopImmediatePropagation();
                clear_right_input();
            } else if (event.keyCode === 27) {
                titlebox.value = field['value'];
                clear_right_input();
            }
        }
    })(field);

    $(titlebox).click(function() {
        event.stopPropagation();
    });
    $(tdTag).empty();
    $(tdTag).append(titlebox);
    titlebox.focus();
    if (tooltip) {
        $(titlebox).tooltip();
    }
}


function manipulateFormTableRow(rowTag, field, annotation) {
    var editableTag = rowTag.childNodes[1];
    if (annotation) {
        annotation["edit_tag"] = editableTag;
    }
    editableTag.onclick = function(event) {
        event.stopImmediatePropagation();
        if (!field['options'] && field['refresh']) {
            return;
        }
        scroll_to_table_row(event.target);
        drawBarBox(annotation);
        if (field['type'] === 'page-range') {
            insertPageRangeInputToFormField(editableTag, field);
        } else if (field['type'] === 'option') {
            insertSelectToFormField(annotation['edit_tag'], annotation, field['options']);
        } else {
            insertInputToFormField(annotation['edit_tag'], annotation, field['type']);
        }
    };
    rowTag.onclick = function(event) {
        event.stopImmediatePropagation();
        scroll_to_table_row(event.target);
        drawBarBox(annotation);
    };
}

function checkVisible(field, fields) {
    if (field['visible'] === undefined && field['visible_if']) {
        for (var i in fields) {
            if (fields[i]['label'] === field['visible_if']['field']) {
                return fields[i]['value'] === json['tag_types'][fields[i]['label']][field['visible_if']['value']];
            }
        }
    } else if (field['visible'] === undefined || field['visible'] === true) {
        return true;
    }
}

function initializeForms() {
    var sections = json['form']['sections'];
    for (var i in sections) {
        var fields = sections[i]['fields'];
        for (var j in fields) {
            var annotation = searchFieldData(fields[j]['label']);
            var fieldValue = '';
            var fieldConfidence = 0;
            if (annotation) {
                // if (! fields[j]['options_callback']) {
                fieldValue = annotation['text'];
                fieldConfidence = annotation['confidence'] ? annotation['confidence'] : 0;
                // }
            } else {
                annotation = createManualAnnotation(0, 0, 0, 0, fields[j]['label'], 0);
                annotation['confidence'] = 0;
                // if (! fields[j]['options_callback'] || firstLoaded) {
                fieldValue = fields[j]['default'] ? fields[j]['default'] : '';
                annotation['text'] = fieldValue;
                // }
                for (var k in json['tags']) {
                    if (json['tags'][k]['label'] === fields[j]['label']) {
                        // if (! fields[j]['options_callback']) {
                        annotation['text'] = json['tags'][k]['text'];
                        fieldValue = annotation['text'];
                        // }
                        annotation['confidence'] = json['tags'][k]['confidence'];
                        annotation['error'] = annotation['confidence'] >= get_error_confidence(annotation['label']);
                        break;
                    }
                }
                annotation['prevtext'] = fieldValue;
                pointers[activeImage]['annotations'].push(annotation);
            }
            annotation['fieldType'] = fields[j]['type'];
            fields[j]['value'] = fieldValue;
        }
    }
}

function getValueFromLabel(label) {
    for (var j in json['form']['sections']) {
        for (var k in json['form']['sections'][j]['fields']) {
            var field = json['form']['sections'][j]['fields'][k];
            if (field['label'] === label.trim()) {
                return field['value'];
            }
        }
    }
}

function getValuesFromFuncParams(paramStr) {
    var valueArr = [];
    if (paramStr) {
        var paramArr = paramStr.split(',');
        for (var i in paramArr) {
            valueArr.push(getValueFromLabel(paramArr[i]))
        }
    }
    return valueArr;
}

function getCallbackOptions(item) {
    checkedCallback = [];
    if (! item) {
        var sections = json['form']['sections'];
        for (var i in sections) {
            var fields = sections[i]['fields'];
            for (var j in fields) {
                var field = fields[j];
                if (field['refresh'] && field['options'] === undefined) {
                    var funcName = field['refresh'].substring(0, field['refresh'].indexOf('('));
                    var funcParams = field['refresh'].substring(field['refresh'].indexOf('(') + 1, field['refresh'].indexOf(')'));
                    var realParams = getValuesFromFuncParams(funcParams);
                    var checkParams = true;
                    for (var k in realParams) {
                        if (! realParams[k]) {
                            checkParams = false;
                            break;
                        }
                    }
                    if (checkParams) {
                        console.log(funcName);
                        var optionsCallbackPromise = function(field) {
                            return new Promise(function(resolve, reject) {
                                window[funcName].apply(null, realParams).then(function(result) {
                                    field['options'] = result;
                                    resolve(field['label']);
                                }, function(err) {
                                    showModalPopup('An error occurred on options callback!', err);
                                    reject(field['label']);
                                });
                            });
                        };
                        checkedCallback.push(optionsCallbackPromise(field));
                    }
                }
            }
        }
        Promise.all(checkedCallback).then(function(values) {
            console.log(values);
            drawFormTable();
        }, function(errors) {
            console.log(errors);
            showModalPopup('An error occurred on options callback!');
        });
    }
}

function searchFieldFromLabel(label) {
    if (! json['form'])
        return;
    var sections = json['form']['sections'];
    for (var i in sections) {
        var fields = sections[i]['fields'];
        for (var j in fields) {
            if (fields[j]['label'] === label) {
                return fields[j];
            }
        }
    }
}

function invalidateCallbackOptions(label) {
    var field = searchFieldFromLabel(label);
    if (field && field['onchange']) {
        for (var i in field['onchange']['invalidate']) {
            var invalidateField = searchFieldFromLabel(field['onchange']['invalidate'][i]);
            if (invalidateField) {
                invalidateField['value'] = '';
                invalidateField['options'] = undefined;
                var annotation = searchFieldData(field['onchange']['invalidate'][i]);
                if (annotation) {
                    annotation['text'] = '';
                    annotation['prevtext'] = '';
                    if (annotation['edit_tag']) {
                        annotation['edit_tag'].innerHTML = "";
                        annotation['edit_tag'].style.backgroundColor = '#dddddd';
                    }
                }
            }
        }
        for (var i in field['onchange']['refresh']) {
            var refreshField = searchFieldFromLabel(field['onchange']['refresh'][i]);
            if (refreshField) {
                refreshField['value'] = '';
                refreshField['options'] = undefined;
                var annotation = searchFieldData(field['onchange']['refresh'][i]);
                if (annotation) {
                    annotation['text'] = '';
                    annotation['prevtext'] = '';
                    if (annotation['edit_tag']) {
                        annotation['edit_tag'].innerHTML = "";
                        annotation['edit_tag'].style.backgroundColor = '#dddddd';
                    }
                }
            }
        }
    }
}

function updateOptionsFromTagOrCallback() {
    var sections = json['form']['sections'];
    for (var i in sections) {
        var fields = sections[i]['fields'];
        for (var j in fields) {
            var field = fields[j];
            if (! field['refresh']) {
                field['options'] = json["tag_types"][field['label']];
                if (! field['value'] && field['options'] && field['options'][0]) {
                    var annotation = searchFieldData(fields[j]['label']);
                    field['value'] = field['options'][0];
                    annotation['text'] = field['value'];
                    annotation['prevtext'] = field['value'];
                }
            }
        }
    }
    getCallbackOptions();
}

function drawFormTable() {
    generateTableHeader();
    var sections = json['form']['sections'];
    for (var i in sections) {
        var fields = sections[i]['fields'];
        var checkShow = false;
        for (var j in fields) {
            if (checkVisible(fields[j], fields)) {
                checkShow = true;
                break;
            }
        }
        if (! checkShow) {
            continue;
        }
        createTableRow(['entity-row-form-title'],
            {
                "label": '',
                "content": sections[i]['title'],
                "confidence": ''
            }
        );
        for (var j in fields) {
            var annotation = searchFieldData(fields[j]['label']);
            annotation['text'] = fields[j]['value'];
            if (checkVisible(fields[j], fields)) {
                var tableRow = createTableRow([
                        "table-annotation",
                        annotation['confidence'] >= get_error_confidence(fields[j]['label']) ? "entity-cell-confident" : "entity-cell-danger"],
                    {
                        "label": fields[j]['label'],
                        "content": fields[j]['value'],
                        "confidence": annotation['confidence'] + '%'
                    }
                );
                manipulateFormTableRow(tableRow, fields[j], annotation);
            }
        }
    }

}

function generateFormTable() {
    // generateTableHeader();
    initializeForms();
    updateOptionsFromTagOrCallback();
}

function generateTable() {
    console.log('generate_table');
    if (json['form'] && json['form']['sections'] && Array.isArray(json['form']['sections']) && json['form']['sections'].length) {
        generateFormTable();
    } else if ($("#instanceSelected").selectpicker("val") != default_table_type) {
        generateRowTable();
    } else {
        generateMetadataTable();
    }
}

var fixing = false;
var fixButtonList;

function updateFixButton() {
    if (!fixing) {
        hideBarBox();
        document.body.scrollIntoView();
        showModalPopup("All fixes reviewed!", "Click the button below to submit.", true);
    }
}

function fixNextInList() {
    if (!fixing) {
        updateFixButton();
        return;
    }
    if (!fixButtonList || fixButtonList.length <= 0) {
        fixing = false;
        updateFixButton();
        return;
    }
    fixing = true;
    var tempObj = fixButtonList.shift();
    var pointerIndex = tempObj["pointerIndex"];
    if (pointerIndex === activeImage) {
        var currentAnnotation = tempObj["annotation"];
        if (currentAnnotation) {
            drawBarBox(currentAnnotation);
            // if (currentAnnotation["fixBox"]) {
            //     currentAnnotation.fixBox();
            // }
            // currentAnnotation["error"] = false;
            updateFixButton();
        } else {
            fixNextInList();
        }
    } else {
        switchActiveImage(pointerIndex);
        $("#fix-button").click();
    }
}

$("#fix-button").on("click", function() {
    fixing = true;
    fixButtonList = [];

    for (var pointerIndex in pointers) {
        var pointer = pointers[pointerIndex];
        var tempFixButtonList = [];
        var maxLineIndex = 0;
        for (var lineIndex in pointer["annotations"]) {
            if (pointer["annotations"][lineIndex]) {
                var tempAnnotation = pointer["annotations"][lineIndex];
                if (tempAnnotation["error"]) {
                    tempFixButtonList.push({
                        pointerIndex: parseInt(pointerIndex),
                        row: false,
                        annotation: tempAnnotation
                    });
                    maxLineIndex = Math.max(maxLineIndex,  tempAnnotation['lineIndex']);
                }
            }
        }
        for (var lineIndex in pointer["rows"]) {
            if (!ignoreLines[pointerIndex].has(parseInt(lineIndex))) {
                if (pointer["rows"][lineIndex]) {
                    for (var annotationIndex in pointer["rows"][lineIndex]) {
                        var tempAnnotation = pointer["rows"][lineIndex][annotationIndex];
                        if (tempAnnotation["error"]) {
                            tempFixButtonList.push({
                                pointerIndex: parseInt(pointerIndex),
                                row: true,
                                annotation: tempAnnotation
                            });
                            maxLineIndex = Math.max(maxLineIndex,  tempAnnotation['lineIndex']);
                        }
                    }
                }
            }
        }
        for (var lineIndex in pointer["unrecognized"]) {
            if (!ignoreLines[pointerIndex].has(parseInt(lineIndex))) {
                if (pointer["unrecognized"][lineIndex]) {
                    for (var annotationIndex in pointer["unrecognized"][lineIndex]) {
                        var tempAnnotation = pointer["unrecognized"][lineIndex][annotationIndex];
                        if (tempAnnotation) {
                            tempFixButtonList.push({
                                pointerIndex: parseInt(pointerIndex),
                                row: true,
                                annotation: tempAnnotation
                            });
                            maxLineIndex = Math.max(maxLineIndex,  tempAnnotation['lineIndex']);
                            break;
                        }
                    }
                }
            }
        }
        for (var lineIndex = 0; lineIndex <= maxLineIndex; lineIndex ++) {
            for (var k in tempFixButtonList) {
                if (parseInt(tempFixButtonList[k]['annotation']['lineIndex']) === lineIndex) {
                    fixButtonList.push(tempFixButtonList[k]);
                }
            }
        }
    }
    fixNextInList();
});

function createManualAnnotation(x1, y1, x2, y2, label, imageIndex) {
    if (imageIndex === undefined) {
        imageIndex = activeImage;
    }
    return {
        compress_whitespace: false,
        confidence: 100,
        error: false,
        label: label,
        shapes: [{
            type: "rect",
            geometry: {
                x: x1 / images.children()[imageIndex].clientWidth,
                y: y1 / images.children()[imageIndex].clientHeight,
                width: (x2 - x1) / images.children()[imageIndex].clientWidth,
                height: (y2 - y1) / images.children()[imageIndex].clientHeight
            }
        }],
        annotationIndex: pointers[imageIndex]["annotations"].length,
        lineIndex: getMaxLineIndexFromAnnotations(imageIndex) + 1,
        src: images.children()[imageIndex].src,
        text: "",
        imageIndex: imageIndex
        //,page: [""+imageIndex]
    };
}

function change_shapes(annotation, x1, y1, x2, y2) {
    annotation["shapes"] = [{
        type: "rect",
        geometry: {
            x: x1 / images.children()[activeImage].clientWidth,
            y: y1 / images.children()[activeImage].clientHeight,
            width: (x2 - x1) / images.children()[activeImage].clientWidth,
            height: (y2 - y1) / images.children()[activeImage].clientHeight
        }
    }];
}

var startedDragging = false;
var draggingAnnotation;
var draggingBox;
var dragStartX;
var dragStartY;
images.on("mousemove", function(e) {
    event.preventDefault();
    event.stopImmediatePropagation();
    var rect = e.currentTarget.getBoundingClientRect(),
        offsetX = e.clientX - rect.left,
        offsetY = e.clientY - rect.top;

    if (startedDragging) {
        if (Math.abs(dragStartX - offsetX) < 3 && Math.abs(dragStartY - offsetY) < 3) {
            return;
        }
        if (offsetX < 0) {
            return;
        }
        if (draggingAnnotation) {
            if (offsetX - dragStartX < 0) {
                draggingAnnotation["shapes"][0]["geometry"]["x"] = offsetX / images.children()[activeImage].clientWidth;
                draggingAnnotation["shapes"][0]["geometry"]["width"] = (dragStartX - offsetX) / images.children()[activeImage].clientWidth;
            } else {
                draggingAnnotation["shapes"][0]["geometry"]["x"] = dragStartX / images.children()[activeImage].clientWidth;
                draggingAnnotation["shapes"][0]["geometry"]["width"] = (offsetX - dragStartX) / images.children()[activeImage].clientWidth;
            }
            if (offsetY - dragStartY < 0) {
                draggingAnnotation["shapes"][0]["geometry"]["y"] = offsetY / images.children()[activeImage].clientHeight;
                draggingAnnotation["shapes"][0]["geometry"]["height"] = (dragStartY - offsetY) / images.children()[activeImage].clientHeight;
            } else {
                draggingAnnotation["shapes"][0]["geometry"]["y"] = dragStartY / images.children()[activeImage].clientHeight;
                draggingAnnotation["shapes"][0]["geometry"]["height"] = (offsetY - dragStartY) / images.children()[activeImage].clientHeight;
            }
            draggingBox.style.left = draggingAnnotation["shapes"][0]["geometry"]["x"] * 100 + "%";
            draggingBox.style.width = draggingAnnotation["shapes"][0]["geometry"]["width"] * 100 + "%";
            draggingBox.style.top = draggingAnnotation["shapes"][0]["geometry"]["y"] * 100 + "%";
            draggingBox.style.height = draggingAnnotation["shapes"][0]["geometry"]["height"] * 100 + "%";
            return;
        }
        if (lastActiveField.annotation) {
            lastActiveField.annotation["shapes"] = [];
            lastActiveField.annotation["text"] = "";
            clearAnnotations();
            loadAnnotations();
            change_shapes(lastActiveField.annotation, dragStartX, dragStartY, offsetX, offsetY);
            draggingAnnotation = lastActiveField.annotation;
            draggingAnnotation["error"] = false;
        } else {
            draggingAnnotation = createManualAnnotation(dragStartX, dragStartY, offsetX, offsetY);
        }
        draggingBox = createAnnotationBox(draggingAnnotation);
        if (draggingBox && draggingAnnotation["shapes"][0]["geometry"]["width"] != 0) {
            $("#images .active-image").get(0).appendChild(draggingBox);
        }
        return;
    }
});

images.on("mousedown", function(e) {
    draggingAnnotation = undefined;
    startedDragging = false;
    e.preventDefault();
    e.stopImmediatePropagation();
    if (activeImage == -1 || choiceBox.hasChildNodes()) {
        return;
    }
    var rect = e.currentTarget.getBoundingClientRect(),
        offsetX = e.clientX - rect.left,
        offsetY = e.clientY - rect.top;
    dragStartX = offsetX;
    dragStartY = offsetY;
    images.children()[activeImage].style.cursor = "default";
    startedDragging = true;
    drawAnnotation = true;
});

images.on("mouseup", function(e) {
    e.preventDefault();
    e.stopImmediatePropagation();
    var rect = e.currentTarget.getBoundingClientRect(),
        offsetX = e.clientX - rect.left,
        offsetY = e.clientY - rect.top;
    if (!startedDragging || (Math.abs(dragStartX - offsetX) < 3 && Math.abs(dragStartY - offsetY) < 3)) {
        startedDragging = false;
        return;
    }
    var realwidth = finalReverses[activeImage]["width"];
    var realheight = finalReverses[activeImage]["height"];
    var westlimit = draggingAnnotation["shapes"][0]["geometry"]["x"] * realwidth;
    var northlimit = draggingAnnotation["shapes"][0]["geometry"]["y"] * realheight;
    var eastlimit = draggingAnnotation["shapes"][0]["geometry"]["width"] * realwidth + westlimit;
    var southlimit = draggingAnnotation["shapes"][0]["geometry"]["height"] * realheight + northlimit;
    draggingAnnotation["boxes"] = [{
        vertices: [{
            x: westlimit,
            y: northlimit
        }, {
            x: eastlimit,
            y: northlimit
        }, {
            x: westlimit,
            y: southlimit
        }, {
            x: eastlimit,
            y: southlimit
        }]
    }];

    // Capture underlying boxes
    draggingAnnotation["text"] = "";
    draggingAnnotation["page"] = activeImage;
    for (var pageIndex in finalReverses[draggingAnnotation["imageIndex"]]) {
        var page = finalReverses[draggingAnnotation["imageIndex"]][pageIndex];
        for (var lineIndex in page) {
            for (var boxIndex in page[lineIndex]) {
                var box = page[lineIndex][boxIndex];
                if (
                    box &&
                    box["vertices"] &&
                    box["vertices"][0]["y"] > northlimit &&
                    box["vertices"][2]["x"] < eastlimit &&
                    box["vertices"][2]["y"] < southlimit &&
                    box["vertices"][0]["x"] > westlimit) {
                    if (draggingAnnotation["text"] === "") {
                        draggingAnnotation["text"] = box["word"];
                        draggingAnnotation["lineIndex"] = lineIndex;
                    } else {
                        draggingAnnotation["text"] += " " + box["word"];
                    }
                }
            }
        }
    }

    // startedDragging = false;
    if (!lastActiveField.annotation) {
        // hideChoiceBox(true);
        pointers[draggingAnnotation["imageIndex"]]["annotations"].push(draggingAnnotation);
        if (!draggingAnnotation["label"]) {
            e.preventDefault();
            drawTypeChoice(draggingAnnotation);
            // drawAnnotation = false;
        }
    } else {
        lastActiveField.annotation["text"] = draggingAnnotation["text"];
        lastActiveField.element.value = draggingAnnotation["text"];
        lastActiveField.element.dispatchEvent(new CustomEvent('focus'));
        lastActiveField.annotation.activateRow();
        lastActiveField.annotation.activateBox();
        generateTable();
    }

    // drawAnnotation = false;
    // startedDragging = false;
    draggingAnnotation = undefined;
    draggingBox = undefined;
    setTimeout(function() {
        startedDragging = false;
    }, 20);
});

var firstRecognized = true;
var firstNotRecognized = true;
var firstError = true;

var lastActiveField = {};
var lastChoiceField = {};

function hideChoiceBox(selected) {
    if (choiceBox.hasChildNodes()) {
        // pointers[activeImage]["annotations"].pop();
        while (choiceBox.hasChildNodes()) {
            choiceBox.removeChild(choiceBox.firstChild);
        }
        choiceBox.style.display = "none";
        choiceBox.style = null;
        if (!selected) {
            pointers[activeImage]["annotations"].pop();
            clearClickedUnrecognized();
            clearAnnotations();
            loadAnnotations();
        }
    }
}

function clearClickedUnrecognized() {
    for (var clickedIndex in clickedUnrecognized) {
        delete pointers[activeImage]["unrecognized"][clickedUnrecognized[clickedIndex]["line"]][clickedUnrecognized[clickedIndex]["cell"]];
    }
    // clickedUnrecognized = [];
    clickedUnrecognized = [];
}


function hideBarBox() {
    if (barBox.hasChildNodes()) {
        clearClickedUnrecognized();
    }
    while (barBox.hasChildNodes()) {
        barBox.removeChild(barBox.firstChild);
    }

    barBox.style.display = "none";
    // barBox.style = null;
    lastActiveField = {};
    clearAnnotations();
    loadAnnotations();
}

function clearAnnotations() {
    if (activeImage === -1) {
        return;
    }
    firstRecognized = true;
    firstNotRecognized = true;
    firstError = true;
    var activeImageWrapper = $("#images .active-image").get(0);
    if (!activeImageWrapper) {
        return;
    }
    while (activeImageWrapper.children.length > 1) {
        activeImageWrapper.removeChild(activeImageWrapper.lastChild);
    }
}

function findNeighbourUnrecognizedAnnotation(annotation) {
    var currentLine;
    if (annotation["row_to_line"]) {
        currentLine = parseInt(annotation["row_to_line"]);
    } else if (annotation["lineIndex"]) {
        currentLine = parseInt(annotation["lineIndex"]);
    }

    for (var lineIndex in pointers[activeImage]["unrecognized"]) {
        if ((lineIndex - currentLine) >= 0 && (lineIndex - currentLine) < maxLineSpaceForIntegrate) {
            for (var cellIndex in pointers[activeImage]["unrecognized"][lineIndex]) {
                var checked = false;
                for (var clickedIndex in clickedUnrecognized) {
                    if (clickedUnrecognized[clickedIndex]["line"] == lineIndex &&
                        clickedUnrecognized[clickedIndex]["cell"] == cellIndex) {
                        checked = true;
                        break;
                    }
                }
                if (checked) {
                    continue;
                }
                if (document.body.contains(pointers[activeImage]["unrecognized"][lineIndex][cellIndex]["annotationTag"])) {
                    return pointers[activeImage]["unrecognized"][lineIndex][cellIndex];
                }
            }
        }
    }
}

function findAboveLineLastAnnotation(annotation) {
    for (var newLine=parseInt(annotation["lineIndex"]); newLine>=0; newLine--) {
        if (pointers[activeImage]["rows"][newLine]  && newLine != annotation["lineIndex"]) {
            return pointers[activeImage]["rows"][newLine][pointers[activeImage]["rows"][newLine].length - 1];
        } else {
            for (var annotationIndex = annotation["annotationIndex"]==undefined || newLine!=parseInt(annotation["lineIndex"])?pointers[activeImage]["annotations"].length-1:annotation["annotationIndex"]-1; annotationIndex >= 0; annotationIndex--) {
                if (pointers[activeImage]["annotations"][annotationIndex]["lineIndex"] == newLine) {
                    return pointers[activeImage]["annotations"][annotationIndex];
                }
            }
        }
        // else if (pointers[activeImage]["unrecognized"][newLine]) {
        //     return pointers[activeImage]["unrecognized"][newLine][Math.min.apply(null, Object.keys(pointers[activeImage]["unrecognized"][newLine]))];
        // }
    }
}

function findAboveLineFirstAnnotation(annotation) {
    for (var newLine=parseInt(annotation["lineIndex"]) - 1; newLine>=0; newLine--) {
        if (pointers[activeImage]["rows"][newLine]) {
            return pointers[activeImage]["rows"][newLine][0];
        }

        // else if (pointers[activeImage]["unrecognized"][newLine]) {
        //     return pointers[activeImage]["unrecognized"][newLine][Math.min.apply(null, Object.keys(pointers[activeImage]["unrecognized"][newLine]))];
        // }
    }
}

function getMaxLineIndexFromAnnotations(imageIndex) {
    var maxIndex = 0;
    for (var annotationIndex in pointers[imageIndex]["annotations"]) {
        var annotation = pointers[imageIndex]["annotations"][annotationIndex];
        if (annotation["lineIndex"] > maxIndex) {
            maxIndex = annotation["lineIndex"];
        }
    }
    return maxIndex;
}


function findBelowLineFirstAnnotation(annotation) {
    var maxLine = Math.max(Math.max.apply(null, Object.keys(pointers[activeImage]["rows"])), getMaxLineIndexFromAnnotations(activeImage));
    for (var newLine=parseInt(annotation["lineIndex"]); newLine <= maxLine; newLine++) {
        if (pointers[activeImage]["rows"][newLine] && newLine != annotation["lineIndex"]) {
            return pointers[activeImage]["rows"][newLine][0];
        } else {
            for (var annotationIndex=annotation["annotationIndex"]==undefined || newLine!=parseInt(annotation["lineIndex"])?0:annotation["annotationIndex"] + 1; annotationIndex < pointers[activeImage]["annotations"].length; annotationIndex++) {
                if (pointers[activeImage]["annotations"][annotationIndex]["lineIndex"] == newLine) {
                    return pointers[activeImage]["annotations"][annotationIndex];
                }
            }
        }
        //  else if (pointers[activeImage]["unrecognized"][newLine]) {
        //     return pointers[activeImage]["unrecognized"][newLine][Math.min.apply(null, Object.keys(pointers[activeImage]["unrecognized"][newLine]))];
        // }
    }
}

function drawBarCell(annotation, focus) {
    var fieldDiv = document.createElement("div");
    var fieldLabel = document.createElement("label");
    fieldLabel.setAttribute("for", annotation["label"]);
    fieldLabel.textContent = escapeHtml(annotation["label"]);
    fieldDiv.appendChild(fieldLabel);
    var fieldInput = document.createElement("input");
    fieldInput.id = annotation["label"].replace(/[ ,\.]/g, "_");
    fieldInput.classList.add("group-field");
    fieldInput.classList.add("barbox-cell");
    fieldInput.setAttribute("type", "text");
    fieldInput.setAttribute("name", annotation["label"]);
    fieldInput.setAttribute("placeholder", annotation["label"]);
    fieldInput.setAttribute("value", annotation["text"]);
    var deleteIconTag = document.createElement("i");
    deleteIconTag.classList.add("remove-label", "icon-line-cross");
    fieldDiv.appendChild(deleteIconTag);
    fieldDiv.appendChild(fieldInput);
    deleteIconTag.onclick = (function(annotation, fieldInput) {
        return function(event) {
            event.stopImmediatePropagation();
            event.preventDefault();
            // lastActiveField = {
            //     annotation: annotation,
            //     element: event.target
            // };
            // saveToTimeMachine();
            fieldInput.setAttribute("value", "");
            if (annotation["edit_tag"]) {
                if (annotation["edit_tag"].children.length) {
                    $(annotation["edit_tag"].childNodes[0]).val("");
                } else {
                    annotation["edit_tag"].innerHTML = "";
                }
            }
            annotation["text"] = "";
            annotation["shapes"] = [];
            annotation["boxes"] = [];
            annotation.destroyBox();
            // delete pointers[activeImage]["rows"][annotation["row_to_line"]][annotation["index"]];
        }
    })(annotation, fieldInput);

    fieldInput.onkeydown = (function() {
        return function(event) {
            // event.stopImmediatePropagation();
            if (event.keyCode === keyCodes.ENTER) {
                event.preventDefault();
                event.stopImmediatePropagation();
                event.target.blur();
                hideBarBox();
                // generateTable();
                return;
            }
            if (event.keyCode === keyCodes.DELETE && event.shiftKey) {
                event.preventDefault();
                deleteIconTag.click();
                return;
            }
            if (event.keyCode === keyCodes.DELETE && event.ctrlKey) {
                event.preventDefault();
                document.activeElement.blur();
                $('#barbox').children().last().children().last().click();
                return;
            }
            if (event.keyCode === keyCodes.ESCAPE) {
                event.preventDefault();
                addToPrevActive = false;
                addToPrevLineIndex = undefined;
                event.target.blur();
                hideBarBox();
                return;
            }
            if ((event.keyCode === keyCodes.SPACE && event.shiftKey) || event.keyCode === keyCodes.ARROW_UP) {
                event.preventDefault();
                var neighbourAnnotation = findNeighbourUnrecognizedAnnotation(annotation);
                if (neighbourAnnotation) {
                    updateAnnotationFromUnrecognized(neighbourAnnotation);
                }
                return;
            }
            if ((event.keyCode === keyCodes.SPACE && event.ctrlKey) || event.keyCode === keyCodes.ARROW_DOWN) {
                event.preventDefault();
                var neighbourAnnotation = findNeighbourUnrecognizedAnnotation(annotation);
                if (neighbourAnnotation) {
                    neighbourAnnotation.destroyBox();
                    delete pointers[activeImage]["unrecognized"][neighbourAnnotation["lineIndex"]][neighbourAnnotation["index"]];
                }
                return;
            }

            if (event.keyCode === keyCodes.TAB) {
                // event.preventDefault();
                var newChecked = false;
                var newAnnotation = undefined;
                if (event.shiftKey) {
                    if (annotation["index"] == 0 || annotation["annotationIndex"] != undefined) {
                        newAnnotation = findAboveLineLastAnnotation(annotation);
                        newChecked = true;
                    }
                } else {
                    if ((pointers[activeImage]["rows"][annotation["lineIndex"]] && annotation["index"] == pointers[activeImage]["rows"][annotation["lineIndex"]].length - 1) || (annotation["annotationIndex"] != undefined)) {
                        newAnnotation = findBelowLineFirstAnnotation(annotation);
                        newChecked = true;
                    }
                }
                if (newAnnotation && newChecked) {
                    // newAnnotation["annotationTag"].click();
                    event.preventDefault();
                    hideBarBox();
                    drawBarBox(newAnnotation);
                } else if (newChecked) {
                    hideBarBox();
                    generateTable();
                }
                return;
            }
        }
    })();
    fieldInput.onfocusout = (function(annotation) {
        return function(event) {
            console.log("blur-left-edit");
            if (cell_blur(annotation, event, lastActiveField["element"])) {
                event.target.focus();
            }
        }
    })(annotation);
    fieldInput.onfocusin = (function(annotation) {
        return function(event) {
            event.stopImmediatePropagation();
            console.log("focus");

            lastActiveField = {
                annotation: annotation,
                element: event.target
            };
            console.log(lastActiveField);
            if (annotation && !annotation["creating"]  && annotation["shapes"].length) {
                annotation.activateBox();
            }
            if (!undoLoading && !undoSaving) {
                saveToTimeMachine();
            }
            var total = 100;
            var theChildren = lastActiveField.element.parentElement.parentElement.childNodes;
            var activeWidth = Math.max(20, 200 / (theChildren.length + 2));
            var childrenWidth = (total - activeWidth) / (theChildren.length + 1);
            for (var siblingIndex=0; siblingIndex < theChildren.length - 1; siblingIndex++) {
                if (typeof theChildren[siblingIndex].style !== 'undefined' && theChildren[siblingIndex].style.width !== childrenWidth + '%') {
                    theChildren[siblingIndex].style.width = childrenWidth + "%";
                }
            }
            lastActiveField.element.parentElement.style.width = activeWidth.toString() + "%";
        }
    })(annotation);

    $(fieldInput).on("input", function() {
        if (annotation["edit_tag"] && annotation["edit_tag"].children.length) {
            $(annotation["edit_tag"].childNodes[0]).val(this.value);
        }
    });
    barBox.appendChild(fieldDiv);
    if (annotation['fieldType']) {
        var tooltip = getTooltip(annotation['fieldType']);
        if (tooltip) {
            // fieldInput.setAttribute('title', tooltip);
            $(fieldInput).tooltip({title: tooltip, placement: "bottom"});
        }
    }
    if (annotation["activateRow"]) {
        annotation.activateRow();
    }
    // Intentional, do not edit!
    if (focus !== false) {
        setTimeout(function() {
            fieldInput.focus();
            // lastActiveField = {
            //     annotation: annotation,
            //     element: fieldInput
            // };
        }, 100);
    }

}

function update_annotation_to_row(annotation, typeIndex) {
    // var row_keys_arr = Object.keys(pointers[activeImage]["rows"]);
    var lineIndex = annotation["lineIndex"] == undefined?0:parseInt(annotation["lineIndex"]);
    while (pointers[activeImage]["rows"][lineIndex]) {
        lineIndex ++;
    }
    annotation["lineIndex"] = lineIndex;

    annotation["column"] = json["table_types"][typeIndex]["columns"][0];
    annotation["label"] = json["table_types"][typeIndex]["labels"][0];
    annotation["group"] = annotation["label"];
    annotation["row_to_line"] = annotation["lineIndex"];
    annotation["index"] = 0;
    annotation["type"] = json["table_types"][typeIndex]["type"];
    annotation["prevtext"] = undefined;
    annotation["page"] = activeImage;
    delete annotation["annotationIndex"];
    var finalLine = [annotation];
    for (var i = 1; i < json["table_types"][typeIndex]["labels"].length; i++) {
        // var new_annotation = Object.create(annotation)["__proto__"];
        var new_annotation = Object.assign({}, annotation);
        new_annotation["label"] = json["table_types"][typeIndex]["labels"][i];
        new_annotation["column"] = json["table_types"][typeIndex]["columns"][i];
        new_annotation["group"] = new_annotation["label"];
        new_annotation["index"] = i;
        new_annotation["text"] = "";
        new_annotation["prevtext"] = undefined;
        new_annotation["page"] = activeImage;
        new_annotation["shapes"] = [];
        new_annotation["boxes"] = [];
        finalLine.push(new_annotation);
    }
    pointers[activeImage]["annotations"].pop();
    pointers[activeImage]["rows"][annotation["row_to_line"]] = finalLine;
}

function addRowActive(annotation) {
    for (var boxIndex in pointers[activeImage]["unrecognized"][annotation["lineIndex"]]) {
        var box = pointers[activeImage]["unrecognized"][annotation["lineIndex"]][boxIndex];
        if (box) {
            box.activateRow();
        }
    }
}

function removeRowActive(annotation) {
    if (annotation["original_lineIndex"] != undefined) {
        for (var boxIndex in pointers[activeImage]["unrecognized"][annotation["original_lineIndex"]]) {
            var box = pointers[activeImage]["unrecognized"][annotation["original_lineIndex"]][boxIndex];
            if (box) {
                box.deactivateRow();
            }
        }
    }
}

var undoSaving = false;
var undoLoading = false;
var timeMachine = [];

function saveToTimeMachine(overrides) {
    if (undoLoading || undoSaving) {
        return;
    }
    undoSaving = true;
    if (JSON.stringify(lastActiveField) != "{}" && timeMachine.length && JSON.stringify(lastActiveField) == timeMachine[timeMachine.length - 1]["lastActiveField"]) {
        undoSaving = false;
        return;
    }

    var entry = {
        pointers: JSON.stringify(pointers),
        activeImage: activeImage,
        barBoxVisible: barBox.hasChildNodes(),
        choiceBoxVisible: choiceBox.hasChildNodes(),
        lastActiveField: JSON.stringify(lastActiveField),
        clickedUnrecognized: JSON.stringify(clickedUnrecognized),
    };
    // if (lastActiveField && lastActiveField['annotation']) {
    //     entry['lastAnnotationType'] = lastActiveField['annotation']['type'];
    //     entry['lastAnnotationGroup'] = lastActiveField['annotation']['group'];
    //     entry['lineIndex'] = lastActiveField['annotation']['row_to_line'];
    // }
    // for (var overIndex in overrides) {
    //     entry[overIndex] = overrides[overIndex];
    // }
    timeMachine.push(entry);
    if (timeMachine.length > undoLimit) {
        timeMachine.shift();
    }
    setTimeout(function() {
        undoSaving = false;
    }, 100);
}

function loadFromTimeMachine() {
    if (undoLoading) {
        return;
    }
    var temp = timeMachine.pop();
    // if (temp["lastActiveField"] == lastActiveField.annotation) {
    //     temp = timeMachine.pop();
    // }
    if (!temp) {
        return;
    }
    undoLoading = true;
    pointers = JSON.parse(temp["pointers"]);
    clickedUnrecognized = JSON.parse(temp["clickedUnrecognized"]);
    if (temp["activeImage"] != activeImage) {
        switchActiveImage(temp["activeImage"]);
    } else {
        hideChoiceBox();
        hideBarBox();
    }
    if (temp["barBoxVisible"]) {
        var savedAnnotation = JSON.parse(temp["lastActiveField"])["annotation"];
        var realAnnotation;
        if (savedAnnotation && savedAnnotation["row_to_line"] != undefined) {
            realAnnotation = pointers[activeImage]["rows"][savedAnnotation["row_to_line"]][savedAnnotation["index"]];
        } else if (savedAnnotation && savedAnnotation["annotationIndex"] != undefined) {
            realAnnotation = pointers[activeImage]["annotations"][savedAnnotation["annotationIndex"]];
        }
        drawBarBox(realAnnotation);
    } else if (temp["choiceBoxVisible"]) {
        drawTypeChoice(pointers[activeImage]["annotations"][pointers[activeImage]["annotations"].length - 1]);
    }
    setTimeout(function() {
        undoLoading = false;
    }, 100);
    // console.log('Load after: ' + timeMachine.length)
}

$(document).on("keydown", function(event) {
    console.log(event.keyCode);
    event.stopImmediatePropagation();
    if (event.keyCode === keyCodes.ENTER && $('#myModal').hasClass('in') && !$('#myModal .modal-body').hasClass('modal-request-hidden')) {
        $("#annotator-submit").click();
        return;
    }
    if (!barBox.hasChildNodes() && !choiceBox.hasChildNodes() && event.keyCode === keyCodes.ENTER && !event.shiftKey) {
        // event.preventDefault();
        $("#fix-button").click();
        return;
    }
    if (event.ctrlKey && event.key === 'z') {
        loadFromTimeMachine();
    }
})

function getAnnotationFromLabel(annotation) {
    for (var j in pointers) {
        for (var i in pointers[j]['annotations']) {
            if (pointers[j]['annotations'][i]['label'] === annotation['label'] && annotation !== pointers[j]['annotations'][i]) {
                pointers[j]['annotations'].splice(i, 1);
                return
            }
        }
    }

}

function drawTypeChoiceRow (annotation, label, type, choiceNum) {
    if (type == "label") {
        var annotations = getActiveAnnotations();
    }
    var choiceDiv = document.createElement("div");
    var choiceInput = document.createElement("input");
    var labelElement = document.createElement("label");
    choiceInput.setAttribute("type", "radio");
    choiceInput.setAttribute("name", "radio");
    choiceInput.setAttribute("value", label["label"]);
    choiceInput.id = "choice_" + label["label"].replace(/[ ,\.]/g, "_");
    labelElement.textContent = escapeHtml(choiceNum + ". " + label["label"]);
    labelElement.setAttribute("for", "choice_" + label["label"].replace(/[ ,\.]/g, "_"));
    if (type == "label" && label["label"] in annotations && !label["multiple"]) {
        choiceInput.disabled = true;
        labelElement.style["text-decoration"] = "line-through";
        labelElement.style["color"] = "#dddddd";
    }
    choiceDiv.appendChild(choiceInput);
    choiceDiv.appendChild(labelElement);
    choiceBox.appendChild(choiceDiv);
    choiceInput.onchange = (function(annotation) {
        return function(event) {
            event.stopImmediatePropagation();
            if (type == "other") {
                var otherTextInput = document.createElement("input");
                otherTextInput.setAttribute("type", "text");
                otherTextInput.setAttribute("placeholder", "label");
                otherTextInput.onkeydown = function(event) {
                    // event.preventDefault();
                    event.stopImmediatePropagation();
                    if (event.keyCode === 13) {
                        event.preventDefault();
                        annotation["label"] = event.target.value;
                        var noRedraw;
                        if (annotation["unrecognized"]) {
                            updateClickedUnrecognized(annotation);
                            delete annotation["unrecognized"];
                            annotation.fixBox();
                            noRedraw = true;
                        }
                        hideChoiceBox(true);
                        drawBarBox(annotation, noRedraw);
                        generateTable();
                    }
                }
                choiceDiv.appendChild(otherTextInput);
                otherTextInput.focus();
            } else {
                var noRedraw;
                if (annotation["unrecognized"]) {
                    updateClickedUnrecognized(annotation);
                    delete annotation["unrecognized"];
                    annotation.fixBox();
                    noRedraw = true;
                }
                if (json['form']) {
                    // pointers[activeImage]['annotations'].pop();
                    annotation["label"] = event.target.value;
                    getAnnotationFromLabel(annotation);
                    // originalAnnotation = annotation;
                } else {
                    if (type == "label") {
                        annotation["label"] = event.target.value;
                    } else if (type == "line") {
                        update_annotation_to_row(annotation, json["table_types"].indexOf(label));
                    }
                }
                hideChoiceBox(true);
                drawBarBox(annotation, noRedraw);
            }
        }
    })(annotation);
}

function updateEmptyAnnotationFromUnrecognized (annotation) {
    updateClickedUnrecognized(annotation);
    annotation.fixBox();
    lastActiveField.annotation["shapes"] = annotation["shapes"];
    lastActiveField.annotation["boxes"] = annotation["boxes"];
    // lastActiveField.annotation["text"] = annotation["text"];
    lastActiveField.element.value += lastActiveField.element.value?" " + annotation["text"]: annotation["text"];
    lastActiveField.annotation["activateBox"] = annotation["activateBox"];
    lastActiveField.annotation.activateRow = annotation.activateRow;
    lastActiveField.annotation.deactivateBox = annotation.deactivateBox;
    lastActiveField.annotation.deactivateRow = annotation.deactivateRow;
    lastActiveField.annotation.destroyBox = annotation.destroyBox;
    lastActiveField.annotation.fixBox = annotation.fixBox;
    lastActiveField.element.focus();
    lastActiveField.annotation.activateBox();
    generateTable();
}

function updateAnnotationFromUnrecognized(annotation) {
    if (lastActiveField.annotation["shapes"].length == 0) {
        updateEmptyAnnotationFromUnrecognized (annotation);
        return;
    }

    var currentLine;
    if (lastActiveField.annotation["row_to_line"]) {
        currentLine = lastActiveField.annotation["row_to_line"];
    } else if (lastActiveField.annotation["lineIndex"]) {
        currentLine = lastActiveField.annotation["lineIndex"];
    }

    if (!(currentLine && Math.abs(currentLine - parseInt(annotation["lineIndex"])) < maxLineSpaceForIntegrate)) {
        return;
    }
    updateClickedUnrecognized(annotation);
    // lastActiveField.annotation["text"] += " " + annotation["text"];
    lastActiveField.element.value += " " + annotation["text"];
    integrateAnnotationBoxes(lastActiveField.annotation, annotation);
    lastActiveField.element.focus();
    lastActiveField.annotation.activateBox();
    generateTable();
}

function integrateAnnotationBoxes(first, second) {
    first.destroyBox();
    second.destroyBox();
    var realheight = finalReverses[activeImage]["height"];
    var realwidth = finalReverses[activeImage]["width"];
    var boxes  = [first, second];
    var min_x;
    var max_x;
    var min_y;
    var max_y;
    var imgwrapper = images.children()[activeImage];
    for (var boxIndex in boxes) {
        var box = boxes[boxIndex]["boxes"][0];
        var box_min_x = Math.min(box["vertices"][0]["x"], box["vertices"][2]["x"]);
        var box_max_x = Math.max(box["vertices"][1]["x"], box["vertices"][3]["x"]);
        var box_min_y = Math.min(box["vertices"][0]["y"], box["vertices"][1]["y"]);
        var box_max_y = Math.max(box["vertices"][2]["y"], box["vertices"][3]["y"]);
        if (!min_x || min_x > box_min_x) {
            min_x = box_min_x;
        }
        if (!max_x || max_x < box_max_x) {
            max_x = box_max_x;
        }
        if (!min_y || min_y > box_min_y) {
            min_y = box_min_y;
        }
        if (!max_y || max_y < box_max_y) {
            max_y = box_max_y;
        }
    }
    var geometry = {
        x: Math.max(0, min_x / realwidth - extra_space),
        y: Math.max(0, min_y / realheight - extra_space),
        width: Math.min(1, (max_x - min_x) / realwidth + extra_space * 2),
        height: Math.min(1, (max_y - min_y) / realheight + extra_space * 2)
    };
    first["shapes"] = [{
        type: "rect",
        geometry: geometry
    }];
    first["boxes"] = [{
        "vertices": [{
            "x": min_x,
            "y": min_y
        }, {
            "x": max_x,
            "y": min_y
        }, {
            "x": min_x,
            "y": max_y
        }, {
            "x": min_x,
            "y": max_y
        }]
    }];
    var box = createAnnotationBox(first);
    if (box && first["shapes"][0]["geometry"]["width"] != 0) {
        imgwrapper.appendChild(box);
    }
}

function updateClickedUnrecognized(annotation) {
    clickedUnrecognized.push({
        line: annotation["lineIndex"],
        cell: annotation["index"]
    });
}


function drawTypeChoice(annotation) {
    // hideBarBox();
    hideChoiceBox();

    var choiceNum = 0;
    if (annotation["unrecognized"]) {
        // clickedUnrecognized = [];
        // updateClickedUnrecognized(annotation);
        // addRowActive(annotation);
    }

    annotation.activateBox();
    lastChoiceField = annotation;
    choiceBox.style.visibility = "collapse";
    choiceBox.style.display = "flex";

    var labels = getLabels().sort(labelSort);
    for (var labelIndex in labels) {
        if (!labels[labelIndex] || !labels[labelIndex]["label"]) {
            continue;
        }
        drawTypeChoiceRow(annotation, labels[labelIndex], "label", choiceNumLists[choiceNum]);
        choiceNum ++;
    }
    for (var tableIndex in json["table_types"]) {
        if (!json["table_types"][tableIndex] || !json["table_types"][tableIndex]["page"] || json["table_types"][tableIndex]["page"] != activeImage) {
            continue;
        }
        drawTypeChoiceRow(annotation, json["table_types"][tableIndex], "line", choiceNumLists[choiceNum]);
        choiceNum ++;
    }
    if (json["noOtherLabel"] === undefined || json["noOtherLabel"] === false) {
        drawTypeChoiceRow(annotation, {label: "other"}, "other", choiceNumLists[choiceNum]);
    }

    var trashDiv = document.createElement("div");
    var trashIconHolder = document.createElement("a");
    trashIconHolder.classList.add("button", "button-mini", "button-circle", "button-red");
    trashIconHolder.style.width = "50%";
    trashIconHolder.style.margin = "auto";
    var trashIcon = document.createElement("i");
    trashIcon.classList.add("icon-trash");
    trashIconHolder.appendChild(trashIcon);
    trashDiv.appendChild(trashIconHolder);

    trashIconHolder.onclick = (function(annotation) {
        return function(event) {
            event.stopImmediatePropagation();
            event.preventDefault();
            // saveToTimeMachine();
            clickedUnrecognized = [];
            if (annotation["unrecognized"]) {
                delete pointers[annotation["imageIndex"]]["unrecognized"][annotation["lineIndex"]];
                delete finalReverses[annotation["imageIndex"]]["lines"][annotation["lineIndex"]];
            }
            // if (pointers[annotation["imageIndex"]]["annotations"]) {
            //     var indexAnnotation = pointers[annotation["imageIndex"]]["annotations"].indexOf(annotation);
            //     if (indexAnnotation != -1) {
            //         pointers[annotation["imageIndex"]]["annotations"].splice(indexAnnotation, 1);
            //     }
            // }
            // pointers[annotation["imageIndex"]]["annotations"].pop();
            hideChoiceBox();
            clearAnnotations();
            loadAnnotations();
        }
    })(annotation);

    choiceBox.appendChild(trashDiv);
    var azertymap = {
        '&': 1,
        'é': 2,
        '"': 3,
        "'": 4,
        '(': 5,
        '§': 6,
        'è': 7,
        '!': 8,
        'ç': 9,
        'à': 0
    };
    choiceBox.onkeydown = function(event) {
        console.log(event.keyCode);
        event.stopImmediatePropagation();

        if (event.keyCode === keyCodes.ESCAPE) {
            event.preventDefault();
            // pointers[annotation["imageIndex"]]["annotations"].pop();
            hideChoiceBox();
            hideBarBox();
            return;
        }
        if (event.keyCode === keyCodes.DELETE) {
            event.preventDefault();
            trashIconHolder.click();
            return;
        }
        if (event.keyCode === keyCodes.ARROW_UP) {
            event.preventDefault();
            var newAnnotation = findAboveLineFirstAnnotation(annotation);
            hideChoiceBox();
            // hideBarBox();
            if (newAnnotation) {
                // pointers[activeImage]["annotations"].pop();
                drawBarBox(newAnnotation);
            }
        }
        // if (event.keyCode === keyCodes.ARROW_DOWN) {
        //     event.preventDefault();
        //     var newAnnotation = findBelowLineFirstAnnotation(annotation);
        //     if (newAnnotation) {
        //         pointers[activeImage]["annotations"].pop();
        //         hideBarBox();
        //         drawBarBox(newAnnotation);
        //     }
        // }

        var digit;
        if (keyCodes.NUM0 < event.keyCode && event.keyCode <= keyCodes.NUM9) {
            digit = event.keyCode - keyCodes.NUM0;
        } else if (keyCodes.KEY0 < event.keyCode && event.keyCode <= keyCodes.KEY9) {
            digit = event.keyCode - keyCodes.KEY0;
        } else if (keyCodes.a <= event.keyCode && event.keyCode <=keyCodes.z) {
            digit = event.keyCode - keyCodes.a + 10;
        } else if (event.key in azertymap) {
            digit = azertymap[event.key];
        }

        if (!digit) {
            return;
        }
        if (digit < choiceBox.children.length && digit > 0) {
            event.preventDefault();
            choiceBox.children[digit - 1].children[0].click();
            // event.keyCode = null;
            return;
        }
    };

    choiceBox.focus();
    $(choiceBox).click(function(event) {
        // console.log(event.keyCode);
        event.stopPropagation();
    });

    setTimeout(function() {
        scroll_to_annotation(annotation, choiceBox);
        choiceBox.style.visibility = "";
    }, 10);
    saveToTimeMachine();
}

function scroll_to_annotation(annotation, choiceBox) {
    var imageHeight = $("#images .active-image").get(0).clientHeight;
    var annotation_top = 0;
    if (annotation["row_to_line"] != undefined && pointers[activeImage]["rows"][annotation["row_to_line"]][0]["shapes"][0]) {
        annotation_top = pointers[activeImage]["rows"][annotation["row_to_line"]][0]["shapes"][0]["geometry"]["y"];
    } else if (annotation["shapes"][0]) {
        annotation_top = annotation["shapes"][0]["geometry"]["y"];
    }

    if (choiceBox) {
        var scroll_top = Math.max(0, Math.min(annotation_top * imageHeight - 280, (imageHeight - $(".content-img").height())));
        var aboveTop = annotation_top * imageHeight - scroll_top - choiceBox.clientHeight + 120;
        if (aboveTop > 80) choiceBox.style.top = aboveTop + "px";
        else choiceBox.style.top = annotation_top * imageHeight - scroll_top + 240 + "px";
    }

    $(".content-img").animate({
        scrollTop: annotation_top * imageHeight - 280
    }, 100, null);
    return {annotation_top: annotation_top, imageHeight: imageHeight};
}

function scroll_to_table_row(element) {
    var row_top = 0;
    if (element) {
        row_top = $(element).offset().top + $(".content-tbl").scrollTop();
    }
    $(".content-tbl").animate({
        scrollTop: row_top - 300
    }, 100, null);
}

function drawBarBox(annotation, noRedraw) {
    if (!annotation || startedDragging) {
        startedDragging = false;
        return;
    }
    if (annotation["unrecognized"]) {
        if (!lastActiveField.annotation || !lastActiveField.element) {
            hideChoiceBox();
            var new_annotation = Object.assign({}, annotation);
            new_annotation["annotationIndex"] = pointers[activeImage]["annotations"].length;
            pointers[activeImage]["annotations"].push(new_annotation);
            clickedUnrecognized = [];
            // updateClickedUnrecognized(annotation);
            addRowActive(annotation);
            drawTypeChoice(new_annotation);
            return;
        }
        if (lastActiveField.element.value) {
            if (event.shiftKey) {
                updateAnnotationFromUnrecognized(annotation);
            } else {
                if (lastActiveField.element.parentElement.nextElementSibling.children[2] && lastActiveField.element.parentElement.nextElementSibling.children[2].tagName == "INPUT") {
                    lastActiveField.element.parentElement.nextElementSibling.children[2].focus();
                    updateAnnotationFromUnrecognized(annotation);
                }
            }
        } else {
            updateEmptyAnnotationFromUnrecognized(annotation);
        }
        return;
    }
    hideChoiceBox();
    if (!noRedraw) {
        hideBarBox();
    }
    clear_right_input();
    if (annotation["type"] != $("#instanceSelected").selectpicker("val") && !json['form']) {
        if (annotation["type"]) {
            $("#instanceSelected").selectpicker("val", annotation["type"]);
            generateTable();
        } else {
            if ($("#instanceSelected").selectpicker("val") != default_table_type) {
                $("#instanceSelected").selectpicker("val", default_table_type);
                generateTable();
            }
        }
    }
    if (activeImage !== annotation["imageIndex"]) {
        switchActiveImage(annotation["imageIndex"]);
    }
    scroll_to_table_row(annotation["edit_tag"]);
    var scrollPos = scroll_to_annotation(annotation);
    var scroll_top = Math.max(0, Math.min(scrollPos.annotation_top * scrollPos.imageHeight - 280, (scrollPos.imageHeight - $(".content-img").height())));
    barBox.style.top = Math.max(0, (scrollPos.annotation_top * scrollPos.imageHeight - scroll_top - 90)) + "px";
    barBox.style.display = "flex";
    var finalLine = pointers[activeImage]["rows"][annotation["row_to_line"]];
    if (finalLine) {
        for (var annotationIndex in finalLine) {
            var lineAnnotation = finalLine[annotationIndex];
            drawBarCell(lineAnnotation, lineAnnotation["label"] === annotation["label"]);
        }
    } else {
        drawBarCell(annotation, true);
    }

    var trashDiv = document.createElement("div");
    var trashIconHolder = document.createElement("a");
    trashIconHolder.classList.add("button");
    trashIconHolder.classList.add("button-mini");
    trashIconHolder.classList.add("button-circle");
    trashIconHolder.classList.add("button-red");
    trashIconHolder.style.width = "50px";
    var trashIcon = document.createElement("i");
    trashIcon.classList.add("icon-trash");
    trashIconHolder.appendChild(trashIcon);
    var checkIconHolder = document.createElement("a");
    checkIconHolder.classList.add("button");
    checkIconHolder.classList.add("button-mini");
    checkIconHolder.classList.add("button-circle");
    checkIconHolder.classList.add("button-red");
    checkIconHolder.style.width = "50px";
    var checkIcon = document.createElement("i");
    checkIcon.classList.add("icon-checkmark");
    checkIconHolder.appendChild(checkIcon);
    trashDiv.appendChild(checkIconHolder);
    trashDiv.appendChild(trashIconHolder);

    trashIconHolder.onclick = (function(annotation) {
        return function(event) {
            event.stopImmediatePropagation();
            clickedUnrecognized = [];
            // if (pointers[activeImage]["unrecognized"][annotation["lineIndex"]] == undefined) {
            if (pointers[activeImage]["unrecognized"] && pointers[activeImage]["unrecognized"][annotation["lineIndex"]] == undefined) {
                pointers[activeImage]["unrecognized"][annotation["lineIndex"]] = {};
            }
            var finalLine = pointers[activeImage]["rows"][annotation["row_to_line"]];
            if (finalLine) {
                var lineNumber = annotation["row_to_line"];
                delete pointers[activeImage]["rows"][lineNumber];
            } else {
                pointers[annotation["imageIndex"]]["annotations"].splice(pointers[annotation["imageIndex"]]["annotations"].indexOf(annotation), 1);
            }
            pointers[activeImage]["unrecognized"] = updateUnrecognizedAnnotation();
            clearAnnotations();
            loadAnnotations();
            hideBarBox();
            generateTable();
        }
    })(annotation);

    checkIconHolder.onclick = (function(annotation) {
        return function(event) {
            event.stopImmediatePropagation();
            event.preventDefault();
            $(lastActiveField["element"]).blur();
            hideBarBox();
            // generateTable();
            startedDragging = false;
            return;
        }
    })(annotation);
    barBox.appendChild(trashDiv);
    barBox.onclick = (function(event) {
        event.stopImmediatePropagation();
    })
    // saveToTimeMachine();
}

function cell_blur(annotation, event, left_input) {
    if (! validateFormFieldType(annotation['fieldType'], event.target.value)) {
        return true;
    }
    if (barBox.style.display === "none") return;
    if (left_input) {
        lastActiveField = {
            annotation: annotation,
            element: left_input
        };
    }
    if (annotation) {
        annotation["text"] = left_input.value;
        if (!annotation["creating"]) {
            if (annotation["error"]) {
                if (annotation['fixBox']) {
                    annotation.fixBox();
                }
                annotation["error"] = false;
            }
            if (lastActiveField.annotation["deactivateBox"]) {
                lastActiveField.annotation.deactivateBox();
            }
        }
    }
    if (annotation["text"] != annotation["prevtext"]) {
        if (annotation['label']) {
            invalidateCallbackOptions(annotation['label']);
        }
        generateTable();
        annotation["prevtext"] = annotation["text"];
    }
}

function createAnnotationBox(annotation) {
    if (!annotation || !annotation["shapes"] || annotation["shapes"].length == 0) {
        return null;
    }

    var box = document.createElement("div");
    box.style.left = annotation["shapes"][0]["geometry"]["x"] * 100 + "%";
    box.style.top = annotation["shapes"][0]["geometry"]["y"] * 100 + "%";
    box.style.width = annotation["shapes"][0]["geometry"]["width"] * 100 + "%";
    box.style.height = annotation["shapes"][0]["geometry"]["height"] * 100 + "%";
    box.classList.add("annotation");

    if (firstRecognized && !annotation["error"] && !annotation["unrecognized"]) {
        box.setAttribute("data-intro", "When you click on a black box, it will be highlighted, and you will go into editing mode for that line. <br><br> Click on next to see what this means.");
        box.setAttribute("data-step", "2");
        box.setAttribute("id", "tour-recognized");
        box.setAttribute("data-disable-interaction", "true");
        firstRecognized = false;
    }
    if (annotation["error"] && !annotation["unrecognized"]) {
        box.classList.add("annotation-error");
        if (firstError) {
            box.setAttribute("data-intro", "Data fields marked for audit will have a red square. One option is to review the individually by clicking on the red squares. Reviewed cells will turn green")
            box.setAttribute("data-step", "6")
            box.setAttribute("id", "tour-error");
            box.setAttribute("data-disable-interaction", "true");
            firstError = false;
        }
    }
    if (annotation["unrecognized"]) {
        box.classList.add("possible-annotation");
        if (firstNotRecognized) {
            box.setAttribute("data-intro", "When you click on text that has not been assigned, you create a new line.<br><br> You will be asked to indicate which type of line this is. <br><br> Click on next to see what this means.");
            box.setAttribute("data-step", "4");
            box.setAttribute("id", "tour-nonrecognized");
            box.setAttribute("data-disable-interaction", "true");
            firstNotRecognized = false;
        }
    }

    annotation["annotationTag"] = box;
    annotation["activateRow"] = (function(thisbox) {
        return function() {
            thisbox.classList.add("annotation-active-row");
        }
    })(box);
    annotation["deactivateRow"] = (function(thisbox) {
        return function() {
            thisbox.classList.remove("annotation-active-row");
        }
    })(box);
    annotation["activateBox"] = (function(thisbox) {
        return function() {
            thisbox.classList.add("annotation-active");
        }
    })(box);
    annotation["deactivateBox"] = (function(thisbox) {
        return function() {
            thisbox.classList.remove("annotation-active");
        }
    })(box);
    annotation["fixBox"] = (function(thisbox) {
        return function() {
            thisbox.classList.remove("annotation-error");
            thisbox.classList.remove("possible-annotation");
            thisbox.classList.add("annotation-fixed");
            thisbox.classList.remove("annotation-active");
        }
    })(box);

    annotation["destroyBox"] = (function(thisbox) {
        return function() {
            $(thisbox).remove();
        }
    })(box);

    box.onclick = (function(annotation) {
        return function(event) {
            event.stopImmediatePropagation();
            drawBarBox(annotation);
        }
    })(annotation);
    return box;
}

function clickedMainView() {
    console.log("clicked-mainview");
    console.log("startedDragging=" + startedDragging);
    clear_right_input();
    if (!startedDragging && activeImage >= 0) {
        event.stopImmediatePropagation();
        if (lastActiveField["element"]) {
            $(lastActiveField["element"]).blur();
            lastActiveField["annotation"].deactivateBox();
        }
        if (choiceBox.hasChildNodes()) {
            // pointers[activeImage]["annotations"].pop();
            hideChoiceBox();
        }
        hideBarBox();
        generateTable();
    }
    startedDragging = false;
}


function loadAnnotations() {
    if (activeImage === -1) {
        return;
    }
    var imgwrapper = images.children()[activeImage];
    document.getElementById("main-view").onclick = function(event) {
        clickedMainView();
    };

    for (var annotationIndex in pointers[activeImage]["annotations"]) {
        var annotation = pointers[activeImage]["annotations"][annotationIndex];
        annotation["annotationIndex"] = annotationIndex;
        // Dirty hack
        if (!annotation || ("label" in annotation && annotation["label"] === "signature")) {
            continue;
        }
        var box = createAnnotationBox(annotation);
        if (box && annotation["shapes"][0]["geometry"]["width"] != 0) {
            imgwrapper.appendChild(box);
        }
    }
    for (var rowIndex in pointers[activeImage]["rows"]) {
        var row = pointers[activeImage]["rows"][rowIndex];
        for (var annotationIndex in row) {
            var annotation = row[annotationIndex];
            var box = createAnnotationBox(annotation);
            if (box && annotation["shapes"][0]["geometry"]["width"] != 0) {
                imgwrapper.appendChild(box);
            }
        }
    }
    clear_right_input();
    // generateTable();
    if (show_unrecognized_text) {
        for (var rowIndex in pointers[activeImage]["unrecognized"]) {
            var row = pointers[activeImage]["unrecognized"][rowIndex];
            for (var annotationIndex in row) {
                var annotation = row[annotationIndex];
                var box = createAnnotationBox(annotation);
                if (box && annotation["shapes"][0]["geometry"]["width"] != 0) {
                    imgwrapper.appendChild(box);
                }
            }
        }
    }
}

function getLastValueForPageRange(val) {
    var n;
    if (val) {
        var x = Math.max(val.lastIndexOf(';'), val.lastIndexOf('-'));
        if (x === -1) {
            n = Math.floor(Number(val));
            if (n !== Infinity && String(n) === val && n > 0) {
                return val;
            }
        } else {
            val = val.substring(x + 1);
            n = Math.floor(Number(val));
            if (n !== Infinity && String(n) === val && n > 0) {
                return val;
            }
        }
    }
}


function loadThumbnails() {
    var imgThumb = document.createElement("div");
    imgThumb.classList.add("active-image");
    imgThumb.classList.add("flex-container");
    for (var pictureIndex in json["pictures"]) {
        var imgContainer = document.createElement("div");
        for (var tagIndex in json["tags"]) {
            if (parseInt(pictureIndex) + 1 == json["tags"][tagIndex]["label"] && json["tags"][tagIndex]["confidence"] < get_error_confidence(json["tags"][tagIndex]["label"])) {
                imgContainer.classList.add("error-thumbnail");
            }
        }
        var img = document.createElement("img");
        img.setAttribute("src", json["pictures"][pictureIndex]);
        img.setAttribute("alt", "Error");
        img.setAttribute("draggable", "false");
        // img.style.border = "3px solid rgba(92, 184, 92, 0.7)";
        var labelForImg = document.createElement("div");
        labelForImg.textContent = parseInt(pictureIndex) + 1;
        imgContainer.appendChild(img);
        imgContainer.appendChild(labelForImg);
        imgContainer.onclick = (function(pictureIndex) {
            return function(event) {
                event.stopImmediatePropagation();
                if (clickedPageRangeLabel) {
                    var pageRangeTd = $('#editable_td');
                    var val = pageRangeTd.val();
                    var lastVal = getLastValueForPageRange(val);
                    console.log(val);
                    console.log(lastVal);
                    if (lastVal && Number(lastVal) < pictureIndex + 1) {
                        if (event.shiftKey && !val.includes('-' + lastVal)) {
                            pageRangeTd.val(val + '-' + String(pictureIndex + 1));
                            pageRangeTd.focus();
                            return;
                        } else if (event.ctrlKey || event.metaKey) {
                            pageRangeTd.val(val + ';' + String(pictureIndex + 1));
                            pageRangeTd.focus();
                            return;
                        }
                    }
                    pageRangeTd.val(pictureIndex + 1);
                    pageRangeTd.focus();
                } else {
                    clear_right_input();
                    switchActiveImage(pictureIndex);
                }
            }
        })(parseInt(pictureIndex));
        imgThumb.appendChild(imgContainer);
    }
    images.append(imgThumb);
    if (json['form'] && json['form']['sections'] && Array.isArray(json['form']['sections'])) {
        if (!clickedPageRangeLabel) {
            generateFormTable();
        }
    } else {
        generate_thumbnail_table();
    }

}

function generate_thumbnail_table() {
    generateTableHeader();
    for (var pictureIndex in json["pictures"]) {
        for (var tagIndex in json["tags"]) {
            if (parseInt(pictureIndex) + 1 != json["tags"][tagIndex]["label"]) {
                continue;
            }
            var tag = json["tags"][tagIndex];
            (function(tag, tagIndex) {
                var tableRow = createTableRow(["table-tag", "active", parseFloat(tag["confidence"]) >= get_error_confidence(tag['label']) ? "entity-cell-confident" : "entity-cell-danger"], {
                    "label": tag["label"],
                    "content": tag["text"],
                    "confidence": tag["confidence"] + "%"
                }, function() {
                    delete json["tags"][tagIndex];
                    generate_thumbnail_table();
                });
                var editable_tag = tableRow.childNodes[1];
                editable_tag.onclick = (function(pictureIndex) {
                    return function(event) {
                        event.stopImmediatePropagation();
                        scroll_to_table_row(event.target);
                        convert_tag_row_editable(tag, editable_tag, true);
                        if (editable_tag.hasChildNodes()) {
                            setTimeout(function() {
                                editable_tag.childNodes[0].focus();
                            }, 3);
                        }
                    }
                })(pictureIndex);
                tableRow.onclick = (function(pictureIndex) {
                    return function(event) {
                        event.stopImmediatePropagation();
                        switchActiveImage(parseInt(pictureIndex));
                    }
                })(pictureIndex);

            })(tag, tagIndex);
            break;
        }
    }
}

function resolveButtons() {
    if (json["show_thumbnails"]) {
        var lower_page_bound = 0;
    } else {
        var lower_page_bound = 1;
    }
    if (activeImage < lower_page_bound) {
        $("#image-navigator-buttons button")[0].disabled = true;
        $("#image-navigator-buttons button")[1].disabled = true;
    } else {
        $("#image-navigator-buttons button")[0].disabled = false;
        $("#image-navigator-buttons button")[1].disabled = false;
    }
    if (activeImage >= images.children().length - 1) {
        $("#image-navigator-buttons button")[2].disabled = true;
        $("#image-navigator-buttons button")[3].disabled = true;
    } else {
        $("#image-navigator-buttons button")[2].disabled = false;
        $("#image-navigator-buttons button")[3].disabled = false;
    }
}

function switchActiveImage(newActive) {
    originalToggle = false;
    if (newActive == -1) {
        st_flag_arr[activeImage] = !rightToggle;
        rightToggle = st_flag_arr[newActive];
        // if (rightToggle == undefined)
        rightToggle = true;
        toggle_table();
        // originalToggle = true;
        // toggle_original();
        hideChoiceBox();
        hideBarBox();
        clearAnnotations();
        images.children()[activeImage].classList.remove("active-image");
        if (activeImage != newActive && !firstLoaded) {
            saveToTimeMachine();
        }
        if (firstLoaded) {
            firstLoaded = false;
        }
        set_table_types();
        loadThumbnails();
        activeImage = newActive;
        if (!json.offset)
            $("#page-tracker").text((1 + activeImage) + " / " + images.children().length);
        else
            $("#page-tracker").text((activeImage) + " / " + (images.children().length - 1));

        resolveButtons();
    }
    if (newActive >= 0 && newActive < images.children().length && activeImage !== newActive) {
        if (!pointers[newActive]) {
            alert("Something went wrong");
        }

        if (activeImage === -1) {
            images.children().last().remove();
        } else {
            hideChoiceBox();
            hideBarBox();
            clearAnnotations();
            images.children()[activeImage].classList.remove("active-image");
        }
        if (activeImage !== newActive) {
            saveToTimeMachine();
        }
        if (firstLoaded) {
            firstLoaded = false;
        }

        images.children()[newActive].classList.add("active-image");

        if (!json.offset)
            $("#page-tracker").text((1 + newActive) + " / " + images.children().length);
        else
            $("#page-tracker").text((newActive) + " / " + (images.children().length - 1));

        st_flag_arr[activeImage] = !rightToggle;
        rightToggle = st_flag_arr[newActive];
        if (rightToggle === undefined)
            rightToggle = true;
        toggle_table();
        // if (!(json['form'] && json['form']['sections'])) {

        // }
        activeImage = newActive;
        originalToggle = true;
        toggle_original(true);
        if (showJson) {
            loadJson();
        } else {
            loadAnnotations();
            if (!json['form']) {
                set_table_types();
            }
            generateTable();
        }
        resolveButtons();


    }

}

$("#image-navigator-buttons button").on("click", function(event) {
    event.stopImmediatePropagation();
    if (event.target.tagName.toLowerCase() === "span") {
        event.target = event.target.parentElement;
    }
    if ($("#image-navigator-buttons button").index($(event.target)) === 0) {
        switchActiveImage(json["show_thumbnails"] ? -1 : 0)
    } else if ($("#image-navigator-buttons button").index($(event.target)) === 1) {
        switchActiveImage(activeImage - 1);
    } else if ($("#image-navigator-buttons button").index($(event.target)) === 2) {
        switchActiveImage(activeImage + 1);
    } else {
        switchActiveImage(images.children().length - (activeImage == "-1" ? 2 : 1))
    }
});

var jsonDataElement = document.getElementById("json-data");

function labelSort(a, b) {
    return a["label"] > b["label"];
}

function getJsonData() {
    var toDelete = [];
    var annotations = [];
    var rows = [];
    for (var pointerIndex in pointers) {
        for (var annotationIndex in pointers[pointerIndex]["annotations"]) {
            var annotation = pointers[pointerIndex]["annotations"][annotationIndex];
            if (!annotation) {
                continue;
            }
            annotations.push({
                text: annotation["text"],
                confidence: annotation["confidence"],
                label: annotation["label"],
                page: annotation["page"]
            })
        }
        for (var rowIndex in pointers[pointerIndex]["rows"]) {
            var row = {};
            for (var annotationIndex in pointers[pointerIndex]["rows"][rowIndex]) {
                var annotation = pointers[pointerIndex]["rows"][rowIndex][annotationIndex];
                if (!annotation) {
                    continue;
                }
                row[annotation["label"]] = {
                    text: annotation["text"],
                    confidence: annotation["confidence"],
                    page: annotation["page"],
                    type: annotation['type']
                };
            }
            rows.push(row);
        }
    }
    var tags = [];
    for (var tagIndex in json["tags"]) {
        var tag = json["tags"][tagIndex];
        if (!tag) {
            continue;
        }
        tags.push({
            text: tag["text"],
            confidence: tag["confidence"],
            label: tag["label"],
            page: tag["page"]
        });
    }
    var checks = [];
    for (var checkIndex in json["checks"]) {
        var check = json["checks"][checkIndex];
        if (!check) {
            continue;
        }
        checks.push({
            text: check["text"],
            confidence: check["confidence"],
            passed: check["passed"],
            label: check["label"]
        });
    }
    return {
        annotations: annotations.sort(labelSort),
        rows: rows,
        tags: tags.sort(labelSort),
        checks: checks.sort(labelSort),
        email: json["email"]
    }
}

function loadJson() {
    if (jsonDataElement.firstChild !== null) {
        jsonDataElement.removeChild(jsonDataElement.firstChild);
    }
    clearAnnotations();
    images.children()[activeImage].classList.remove("active-image");
    jsonDataElement.appendChild(renderjson.set_sort_objects(true).set_icons("+", "-").set_show_to_level("all")(getJsonData()));
}

$("#toggle-json").on("click", function() {
    if (showJson) {
        jsonDataElement.removeChild(jsonDataElement.firstChild);
        images.children()[activeImage].classList.add("active-image");
        loadAnnotations();
    } else {
        loadJson();
    }
    showJson = !showJson;
});

$("#annotator-walkthrough").on("click", function() {
    introJs().onchange(function(targetElement) {
        if (targetElement.id === "tour-recognized") {
            hideChoiceBox();
            hideBarBox();
            targetElement.click();
        }
        if (targetElement.id === "tour-nonrecognized") {
            hideChoiceBox();
            hideBarBox();
            lastActiveField = {};
            targetElement.click();
        }
        if (targetElement.id === "tour-error") {
            hideChoiceBox();
            hideBarBox();
            lastActiveField = {};
        }
    }).setOption("showStepNumbers", false).start();
    introJs().refresh();
    introJs().setOption("overlayOpacity", "0.2").setOption("showStepNumbers", false).start();
});

function makeAnnotation(imageIndex, annotation, type) {
    var subjson = finalReverses[imageIndex];
    var src = json["pictures"][imageIndex];
    var lines = subjson["lines"];
    var realwidth = subjson["width"];
    var realheight = subjson["height"];

    if (!("upperleft" in annotation) || annotation["upperleft"][0] !== imageIndex || annotation["upperleft"][1] === -1) {
        return;
    }

    annotation["imageIndex"] = imageIndex;
    annotation["src"] = src;
    annotation["prevtext"] = annotation["text"];
    annotation["error"] = (annotation["confidence"] <= get_error_confidence(annotation['label']));
    annotation["creating"] = false;
    annotation["shapes"] = [];
    annotation["lineIndex"] = parseInt(annotation["upperleft"][1]);
    if (annotation["upperleft"][2] === -1) {
        annotation["text"] = "";
        annotation["prevtext"] = annotation["text"];
        annotation["boxes"] = [];
        annotation["shapes"] = [];
    }

    var northlimit = null;
    var eastlimit = null;
    var southlimit = null;
    var westlimit = null;
    var confidence = undefined;
    for (var i = annotation["upperleft"][1]; i <= annotation["lowerright"][1]; i++) {
        var line = lines[i];
        if (!line) {
            continue;
        }
        var lineBegin = annotation["upperleft"][2];
        var lineEnd = annotation["lowerright"][2];
        if (lineBegin > lineEnd) {
            if (i === annotation["upperleft"][1]) {
                lineEnd = parseInt(Object.keys(line).reduce(function(a, b) {
                    return parseInt(a) > parseInt(b) ? a : b
                }));
            } else if (i === annotation["lowerright"][1]) {
                lineBegin = parseInt(Object.keys(line).reduce(function(a, b) {
                    return -parseInt(a) > -parseInt(b) ? a : b
                }));
            }
        } else {
            lineBegin--;
        }
        for (var key in line) {
            var value = line[key];
            if (key >= lineBegin && key <= lineEnd) {
                var min_x = Math.min(value["vertices"][0]["x"], value["vertices"][3]["x"]);
                var max_x = Math.max(value["vertices"][1]["x"], value["vertices"][2]["x"]);
                var min_y = Math.min(value["vertices"][0]["y"], value["vertices"][1]["y"]);
                var max_y = Math.max(value["vertices"][2]["y"], value["vertices"][3]["y"]);
                if (northlimit === null || northlimit > min_y) {
                    northlimit = min_y;
                }
                if (eastlimit === null || eastlimit < max_x) {
                    eastlimit = max_x;
                }
                if (southlimit === null || southlimit < max_y) {
                    southlimit = max_y;
                }
                if (westlimit === null || westlimit > min_x) {
                    westlimit = min_x;
                }
                if (value["confidence"] && (!confidence || value["confidence"] < confidence)) {
                    confidence = value["confidence"];
                }
                value["used"] = true;
            }
        }
        if (!line["used"]) {
            for (var k = annotation["upperleft"][1]; k <= annotation["lowerright"][1]; k++) {
                lines[k]["used"] = (northlimit !== null);
            }
        }
    }
    if (northlimit !== null) {
        var x = Math.max(0, westlimit / realwidth - extra_space);
        var y = Math.max(0, northlimit / realheight - extra_space);
        var width = Math.min(1, (eastlimit - westlimit) / realwidth + extra_space * 2);
        var height = Math.min(1, (southlimit - northlimit) / realheight + extra_space * 2);
        var geometry = {
            x: (typeof x === "number" ? x : parseFloat(x.replace(",", "."))),
            y: (typeof y === "number" ? y : parseFloat(y.replace(",", "."))),
            width: (typeof width === "number" ? width : parseFloat(width.replace(",", "."))),
            height: (typeof height === "number" ? height : parseFloat(height.replace(",", ".")))
        };
        annotation["shapes"] = [{
            type: "rect",
            geometry: geometry
        }];
        annotation["boxes"] = [{
            "vertices": [{
                "x": westlimit,
                "y": northlimit
            }, {
                "x": eastlimit,
                "y": northlimit
            }, {
                "x": westlimit,
                "y": southlimit
            }, {
                "x": eastlimit,
                "y": southlimit
            }]
        }];
    }
    return true;
}

function resetLineUsed() {
    for (var lineIndex in finalReverses[activeImage]["lines"]) {
        var line = finalReverses[activeImage]["lines"][lineIndex];
        var used = false;
        for (var boxIndex in line) {
            var box = line[boxIndex];
            box["used"] = false;

        }
        line["used"] = false;
    }
}

function checkLineUsed(annotation) {
    for (var lineIndex in finalReverses[activeImage]["lines"]) {
        var line = finalReverses[activeImage]["lines"][lineIndex];
        var used = false;
        for (var boxIndex in line) {
            var box = line[boxIndex];
            if (box &&
                box["vertices"] && annotation["boxes"] && annotation["boxes"][0] && annotation["boxes"][0]["vertices"] &&
                box["vertices"][0]["y"] >= annotation["boxes"][0]["vertices"][0]["y"] &&
                box["vertices"][2]["x"] <= annotation["boxes"][0]["vertices"][1]["x"] &&
                box["vertices"][2]["y"] <= annotation["boxes"][0]["vertices"][2]["y"] &&
                box["vertices"][0]["x"] >= annotation["boxes"][0]["vertices"][0]["x"]) {
                box["used"] = true;
                line["used"] = true;
            }
        }
    }
}


function updateUnrecognizedAnnotation() {
    if (Object.keys(pointers[activeImage]["annotations"]).length === 0 && Object.keys(pointers[activeImage]["rows"]).length === 0) {
        return {};
    }
    resetLineUsed();
    for (var annotationIndex in pointers[activeImage]["annotations"]) {
        var annotation =  pointers[activeImage]["annotations"][annotationIndex];
        checkLineUsed(annotation);
    }
    for (var rowIndex in pointers[activeImage]["rows"]) {
        var row = pointers[activeImage]["rows"][rowIndex];
        for (var rowLineIndex in row) {
            var annotation = row[rowLineIndex];
            checkLineUsed(annotation);
        }
    }
    return getUnrecognizedAnnotation(activeImage);
}


function getUnrecognizedAnnotation(imageIndex) {
    if (Object.keys(pointers[imageIndex]["annotations"]).length === 0 && Object.keys(pointers[imageIndex]["rows"]).length === 0) {
        return {};
    }
    var src = json["pictures"][imageIndex];
    var linesToBoxes = {};
    var realheight = finalReverses[imageIndex]["height"];
    var realwidth = finalReverses[imageIndex]["width"];
    var lines = finalReverses[imageIndex]["lines"];
    for (var lineIndex in lines) {
        var line = lines[lineIndex];
        if (line["used"] || ignoreLines[imageIndex].has(parseInt(lineIndex))) {
            continue;
        }
        if (!linesToBoxes[lineIndex]) {
            linesToBoxes[lineIndex] = {};
        }
        //show on all lines
        for (var annotationIndex in line) {
            var value = line[annotationIndex];
            if (isNaN(annotationIndex) || !/[a-zA-Z0-9]+/.test(value["word"]) || !value || !value.vertices || value["used"]) {
                if (value !== undefined) {
                    value["used"] = true;
                }
                // linesToBoxes[lineIndex].push(undefined);
                // linesToBoxes[lineIndex][annotationIndex] = undefined;
                continue;
            }
            var annotation = {};
            var min_x = Math.min(value["vertices"][0]["x"], value["vertices"][3]["x"]);
            var max_x = Math.max(value["vertices"][1]["x"], value["vertices"][2]["x"]);
            var min_y = Math.min(value["vertices"][0]["y"], value["vertices"][1]["y"]);
            var max_y = Math.max(value["vertices"][2]["y"], value["vertices"][3]["y"]);
            var x = Math.max(0, min_x / realwidth - extra_space);
            var y = Math.max(0, min_y / realheight - extra_space);
            var width = Math.min(1, (max_x - min_x) / realwidth + extra_space * 2);
            var height = Math.min(1, (max_y - min_y) / realheight + extra_space * 2);
            var geometry = {
                x: (typeof x === "number" ? x : parseFloat(x.replace(",", "."))),
                y: (typeof y === "number" ? y : parseFloat(y.replace(",", "."))),
                width: (typeof width === "number" ? width : parseFloat(width.replace(",", "."))),
                height: (typeof height === "number" ? height : parseFloat(height.replace(",", ".")))
            };
            annotation["shapes"] = [{
                type: "rect",
                geometry: geometry
            }];
            annotation["boxes"] = [{
                "vertices": [{
                    "x": min_x,
                    "y": min_y
                }, {
                    "x": max_x,
                    "y": min_y
                }, {
                    "x": min_x,
                    "y": max_y
                }, {
                    "x": min_x,
                    "y": max_y
                }]
            }];
            annotation["unrecognized"] = true;
            annotation["text"] = value["word"];
            // annotation["confidence"] = value["confidence"];
            annotation["confidence"] = 100;
            annotation["imageIndex"] = imageIndex;
            annotation["src"] = src;
            annotation["prevtext"] = annotation["text"];
            annotation["creating"] = false;
            annotation["lineIndex"] = lineIndex;
            annotation["index"] = annotationIndex;
            linesToBoxes[lineIndex][annotationIndex] = annotation;
        }
    }
    return linesToBoxes;
}

function setupImage(imageIndex) {
    var subjson = finalReverses[imageIndex];
    var src = json["pictures"][imageIndex];
    var annotations = [];
    var realwidth = subjson["width"];
    var realheight = subjson["height"];
    if (realwidth === undefined || realwidth === null) {
        return;
    }

    ignoreLines[imageIndex] = new Set();
    if (json["ignore_lines"]) {
        for (var j in json["ignore_lines"][imageIndex]) {
            ignoreLines[imageIndex].add(json["ignore_lines"][imageIndex][j])
        }
    }

    for (tagIndex in json["tags"]) {
        var tag = json["tags"][tagIndex];
        if (tag["page"] == imageIndex && tag["coordinates"] != null) {
            var coords = tag["coordinates"];
            annotations.push({
                boxes: [{
                    "vertices": [{
                        "x": coords["x"],
                        "y": coords["y"]
                    }, {
                        "x": coords["x"] + coords["width"],
                        "y": coords["y"]
                    }, {
                        "x": coords["x"],
                        "y": coords["y"] + coords["height"]
                    }, {
                        "x": coords["x"] + coords["width"],
                        "y": coords["y"] + coords["height"]
                    }]
                }],
                compress_whitespace: false,
                confidence: tag["confidence"],
                error: tag["confidence"] < get_error_confidence(tag['label']),
                label: tag["label"],
                annotationIndex: annotations.length,
                shapes: [{
                    type: "rect",
                    geometry: {
                        x: coords["x"] / realwidth,
                        y: coords["y"] / realheight,
                        width: coords["width"] / realwidth,
                        height: coords["height"] / realheight
                    }
                }],
                src: src,
                text: tag["text"],
                imageIndex: imageIndex
            });
        }
    }

    for (annotationIndex in json["annotations"]) {
        var annotation = json["annotations"][annotationIndex];
        if (makeAnnotation(imageIndex, annotation)) {
            annotation["annotationIndex"] = annotations.length;
            annotations.push(annotation);
        }
    }

    if (!(imageIndex < pointers.length && pointers[imageIndex]["annotations"])) {
        pointers[imageIndex]["annotations"] = annotations;
    }

    var finalLines = {};
    for (var rowIndex in json["rows"]) {
        var row_to_line = -1;
        var row = json["rows"][rowIndex];
        var content = row["content"];
        var index_counter = 0;
        for (var annotationIndex in content) {
            var annotation = content[annotationIndex];
            if (makeAnnotation(imageIndex, annotation)) {
                if (row_to_line === -1) {
                    row_to_line = parseInt(annotation["upperleft"][1]);
                }
                annotation["group"] = annotation["label"];
                annotation["lineIndex"] = row_to_line;
                annotation["index"] = index_counter;
                annotation["type"] = row["type"];
                annotation["page"] = row["page"];
                index_counter = index_counter + 1;
                annotation["row_to_line"] = row_to_line;
                var finalLine = (row_to_line in finalLines ? finalLines[row_to_line] : []);
                finalLine.push(annotation);
                finalLines[row_to_line] = finalLine;
            }
        }
    }

    if (imageIndex < pointers.length && pointers[imageIndex]["rows"]) {
        finalLines = pointers[imageIndex]["rows"];
        Object.keys(finalLines).forEach(function(key) {
            if (!finalReverses[imageIndex]["lines"][key]) {
                return;
            }
            finalReverses[imageIndex]["lines"][key]["used"] = true;
        });
    } else {
        pointers[imageIndex]["rows"] = finalLines;
    }

    if (imageIndex < pointers.length && show_unrecognized_text && !pointers[imageIndex]["unrecognized"]) {
        pointers[imageIndex]["unrecognized"] = getUnrecognizedAnnotation(imageIndex);
    }
    update_rows(imageIndex);
}

function update_rows(imageIndex) {
    if (!json["table_types"] || !Array.isArray(["table_types"])) {
        return;
    }
    for (var pointerIndex in pointers) {
        for (var rowIndex in pointers[pointerIndex]["rows"]) {
            var rows = pointers[pointerIndex]["rows"][rowIndex];
            var table_type_index = get_table_type_index(rows[0]["type"]);
            if (!table_type_index) {
                continue;
            }
            for (var i in json["table_types"][table_type_index]["columns"]) {
                var matched = false;
                for (var j in rows) {
                    if (rows[j]["column"] == json["table_types"][table_type_index]["columns"][i]) {
                        matched = true;
                        break;
                    }
                }
                if (!matched) {
                    var annotation = createManualAnnotation(0, 0, 0, 0, "", imageIndex);
                    if (!annotation) {
                        continue;
                    }
                    annotation["row_to_line"] = rowIndex;
                    annotation["column"] = json["table_types"][table_type_index]["columns"][i];
                    annotation["label"] = json["table_types"][table_type_index]["labels"][i];
                    annotation["creating"] = false;
                    annotation["group"] = annotation["label"];
                    annotation["lineIndex"] = annotation["row_to_line"];
                    annotation["index"] = 0;
                    annotation["type"] = json["table_types"][table_type_index]["type"];
                    annotation["prevtext"] = undefined;
                    rows.splice(i, 0, annotation);
                }
            }
        }
    }
}


$("#instanceSelected").change(function() {
    generateTable();
});

function loadImageJson(imageIndex) {
    return function() {
        if (this.readyState !== 4 || this.status !== 200) {
            return;
        }
        var subjson = JSON.parse(this.responseText);
        finalReverses[imageIndex] = subjson;
        setupImage(imageIndex);
        if (imageIndex === json["pictures"].length - 1) {
            afterFirstLoad();
        } else {
            // generateTable();
        }
    }
}

function changeRightPanel(sizeOfRight) {
    if (sizeOfRight !== undefined) {
        if (sizeOfRight) {
            var container = document.getElementById("images").parentElement.parentElement.parentElement;
            container.children[1].style.display = "block";
            container.children[0].className = "";
            container.children[1].className = ""

            container.children[0].classList.add("col-md-" + (12 - parseInt(sizeOfRight)));
            container.children[1].classList.add("col-md-" + sizeOfRight);
        } else {
            var container = document.getElementById("images").parentElement.parentElement.parentElement;
            container.children[0].className = "";
            container.children[0].classList.add("col-md-12");
            container.children[1].style.display = "none";
        }
    }
}

function set_table_types(){
    console.log("set_table_types");
    var instance = json["instance"];
    if (instance) {
        // var table_select = document.createElement("option");
        // table_select.setAttribute("data-content", `<span class="label label-primary">${default_table_type}</span>`);
        // table_select.setAttribute("value", default_table_type);
        // $("#instanceSelected").append(table_select);
        $("#instanceSelected").children("option:not(:first)").remove();
        var count = 0;
        for (var i in json["table_types"]) {
            if (!json["table_types"][i] || json["table_types"][i]["type"] === default_table_type) {
                continue;
            }
            if (!(json["table_types"][i]["page"] == undefined || (Number.isInteger(json["table_types"][i]["page"]) && json["table_types"][i]["page"] == activeImage) || (Array.isArray(json["table_types"][i]["page"]) && json["table_types"][i]["page"].indexOf(activeImage) != -1)))
                continue;
            var table_select = document.createElement("option");
            table_select.setAttribute("data-content", '<span class="label label-' + select_label_style_arr[count] + '">' + json["table_types"][i]["label"] + '</span>');
            // table_select.setAttribute("data-content", `<span class="label label-${select_label_style_arr[count]}">${json["table_types"][i]["label"]}</span>`);
            table_select.setAttribute("value", json["table_types"][i]["type"]);
            $("#instanceSelected").append(table_select);
            count += 1;
        }
        $(".selectpicker").selectpicker("refresh");
        $("#instanceSelected").selectpicker("val", default_table_type);
        $("#instanceType").val(instance);
    }
}

function loadInputJson() {
    return function() {
        if (this.readyState !== 4 || this.status !== 200) {
            return;
        }
        json = JSON.parse(this.responseText);
        originalJsonTags = json["tags"];
        if ("ready" in json && !json["ready"]) {
            showModalPopup("Please wait. We are processing your request...");
            setTimeout(startup, 2000);
            return;
        }
        $("#myModal").modal("hide");
        if (!json.offset)
            $("#page-tracker").text((1 + activeImage) + " / " + json["pictures"].length);
        else
            $("#page-tracker").text((activeImage) + " / " + (json["pictures"].length - 1));
        if (json["show_unrecognized_text"] != undefined) {
            show_unrecognized_text = json["show_unrecognized_text"];
        }
        if (Array.isArray(json["show_table"])) {
            for (var i in json["pictures"]) {
                st_flag_arr.push(json["show_table"][i]);
            }
        } else {
            st_flag_arr.push(json["show_table"]);
        }

        if (st_flag_arr[0] != undefined && st_flag_arr[0] === false) {
            toggle_table();
        }
        set_table_types();
        changeRightPanel(json["size_of_right"]);
        images.empty();
        var first = true;
        for (var pictureIndex in json["pictures"]) {
            var img = document.createElement("img");
            img.setAttribute("src", json["pictures"][pictureIndex]);
            img.setAttribute("alt", "Error");
            img.setAttribute("draggable", "false");
            var imgwrapper = document.createElement("div");
            if (first && !json["show_thumbnails"]) {
                imgwrapper.classList.add("active-image");
                first = false;
            }
            imgwrapper.appendChild(img);
            images.append(imgwrapper);
        }

        var xhttp;
        if (window.XMLHttpRequest) {
            // code for modern browsers
            xhttp = new XMLHttpRequest();
        } else {
            // code for old IE browsers
            xhttp = new ActiveXObject("Microsoft.XMLHTTP");
        }
        xhttp.onreadystatechange = function() {
            if (this.readyState !== 4 || this.status !== 200) {
                return;
            }
            if (!this.responseText || this.responseText === "[]") {
                pointers = [];
                for (var i = 0; i < json["pictures"].length; i++) {
                    pointers.push({});
                }
            } else {
                try {
                    saved_json = JSON.parse(this.responseText);
                    if (saved_json["pointers"]){
                        pointers = saved_json["pointers"];
                    } else if (saved_json != {}){
                        pointers = saved_json;
                    }
                    if (saved_json["tags"]){
                        json["tags"] = saved_json["tags"];
                    }
                } catch (err) {
                    console.error("Error loading save!")
                }
            }

            ignoreLines.length = pointers.length;
            for (var pictureIndex in json["pictures"]) {
                var reverseFile = json["pictures"][pictureIndex] + ".reverse.json";
                var xhttp;
                if (window.XMLHttpRequest) {
                    // code for modern browsers
                    xhttp = new XMLHttpRequest();
                } else {
                    // code for old IE browsers
                    xhttp = new ActiveXObject("Microsoft.XMLHTTP");
                }
                xhttp.onreadystatechange = loadImageJson(parseInt(pictureIndex));
                xhttp.open("GET", reverseFile, true);
                xhttp.send();
            }
        };
        xhttp.open("GET", "/review/save/" + directory, true);
        xhttp.send();
    }
}

function afterFirstLoad() {
    if (!json['show_thumbnails']) {
        loadAnnotations();
        generateTable();
        resolveButtons();
    } else {
        firstLoaded = true;
        switchActiveImage(-1);
    }

    $("#choicebox").draggable({
        axis: "x",
        containment: "#draggable-containment"
    });
    $("#barbox").draggable({
        axis: "y",
        containment: "#draggable-containment"
    });
    $("#footer").css("margin-top", "50px");
    document.dispatchEvent(new Event('post_afterFirstLoad'));
}

function startup() {
    if (directory === "annotator") {
        return;
    }
    var xhttp;
    if (window.XMLHttpRequest) {
        // code for modern browsers
        xhttp = new XMLHttpRequest();
    } else {
        // code for old IE browsers
        xhttp = new ActiveXObject("Microsoft.XMLHTTP");
    }
    xhttp.onreadystatechange = loadInputJson();
    xhttp.open("GET", "/review/output/" + directory + "/input.json", true);
    xhttp.send();
}

function findGetParameter(parameterName) {
    var result = null,
        tmp = [];
    var items = location.search.substr(1).split("&");
    for (var index = 0; index < items.length; index++) {
        tmp = items[index].split("=");
        if (tmp[0] === parameterName) result = decodeURIComponent(tmp[1]);
    }
    return result;
}

$(document).on("ready", function() {
    var tableType = findGetParameter("tabletype");
    if (tableType) {
        $("#instanceSelected").val(tableType);
    }
    var instance = findGetParameter("instance");
    if (instance) {
        $("#instanceType").val(instance);
    }
    getSavedConfidence().then(startup);
});
