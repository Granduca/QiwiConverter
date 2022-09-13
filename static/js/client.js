var activeRequest = false;

class QiwiConverterClient {
    constructor(prefix, local_storage_var) {
        this.score = null;
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
//                console.log(response);
                activeRequest = false;
                if(response.status == 200) {
                    params["success"]();
                    this.score = response.message;
                    document.getElementById("result").innerHTML = this.score;

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
}

var real_rio = new QiwiConverterClient();


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
    real_rio.post({
        "url": 'converter',
        "data": rub,
        "success": function() {
            document.getElementById("result").innerHTML = "Успешно!";
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