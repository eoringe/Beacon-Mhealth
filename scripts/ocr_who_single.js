const { createWorker } = require('tesseract.js');
const fs = require('fs');

// Test OCR extraction on one WHO screenshot.
// If the output is noisy, we can tune the OCR params / preprocessing.
async function main() {
  // WHO table screenshot (length-for-age BOYS; birth to 2 years)
  const inputPath =
    'C:\\Users\\Admin\\.cursor\\projects\\c-Users-Admin-Desktop-Beacon-Mhealth\\assets\\' +
    'c__Users_Admin_AppData_Roaming_Cursor_User_workspaceStorage_5bd3a5f40b98b6fc768612b55ceba059_images_image-e588704f-d613-4f92-be92-4cbf8d8c90be.png';

  const outPath =
    'C:\\Users\\Admin\\Desktop\\Beacon-Mhealth\\scripts\\ocr_output_e588.txt';

  const worker = await createWorker('eng');

  try {
    // Page segmentation mode 6 works well for dense text blocks/tables.
    await worker.setParameters({
      tessedit_pageseg_mode: '6',
      // Keep it conservative: don't aggressively merge digits.
      preserve_interword_spaces: '1',
    });

    const {
      data: { text },
    } = await worker.recognize(inputPath);

    const cleaned = String(text || '')
      .replace(/\r/g, '')
      // WHO screenshots often contain the "World Health Organization" header and "Z-scores ..." line.
      // Keep it; we'll parse later. Just trim huge whitespace runs:
      .replace(/[ \t]+/g, ' ')
      .trim();

    fs.writeFileSync(outPath, cleaned, 'utf8');
    console.log('\nOCR complete. Output written to:', outPath);
    console.log('\n--- OCR preview (first 1200 chars) ---\n');
    console.log(cleaned.slice(0, 1200));
    console.log('\n--- OCR preview (last 800 chars) ---\n');
    console.log(cleaned.slice(Math.max(0, cleaned.length - 800)));
  } finally {
    await worker.terminate();
  }
}

main().catch((e) => {
  console.error('OCR failed:', e);
  process.exit(1);
});

