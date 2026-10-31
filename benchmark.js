const fs = require('fs');
const path = require('path');

function stringConcatenationBenchmark() {
    const startTime = process.hrtime.bigint();
    let str = '';
    for (let i = 0; i < 100; i++) {
        str += 'a';
    }
    const endTime = process.hrtime.bigint();
    return endTime - startTime;
}

function arrayPushBenchmark() {
    const startTime = process.hrtime.bigint();
    const arr = [];
    for (let i = 0; i < 100; i++) {
        arr.push(i);
    }
    const endTime = process.hrtime.bigint();
    return endTime - startTime;
}

function objectCreationBenchmark() {
    const startTime = process.hrtime.bigint();
    const obj = {};
    for (let i = 0; i < 50; i++) {
        obj[`key${i}`] = `value${i}`;
    }
    const endTime = process.hrtime.bigint();
    return endTime - startTime;
}

function mathOperationsBenchmark() {
    const startTime = process.hrtime.bigint();
    let sum = 0;
    for (let i = 0; i < 1000; i++) {
        sum += i * i;
    }
    const endTime = process.hrtime.bigint();
    return endTime - startTime;
}

function runBenchmark(testFunction, testName) {
    const times = [];
    for (let i = 0; i < 10; i++) {
        const timeTaken = testFunction();
        times.push(Number(timeTaken) / 1000000); // Convert nanoseconds to milliseconds
    }
    const total = times.reduce((acc, curr) => acc + curr, 0);
    const average = total / times.length;
    const opsPerSec = 1000 / average;

    console.log(`Test: ${testName}`);
    console.log(`  Total: ${total.toFixed(3)}ms`);
    console.log(`  Average: ${average.toFixed(4)}ms per iteration`);
    console.log(`  Operations/sec: ${opsPerSec.toFixed(2)}`);
    console.log('');

    return { testName, total, average, opsPerSec };
}

const results = [
    runBenchmark(stringConcatenationBenchmark, 'String Concatenation (100 chars)'),
    runBenchmark(arrayPushBenchmark, 'Array Push (100 elements)'),
    runBenchmark(objectCreationBenchmark, 'Object Creation (50 keys)'),
    runBenchmark(mathOperationsBenchmark, 'Math Operations (1000 iterations)')
];

const summary = {
    totalTests: results.length,
    status: 'Completed successfully',
    timestamp: new Date().toISOString()
};

fs.writeFileSync(path.join(__dirname, 'benchmark_results.txt'), JSON.stringify({ results, summary }, null, 2));

console.log('Benchmark completed. Results written to benchmark_results.txt');
