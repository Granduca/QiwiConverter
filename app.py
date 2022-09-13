from flask import Flask, render_template, request, make_response, jsonify
from flask_limiter import Limiter
from flask_limiter.util import get_remote_address

import requests
from bs4 import BeautifulSoup

import logging


logging.basicConfig(level='DEBUG')
logger = logging.getLogger(f"QiwiConverter Server")


app = Flask('QiwiConverter')
limiter = Limiter(
    app,
    key_func=get_remote_address,
    default_limits=["2000 per day", "120 per hour", "20/minute", "1/second"]
    # default_limits=["1 per day"]
)


class Converter:
    def __init__(self, value):
        self.value = value

    def get(self, url):
        request = requests.get(url)
        return request

    def soup(self, url):
        html = self.get(url).text
        soup = BeautifulSoup(html, "html.parser")
        return soup

    def get_byn(self):
        soup = self.soup('https://myfin.by/bank/kursy_valjut_nbrb/rub')
        block = soup.find('div', {"class": "cur-rate"})
        byn_rate = block.find('div', attrs={'class': 'h1'})
        self.byn = float(byn_rate.text)

    def convert(self):
        result = None
        if self.value:
            try:
                float(self.value)
            except ValueError as e:
                return 'Ошибка ввода!<br>Требуется ввести число.'
            except Exception as e:
                return str(e)
            result = 100 / 0.85 / 0.95 / self.byn
        return float(self.value) / result

    def result(self):
        self.get_byn()
        result = self.convert()
        if result:
            if type(result) != float:
                return {'message': result, 'code': 500}
            return {'message': f"{format(result, '.2f')} BYN", 'code': 200}
        else:
            return {'message': 'Bad request', 'code': 500}


@app.route('/')
def index():
    return render_template('index.html')


@app.route('/converter', methods=["POST"])
def rio_post():
    data = request.data.decode('utf-8')
    logger.info(f"Request: {data}")
    result = Converter(data).result()
    response = make_response(jsonify(message=result['message'], status=result['code']))
    return response


if __name__ == '__main__':
    app.run()
