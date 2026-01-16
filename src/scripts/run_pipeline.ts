
import { exec } from 'child_process';
import util from 'util';
import path from 'path';

const execPromise = util.promisify(exec);

async function runScript(scriptName: string) {
    console.log(`\n=== Starting ${scriptName} ===`);
    try {
        // Resolve path to compiled js in production or ts in dev
        // actually easier to just use the npm scripts if we can, or just call node directly on the files
        // In production, we are in dist/scripts/run_pipeline.js, so we want dist/scripts/sync.js
        // In dev, we are in src/scripts/run_pipeline.ts, so we want src/scripts/sync.ts

        // Let's rely on the relative path from this file
        // If we are running this file, we assume the others are siblings
        const extension = __filename.endsWith('.ts') ? '.ts' : '.js';
        const runner = __filename.endsWith('.ts') ? 'npx ts-node' : 'node';

        const scriptPath = path.join(__dirname, `${scriptName}${extension}`);
        console.log(`Executing: ${runner} ${scriptPath}`);

        const { stdout, stderr } = await execPromise(`${runner} "${scriptPath}"`);

        console.log(stdout);
        if (stderr) console.error(stderr);
        console.log(`=== Finished ${scriptName} ===`);
    } catch (error) {
        console.error(`Error running ${scriptName}:`, error);
        process.exit(1);
    }
}

async function main() {
    await runScript('sync');
    await runScript('process_resumes');
    await runScript('rate_applications');
    console.log('\nPipeline complete.');
}

main();
