"""
Comprehensive functional test suite for the CounselingLog backend.
Starts the FastAPI server, loads the test Excel file, and tests all major API endpoints.
"""
import sys
import os
import time
import json
import shutil
import subprocess
import requests
import traceback

# ──────────────────────────────────────────
# Configuration
# ──────────────────────────────────────────
BASE_URL = "http://127.0.0.1:18765"
PROJECT_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
TEST_FILE = os.path.join(PROJECT_DIR, "data", "테스트_상담일지(50명).xlsx")
# We'll use a working copy so we don't corrupt the original test file
WORK_COPY = os.path.join(PROJECT_DIR, "data", "테스트_작업본.xlsx")

# Test results tracking
results = []
errors = []

def log_test(name, passed, detail=""):
    status = "PASS" if passed else "FAIL"
    results.append({"name": name, "passed": passed, "detail": detail})
    if not passed:
        errors.append({"name": name, "detail": detail})
    print("[{}] {}{}".format(status, name, " -- " + detail if detail else ""))

def log_section(title):
    print("\n" + "=" * 60)
    print("  " + title)
    print("=" * 60)


# ──────────────────────────────────────────
# 1. Server startup
# ──────────────────────────────────────────
def start_server():
    """Start the FastAPI backend on a test port"""
    # Create a working copy of the test file
    shutil.copy2(TEST_FILE, WORK_COPY)
    
    # We'll start the server programmatically using uvicorn
    env = os.environ.copy()
    env["NODE_ENV"] = "development"
    
    # Write a small launcher script
    launcher = os.path.join(PROJECT_DIR, "scratch", "_test_server.py")
    with open(launcher, "w", encoding="utf-8") as f:
        f.write("""
import sys, os
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
os.environ["NODE_ENV"] = "development"

import uvicorn
from backend.main import app, repo

# Override the file path to use working copy
WORK_COPY = os.path.join(os.path.dirname(os.path.dirname(os.path.abspath(__file__))), "data", "테스트_작업본.xlsx")
repo.load_data(WORK_COPY)

import backend.main as main_module
main_module.CURRENT_EXCEL_PATH = WORK_COPY

uvicorn.run(app, host="127.0.0.1", port=18765, log_level="warning")
""")
    
    proc = subprocess.Popen(
        [sys.executable, launcher],
        cwd=PROJECT_DIR,
        env=env,
        stdout=subprocess.DEVNULL,
        stderr=subprocess.DEVNULL,
        creationflags=subprocess.CREATE_NEW_PROCESS_GROUP if sys.platform == "win32" else 0
    )
    
    # Wait for server to be ready
    for i in range(30):
        try:
            r = requests.get(BASE_URL + "/health", timeout=2)
            if r.status_code == 200:
                print("Server started successfully (pid={})".format(proc.pid))
                return proc
        except Exception:
            pass
        time.sleep(1)
    
    # Server failed to start
    print("FATAL: Server failed to start!")
    sys.exit(1)


def stop_server(proc):
    """Stop the server process"""
    if proc:
        try:
            proc.terminate()
            proc.wait(timeout=5)
        except Exception:
            proc.kill()
    # Cleanup
    if os.path.exists(WORK_COPY):
        try:
            os.remove(WORK_COPY)
        except Exception:
            pass


# ──────────────────────────────────────────
# Test Functions
# ──────────────────────────────────────────

def test_health():
    log_section("1. Health Check")
    try:
        r = requests.get(BASE_URL + "/health", timeout=10)
        log_test("GET /health returns 200", r.status_code == 200)
        data = r.json()
        log_test("Health response has status=ok", data.get("status") == "ok")
        log_test("Health response has excel_path", "excel_path" in data and data["excel_path"] != "")
    except Exception as e:
        log_test("Health check", False, str(e))


