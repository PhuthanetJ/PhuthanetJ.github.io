(function () {
    'use strict';
    if (!window.NT) return;
    const { q, esc } = NT;
    const listView = q('#wt-portal-path-management'), builder = q('#nt-view-builder'), footer = q('#wt-portal-builder-footer');
    const dialog = q('#wt-portal-path-dialog'), form = q('#wt-portal-path-form');

    function goConfigure(id) { location.href = 'portal-config.html?portal=' + encodeURIComponent(id); }
    function goList() { location.href = 'portal-config.html'; }

    function siteChoices(selected, owner) {
        const selectedSet = new Set(selected || []);
        q('#wt-portal-path-sites').innerHTML = NT.allowedSites().map(site => {
            const locked = owner === site.id;
            return '<label class="wt-portal-choice"><input type="checkbox" data-path-site="' + esc(site.id) + '"' +
                (selectedSet.has(site.id) ? ' checked' : '') + (locked ? ' disabled' : '') + '><span><strong>' + esc(site.name) +
                '</strong>' + (locked ? '<small>Site เจ้าของ Portal Path · ไม่สามารถนำออกได้</small>' : '') + '</span></label>';
        }).join('');
    }

    function openDialog(id) {
        const draft = id ? NT.db.configs[id] : null;
        q('#wt-portal-path-dialog-title').textContent = draft ? 'Edit Portal Path' : 'Add Portal Path';
        q('#wt-portal-path-id').value = id || '';
        q('#wt-portal-path-name').value = draft?.state.name || '';
        q('#wt-portal-path-value').value = draft?.state.path || '/portal/';
        const template = draft?.state.template || 'Template01';
        const templateEl = q('#wt-portal-path-template');
        templateEl.value = Array.from(templateEl.options).some(o => o.value === template) ? template : 'Custom';
        const owner = draft ? (draft.ownerSiteId || draft.bindings.siteIds[0]) : null;
        siteChoices(draft?.bindings.siteIds || [NT.currentSite], owner);
        q('#wt-portal-path-dialog-message').textContent = draft && !NT.portalPathChoices().find(row => row.id === id)?.manageable ? 'Portal Path นี้มี Site นอกสิทธิ์ของผู้ใช้ปัจจุบัน จึงแก้ไขไม่ได้' : '';
        q('#wt-portal-path-save').disabled = !!draft && !NT.portalPathChoices().find(row => row.id === id)?.manageable;
        dialog.showModal();
    }

    function render() {
        const rows = NT.portalPathChoices();
        q('#wt-portal-path-rows').innerHTML = rows.map(row => {
            const editDisabled = !NT.portalManagerAllowed() || !row.manageable;
            return '<tr><td><strong>' + esc(row.name) + '</strong></td><td><code>' + esc(row.path) + '</code></td><td>' + esc(row.template) +
                '</td><td class="wt-center"><button type="button" class="wt-count-link" data-configure="' + esc(row.id) + '" title="Configure Portal Path">' + row.siteCount +
                '</button></td><td><div class="wt-portal-actions"><button type="button" class="nt-button nt-compact primary" data-configure="' + esc(row.id) + '">Configure</button>' +
                '<button type="button" class="nt-button nt-compact" data-edit-path="' + esc(row.id) + '"' + (editDisabled ? ' disabled' : '') + '>Edit</button>' +
                '<button type="button" class="nt-button nt-compact danger" data-delete-path="' + esc(row.id) + '"' + (editDisabled ? ' disabled' : '') + '>Delete</button></div></td></tr>';
        }).join('');
        q('#wt-portal-path-empty').hidden = rows.length !== 0;
        q('#wt-portal-path-add').disabled = !NT.portalManagerAllowed();
        q('#wt-portal-path-message').textContent = rows.length + ' Portal Path ตามสิทธิ์';
    }

    const pageTitle = q('#wt-portal-page-title');
    const draftStatus = q('#nt-draft-status');
    if (NT.portalConfigMode === 'configure') {
        listView.hidden = true; builder.hidden = false; footer.hidden = false;
        pageTitle.textContent = 'Portal Configuration';
        document.title = 'Portal Configuration | Wi-Fi Tools';
        draftStatus.hidden = false;
        q('#wt-current-portal-name').textContent = NT.state.name;
        q('#wt-current-portal-path').textContent = NT.state.path + ' · ' + (NT.state.template || 'Custom') + ' · ' + NT.bindings().siteIds.length + ' Site';
        q('#wt-portal-path-back').addEventListener('click', goList);
    } else {
        listView.hidden = false; builder.hidden = true; footer.hidden = true;
        pageTitle.textContent = 'Portal Path Management';
        document.title = 'Portal Path Management | Wi-Fi Tools';
        draftStatus.textContent = '';
        draftStatus.hidden = true;
        render();
    }

    q('#wt-portal-path-add').addEventListener('click', () => openDialog(''));
    q('#wt-portal-path-cancel').addEventListener('click', () => dialog.close());
    q('#wt-portal-path-rows').addEventListener('click', event => {
        const configure = event.target.closest('[data-configure]'); if (configure) return goConfigure(configure.dataset.configure);
        const edit = event.target.closest('[data-edit-path]'); if (edit) return openDialog(edit.dataset.editPath);
        const del = event.target.closest('[data-delete-path]'); if (!del) return;
        const row = NT.portalPathChoices().find(item => item.id === del.dataset.deletePath); if (!row) return;
        const warning = row.siteCount > 0 ? 'Portal Path นี้มี ' + row.siteCount + ' Sites ผูกใช้งานอยู่ ต้องการลบต่อหรือไม่?' : 'ต้องการลบ Portal Path นี้หรือไม่?';
        if (!confirm(warning)) return;
        try { NT.deletePortalPath(row.id); render(); NT.toast('ลบ Portal Path แล้ว'); } catch (error) { NT.toast(error.message); q('#wt-portal-path-message').textContent = error.message; }
    });
    form.addEventListener('submit', event => {
        event.preventDefault();
        const id = q('#wt-portal-path-id').value;
        const siteIds = Array.from(document.querySelectorAll('[data-path-site]')).filter(el => el.checked || el.disabled && el.checked).map(el => el.dataset.pathSite);
        const value = { name: q('#wt-portal-path-name').value, path: q('#wt-portal-path-value').value, template: q('#wt-portal-path-template').value, siteIds };
        try {
            if (id) NT.updatePortalPath(id, value); else NT.createPortalPath(value);
            dialog.close(); render(); NT.toast(id ? 'แก้ไข Portal Path แล้ว' : 'เพิ่ม Portal Path แล้ว');
        } catch (error) { q('#wt-portal-path-dialog-message').textContent = error.message; }
    });
})();
