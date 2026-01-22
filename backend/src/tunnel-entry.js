import { spawn } from 'child_process';
import config from './config/config.js';
import './index.js';

async function startTunnel() {
    const PORT = config.port || 3000;

    console.log('[Tunnel] Initializing SSH Tunnel (localhost.run)...');

    // ssh -R 80:localhost:3000 nopty@localhost.run
    const ssh = spawn('ssh', [
        '-R',
        `80:localhost:${PORT}`,
        '-o', 'StrictHostKeyChecking=no', // Avoid host key prompt hanging
        'nopty@localhost.run'
    ]);

    ssh.stdout.on('data', (data) => {
        const output = data.toString();
        console.log(`[SSH] ${output.trim()}`);

        // Check for URL
        // localhost.run output: "Connect to http://random-name.localhost.run or https://random-name.localhost.run"
        if (output.includes('localhost.run')) {
            console.log('\n================================================================');
            console.log(`[Tunnel] Tunnel Established! 🚀`);

            // Extract URL
            const matches = output.match(/(https?:\/\/[^\s]+)/);
            if (matches) {
                console.log(`[Tunnel] Public URL: ${matches[1]}`);
                console.log('================================================================\n');
                console.log(`SHARE THIS URL with your participants: ${matches[1]}\n`);
            }
        }
    });

    ssh.stderr.on('data', (data) => {
        // localhost.run often outputs info to stderr too
        console.log(`[SSH Info] ${data.toString().trim()}`);
    });

    ssh.on('close', (code) => {
        console.log(`[Tunnel] SSH process exited with code ${code}. Restarting in 3s...`);
        setTimeout(startTunnel, 3000);
    });
}

// Wait a bit for server to spin up
setTimeout(startTunnel, 1500);