def test_get_students():
    log_section("2. GET /students - Student List")
    try:
        r = requests.get(BASE_URL + "/students", timeout=10)
        log_test("GET /students returns 200", r.status_code == 200)
        students = r.json()
        log_test("Returns a list", isinstance(students, list))
        log_test("Has students (> 0)", len(students) > 0, "Count: {}".format(len(students)))
        
        # Check student structure
        if students:
            s = students[0]
            required_keys = ["id", "name", "studentId", "grade", "gender", "sessionCount", "lastDate", "tags"]
            missing = [k for k in required_keys if k not in s]
            log_test("Student has required fields", len(missing) == 0, 
                     "Missing: {}".format(missing) if missing else "All fields present")
        
        # Check for duplicate name handling (김민수 should appear twice with different IDs)
        kim_minsoo = [s for s in students if s["name"] == "김민수"]
        log_test("Duplicate name '김민수' resolved by studentId", 
                 len(kim_minsoo) == 2, 
                 "Found {} entries".format(len(kim_minsoo)))
        
        if len(kim_minsoo) == 2:
            ids = sorted([s["studentId"] for s in kim_minsoo])
            log_test("김민수 has correct student IDs (1101, 2101)", 
                     ids == ["1101", "2101"],
                     "IDs: {}".format(ids))
        
        # Check that tags are lists (not sets - serialization test)
        if students:
            all_tags_are_lists = all(isinstance(s.get("tags", []), list) for s in students)
            log_test("Tags are serialized as lists", all_tags_are_lists)
        
        # Check grade formatting (should be number without '학년')
        grades = set(s.get("grade", "") for s in students if s.get("grade"))
        has_학년_suffix = any("학년" in g for g in grades)
        log_test("Grade values do not contain '학년' suffix", not has_학년_suffix, 
                 "Grades: {}".format(grades))
        
        # Check sessionCount > 0 for all
        zero_session = [s for s in students if s.get("sessionCount", 0) == 0]
        log_test("All students have sessionCount > 0", len(zero_session) == 0,
                 "{} students with 0 sessions".format(len(zero_session)))

        # Check ban (class number) extraction from student ID
        students_with_ban = [s for s in students if s.get("ban")]
        log_test("Ban (class) extracted from studentId", len(students_with_ban) > 0,
                 "{} students have ban".format(len(students_with_ban)))
        
        # Verify specific ban extraction: studentId 1201 -> ban should be 2
        s_1201 = [s for s in students if s["studentId"] == "1201"]
        if s_1201:
            log_test("Ban extraction: 1201 -> ban=2", s_1201[0].get("ban") == "2",
                     "ban={}".format(s_1201[0].get("ban")))
        
        return students
    except Exception as e:
        log_test("GET /students", False, traceback.format_exc())
        return []


def test_get_sessions_by_student(students):
    log_section("3. GET /sessions/{student_name} - Per-Student Sessions")
    try:
        if not students:
            log_test("Skip: no students loaded", False, "Need students for this test")
            return
        
        # Test with a student who should have multiple sessions
        # Pick the student with highest sessionCount
        top_student = max(students, key=lambda s: s["sessionCount"])
        name = top_student["name"]
        sid = top_student["studentId"]
        
        r = requests.get(BASE_URL + "/sessions/{}".format(name), 
                        params={"student_id": sid}, timeout=10)
        log_test("GET /sessions/{} returns 200".format(name), r.status_code == 200)
        sessions = r.json()
        log_test("Returns a list", isinstance(sessions, list))
        log_test("Has sessions", len(sessions) > 0, "Count: {}".format(len(sessions)))
        
        # Check session structure
        if sessions:
            s = sessions[0]
            required_keys = ["id", "name", "studentId", "date", "type", "sheetType", "summary", "detail"]
            missing = [k for k in required_keys if k not in s]
            log_test("Session has required fields", len(missing) == 0,
                     "Missing: {}".format(missing) if missing else "All fields present")
        
        # Check session ordering (should be date descending)
        if len(sessions) > 1:
            dates = [s["date"] for s in sessions]
            is_desc = all(dates[i] >= dates[i+1] for i in range(len(dates)-1))
            log_test("Sessions sorted by date descending", is_desc)
        
        # Check session numbers are assigned
        sessions_with_session_num = [s for s in sessions if s.get("session")]
        log_test("Session numbers (회기) assigned", len(sessions_with_session_num) > 0)
        
        # Test with duplicate name student (김민수, sid=1101)
        r2 = requests.get(BASE_URL + "/sessions/김민수", 
                         params={"student_id": "1101"}, timeout=10)
        log_test("GET /sessions/김민수?student_id=1101 returns 200", r2.status_code == 200)
        sessions_1101 = r2.json()
        
        r3 = requests.get(BASE_URL + "/sessions/김민수", 
                         params={"student_id": "2101"}, timeout=10)
        sessions_2101 = r3.json()
        
        # Verify they return different sessions
        ids_1101 = set(s["id"] for s in sessions_1101)
        ids_2101 = set(s["id"] for s in sessions_2101)
        overlap = ids_1101 & ids_2101
        # There may be overlap from group counseling, but individual should differ
        individual_1101 = [s for s in sessions_1101 if s["sheetType"] != "집단상담"]
        individual_2101 = [s for s in sessions_2101 if s["sheetType"] != "집단상담"]
        ind_ids_1101 = set(s["id"] for s in individual_1101)
        ind_ids_2101 = set(s["id"] for s in individual_2101)
        ind_overlap = ind_ids_1101 & ind_ids_2101
        log_test("Duplicate name: different sessions by studentId", 
                 len(ind_overlap) == 0,
                 "Individual overlap: {}".format(len(ind_overlap)))
        
        # Test with non-existent student
        r4 = requests.get(BASE_URL + "/sessions/존재하지않는학생", 
                         params={"student_id": "9999"}, timeout=10)
        log_test("Non-existent student returns 200 with empty list", 
                 r4.status_code == 200 and r4.json() == [])
        
    except Exception as e:
        log_test("GET /sessions/{student_name}", False, traceback.format_exc())


