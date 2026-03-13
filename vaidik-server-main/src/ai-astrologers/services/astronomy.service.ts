import { Injectable, Logger } from '@nestjs/common';
import { exec, execFile } from 'child_process';
import * as path from 'path';
import { promisify } from 'util';

const execAsync = promisify(exec);

@Injectable()
export class AstronomyService {
    private readonly logger = new Logger(AstronomyService.name);
    private readonly scriptPath = path.join(process.cwd(), 'src/ai-astrologers/scripts/astronomy_bridge.py');

    /**
     * Calculate Astrology Data using Python Bridge (Vedic Astronomy)
     * Supports actions: kundli, match, panchang, dasha, all
     */
    async calculateAstrology(action: string, details: any): Promise<any> {
        return new Promise((resolve, reject) => {
            const payload = { action, ...details };
            const inputJson = JSON.stringify(payload);

            const pythonPath = process.platform === 'win32' ? 'python' : 'python3';

            this.logger.debug(`Executing Python Bridge: ${pythonPath} ${this.scriptPath}`);

            const child = execFile(pythonPath, [this.scriptPath, inputJson], (error, stdout, stderr) => {
                if (error) {
                    this.logger.error('Bridge Execution Error:', error);
                    this.logger.error('Stderr:', stderr);
                    return reject(new Error('Failed to execute astronomy bridge'));
                }

                try {
                    const result = JSON.parse(stdout.trim());
                    if (result.status === 'error') {
                        this.logger.error(`Astrology Bridge Data Error: ${result.message}`);
                        return reject(new Error(`Astrology Calculation Error: ${result.message}`));
                    }
                    resolve(result.data);
                } catch (parseError) {
                    this.logger.error('JSON Parse Error:', parseError);
                    this.logger.error('Raw Output:', stdout);
                    reject(new Error('Failed to parse astronomy data'));
                }
            });
        });
    }

    // Helper methods
    async calculatePlanets(date: string, time: string, lat: string, lon: string, tzone: number = 5.5): Promise<any> {
        const data = await this.calculateAstrology('kundli', { date, time, lat, lon, tzone });
        return data.planets;
    }

    async calculateHouses(date: string, time: string, lat: string, lon: string, tzone: number = 5.5): Promise<any> {
        const data = await this.calculateAstrology('kundli', { date, time, lat, lon, tzone });
        return data.houses;
    }

    async matchHoroscope(boy: any, girl: any): Promise<any> {
        return await this.calculateAstrology('match', { boy, girl });
    }

    async getPanchang(date: string, time: string, lat: string, lon: string, tzone: number = 5.5): Promise<any> {
        return await this.calculateAstrology('panchang', { date, time, lat, lon, tzone });
    }

    async getDasha(date: string, time: string, lat: string, lon: string, tzone: number = 5.5): Promise<any> {
        return await this.calculateAstrology('dasha', { date, time, lat, lon, tzone });
    }

    async getTransits(lat: string, lon: string, tzone: number = 5.5): Promise<any> {
        // Get current planetary positions for Gochar (transits)
        const now = new Date();
        const date = now.toISOString().split('T')[0]; // YYYY-MM-DD
        const time = `${now.getHours().toString().padStart(2, '0')}:${now.getMinutes().toString().padStart(2, '0')}`;

        const data = await this.calculateAstrology('kundli', { date, time, lat, lon, tzone });
        return data.planets; // Return current planetary positions
    }

    async calculateAllData(date: string, time: string, lat: string, lon: string, tzone: number = 5.5): Promise<any> {
        return this.calculateAstrology('all', { date, time, lat, lon, tzone });
    }
}
