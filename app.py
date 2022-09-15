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
    def __init__(self):
        self.byn = None
        self.qiwi_byn = None
        self.dollar_mt = None
        self.dollar_bnb = None
        self.euro_mt = None
        self.euro_bnb = None

    def get(self, url):
        request = requests.get(url, timeout=20)
        return request

    def soup(self, url):
        html = self.get(url).text
        soup = BeautifulSoup(html, "html.parser")
        return soup

    def get_byn(self):
        if not self.byn:
            soup = self.soup('https://myfin.by/bank/kursy_valjut_nbrb/rub')
            block = soup.find('div', {"class": "cur-rate"})
            byn_rate = block.find('div', attrs={'class': 'h1'})
            self.byn = float(byn_rate.text)

    def get_currency(self):
        if not self.dollar_mt or not self.euro_mt:
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

        if not self.dollar_bnb or not self.euro_bnb:
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

    def get_qiwi(self):
        if self.byn:
            self.qiwi_byn = 100 / 0.85 / 0.95 / self.byn
        else:
            return False

    def do(self):
        self.get_byn()
        self.get_currency()

        self.get_qiwi()

        if all(self.__dict__.values()):
            return {'message': "OK",
                    'byn': self.byn,
                    'qiwi_byn': self.qiwi_byn,
                    'dollar_mt': self.dollar_mt, 'dollar_bnb': self.dollar_bnb,
                    'euro_mt': self.euro_mt, 'euro_bnb': self.euro_bnb,
                    'code': 200}
        else:
            return {'message': 'Bad request', 'code': 500}


converter = Converter()


@app.route('/')
def index():
    return render_template('index.html')


@app.route('/converter', methods=["POST"])
def qiwi_post():
    data = request.data.decode('utf-8')
    logger.info(f"Request: {data}")
    result = converter.do()
    response = make_response(jsonify(message=result['message'],
                                     byn=result['byn'],
                                     qiwi_byn=result['qiwi_byn'],
                                     dollar_mt=result['dollar_mt'], dollar_bnb=result['dollar_bnb'],
                                     euro_mt=result['euro_mt'], euro_bnb=result['euro_bnb'],
                                     status=result['code']))
    return response


if __name__ == '__main__':
    app.run()
