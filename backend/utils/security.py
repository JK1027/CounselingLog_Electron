import html

def sanitize_value(value):
    """
    Excel Formula Injection 공격을 방어하기 위해 수식 시작 문자(=, +, -, @)를 안전하게 소독합니다.
    """
    if value is None:
        return ""
    val_str = str(value).strip()
    if val_str.startswith(("=", "+", "-", "@")):
        return "'" + val_str
    return val_str

def html_escape(value):
    """
    HTML XSS 방어를 위해 문자열을 안전하게 escape 처리합니다.
    """
    if value is None:
        return ""
    return html.escape(str(value).strip())
