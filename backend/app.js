var createError = require('http-errors');
var express = require('express');
var path = require('path');
var logger = require('morgan');
var indexRouter = require('./routes/index');
var productsRouter = require('./routes/products');
var userRouter = require('./routes/user');
// var orderRouter = require('./routes/order');
var app = express();
const cors = require('cors');
var http = require('http');
const swaggerUi = require('swagger-ui-express')
const swaggerFile = require('./swagger_output.json') // 剛剛輸出的 JSON
// view engine setup
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'jade');
app.use(logger('dev'));
app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));
app.use('/', indexRouter);
app.use('/products', productsRouter);
app.use('/user', userRouter);
// app.use('/order', orderRouter);
app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerFile))
// 設置 CORS 選項
const corsOptions = {
  "origin": "*",
  "methods": "GET,HEAD,PUT,PATCH,POST,DELETE",
  "preflightContinue": false,
  "optionsSuccessStatus": 204
};

// 啟用 CORS 中間件，使用指定的選項
app.use(cors(corsOptions));
// catch 404 and forward to error handler
app.use(function (req, res, next) {
  res.status(404);
});

// error handler
app.use(function (err, req, res, next) {
  // set locals, only providing error in development
  res.locals.message = err.message;
  res.locals.error = req.app.get('env') === 'development' ? err : {};

  // render the error page
  res.status(err.status || 500);
  // res.render('error');
});

var server = http.createServer(app);
server.listen(5000);
console.log('Express server started on port %s', server.address().port);
module.exports = app;
