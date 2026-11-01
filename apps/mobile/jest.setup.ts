// 아이콘 글꼴 자산은 테스트 환경에 없으므로 빈 요소로 바꾼다.
jest.mock('@expo/vector-icons', () => ({ Ionicons: () => null }));