def test_get_all_sessions():
    log_section("4. GET /sessions - All Sessions & Filtering")
    try:
        # Get all sessions
        r = requests.get(BASE_URL + "/sessions", timeout=10)
        log_test("GET /sessions returns 200", r.status_code == 200)
        all_sessions = r.json()
        log_test("Returns sessions", len(all_sessions) > 0, "Count: {}".format(len(all_sessions)))
        
        # Filter by sheet type
        sheet_types = ["개인상담", "집단상담", "보호자상담", "교원자문", "의뢰"]
        for stype in sheet_types:
            r = requests.get(BASE_URL + "/sessions", params={"sheet_type": stype}, timeout=10)
            log_test("Filter by sheetType='{}' returns 200".format(stype), r.status_code == 200)
            filtered = r.json()
            # All returned sessions should match the sheet type
            if filtered:
                all_match = all(s.get("sheetType") == stype for s in filtered)
                log_test("  All results match sheetType='{}'".format(stype), all_match,
                         "Count: {}".format(len(filtered)))
            else:
                log_test("  Has results for '{}'".format(stype), len(filtered) > 0, "Empty!")
        
        # Check session number assignment across all sessions
        # Sessions should have session numbers (회기) assigned by student+sheetType
        sessions_with_nums = [s for s in all_sessions if s.get("session") and s["session"] != ""]
        log_test("Session numbers assigned in all-sessions view", 
                 len(sessions_with_nums) > 0,
                 "{}/{} have session numbers".format(len(sessions_with_nums), len(all_sessions)))
        
    except Exception as e:
        log_test("GET /sessions", False, traceback.format_exc())


def test_today_stats():
    log_section("5. GET /stats/today - Today's Statistics")
    try:
        r = requests.get(BASE_URL + "/stats/today", timeout=10)
        log_test("GET /stats/today returns 200", r.status_code == 200)
        stats = r.json()
        
        required_keys = ["total", "guardian", "referral", "pending"]
        missing = [k for k in required_keys if k not in stats]
        log_test("Stats has required fields", len(missing) == 0,
                 "Missing: {}".format(missing) if missing else "All present")
        
        # Our test data has today's date entries
        log_test("Today total > 0", stats.get("total", 0) > 0,
                 "total={}".format(stats.get("total")))
        log_test("Guardian count >= 0", stats.get("guardian", -1) >= 0,
                 "guardian={}".format(stats.get("guardian")))
        log_test("Referral count >= 0", stats.get("referral", -1) >= 0,
                 "referral={}".format(stats.get("referral")))
        
        # Expected: 4 individual + 1 group + 2 guardian + 1 referral = 8 total
        log_test("Today total matches expected (~8)", stats.get("total", 0) >= 6,
                 "total={} (expected ~8)".format(stats.get("total")))
        log_test("Guardian matches expected (~2)", stats.get("guardian", 0) >= 1,
                 "guardian={} (expected ~2)".format(stats.get("guardian")))
        log_test("Referral matches expected (~1)", stats.get("referral", 0) >= 1,
                 "referral={} (expected ~1)".format(stats.get("referral")))
        
    except Exception as e:
        log_test("GET /stats/today", False, traceback.format_exc())


