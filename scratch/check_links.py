import os
import re

def check_link_imports(root_dir):
    missing_files = []
    for root, dirs, files in os.walk(root_dir):
        for file in files:
            if file.endswith('.tsx'):
                path = os.path.join(root, file)
                with open(path, 'r', encoding='utf-8', errors='ignore') as f:
                    content = f.read()
                    if '<Link' in content and 'Link' not in re.search(r"import \{.*\} from 'react-router-dom'", content) and 'import Link' not in content:
                        # Re-check more carefully
                        import_match = re.search(r"import \{([^}]*)\} from 'react-router-dom'", content)
                        if import_match:
                            imports = [i.strip() for i in import_match.group(1).split(',')]
                            if 'Link' not in imports:
                                missing_files.append(path)
                        else:
                            # No react-router-dom import at all but has <Link
                            if 'react-router-dom' not in content:
                                missing_files.append(path)
    return missing_files

root = r'c:\Users\Stafford\Desktop\Diplome\Hristo\src'
missing = check_link_imports(root)
for m in missing:
    print(m)
