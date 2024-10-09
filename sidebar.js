document.addEventListener('DOMContentLoaded', function () {
    const tabContainer = document.getElementById('tabContainer');
    const searchBox = document.getElementById('searchBox');
    const googleSearch = document.getElementById('googleSearch');

    let allTabs = [];

    // Google検索を実行する関数
    function searchGoogle(query) {
        const googleSearchUrl = `https://www.google.com/search?q=${encodeURIComponent(query)}`;
        window.open(googleSearchUrl, '_blank'); // 新しいタブでGoogle検索結果を開く
    }

    // 検索ボタンがクリックされたとき

    // Enterキーが押されたときにGoogle検索を実行
    googleSearch.addEventListener('keypress', function (e) {
        if (e.key === 'Enter') {
            const query = googleSearch.value.trim();
            if (query) {
                searchGoogle(query);
            }
        }
    });
    // タブを取得して一覧に表示する関数
    function displayTabs(tabs) {
        tabContainer.innerHTML = '';
        tabs.forEach((tab, index) => {
            const tabElement = document.createElement('a');
            tabElement.classList.add('list-group-item', 'list-group-item-action', 'd-flex', 'align-items-center', 'tab-item');
            tabElement.href = "#";
            tabElement.draggable = true;
            tabElement.dataset.index = index;
            tabElement.addEventListener('click', () => {
                chrome.tabs.update(tab.id, { active: true });
            });
            // moveTab
            tabElement.addEventListener('dragstart', (e) => {
                e.dataTransfer.setData('text/plain', index); // ドラッグされたタブのインデックスを保持
            });

            // ドロップ時のイベント
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

            // タブのタイトル
            const tabTitle = document.createElement('span');
            tabTitle.textContent = tab.title;
            tabTitle.classList.add('ml-2');

            // 削除ボタン[
            const deleteIcon = document.createElement('img');
            deleteIcon.classList.add('delete-icon');
            deleteIcon.src = './img/trash.svg';
            const deleteButton = document.createElement('button');
            deleteButton.classList.add('btn', 'delete-btn', 'ml-auto')
            deleteButton.appendChild(deleteIcon);
            deleteButton.c
            deleteButton.addEventListener('click', (e) => {
                e.stopPropagation();
                chrome.tabs.remove(tab.id);
                tabElement.remove();
            });


            tabElement.appendChild(favIcon);
            tabElement.appendChild(tabTitle);
            tabElement.appendChild(deleteButton);

            // タブコンテナにタブ要素を追加
            tabContainer.appendChild(tabElement);
        });
    }

    // 初回に全タブを取得して表示
    chrome.windows.getCurrent({}, function (currentWindow) {
        chrome.tabs.query({ windowId: currentWindow.id }, function (tabs) {
            allTabs = tabs;
            displayTabs(allTabs);
        });
    });

    // 検索ボックスに入力があった場合のフィルタリング処理
    searchBox.addEventListener('input', function () {
        const searchTerm = searchBox.value.toLowerCase();
        const filteredTabs = allTabs.filter(tab => tab.title.toLowerCase().includes(searchTerm));
        displayTabs(filteredTabs);
    });

    function moveTab(draggedIndex, targetIndex) {
        draggedIndex = parseInt(draggedIndex);
        targetIndex = parseInt(targetIndex);

        if (draggedIndex !== targetIndex) {
            chrome.tabs.move(allTabs[draggedIndex].id, { index: targetIndex }, function () {
                // タブの並び順が変更されたら再描画
                displayTabsForCurrentWindow();
            });
        }
    }
    
    chrome.tabs.onMoved.addListener(function () {
        location.reload(); // 拡張機能のポップアップをリロード
      });
});
