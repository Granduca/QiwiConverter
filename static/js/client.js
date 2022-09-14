var activeRequest = false;

class QiwiConverterClient {
    constructor(prefix, local_storage_var) {
        this.score = null;
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
            this.score = score;
            document.getElementById("result").innerHTML = this.score;
        }
    }
}

var qiwi_client = new QiwiConverterClient();

radio_byn = document.getElementById("radio-1");
radio_byn.checked = true;
radio_dollar_mt = document.getElementById("radio-2");
radio_dollar_bnb = document.getElementById("radio-3");
radio_euro_mt = document.getElementById("radio-4");
radio_euro_bnb = document.getElementById("radio-5");

radios = [radio_byn, radio_dollar_mt, radio_dollar_bnb, radio_euro_mt, radio_euro_bnb]

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
                    qiwi_client.byn = response.byn;
                    qiwi_client.dollar_mt = response.dollar_mt;
                    qiwi_client.dollar_bnb = response.dollar_bnb;
                    qiwi_client.euro_mt = response.euro_mt;
                    qiwi_client.euro_bnb = response.euro_bnb;
                    qiwi_client.score = qiwi_client.byn;
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