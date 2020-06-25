# mecab
Yet another Japanese morphological analyzer

# install docker php-fpm-7.4 with mecab
FROM php:7.4-fpm-alpine
RUN apk add --update alpine-sdk
RUN mkdir /src
RUN cd /src && git clone https://github.com/taku910/mecab.git
RUN cd mecab/mecab && ./configure && make && make install && make clean
RUN cd ../mecab-ipadic && ./configure --with-charset=utf8 && make && make install && make clean
WORKDIR /var/www/html
RUN rm -rf /src
RUN docker-php-ext-install pdo pdo_mysql
