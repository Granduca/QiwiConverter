var activeRequest = false;


class QiwiConverterClient {
    constructor(prefix, local_storage_var) {
        this.byn = null;
        this.qiwi_byn = null;
        this.dollar_mt = null;
        this.dollar_bnb = null;
        this.euro_mt = null;
        this.euro_bnb = null;

        this.result_byn = null;
        this.result_dollar_mt = null;
        this.result_dollar_bnb = null;
        this.result_euro_mt = null;
        this.result_euro_bnb = null;

        this.updated = false;
    }

    post(params) {
        if(activeRequest) {
            console.log('First you need to wait until the previous request is completed...')
            return;
        }
        activeRequest = true;
        params["self"] = this;
        $.ajax({url: params["url"],
            method: 'POST',
            data: params["data"],
            contentType: 'application/json;charset=UTF-8',
            success: function(response) {
                activeRequest = false;
                if(response.status == 200) {
                    params["success"](response);
                } else if(response.status == 500) {
                    params["error"]();
                    document.getElementById("result").innerHTML = response.message;
                } else {
                    params["error"]();
                    document.getElementById("result").innerHTML = "error";
                }
            },
            error: function (response) {
                activeRequest = false;
                params["error"]();
                document.getElementById("result").innerHTML = response.statusText;
            }
        });
    }

    set_score(score) {
        if (score) {
            rub = document.getElementById("rubInput").value;
            if (rub) {
                if (checkNumber(rub)) {
                    document.getElementById("result").innerHTML = score;
                } else {
                    clear_values();
                }
            } else {
                clear_values();
            }
        }
    }
}


var qiwi_client = new QiwiConverterClient();

var check_invert = document.getElementById("check-invert");
check_invert.checked = false;

var radio_byn = document.getElementById("radio-1");
radio_byn.checked = true;

var radio_dollar_mt = document.getElementById("radio-2");
var radio_dollar_bnb = document.getElementById("radio-3");
var radio_euro_mt = document.getElementById("radio-4");
var radio_euro_bnb = document.getElementById("radio-5");

var radios = [radio_byn, radio_dollar_mt, radio_dollar_bnb, radio_euro_mt, radio_euro_bnb]


document.getElementById("rubInput").onkeypress = function(e) {
    if (!e) e = window.event;
    var keyCode = e.code || e.key;
    if (keyCode == 'Enter' || keyCode == 'NumpadEnter') {
        get_result();
        return false;
    }
}


function get_result() {
    let rub = document.getElementById("rubInput").value;

    if(!rub) {
        clear_values();
        return false;
    }

    if (!checkNumber(rub)) {
        document.getElementById("result").innerHTML = "Ошибка ввода!<br>Требуется ввести число.";
        return false;
    }

    if (!qiwi_client.updated) {
        document.getElementById("result").innerHTML = "Отправляю запрос...";
        qiwi_client.post({
            "url": 'converter',
            "data": rub,
            "success": function(response) {
                        qiwi_client.byn = response.byn;
                        qiwi_client.qiwi_byn = response.qiwi_byn;
                        qiwi_client.dollar_mt = response.dollar_mt;
                        qiwi_client.dollar_bnb = response.dollar_bnb;
                        qiwi_client.euro_mt = response.euro_mt;
                        qiwi_client.euro_bnb = response.euro_bnb;

                        qiwi_client.updated = true;

                        set_values();
                        click_active_radio();
            },
            "error": function() {
                document.getElementById("result").innerHTML = "Ошибка!";
            }
        });
    } else {
        set_values();
        click_active_radio();
    }
}


function click_active_radio() {
    for (radio of radios) {
        if (radio.checked) {
            radio.click();
        }
    }
}


function set_values() {
    rub = document.getElementById("rubInput").value;

    if (rub) {
        if (checkNumber(rub)) {
            if (!check_invert.checked) {
                qiwi_client.result_byn = (rub / qiwi_client.qiwi_byn).toFixed(2) + " BYN";
                qiwi_client.result_dollar_mt = "$" + (rub / qiwi_client.qiwi_byn / qiwi_client.dollar_mt).toFixed(2);
                qiwi_client.result_dollar_bnb = "$" + (rub / qiwi_client.qiwi_byn / qiwi_client.dollar_bnb).toFixed(2);
                qiwi_client.result_euro_mt = "€" + (rub / qiwi_client.qiwi_byn / qiwi_client.euro_mt).toFixed(2);
                qiwi_client.result_euro_bnb =  "€" + (rub / qiwi_client.qiwi_byn / qiwi_client.euro_bnb).toFixed(2);
            } else {
                qiwi_client.result_byn = (rub * qiwi_client.qiwi_byn).toFixed(2) + " RUB";
                qiwi_client.result_dollar_mt = (rub * qiwi_client.qiwi_byn * qiwi_client.dollar_mt).toFixed(2) + " RUB";
                qiwi_client.result_dollar_bnb = (rub * qiwi_client.qiwi_byn * qiwi_client.dollar_bnb).toFixed(2) + " RUB";
                qiwi_client.result_euro_mt = (rub * qiwi_client.qiwi_byn * qiwi_client.euro_mt).toFixed(2) + " RUB";
                qiwi_client.result_euro_bnb =  (rub * qiwi_client.qiwi_byn * qiwi_client.euro_bnb).toFixed(2) + " RUB";
            }
        }
    }
}


function clear_values() {
    document.getElementById("rubInput").value = "";
    document.getElementById("result").innerHTML = "";
    set_values();
}


function checkNumber(x) {
    x = Number(x);
    if(typeof x == 'number' && !isNaN(x)){
        if (Number.isInteger(x)) {
            return true;
        }
        else {
            return true;
        }

    } else {
        return false;
    }
}