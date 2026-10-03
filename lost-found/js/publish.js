/**
 * publish.js —— 发布页逻辑
 * 功能：寻物/招领类型切换、类别选项填充、默认时间、
 * 表单校验（逐项提示）、保存到 localStorage 并跳转详情页。
 */
(function () {
  'use strict';

  Storage.initStorage();

  var form = UI.$('#publishForm');
  var typeInput = UI.$('#type');
  var typeOptions = UI.$all('.type-option');
  var categorySelect = UI.$('#category');
  var timeInput = UI.$('#time');

  /* ---------- 初始化 ---------- */

  // 填充类别
  Storage.CATEGORIES.forEach(function (name) {
    var opt = document.createElement('option');
    opt.value = name;
    opt.textContent = name;
    categorySelect.appendChild(opt);
  });

  // 类型切换（我丢了 / 我捡到）
  typeOptions.forEach(function (btn) {
    btn.addEventListener('click', function () {
      var type = btn.getAttribute('data-type');
      typeInput.value = type;
      typeOptions.forEach(function (b) {
        b.classList.remove('selected-lost', 'selected-found');
        b.setAttribute('aria-checked', 'false');
      });
      btn.classList.add(type === 'lost' ? 'selected-lost' : 'selected-found');
      btn.setAttribute('aria-checked', 'true');
    });
  });

  // 默认时间 = 当前时间（转成 datetime-local 需要的本地格式）
  function toLocalInputValue(d) {
    return d.getFullYear() + '-' + String(d.getMonth() + 1).padStart(2, '0') + '-' +
      String(d.getDate()).padStart(2, '0') + 'T' +
      String(d.getHours()).padStart(2, '0') + ':' +
      String(d.getMinutes()).padStart(2, '0');
  }
  timeInput.value = toLocalInputValue(new Date());

  // 输入时清除该字段的错误态
  UI.$all('.form-control', form).forEach(function (control) {
    control.addEventListener('input', function () {
      var group = control.closest('.form-group');
      if (group) group.classList.remove('has-error');
    });
    control.addEventListener('change', function () {
      var group = control.closest('.form-group');
      if (group) group.classList.remove('has-error');
    });
  });

  /* ---------- 校验 ---------- */

  /** 标记某个字段出错并聚焦第一个出错字段 */
  function setError(fieldName, focus) {
    var group = form.querySelector('.form-group[data-field="' + fieldName + '"]');
    if (group) {
      group.classList.add('has-error');
      if (focus) {
        var control = UI.$('.form-control', group);
        if (control) control.focus();
      }
    }
  }

  /**
   * 校验表单，返回 { ok, data }
   * data 为清洗后的字段（去除首尾空格）。
   */
  function validate(values) {
    var ok = true;
    var firstError = null;

    function check(field, cond) {
      if (!cond) {
        setError(field, firstError === null);
        if (firstError === null) firstError = field;
        ok = false;
      }
    }

    check('title', values.title.length >= 1 && values.title.length <= 30);
    check('category', values.category !== '');
    check('location', values.location.length >= 1 && values.location.length <= 50);

    // 时间：必填且不能晚于当前
    var timeOk = false;
    if (values.time) {
      var t = new Date(values.time);
      timeOk = !isNaN(t.getTime()) && t.getTime() <= Date.now();
    }
    check('time', timeOk);

    check('description', values.description.length >= 5 && values.description.length <= 300);
    check('contact', values.contact.length >= 4 && values.contact.length <= 50);
    check('publisher', values.publisher.length >= 1 && values.publisher.length <= 20);

    return { ok: ok };
  }

  /* ---------- 提交 ---------- */

  form.addEventListener('submit', function (e) {
    e.preventDefault();

    // 先清除旧错误态
    UI.$all('.form-group.has-error', form).forEach(function (g) {
      g.classList.remove('has-error');
    });

    var values = {
      type: typeInput.value,
      title: UI.$('#title').value.trim(),
      category: categorySelect.value,
      location: UI.$('#location').value.trim(),
      time: timeInput.value,
      description: UI.$('#description').value.trim(),
      contact: UI.$('#contact').value.trim(),
      publisher: UI.$('#publisher').value.trim()
    };

    var result = validate(values);
    if (!result.ok) {
      UI.toast('请检查表单中标红的项', 'error');
      return;
    }

    var record = Storage.addItem(values);
    UI.toast('🎉 发布成功');
    // 短暂延迟后跳转到发布成功页，让用户看到成功提示
    setTimeout(function () {
      location.href = 'success.html?id=' + encodeURIComponent(record.id);
    }, 600);
  });
})();
