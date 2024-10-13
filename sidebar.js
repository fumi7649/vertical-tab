document.addEventListener('DOMContentLoaded', function () {
    const tabContainer = document.getElementById('tabContainer');
    const searchBox = document.getElementById('searchBox');
    const googleSearch = document.getElementById('googleSearch');

    let allTabs = [];
    let allGroups = [];

    // Google検索を実行する関数
    function searchGoogle(query) {
        const googleSearchUrl = `https://www.google.com/search?q=${encodeURIComponent(query)}`;
        window.open(googleSearchUrl, '_blank'); // 新しいタブでGoogle検索結果を開く
    }

    // 検索ボタンがクリックされたとき
    googleSearch.addEventListener('keypress', function (e) {
        if (e.key === 'Enter') {
            const query = googleSearch.value.trim();
            if (query) {
                searchGoogle(query);
            }
        }
    });

    function createAndAppendTabElement(tabs, container, group) {
        const collapse = document.createElement('div');
        collapse.classList.add('accordion-collapse', 'collapse');
        collapse.id = "collapseGroup" + group.id;

        tabs.forEach((tab) => {
            const tabElement = document.createElement('a');
            tabElement.classList.add('list-group-item', 'list-group-item-action', 'd-flex', 'tab-item', 'tab');

            tabElement.href = "#";
            tabElement.draggable = true;
            tabElement.dataset.index = tab.index;
            tabElement.addEventListener('click', () => {
                chrome.tabs.update(tab.id, { active: true });
            });

            // ドラッグ・アンド・ドロップ機能
            tabElement.addEventListener('dragstart', (e) => {
                e.dataTransfer.setData('text/plain', tab.index);
            });

            tabElement.addEventListener('dragover', (e) => {
                e.preventDefault(); // デフォルトの動作を無効化
            });

            tabElement.addEventListener('drop', (e) => {
                e.preventDefault();
                const draggedIndex = e.dataTransfer.getData('text/plain'); // ドラッグされたタブのインデックスを取得
                const targetIndex = tabElement.dataset.index; // ドロップされたタブのインデックスを取得

                // タブのインデックスを更新
                moveTab(draggedIndex, targetIndex);
            });

            const favIcon = document.createElement('img');
            favIcon.src = tab.favIconUrl || 'default_icon.png';
            favIcon.alt = tab.title;
            favIcon.classList.add('favicon');

            const tabTitle = document.createElement('span');
            tabTitle.textContent = tab.title;
            tabTitle.classList.add('ml-2');

            const deleteIcon = document.createElement('img');
            deleteIcon.classList.add('delete-icon');
            deleteIcon.src = './img/trash.svg';
            const deleteButton = document.createElement('button');
            deleteButton.classList.add('btn', 'delete-btn');
            deleteButton.appendChild(deleteIcon);
            deleteButton.addEventListener('click', (e) => {
                e.stopPropagation();
                chrome.tabs.remove(tab.id);
                tabElement.remove();
            });

            tabElement.appendChild(favIcon);
            tabElement.appendChild(tabTitle);
            tabElement.appendChild(deleteButton);
            if (group) {
                const body = document.createElement('div');
                body.classList.add('accordion-body');
                body.appendChild(tabElement);
                collapse.appendChild(body);
            } else {
                collapse.appendChild(tabElement);
            }
        });
        container.appendChild(collapse);
    }

    function createAccordionItem(group, tabs, groupContainer) {
        const accordionItem = document.createElement('div');
        accordionItem.classList.add('accordion-item');
        const accordionHeader = document.createElement('h2');
        accordionHeader.classList.add('accordion-header');

        const button = document.createElement('button');
        button.classList.add('accordion-button');
        button.setAttribute('type', 'button');
        button.setAttribute('data-bs-toggle', "collapse");
        button.setAttribute('data-bs-target', "#collapseGroup" + group.id); // 修正: IDを正しく参照
        button.setAttribute('aria-expanded', 'true');
        button.setAttribute('aria-controls', "collapseGroup" + group.id); // 修正: IDを正しく参照
        button.textContent = group.title;
        button.style.color = group.color;

        button.dataset.groupId = group.id;

        button.addEventListener('click', function () {
            const groupId = parseInt(this.dataset.groupId, 10);
            const isAriaExpanded = this.getAttribute('aria-expanded');
            // 同じgroupIdのタブのみをアクティブにする
            if (groupId) {
                if (isAriaExpanded === "true") {
                    chrome.tabGroups.update(groupId, { "collapsed": false });
                } else {
                    chrome.tabGroups.update(groupId, { "collapsed": true });
                }
            }
        });

        accordionHeader.appendChild(button);
        accordionItem.appendChild(accordionHeader);

        createAndAppendTabElement(tabs, accordionItem, group);
        groupContainer.appendChild(accordionItem);
    }

    function displayTabs(groups, tabs) {
        tabContainer.innerHTML = '';

        const groupContainer = document.createElement('div');
        groupContainer.classList.add('accordion');
        groupContainer.id = 'tabGroup';

        if (groups.length > 0) {
            groups.forEach((group) => {
                const groupTabs = tabs.filter((tab) => tab.groupId === group.id);
                createAccordionItem(group, groupTabs, groupContainer);
            });
        }

        const ungroupedTabs = tabs.filter(tab => tab.groupId === -1);
        if (ungroupedTabs.length > 0) {
            createAccordionItem({ "title": "Ungroup", "id": "ungroup" }, ungroupedTabs, groupContainer);
        }
        tabContainer.appendChild(groupContainer);
    }

    // TODO タブ検索するときはmodalかなんかでpickupしたい
    searchBox.addEventListener('input', function () {
        const searchTerm = searchBox.value.toLowerCase();
        const filteredTabs = allTabs.filter(tab => tab.title.toLowerCase().includes(searchTerm));
        displayTabs(allGroups, filteredTabs);
    });

    function displayTabsForCurrentWindow() {
        chrome.windows.getCurrent({}, function (currentWindow) {
            chrome.tabs.query({ windowId: currentWindow.id }, function (tabs) {
                allTabs = tabs;
                chrome.runtime.sendMessage({ action: 'getTabGroups', windowId: currentWindow.id }, function (response) {
                    allGroups = response.groups;
                    console.log(tabs);
                    displayTabs(allGroups, tabs);
                });
            });
        });
    }

    function moveTab(draggedIndex, targetIndex, groupId) {
        draggedIndex = parseInt(draggedIndex);
        targetIndex = parseInt(targetIndex);

        // draggedIndex と targetIndex をタブのIDに変換
        const draggedTab = allTabs.find(tab => tab.index === draggedIndex);
        const targetTab = allTabs.find(tab => tab.index === targetIndex);

        if (draggedTab && targetTab && draggedTab.id !== targetTab.id) {
            chrome.tabs.move(draggedTab.id, { index: targetTab.index }, function () {
                displayTabsForCurrentWindow();
            });
        }
    }



    chrome.windows.getCurrent({}, function (currentWindow) {
        chrome.tabs.query({ windowId: currentWindow.id }, function (tabs) {
            allTabs = tabs;
            chrome.runtime.sendMessage({ action: 'getTabGroups', windowId: currentWindow.id }, function (response) {
                allGroups = response.groups;
                console.log(tabs);
                displayTabs(allGroups, tabs);
            });
        });
    });

    chrome.tabs.onMoved.addListener(function () {
        location.reload();
    });
});
