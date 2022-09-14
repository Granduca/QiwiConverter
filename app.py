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
        self.byn = None
        self.dollar_mt = None
        self.dollar_bnb = None
        self.euro_mt = None
        self.euro_bnb = None

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

    def get_currency(self):
        table = self.soup('https://www.bnb.by/kursy-valyut/platezhnye-karty/')
        table_body = table.find('tbody')
        rows = table_body.find_all('tr')
        data = []
        for row in rows:
            cols = row.find_all('td')
            cols = [ele.text.strip() for ele in cols]
            data.append([ele for ele in cols if ele])
        for item in data:
            if item[0] == 'USD':
                self.dollar_bnb = float(item[2])
            if item[0] == 'EUR':
                self.euro_bnb = float(item[2])

        body = self.soup('https://myfin.by/bank/mtbank/currency')
        table = body.find('div', attrs={'class': 'table-responsive'})
        table_body = table.find('tbody')
        rows = table_body.find_all('tr')
        data = []
        for row in rows:
            cols = row.find_all('td')
            cols = [ele.text.strip() for ele in cols]
            data.append([ele for ele in cols if ele])
        for item in data:
            if item[0] == 'Доллар США':
                self.dollar_mt = float(item[2])
            if item[0] == 'Евро':
                self.euro_mt = float(item[2])

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
        self.get_currency()
        byn_result = self.convert()
        try:
            dollar_mt_result = byn_result / self.dollar_mt
        except:
            dollar_mt_result = -1
        try:
            dollar_bnb_result = byn_result / self.dollar_bnb
        except:
            dollar_bnb_result = -1
        try:
            euro_mt_result = byn_result / self.euro_mt
        except:
            euro_mt_result = -1
        try:
            euro_bnb_result = byn_result / self.euro_bnb
        except :
            euro_bnb_result = -1
        if byn_result:
            if type(byn_result) != float:
                return {'message': byn_result, 'code': 500}
            return {'message': "OK",
                    'byn': f"{format(byn_result, '.2f')} BYN",
                    'dollar_mt': f"$ {format(dollar_mt_result, '.2f')}", 'dollar_bnb': f"$ {format(dollar_bnb_result, '.2f')}",
                    'euro_mt': f"€ {format(euro_mt_result, '.2f')}", 'euro_bnb': f"€ {format(euro_bnb_result, '.2f')}",
                    'code': 200}
        else:
            return {'message': 'Bad request', 'code': 500}


@app.route('/')
def index():
    return render_template('index.html')


@app.route('/converter', methods=["POST"])
def qiwi_post():
    data = request.data.decode('utf-8')
    logger.info(f"Request: {data}")
    result = Converter(data).result()
    response = make_response(jsonify(message=result['message'],
                                     byn=result['byn'],
                                     dollar_mt=result['dollar_mt'], dollar_bnb=result['dollar_bnb'],
                                     euro_mt=result['euro_mt'], euro_bnb=result['euro_bnb'],
                                     status=result['code']))
    return response


if __name__ == '__main__':
    app.run()
