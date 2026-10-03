/**
 * index.js —— 首页逻辑
 * 功能：列表渲染、关键词搜索（名称/描述/地点/类别）、
 * 类型筛选（全部/寻物/招领）、类别筛选、空状态。
 */
(function () {
  'use strict';

  // 首次运行写入示例数据
  Storage.initStorage();

  // 当前筛选状态
  var state = {
    keyword: '',
    type: 'all',       // all | lost | found
    category: 'all'    // all | 具体类别
  };

  var listEl = UI.$('#itemList');
  var emptyEl = UI.$('#emptyState');
  var searchInput = UI.$('#searchInput');
  var categoryFilter = UI.$('#categoryFilter');

  /** 动态生成类别下拉项（类别统一在 storage.js 维护） */
  function initCategoryOptions() {
    Storage.CATEGORIES.forEach(function (name) {
      var opt = document.createElement('option');
      opt.value = name;
      opt.textContent = name;
      categoryFilter.appendChild(opt);
    });
  }

  /** 按当前 state 过滤并渲染列表 */
  function render() {
    var keyword = state.keyword.trim().toLowerCase();
    var filtered = Storage.getItems().filter(function (item) {
      // 类型筛选
      if (state.type !== 'all' && item.type !== state.type) return false;

      // 类别筛选
      if (state.category !== 'all' && item.category !== state.category) return false;

      // 关键词：匹配物品名称、描述、地点、类别
      if (keyword) {
        var haystack = [item.title, item.description, item.location, item.category]
          .join(' ').toLowerCase();
        if (haystack.indexOf(keyword) === -1) return false;
      }
      return true;
    });

    var emptyText = keyword
      ? '没有找到与“' + state.keyword.trim() + '”相关的信息，换个关键词试试～'
      : '当前筛选条件下暂无信息';
    UI.renderCardList(listEl, filtered, emptyEl, emptyText);
  }

  /* ---------- 事件绑定 ---------- */

  // 搜索（input 事件实时触发）
  searchInput.addEventListener('input', function () {
    state.keyword = searchInput.value;
    render();
  });

  // 类型 Tab
  UI.$all('.type-tab').forEach(function (tab) {
    tab.addEventListener('click', function () {
      UI.$all('.type-tab').forEach(function (t) { t.classList.remove('active'); });
      tab.classList.add('active');
      state.type = tab.getAttribute('data-type');
      render();
    });
  });

  // 类别筛选
  categoryFilter.addEventListener('change', function () {
    state.category = categoryFilter.value;
    render();
  });

  initCategoryOptions();
  render();
})();
