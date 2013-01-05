from app import db
from app.models import DailyStockPrice, date_format
from datetime import datetime
import requests
import json

symbols = ['AAPL'] #, 'GOOG']

base_url = 'http://api.stocklytics.com/historicalPrices/1.0/'
api_key = 'api_key'
start_date = datetime(1980,1,1)
end_date = datetime.now()
i = 0

for symbol in symbols:
    parameters = {'api_key':api_key,
                  'stock':symbol,
                  'format':'JSON',
                  'order':'DESC',
                  'start':start_date.strftime(date_format),
                  'end':end_date.strftime(date_format)
                  }
    r = requests.get(base_url,params=parameters)
    j = r.json()
    for day in j:
        print i
        i += 1
        db.session.add(DailyStockPrice(symbol=symbol,
                                       date=datetime.strptime(day,date_format).date(),
                                       open=j[day]['open'],
                                       close=j[day]['close'],
                                       high=j[day]['high'],
                                       low=j[day]['low'],
                                       volume=j[day]['volume'])
                                       )
db.session.commit()