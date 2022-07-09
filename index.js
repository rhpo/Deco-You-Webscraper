const { Builder, Browser, By, Key, until, Alert } = require('selenium-webdriver');
const http = require('http');
const https = require('https');
const fs = require('fs');
const colors = require('colors');
const yaml = require('yaml');
const path = require('path');

function defined(v) {
    return typeof v !== 'undefined';
}

function isNodeJS() {
    return typeof process !== 'undefined' && process.versions && process.versions.node;
}

if (isNodeJS()) {
    global.fetch = (...args) =>
        import ('node-fetch').then(({ default: fetch }) => fetch(...args));
}

function urlExists(url) {
    let result = false;
    let protocol = url.startsWith('https') ? https : http;
    protocol.get(url, res => {
        result = res.statusCode === 200;
    });
}

if (!fs.existsSync('./config.yaml')) {
    fs.writeFileSync('./config.yaml', 'imageLimit: 15\nstartingUrl: https://www.decoandyou.com/papel-pintado/1019020187-hawai.html\ndownloadDirectory: ./downloads\nlogTXT: ./log.txt\nlogToFile: true\nenablePreview: true\npreviewPath: ./preview');
}

const config = yaml.parse(fs.readFileSync('./config.yaml', 'utf8'));
const startingUrl = config.startingUrl;
const downloadDirectory = config.downloadDirectory || './downloads';
const logTXT = config.logTXT || './log.txt';
const imageLimit = config.imageLimit || 15;
const enablePreview = config.enablePreview !== undefined ? config.enablePreview : true;
const previewPath = config.previewPath || '/preview';
const logToFile = config.logToFile !== undefined ? config.logToFile : true;


if (!fs.existsSync(downloadDirectory)) {
    fs.mkdirSync(downloadDirectory);
}
if (!fs.existsSync(logTXT)) {
    fs.writeFileSync(logTXT, '');
}

function print(s, color = 'white') {
    console.log(colors[color](s));
    if (logToFile) {
        if (fs.existsSync(logTXT)) {
            fs.appendFileSync(logTXT, `${s}\n`);
        } else {
            fs.writeFileSync(logTXT, `${s}\n`);
        }
    }
}

function replaceSmallToLarge(url) {
    return url.replace('small_default', 'large_default');
}

function replaceMediumToLarge(url) {
    return url.replace('medium_default', 'large_default');
}

function capitalize(name = '') {
    if (typeof name !== 'string') {
        return name;
    } else {
        return name.split(' ').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' ');
    }
}

console.log('Ahlan Romaissa'.rainbow);

((async() => await print('\n· New Session has Started AT ' + new Date().toLocaleString() + ' in ' + await fetch('https://ipinfo.io/json').then(res => res.json()).then(res => res.city.toUpperCase()) + ' !', 'cyan'))());

function download(url, callback = void 0, filename, path) {
    filename = filename || url.split('/').pop();
    path = path || `${downloadDirectory}/${filename}`;

    const protocol = url.startsWith('https') ? https : http;
    return new Promise((resolve, reject) => {
        protocol.get(url, res => {
            const file = fs.createWriteStream(path);
            res.pipe(file);
            file.on('finish', () => {
                file.close();
                resolve(path);
                callback && callback(path);
            });
        }).on('error', err => {
            reject(err);
        });
    });
}

