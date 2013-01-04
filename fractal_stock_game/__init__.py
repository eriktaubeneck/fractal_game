from flask import Flask, request, render_template
from flask.ext.sqlalchemy import SQLAlchemy
from sqlalchemy import distinct, func
from json import dumps
from random import choice
from datetime import datetime, timedelta

app = Flask(__name__)
app.config.update(
  SECRET_KEY = 'dev key',
  DEBUG = True,
  SQLALCHEMY_DATABASE_URI = 'mysql://root:a@localhost/fractal_game'
)
db = SQLAlchemy(app)

from models import DailyStockPrice, date_format

#constants
series_length = 50
series_spacings = [1,5,20]
series_spacings_text = {1:'days', 5:'weeks', 20:'months'}
symbols = [s[0] for s in db.session.query(distinct(DailyStockPrice.symbol)).all()]
end_date = datetime(2013,1,1)

@app.route('/get_data')
def get_data():
  try:
    symbol = request.args['symbol']
    series_spacing = int(request.args['series_spacing'])
    start_date = request.args['start_date']
  except KeyError:
    return '0'
  days_range = series_length*series_spacing*2 # x2 as conservative buffer for days market is closed
  days = DailyStockPrice.query.filter_by(symbol=symbol).filter(DailyStockPrice.date >= start_date).order_by('date').limit(days_range).all()
  return dumps([day.json_dict() for day in days[::series_spacing]])

@app.route('/random')
def random_data():
  symbol = choice(symbols)
  series_spacing = choice(series_spacings)
  days_range = series_length*series_spacing*2
  max_start_date = (end_date - timedelta(days_range)).date() 
  start_date = DailyStockPrice.query.filter_by(symbol=symbol).filter(DailyStockPrice.date < max_start_date).order_by(func.rand()).first().date.strftime(date_format)
  return render_template('random.html',
                         symbol=symbol,
                         series_spacing=series_spacing,
                         start_date=start_date)

@app.route('/answer', methods=['POST'])
def answer():
  # try:
  symbol = request.args['symbol']
  series_spacing = int(request.args['series_spacing'])
  start_date = request.args['start_date']    
  correct = int(request.form['answer']) == series_spacing
  # except KeyError as e:
  #   return 'error: %s' % e
  return render_template('random.html',
                         answer=series_spacings_text[series_spacing],
                         correct=correct,
                         symbol=symbol,
                         series_spacing=series_spacing,
                         start_date=start_date)

if __name__ == '__main__':
  app.run()