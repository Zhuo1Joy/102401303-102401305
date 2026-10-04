/**
 * common.js —— 公共工具层
 * 各页面共用：DOM 简写、HTML 转义、时间格式化、文案映射、
 * Toast 轻提示、卡片 HTML 渲染、复制文本（含 file:// 降级方案）。
 */
(function (global) {
  'use strict';

  /* ---------- DOM 工具 ---------- */

  function $(selector, ctx) {
    return (ctx || document).querySelector(selector);
  }

  function $all(selector, ctx) {
    return Array.prototype.slice.call((ctx || document).querySelectorAll(selector));
  }

  /** 转义用户输入，防止拼接到 innerHTML 时破坏结构（防 XSS） */
  function escapeHtml(str) {
    return String(str == null ? '' : str)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#39;');
  }

  /* ---------- 文案与时间 ---------- */

  // 类型文案
  var TYPE_TEXT = { lost: '寻物', found: '招领' };

  /** 状态文案：done 时寻物显示“已找到”，招领显示“已归还” */
  function statusText(item) {
    if (item.status === 'done') {
      return item.type === 'lost' ? '已找到' : '已归还';
    }
    return item.type === 'lost' ? '寻物中' : '招领中';
  }

  function pad2(n) {
    return n < 10 ? '0' + n : '' + n;
  }

  /**
   * 格式化时间为 YYYY-MM-DD HH:mm
   * 兼容 ISO 字符串、datetime-local 的 "YYYY-MM-DDTHH:mm" 以及时间戳。
   */
  function formatDateTime(value) {
    if (!value) return '未填写';
    var d = value instanceof Date ? value : new Date(value);
    if (isNaN(d.getTime())) return String(value);
    return d.getFullYear() + '-' + pad2(d.getMonth() + 1) + '-' + pad2(d.getDate()) +
      ' ' + pad2(d.getHours()) + ':' + pad2(d.getMinutes());
  }

  /** 获取 URL 查询参数，如 detail.html?id=xxx */
  function getQuery(name) {
    var pairs = new URLSearchParams(global.location.search);
    return pairs.get(name);
  }

  /* ---------- Toast 轻提示 ---------- */

  var toastTimer = null;
  function toast(message, type) {
    var el = $('#toast');
    if (!el) {
      el = document.createElement('div');
      el.id = 'toast';
      el.className = 'toast';
      document.body.appendChild(el);
    }
    el.textContent = message;
    el.className = 'toast show' + (type === 'error' ? ' toast-error' : '');
    clearTimeout(toastTimer);
    toastTimer = setTimeout(function () {
      el.className = 'toast' + (type === 'error' ? ' toast-error' : '');
    }, 2000);
  }

  /* ---------- 列表卡片 ---------- */

  /** 渲染单条信息卡片（首页与“我的发布”共用） */
  function renderCard(item) {
    var typeClass = item.type === 'lost' ? 'badge-lost' : 'badge-found';
    var statusClass = item.status === 'done' ? 'status-done' : 'status-active';
    var imgs = Array.isArray(item.images) ? item.images : [];
    var imgHtml = imgs.length
      ? '<div class="card-imgs">' + imgs.map(function (src) {
          return '<img src="' + src + '" alt="物品图片" loading="lazy">';
        }).join('') + '</div>'
      : '';
    return '' +
      '<a class="card" href="detail.html?id=' + encodeURIComponent(item.id) + '">' +
        '<div class="card-top">' +
          '<span class="badge ' + typeClass + '">' + TYPE_TEXT[item.type] + '</span>' +
          '<span class="status ' + statusClass + '">' + statusText(item) + '</span>' +
        '</div>' +
        '<h3 class="card-title">' + escapeHtml(item.title) + '</h3>' +
        '<p class="card-desc">' + escapeHtml(item.description) + '</p>' +
        imgHtml +
        '<div class="card-meta">' +
          '<span class="meta-item">📍 ' + escapeHtml(item.location) + '</span>' +
          '<span class="meta-item">🕐 ' + escapeHtml(formatDateTime(item.time)) + '</span>' +
        '</div>' +
        '<div class="card-foot">' +
          '<span class="card-category">🏷 ' + escapeHtml(item.category) + '</span>' +
          '<span class="card-publisher">👤 ' + escapeHtml(item.publisher) + '</span>' +
        '</div>' +
      '</a>';
  }

  /** 渲染卡片列表到容器，并切换空状态 */
  function renderCardList(container, items, emptyEl, emptyText) {
    if (items.length === 0) {
      container.innerHTML = '';
      if (emptyEl) {
        emptyEl.hidden = false;
        var txt = $('.empty-text', emptyEl);
        if (txt && emptyText) txt.textContent = emptyText;
      }
      return;
    }
    if (emptyEl) emptyEl.hidden = true;
    container.innerHTML = items.map(renderCard).join('');
  }

  /* ---------- 复制文本 ---------- */

  /**
   * 复制到剪贴板。
   * 优先使用 Clipboard API；在 file:// 等不可用场景下用 textarea + execCommand 降级，
   * 保证双击 index.html 直接打开时“复制联系方式”仍然可用。
   */
  function copyText(text, onOk, onFail) {
    function fallbackCopy() {
      var ta = document.createElement('textarea');
      ta.value = text;
      ta.setAttribute('readonly', '');
      ta.style.position = 'fixed';
      ta.style.top = '-9999px';
      ta.style.opacity = '0';
      document.body.appendChild(ta);
      ta.select();
      ta.setSelectionRange(0, ta.value.length);
      var ok = false;
      try {
        ok = document.execCommand('copy');
      } catch (e) {
        ok = false;
      }
      document.body.removeChild(ta);
      ok ? onOk && onOk() : onFail && onFail();
    }

    if (navigator.clipboard && window.isSecureContext) {
      navigator.clipboard.writeText(text).then(
        function () { onOk && onOk(); },
        fallbackCopy
      );
    } else {
      fallbackCopy();
    }
  }

  /** 高亮底部导航当前页（根据 body 的 data-page 属性） */
  function highlightNav() {
    var page = document.body.getAttribute('data-page');
    if (!page) return;
    $all('.nav-item').forEach(function (item) {
      if (item.getAttribute('data-nav') === page) item.classList.add('active');
    });
  }

  document.addEventListener('DOMContentLoaded', highlightNav);

  // 暴露到全局
  global.UI = {
    $: $,
    $all: $all,
    escapeHtml: escapeHtml,
    formatDateTime: formatDateTime,
    getQuery: getQuery,
    toast: toast,
    renderCard: renderCard,
    renderCardList: renderCardList,
    copyText: copyText,
    TYPE_TEXT: TYPE_TEXT,
    statusText: statusText
  };
})(window);
