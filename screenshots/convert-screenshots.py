#!/usr/bin/env python3
"""
HTML 스크린샷을 PNG로 변환하는 스크립트
사용법: python3 convert-screenshots.py
"""

import os
import time
from selenium import webdriver
from selenium.webdriver.chrome.options import Options
from selenium.webdriver.chrome.service import Service

# 설정
SCREENSHOTS_DIR = "/Users/gomin77/Desktop/map-app/screenshots"
OUTPUT_DIR = os.path.join(SCREENSHOTS_DIR, "png")

# 출력 폭더 생성
os.makedirs(OUTPUT_DIR, exist_ok=True)

# Chrome 옵션 설정
chrome_options = Options()
chrome_options.add_argument('--headless')
chrome_options.add_argument('--no-sandbox')
chrome_options.add_argument('--disable-dev-shm-usage')
chrome_options.add_argument('--window-size=1620,2880')
chrome_options.add_argument('--hide-scrollbars')

# ChromeDriver 경로 (macOS 기본 경로)
chromedriver_path = "/usr/local/bin/chromedriver"

# ChromeDriver가 없으면 기본 경로 사용
try:
    service = Service(chromedriver_path)
    driver = webdriver.Chrome(service=service, options=chrome_options)
except Exception as e:
    print(f"ChromeDriver 경로 문제: {e}")
    print("기본 ChromeDriver 사용...")
    driver = webdriver.Chrome(options=chrome_options)

# 각 HTML 파일 캡처
for i in range(1, 7):
    html_file = os.path.join(SCREENSHOTS_DIR, f"screenshot-{i}.html")
    png_file = os.path.join(OUTPUT_DIR, f"screenshot-{i}.png")
    
    if os.path.exists(html_file):
        print(f"캡처 중: screenshot-{i}.html")
        
        # HTML 파일 로드
        file_url = f"file://{html_file}"
        driver.get(file_url)
        
        # 페이지 로드 대기
        time.sleep(2)
        
        # 스크린샷 저장
        driver.save_screenshot(png_file)
        
        print(f"✓ 완료: screenshot-{i}.png")
    else:
        print(f"✗ 파일 없음: screenshot-{i}.html")

# 브라우저 종료
driver.quit()

print(f"\n변환 완료! PNG 파일은 {OUTPUT_DIR} 에 저장되었습니다.")
