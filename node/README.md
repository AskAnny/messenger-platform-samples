## Requirenments
* Node.js > 6.6.2
* Ngrok

## Get started
1. Install npm dependencies
```sh
npm install
```
2. Start ngrok in new a terminal
```sh
ngrok http 5000
```
3. Copy the https url from output into ``config/default.json``
4. Add FB credentials from console into ``default.json``
5. Replace all ``APP_ID`` and ``PAGE_ID`` with FB credentials in ``public/index.html``
5. Start node server ``npm start``
