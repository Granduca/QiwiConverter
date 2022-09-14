var activeRequest = false;

class QiwiConverterClient {
    constructor(prefix, local_storage_var) {
        this.currency_byn = null;
        this.currency_dollar_mt = null;
        this.currency_dollar_bnb = null;
        this.currency_euro_mt = null;
        this.currency_euro_bnb = null

        this.byn = null;
        this.dollar_mt = null;
        this.dollar_bnb = null;
        this.euro_mt = null;
        this.euro_bnb = null;
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
            document.getElementById("result").innerHTML = score;
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
        invert(false);
        return false;
    }
}

function invert(is_user) {
    let value = document.getElementById("rubInput").value;
    if (is_user) {
        let text = document.getElementById("result").innerHTML;
        document.getElementById("result").innerHTML = value;
        document.getElementById("rubInput").value = parseFloat(text);
        return true;
    }
    if (check_invert.checked) {
        if (radio_byn.checked) {
            if (qiwi_client.currency_byn) {
                document.getElementById("result").innerHTML = Math.round(qiwi_client.currency_byn * value);
                return true;
            } else {
                check_invert.checked = false;
                get_result();
            }
        }
        if (radio_dollar_mt.checked) {
            if (qiwi_client.currency_dollar_mt && qiwi_client.currency_byn) {
                document.getElementById("result").innerHTML = Math.round(qiwi_client.currency_byn * (value * qiwi_client.currency_dollar_mt)) + " RUB";
                return true;
            } else {
                check_invert.checked = false;
                get_result();
            }
        }
        if (radio_dollar_bnb.checked) {
            if (qiwi_client.currency_dollar_bnb && qiwi_client.currency_byn) {
                document.getElementById("result").innerHTML = Math.round(qiwi_client.currency_byn * (value * qiwi_client.currency_dollar_bnb)) + " RUB";
                return true;
            } else {
                check_invert.checked = false;
                get_result();
            }
        }
        if (radio_euro_mt.checked) {
            if (qiwi_client.currency_euro_mt && qiwi_client.currency_byn) {
                document.getElementById("result").innerHTML = Math.round(qiwi_client.currency_byn * (value * qiwi_client.currency_euro_mt)) + " RUB";
                return true;
            } else {
                check_invert.checked = false;
                get_result();
            }
        }
        if (radio_euro_bnb.checked) {
            if (qiwi_client.currency_euro_bnb && qiwi_client.currency_byn) {
                document.getElementById("result").innerHTML = Math.round(qiwi_client.currency_byn * (value * qiwi_client.currency_euro_bnb)) + " RUB";
                return true;
            } else {
                check_invert.checked = false;
                get_result();
            }
        }
    } else {
        get_result();
    }
}

function get_result() {
    let rub = document.getElementById("rubInput").value;

    if(!rub) {
        return false;
    }

    if (!checkNumber(rub)) {
        document.getElementById("result").innerHTML = "Ошибка ввода!<br>Требуется ввести число.";
        return false;
    }

    document.getElementById("result").innerHTML = "Отправляю запрос...";
    qiwi_client.post({
        "url": 'converter',
        "data": rub,
        "success": function(response) {
                    qiwi_client.currency_byn = response.currency_byn;
                    qiwi_client.currency_dollar_mt = response.currency_dollar_mt;
                    qiwi_client.currency_dollar_bnb = response.currency_dollar_bnb;
                    qiwi_client.currency_euro_mt = response.currency_euro_mt;
                    qiwi_client.currency_euro_bnb = response.currency_euro_bnb;

                    qiwi_client.byn = response.byn;
                    qiwi_client.dollar_mt = response.dollar_mt;
                    qiwi_client.dollar_bnb = response.dollar_bnb;
                    qiwi_client.euro_mt = response.euro_mt;
                    qiwi_client.euro_bnb = response.euro_bnb;

                    for (radio of radios) {
                        if (radio.checked) {
                            radio.click();
                        }
                    }
        },
        "error": function() {
            document.getElementById("result").innerHTML = "Ошибка!";
        }
    });
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