(async() => {
    let driver;
    try {
        driver = await new Builder().forBrowser(Browser.FIREFOX).build();
    } catch {
        print('Critical: Please install Firefox', 'red');
        process.exit();
    }
    // hide the browser
    await driver.manage().window().setRect({ width: 0, height: 0 });
    // minimize the browser
    await driver.manage().window().minimize();

    let currentProd = startingUrl;

    for (var i = 0; i < imageLimit; i++) {
        await driver.get(currentProd);
        var fileName = currentProd.split('/').pop().toLowerCase();
        var folderOfImage = await driver.executeScript(`return document.querySelector('.product-detail-name').textContent`);
        folderOfImage = folderOfImage.toLowerCase();

        var imageWidth = await driver.executeScript(`return document.querySelector('.mz-figure').firstChild.naturalWidth`);
        var imageHeight = await driver.executeScript(`return document.querySelector('.mz-figure').firstChild.naturalHeight`);
        var imageSizeMB = imageWidth * imageHeight * 3 / 1024 / 1024;

        print('\n' + (i + 1) + ': ~ · Working on: ' + capitalize(folderOfImage) + ' From: ' + colors.underline(capitalize(currentProd)) + ' ...', 'cyan');

        var path = `${downloadDirectory}/${folderOfImage}`;

        if (!fs.existsSync(path)) {
            fs.mkdirSync(path);

            let otherProductVersionsSrc = await driver.executeScript(`return (function () {let rom = '';document.querySelectorAll('#add-to-cart-or-refresh .imgInput').forEach(i => rom += i.getAttribute('src') + '\\n');rom = rom.substring(0, rom.length - 1); return rom})()`);
            otherProductVersionsSrc = otherProductVersionsSrc.split('\n').map(replaceSmallToLarge);
            let titleOfImage = await driver.executeScript(`return (function () {let rom = '';document.querySelectorAll('#add-to-cart-or-refresh .selectorColor').forEach(i => rom += i.getAttribute('title') + '\\n');rom = rom.substring(0, rom.length - 1); return rom})()`);
            titleOfImage = titleOfImage.split('\n');

            let final = [];
            for (var j = 0; j < otherProductVersionsSrc.length; j++) {
                final.push([otherProductVersionsSrc[j], titleOfImage[j]]);
            }

            if (final.length > 1) {
                print(
                    `(i) · ${capitalize(folderOfImage)} has ${titleOfImage.length} models, (${titleOfImage.join(', ')})`, 'blue'
                )
                final.forEach(async([url, title]) => {
                    var fn = `${title}.${url.split('/').pop().split('.').pop()}`.toLowerCase();
                    var p = `${path}/${fn}`.toLowerCase();

                    print(`~ · Downloading ${capitalize(folderOfImage)}: ${title}`, 'magenta');
                    await download(url, void 0, fn, p);
                    print('+ · Downloaded Model: ' + colors.underline(capitalize(title)) + ' from Product: ' + capitalize(folderOfImage) + ' ...', 'green');

                });
            } else {
                var alter = await driver.executeScript(`return document.querySelector('[itemprop="image"]').src`);
                if (alter && alter !== '') {
                    var fn = `${folderOfImage}.${alter.split('/').pop().split('.').pop()}`.toLowerCase();
                    var p = `${path}/${fn}`.toLowerCase();
                    print(`${'(i) · '.blue + colors.underline(capitalize(folderOfImage)) + ' Has Only one Main model, Downloading it...'}`, 'yellow');
                    await download(alter, void 0, fn, p);
                    print('+ · Downloaded Model: ' + colors.underline(capitalize(folderOfImage)) + ' from Product: ' + capitalize(folderOfImage) + ' ...', 'green');
                } else {
                    print(`${'(i) · '.blue + colors.underline(capitalize(folderOfImage)) + ' Has no models...'}`, 'yellow');
                }
            }

            if (enablePreview) {
                var fn = `${folderOfImage.toUpperCase()}${Math.floor(Math.random() * 100000)}.jpg`.toLowerCase();
                var p = `${path}/${previewPath}/${fn}`;

                const prevPath = `${path}/${previewPath}`;
                if (!fs.existsSync(prevPath)) {
                    fs.mkdirSync(prevPath);
                }

                let imgSrcs = await driver.executeScript('return (()=>{var t="";document.querySelectorAll(\'[id^="MagicToolboxSelectors"]>a\').forEach(e=>t+=e.getAttribute("data-image")+"\\n"),t=t.substring(0,t.length-1);return t;})();');
                imgSrcs = imgSrcs.split("\n").map(replaceMediumToLarge);

                if (imgSrcs.length <= 1) {
                    imgSrcs = await driver.executeScript(`return (()=>{var t='';document.querySelectorAll('.mcs-item > a > img ').forEach(i => t+= i.src + '\\n');t=t.substring(0, t.length-1);return t;})();`);
                    imgSrcs = imgSrcs.split("\n").map(replaceMediumToLarge);
                }

                if (imgSrcs.length > 1) {
                    print(`(i) · ${capitalize(folderOfImage)} has ${imgSrcs.length} previews...`, 'blue');
                    imgSrcs.forEach(async(url, index) => {
                        print(`~ · Downloading Preview for: ${capitalize(folderOfImage)} ... No.${index + 1}`, 'magenta');
                        fn = `${folderOfImage.toUpperCase()}${Math.floor(Math.random() * 100000)}.jpg`.toLowerCase();
                        console.log(fn, url);
                        await download(url, void 0, fn, p);
                        print(`+ · Downloaded Preview for: ${capitalize(folderOfImage)} ... No.${index + 1}`, 'green');
                    });
                } else {
                    print(`${'(i) · '.blue + colors.underline(capitalize(folderOfImage)) + ' Has no previews...'}`, 'yellow');
                }
            }


        } else {
            print(`O · ${capitalize(folderOfImage)} Already Exists.`, 'grey');
            i = i - 1;
        }
        currentProd = await driver.executeScript("return document.querySelectorAll('.product-thumbnail[href^=\"/papel-pintado/\"]')[Math.floor(Math.random()*document.querySelectorAll('.product-thumbnail[href^=\"/papel-pintado/\"]').length)].href")

    }
    driver.quit();
    print(`\n\n# · Finished! Press any key to Exit`, 'green');
    process.stdin.setRawMode(true);
    process.stdin.resume();
    process.stdin.on('data', process.exit.bind(process, 0));

})();