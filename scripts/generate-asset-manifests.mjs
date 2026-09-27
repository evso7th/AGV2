
import fs from 'fs/promises';
import path from 'path';

const PUBLIC_DIR = path.resolve(process.cwd(), 'public');
const ASSETS_DIR = path.join(PUBLIC_DIR, 'assets', 'music');

const AUDIO_EXTENSIONS = ['.ogg', '.mp3', '.wav', '.flac', '.m4a'];

async function findAudioFiles(dir) {
    let entries = await fs.readdir(dir, { withFileTypes: true });
    let files = await Promise.all(entries.map(async (entry) => {
        const res = path.resolve(dir, entry.name);
        if (entry.isDirectory()) {
            return await findAudioFiles(res);
        } else if (AUDIO_EXTENSIONS.includes(path.extname(entry.name).toLowerCase())) {
            // Return the web-accessible path, relative to the public directory
            return path.join('/', path.relative(PUBLIC_DIR, res)).replace(/\\/g, '/');
        }
        return null;
    }));
    return files.filter(file => file).flat();
}

async function generateSparklesManifest() {
    console.log('Generating sparkles manifest...');
    const sparklesDir = path.join(ASSETS_DIR, 'sparkles');
    
    // We need to maintain the categories 'MELODIC' and 'ORGANIC'
    // Let's assume subdirectories in 'sparkles' define these categories
    
    const melodicDir = path.join(sparklesDir, 'ambient'); // Assuming 'ambient' maps to 'MELODIC'
    const organicDir = path.join(sparklesDir); // Other files in the root can be 'ORGANIC'

    const melodicFiles = await findAudioFiles(melodicDir);
    const allFiles = await findAudioFiles(sparklesDir);
    
    // Naive assumption: organic files are those not in the melodic directory
    const organicFiles = allFiles.filter(f => !melodicFiles.includes(f));

    const manifest = {
        MELODIC: melodicFiles,
        ORGANIC: organicFiles,
    };

    const manifestPath = path.join(PUBLIC_DIR, 'sparkles-manifest.json');
    await fs.writeFile(manifestPath, JSON.stringify(manifest, null, 2));
    console.log(`✨ Sparkles manifest written to ${manifestPath}`);
    console.log(`   Found ${melodicFiles.length} melodic and ${organicFiles.length} organic sparkles.`);
}


async function generateSfxManifest() {
    console.log('\nGenerating SFX manifest...');
    
    const sfxBaseDir = ASSETS_DIR;
    const categories = ['perc', 'SFX', 'tube', 'voices'];
    
    const manifest = {};

    for (const category of categories) {
        const categoryDir = path.join(sfxBaseDir, category);
        try {
            await fs.access(categoryDir);
            const files = await findAudioFiles(categoryDir);
            
            // The old manifest had more granular categories like 'sfx_glitch', 'voices_oga'
            // For now, we'll use the directory names as keys. This is a simplification.
            const manifestKey = category === 'SFX' ? 'sfx_other' : category;
            manifest[manifestKey] = files;
            console.log(`   Found ${files.length} files in ${category}`);
        } catch (e) {
            console.warn(`   - Warning: Directory not found, skipping: ${categoryDir}`);
        }
    }

    // Add vinyl, which is a special case
    manifest['vinyl'] = ['/assets/music/vinyl_disk.ogg'];

    const manifestPath = path.join(PUBLIC_DIR, 'sfx-manifest.json');
    await fs.writeFile(manifestPath, JSON.stringify(manifest, null, 2));
    console.log(`🔊 SFX manifest written to ${manifestPath}`);
}


async function main() {
    try {
        await generateSparklesManifest();
        await generateSfxManifest();
        console.log('\n✅ All asset manifests generated successfully!');
    } catch (error) {
        console.error('❌ Error generating asset manifests:', error);
        process.exit(1);
    }
}

main();
