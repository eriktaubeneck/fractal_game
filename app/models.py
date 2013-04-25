from app import db
from datetime import datetime, date

# class Series(db.Model):
#   __tablename__ = 'series'
#   
#   id = db.Column(db.Integer, primary_key=True)

type_conversions = {int: lambda x: x,
                    float: lambda x: x,
                    long: lambda x: x,
                    str: lambda x: x,
                    unicode: lambda x: x,
                    date:lambda x: x.strftime(date_format),
                    datetime: lambda x: x.strftime(date_format),
}
date_format = "%Y-%m-%d"

class DailyStockPrice(db.Model):
  __tablename__ = 'daily_stock_price'
  
  id = db.Column(db.Integer, primary_key=True)
  symbol = db.Column(db.String(10))
  date = db.Column(db.Date)
  open = db.Column(db.Float)
  close = db.Column(db.Float)
  high = db.Column(db.Float)
  low = db.Column(db.Float)
  volume = db.Column(db.Integer)
  
  def __init__(self, symbol, date, open, close, high, low, volume):
    self.symbol = symbol
    self.date = date
    self.open = open
    self.close = close
    self.high = high
    self.low = low
    self.volume = volume

  def json_dict(self):
    ignored_attrs = ['_sa_instance_state']
    return {attr:type_conversions[type(getattr(self,attr))](getattr(self,attr)) for attr in self.__dict__ if attr not in ignored_attrs}

db.create_all()