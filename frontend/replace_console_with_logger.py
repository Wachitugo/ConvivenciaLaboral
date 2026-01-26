"""
Script para reemplazar automáticamente todos los console.log/error/warn
con el sistema de logging profesional en el frontend.
"""
import os
import re
from pathlib import Path

# Directorio raíz del frontend
FRONTEND_DIR = Path(r"c:\Users\nicar\Desktop\convivencia-inteligente\frontend\src")

def add_logger_import(content, filepath):
    """Agrega import del logger si no existe"""
    if 'from' in content and 'logger' in content and 'utils/logger' in content:
        return content
    
    # Calcular ruta relativa desde el archivo hasta utils/logger.js
    file_path = Path(filepath)
    src_path = FRONTEND_DIR
    
    # Calcular niveles de profundidad
    relative_parts = file_path.relative_to(src_path).parts[:-1]
    levels_up = len(relative_parts)
    
    if levels_up == 0:
        import_path = './utils/logger'
    else:
        import_path = '../' * levels_up + 'utils/logger'
    
    # Buscar la primera línea de import
    lines = content.split('\n')
    import_index = -1
    for i, line in enumerate(lines):
        if line.strip().startswith('import '):
            import_index = i
            break
    
    # Crear import statement
    import_statement = f"import {{ createLogger }} from '{import_path}';"
    logger_declaration = f"\nconst logger = createLogger('{file_path.stem}');"
    
    if import_index >= 0:
        # Insertar después del último import
        last_import = import_index
        for i in range(import_index, len(lines)):
            if lines[i].strip().startswith('import '):
                last_import = i
            elif lines[i].strip() and not lines[i].strip().startswith('import '):
                break
        
        lines.insert(last_import + 1, import_statement)
        lines.insert(last_import + 2, logger_declaration)
        return '\n'.join(lines)
    
    # Si no hay imports, agregar al inicio
    return import_statement + logger_declaration + '\n\n' + content

def replace_console_statements(content):
    """Reemplaza console.log/error/warn/info con logger equivalente"""
    
    # Patrones de reemplazo
    replacements = [
        # console.error -> logger.error
        (r'console\.error\(', r'logger.error('),
        
        # console.warn -> logger.warn
        (r'console\.warn\(', r'logger.warn('),
        
        # console.info -> logger.info
        (r'console\.info\(', r'logger.info('),
        
        # console.log con emojis de debug -> logger.debug
        (r'console\.log\((["\'])🔍', r'logger.debug(\1'),
        (r'console\.log\((["\'])📄', r'logger.debug(\1'),
        (r'console\.log\((["\'])📋', r'logger.debug(\1'),
        (r'console\.log\((["\'])🤖', r'logger.debug(\1'),
        (r'console\.log\((["\'])DEBUG:', r'logger.debug(\1'),
        
        # console.log genérico -> logger.info
        (r'console\.log\(', r'logger.info('),
        
        # console.debug -> logger.debug
        (r'console\.debug\(', r'logger.debug('),
    ]
    
    for pattern, replacement in replacements:
        content = re.sub(pattern, replacement, content)
    
    return content

def process_file(filepath):
    """Procesa un archivo JavaScript/JSX"""
    try:
        with open(filepath, 'r', encoding='utf-8') as f:
            content = f.read()
        
        # Verificar si tiene console statements
        if not re.search(r'console\.(log|error|warn|info|debug)\(', content):
            return False
        
        original_content = content
        
        # Aplicar transformaciones
        content = replace_console_statements(content)
        content = add_logger_import(content, filepath)
        
        # Solo escribir si hubo cambios
        if content != original_content:
            with open(filepath, 'w', encoding='utf-8') as f:
                f.write(content)
            return True
        
        return False
    except Exception as e:
        print(f"Error processing {filepath}: {e}")
        return False

def main():
    """Procesa todos los archivos JS/JSX/TS/TSX en el frontend"""
    modified_files = []
    
    extensions = ['*.js', '*.jsx', '*.ts', '*.tsx']
    
    for ext in extensions:
        for filepath in FRONTEND_DIR.rglob(ext):
            # Ignorar node_modules y archivos de build
            if 'node_modules' in str(filepath) or 'dist' in str(filepath):
                continue
            
            if process_file(filepath):
                modified_files.append(filepath)
                print(f"✓ Modified: {filepath.relative_to(FRONTEND_DIR)}")
    
    print(f"\n✅ Total files modified: {len(modified_files)}")
    for f in modified_files:
        print(f"  - {f.relative_to(FRONTEND_DIR)}")

if __name__ == "__main__":
    main()
