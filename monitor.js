const GarbageCollectionLib = require("gc-stats");
const gc = GarbageCollectionLib();

const gcTracker = {
    min: 0,
    max: 0,
    typeCounter: {}
};

function initializeGcStats() {
    gc.on('stats', (stats) => {
        const gcPause = stats.pause;
        const gcType = stats.gctype;
    
        if (gcTracker.min < gcPause) gcTracker.min = gcPause;
        if (gcTracker.max > gcPause) gcTracker.max = gcPause;
    
        if (!gcTracker.typeCounter[gcType]) gcTracker.typeCounter[gcType] = 0;
        gcTracker.typeCounter[gcType] += 1;
    });
}

async function monitorPerformance(shouldLog = true, message = '') {
    if(message)
        console.log(message);
    
    const timestamp = new Date();
    const cpuUsage = await getCpuPercentage();
    const eventLoopDelay = await measureEventLoopDelay();
    const { rss, totalHeap, usedHeap, external } = trackMemoryUsage();

    const snapshot = {
        rss,
        usedHeap,
        external,
        cpuUsage,
        totalHeap,
        eventLoopDelay
    }

    if(shouldLog)
        logPerformanceSnapshot({ ...snapshot, timestamp });

    return snapshot;
}

function logPerformanceSnapshot(snapshot) {

    let monitorLog = "";

    if(snapshot.timestamp)
        monitorLog += `${snapshot.timestamp}\n`;
    
    monitorLog += `RSS: ${snapshot.rss} MB.\n`;
    monitorLog += `CPU usage: ${snapshot.cpuUsage}%.\n`;
    monitorLog += `External: ${snapshot.external} MB.\n`;
    monitorLog += `Used Heap: ${snapshot.usedHeap} MB.\n`;
    monitorLog += `Total Heap: ${snapshot.totalHeap} MB.\n`;
    monitorLog += `Current event loop delay: ${snapshot.eventLoopDelay} ms.\n`;

    console.log(monitorLog);
}

async function measureEventLoopDelay() {
    return new Promise((resolve) => {
        const start = Date.now();
        setTimeout(() => {
            const end = Date.now();
            const delay = end - start;
            resolve(delay);
        });
    });
}

async function getCpuPercentage() {
    const startTime  = process.hrtime();
    const startUsage = process.cpuUsage();

    await new Promise((resolve) => setTimeout(resolve, 100));

    const elapTime = process.hrtime(startTime);
    const elapUsage = process.cpuUsage(startUsage);

    const [seconds, nanoseconds] = elapTime;
    const elapTimeMS = seconds * 1000 + nanoseconds / 1000000.0;
    const elapUserMS = elapUsage.user / 1000.0;
    const elapSystMS = elapUsage.system / 1000.0;
    const cpuPercent = (100 * (elapUserMS + elapSystMS) / elapTimeMS).toFixed(1);
    return cpuPercent;
}

function trackMemoryUsage() {
    const memoryUsage = process.memoryUsage();

    const rssMb = getUsageInMegabytes(memoryUsage.rss);
    const totalHeapMb = getUsageInMegabytes(memoryUsage.heapTotal);
    const usedHeapMb = getUsageInMegabytes(memoryUsage.heapUsed);
    const externalMb = getUsageInMegabytes(memoryUsage.external);

    return {
        rss: rssMb,
        usedHeap: usedHeapMb,
        external: externalMb,
        totalHeap: totalHeapMb,
    }
}

function getUsageInMegabytes(bytes) {
    return Math.round(bytes / 1024 / 1024 * 100) / 100;
}

function calculateMonitorDifference(monitorStatsBefore, monitorStatsAfter) {
    const monitorDifference = {};
    const statsFields = Object.keys(monitorStatsBefore);

    for (let i = 0; i < statsFields.length; i++) {
        const currStatsField = statsFields[i];
        
        const difference = monitorStatsAfter[currStatsField] - monitorStatsBefore[currStatsField];
        const fixedNumber = Number(difference.toFixed(2));

        monitorDifference[currStatsField] = fixedNumber;
    }

    return monitorDifference;
}

function calculateAveragePerformance(monitorStats) {
    let averageSnapshot = {};
    const providedStatsLength = monitorStats.length;

    for (let i = 0; i < providedStatsLength; i++) {
        const currStats = monitorStats[i];
        const currStatsFields = Object.keys(currStats);

        for (let j = 0; j < currStatsFields.length; j++) {
            const currStatField = currStatsFields[j];

            if(!averageSnapshot[currStatField]) {
                averageSnapshot[currStatField] = currStats[currStatField];
                continue;
            }

            averageSnapshot[currStatField] += currStats[currStatField];
        }
    }

    const statsFields = Object.keys(averageSnapshot);

    for (let i = 0; i < statsFields.length; i++) {
        const currStatField = statsFields[i];
        averageSnapshot[currStatField] = (averageSnapshot[currStatField] / providedStatsLength).toFixed(2);
    }

    logPerformanceSnapshot(averageSnapshot)

    return averageSnapshot;
}

module.exports = {
    initializeGcStats,
    monitorPerformance,
    calculateMonitorDifference,
    calculateAveragePerformance
}