const Monitor = require("./monitor");

const testPerformance = async (runMethod, testRuns = 10) => {
    const performanceLogs = [];

    console.log("Initializing performance test.");
    const startTime  = process.hrtime();

    for (let i = 0; i < testRuns; i++) {
        const snapshotBefore = await Monitor.monitorPerformance(false);
        runMethod();
        const snapshotAfter = await Monitor.monitorPerformance(false);

        const performanceDifference = await Monitor.calculateMonitorDifference(snapshotBefore, snapshotAfter);
        performanceLogs.push(performanceDifference);
    }
    const [seconds, nanoseconds] = process.hrtime(startTime);
    console.log("Performance test finished.");
    
    Monitor.calculateAveragePerformance(performanceLogs);

    const elapsedTimeSeconds = (seconds * 1000 + nanoseconds / 1000000.0) / 1000;
    console.log(`Elapsed time ${elapsedTimeSeconds.toFixed(2)}s. Tests ran ${testRuns}.`);
}

module.exports = {
    testPerformance
}