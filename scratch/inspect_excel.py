import os
import openpyxl

data_dir = r"c:\Coding\Projects\School\CounselingLog_Electron\data"
files = [f for f in os.listdir(data_dir) if f.endswith(".xlsx")]

out_lines = []
for file in files:
    file_path = os.path.join(data_dir, file)
    out_lines.append(f"=== File: {file} ===")
    try:
        wb = openpyxl.load_workbook(file_path)
        for name in wb.sheetnames:
            ws = wb[name]
            out_lines.append(f"  Sheet: {name}")
            out_lines.append(f"    AutoFilter: {ws.auto_filter.ref}")
            out_lines.append(f"    Data Validations: {len(ws.data_validations.dataValidation)}")
            for i, dv in enumerate(ws.data_validations.dataValidation):
                out_lines.append(f"      Validation {i+1}: formula1={dv.formula1}, type={dv.type}, sqref={dv.sqref}")
        wb.close()
    except Exception as e:
        out_lines.append(f"    Error: {e}")
    out_lines.append("")

with open(r"c:\Coding\Projects\School\CounselingLog_Electron\scratch\inspect_results.txt", "w", encoding="utf-8") as f:
    f.write("\n".join(out_lines))
print("Done inspecting")
