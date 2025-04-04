import fs from 'fs';

// Read the file
const data = fs.readFileSync('./server/file-processor.ts', 'utf8');

// Replace school creation
const schoolReplace = data.replace(
  /name: name,\s+code: name\.substring\(0, 5\)\.toUpperCase\(\)\.replace\(\/\[\^A-Z0-9\]\/g, ''\) \|\| "SCH",\s+address: "",\s+contactEmail: "",\s+contactPhone: ""/g, 
  'name: name,\n            location: "",\n            type: "Public"'
);

// Replace subject creation
const bothReplace = schoolReplace.replace(
  /name: name,\s+code: code \|\| "SUBJ"/g,
  'name: name,\n            code: code || "SUBJ"'
);

// Write back to the file
fs.writeFileSync('./server/file-processor.ts', bothReplace, 'utf8');

console.log('File updated successfully');