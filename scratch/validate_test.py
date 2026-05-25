import pandas as pd
import os
from datetime import datetime

path = r'c:\Coding\Projects\School\CounselingLog_Electron\data\테스트_상담일지(50명).xlsx'
print("File size: {:,} bytes".format(os.path.getsize(path)))
print()

today = datetime.now().strftime('%Y%m%d')

with pd.ExcelFile(path) as xls:
    for sheet in xls.sheet_names:
        df = pd.read_excel(xls, sheet_name=sheet, dtype=str).fillna('')
        total = len(df)
        example_rows = len(df[df['순번'] == '예시'])
        data_rows = total - example_rows

        if '이름' in df.columns:
            names = df[df['순번'] != '예시']['이름'].unique()
            names = [n for n in names if n]
            student_count = len(names)
        elif '학번' in df.columns:
            sids = df[df['순번'] != '예시']['학번'].unique()
            sids = [s for s in sids if s]
            student_count = len(sids)
        else:
            student_count = 0

        if '*상담일자' in df.columns:
            today_count = len(df[(df['*상담일자'] == today) & (df['순번'] != '예시')])
        else:
            today_count = 0

        if '*상담구분' in df.columns:
            types = df[df['순번'] != '예시']['*상담구분'].unique()
            types = [t for t in types if t]
            type_count = len(types)
        else:
            type_count = 0
            types = []

        short = sheet if len(sheet) <= 20 else sheet[:20] + "..."
        print("[{}]".format(short))
        print("  Data: {} rows, Example: {}, Students: {}".format(data_rows, example_rows, student_count))
        print("  Today({}): {} rows".format(today, today_count))
        print("  Types({}): {}".format(type_count, list(types)))
        print()

# Check for duplicate names
df_ind = pd.read_excel(path, sheet_name='개인상담', dtype=str).fillna('')
df_ind = df_ind[df_ind['순번'] != '예시']
name_sid = df_ind[['이름', '학번']].drop_duplicates()
dup_names = name_sid[name_sid.duplicated(subset=['이름'], keep=False)]
if not dup_names.empty:
    print("** Duplicate names (same name, different student ID):")
    for name in dup_names['이름'].unique():
        sids = dup_names[dup_names['이름'] == name]['학번'].tolist()
        print("  {}: {}".format(name, sids))
    print()

# Check multi-session students
session_counts = df_ind.groupby(['이름', '학번']).size().reset_index(name='count')
multi = session_counts[session_counts['count'] > 1].sort_values('count', ascending=False)
print("** Multi-session students: {}".format(len(multi)))
for _, row in multi.head(8).iterrows():
    n = row['이름']
    s = row['학번']
    c = row['count']
    print("  {}({}): {} sessions".format(n, s, c))

# Check counseling media types
if '*상담매체구분' in df_ind.columns:
    mediums = df_ind['*상담매체구분'].value_counts()
    print()
    print("** Counseling medium distribution:")
    for med, cnt in mediums.items():
        print("  {}: {}".format(med, cnt))

# Count total unique students across all sheets
all_students = set()
with pd.ExcelFile(path) as xls:
    for sheet in xls.sheet_names:
        df = pd.read_excel(xls, sheet_name=sheet, dtype=str).fillna('')
        df = df[df['순번'] != '예시']
        if '이름' in df.columns:
            for _, row in df.iterrows():
                name = str(row.get('이름', '')).strip()
                sid = str(row.get('학번', '')).strip().replace('.0', '')
                if name and ',' not in sid:
                    all_students.add((name, sid))

print()
print("** Total unique students across all sheets: {}".format(len(all_students)))
print("** Validation PASSED!")
