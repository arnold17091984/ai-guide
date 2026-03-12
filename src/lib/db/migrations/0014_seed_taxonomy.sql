-- ============================================================
-- Migration 0014: Seed Taxonomy Data
-- ============================================================
-- Initial categories and tags derived from existing platform
-- route structure and skill-registry type definitions.

-- ------------------------------------------------------------
-- Categories
-- ------------------------------------------------------------

INSERT INTO categories (id, slug, label_ko, label_en, label_ja, icon, sort_order) VALUES
  (gen_random_uuid(), 'setup',         '시작하기',          'Getting Started',     '始め方',            'rocket',      1),
  (gen_random_uuid(), 'workflows',     '워크플로우',         'Workflows',           'ワークフロー',        'git-branch',  2),
  (gen_random_uuid(), 'skills',        '스킬',             'Skills',              'スキル',             'zap',         3),
  (gen_random_uuid(), 'case-studies',  '사례 연구',          'Case Studies',        'ケーススタディ',      'bar-chart-2', 4),
  (gen_random_uuid(), 'configs',       'CLAUDE.md 설정',   'CLAUDE.md Configs',   'CLAUDE.md設定',     'settings',    5),
  (gen_random_uuid(), 'security',      '보안',             'Security',            'セキュリティ',        'shield',      6),
  (gen_random_uuid(), 'costs',         '비용 관리',          'Cost Management',     'コスト管理',         'dollar-sign', 7),
  (gen_random_uuid(), 'teams',         '팀 협업',            'Team Collaboration',  'チーム協力',         'users',       8),
  (gen_random_uuid(), 'memory',        '메모리 관리',         'Memory Management',   'メモリ管理',         'database',    9),
  (gen_random_uuid(), 'agent-teams',   '에이전트 팀',         'Agent Teams',         'エージェントチーム',   'cpu',         10)
ON CONFLICT (slug) DO NOTHING;

-- ------------------------------------------------------------
-- Tags — Languages
-- ------------------------------------------------------------

INSERT INTO tags (id, slug, label_ko, label_en, label_ja, category) VALUES
  (gen_random_uuid(), 'typescript',  '타입스크립트',  'TypeScript',  'TypeScript',  'language'),
  (gen_random_uuid(), 'javascript',  '자바스크립트',  'JavaScript',  'JavaScript',  'language'),
  (gen_random_uuid(), 'python',      '파이썬',       'Python',      'Python',      'language'),
  (gen_random_uuid(), 'rust',        '러스트',       'Rust',        'Rust',        'language'),
  (gen_random_uuid(), 'go',          'Go',          'Go',          'Go',          'language'),
  (gen_random_uuid(), 'java',        '자바',         'Java',        'Java',        'language'),
  (gen_random_uuid(), 'kotlin',      '코틀린',       'Kotlin',      'Kotlin',      'language'),
  (gen_random_uuid(), 'swift',       '스위프트',      'Swift',       'Swift',       'language')
ON CONFLICT (slug) DO NOTHING;

-- ------------------------------------------------------------
-- Tags — Frameworks & Tools
-- ------------------------------------------------------------

INSERT INTO tags (id, slug, label_ko, label_en, label_ja, category) VALUES
  (gen_random_uuid(), 'react',         '리액트',        'React',         'React',         'framework'),
  (gen_random_uuid(), 'next-js',       'Next.js',       'Next.js',       'Next.js',       'framework'),
  (gen_random_uuid(), 'vue',           'Vue',           'Vue',           'Vue',           'framework'),
  (gen_random_uuid(), 'angular',       '앵귤러',         'Angular',       'Angular',       'framework'),
  (gen_random_uuid(), 'node-js',       'Node.js',       'Node.js',       'Node.js',       'framework'),
  (gen_random_uuid(), 'fastapi',       'FastAPI',       'FastAPI',       'FastAPI',       'framework'),
  (gen_random_uuid(), 'claude-code',   'Claude Code',   'Claude Code',   'Claude Code',   'tool'),
  (gen_random_uuid(), 'github-actions','GitHub Actions', 'GitHub Actions', 'GitHub Actions', 'tool'),
  (gen_random_uuid(), 'docker',        '도커',           'Docker',        'Docker',        'tool'),
  (gen_random_uuid(), 'kubernetes',    '쿠버네티스',      'Kubernetes',    'Kubernetes',    'tool'),
  (gen_random_uuid(), 'vscode',        'VS Code',       'VS Code',       'VS Code',       'tool'),
  (gen_random_uuid(), 'cursor',        'Cursor',        'Cursor',        'Cursor',        'tool')
ON CONFLICT (slug) DO NOTHING;

-- ------------------------------------------------------------
-- Tags — Concepts
-- ------------------------------------------------------------

INSERT INTO tags (id, slug, label_ko, label_en, label_ja, category) VALUES
  (gen_random_uuid(), 'testing',         '테스트',        'Testing',         'テスト',              'concept'),
  (gen_random_uuid(), 'refactoring',     '리팩토링',       'Refactoring',     'リファクタリング',     'concept'),
  (gen_random_uuid(), 'debugging',       '디버깅',         'Debugging',       'デバッグ',            'concept'),
  (gen_random_uuid(), 'code-review',     '코드 리뷰',       'Code Review',     'コードレビュー',       'concept'),
  (gen_random_uuid(), 'ci-cd',           'CI/CD',         'CI/CD',           'CI/CD',              'concept'),
  (gen_random_uuid(), 'documentation',   '문서화',         'Documentation',   'ドキュメント',         'concept'),
  (gen_random_uuid(), 'performance',     '성능 최적화',     'Performance',     'パフォーマンス',       'concept'),
  (gen_random_uuid(), 'security-audit',  '보안 감사',       'Security Audit',  'セキュリティ監査',     'concept'),
  (gen_random_uuid(), 'tdd',             'TDD',           'TDD',             'TDD',                'concept'),
  (gen_random_uuid(), 'clean-code',      '클린 코드',       'Clean Code',      'クリーンコード',       'concept'),
  (gen_random_uuid(), 'multi-agent',     '멀티 에이전트',    'Multi-Agent',     'マルチエージェント',   'concept'),
  (gen_random_uuid(), 'prompt-engineering', '프롬프트 엔지니어링', 'Prompt Engineering', 'プロンプトエンジニアリング', 'concept')
ON CONFLICT (slug) DO NOTHING;

-- ------------------------------------------------------------
-- Tags — Difficulty Levels
-- ------------------------------------------------------------

INSERT INTO tags (id, slug, label_ko, label_en, label_ja, category, color) VALUES
  (gen_random_uuid(), 'beginner',     '초보',  'Beginner',     '初心者',  'level', 'teal'),
  (gen_random_uuid(), 'intermediate', '중급',  'Intermediate', '中級',   'level', 'blue'),
  (gen_random_uuid(), 'advanced',     '고급',  'Advanced',     '上級',   'level', 'cyan')
ON CONFLICT (slug) DO NOTHING;
