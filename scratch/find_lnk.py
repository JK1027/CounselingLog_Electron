import os
import subprocess

def main():
    user_profile = os.environ['USERPROFILE']
    paths_to_check = [
        os.path.join(user_profile, 'Desktop'),
        os.path.join(user_profile, 'OneDrive', 'Desktop'),
        os.path.join(user_profile, 'OneDrive', '바탕 화면'),
        os.path.join(user_profile, 'OneDrive - Personal', 'Desktop'),
        os.path.join(user_profile, 'OneDrive - Personal', '바탕 화면'),
        r"C:\Users\Public\Desktop"
    ]
    
    # Filter only existing paths
    existing_paths = [p for p in paths_to_check if os.path.exists(p)]
    print(f"Checking folders: {existing_paths}")
    
    paths_str = ", ".join(f"'{p}'" for p in existing_paths)
    
    ps_code = f"""
    $sh = New-Object -ComObject WScript.Shell
    Get-ChildItem -Path {paths_str} -Filter *.lnk -ErrorAction SilentlyContinue | ForEach-Object {{
        try {{
            $target = $sh.CreateShortcut($_.FullName).TargetPath
            [PSCustomObject]@{{
                Name = $_.Name
                Path = $_.FullName
                Target = $target
            }}
        }} catch {{}}
    }} | ConvertTo-Json
    """
    
    res = subprocess.run(["powershell", "-Command", ps_code], capture_output=True, text=True)
    print("STDOUT:")
    print(res.stdout)
    print("STDERR:")
    print(res.stderr)

if __name__ == "__main__":
    main()
