const { test } = require('node:test');
const assert = require('node:assert/strict');
const loadSource = require('./load-source.cjs');

function harness(signIn) {
  const writes = [];
  const errors = [];
  const cleanups = [];
  const Form = Object.assign(() => null, { Item: 'div', useForm: () => [{}] });
  const mocks = {
    react: { useState: (initial) => [initial, () => {}], useRef: (current) => ({ current }),
      useEffect: (effect) => { cleanups.push(effect()); } },
    'react/jsx-runtime': { jsx: (type, props) => ({ type, props }), jsxs: (type, props) => ({ type, props }) },
    antd: { Checkbox: 'input', Flex: 'div', Form, Input: { Password: 'input' },
      message: { error: (msg) => errors.push(msg), success() {} } },
    'next/image': 'img',
    'next-nprogress-bar': { useRouter: () => ({ push() {} }) },
    'next/navigation': { useParams: () => ({ locale: 'en' }) },
    'next-intl': { useLocale: () => 'en' },
    '@/components/core/common/Button': 'button',
    '@/components/core/layouts/MainLayout/SelectLanguage': 'div',
    '@/components/core/common/Typography': { Title: 'h2', Text: 'p' },
    '@/components/core/common/LoadingScreen': 'div',
    '@/app/i18n/client': { useTranslation: () => ({ t: (key) => key }) },
    '@/store/queries/auth': { useSignInMutation: () => [signIn, { isLoading: false }] },
    '@/utils/webStorageClient': { setToken: (value) => writes.push(value), set() {} },
    '@/hooks/redux-toolkit': { useAppDispatch: () => () => {} },
    '@/store/session': { clearSession: () => ({ type: 'clear' }) },
    './styles': { Wrapper: 'div', AccessNotice: 'div', LoginOptions: 'div', RecoveryHint: 'div', AccountHint: 'div' },
  };
  const tree = loadSource('src/components/modules/SignIn/index.tsx', mocks).default();
  const findForm = (node) => {
    if (!node || typeof node !== 'object') return;
    if (node.type === Form) return node;
    return [node.props?.children].flat().map(findForm).find(Boolean);
  };
  return { submit: findForm(tree).props.onFinish, writes, errors, unmount: () => cleanups.forEach((cleanup) => cleanup?.()) };
}

test('rapid sign-in submits issue only one request', async () => {
  let complete;
  let calls = 0;
  const pending = new Promise((resolve) => { complete = resolve; });
  const { submit, writes } = harness(() => { calls++; return { unwrap: () => pending }; });
  const first = submit({});
  await submit({});
  assert.equal(calls, 1);
  complete({ data: { user: { isAdmin: false }, token: 'synthetic' } });
  await first;
  assert.deepEqual(writes, []);
});

test('an admin response without a token is rejected', async () => {
  const { submit, errors, writes } = harness(() => ({ unwrap: async () => ({ data: { user: { isAdmin: true } } }) }));
  await submit({});
  assert.deepEqual(errors, ['signInFailed']);
  assert.deepEqual(writes, []);
});

test('a completed sign-in cannot persist a session after navigation unmounts the form', async () => {
  let complete;
  const pending = new Promise((resolve) => { complete = resolve; });
  const { submit, writes, unmount } = harness(() => ({ unwrap: () => pending }));
  const first = submit({});
  unmount();
  complete({ data: { user: { isAdmin: true }, token: 'synthetic' } });
  await first;
  assert.deepEqual(writes, []);
});

test('successful sign-in stays locked until navigation', async (t) => {
  t.mock.method(global, 'setTimeout', () => 1);
  let calls = 0;
  const { submit, writes } = harness(() => {
    calls++;
    return { unwrap: async () => ({ data: { user: { isAdmin: true }, token: 'synthetic' } }) };
  });
  await submit({});
  await submit({});
  assert.deepEqual(writes, ['synthetic']);
  assert.equal(calls, 1);
});
