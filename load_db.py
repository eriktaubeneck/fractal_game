from app.models import DailyStockPrice, db, date_format
from datetime import datetime
import requests
import json

symbols = ['AAPL'] #, 'GOOG']

base_url = 'http://api.stocklytics.com/historicalPrices/1.0/'
api_key = '6d101f8ab6bf5d4b195b492304f5ab76776ff2ac'
start_date = datetime(1980,1,1)
end_date = datetime.now()

for symbol in symbols:
    parameters = {'api_key':api_key,
                  'stock':symbol,
                  'format':'JSON',
                  'order':'DESC',
                  'start':start_date.strftime(date_format),
                  'end':end_date.strftime(date_format)
                  }
    r = requests.get(base_url,params=parameters)
    for day in r.json:
        db.session.add(DailyStockPrice(symbol=symbol,
                                       date=datetime.strptime(day,date_format).date(),
                                       open=r.json[day]['open'],
                                       close=r.json[day]['close'],
                                       high=r.json[day]['high'],
                                       low=r.json[day]['low'],
                                       volume=r.json[day]['volume'])
                                       )
db.session.commit()