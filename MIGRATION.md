# MacBook 이전 가이드

이 문서는 `여정` 프로젝트를 Windows PC에서 MacBook으로 안전하게 이전하기 위한 체크리스트입니다.

## 1. 이전 전에 꼭 백업할 파일

아래 파일은 **반드시 별도 백업**하세요.

- `android/app/release-key.jks`
- `android/app/google-services.json`
- `capacitor.config.json`
- `package.json`
- `package-lock.json`
- `android/app/build.gradle`

추가로 별도 메모 권장:

- Kakao 앱 키
- Firebase 프로젝트 정보
- Google Play Console 앱 정보
- 현재 배포 버전 정보

## 2. 제일 안전한 이전 방법

추천 방식은:

1. 현재 PC에서 Git에 최신 변경사항 커밋
2. 원격 저장소(GitHub 등)에 푸시
3. MacBook에서 clone
4. 민감 파일만 수동 복사
5. 의존성 재설치 및 동기화

## 3. Windows PC에서 할 일

### 3-1. 현재 상태 확인

```powershell
git status
```

변경사항이 있으면 커밋:

```powershell
git add -A
git commit -m "chore: prepare migration to macbook"
```

원격 저장소가 있으면 푸시:

```powershell
git push
```

### 3-2. 별도 백업 권장

아래 파일은 USB, 클라우드, 암호화 저장소 등에 따로 보관:

- `android/app/release-key.jks`
- `android/app/google-services.json`

## 4. MacBook에서 설치할 것

필수:

- Node.js
- npm
- JDK 17
- Android Studio
- Git

선택:

- Xcode
- CocoaPods

## 5. MacBook 설치 예시

Homebrew 기준:

```bash
brew install node
brew install openjdk@17
brew install --cask android-studio
```

JDK 경로 설정 예시:

```bash
echo 'export JAVA_HOME=$(/usr/libexec/java_home -v 17)' >> ~/.zshrc
echo 'export PATH="$JAVA_HOME/bin:$PATH"' >> ~/.zshrc
source ~/.zshrc
```

## 6. MacBook에서 프로젝트 가져오기

원격 저장소에서 가져오기:

```bash
git clone <repository-url>
cd "map masking app"
```

그 다음 백업해둔 파일 복사:

- `android/app/release-key.jks`
- `android/app/google-services.json`

## 7. 의존성 재설치

Windows의 `node_modules`는 복사하지 말고 Mac에서 새로 설치하세요.

```bash
npm install
```

## 8. Capacitor / Android 동기화

```bash
npx cap sync android
```

Android Studio에서 `android/` 폴더를 열고 Gradle Sync를 진행하세요.

## 9. 빌드 확인

개발 빌드:

```bash
cd android
./gradlew assembleDebug
```

릴리즈 AAB 빌드:

```bash
./gradlew bundleRelease
```

생성 위치:

- `android/app/build/outputs/bundle/release/app-release.aab`

## 10. 이전 후 체크리스트

- [ ] 앱 실행 확인
- [ ] 카카오 로그인 확인
- [ ] 구글 로그인 확인
- [ ] Firebase 동기화 확인
- [ ] 사진 첨부 확인
- [ ] 릴리즈 빌드 확인
- [ ] AAB 생성 확인

## 11. 주의사항

### 서명키

`release-key.jks`를 분실하면 기존 앱 업데이트 배포가 막힐 수 있습니다.

### 줄바꿈 / 인코딩

Windows와 Mac은 줄바꿈이 다를 수 있으므로, 파일이 깨지면 Git 상태와 인코딩을 먼저 확인하세요.

### 절대경로 금지

코드나 설정 파일에 Windows 절대경로(`C:\...`)를 넣지 않는 것이 좋습니다.

## 12. 추천 작업 순서

1. Git 최신 커밋 확인
2. 서명키 / Firebase 파일 별도 백업
3. MacBook에 개발환경 설치
4. 프로젝트 clone
5. 민감 파일 복사
6. `npm install`
7. `npx cap sync android`
8. Android Studio 실행
9. 앱 실행 및 로그인 테스트
10. `bundleRelease` 확인

## 13. 보안 메모

현재 프로젝트에는 민감 정보가 포함될 수 있으므로, 이전 후에는 다음 정리를 권장합니다.

- 서명 비밀번호를 코드에서 분리
- `.env` 또는 안전한 로컬 방식으로 관리
- 원격 저장소 공개 여부 재검토