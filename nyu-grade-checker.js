const fs = require("fs");
const puppeteer = require("puppeteer");
const readline = require("readline");

const redStyle = "\x1b[31m";
const greenStyle = "\x1b[32m";
const whiteStyle = "\x1b[37m";
const resetStyle = "\x1b[0m";

function loadConfig() {
    try {
        const configObj = JSON.parse(fs.readFileSync("./config.json", "utf8"));
        const net_id = configObj["net_id"] || configObj["netId"] || configObj["id"] || configObj["username"];
        const password = configObj["password"];
        const delay = configObj["delay"];

        return Object.keys(configObj).every((el) => ["net_id", "netId", "id", "username", "password"].includes(el)) ?
            { net_id, password, delay } : null;
    } catch (_) {
        try {
            const credentialStr = fs.readFileSync("./credential.txt", "utf8");
            const [, net_id, password] = credentialStr.match(/^[\n\r]*([a-z]+[0-9]+)[\n\r]+(.+)[\n\r]*$/i);
            return { net_id, password };
        } catch (_) {
            return null;
        }
    }
}

async function checkGrade({ net_id, password }) {
    const browser = await puppeteer.launch({
        headless: true,
        args: ["--no-sandbox", "--disable-setuid-sandbox"]
    });

    const page = await browser.newPage();

    await page.goto(`https://m.albert.nyu.edu/app/dashboard/grades`);

    await page.waitForSelector(`form > label.form-group > div.input-box-wrapper > input.input-box[name="username"][type="text"]`);

    await page.evaluate((net_id, password) => {
        document.querySelector(`form > label.form-group > div.input-box-wrapper > input.input-box[name="username"][type="text"]`).value = net_id;
        document.querySelector(`form > label.form-group > div.input-box-wrapper > input.input-box[name="password"][type="password"]`).value = password;
        document.querySelector(`form > button.btn.btn-primary[name="loginAction"][type="submit"]`).click();
    }, net_id, password);

    await page.waitForSelector(`div.secondary-head`);

    const [term, grades] = await page.evaluate(() => [
        document.querySelector(`div.secondary-head`).innerText,
        Array.from(document.querySelectorAll(`div.section-content.clearfix`)).map((el) =>
            ({
                Code: el.querySelector(`div.pull-left > div:last-child`).innerText,
                Class: el.querySelector(`div.pull-left > div:first-child`).innerText,
                Grade: el.querySelector(`div.pull-right > div`).innerText
            })
        )
    ]);

    if (term && grades.length) {
        console.log(`${greenStyle}Grades for ${term}:${resetStyle}`);
        console.table(grades);
    } else {
        console.error(`${redStyle}Unable to get grades${resetStyle}`);
    }

    await browser.close();
}

const main = (function () {
    let timeoutID;
    const { net_id, password, delay } = loadConfig();

    return (typeof net_id === "string" && typeof password === "string") ? (async function run() {
        try {
            clearTimeout(timeoutID);
            console.log(`${whiteStyle}${(new Date()).toLocaleString()} - Checking grades...${resetStyle}`);
            await checkGrade({ net_id, password });
            timeoutID = setTimeout(async () => {
                await run();
            }, 1000 * 60 * ((typeof delay === "number" && delay > 5) ? delay : 60));
        } catch (e) {
            console.error(`${redStyle}Failed at ${(new Date()).toLocaleString()}:\n${e}${resetStyle}`);
            process.exit(1);
        }
    }) : () => {
        console.error(`${redStyle}Please set your login credentials correctly in "config.json" or "credential.txt"${resetStyle}`);
        process.exit(1);
    };
})();

(async function () {
    readline.createInterface({
        input: process.stdin,
        output: process.stdout,
        terminal: false
    }).on("line", (line) => {
        if (["grade", "check", "get"].includes(line.toLowerCase())) {
            main();
        } else {
            console.log(`${whiteStyle}Type "grade", "check", or "get" to check for grade now${resetStyle}`);
        }
    });

    await main();
})();
