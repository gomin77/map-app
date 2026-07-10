#!/bin/bash

# HTML 스크린샷을 PNG로 변환하는 스크립트
# 사용법: ./convert-screenshots.sh

SCREENSHOTS_DIR="/Users/gomin77/Desktop/map-app/screenshots"
OUTPUT_DIR="/Users/gomin77/Desktop/map-app/screenshots/png"

# 출력 폴더 생성
mkdir -p "$OUTPUT_DIR"

# wkhtmltoimage 설치 확인
if ! command -v wkhtmltoimage &> /dev/null; then
    echo "wkhtmltoimage를 설치합니다..."
    brew install wkhtmltopdf
fi

# 각 HTML 파일을 PNG로 변환
for i in {1..6}; do
    HTML_FILE="$SCREENSHOTS_DIR/screenshot-$i.html"
    PNG_FILE="$OUTPUT_DIR/screenshot-$i.png"
    
    if [ -f "$HTML_FILE" ]; then
        echo "변환 중: screenshot-$i.html -> screenshot-$i.png"
        wkhtmltoimage \
            --width 1080 \
            --height 1920 \
            --quality 90 \
            --enable-javascript \
            --javascript-delay 2000 \
            "$HTML_FILE" \
            "$PNG_FILE"
        
        if [ $? -eq 0 ]; then
            echo "✓ 완료: screenshot-$i.png"
        else
            echo "✗ 실패: screenshot-$i.html"
        fi
    else
        echo "✗ 파일 없음: screenshot-$i.html"
    fi
done

echo ""
echo "변환 완료! PNG 파일은 $OUTPUT_DIR 에 저장되었습니다."
