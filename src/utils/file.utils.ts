// src/utils/file.utils.ts
import { promises as fs } from 'fs';

export async function saveToFile(data: any, filename: string): Promise<void> {
    try {
        await fs.writeFile(`./data/${filename}`, JSON.stringify(data, null, 2));
        console.log(`Saved data to ${filename}`);
    } catch (error: any) {
        console.error(`Error saving to ${filename}:`, error.message);
    }
}

export async function readFromFile(filename: string): Promise<any> {
    try {
        const data = await fs.readFile(`./data/${filename}`, 'utf8');
        return JSON.parse(data);
    } catch (error: any) {
        console.error(`Error reading ${filename}:`, error.message);
        return null;
    }
}
