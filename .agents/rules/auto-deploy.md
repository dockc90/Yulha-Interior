---
trigger: always_on
---

# Auto Deploy to Vercel on Edit

이 프로젝트(`Yulha Interior`)의 코드를 수정하거나 새 기능을 추가한 뒤에는, 사용자가 별도로 "푸시하지 마" 또는 "로컬에서만 확인"을 요청하지 않는 한 **항상 아래 순서로 자동 배포까지 완료**한다.

1. 프로덕션 빌드 검증: `npm.cmd run build` 실행 및 오류 없음 확인
2. 변경 사항 커밋 및 푸시:
   - `git add -A`
   - `git commit -m "<변경 내용 요약>"`
   - `git push origin main`
3. 푸시 완료 후 Vercel(`https://yulha-interior.vercel.app/`)에 자동 반영됨을 사용자에게 안내한다.
