const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

const addPrismaImports = () => {
  const files = execSync('find src -type f -name "*.ts" -exec grep -l "SeveridadAlerta" {} \\;')
    .toString()
    .split('\n')
    .filter(Boolean);

  files.forEach(file => {
    const content = fs.readFileSync(file, 'utf8');
    if (!content.includes("import { SeveridadAlerta }")) {
      const newContent = `import { SeveridadAlerta } from '@prisma/client';\n${content}`;
      fs.writeFileSync(file, newContent);
    }
  });
  
  console.log('Imports added successfully');
};

addPrismaImports();