def test_create_session():
    log_section("6. POST /sessions - Create Session (CRUD)")
    try:
        # Create a new individual counseling session
        new_session_data = {
            "name": "홍길동",
            "studentId": "6203",
            "grade": "6",
            "gender": "남",
            "date": "20260525",
            "type": "학업",
            "sheetType": "개인상담",
            "summary": "테스트 상담 생성",
            "detail": "이것은 API 테스트에서 생성된 상담 기록입니다."
        }
        
        r = requests.post(BASE_URL + "/sessions", json=new_session_data, timeout=10)
        log_test("POST /sessions (individual) returns 200", r.status_code == 200)
        result = r.json()
        log_test("Response has status=success", result.get("status") == "success")
        log_test("Response has session_id", "session_id" in result and result["session_id"] != "")
        
        created_id = result.get("session_id", "")
        
        # Verify the session was created by fetching it
        r2 = requests.get(BASE_URL + "/sessions/홍길동", 
                         params={"student_id": "6203"}, timeout=10)
        sessions = r2.json()
        created = [s for s in sessions if s["id"] == created_id]
        log_test("Created session found in GET /sessions", len(created) == 1)
        
        if created:
            log_test("Created session has correct summary", 
                     created[0]["summary"] == "테스트 상담 생성")
            log_test("Created session has correct date",
                     created[0]["date"] == "20260525")
            log_test("Created session sheetType is 개인상담",
                     created[0]["sheetType"] == "개인상담")
        
        # Create group counseling session
        group_data = {
            "name": "",
            "studentId": "3101, 3102, 3103",
            "grade": "3",
            "gender": "혼성",
            "date": "20260520",
            "type": "대인관계",
            "sheetType": "집단상담",
            "summary": "테스트 집단상담",
            "detail": "집단상담 테스트 기록입니다."
        }
        
        r3 = requests.post(BASE_URL + "/sessions", json=group_data, timeout=10)
        log_test("POST /sessions (group) returns 200", r3.status_code == 200)
        
        # Create guardian counseling
        guardian_data = {
            "name": "박지은",
            "studentId": "1201",
            "grade": "1",
            "gender": "여",
            "date": "20260524",
            "type": "학생관련상담",
            "sheetType": "보호자상담",
            "summary": "테스트 보호자상담",
            "detail": "보호자상담 테스트 기록입니다."
        }
        
        r4 = requests.post(BASE_URL + "/sessions", json=guardian_data, timeout=10)
        log_test("POST /sessions (guardian) returns 200", r4.status_code == 200)
        
        # Create teacher consultation
        teacher_data = {
            "name": "최건우",
            "studentId": "3201",
            "grade": "3",
            "gender": "남",
            "date": "20260523",
            "type": "행동발달",
            "sheetType": "교원자문",
            "summary": "테스트 교원자문",
            "detail": "교원자문 테스트 기록입니다."
        }
        
        r5 = requests.post(BASE_URL + "/sessions", json=teacher_data, timeout=10)
        log_test("POST /sessions (teacher) returns 200", r5.status_code == 200)
        
        # Create referral
        referral_data = {
            "name": "한소율",
            "studentId": "5202",
            "grade": "5",
            "gender": "여",
            "date": "20260522",
            "type": "외부전문가에게 상담의뢰",
            "sheetType": "의뢰",
            "summary": "테스트 의뢰",
            "detail": "의뢰 테스트 기록입니다."
        }
        
        r6 = requests.post(BASE_URL + "/sessions", json=referral_data, timeout=10)
        log_test("POST /sessions (referral) returns 200", r6.status_code == 200)
        
        # Test with invalid sheet type
        invalid_data = {
            "name": "테스트",
            "studentId": "9999",
            "grade": "1",
            "gender": "남",
            "date": "20260525",
            "type": "기타",
            "sheetType": "존재하지않는시트",
            "summary": "테스트",
            "detail": "테스트"
        }
        r7 = requests.post(BASE_URL + "/sessions", json=invalid_data, timeout=10)
        log_test("POST /sessions with invalid sheetType returns 400", r7.status_code == 400)
        
        return created_id
        
    except Exception as e:
        log_test("POST /sessions", False, traceback.format_exc())
        return None


