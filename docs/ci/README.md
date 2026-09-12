# 주 1회 자동 재검증 켜기

이 폴더의 [`reverify.yml`](reverify.yml)은 GitHub Actions 워크플로입니다. 매주 월요일에 13개 레슨을 미리보기 모드로 실행해서, 테스트넷 값이나 라이브러리 API가 바뀌어 자료가 틀리게 되는 것을 미리 잡아냅니다.

저장소를 처음 올릴 때 이 파일이 `.github/workflows/`에 들어가지 못했습니다. 워크플로 파일을 푸시하려면 GitHub 토큰에 `workflow` 권한이 필요한데 그 권한이 없었기 때문입니다. 아래 중 하나로 켜세요.

## 방법 1. 터미널에서 권한을 받고 옮기기

```bash
gh auth refresh -s workflow
mkdir -p .github/workflows
git mv docs/ci/reverify.yml .github/workflows/reverify.yml
git commit -m "ci: 주 1회 재검증 워크플로 추가"
git push
```

## 방법 2. GitHub 웹에서 만들기

1. 저장소 페이지에서 **Actions** 탭 → **set up a workflow yourself**를 누릅니다.
2. 파일 이름을 `reverify.yml`로 둡니다. 경로는 자동으로 `.github/workflows/`가 됩니다.
3. [`reverify.yml`](reverify.yml)의 내용을 그대로 붙여넣고 커밋합니다.
4. 이 폴더의 `reverify.yml`은 지워도 됩니다.

## 워크플로가 하는 일

`node tools/verify-readonly.js`를 실행합니다. 13개 레슨을 모두 `SEND_TX=false`(미리보기)로 돌리고, 하나라도 실패하면 워크플로가 실패합니다. 비밀값(시크릿)은 필요하지 않습니다. 스크립트가 공개된 데모 니모닉을 스스로 넣기 때문입니다.

수동으로 돌려 보려면 Actions 탭에서 **Run workflow**를 누르세요. 로컬에서는 `npm test`가 같은 일을 합니다.
