import os
import time
from datetime import datetime, timedelta

UPLOAD_DIR = 'outputs'

now = time.time()
threshold = now - 100 * 24 * 60 * 60  # 1 day in seconds
def delete_old_files():
    for filename in os.listdir(UPLOAD_DIR):
        print(filename)
        file_path = os.path.join(UPLOAD_DIR, filename)
        if os.path.isfile(file_path):
            file_mtime = os.path.getmtime(file_path)
            print(file_mtime)
            if file_mtime < threshold:
                try:
                    os.remove(file_path)
                    print(f"Deleted: {file_path}")
                except Exception as e:
                    print(f"Failed to delete {file_path}: {e}")

if __name__ == "__main__":
    delete_old_files()
