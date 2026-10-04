/**
 * auth.js —— 启动页 & 登录页引导逻辑（仅 index.html 引入）
 *
 * 【PR 拆分重建说明】
 * 本文件是“仅 UI 修改版（pr1-ui）”的重建版本：UI 阶段的 auth.js 从未提交 Git、
 * 也无快照留存，以下实现依据对话记录中可确认的行为重建——
 *   1. 每次打开 index.html 都展示：启动页（2.4s 或点击跳过）→ 登录页；
 *   2. “已有登录记录时显示‘点击任意位置进入’直接进首页”是后续功能阶段才提出的
 *      要求，故本版本启动时不读取登录态、不做首次/会话记忆；
 *   3. 登录表单与游客按钮的处理为登录页 HTML 结构所必需，予以保留。
 * 除上述已标注点外，视图切换、表单校验逻辑与后续版本一致。
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

  // 保留引用以避免未使用告警；登录态直进逻辑在后续功能阶段才接入
  void readAuth;

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

  function init() {
    var splash = document.getElementById('splashView');
    var login = document.getElementById('loginView');
    if (!splash || !login) return;

    document.body.classList.add('gate-open');
    showView(splash);

    var skipEl = document.getElementById('splashSkip');
    if (skipEl) skipEl.textContent = '点击任意处跳过';

    var enteredNext = false;

    function gotoNext() {
      if (enteredNext) return;
      enteredNext = true;
      hideView(splash);
      showView(login);
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

  // 暴露给设置页：清空数据时同步清除登录态
  global.Auth = {
    logout: function () {
      try {
        localStorage.removeItem(AUTH_KEY);
      } catch (e) { /* 忽略 */ }
    }
  };
})(window);
