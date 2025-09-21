import MCPToolPanel from "@/components/mcp/MCPToolPanel";
import DeploymentStatus from "@/components/cicd/DeploymentStatus";
import OllamaChat from "@/components/mcp/OllamaChat";
import OllamaModelManager from "@/components/mcp/OllamaModelManager";

export default function Home() {
  return (
    <main className="min-h-screen bg-gray-50 py-8">
      <div className="container mx-auto px-4">
        {/* 제목 섹션 */}
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-gray-800 mb-4">
            Next.js CI/CD & MCP 실습 프로젝트
          </h1>
          <p className="text-lg text-gray-600">
            GitHub Actions와 AWS를 활용한 CI/CD 파이프라인과 MCP 통합을
            실습해보세요
          </p>
        </div>

        {/* 메인 그리드 */}
        <div className="grid grid-cols-1 xl:grid-cols-2 gap-8">
          <MCPToolPanel /> {/* MCP 도구 패널 */}
          <DeploymentStatus /> {/* 배포 상태 */}
        </div>

        {/* Ollama 섹션 */}
        <div className="mt-8">
          <h2 className="text-2xl font-bold text-gray-800 mb-6 text-center">
            Ollama AI 모델 통합
          </h2>
          <div className="grid grid-cols-1 xl:grid-cols-2 gap-8">
            <div className="bg-white rounded-lg shadow-lg">
              <OllamaChat className="h-96" /> {/* AI 채팅 */}
            </div>
            <div className="bg-white rounded-lg shadow-lg p-6">
              <OllamaModelManager /> {/* 모델 관리 */}
            </div>
          </div>
        </div>

        <div className="mt-8 grid grid-cols-1 xl:grid-cols-2 gap-8">
          <div className="bg-white rounded-lg shadow-lg p-6">
            <h2 className="text-2xl font-bold text-gray-800 mb-4">
              프로젝트 개요
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <h3 className="text-lg font-semibold text-gray-700 mb-2">
                  CI/CD 기능
                </h3>
                <ul className="space-y-1 text-gray-600">
                  <li>• GitHub Actions를 통한 자동화된 빌드 및 테스트</li>
                  <li>• AWS S3 + CloudFront를 활용한 정적 사이트 배포</li>
                  <li>• 스테이징/프로덕션 환경 분리</li>
                  <li>• 보안 스캔 및 코드 품질 검사</li>
                  <li>• 자동화된 배포 알림</li>
                </ul>
              </div>
              <div>
                <h3 className="text-lg font-semibold text-gray-700 mb-2">
                  MCP 통합
                </h3>
                <ul className="space-y-1 text-gray-600">
                  <li>• Model Context Protocol 클라이언트 구현</li>
                  <li>• AI 모델과의 실시간 통신</li>
                  <li>• 도구 실행 및 컨텍스트 관리</li>
                  <li>• React 훅을 통한 상태 관리</li>
                  <li>• 파일 검색, 코드 분석, 배포 상태 확인</li>
                </ul>
              </div>
            </div>
          </div>
        </div>

        <div className="mt-8 bg-blue-50 rounded-lg p-6">
          <h2 className="text-xl font-bold text-blue-800 mb-3">시작하기</h2>
          <div className="space-y-2 text-blue-700">
            <p>
              1. GitHub 저장소에 코드를 푸시하면 자동으로 CI/CD 파이프라인이
              실행됩니다
            </p>
            <p>2. MCP 도구 패널에서 다양한 AI 도구를 테스트해보세요</p>
            <p>3. 배포 상태 패널에서 현재 배포 상황을 확인하세요</p>
            <p>4. AWS 설정을 완료한 후 실제 배포를 테스트해보세요</p>
          </div>
        </div>
      </div>
    </main>
  );
}
