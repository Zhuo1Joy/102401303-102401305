/**
 * auth.js —— 启动页 & 登录页引导逻辑（仅 index.html 引入）
 *
 * 流程：
 * 1. 首次打开 index.html → 启动页（2.4s 或点击跳过）→ 登录页；
 * 2. 登录成功 / 选择游客模式后记录本机登录态，进入首页；
 * 3. 已有登录态时启动页显示“点击任意位置进入”，点击后直接进入首页。
 *
 * 说明：课程演示无真实后端，只做格式校验（学号 8-12 位、密码 ≥ 6 位）。
 */
(function (global) {
  'use strict';

  var AUTH_KEY = 'lost_found_auth_v1';
  var SPLASH_DURATION = 2400; // 启动页停留时长（ms）
  var ACCOUNT_RE = /^\d{8,12}$/; // 学号 8-12 位（11 位手机号同样满足）

  /* ---------- 登录态存取 ---------- */

  function readAuth() {
    try {
      var raw = localStorage.getItem(AUTH_KEY);
      return raw ? JSON.parse(raw) : null;
    } catch (e) {
      return null;
    }
  }

  function saveAuth(auth) {
    try {
      localStorage.setItem(AUTH_KEY, JSON.stringify(auth));
    } catch (e) {
      console.warn('保存登录态失败：', e);
    }
  }

  /* ---------- 视图切换 ---------- */

  /** 淡入显示某个引导视图 */
  function showView(el) {
    el.hidden = false;
    // 双 rAF：确保浏览器先渲染 hidden=false 再加类，过渡动画才会生效
    requestAnimationFrame(function () {
      requestAnimationFrame(function () {
        el.classList.add('show');
      });
    });
  }

  /** 淡出并隐藏视图 */
  function hideView(el) {
    el.classList.remove('show');
    setTimeout(function () { el.hidden = true; }, 380);
  }

  /** 离开引导页，进入主界面 */
  function enterApp(toastMsg) {
    document.body.classList.remove('gate-open');
    var splash = document.getElementById('splashView');
    var login = document.getElementById('loginView');
    if (splash && !splash.hidden) hideView(splash);
    if (login && !login.hidden) hideView(login);
    if (toastMsg && global.UI) UI.toast(toastMsg);
  }

  /* ---------- 初始化 ---------- */

  var FIRST_OPEN_KEY = 'lost_found_first_open_v1';

  function init() {
    var splash = document.getElementById('splashView');
    var login = document.getElementById('loginView');
    if (!splash || !login) return;

    // 不是首次打开：直接进入主界面
    if (localStorage.getItem(FIRST_OPEN_KEY)) {
      return;
    }

    // 标记已打开过
    try { localStorage.setItem(FIRST_OPEN_KEY, '1'); } catch (e) { /* 忽略 */ }

    document.body.classList.add('gate-open');
    showView(splash);

    // 副标题动态填充当前选中校区
    var subtitleEl = document.getElementById('splashSubtitle');
    if (subtitleEl && global.Storage) {
      subtitleEl.textContent = Storage.getCampus() + ' · 让每一件失物找到回家的路';
    }

    var hasAuth = !!readAuth();
    var skipEl = document.getElementById('splashSkip');
    if (skipEl) skipEl.textContent = hasAuth ? '点击任意位置进入' : '点击任意处跳过';

    var enteredNext = false;

    function gotoNext() {
      if (enteredNext) return;
      enteredNext = true;
      if (hasAuth) {
        enterApp();
      } else {
        hideView(splash);
        showView(login);
      }
    }

    var timer = setTimeout(gotoNext, SPLASH_DURATION);
    splash.addEventListener('click', function () {
      clearTimeout(timer);
      gotoNext();
    });

    /* ---------- 登录表单 ---------- */
    var accountInput = document.getElementById('accountInput');
    var passwordInput = document.getElementById('passwordInput');
    var accountGroup = document.getElementById('accountGroup');
    var passwordGroup = document.getElementById('passwordGroup');

    function setError(group, hasError) {
      group.classList.toggle('has-error', hasError);
    }

    // 输入时即时清除错误态
    accountInput.addEventListener('input', function () { setError(accountGroup, false); });
    passwordInput.addEventListener('input', function () { setError(passwordGroup, false); });

    // 密码显示 / 隐藏切换
    document.getElementById('pwdToggle').addEventListener('click', function () {
      var show = passwordInput.type === 'password';
      passwordInput.type = show ? 'text' : 'password';
      this.textContent = show ? '🙈' : '👁';
    });

    document.getElementById('forgotBtn').addEventListener('click', function () {
      UI.toast('演示环境：请联系辅导员或信息中心重置密码', 'error');
    });

    document.getElementById('loginForm').addEventListener('submit', function (e) {
      e.preventDefault();
      var account = accountInput.value.trim();
      var password = passwordInput.value;

      var ok = true;
      if (!ACCOUNT_RE.test(account)) { setError(accountGroup, true); ok = false; }
      if (!password || password.length < 6) { setError(passwordGroup, true); ok = false; }
      if (!ok) return;

      saveAuth({ mode: 'user', account: account, loginAt: Date.now() });
      enterApp('登录成功，欢迎回来～');
    });

    // 游客模式：不登录直接逛
    document.getElementById('guestBtn').addEventListener('click', function () {
      saveAuth({ mode: 'guest', loginAt: Date.now() });
      enterApp('已进入游客模式');
    });
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }

  // 暴露给设置页：清空数据时同步清除登录态，便于重新演示引导流程
  global.Auth = {
    logout: function () {
      try {
        localStorage.removeItem(AUTH_KEY);
        localStorage.removeItem(FIRST_OPEN_KEY);
      } catch (e) { /* 忽略 */ }
    }
  };
})(window);