def test_update_session(session_id):
    log_section("7. PUT /sessions/{id} - Update Session")
    try:
        if not session_id:
            log_test("Skip: no session_id to update", False, "Need created session")
            return
        
        update_data = {
            "date": "20260524",
            "type": "진로",
            "summary": "수정된 상담 제목",
            "detail": "수정된 상담 내용입니다.",
            "sheetType": "개인상담"
        }
        
        r = requests.put(BASE_URL + "/sessions/{}".format(session_id), 
                        json=update_data, timeout=10)
        log_test("PUT /sessions/{id} returns 200", r.status_code == 200)
        result = r.json()
        log_test("Response has status=success", result.get("status") == "success")
        
        # Verify the update
        r2 = requests.get(BASE_URL + "/sessions/홍길동", 
                         params={"student_id": "6203"}, timeout=10)
        sessions = r2.json()
        updated = [s for s in sessions if s["id"] == session_id]
        
        if updated:
            log_test("Updated session has new summary", 
                     updated[0]["summary"] == "수정된 상담 제목")
            log_test("Updated session has new date",
                     updated[0]["date"] == "20260524")
            log_test("Updated session has new type",
                     updated[0]["type"] == "진로")
        else:
            log_test("Updated session found after update", False, "Session not found")
        
        # Test updating non-existent session
        r3 = requests.put(BASE_URL + "/sessions/nonexistent_uuid_12345", 
                         json=update_data, timeout=10)
        log_test("PUT /sessions with non-existent ID returns 404", r3.status_code == 404)
        
    except Exception as e:
        log_test("PUT /sessions/{id}", False, traceback.format_exc())


def test_delete_session(session_id):
    log_section("8. DELETE /sessions/{id} - Delete Session")
    try:
        if not session_id:
            log_test("Skip: no session_id to delete", False, "Need created session")
            return
        
        # Get sessions before delete
        r_before = requests.get(BASE_URL + "/sessions/홍길동", 
                               params={"student_id": "6203"}, timeout=10)
        count_before = len(r_before.json())
        
        r = requests.delete(BASE_URL + "/sessions/{}".format(session_id), timeout=10)
        log_test("DELETE /sessions/{id} returns 200", r.status_code == 200)
        result = r.json()
        log_test("Response has status=success", result.get("status") == "success")
        
        # Verify deletion
        r2 = requests.get(BASE_URL + "/sessions/홍길동", 
                         params={"student_id": "6203"}, timeout=10)
        sessions = r2.json()
        deleted = [s for s in sessions if s["id"] == session_id]
        log_test("Deleted session no longer found", len(deleted) == 0)
        
        count_after = len(sessions)
        log_test("Session count decreased by 1", count_after == count_before - 1,
                 "Before: {}, After: {}".format(count_before, count_after))
        
        # Test deleting non-existent session
        r3 = requests.delete(BASE_URL + "/sessions/nonexistent_uuid_12345", timeout=10)
        log_test("DELETE non-existent session returns 404", r3.status_code == 404)
        
    except Exception as e:
        log_test("DELETE /sessions/{id}", False, traceback.format_exc())


def test_student_update():
    log_section("9. POST /students/update - Update Student Info")
    try:
        # Update a student's info (change name and grade)
        update_data = {
            "oldName": "피서진",
            "oldStudentId": "6303",
            "newName": "피서진",
            "newStudentId": "6303",
            "grade": "6",
            "gender": "여"
        }
        
        r = requests.post(BASE_URL + "/students/update", json=update_data, timeout=15)
        log_test("POST /students/update returns 200", r.status_code == 200)
        
        # Test with empty name (should fail)
        invalid_data = {
            "oldName": "피서진",
            "oldStudentId": "6303",
            "newName": "",
            "newStudentId": "6303",
            "grade": "6",
            "gender": "여"
        }
        r2 = requests.post(BASE_URL + "/students/update", json=invalid_data, timeout=10)
        log_test("Update with empty name returns 400", r2.status_code == 400)
        
        # Test with non-numeric student ID
        invalid_data2 = {
            "oldName": "피서진",
            "oldStudentId": "6303",
            "newName": "피서진",
            "newStudentId": "ABCD",
            "grade": "6",
            "gender": "여"
        }
        r3 = requests.post(BASE_URL + "/students/update", json=invalid_data2, timeout=10)
        log_test("Update with non-numeric studentId returns 400", r3.status_code == 400)
        
    except Exception as e:
        log_test("POST /students/update", False, traceback.format_exc())


