const { execSync } = require('child_process');
const fs = require('fs');

const envFile = fs.readFileSync('.env', 'utf8');
const lines = envFile.split('\n').filter(line => line.trim() !== '' && !line.startsWith('#'));

for (const line of lines) {
  const separatorIdx = line.indexOf('=');
  if (separatorIdx === -1) continue;
  
  const key = line.substring(0, separatorIdx).trim();
  let value = line.substring(separatorIdx + 1).trim();
  
  // Remove wrapping quotes if they exist
  if (value.startsWith('"') && value.endsWith('"')) {
    value = value.slice(1, -1);
  }
  
  if (key === 'PORT') continue; // Vercel ignores PORT anyway

  console.log(`Adding ${key}...`);
  try {
    // We can use vercel env rm to remove it if it already exists, ignoring errors
    try {
      execSync(`npx vercel env rm ${key} production -y`, { stdio: 'ignore' });
    } catch (e) { }

    // On Windows, piping echo can add newlines, so we use a temp file
    fs.writeFileSync('temp_env_val.txt', value);
    execSync(`npx vercel env add ${key} production < temp_env_val.txt`);
    console.log(`Success: ${key}`);
  } catch (err) {
    console.error(`Failed to add ${key}: ${err.message}`);
  }
}

if (fs.existsSync('temp_env_val.txt')) {
  fs.unlinkSync('temp_env_val.txt');
}

console.log('All environment variables uploaded. Please redeploy to apply them!');
