const DataStandardizer = require('./DataStandardizer');

async function testFlow() {
    const ds = new DataStandardizer();
    try {
        console.log('Testing Search Flow for Server 1 (RA):');
        const res1 = await ds.getSearch('hunter', '1');
        console.log('  Number of items returned:', res1.data.length);
        if (res1.data.length > 0) {
            console.log('  First item title:', res1.data[0].title);
        }

        console.log('Testing Latest Data for Server 2 (AS) - SHOULD NOT CRASH:');
        const res2 = await ds.getLatestData('2');
        console.log('  Number of rows returned:', res2.rowData.length);
        if (res2.rowData.length > 0) {
            console.log('  First row title:', res2.rowData[0].title);
            console.log('  First row item count:', res2.rowData[0].data.length);
        }

    } catch (e) {
        console.error('FLOW ERROR:', e);
    }
}

testFlow();
