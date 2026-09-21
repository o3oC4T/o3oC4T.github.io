# Yeong Choi — Research & CTF

최영의 포트폴리오. [사이트 보기](https://o3oc4t.github.io/)

선택한 레퍼런스의 3D 아카이브 상자, 카메라, 카드 등장·호버·열기·복귀 모션을 유지하고 개인 콘텐츠를 교체한 정적 사이트입니다. 카드에는 코드로 만든 홀로그래픽 파스텔 표면을 적용했고, 조명과 UI의 기본 강조색은 파스텔 핑크입니다. 디자인과 렌더러의 출처는 [CREDITS.md](CREDITS.md)에 명시했습니다.

## 구성

| 카드 | 내용 |
| --- | --- |
| Research | WISA 2026 포스터 2편과 저자 역할 |
| CTF | 주요 보안 경진대회 성적 |
| RubiyaLAB | CTF 팀 활동과 12개 대회 기록 |
| Team o3o | 학술팀 리더 활동과 6개 대회 기록 |
| Honors | 수상 및 창업 프로그램 등 활동 |
| Education | 2018년부터 현재까지 교육 이력 |

소개, 인쇄 가능한 이력서, 이메일·Instagram·Discord·GitHub 연락처를 제공합니다. Discord는 ID 복사 방식이며 LinkedIn은 아직 등록하지 않았습니다. WebGL을 사용할 수 없으면 동일 콘텐츠의 텍스트 목록을 제공합니다.

콘텐츠는 사용자가 제공한 Notion 자료를 바탕으로 합니다. 원문에 없는 날짜·순위·초록·논문 링크는 만들지 않았습니다. 검색 색인은 검토 중인 초안에 맞춰 비활성화되어 있습니다.

## 수정 및 미리 보기

- `docs/content.js`: 프로필, 카드, 연구, 대회·교육 이력의 단일 데이터 원본
- `docs/theme.js`: 파스텔 핑크 기본색과 카드별 파스텔 팔레트
- `docs/app.js`: 화면 렌더링, 접근성, 연락처 복사, 모바일 탐색
- `docs/caption-scramble.js`: 원본 타이밍의 카드 번호·이름·화살표 글자 스크램블
- `docs/styles.css`: 개인 콘텐츠 및 반응형 스타일
- `docs/assets/archive-scene.js`: 개인화한 원본 3D 렌더러
- `docs/assets/pastel-surface.js`: 이미지 파일 없이 생성하는 홀로그래픽 카드 표면
- `docs/assets/reference-*.css`: 유지한 원본 레이아웃 스타일

```bash
python3 -m http.server 4173 --bind 127.0.0.1 --directory docs
```

http://127.0.0.1:4173/ 에서 확인합니다. GitHub Pages는 `main` 브랜치의 `/docs`를 게시합니다. 빌드나 서버, API 키가 필요하지 않습니다.

```bash
npm install
npm test
npx playwright install chromium
# 로컬 서버를 실행한 상태에서
npm run test:browser
npm run test:caption
```

브라우저 검증은 6개 카드의 PC·모바일 열기/닫기, 소개, 이력서 인쇄, 연락처, Discord 복사, 가로 넘침, WebGL 대체 화면, 로딩 오류를 확인합니다. 결과 이미지는 무시되는 `test-results/`에 저장됩니다.

기존 인물의 미디어·연락처·음악·애플리케이션 번들은 게시 폴더에서 제외했습니다. 원본 스냅샷은 Git 이력 및 로컬 `reference/retired-2026-09-21/`에서 복구할 수 있습니다. `scripts/download-reference.mjs`는 게시 파일을 덮어쓰지 않고 별도 `reference/download/`에 저장합니다. `scripts/personalize-scene.mjs`는 보관한 특정 버전의 원본 렌더러에서 개인화 변경을 재현하는 도구이며 일상적인 콘텐츠 수정에는 필요하지 않습니다.
