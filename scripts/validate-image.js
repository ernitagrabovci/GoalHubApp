#!/usr/bin/env node

// PreToolUse guard: refuse to hand Claude an image whose bytes are not a real
// image. Read classifies files by extension, so a text file named .png would
// otherwise be base64-encoded and rejected by the API as an unsupported image.

const fs = require('fs');
const path = require('path');

const IMAGE_EXTENSIONS = new Set([
  '.png', '.jpg', '.jpeg', '.webp', '.gif', '.bmp', '.heic', '.heif', '.tif', '.tiff',
]);

function isSupportedImage(buf) {
  const hex = buf.subarray(0, 16).toString('hex');
  const ascii = buf.subarray(0, 16).toString('latin1');
  return (
    hex.startsWith('89504e470d0a1a0a') ||
    hex.startsWith('ffd8ff') ||
    (ascii.startsWith('RIFF') && ascii.slice(8, 12) === 'WEBP') ||
    ascii.startsWith('GIF87a') ||
    ascii.startsWith('GIF89a')
  );
}

let stdin = '';
process.stdin.setEncoding('utf8');
process.stdin.on('data', chunk => { stdin += chunk; });
process.stdin.on('end', () => {
  let payload;
  try {
    payload = JSON.parse(stdin);
  } catch {
    process.exit(0);
  }

  const filePath = payload && payload.tool_input && payload.tool_input.file_path;
  if (!filePath || !IMAGE_EXTENSIONS.has(path.extname(filePath).toLowerCase())) {
    process.exit(0);
  }

  let head;
  try {
    const fd = fs.openSync(filePath, 'r');
    head = Buffer.alloc(16);
    fs.readSync(fd, head, 0, 16, 0);
    fs.closeSync(fd);
  } catch {
    process.exit(0);
  }

  if (isSupportedImage(head)) process.exit(0);

  console.error(
    `Blocked Read of ${filePath}: the extension implies an image, but the bytes ` +
    `(starts with ${head.subarray(0, 8).toString('hex')}) are not a valid PNG, JPEG, WebP, or GIF. ` +
    `A common cause is capturing a screenshot with PowerShell's ` +
    `'adb exec-out screencap -p > file.png' (it writes UTF-16 text). ` +
    `Recapture with 'adb shell screencap -p /sdcard/shot.png' + 'adb pull', ` +
    `or run scripts/emulator-screenshot.ps1.`
  );
  process.exit(2);
});
