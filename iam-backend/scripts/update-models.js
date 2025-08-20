const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

const updateFiles = () => {
  // Replace alert model names
  execSync('find src -type f -name "*.ts" -exec sed -i "" "s/alertConfiguration/configuracionAlerta/g" {} \\;');
  execSync('find src -type f -name "*.ts" -exec sed -i "" "s/alertHistory/alertaHistorial/g" {} \\;');
  execSync('find src -type f -name "*.ts" -exec sed -i "" "s/AlertHistory/AlertaHistorial/g" {} \\;');
  
  // Update the severidad fields to use enum
  execSync('find src -type f -name "*.ts" -exec sed -i "" "s/severidad: string/severidad: SeveridadAlerta/g" {} \\;');
  execSync('find src -type f -name "*.ts" -exec sed -i "" "s/severidad?: string/severidad?: SeveridadAlerta/g" {} \\;');
  
  console.log('Files updated successfully');
};

updateFiles();
