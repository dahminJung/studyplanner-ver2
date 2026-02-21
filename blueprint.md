# Comprehensive Study Planner - Project Blueprint

## 1. Overview
시간표, 투두 리스트, 학습 타이머, 그리고 통계 분석 기능을 하나의 대시보드에 통합한 종합 스터디 플래너 애플리케이션입니다. 프레임워크 없는 순수 바닐라 웹 기술을 사용하여 높은 성능과 유지보수성을 확보합니다.

## 2. Core Features
- **과목 관리 (Subject Management)**: 과목 생성, 고유 색상(Color picker) 지정.
- **시간표 (Time Table)**: 일간 24시간 타임라인. 특정 시간대에 과목 블록을 배치.
- **투두 리스트 (To-Do List)**: 해야 할 일 기록 및 완료 체크. 완료율 통계 연동.
- **스마트 타이머 (Smart Timer)**:
    - 스톱워치 기능 (시작/일시정지/초기화).
    - 브라우저 탭 이탈 시(visibilitychange) 자동 일시 정지.
    - 정지 시 측정된 시간을 특정 과목의 학습 기록으로 저장.
- **통계 대시보드 (Statistics)**:
    - 과목별 누적 학습 시간을 파이 차트(CSS Conic Gradient)와 막대 그래프로 시각화.
    - 투두 리스트 달성률 연동.
- **데이터 퍼시스턴스**: 모든 데이터를 `localStorage`에 저장하여 새로고침 시 유지.

## 3. Architecture & Tech Stack
- **HTML**: 시멘틱 태그 및 Web Components (`<study-timer>`, `<todo-list>`, `<time-table>`, `<study-stats>`) 기반 모듈화.
- **CSS**: 
    - CSS Grid & Flexbox를 활용한 대시보드 레이아웃.
    - CSS Variables를 활용한 테마 및 과목별 동적 색상 매핑.
- **JavaScript**:
    - ES6+ 클래스 및 모듈 패턴.
    - 옵저버 패턴 또는 커스텀 이벤트를 활용한 컴포넌트 간 상태 공유 (예: 타이머 종료 -> 통계 업데이트).
