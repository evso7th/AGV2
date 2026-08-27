
import json
import os

manifest_path = 'public/audio-manifest.json'
output_path = 'lost_assets.txt'
public_dir = 'public'

lost_files = []

try:
    # Open and read the manifest file
    with open(manifest_path, 'r') as f:
        urls = json.load(f)

    # Loop through each URL in the manifest
    for url in urls:
        # The URLs in the manifest start with '/', e.g., /assets/drums/kick.ogg
        # We need to create a file system path like 'public/assets/drums/kick.ogg'
        # os.path.join handles this correctly, but we must strip the leading '/'
        # from the url to prevent it from being treated as an absolute path.
        file_path = os.path.join(public_dir, url.lstrip('/'))
        
        # Check if the file does not exist at the constructed path
        if not os.path.exists(file_path):
            lost_files.append(url)

    # Write the results to the output file
    with open(output_path, 'w') as f:
        if lost_files:
            print(f"Found {len(lost_files)} missing assets. List saved to {output_path}")
            # Write each missing file path to a new line
            for file_path in lost_files:
                f.write(f"{file_path}\n")
        else:
            # If no files were missing, write a confirmation message
            message = "No missing assets found."
            print(message)
            f.write(f"{message}\n")

except FileNotFoundError:
    error_message = f"Error: The manifest file was not found at {manifest_path}"
    print(error_message)
    with open(output_path, 'w') as f:
        f.write(f"{error_message}\n")
except json.JSONDecodeError:
    error_message = f"Error: Could not decode JSON from {manifest_path}. The file might be corrupt."
    print(error_message)
    with open(output_path, 'w') as f:
        f.write(f"{error_message}\n")
except Exception as e:
    error_message = f"An unexpected error occurred: {e}"
    print(error_message)
    with open(output_path, 'w') as f:
        f.write(f"{error_message}\n")
