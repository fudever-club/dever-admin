const { test } = require('node:test');
const assert = require('node:assert/strict');
const loadSource = require('./load-source.cjs');

function analyticsHarness() {
  const states = [];
  const callbacks = [];
  const react = {
    useState(initial) {
      const index = states.length;
      states.push(initial);
      return [initial, (value) => { states[index] = value; }];
    },
    useRef: (value) => ({ current: value }),
    useCallback: (fn) => { callbacks.push(fn); return fn; },
    useEffect() {},
  };
  const { default: Component } = loadSource('src/components/modules/Dashboard/ExecutiveAnalytics.tsx', {
    react,
    antd: { Skeleton: 'div', Alert: 'div', Button: 'button', Card: 'div', Col: 'div', Flex: 'div',
      Row: 'div', Statistic: 'div', Typography: { Title: 'h3' } },
    '@ant-design/icons': { ReloadOutlined: 'span' },
    '@/utils/webStorageClient': { getToken: () => 'synthetic-test-token' },
    '@/app/i18n/client': { useTranslation: () => ({ t: (key) => key }) },
    'next/navigation': { useParams: () => ({ locale: 'en' }) },
  });
  Component();
  return { states, refresh: callbacks[0] };
}

test('analytics uses the user total and preserves valid zero event/submission counts', async (t) => {
  const responses = [
    { total: 148, data: { users: [{ _id: 'one' }] } },
    { data: [{ status: 'Đã kết thúc' }] },
    { data: [{ status: 'draft' }, { status: 'pending_review' }] },
    { data: [] },
  ];
  t.mock.method(global, 'fetch', async () => ({ ok: true, json: async () => responses.shift() }));
  const { states, refresh } = analyticsHarness();
  await refresh();
  assert.deepEqual(states[0], { totalUsers: 148, activeEvents: 0, pendingBlogs: 1, leetcodeSubmissions: 0 });
  assert.equal(states[1], false);
});

test('a slow analytics refresh cannot overwrite newer totals', async (t) => {
  const pending = [];
  t.mock.method(global, 'fetch', () => new Promise((resolve) => pending.push(resolve)));
  const { states, refresh } = analyticsHarness();
  const first = refresh();
  const second = refresh();
  const complete = (offset, total) => {
    const bodies = [{ total }, { data: [] }, { data: [] }, { data: [] }];
    bodies.forEach((body, index) => pending[offset + index]({ ok: true, json: async () => body }));
  };
  complete(4, 42);
  await second;
  complete(0, 12);
  await first;
  assert.equal(states[0].totalUsers, 42);
});

test('partial analytics failures retain successful metrics and mark only failures unavailable', async (t) => {
  const bodies = [{ total: 10 }, { data: [{ status: 'Đang diễn ra' }] }, null,
    { data: [{ acSubmissionList: [{ id: 1 }, { id: 2 }] }] }];
  t.mock.method(global, 'fetch', async () => {
    const body = bodies.shift();
    return body ? { ok: true, json: async () => body } : { ok: false, status: 500 };
  });
  const { states, refresh } = analyticsHarness();
  await refresh();
  assert.deepEqual(states[0], { totalUsers: 10, activeEvents: 1, pendingBlogs: null, leetcodeSubmissions: 2 });
  assert.equal(states[2], true);
});

test('session cleanup clears identity, stored session, and cached API data', async () => {
  const removed = [];
  const mocks = { '@/utils/webStorageClient': { remove: (key) => removed.push(key) } };
  const cache = new Map();
  const load = (file) => loadSource(file, mocks, cache);
  const { baseApi } = load('src/store/queries/base.ts');
  const { default: auth, setAuthenticatedUser } = load('src/store/slices/auth/index.ts');
  const { clearSession } = load('src/store/session.ts');
  const { configureStore } = require('@reduxjs/toolkit');
  const api = baseApi.injectEndpoints({ endpoints: (build) => ({ fixture: build.query({ query: () => '/never-requested' }) }) });
  const store = configureStore({ reducer: { auth, [api.reducerPath]: api.reducer },
    middleware: (getDefault) => getDefault().concat(api.middleware) });
  store.dispatch(setAuthenticatedUser({ isAdmin: true, _id: 'synthetic' }));
  await store.dispatch(api.util.upsertQueryData('fixture', undefined, { private: 'synthetic' }));
  assert.ok(Object.keys(store.getState()[api.reducerPath].queries).length);
  store.dispatch(clearSession());
  assert.equal(store.getState().auth.userInfo, null);
  assert.deepEqual(store.getState()[api.reducerPath].queries, {});
  assert.deepEqual(removed, ['_access_token', '_user_info']);
});

