import flask_uploads

print("Patching flask_uploads...")

with open(flask_uploads.__file__, 'r') as f:
    content = f.read()

# Заменяем проблемную строку
old_import = "from werkzeug import secure_filename, FileStorage"
new_import = "from werkzeug.utils import secure_filename; from werkzeug.datastructures import FileStorage"

if old_import in content:
    content = content.replace(old_import, new_import)
    with open(flask_uploads.__file__, 'w') as f:
        f.write(content)
    print("Flask-Uploads successfully patched!")
else:
    print("Patch not needed - import already fixed or different structure")
