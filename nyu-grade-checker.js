const fs = require("fs");
const puppeteer = require("puppeteer");
const readline = require("readline");

const redStyle = "\x1b[31m";
const greenStyle = "\x1b[32m";
const whiteStyle = "\x1b[37m";
const resetStyle = "\x1b[0m";

/**
 * Loads the configuration file.
 *
 * @return {Object}
 */
function loadConfig() {
    try {
        const configObj = JSON.parse(fs.readFileSync("./config.json", "utf8"));
        const net_id = configObj["net_id"] || configObj["netId"] || configObj["id"] || configObj["username"];
        const password = configObj["password"];
        const interval = configObj["interval"];

        return { net_id, password, interval };
    } catch (_) {
        try {
            const credentialStr = fs.readFileSync("./credential.txt", "utf8");
            const [, net_id, password] = credentialStr.match(/^[\n\r]*([a-z]+[0-9]+)[\n\r]+(.+)[\n\r]*$/i);
            return { net_id, password };
        } catch (_) {
            return {};
        }
    }
}

/**
 * Checks user's latest grade.
 *
 * @param net_id {string} User's NetID
 * @param password {string} User's login password
 * @return {Promise<{term: string, grades: {Code: string, Class: string, Grade: string}[]}>}
 */
async function checkGrade(net_id, password) {
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
        console.log(`${ greenStyle }Grades for ${ term }:${ resetStyle }`);
        console.table(grades);
    } else {
        console.error(`${ redStyle }Unable to get grades${ resetStyle }`);
    }

    await browser.close();

    return { term, grades };
}

/**
 * Main function that runs the program.
 *
 * @type {function}
 */
const main = (function () {
    let timeoutID;
    const { net_id, password, interval } = loadConfig();

    return (typeof net_id === "string" && typeof password === "string") ? (async function run() {
        clearTimeout(timeoutID);
        console.log(`${ whiteStyle }${ (new Date()).toLocaleString() } - Checking grades...${ resetStyle }`);
        try {
            await checkGrade(net_id, password);
        } catch (e) {
            console.error(`${ redStyle }Failed at ${ (new Date()).toLocaleString() }:\n${ e }${ resetStyle }`);
        }
        timeoutID = setTimeout(async () => {
            await run();
        }, 1000 * 60 * ((typeof interval === "number" && interval >= 5) ? interval : 60));
    }) : () => {
        console.error(`${ redStyle }Please set your login credentials correctly in "config.json" or "credential.txt"${ resetStyle }`);
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
            console.log(`${ whiteStyle }Type "grade", "check", or "get" to check for grade now${ resetStyle }`);
        }
    });

    await main();
})();