test('failed analytics requests expose unavailable values and a retryable error', async (t) => {
  t.mock.method(global, 'fetch', async () => ({ ok: false, status: 503 }));
  const { states, refresh } = analyticsHarness();
  await refresh();
  assert.deepEqual(states[0], { totalUsers: null, activeEvents: null, pendingBlogs: null, leetcodeSubmissions: null });
  assert.ok(states[2]);
  assert.equal(states[1], false);
});

test('sign-in fulfillment cannot persist a non-admin session before authorization', () => {
  const writes = [];
  const { default: reducer } = loadSource('src/store/slices/auth/index.ts', {
    '@/utils/webStorageClient': { setToken: (value) => writes.push(value) },
    '@/store/queries/auth': { authAPI: { endpoints: { signIn: { matchFulfilled: (action) => action.type === 'signIn/fulfilled' } } } },
  });
  const state = reducer(undefined, {
    type: 'signIn/fulfilled', payload: { data: { token: 'synthetic-test-token', user: { isAdmin: false } } },
  });
  assert.deepEqual(writes, []);
  assert.equal(state.userInfo, null);
});

test('locale prefixes must match a complete path segment', () => {
  const { middleware } = loadSource('src/middleware.ts');
  const { NextRequest } = require('next/server');
  const response = middleware(new NextRequest('http://localhost:3003/english?tab=opensource', {
    headers: { 'accept-language': 'en' },
  }));
  assert.equal(response.headers.get('location'), 'http://localhost:3003/en/english?tab=opensource');
});

test('only locales with shipped dictionaries are advertised', () => {
  const fs = require('node:fs');
  const path = require('node:path');
  const { languages } = loadSource('src/app/i18n/settings.ts');
  for (const locale of languages) {
    assert.ok(fs.existsSync(path.join(__dirname, '../src/app/i18n/locales', locale)), `Missing ${locale} dictionaries`);
  }
});

test('language switches preserve nested paths, filters, and anchors', () => {
  const { getLocalizedPath } = loadSource('src/utils/getPathname.ts');
  assert.equal(getLocalizedPath('/vi/community-content', 'en', '?tab=opensource&filter=pending', '#queue'),
    '/en/community-content?tab=opensource&filter=pending#queue');
  assert.equal(getLocalizedPath('/en/project-management/example', 'vi'), '/vi/project-management/example');
});

test('rewrites use the configured backend and trim its trailing slash', async () => {
  const { execFileSync } = require('node:child_process');
  const output = execFileSync(process.execPath, ['--input-type=module', '-e',
    "import config from './next.config.mjs'; console.log(JSON.stringify(await config.rewrites()));"], {
    cwd: require('node:path').resolve(__dirname, '..'),
    env: { ...process.env, NEXT_PUBLIC_API_SERVER: 'http://127.0.0.1:5999/' }, encoding: 'utf8',
  });
  assert.deepEqual(JSON.parse(output), [
    { source: '/api/v1/:path*', destination: 'http://127.0.0.1:5999/api/v1/:path*' },
    { source: '/static/:path*', destination: 'http://127.0.0.1:5999/static/:path*' },
  ]);
});

test('rewrites retain the production fallback when no backend is configured', async () => {
  const { execFileSync } = require('node:child_process');
  const env = { ...process.env };
  delete env.NEXT_PUBLIC_API_SERVER;
  const output = execFileSync(process.execPath, ['--input-type=module', '-e',
    "import config from './next.config.mjs'; console.log(JSON.stringify(await config.rewrites()));"], {
    cwd: require('node:path').resolve(__dirname, '..'), env, encoding: 'utf8',
  });
  assert.equal(JSON.parse(output)[0].destination,
    'https://dever-backend-production.up.railway.app/api/v1/:path*');
});