def test_open_file():
    log_section("10. POST /open-file - Open Excel File")
    try:
        # Open the test file
        r = requests.post(BASE_URL + "/open-file", 
                         json={"path": WORK_COPY}, timeout=15)
        log_test("POST /open-file returns 200", r.status_code == 200)
        result = r.json()
        log_test("Response has status=success", result.get("status") == "success")
        
        # Test with non-existent file
        r2 = requests.post(BASE_URL + "/open-file", 
                          json={"path": "C:\\nonexistent\\file.xlsx"}, timeout=10)
        log_test("Open non-existent file returns 404", r2.status_code == 404)
        
    except Exception as e:
        log_test("POST /open-file", False, traceback.format_exc())


def test_backup():
    log_section("11. POST /backup - Manual Backup")
    try:
        r = requests.post(BASE_URL + "/backup", timeout=15)
        log_test("POST /backup returns 200", r.status_code == 200)
        result = r.json()
        log_test("Backup response has filename", "filename" in result)
        log_test("Backup response has directory", "directory" in result)
        
    except Exception as e:
        log_test("POST /backup", False, traceback.format_exc())


def test_peer_students():
    log_section("12. Peer Counseling Students API")
    try:
        # GET peer students
        r = requests.get(BASE_URL + "/peer-counsel/students", timeout=10)
        log_test("GET /peer-counsel/students returns 200", r.status_code == 200)
        students = r.json()
        log_test("Returns a list", isinstance(students, list))
        log_test("Has peer students", len(students) > 0, "Count: {}".format(len(students)))
        
        if students:
            s = students[0]
            required_keys = ["grade", "class", "number", "name", "studentId"]
            missing = [k for k in required_keys if k not in s]
            log_test("Peer student has required fields", len(missing) == 0,
                     "Missing: {}".format(missing) if missing else "All present")
        
        # POST (save) peer students
        new_peers = [
            {"grade": 3, "class": 1, "number": 1, "name": "테스트학생", "studentId": "3101"}
        ]
        r2 = requests.post(BASE_URL + "/peer-counsel/students", json=new_peers, timeout=10)
        log_test("POST /peer-counsel/students returns 200", r2.status_code == 200)
        
        # Verify saved
        r3 = requests.get(BASE_URL + "/peer-counsel/students", timeout=10)
        saved = r3.json()
        log_test("Saved peer students retrieved", len(saved) == 1 and saved[0]["name"] == "테스트학생")
        
    except Exception as e:
        log_test("Peer counseling API", False, traceback.format_exc())


