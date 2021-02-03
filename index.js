const Monitor = require("./monitor");
const PerformanceTestRunner = require("./performanceTestRunner");

Monitor.initializeGcStats();

const main = async () => {
    const testObject = prepareTestData();

    const scriptArgs = process.argv.slice(1);
    const testRuns = scriptArgs[2];

    const targetCase = scriptArgs[1] === "caseA" ? caseA : caseB;
    const caseRunner = () => targetCase(testObject);

    PerformanceTestRunner.testPerformance(caseRunner, testRuns);
}

function prepareTestData() {
    const testObject = {};

    for (let i = 0; i < 100; i++) {
        testObject[i] = i;
        
        for (let j = 97; j < 123; j++) {
            const char = String.fromCharCode(i);
            const key = char + i;
            testObject[key] = key;
        }
    }

    console.log("Test data generated.");
    return testObject;
}

function caseA(testObject) {
    const _ = Object.keys(testObject);
}

function caseB(testObject) {
    let manualKeys = 0;

    for (const _ in testObject)
        ++manualKeys;
}

main();