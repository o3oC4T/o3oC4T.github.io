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

소개, 인쇄 가능한 이력서, 이메일·Instagram·Discord·GitHub 연락처를 제공합니다. Discord는 ID 복사 방식이며 LinkedIn은 아직 등록하지 않았습니다. 별도의 텍스트 보기 모드는 없으며, 3D 화면을 불러오지 못하면 오류 안내와 새로고침 버튼을 표시합니다.

마우스 커서는 기존 프로필 사진을 담은 26px 원형으로, 카드별 파스텔 색을 18% 농도로 덧입힙니다. 클릭 지점은 원의 중심입니다. PC는 사진이 포함된 정적 SVG를 기본 커서로 사용합니다. 모바일에서도 같은 사진이 터치 위치를 따라가고, 손을 떼면 650ms 뒤 사라집니다. 터치 표시는 버튼이나 스크롤을 가로막지 않으며, 확대·축소하는 두 손가락 제스처에서는 숨깁니다. 움직임은 입력 이벤트에만 반응하고 상시 애니메이션 루프는 사용하지 않습니다.

6개 세부 페이지는 터미널 명령줄과 각 페이지 이름의 ASCII/ANSI 아트로 시작합니다. `█ ▓ ▒ ░ ▀ ▄ ▌ ▐`와 `: + #`를 섞은 다섯 스타일을 사용하며, 제목을 클릭하거나 터치하면 짧은 글리치 후 스타일이 바뀝니다. 뒤에는 포인터에 반응하는 문자 필드가 흐릅니다. 제목의 각 문자는 고정 격자의 SVG 도형으로 그려 폰트·리사이즈로 정렬이 어긋나는 것을 막습니다. 모션 줄이기에서는 배경과 전환을 정적으로 표시하고, 화면 밖·숨겨진 탭·닫힌 페이지에서는 애니메이션을 멈춥니다.

제목 아래 두 문장은 기존 부제와 설명을 영어로 번역한 것입니다. 연구·팀 활동은 번호가 있는 작업 목록, 수상·대회 성적·교육 이력은 간결한 경력형 행으로 구성했습니다.

콘텐츠는 사용자가 제공한 Notion 자료를 바탕으로 합니다. 원문에 없는 날짜·순위·초록·논문 링크는 만들지 않았습니다. 검색 색인은 검토 중인 초안에 맞춰 비활성화되어 있습니다.

## 수정 및 미리 보기

- `docs/content.js`: 프로필, 카드, 연구, 대회·교육 이력의 단일 데이터 원본
- `docs/theme.js`: 파스텔 핑크 기본색과 카드별 파스텔 팔레트
- `docs/app.js`: 화면 렌더링, 접근성, 연락처 복사, 모바일 탐색
- `docs/detail-pages.js`, `docs/detail-pages.css`: 6개 세부 페이지의 터미널 스타일과 콘텐츠 배치
- `docs/title-art.js`: 자체 ANSI 알파벳, 다섯 아트 스타일, 고정 격자 SVG 문자 렌더러
- `docs/title-art-effects.js`: 배경 문자 필드, 포인터 반응, 클릭 글리치와 정리 로직
- `docs/caption-scramble.js`: 원본 타이밍의 카드 번호·이름·화살표 글자 스크램블
- `docs/touch-cursor.js`: 모바일의 원형 사진 터치 표시와 카드별 색 동기화
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
npm run test:picker
npm run test:details
npm run test:art
npm run test:art-effects
npm run test:cursor
```

브라우저 검증은 6개 카드의 PC·모바일 열기/닫기, 소개, 이력서 인쇄, 연락처, Discord 복사, 가로 넘침, WebGL 오류 안내, 로딩 오류를 확인합니다. 결과 이미지는 무시되는 `test-results/`에 저장됩니다.

모바일 선택기 검증은 실제 부드러운 스크롤을 사용해 화살표·점 선택·연속 클릭·스와이프·화면 크기 변경 중 선택 카드가 되돌아가지 않는지 확인합니다. 버튼 이동 중에는 목적지를 유지하며, 직접 스와이프할 때만 스크롤 위치에 맞춰 선택을 바꿉니다.

기존 인물의 미디어·연락처·음악·애플리케이션 번들은 게시 폴더에서 제외했습니다. 원본 스냅샷은 Git 이력 및 로컬 `reference/retired-2026-09-21/`에서 복구할 수 있습니다. `scripts/download-reference.mjs`는 게시 파일을 덮어쓰지 않고 별도 `reference/download/`에 저장합니다. `scripts/personalize-scene.mjs`는 보관한 특정 버전의 원본 렌더러에서 개인화 변경을 재현하는 도구이며 일상적인 콘텐츠 수정에는 필요하지 않습니다.