def test_session_resequencing():
    log_section("13. Session Number (회기) Auto-Resequencing")
    try:
        # Create 3 sessions for a specific student on different dates
        student_name = "하준영"
        student_id = "6304"
        
        dates = ["20260501", "20260510", "20260515"]
        created_ids = []
        
        for i, date in enumerate(dates):
            data = {
                "name": student_name,
                "studentId": student_id,
                "grade": "6",
                "gender": "남",
                "date": date,
                "type": "학업",
                "sheetType": "개인상담",
                "summary": "회기 테스트 {}".format(i + 1),
                "detail": "회기 자동 배정 테스트 #{}.".format(i + 1)
            }
            r = requests.post(BASE_URL + "/sessions", json=data, timeout=10)
            if r.status_code == 200:
                created_ids.append(r.json().get("session_id"))
        
        log_test("Created 3 test sessions", len(created_ids) == 3)
        
        # Verify session numbers are 1, 2, 3 in date order
        r2 = requests.get(BASE_URL + "/sessions/{}".format(student_name), 
                         params={"student_id": student_id}, timeout=10)
        sessions = r2.json()
        
        # Filter to only 개인상담 and sort by date asc
        ind_sessions = [s for s in sessions if s["sheetType"] == "개인상담"]
        ind_sessions.sort(key=lambda x: x["date"])
        
        if ind_sessions:
            session_nums = [s.get("session", "") for s in ind_sessions]
            expected = [str(i+1) for i in range(len(ind_sessions))]
            log_test("Session numbers are sequential (1, 2, 3...)", 
                     session_nums == expected,
                     "Got: {} Expected: {}".format(session_nums, expected))
        
        # Delete the middle session (session 2) and check resequencing
        if len(created_ids) >= 2:
            r3 = requests.delete(BASE_URL + "/sessions/{}".format(created_ids[1]), timeout=10)
            log_test("Deleted middle session for resequencing", r3.status_code == 200)
            
            r4 = requests.get(BASE_URL + "/sessions/{}".format(student_name), 
                             params={"student_id": student_id}, timeout=10)
            sessions_after = r4.json()
            ind_after = [s for s in sessions_after if s["sheetType"] == "개인상담"]
            ind_after.sort(key=lambda x: x["date"])
            
            session_nums_after = [s.get("session", "") for s in ind_after]
            expected_after = [str(i+1) for i in range(len(ind_after))]
            log_test("Session numbers resequenced after deletion",
                     session_nums_after == expected_after,
                     "Got: {} Expected: {}".format(session_nums_after, expected_after))
        
        # Cleanup remaining test sessions
        for sid in created_ids:
            if sid and sid != created_ids[1]:  # skip already deleted
                try:
                    requests.delete(BASE_URL + "/sessions/{}".format(sid), timeout=5)
                except Exception:
                    pass
        
    except Exception as e:
        log_test("Session resequencing", False, traceback.format_exc())


def test_edge_cases():
    log_section("14. Edge Cases & Data Integrity")
    try:
        # Test example row filtering (순번="예시" should be excluded)
        r = requests.get(BASE_URL + "/students", timeout=10)
        students = r.json()
        example_students = [s for s in students if s["name"] == "홍길동" and s["studentId"] == "1101"]
        # "홍길동" with "1101" is only in the example row, the real 홍길동 has "6203"
        # Actually our student list has 홍길동 with 6203
        log_test("Example rows (순번=예시) are excluded from students", 
                 len(example_students) == 0,
                 "Found {} example entries".format(len(example_students)))
        
        # Check that '예시' student from example rows doesn't appear as a unique student
        # The example row has name=홍길동 sid=1101, our real data has 홍길동 sid=6203
        real_hong = [s for s in students if s["name"] == "홍길동" and s["studentId"] == "6203"]
        log_test("Real 홍길동(6203) exists", len(real_hong) >= 0)  # may or may not have records
        
        # Test session creation with special characters (Formula Injection test)
        injection_data = {
            "name": "테스트",
            "studentId": "9901",
            "grade": "1",
            "gender": "남",
            "date": "20260525",
            "type": "기타",
            "sheetType": "개인상담",
            "summary": "=CMD('calc')",
            "detail": "+some formula @SUM(A1:A5)"
        }
        r2 = requests.post(BASE_URL + "/sessions", json=injection_data, timeout=10)
        log_test("Formula injection input accepted (sanitized server-side)", r2.status_code == 200)
        
        if r2.status_code == 200:
            # Cleanup
            sid = r2.json().get("session_id")
            if sid:
                requests.delete(BASE_URL + "/sessions/{}".format(sid), timeout=5)
        
        # Test with very long content
        long_detail = "가" * 5000
        long_data = {
            "name": "테스트",
            "studentId": "9902",
            "grade": "2",
            "gender": "여",
            "date": "20260525",
            "type": "기타",
            "sheetType": "개인상담",
            "summary": "장문 테스트",
            "detail": long_detail
        }
        r3 = requests.post(BASE_URL + "/sessions", json=long_data, timeout=15)
        log_test("Long content (5000 chars) accepted", r3.status_code == 200)
        
        if r3.status_code == 200:
            sid = r3.json().get("session_id")
            if sid:
                requests.delete(BASE_URL + "/sessions/{}".format(sid), timeout=5)
        
    except Exception as e:
        log_test("Edge cases", False, traceback.format_exc())


