# Copy as Markdown

A simple chrome extension which can copy the selected HTML as Markdown to clipboard.

It works on desktop but also on Chrome for Android based browsers that support extensions (eg, Edge Canary).

## Install

* [Chrome WebStore](https://chrome.google.com/webstore/detail/copy-as-markdown/pcmnmggfchmeohmflkfocnkackgcnlln?authuser=0&hl=en)

## Usage

1. Click `Copy as Markdown` icon in the toolbar.

2. Click the right button and click `Copy as Markdown` menu.

3. Press `Alt+Shift+Y` on Windows or `Option+Shift+Y` on Mac.

## Build

* to build, use `npm run build`

* To make a crx, use:

```
npm install -g crx3
crx3 --zip dist/ --private-key my-extension.pem
```

The private key can be left out for testing purposes, one will then be autogenerated.

## Author

Original author: sjmyuan

Originally hosted at: https://github.com/sjmyuan/copy-as-markdown
