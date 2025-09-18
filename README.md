# Next.js CI/CD & Ollama MCP 실습 프로젝트

이 프로젝트는 GitHub Actions와 AWS를 활용한 CI/CD 파이프라인과 Ollama AI 모델 통합을 실습하기 위한 Next.js 애플리케이션입니다.

## 🚀 주요 기능

### CI/CD 파이프라인

- **GitHub Actions**를 통한 자동화된 빌드 및 테스트
- **AWS S3 + CloudFront**를 활용한 정적 사이트 배포
- 스테이징/프로덕션 환경 분리
- 보안 스캔 및 코드 품질 검사
- 자동화된 배포 알림

### Ollama AI 통합

- **Ollama** 로컬 AI 모델 서버 연동
- **MCP (Model Context Protocol)** 클라이언트 구현
- 실시간 AI 채팅 인터페이스
- 모델 관리 및 다운로드 기능
- 스트리밍 응답 지원

## 🛠️ 기술 스택

- **Frontend**: Next.js 15, React 19, TypeScript, Tailwind CSS
- **Testing**: Jest, React Testing Library
- **CI/CD**: GitHub Actions, AWS S3, CloudFront
- **AI**: Ollama, MCP (Model Context Protocol)
- **Deployment**: AWS S3, CloudFront

## 📦 설치 및 실행

### 1. 프로젝트 클론 및 의존성 설치

```bash
git clone <repository-url>
cd nextjs-cicd-mcp-practice
npm install
```

### 2. Ollama 설치 및 실행

```bash
# macOS (Homebrew)
brew install ollama

# Ollama 서버 실행
ollama serve

# 기본 모델 다운로드 (별도 터미널)
ollama pull llama3
```

### 3. 환경 변수 설정

```bash
cp env.example .env.local
```

`.env.local` 파일을 편집하여 필요한 환경 변수를 설정하세요.

### 4. 개발 서버 실행

```bash
npm run dev
```

브라우저에서 [http://localhost:3000](http://localhost:3000)을 열어 애플리케이션을 확인하세요.

## 🧪 테스트

```bash
# 모든 테스트 실행
npm test

# 테스트 커버리지 확인
npm run test:coverage

# 테스트 감시 모드
npm run test:watch
```

## 🚀 배포

### AWS 설정

1. **S3 버킷 생성**

   ```bash
   aws s3 mb s3://nextjs-cicd-mcp-practice-bucket --region ap-northeast-2
   aws s3 mb s3://nextjs-cicd-mcp-practice-staging-bucket --region ap-northeast-2
   ```

2. **CloudFront 배포 생성**

   - Origin: S3 버킷
   - Behaviors:
     - Default (\*): TTL 0 (Next.js API routes)
     - \_next/static/\*: TTL 31536000 (1년)
     - static/\*: TTL 86400 (1일)

3. **IAM 정책 설정**
   - GitHub Actions용 IAM 사용자 생성
   - S3 및 CloudFront 권한 부여

### GitHub Secrets 설정

Repository Settings > Secrets and variables > Actions에서 다음 시크릿을 설정하세요:

- `AWS_ACCESS_KEY_ID`: IAM 사용자의 Access Key ID
- `AWS_SECRET_ACCESS_KEY`: IAM 사용자의 Secret Access Key
- `SLACK_WEBHOOK_URL`: Slack 알림용 웹훅 URL (선택사항)

### 배포 트리거

- **스테이징 배포**: `develop` 브랜치에 푸시
- **프로덕션 배포**: `main` 브랜치에 푸시

## 📁 프로젝트 구조

```
nextjs-cicd-mcp-practice/
├── .github/
│   └── workflows/
│       ├── ci-cd.yml              # 메인 CI/CD 파이프라인
│       └── deploy-staging.yml     # 스테이징 배포
├── src/
│   ├── app/
│   │   ├── api/mcp/               # MCP API 라우트
│   │   └── page.tsx               # 메인 페이지
│   ├── components/
│   │   ├── cicd/                  # CI/CD 관련 컴포넌트
│   │   └── mcp/                   # MCP 관련 컴포넌트
│   ├── lib/
│   │   └── mcp/                   # MCP 클라이언트 및 훅
│   └── __tests__/                 # 테스트 파일
├── aws-deployment-config.yml      # AWS 배포 설정 가이드
├── jest.config.js                 # Jest 설정
└── package.json
```

## 🤖 Ollama AI 기능

현재 구현된 AI 기능들:

1. **ollama_generate**: Ollama를 사용한 텍스트 생성
2. **ollama_chat**: 실시간 AI 채팅
3. **ollama_models**: 사용 가능한 모델 목록 조회
4. **ollama_health**: Ollama 서버 상태 확인
5. **모델 관리**: 웹 인터페이스를 통한 모델 다운로드 및 관리

## 📊 CI/CD 파이프라인

### 1. 테스트 단계

- 코드 린팅 (ESLint)
- 단위 테스트 실행
- 커버리지 리포트 생성

### 2. 빌드 단계

- 애플리케이션 빌드
- 빌드 아티팩트 업로드

### 3. 배포 단계

- S3에 정적 파일 업로드
- CloudFront 캐시 무효화
- 배포 상태 알림

### 4. 보안 스캔

- Trivy를 통한 취약점 스캔
- GitHub Security 탭에 결과 업로드

## 🤝 기여하기

1. Fork the Project
2. Create your Feature Branch (`git checkout -b feature/AmazingFeature`)
3. Commit your Changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the Branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

## 📝 라이선스

이 프로젝트는 MIT 라이선스 하에 배포됩니다. 자세한 내용은 `LICENSE` 파일을 참조하세요.

## 📞 지원

문제가 발생하거나 질문이 있으시면 이슈를 생성해 주세요.

---

**Happy Coding! 🎉**