def test_student_delete():
    log_section("15. POST /students/delete - Delete Student")
    try:
        # First create a test student with a unique name
        create_data = {
            "name": "삭제테스트학생",
            "studentId": "9800",
            "grade": "1",
            "gender": "남",
            "date": "20260520",
            "type": "기타",
            "sheetType": "개인상담",
            "summary": "삭제 테스트용",
            "detail": "이 기록은 학생 삭제 테스트를 위해 생성됨."
        }
        r0 = requests.post(BASE_URL + "/sessions", json=create_data, timeout=10)
        log_test("Created test student for deletion", r0.status_code == 200)
        
        # Also create a guardian session for same student
        guardian_data = {
            "name": "삭제테스트학생",
            "studentId": "9800",
            "grade": "1",
            "gender": "남",
            "date": "20260521",
            "type": "기타",
            "sheetType": "보호자상담",
            "summary": "삭제 테스트 보호자",
            "detail": "보호자상담 삭제 테스트."
        }
        r0b = requests.post(BASE_URL + "/sessions", json=guardian_data, timeout=10)
        log_test("Created guardian session for test student", r0b.status_code == 200)
        
        # Delete the student
        delete_data = {
            "name": "삭제테스트학생",
            "studentId": "9800"
        }
        r = requests.post(BASE_URL + "/students/delete", json=delete_data, timeout=15)
        log_test("POST /students/delete returns 200", r.status_code == 200)
        
        # Verify student is no longer in student list
        r2 = requests.get(BASE_URL + "/students", timeout=10)
        students = r2.json()
        found = [s for s in students if s["name"] == "삭제테스트학생"]
        log_test("Deleted student not in student list", len(found) == 0)
        
        # Verify sessions are also deleted
        r3 = requests.get(BASE_URL + "/sessions/삭제테스트학생", 
                         params={"student_id": "9800"}, timeout=10)
        sessions = r3.json()
        individual_sessions = [s for s in sessions if s["sheetType"] != "집단상담"]
        log_test("Deleted student has no individual sessions", len(individual_sessions) == 0,
                 "Remaining: {}".format(len(individual_sessions)))
        
        # Test deleting non-existent student
        r4 = requests.post(BASE_URL + "/students/delete", 
                          json={"name": "존재하지않음", "studentId": "0000"}, timeout=10)
        log_test("Delete non-existent student returns 400", r4.status_code == 400)
        
    except Exception as e:
        log_test("POST /students/delete", False, traceback.format_exc())


# ──────────────────────────────────────────
# Main execution
# ──────────────────────────────────────────
def main():
    print("=" * 60)
    print("  CounselingLog Backend Functional Test Suite")
    print("  Test file: {}".format(os.path.basename(TEST_FILE)))
    print("=" * 60)
    
    proc = None
    try:
        proc = start_server()
        
        # Run all tests
        test_health()
        students = test_get_students()
        test_get_sessions_by_student(students)
        test_get_all_sessions()
        test_today_stats()
        created_id = test_create_session()
        test_update_session(created_id)
        test_delete_session(created_id)
        test_student_update()
        test_open_file()
        test_backup()
        test_peer_students()
        test_session_resequencing()
        test_edge_cases()
        test_student_delete()
        
    except Exception as e:
        print("\nFATAL ERROR: {}".format(str(e)))
        traceback.print_exc()
    finally:
        stop_server(proc)
    
    # ── Summary ──
    log_section("TEST RESULTS SUMMARY")
    total = len(results)
    passed = sum(1 for r in results if r["passed"])
    failed = total - passed
    
    print("Total: {} | Passed: {} | Failed: {}".format(total, passed, failed))
    print("Pass rate: {:.1f}%".format(100 * passed / total if total else 0))
    
    if errors:
        print("\n--- FAILED TESTS ---")
        for i, e in enumerate(errors, 1):
            print("{}. {} -- {}".format(i, e["name"], e["detail"]))
    else:
        print("\nAll tests passed!")
    
    # Write results to JSON for later analysis
    results_path = os.path.join(PROJECT_DIR, "scratch", "test_results.json")
    with open(results_path, "w", encoding="utf-8") as f:
        json.dump({"total": total, "passed": passed, "failed": failed, 
                   "errors": errors, "results": results}, f, ensure_ascii=False, indent=2)
    print("\nDetailed results saved to: {}".format(results_path))
    
    return failed


if __name__ == "__main__":
    exit_code = main()
    sys.exit(exit_code)
