FROM apify/actor-node:20

RUN apt-get update && apt-get install -y \
  tesseract-ocr \
  tesseract-ocr-ind \
  tesseract-ocr-eng \
  poppler-utils \
  libopencv-dev \
  && rm -rf /var/lib/apt/lists/*

COPY package.json ./
RUN npm install --omit=dev

COPY . ./

CMD npm start
